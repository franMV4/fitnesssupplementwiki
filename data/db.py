"""Acceso a la BD del comparador de suplementos.

ponytail: sqlite3 de stdlib, sin ORM. El esquema son 5 tablas y las consultas son
SQL plano; SQLModel/SQLAlchemy solo anadirian una dependencia y una capa que traducir.
Cambiar a Postgres (si algun dia escala) es reescribir este fichero, nada mas.

Uso:  python data/db.py          -> crea la BD, siembra 3 creatinas y se autocomprueba
"""

import json
import re
import sqlite3
import tempfile
from datetime import date
from pathlib import Path

DB_PATH = Path(__file__).with_name("suplementos.sqlite")
SCHEMA_PATH = Path(__file__).with_name("schema.sql")


def connect(path=DB_PATH):
    con = sqlite3.connect(path)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


def init(con):
    """Aplica el esquema. Idempotente."""
    con.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
    # CREATE TABLE IF NOT EXISTS no anade columnas a una tabla que ya existe. Esto no es
    # un sistema de migraciones: es la alternativa a borrar la BD, que se llevaria por
    # delante lo curado a mano (los codigos QS de verificar.py, que nadie puede rescrapear).
    columnas = {r["name"] for r in con.execute("PRAGMA table_info(producto)")}
    for col, tipo in (("imagen", "TEXT"), ("valoracion", "REAL"),
                      ("n_valoraciones", "INTEGER"), ("pureza_real", "REAL"),
                      ("aditivos", "TEXT"), ("lista_ingredientes", "TEXT"),
                      ("descripcion", "TEXT")):
        if col not in columnas:
            con.execute("ALTER TABLE producto ADD COLUMN %s %s" % (col, tipo))
    if "pureza_tipica" not in {r["name"] for r in
                               con.execute("PRAGMA table_info(dosis_referencia)")}:
        con.execute("ALTER TABLE dosis_referencia ADD COLUMN pureza_tipica REAL")
    cols_score = {r["name"] for r in con.execute("PRAGMA table_info(score)")}
    for col, tipo in (("score_requisitos", "REAL"), ("requisitos", "TEXT")):
        if col not in cols_score:
            con.execute("ALTER TABLE score ADD COLUMN %s %s" % (col, tipo))
    con.commit()
    sql_actual = con.execute(
        "SELECT sql FROM sqlite_master WHERE name='producto'").fetchone()[0]
    if "unidades" not in sql_actual or "servicios_por_envase IS NOT NULL" not in sql_actual:
        _migrar_producto(con)


def _tabla_sql(nombre, alias):
    """El CREATE TABLE de schema.sql, renombrado. Una sola definicion del esquema."""
    m = re.search(r"CREATE TABLE IF NOT EXISTS %s \(.*?\n\);" % nombre,
                  SCHEMA_PATH.read_text(encoding="utf-8"), re.S)
    return m.group(0).replace("IF NOT EXISTS %s (" % nombre, "%s (" % alias, 1)


def _migrar_producto(con):
    """Reconstruye producto con el esquema de schema.sql, conservando las filas.

    Cambio del 2026-08-21: se anade unidades (capsulas por envase) y formato_gramos deja
    de ser obligatorio, porque el omega 3 y los multivitaminicos no se venden en polvo y
    hay preentrenos que solo declaran raciones.

    SQLite no sabe quitar un NOT NULL ni anadir una columna generada STORED, asi que hay
    que reconstruir la tabla y copiar las filas. Con foreign_keys OFF para que el DROP no
    se lleve por delante ingredientes, certificaciones y scores.
    ponytail: migracion de un solo uso, no un sistema de versiones. Cuando no quede
    ninguna BD anterior al 2026-08-21, este bloque se borra.
    """
    viejas = ("id marca nombre categoria tienda url formato_gramos servicios_por_envase "
              "precio_eur forma imagen fecha_scrape")
    cols = ", ".join(viejas.split())
    con.commit()
    con.execute("PRAGMA foreign_keys=OFF")
    con.executescript(
        _tabla_sql("producto", "producto_nuevo")
        + "\nINSERT INTO producto_nuevo (%s) SELECT %s FROM producto;" % (cols, cols)
        + "\nDROP TABLE producto;"
        + "\nALTER TABLE producto_nuevo RENAME TO producto;")
    con.execute("PRAGMA foreign_keys=ON")
    con.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))   # recrea el indice
    con.commit()


CAMPOS_PRODUCTO = (
    "marca nombre categoria tienda url formato_gramos unidades servicios_por_envase "
    "precio_eur forma imagen valoracion n_valoraciones pureza_real aditivos "
    "lista_ingredientes descripcion fecha_scrape"
).split()


def guardar_producto(con, producto, ingredientes=(), certificaciones=()):
    """Inserta o actualiza por (tienda, url). Devuelve el id.

    Idempotente: reejecutar el scraper actualiza precio y fecha_scrape, no duplica.
    """
    p = {k: producto.get(k) for k in CAMPOS_PRODUCTO}
    if not isinstance(p["aditivos"], (str, type(None))):
        p["aditivos"] = json.dumps(sorted(p["aditivos"]), ensure_ascii=False)
    p.setdefault("fecha_scrape", None)
    p["fecha_scrape"] = p["fecha_scrape"] or date.today().isoformat()
    cols = ", ".join(CAMPOS_PRODUCTO)
    marks = ", ".join(f":{c}" for c in CAMPOS_PRODUCTO)
    actualizables = [c for c in CAMPOS_PRODUCTO if c not in ("tienda", "url")]
    sets = ", ".join(f"{c}=excluded.{c}" for c in actualizables)
    pid = con.execute(
        f"INSERT INTO producto ({cols}) VALUES ({marks}) "
        f"ON CONFLICT(tienda, url) DO UPDATE SET {sets} RETURNING id",
        p,
    ).fetchone()[0]

    for ing in ingredientes:
        con.execute(
            "INSERT INTO ingrediente_producto (producto_id, ingrediente, dosis_por_servicio_mg) "
            "VALUES (?, ?, ?) ON CONFLICT(producto_id, ingrediente) "
            "DO UPDATE SET dosis_por_servicio_mg=excluded.dosis_por_servicio_mg",
            (pid, ing["ingrediente"], ing.get("dosis_por_servicio_mg")),
        )
    # Lo que la ficha ya no declara (o que colo una deteccion vieja) se retira: arreglar
    # una regla no puede dejar vivo lo que metio mal la version anterior.
    nombres = [i["ingrediente"] for i in ingredientes]
    con.execute(
        "DELETE FROM ingrediente_producto WHERE producto_id=? AND ingrediente NOT IN (%s)"
        % (",".join("?" * len(nombres)) or "''"), [pid] + nombres)

    for cert in certificaciones:
        con.execute(
            "INSERT INTO certificacion (producto_id, tipo, nivel_verificacion, codigo_qs, "
            "url_evidencia, verificado_fecha, verificado_por) VALUES (?,?,?,?,?,?,?) "
            "ON CONFLICT(producto_id, tipo) DO UPDATE SET "
            "nivel_verificacion=excluded.nivel_verificacion, codigo_qs=excluded.codigo_qs, "
            "url_evidencia=excluded.url_evidencia, verificado_fecha=excluded.verificado_fecha, "
            "verificado_por=excluded.verificado_por",
            (pid, cert["tipo"], cert["nivel_verificacion"], cert.get("codigo_qs"),
             cert.get("url_evidencia"), cert.get("verificado_fecha"), cert.get("verificado_por")),
        )

    # Retira sellos declarados que ya no aparecen en la ficha (la tienda cambio el texto,
    # o mejoramos la deteccion). Solo toca los automaticos de nivel <= 2: lo curado a mano
    # y lo verificado contra fuente no se pierde por reejecutar el scraper.
    tipos = [c["tipo"] for c in certificaciones]
    # verificado_por IS NULL = sello declarado por una version vieja del scraper. Tambien se
    # retira: si no, un falso positivo ya corregido sigue enseñando el sello para siempre.
    con.execute(
        "DELETE FROM certificacion WHERE producto_id=? "
        "AND (verificado_por='auto' OR verificado_por IS NULL) "
        "AND nivel_verificacion <= 2 AND tipo NOT IN (%s)" % (",".join("?" * len(tipos)) or "''"),
        [pid] + tipos)
    con.commit()
    return pid


def limpiar_marcas(con):
    """Pasa por marca_canonica lo que ya esta guardado. Devuelve cuantas filas cambian.

    El scraper normaliza al insertar, pero una fila escrita por una version anterior se
    queda con lo que se guardo entonces ("Citrato de", "Extracto de", "L") hasta que esa
    tienda vuelva a listar ese producto. Esto lo arregla sin esperar a la pasada siguiente,
    y correrlo dos veces no cambia nada.
    """
    from scraper.core import marca_canonica      # aqui dentro: data/ no depende del scraper
    cambios = 0
    for fila in list(con.execute("SELECT id, marca FROM producto")):
        buena = marca_canonica(fila["marca"])
        if buena != fila["marca"]:
            con.execute("UPDATE producto SET marca=? WHERE id=?", (buena, fila["id"]))
            cambios += 1
    con.commit()
    return cambios


def guardar_historico(con, fecha=None):
    """Congela el precio de hoy de cada producto. Devuelve cuantas filas nuevas guarda.

    Es el unico dato del proyecto que no se puede recuperar mas tarde: lo que no se guarde
    hoy no lo devuelve ningun scraper manana. Una fila por producto y dia; INSERT OR IGNORE
    para que dos pasadas el mismo dia no dupliquen ni pisen la primera.
    """
    dia = fecha or date.today().isoformat()
    antes = con.execute("SELECT count(*) FROM precio_historico").fetchone()[0]
    con.execute(
        "INSERT OR IGNORE INTO precio_historico (producto_id, fecha, precio_eur) "
        "SELECT id, ?, precio_eur FROM producto", (dia,))
    con.commit()
    return con.execute("SELECT count(*) FROM precio_historico").fetchone()[0] - antes


# Seed de prueba: productos INVENTADOS para validar la fontaneria, no datos reales.
SEED = [
    (
        dict(marca="MarcaDemo", nombre="Creatina Monohidrato Creapure 500 g", categoria="creatina",
             tienda="demo", url="https://demo.invalid/creapure-500", formato_gramos=500,
             servicios_por_envase=100, precio_eur=24.90, forma="monohidrato"),
        [dict(ingrediente="creatina_monohidrato", dosis_por_servicio_mg=5000)],
        [dict(tipo="creapure", nivel_verificacion=2)],  # solo declarado en ficha
    ),
    (
        dict(marca="OtraDemo", nombre="Creatina Micronizada 1 kg", categoria="creatina",
             tienda="demo", url="https://demo.invalid/micronizada-1kg", formato_gramos=1000,
             servicios_por_envase=200, precio_eur=29.90, forma="monohidrato"),
        [dict(ingrediente="creatina_monohidrato", dosis_por_servicio_mg=5000)],
        [dict(tipo="analisis_marca", nivel_verificacion=3,
              url_evidencia="https://demo.invalid/analisis.pdf",
              verificado_fecha=date.today().isoformat(), verificado_por="manual")],
    ),
    (
        dict(marca="TerceraDemo", nombre="Creatina HCL 200 g", categoria="creatina",
             tienda="demo", url="https://demo.invalid/hcl-200", formato_gramos=200,
             servicios_por_envase=100, precio_eur=19.90, forma="hcl"),
        [dict(ingrediente="creatina_hcl", dosis_por_servicio_mg=2000)],
        [dict(tipo="etiqueta", nivel_verificacion=1)],
    ),
]

DOSIS_PATH = Path(__file__).with_name("dosis_referencia.json")


def cargar_dosis(con):
    """La tabla de dosis la mantiene una persona en data/dosis_referencia.json.

    Es el activo del proyecto: cada cifra con su fuente. Por eso vive en un JSON
    editable y no incrustada en el codigo.
    """
    datos = json.loads(DOSIS_PATH.read_text(encoding="utf-8"))["dosis"]
    for d in datos:
        assert d.get("fuentes"), "%s no tiene fuente citada" % d["ingrediente"]
        con.execute(
            "INSERT INTO dosis_referencia (ingrediente, dosis_efectiva_min_mg,"
            " dosis_efectiva_max_mg, pureza_tipica, forma_preferida, nivel_evidencia,"
            " fuentes) "
            "VALUES (:ingrediente,:dosis_efectiva_min_mg,:dosis_efectiva_max_mg,"
            ":pureza_tipica,:forma_preferida,:nivel_evidencia,:fuentes) "
            "ON CONFLICT(ingrediente) DO UPDATE SET "
            "dosis_efectiva_min_mg=excluded.dosis_efectiva_min_mg,"
            "dosis_efectiva_max_mg=excluded.dosis_efectiva_max_mg,"
            "pureza_tipica=excluded.pureza_tipica,"
            "forma_preferida=excluded.forma_preferida,"
            "nivel_evidencia=excluded.nivel_evidencia, fuentes=excluded.fuentes",
            dict(d, pureza_tipica=d.get("pureza_tipica"),
                 fuentes=json.dumps(d["fuentes"], ensure_ascii=False)))
    con.commit()
    return len(datos)


def seed(con):
    for producto, ingredientes, certs in SEED:
        guardar_producto(con, producto, ingredientes, certs)
    cargar_dosis(con)
    con.commit()


def _autocomprobacion(con):
    """Lo minimo que falla si el esquema o el upsert se rompen."""
    n = con.execute("SELECT count(*) FROM producto").fetchone()[0]
    assert n == 3, f"esperaba 3 productos, hay {n} (el upsert duplica)"

    p = con.execute("SELECT * FROM producto WHERE url LIKE '%creapure-500'").fetchone()
    assert abs(p["precio_por_kg"] - 49.80) < 0.01, p["precio_por_kg"]
    assert con.execute(
        "SELECT dosis_por_servicio_mg FROM ingrediente_producto WHERE producto_id=?", (p["id"],)
    ).fetchone()[0] == 5000

    # nivel 4 sin prueba contra fuente debe rebotar: un sello impreso no es verificacion
    try:
        con.execute("INSERT INTO certificacion (producto_id, tipo, nivel_verificacion,"
                    " verificado_fecha) VALUES (?, 'informed_sport', 4, '2026-01-01')", (p["id"],))
    except sqlite3.IntegrityError:
        con.rollback()
    else:
        raise AssertionError("acepto nivel 4 sin codigo QS ni url de evidencia")

    # borrado en cascada: no quedan huerfanos
    con.execute("DELETE FROM producto WHERE id=?", (p["id"],))
    assert con.execute("SELECT count(*) FROM ingrediente_producto WHERE producto_id=?",
                       (p["id"],)).fetchone()[0] == 0
    con.rollback()
    print(f"OK: {n} productos, esquema y upsert correctos (BD de prueba)")


if __name__ == "__main__":
    # La autocomprobacion corre sobre una BD DESECHABLE, nunca sobre la de verdad.
    # Antes conectaba a data/suplementos.sqlite y le metia el SEED, que son tres
    # productos INVENTADOS: acabaron publicados, con su pagina, en el puesto 19 de
    # /creatina y en /mejores/creatina-creapure, porque el scraper no borra lo que no
    # vuelve a ver. Las dosis de verdad las carga actualizar.py en cada pasada, asi
    # que este fichero ya no tiene ningun motivo para tocar la BD real.
    with tempfile.TemporaryDirectory() as tmp:
        con = connect(Path(tmp) / "prueba.sqlite")
        init(con)
        seed(con)
        seed(con)  # dos veces a proposito: debe seguir habiendo 3 productos
        _autocomprobacion(con)
        con.close()  # Windows no borra el fichero mientras sqlite lo tenga abierto
