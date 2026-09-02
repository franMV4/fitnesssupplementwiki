"""Las correcciones hechas a mano en /admin, traidas al pipeline.

    python ediciones.py            -> baja las correcciones de D1 y las guarda
    python ediciones.py --local    -> no baja nada: usa data/ediciones.json tal cual

El problema que resuelve: el panel vive en Cloudflare y el catalogo vive en un SQLite de
este ordenador. Cuando en /admin se corrige el nombre de un producto, ese cambio se
apunta en la tabla `ediciones` de D1, y sin este fichero nunca llegaria a la web, porque
las 2.984 paginas se generan aqui, desde la BD local.

Y el otro problema, el que hace que esto tenga que existir como paso del pipeline y no
como un apano de una vez: `guardar_producto` hace upsert por (tienda, url), asi que la
pasada siguiente del scraper machacaria cada correccion manual. Por eso las correcciones
NO se guardan como un UPDATE y ya: se guardan aparte y se vuelven a aplicar despues de
cada scrape, siempre, hasta que alguien las deshaga desde el panel.

Orden en el que corre (ver actualizar.py):

    scraper -> verificar -> mantenimiento -> ESTO -> scoring -> exportar

Va antes del scoring a proposito. La decision del dueno fue corregir el DATO DE ENTRADA
y dejar que el motor recalcule la nota: si se aplicara despues, un precio corregido
seguiria puntuando con el precio viejo y /metodologia estaria mintiendo.

ponytail: wrangler por subprocess y no la API HTTP de Cloudflare. Wrangler ya esta
instalado, ya tiene la sesion iniciada y ya sabe que base es "suplementos"; la API
pediria ademas un token de cuenta y un id de base guardados en algun sitio.
"""

import json
import subprocess
import sys
from pathlib import Path

RUTA = Path(__file__).with_name("data") / "ediciones.json"
WEB = Path(__file__).with_name("web")
BASE = "suplementos"

# Campos del catalogo que el panel puede corregir. La lista esta aqui y no en la API a
# proposito: es este fichero el que escribe en la BD, y una columna que no este aqui no
# se puede tocar aunque alguien inserte la fila a mano en D1.
CAMPOS_PRODUCTO = {"marca", "nombre", "categoria", "precio_eur", "formato_gramos",
                   "unidades", "servicios_por_envase", "forma", "imagen"}
CAMPOS_DOSIS = {"dosis_efectiva_min_mg", "dosis_efectiva_max_mg", "pureza_tipica",
                "forma_preferida", "nivel_evidencia", "fuentes"}
# De una categoria solo se corrigen textos. El filtro y las exclusiones son expresiones
# regulares de las que depende que producto entra en la categoria: una mal escrita deja
# la tabla en cero productos sin un solo error en el log, asi que eso se toca en
# categorias.py, leyendo el comentario que hay al lado, y no desde un navegador.
CAMPOS_CATEGORIA = {"nombre", "termino", "mejor", "consultas"}


def descargar(base=BASE):
    """Trae la tabla `ediciones` de D1 y la deja en data/ediciones.json.

    Si wrangler no esta o falla (sin red, sin sesion), NO revienta la pasada: se avisa y
    se sigue con la copia que ya hubiera en disco. Que no haya internet un martes no
    puede dejar la web sin publicar.
    """
    cmd = ["npx", "wrangler", "d1", "execute", base, "--remote", "--json",
           "--command", "SELECT ambito, clave, campo, valor, motivo, autor, fecha "
                        "FROM ediciones ORDER BY ambito, clave, campo"]
    try:
        r = subprocess.run(cmd, cwd=WEB, capture_output=True, text=True,
                           encoding="utf-8", errors="replace", shell=(sys.platform == "win32"))
    except OSError as e:
        print("aviso: no se ha podido llamar a wrangler (%s). Se usa la copia local." % e)
        return cargar()
    if r.returncode != 0:
        print("aviso: wrangler ha fallado. Se usa la copia local.\n%s"
              % (r.stderr or r.stdout).strip()[:500])
        return cargar()

    # wrangler mezcla su cartel de bienvenida con el JSON: se busca donde empieza la
    # estructura en vez de suponer que la salida es JSON limpio.
    bruto = r.stdout
    inicio = min([i for i in (bruto.find("["), bruto.find("{")) if i >= 0], default=-1)
    if inicio < 0:
        print("aviso: wrangler no ha devuelto JSON. Se usa la copia local.")
        return cargar()
    try:
        salida = json.loads(bruto[inicio:])
    except json.JSONDecodeError:
        print("aviso: no se ha podido leer la respuesta de wrangler. Se usa la copia local.")
        return cargar()

    filas = salida[0]["results"] if isinstance(salida, list) else salida.get("results", [])
    RUTA.parent.mkdir(parents=True, exist_ok=True)
    RUTA.write_text(json.dumps(filas, ensure_ascii=False, indent=1), encoding="utf-8")
    return filas


def cargar():
    """Las correcciones que hay en disco. Lista vacia si nunca se ha bajado ninguna."""
    if not RUTA.exists():
        return []
    try:
        return json.loads(RUTA.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        print("aviso: data/ediciones.json esta corrupto. Se ignora.")
        return []


def por_ambito(filas, ambito):
    """{clave: {campo: valor}} del ambito pedido, con el valor ya deserializado.

    Una fila con un JSON invalido se salta y se dice cual: es preferible publicar sin
    una correccion que no publicar por una.
    """
    fuera = {}
    for f in filas:
        if f.get("ambito") != ambito:
            continue
        try:
            valor = json.loads(f["valor"]) if f.get("valor") is not None else None
        except (json.JSONDecodeError, TypeError):
            print("aviso: edicion ilegible en %s/%s/%s, se ignora"
                  % (f.get("ambito"), f.get("clave"), f.get("campo")))
            continue
        fuera.setdefault(f["clave"], {})[f["campo"]] = valor
    return fuera


def ocultos(filas):
    """Claves 'tienda|url' que el panel ha marcado para no publicarse."""
    return {k for k, campos in por_ambito(filas, "producto").items() if campos.get("oculto")}


def textos_categoria(filas):
    """{clave_interna: {campo: texto}} con lo que exportar.py puede pisar."""
    return {c: {k: v for k, v in campos.items() if k in CAMPOS_CATEGORIA}
            for c, campos in por_ambito(filas, "categoria").items()}


def aplicar_productos(con, filas):
    """Escribe las correcciones de producto en la BD. Devuelve cuantos campos cambio.

    La clave es (tienda, url) y no el id: los ids se renumeran si algun dia hay que
    reconstruir la BD, y el par tienda+url es el UNIQUE del que ya depende el upsert.
    """
    n = 0
    for clave, campos in por_ambito(filas, "producto").items():
        tienda, _, url = clave.partition("|")
        editables = {c: v for c, v in campos.items() if c in CAMPOS_PRODUCTO}
        if not editables or not url:
            continue
        sets = ", ".join("%s = ?" % c for c in editables)
        cur = con.execute("UPDATE producto SET %s WHERE tienda = ? AND url = ?" % sets,
                          list(editables.values()) + [tienda, url])
        if cur.rowcount:
            n += len(editables)
        else:
            # Un producto que ya no esta en el catalogo (la tienda lo retiro): la
            # correccion se queda guardada por si vuelve, pero conviene saberlo.
            print("aviso: %s ya no esta en el catalogo, su correccion no se aplica" % clave)
    con.commit()
    return n


def aplicar_dosis(con, filas):
    """Lo mismo para la tabla de dosis de referencia. Devuelve cuantos campos cambio."""
    n = 0
    for ingrediente, campos in por_ambito(filas, "dosis").items():
        editables = {c: v for c, v in campos.items() if c in CAMPOS_DOSIS}
        if not editables:
            continue
        # `fuentes` es una columna TEXT con json_valid() encima: viaja serializada.
        valores = [json.dumps(v, ensure_ascii=False) if c == "fuentes" else v
                   for c, v in editables.items()]
        sets = ", ".join("%s = ?" % c for c in editables)
        cur = con.execute("UPDATE dosis_referencia SET %s WHERE ingrediente = ?" % sets,
                          valores + [ingrediente])
        if cur.rowcount:
            n += len(editables)
        else:
            print("aviso: no hay dosis de referencia para %s, su correccion no se aplica"
                  % ingrediente)
    con.commit()
    return n


def aplicar_config(filas, cfg):
    """Pisa los pesos de scoring/config.py con los corregidos en el panel.

    Se toca el modulo en memoria y no el fichero: el fichero es codigo con un comentario
    que defiende cada numero, y un script que lo reescriba se lleva por delante los
    comentarios. Aqui el valor manda durante esta pasada y en config.py sigue estando
    el porque. Solo se pisan constantes que ya existen y que son numeros.
    """
    n = 0
    for campo, valor in por_ambito(filas, "config").get("scoring", {}).items():
        nombre = campo.upper()
        actual = getattr(cfg, nombre, None)
        if not isinstance(actual, (int, float)) or isinstance(actual, bool):
            print("aviso: %s no es un peso numerico de config.py, se ignora" % campo)
            continue
        if not isinstance(valor, (int, float)) or isinstance(valor, bool):
            print("aviso: el valor de %s no es un numero, se ignora" % campo)
            continue
        setattr(cfg, nombre, valor)
        n += 1
    # La invariante que el motor da por buena. Mejor caer aqui, con el nombre de los tres
    # pesos delante, que publicar 30 tablas ordenadas por una formula que no suma 1.
    pesos = {"PESO_CALIDAD": cfg.PESO_CALIDAD, "PESO_COSTE": cfg.PESO_COSTE,
             "PESO_REQUISITOS": cfg.PESO_REQUISITOS,
             "PESO_VALORACION": cfg.PESO_VALORACION}
    if abs(sum(pesos.values()) - 1) > 1e-9:
        raise SystemExit("%s tienen que sumar 1. Corrigelo en /admin o deshaz la edicion."
                         % ", ".join("%s (%s)" % kv for kv in pesos.items()))
    return n


def main(bajar=True):
    from data.db import connect
    from scoring import config as cfg

    filas = descargar() if bajar else cargar()
    if not filas:
        print("no hay correcciones que aplicar")
        return
    con = connect()
    print("%d correcciones descargadas" % len(filas))
    print("productos: %d campos corregidos" % aplicar_productos(con, filas))
    print("dosis: %d campos corregidos" % aplicar_dosis(con, filas))
    print("pesos: %d corregidos" % aplicar_config(filas, cfg))
    print("productos marcados como ocultos: %d" % len(ocultos(filas)))
    print("las de categoria y texto las aplica exportar.py al generar la web")


if __name__ == "__main__":
    sys.stdout.reconfigure(errors="replace")
    main(bajar="--local" not in sys.argv)
