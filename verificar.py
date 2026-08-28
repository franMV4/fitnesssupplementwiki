"""Capa de verificacion de certificaciones: convierte "sello mencionado" en "sello
verificado", o deja claro que no se puede.

    python verificar.py auto                     # lo que SI se puede cruzar solo
    python verificar.py pendientes               # cola de curacion manual
    python verificar.py qs <producto_id> <codigo>        # Creapure, tras mirarlo en creapure.com
    python verificar.py analisis <producto_id> <url>     # analisis publicado por la marca
    python verificar.py bajar <producto_id> <tipo>       # deshacer: vuelve a nivel 2

Que se puede automatizar y que no (esto no es pereza, es como funciona cada sello):

- Creapure: hay dos caminos al nivel 4. El codigo QS de 6 digitos IMPRESO EN EL ENVASE
  fisico, que se comprueba en creapure.com, no esta en la ficha de ninguna tienda y va
  por curacion manual (`verificar.py qs`). Y el automatico: "Creapure" es marca registrada
  de Alzchem que solo se puede usar bajo licencia, asi que ponerla en el NOMBRE del
  producto es una declaracion que obliga a la marca y que la tienda firma en su catalogo.
  En el nombre, nunca en la descripcion (ver promover_marcas_licenciadas). El desglose del
  score distingue los dos casos; el nivel es el mismo por decision del dueno del proyecto.
- Informed Sport / Informed Choice: publican una lista de productos certificados
  consultable. Se descarga y se cruza. Solo sube a nivel 4 si el nombre certificado
  encaja de forma estricta; en la duda, se queda en 2 y sale en 'pendientes'.
- IFOS: su buscador es una app JS sin listado estatico. Curacion manual.
- Analisis de laboratorio publicados por la propia marca (el caso Life Pro): son
  nivel 3, nunca 4. Los aporta la parte interesada. Se detectan los PDF enlazados en
  la propia ficha y se guardan con su url_evidencia.
"""

import argparse
import re
import sys
import unicodedata
from datetime import date
from urllib.parse import urlparse

from data.db import connect
from scoring.config import NIVEL_MARCA_LICENCIADA
from scraper.core import CACHE_DIR, fetch

LISTAS_PUBLICAS = {
    "informed_sport": "https://www.informed-sport.com/certified-products",
    "informed_choice": "https://www.informed-choice.org/certified-products",
}

# Palabras que aparecen en casi todos los nombres y no prueban que sea el mismo producto.
GENERICAS = {"creatine", "creatina", "powder", "polvo", "monohydrate", "monohidrato",
             "unflavoured", "sabor", "the", "de", "en", "100", "pure", "nutrition"}


def normaliza(texto):
    t = unicodedata.normalize("NFKD", (texto or "").lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return [p for p in re.split(r"[^a-z0-9]+", t) if p]


def _titulos_certificados(html):
    return re.findall(r'views-field-title"><span class="field-content">(.*?)</span>', html)


def cruzar_listas(con):
    """Sube a nivel 4 solo si el nombre certificado encaja token a token."""
    hoy = date.today().isoformat()
    subidos = 0
    for tipo, url in LISTAS_PUBLICAS.items():
        try:
            html = fetch(url)
        except Exception as e:
            print("  %s: lista no accesible (%s). Queda en curacion manual." % (tipo, e))
            continue
        certificados = [set(normaliza(t)) for t in _titulos_certificados(html)]
        print("  %s: %d productos en la lista publica" % (tipo, len(certificados)))
        if not certificados:
            continue

        filas = con.execute(
            "SELECT c.id, c.producto_id, p.marca, p.nombre FROM certificacion c "
            "JOIN producto p ON p.id = c.producto_id "
            "WHERE c.tipo=? AND c.nivel_verificacion < 4", (tipo,)).fetchall()
        for f in filas:
            mios = set(normaliza(f["marca"] + " " + f["nombre"]))
            for cert in certificados:
                clave = cert - GENERICAS
                if clave and clave <= mios and len(clave) >= 2:
                    con.execute(
                        "UPDATE certificacion SET nivel_verificacion=4, url_evidencia=?, "
                        "verificado_fecha=?, verificado_por='auto' WHERE id=?",
                        (url, hoy, f["id"]))
                    print("    nivel 4: %s %s" % (f["marca"], f["nombre"]))
                    subidos += 1
                    break
    con.commit()
    return subidos


# Comillas simples ademas de dobles. El editor WYSIWYG de HSN emite href='...' y el
# analisis de pureza DEL PRODUCTO sale justo asi, mientras que los certificados de
# fabrica de la plantilla van con comillas dobles: aceptar solo dobles dejaba fuera
# exactamente el unico PDF que aqui cuenta.
PDF_ANALISIS = re.compile(
    r"""href=("|')([^"']+\.pdf)\1""", re.I)
# Palabras completas: "lab" suelto casaba dentro de "labelling" y colaba la guia de
# tolerancias de etiquetado de la UE como si fuera un analisis de laboratorio de la marca.
PISTA_ANALISIS = re.compile(
    r"analisis|analysis|certificad|certificate|\bcoa\b|informe|lab[_-]?report", re.I)
# Certificados de FABRICA (la planta cumple una norma de calidad), no de este producto.
# HSN enlaza su IFS Food en todas las fichas: casaba con "certificate" y colaba como si
# fuera un analisis del bote. Que la fabrica este auditada no dice que ESTE bote lleve
# lo que pone en la etiqueta, que es lo unico que aqui se puntua.
CERTIFICADO_DE_FABRICA = re.compile(
    r"ifs[-_ ]?food|\biso[-_ ]?\d|\bgmp\b|h?accp|\bbrc\b|renewal|instalacion", re.I)
# Un analisis vale para un producto y sus formatos, no para el catalogo entero. Si el
# mismo PDF cuelga de mas fichas distintas que esto, es firma de pie de pagina.
MAX_FICHAS_POR_ANALISIS = 3


def _dominio(url):
    return urlparse(url).netloc.lower().removeprefix("www.")


def mismo_dominio(pdf, ficha):
    """Un analisis que aporta la marca lo publica ella o su tienda, no un tercero.

    Un PDF de europa.eu enlazado en el pie de la ficha no dice nada de este producto.
    Si la marca lo aloja en un dominio propio distinto, esto lo rechaza y se queda en
    nivel 2: en la duda no se sube, que es la regla de toda la verificacion.
    """
    host = _dominio(pdf)
    base = _dominio(ficha)
    return not host or host == base or host.endswith("." + base)


def candidatos_analisis(html, url_ficha):
    """PDFs de la ficha que pueden ser un analisis de laboratorio de ESTE producto."""
    return [u for _comilla, u in PDF_ANALISIS.findall(html)
            if PISTA_ANALISIS.search(u)
            and not CERTIFICADO_DE_FABRICA.search(u)
            and mismo_dominio(u, url_ficha)]


def detectar_analisis_de_marca(con):
    """Nivel 3: PDFs de analisis enlazados en la propia ficha. Los publica la marca."""
    hoy = date.today().isoformat()
    nuevos, retirados = 0, 0
    fichas = con.execute("SELECT id, url, marca, nombre FROM producto").fetchall()

    # Primera pasada: cuantas fichas DISTINTAS enlazan cada PDF. Los formatos de un mismo
    # producto comparten url base, asi que no inflan la cuenta; un PDF que cuelga de medio
    # catalogo si, y ese no es evidencia de nada en particular.
    por_pdf, encontrados = {}, {}
    for p in fichas:
        cache = CACHE_DIR / (__import__("hashlib").sha1(
            p["url"].split("?")[0].encode()).hexdigest() + ".html")
        if not cache.exists():
            continue
        encontrados[p["id"]] = candidatos_analisis(cache.read_text(encoding="utf-8"), p["url"])
        for u in set(encontrados[p["id"]]):
            por_pdf.setdefault(u, set()).add(p["url"].split("?")[0])

    for p in fichas:
        if p["id"] not in encontrados:
            continue
        pdfs = [u for u in encontrados[p["id"]]
                if len(por_pdf[u]) <= MAX_FICHAS_POR_ANALISIS]
        if not pdfs:
            # La ficha no publica ningun analisis: si teniamos uno puesto por una version
            # peor de esta deteccion, se retira. Un sello mal puesto no puede sobrevivir a
            # que arreglemos la regla. Lo curado a mano no se toca.
            retirados += con.execute(
                "DELETE FROM certificacion WHERE producto_id=? AND tipo='analisis_marca'"
                " AND verificado_por='auto'", (p["id"],)).rowcount
            continue
        con.execute(
            "INSERT INTO certificacion (producto_id, tipo, nivel_verificacion, url_evidencia,"
            " verificado_fecha, verificado_por) VALUES (?, 'analisis_marca', 3, ?, ?, 'auto') "
            "ON CONFLICT(producto_id, tipo) DO UPDATE SET url_evidencia=excluded.url_evidencia,"
            " verificado_fecha=excluded.verificado_fecha",
            (p["id"], pdfs[0], hoy))
        nuevos += 1
    con.commit()
    return nuevos, retirados


# Marcas registradas que en el NOMBRE de un producto son una afirmacion que obliga:
#   creapure  marca de ingrediente licenciada por Alzchem; solo la usa quien tiene contrato.
#   ifos      programa de analisis por lotes de Nutrasource (International Fish Oil
#             Standards). No es un logo que uno se ponga: certifica un tercero y publica
#             el informe del lote. Ponerlo en el nombre del producto es firmarlo.
# Solo van las que la BD admite como tipo de certificacion.
MARCAS_LICENCIADAS = {"creapure": r"creapure", "ifos": r"\bifos\b"}

# Tiendas donde el titulo del producto NO lo escribe la tienda. En un marketplace lo
# teclea cada vendedor, asi que "Creapure" en el nombre no es una tienda firmando un
# contrato de licencia: es texto de un tercero sin nadie detras. En Amazon esas marcas
# se quedan en nivel 2 (declarado) hasta que alguien compruebe el codigo QS del bote.
# El razonamiento del nivel 4 (invariante 3b de AGENTS.md) es justo que alguien
# identificable firma la afirmacion; aqui no lo hay.
TIENDAS_SIN_NOMBRE_FIRMADO = ("amazon",)


def promover_marcas_licenciadas(con):
    """La marca licenciada en el NOMBRE del producto vale nivel NIVEL_MARCA_LICENCIADA.

    Solo el nombre, nunca la descripcion: en los carruseles de productos relacionados de
    una ficha aparece "Creapure" de OTROS productos (40 veces en cada pagina de Myprotein),
    y ahi no lo afirma nadie de este producto. Y solo en las tiendas que escriben ellas
    sus fichas: ver TIENDAS_SIN_NOMBRE_FIRMADO.

    Va en los dos sentidos: si la tienda deja de declararlo en el nombre, el sello vuelve
    a nivel 2. Lo curado a mano (nivel 4 con codigo QS) no se toca nunca.
    """
    hoy = date.today().isoformat()
    subidos, bajados = 0, 0
    hueco = ",".join("?" * len(TIENDAS_SIN_NOMBRE_FIRMADO))
    for tipo, patron in MARCAS_LICENCIADAS.items():
        for p in con.execute("SELECT id, url, marca, nombre FROM producto "
                             "WHERE tienda NOT IN (%s)" % hueco,
                             TIENDAS_SIN_NOMBRE_FIRMADO).fetchall():
            declara = re.search(patron, "%s %s" % (p["marca"], p["nombre"]), re.I)
            cert = con.execute(
                "SELECT nivel_verificacion n, verificado_por por FROM certificacion "
                "WHERE producto_id=? AND tipo=?", (p["id"], tipo)).fetchone()
            if cert and cert["por"] == "manual":
                continue                      # una comprobacion humana manda sobre esto
            if declara and (cert is None or cert["n"] < NIVEL_MARCA_LICENCIADA):
                con.execute(
                    "INSERT INTO certificacion (producto_id, tipo, nivel_verificacion,"
                    " url_evidencia, verificado_fecha, verificado_por) VALUES (?,?,?,?,?,'auto') "
                    "ON CONFLICT(producto_id, tipo) DO UPDATE SET"
                    " nivel_verificacion=excluded.nivel_verificacion,"
                    " url_evidencia=excluded.url_evidencia,"
                    " verificado_fecha=excluded.verificado_fecha, verificado_por='auto'",
                    (p["id"], tipo, NIVEL_MARCA_LICENCIADA, p["url"], hoy))
                subidos += 1
            elif not declara and cert and cert["n"] == NIVEL_MARCA_LICENCIADA:
                con.execute(
                    "UPDATE certificacion SET nivel_verificacion=2, url_evidencia=NULL,"
                    " verificado_fecha=?, verificado_por='auto' WHERE producto_id=? AND tipo=?",
                    (hoy, p["id"], tipo))
                bajados += 1
    con.commit()
    return subidos, bajados


def cmd_auto(con, args):
    print("Cruzando contra listas publicas:")
    subidos = cruzar_listas(con)
    print("Buscando analisis publicados por la marca en las fichas:")
    nivel3, retirados = detectar_analisis_de_marca(con)
    if retirados:
        print("  %d analisis retirados: la ficha no publica ninguno" % retirados)
    print("Marcas de ingrediente licenciadas declaradas en el nombre:")
    licencias, revocadas = promover_marcas_licenciadas(con)
    print("  %d sellos a nivel %d, %d devueltos a nivel 2 (la tienda ya no lo declara)"
          % (licencias, NIVEL_MARCA_LICENCIADA, revocadas))
    print("\n%d certificaciones a nivel 4 (fuente publica), %d a nivel 3 (analisis de marca)."
          % (subidos, nivel3))
    print("El resto necesita curacion manual: python verificar.py pendientes")


def cmd_pendientes(con, args):
    filas = con.execute(
        "SELECT c.producto_id, c.tipo, c.nivel_verificacion n, p.marca, p.nombre, p.tienda, p.url "
        "FROM certificacion c JOIN producto p ON p.id=c.producto_id "
        "WHERE c.nivel_verificacion < 4 ORDER BY c.nivel_verificacion DESC, p.marca").fetchall()
    if not filas:
        print("Nada pendiente.")
        return
    print("%-5s %-16s %-3s %-18s %s" % ("id", "sello", "niv", "marca", "producto"))
    for f in filas:
        print("%-5d %-16s %-3d %-18s %s" % (f["producto_id"], f["tipo"], f["n"],
                                            f["marca"][:18], f["nombre"][:44]))
    print("\nCreapure: mira el codigo QS del ENVASE en creapure.com y luego:")
    print("  python verificar.py qs <id> <codigo>")


def cmd_qs(con, args):
    if not re.fullmatch(r"\d{6}", args.codigo):
        sys.exit("El codigo QS de Creapure son 6 digitos. '%s' no lo es." % args.codigo)
    if not args.confirmado:
        r = input("Has comprobado el codigo %s en creapure.com y coincide con este producto? [s/N] "
                  % args.codigo)
        if r.strip().lower() not in ("s", "si", "sí"):
            sys.exit("Cancelado. Un sello impreso no es una verificacion.")
    con.execute(
        "INSERT INTO certificacion (producto_id, tipo, nivel_verificacion, codigo_qs,"
        " url_evidencia, verificado_fecha, verificado_por) "
        "VALUES (?, 'creapure', 4, ?, 'https://www.creapure.com/en/quality-check', ?, 'manual') "
        "ON CONFLICT(producto_id, tipo) DO UPDATE SET nivel_verificacion=4,"
        " codigo_qs=excluded.codigo_qs, url_evidencia=excluded.url_evidencia,"
        " verificado_fecha=excluded.verificado_fecha, verificado_por='manual'",
        (args.producto_id, args.codigo, date.today().isoformat()))
    con.commit()
    print("Creapure nivel 4 registrado para el producto %d (codigo %s, %s)."
          % (args.producto_id, args.codigo, date.today().isoformat()))


def cmd_analisis(con, args):
    if not args.url.startswith("http"):
        sys.exit("La url de evidencia tiene que ser un enlace publico.")
    con.execute(
        "INSERT INTO certificacion (producto_id, tipo, nivel_verificacion, url_evidencia,"
        " verificado_fecha, verificado_por) VALUES (?, 'analisis_marca', 3, ?, ?, 'manual') "
        "ON CONFLICT(producto_id, tipo) DO UPDATE SET nivel_verificacion=3,"
        " url_evidencia=excluded.url_evidencia, verificado_fecha=excluded.verificado_fecha,"
        " verificado_por='manual'",
        (args.producto_id, args.url, date.today().isoformat()))
    con.commit()
    print("Nivel 3 (analisis publicado por la marca) registrado para el producto %d."
          % args.producto_id)


def cmd_bajar(con, args):
    n = con.execute("UPDATE certificacion SET nivel_verificacion=2, codigo_qs=NULL,"
                    " verificado_por='manual', verificado_fecha=? "
                    "WHERE producto_id=? AND tipo=?",
                    (date.today().isoformat(), args.producto_id, args.tipo)).rowcount
    con.commit()
    print("%d certificacion(es) devueltas a nivel 2 (declarado)." % n)


def main():
    # Windows abre la consola en cp1252 y un nombre de producto con un caracter que no
    # sabe pintar (Amazon usa "≥" en los titulos) reventaba la pasada entera con
    # UnicodeEncodeError, despues de haber hecho el trabajo. Que se pinte como pueda.
    sys.stdout.reconfigure(errors="replace")
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("auto")
    sub.add_parser("pendientes")
    p = sub.add_parser("qs")
    p.add_argument("producto_id", type=int)
    p.add_argument("codigo")
    p.add_argument("--confirmado", action="store_true",
                   help="ya lo has comprobado en creapure.com (salta la pregunta)")
    p = sub.add_parser("analisis")
    p.add_argument("producto_id", type=int)
    p.add_argument("url")
    p = sub.add_parser("bajar")
    p.add_argument("producto_id", type=int)
    p.add_argument("tipo")
    args = ap.parse_args()

    con = connect()
    {"auto": cmd_auto, "pendientes": cmd_pendientes, "qs": cmd_qs,
     "analisis": cmd_analisis, "bajar": cmd_bajar}[args.cmd](con, args)


if __name__ == "__main__":
    main()
