"""Corre todas las tiendas y vuelca a la BD.

    python run_scraper.py                 # todas las tiendas, categoria creatina
    python run_scraper.py --tienda hsn    # una sola
    python run_scraper.py --sin-cache     # ignora la cache de 6 h

Anadir una tienda: crear scraper/tiendas/nueva.py con una clase que herede de
Scraper. Se descubre sola; este fichero no se toca.
"""

import argparse
import sys
import importlib
import inspect
import logging
import pkgutil
from concurrent.futures import ThreadPoolExecutor, as_completed

from data.db import connect, guardar_producto, init
from scraper import core, tiendas


def descubre():
    for mod in pkgutil.iter_modules(tiendas.__path__):
        m = importlib.import_module("scraper.tiendas." + mod.name)
        for _, obj in inspect.getmembers(m, inspect.isclass):
            if issubclass(obj, core.Scraper) and obj is not core.Scraper:
                yield obj()


def main():
    # Windows abre la consola en cp1252 y un nombre de producto con un caracter que no
    # sabe pintar (Amazon usa "≥" en los titulos) reventaba la pasada entera con
    # UnicodeEncodeError, despues de haber hecho el trabajo. Que se pinte como pueda.
    sys.stdout.reconfigure(errors="replace")
    ap = argparse.ArgumentParser()
    ap.add_argument("--tienda")
    ap.add_argument("--categoria", default="creatina")
    ap.add_argument("--sin-cache", action="store_true")
    args = ap.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    log = logging.getLogger("run")
    if args.sin_cache:
        core.CACHE_TTL_S = 0

    con = connect()
    init(con)
    total, bloqueadas = 0, []

    # Cada tienda es un host distinto y el delay de core es POR HOST, asi que esperar a
    # que HSN conteste para empezar con Prozis no hace la descarga mas educada: solo la
    # hace mas larga. Con ocho tiendas y treinta categorias, en serie son horas. Un hilo
    # por tienda y cada uno con su propio ritmo.
    # ponytail: los hilos solo DESCARGAN. Escribir en la BD se hace aqui, en el hilo
    # principal y de uno en uno, que es lo unico que sqlite no lleva bien.
    activos = [s for s in descubre()
               if not (args.tienda and s.tienda != args.tienda)]
    for s in activos:
        if args.categoria not in s.categorias:
            log.info("%s: no vende %s, se salta", s.tienda, args.categoria)
    activos = [s for s in activos if args.categoria in s.categorias]
    with ThreadPoolExecutor(max_workers=max(1, len(activos))) as pool:
        tareas = {pool.submit(s.extraer, args.categoria): s for s in activos}
        cosecha = []
        for tarea in as_completed(tareas):
            s = tareas[tarea]
            try:
                cosecha.append((s, tarea.result()))
            except core.TiendaBloqueada as e:
                bloqueadas.append((s.tienda, str(e)))
                log.warning("%s: BLOQUEADA (%s). Se documenta y se sigue.", s.tienda, e)
            except Exception as e:
                log.error("%s: fallo extrayendo (%s: %s)", s.tienda, type(e).__name__, e)

    for s, filas in sorted(cosecha, key=lambda x: x[0].tienda):
        vistos = []
        for f in filas:
            # Un precio por kilo imposible no se guarda: es un error de extraccion
            # (formato de una variante emparejado con el precio de otra), y en la tabla
            # sale de primero, que es justo donde mas dano hace. Al no entrar en
            # `vistos`, el DELETE de abajo tambien retira el que colo una version vieja.
            motivo = core.sospechoso(f["producto"])
            if motivo:
                log.warning("%s: descartado %s -> %s", s.tienda, f["producto"]["nombre"], motivo)
                continue
            try:
                vistos.append(guardar_producto(con, f["producto"], f["ingredientes"],
                                               f["certificaciones"]))
            except Exception as e:                 # una ficha rota no tumba la tienda
                log.error("%s: no se guarda %s (%s)", s.tienda, f["producto"]["url"], e)

        # Lo que la tienda ya no lista se borra: si no, un precio viejo o un error de
        # extraccion ya corregido se quedaria enseñando datos falsos para siempre. Salvo
        # si la pasada quedo a medias (429): entonces lo que falta no es que se haya
        # retirado del catalogo, es que no nos dio tiempo a mirarlo.
        if s.parcial:
            log.warning("%s: pasada parcial, no se retira nada de la BD", s.tienda)
        if vistos and not s.parcial:
            hueco = ",".join("?" * len(vistos))
            borrados = con.execute(
                "DELETE FROM producto WHERE tienda=? AND categoria=? AND id NOT IN (%s)" % hueco,
                [s.tienda, args.categoria] + vistos).rowcount
            con.commit()
            if borrados:
                log.info("%s: %d productos retirados (ya no estan en la tienda)", s.tienda, borrados)
        log.info("%s: %d productos guardados", s.tienda, len(vistos))
        total += len(vistos)

    print("\n--- resumen ---")
    print("productos guardados/actualizados: %d" % total)
    for tienda, motivo in bloqueadas:
        print("BLOQUEADA %-12s %s" % (tienda, motivo))
    filas = con.execute(
        "SELECT tienda, count(*) n, round(min(precio_por_kg),2) min_kg, "
        "round(max(precio_por_kg),2) max_kg FROM producto WHERE categoria=? GROUP BY tienda",
        (args.categoria,)).fetchall()
    for f in filas:
        # Las categorias en capsulas no tienen precio por kilo: min/max salen NULL.
        rango = ("  %s-%s EUR/kg" % (f["min_kg"], f["max_kg"])) if f["min_kg"] else ""
        print("  %-12s %3d productos%s" % (f["tienda"], f["n"], rango))


if __name__ == "__main__":
    main()
