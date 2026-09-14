"""Avisa a Bing (y a Yandex, Seznam...) por IndexNow de las URLs que han cambiado.

    python indexnow.py                  # lastmod de los ultimos 2 dias
    python indexnow.py --desde 2026-09-01
    python indexnow.py --todo           # todo el sitemap (solo la primera vez)

Se lanza DESPUES de que Cloudflare haya publicado el push, no antes: lee el sitemap del
dominio, no el de disco. Asi solo se avisa de lo que ya esta en linea y es indexable (las
fichas con noindex no estan en el sitemap), y el buscador encuentra la clave cuando va a
comprobarla. La clave vive en web/public/<clave>.txt; no es secreta, es publica por diseno.
"""

import json
import re
import sys
import urllib.request
from datetime import date, timedelta

SITIO = "https://fitnesssupplementwiki.com"
HOST = "fitnesssupplementwiki.com"
CLAVE = "0f0dbd7d1cdf416aa2e21ca9125f8d74"
LOTE = 10000  # maximo de URLs por peticion que admite el protocolo

_URL = re.compile(r"<(?:url|sitemap)>\s*<loc>([^<]+)</loc>(?:\s*<lastmod>([^<]+)</lastmod>)?")


def entradas(xml):
    """[(loc, lastmod o None)] de un sitemap o de un indice de sitemaps."""
    return [(loc, mod or None) for loc, mod in _URL.findall(xml)]


def recientes(pares, desde):
    """URLs con lastmod >= desde. Sin lastmod no se sabe si cambio: se avisa igual.
    Las fechas ISO se comparan como texto (y '2026-09-13T10:00' >= '2026-09-13')."""
    return [loc for loc, mod in pares if desde is None or mod is None or mod >= desde]


def bajar(url):
    # Cloudflare responde 403 al User-Agent por defecto de urllib ("Python-urllib").
    pet = urllib.request.Request(url, headers={"User-Agent": "FitnessSupplementWiki-indexnow"})
    with urllib.request.urlopen(pet, timeout=30) as r:
        return r.read().decode("utf-8")


def main(args):
    if "--todo" in args:
        desde = None
    elif "--desde" in args:
        desde = args[args.index("--desde") + 1]
    else:
        desde = (date.today() - timedelta(days=2)).isoformat()

    if bajar(f"{SITIO}/{CLAVE}.txt").strip() != CLAVE:
        sys.exit("La clave no esta publicada todavia: espera a que acabe el despliegue.")

    urls = []
    for sitemap, _ in entradas(bajar(f"{SITIO}/sitemap.xml")):
        urls += recientes(entradas(bajar(sitemap)), desde)
    if not urls:
        print("Nada que avisar desde", desde)
        return

    for i in range(0, len(urls), LOTE):
        cuerpo = json.dumps({"host": HOST, "key": CLAVE,
                             "keyLocation": f"{SITIO}/{CLAVE}.txt",
                             "urlList": urls[i:i + LOTE]}).encode()
        pet = urllib.request.Request("https://api.indexnow.org/indexnow", data=cuerpo,
                                     headers={"Content-Type": "application/json; charset=utf-8"})
        with urllib.request.urlopen(pet, timeout=60) as r:
            # 200 recibido, 202 recibido y clave pendiente de comprobar. Lo demas lanza.
            print(f"{len(urls[i:i + LOTE])} URLs enviadas -> HTTP {r.status}")


if __name__ == "__main__":
    main(sys.argv[1:])
