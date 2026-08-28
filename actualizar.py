"""Ejecuta el ciclo entero: recoger, verificar, puntuar y exportar a la web.

    python actualizar.py

Es lo que hay que lanzar (a mano o desde una tarea programada) para refrescar el sitio.
Despues: cd web && npm run build
"""

import subprocess
import sys

import categorias
from data.db import cargar_dosis, connect, guardar_historico, init, limpiar_marcas
from exportar import exportar
from scoring.motor import recalcular

CATEGORIAS = list(categorias.CATEGORIAS)


def main():
    # Windows abre la consola en cp1252 y un nombre de producto con un caracter que
    # no sabe pintar (Amazon usa "≥" en los titulos) reventaba la pasada entera
    # con UnicodeEncodeError, despues de haber hecho el trabajo. Que pinte como pueda.
    sys.stdout.reconfigure(errors="replace")
    con = connect()
    init(con)
    # La tabla de dosis vive en data/dosis_referencia.json y hasta ahora solo se cargaba
    # ejecutando data/db.py a mano. Anadir una dosis nueva y olvidarse de ese paso deja la
    # categoria sin coste por dosis y sin la FAQ de "cuanto tomar", en silencio y con todo
    # lo demas funcionando. Es idempotente: cargarla en cada pasada no cuesta nada.
    print("dosis de referencia cargadas: %d" % cargar_dosis(con))
    for categoria in CATEGORIAS:
        print("\n=== scraper: %s ===" % categoria)
        subprocess.run([sys.executable, "run_scraper.py", "--categoria", categoria], check=True)

    print("\n=== verificacion de certificaciones ===")
    subprocess.run([sys.executable, "verificar.py", "auto"], check=True)

    con = connect()
    # Antes de puntuar y exportar: dejar la BD limpia y congelar el precio del dia.
    # El historico va DESPUES del scraper (necesita los precios de hoy) y ANTES del
    # export, para que la web del dia ya lleve la serie que se acaba de cerrar.
    print("\n=== mantenimiento ===")
    print("marcas normalizadas: %d" % limpiar_marcas(con))
    print("precios guardados en el historico: %d" % guardar_historico(con))

    print("\n=== scoring ===")
    print("%d productos puntuados" % recalcular(con))
    n, cats = exportar(con)
    print("%d productos exportados a la web (%s)" % (n, ", ".join(cats)))


if __name__ == "__main__":
    main()
