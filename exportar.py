"""Vuelca la BD al JSON que consume la web.

    python exportar.py     ->  web/src/datos/dataset.json

La web es estatica: en build no toca la BD, solo este fichero. Asi el sitio se puede
construir y desplegar sin llevarse el .sqlite a ninguna parte.
"""

import hashlib
import json
import sys
import re
import unicodedata
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

from urllib.parse import urlencode, urlparse, urlunparse, parse_qsl

import categorias
from data.db import connect
from scoring import config as cfg
from scoring.motor import precio_referencia, sellos_de

AFILIADOS_PATH = Path(__file__).with_name("data") / "afiliados.json"

SALIDA = Path(__file__).with_name("web") / "src" / "datos" / "dataset.json"

NIVELES = {
    4: {"nombre": "Certificacion de un tercero",
        "detalle": "El sello lo respalda alguien que no es la marca. O lo hemos comprobado "
                   "en la fuente que lo emite (codigo QS de Creapure, lote en la lista de "
                   "Informed Sport), o el producto lleva en el nombre una marca que no se "
                   "puede usar sin un tercero detras: Creapure, que exige contrato de "
                   "licencia con el fabricante del activo, o IFOS, que analiza el lote en un "
                   "laboratorio independiente. En la ficha de cada producto se ve cual de "
                   "las dos cosas es y con que fecha."},
    3: {"nombre": "Analisis publicado por la marca",
        "detalle": "La propia marca publica un analisis de laboratorio. Lo aporta la "
                   "parte interesada, asi que vale menos que un tercero independiente."},
    2: {"nombre": "Declarado en la ficha",
        "detalle": "El sello aparece en la ficha o la etiqueta, sin forma de comprobarlo."},
    1: {"nombre": "Sin certificacion",
        "detalle": "No consta ninguna certificacion."},
}


def slug(texto):
    t = unicodedata.normalize("NFKD", texto.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", t)).strip("-")[:70]

def desambiguar_slugs(productos):
    """Dos fichas no pueden compartir URL.

    Myprotein lista el mismo producto y el mismo formato a varios precios (los sabores
    no valen todos lo mismo) y `agrupar_sabores` no los junta porque el precio forma
    parte de su clave, con razon. Pero el slug se hace de marca+nombre+tienda, asi que
    esos productos escribian el mismo fichero: se publicaba uno y los demas enlazaban a
    una ficha con otro precio. Eran 9 URLs y 19 productos.

    El desempate sale del hash de la URL de la tienda y no del orden de la lista: un
    slug que baila entre pasadas pierde en Google lo que hubiera ganado. Los que no
    colisionan no se tocan.
    """
    cuenta = Counter(p["slug"] for p in productos)
    for p in productos:
        if cuenta[p["slug"]] > 1:
            firma = hashlib.sha1(p["url"].encode("utf-8")).hexdigest()[:6]
            p["slug"] = "%s-%s" % (p["slug"], firma)
    return productos


def web_slug(categoria):
    """La clave interna con guiones bajos, pasada a URL con guiones.

    Google no parte palabras en "_": /proteina_whey es un token unico y
    /proteina-whey son dos palabras. La clave de Python no se toca (la usan la BD, el
    scraper y el motor); solo cambia el slug que ve la web.
    """
    return categoria.replace("_", "-")


def seo(categoria):
    """Lo que la web necesita de una categoria para escribir su copy sola.

    No hay prosa fija: la pagina recibe el termino, las consultas objetivo y la clave
    de dosis, y redacta la respuesta con los precios del dia. Ver SEO-PRODUCTOS.md.
    """
    cfg = categorias.config(categoria)
    ings = cfg.get("ingredientes")
    # De que ingrediente se puede citar una dosis para toda la categoria: el activo del
    # modo simple, o el unico ingrediente que puntua en una formula (omega 3). Una
    # formula con varios (preentreno) o con ninguno (multivitaminicos) no tiene una
    # dosis de categoria, y no se inventa.
    dosis_key = cfg.get("activo") or (ings[0] if ings and len(ings) == 1 else None)
    return {"termino": cfg.get("termino", categorias.nombre(categoria).lower()),
            "mejor": cfg.get("mejor", "el mejor " + categoria),
            "consultas": cfg.get("consultas", {}),
            "dosis_key": dosis_key}


def enlace_afiliado(tienda, url, mapa):
    """URL de la tienda con los parametros de afiliado, o None si no hay programa.

    Se aplica AQUI, al exportar, cuando el ranking ya esta calculado y cerrado. El
    motor de scoring no conoce este fichero: no puede leerlo aunque quisiera.
    """
    params = (mapa.get(tienda) or {}).get("parametros") or {}
    if not params:
        return None
    partes = urlparse(url)
    query = dict(parse_qsl(partes.query))
    query.update(params)
    return urlunparse(partes._replace(query=urlencode(query)))


def aplicar_afiliados(productos, mapa):
    """Anade url_afiliado sin tocar el orden ni ningun score. Devuelve la misma lista."""
    for p in productos:
        p["url_afiliado"] = enlace_afiliado(p["tienda"], p["url"], mapa)
    return productos


def asignar_sellos(productos):
    mejor = {}
    for p in productos:
        c = p["categoria"]
        if p["score_final"] is not None:
            mejor[c] = max(mejor.get(c, 0), p["score_final"])
    for p in productos:
        p["sellos"] = sellos_de(p, mejor.get(p["categoria"]))
    return productos


def agrupar_sabores(productos):
    """Colapsa las variantes de sabor de un mismo producto en una fila.

    Regla: misma tienda, marca, formato, forma Y MISMO PRECIO es el mismo producto en
    distintos sabores (asi lo listan Myprotein o Prozis). Sin esto la tabla ensena ocho
    filas identicas y el ranking parece amanado.
    ponytail: si algun dia dos productos distintos coinciden en las cinco cosas, se
    fusionarian mal; entonces habra que comparar tambien el nombre sin el sabor.
    El nombre solo pierde el sabor cuando sin el sigue siendo unico: ver abajo.
    """
    grupos = {}
    for p in productos:
        clave = (p["tienda"], p["marca"], p["formato_gramos"], p["unidades"],
                 p["forma"], p["precio_eur"], p["categoria"])
        grupos.setdefault(clave, []).append(p)

    fuera = []
    for miembros in grupos.values():
        # Se queda el de mejor score; los demas solo aportan su sabor.
        miembros.sort(key=lambda p: -(p["score_final"] or 0))
        principal = dict(miembros[0])
        if len(miembros) > 1:
            principal["_sin_sabor"] = re.split(r"\s+[-–]\s+", principal["nombre"])[0].strip()
            principal["sabores"] = len(miembros)
        fuera.append(principal)

    # El sabor solo se quita del nombre si el producto sigue siendo unico sin el.
    # Myprotein vende el mismo producto y formato a dos precios (el sin sabor sale mas
    # barato que el de chocolate), y son dos grupos distintos porque el precio esta en
    # la clave. Quitarles el sabor a los dos dejaba dos filas llamadas igual, con dos
    # precios y sin forma de saber en que se diferencian, y con el mismo slug: una se
    # publicaba y la otra enlazaba a la ficha equivocada. Eran 9 URLs y 19 productos.
    identidad = lambda p: (p["tienda"], p["marca"], p.get("_sin_sabor") or p["nombre"],
                           p["formato_gramos"], p["unidades"], p["forma"], p["categoria"])
    claves = [identidad(p) for p in fuera]
    cuenta = Counter(claves)
    for principal, clave in zip(fuera, claves):
        sin_sabor = principal.pop("_sin_sabor", None)
        if sin_sabor and cuenta[clave] == 1:
            principal["nombre"] = sin_sabor
            principal["slug"] = "%s-%s-%s" % (slug(principal["marca"]),
                                              slug(sin_sabor), principal["tienda"])
    # Misma tienda, mismo nombre y mismo formato es el mismo bote, aunque la tienda lo
    # tenga dos veces en su catalogo a dos precios: Life Pro lista su glutamina en
    # "lifepro-glutamine-500g" y en "life-pro-glutamine-500g" con 90 centimos de
    # diferencia. Dos filas del mismo producto en la misma tabla no son una comparativa,
    # y ademas son dos fichas casi identicas. Se queda el mas barato, que es el precio
    # que puede pagar quien lee. Va despues del pase de sabores: los sabores que se
    # quedaron con su nombre completo ya no coinciden en nombre y no se tocan.
    # El nombre se compara RECORTADO a lo que se llega a ver (el titulo de la ficha se
    # corta a 78 caracteres). En Amazon el mismo bote aparece bajo dos ASIN de dos
    # vendedores con titulos que solo se diferencian en la cola de marketing: para quien
    # lee son dos filas identicas con dos precios, y para Google dos paginas con el mismo
    # titulo compitiendo entre ellas. El formato sigue en la clave, asi que dos tamanos
    # distintos del mismo producto NO se funden.
    unicos = {}
    for principal in fuera:
        clave = (principal["tienda"], principal["marca"], principal["nombre"][:78],
                 principal["formato_gramos"], principal["unidades"],
                 principal["forma"], principal["categoria"])
        previo = unicos.get(clave)
        if previo is None or (principal["precio_eur"] or 1e9) < (previo["precio_eur"] or 1e9):
            unicos[clave] = principal
    fuera = list(unicos.values())

    # Desempate por coste y precio: en una categoria que nadie documenta lo bastante
    # como para puntuarla, el orden por score seria el orden en que salio de la BD.
    fuera.sort(key=lambda p: (-(p["score_final"] or -1),
                             p["precio_referencia"] or 1e9))
    return fuera


def historicos(con, dias=180):
    """{id: {min, max, n, desde, serie}} con la serie de precios de cada producto.

    La serie guarda solo los DIAS EN QUE EL PRECIO CAMBIA, no uno por dia: un precio que
    no se mueve en tres semanas son 21 puntos identicos que pesan en el JSON de la web y
    que la grafica pinta igual como un escalon. Con eso, medio ano de historia de 2.700
    productos cabe en unas decenas de kilobytes en vez de en cinco megas.

    Se exporta solo lo que tiene dos apuntes o mas: con uno no hay historia que contar y
    ensenar "minimo historico" el primer dia seria decir que el precio de hoy es el mejor
    de la historia, que es verdad y no significa nada.
    """
    corte = (date.today() - timedelta(days=dias)).isoformat()
    fuera = {}
    for fila in con.execute(
            "SELECT producto_id, fecha, precio_eur FROM precio_historico "
            "WHERE fecha >= ? ORDER BY producto_id, fecha", (corte,)):
        pid, fecha, precio = fila["producto_id"], fila["fecha"], fila["precio_eur"]
        h = fuera.setdefault(pid, {"min": precio, "max": precio, "n": 0,
                                   "desde": fecha, "serie": []})
        h["n"] += 1
        h["min"] = min(h["min"], precio)
        h["max"] = max(h["max"], precio)
        if not h["serie"] or h["serie"][-1][1] != precio:
            h["serie"].append([fecha, precio])
    return {pid: h for pid, h in fuera.items() if h["n"] >= 2}


def exportar(con):
    dosis = {r["ingrediente"]: dict(r, fuentes=json.loads(r["fuentes"]))
             for r in con.execute("SELECT * FROM dosis_referencia")}
    historia = historicos(con)

    productos = []
    for p in con.execute(
            "SELECT p.*, s.score_final, s.score_calidad, s.coste_por_dosis_efectiva,"
            " s.flag_infradosaje, s.desglose FROM producto p "
            "LEFT JOIN score s ON s.producto_id = p.id ORDER BY s.score_final DESC"):
        certs = [dict(r) for r in con.execute(
            "SELECT tipo, nivel_verificacion, codigo_qs, url_evidencia, verificado_fecha,"
            " verificado_por FROM certificacion WHERE producto_id=? "
            "ORDER BY nivel_verificacion DESC", (p["id"],))]
        ingredientes = []
        for r in con.execute("SELECT ingrediente, dosis_por_servicio_mg FROM "
                             "ingrediente_producto WHERE producto_id=?", (p["id"],)):
            ref = dosis.get(r["ingrediente"])
            ingredientes.append({
                "ingrediente": r["ingrediente"],
                "dosis_por_servicio_mg": r["dosis_por_servicio_mg"],
                "referencia": {k: ref[k] for k in
                               ("dosis_efectiva_min_mg", "dosis_efectiva_max_mg",
                                "pureza_tipica", "forma_preferida", "nivel_evidencia",
                                "fuentes")} if ref else None,
            })
        precio, unidad = precio_referencia(dict(p))
        productos.append({
            "id": p["id"],
            "slug": "%s-%s-%s" % (slug(p["marca"]), slug(p["nombre"]), p["tienda"]),
            "marca": p["marca"], "nombre": p["nombre"], "categoria": p["categoria"],
            "tienda": p["tienda"], "url": p["url"], "imagen": p["imagen"],
            "formato_gramos": p["formato_gramos"], "unidades": p["unidades"],
            "precio_eur": p["precio_eur"],
            # El omega 3 y los multivitaminicos no tienen precio por kilo que ensenar:
            # su comparacion honesta es por capsula.
            "precio_por_kg": round(p["precio_por_kg"], 2) if p["precio_por_kg"] else None,
            "precio_por_unidad": (round(p["precio_por_unidad"], 3)
                                  if p["precio_por_unidad"] else None),
            # El precio con el que se compara y se puntua, con su unidad al lado: el
            # numero solo no dice nada si no sabes si son euros por kilo o por capsula.
            "precio_referencia": round(precio, 3) if precio else None,
            "unidad_precio": unidad,
            "servicios_por_envase": p["servicios_por_envase"], "forma": p["forma"],
            "fecha_scrape": p["fecha_scrape"],
            "score_final": p["score_final"], "score_calidad": p["score_calidad"],
            "coste_por_dosis_efectiva": p["coste_por_dosis_efectiva"],
            "flag_infradosaje": bool(p["flag_infradosaje"]),
            "desglose": json.loads(p["desglose"]) if p["desglose"] else [],
            "nivel_verificacion": max([c["nivel_verificacion"] for c in certs], default=1),
            "certificaciones": certs,
            "ingredientes": ingredientes,
            # None mientras no haya dos dias de historia. La ficha lo comprueba antes de
            # pintar nada: el primer dia no hay grafica, y eso es lo correcto.
            "historico": historia.get(p["id"]),
        })

    productos = agrupar_sabores(productos)
    mapa = json.loads(AFILIADOS_PATH.read_text(encoding="utf-8"))["tiendas"]
    productos = asignar_sellos(aplicar_afiliados(productos, mapa))
    productos = desambiguar_slugs(productos)
    categorias_slug = sorted({p["categoria"] for p in productos})
    # La metodologia publicada se genera desde la misma config que puntua: si cambias
    # un peso, la pagina /metodologia cambia sola. Documentacion que no puede mentir.
    configuracion = {
        "peso_calidad": cfg.PESO_CALIDAD, "peso_coste": cfg.PESO_COSTE,
        "factor_verificacion": cfg.FACTOR_VERIFICACION,
        "factor_forma_preferida": cfg.FACTOR_FORMA_PREFERIDA,
        "factor_forma_alternativa": cfg.FACTOR_FORMA_ALTERNATIVA,
        "factor_forma_desconocida": cfg.FACTOR_FORMA_DESCONOCIDA,
        "umbral_infradosaje": cfg.UMBRAL_INFRADOSAJE,
        "penalizacion_infradosaje": cfg.PENALIZACION_INFRADOSAJE,
    }
    datos = {
        "config": dict(configuracion,
                       umbral_sello_calidad_precio=cfg.UMBRAL_SELLO_CALIDAD_PRECIO,
                       nivel_sello_verificado=cfg.NIVEL_SELLO_VERIFICADO),
        "generado": max([p["fecha_scrape"] for p in productos], default=None),
        # Si no hay ni un enlace de afiliado, la web no ensena el aviso de afiliacion:
        # advertir de comisiones que no existen es tan falso como callarse las que si.
        # Lo miran tres sitios (el componente Aviso, /metodologia y /legal) y ninguno
        # lo decide por su cuenta.
        "hay_afiliados": any(p.get("url_afiliado") for p in productos),
        "categorias": [{"slug": web_slug(c), "nombre": categorias.nombre(c), **seo(c),
                        "productos": sum(1 for p in productos if p["categoria"] == c),
                        # Hay categorias donde ninguna tienda publica las dosis
                        # (multivitaminicos): se comparan igual por precio y certificacion,
                        # pero la pagina avisa de que de su formula no se afirma nada.
                        "con_dosis": any(p["categoria"] == c and p["coste_por_dosis_efectiva"]
                                         for p in productos),
                        "unidad_precio": next((p["unidad_precio"] for p in productos
                                               if p["categoria"] == c and p["unidad_precio"]),
                                              "kg")}
                       for c in categorias_slug],
        "niveles": NIVELES,
        "dosis_referencia": dosis,
        "productos": productos,
    }
    # Ultimo paso: los productos apuntan al slug de la web, no a la clave interna.
    for prod in productos:
        prod["categoria"] = web_slug(prod["categoria"])
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(json.dumps(datos, ensure_ascii=False, indent=1), encoding="utf-8")
    return len(productos), categorias_slug


if __name__ == "__main__":
    # Windows abre la consola en cp1252 y un nombre de producto con un caracter que
    # no sabe pintar (Amazon usa "≥" en los titulos) reventaba la pasada entera
    # con UnicodeEncodeError, despues de haber hecho el trabajo. Que pinte como pueda.
    sys.stdout.reconfigure(errors="replace")
    n, cats = exportar(connect())
    print("%d productos exportados (%s) -> %s" % (n, ", ".join(cats), SALIDA))
