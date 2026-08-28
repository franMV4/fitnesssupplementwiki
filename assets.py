"""Genera los ficheros derivados de la marca: fuentes propias, favicon y og:image.

No es parte del pipeline de datos: se corre a mano cuando cambia la identidad, y lo
que produce se versiona.

    python assets.py            # todo
    python assets.py fuentes    # solo las fuentes
    python assets.py imagenes   # solo favicon, apple-touch-icon y og:image

Por que existe cada parte:

- **fuentes**: servir las tipografias desde Google carga una hoja de estilo que bloquea
  el pintado y manda la IP del lector a un tercero (que en la UE ya ha costado
  sentencias). Bajandolas una vez al repo se quita el viaje de red del LCP y el
  problema legal. Solo se guardan los subconjuntos latin y latin-ext: el espanol y los
  nombres de las tiendas caben ahi.
- **imagenes**: og:image y apple-touch-icon tienen que ser PNG (ni Facebook ni X ni iOS
  renderizan SVG). Pillow solo hace falta aqui, no en el pipeline.
"""

import pathlib
import re
import sys
import urllib.request

RAIZ = pathlib.Path(__file__).parent
PUBLICO = RAIZ / "web" / "public"
FUENTES = PUBLICO / "fuentes"
CSS_FUENTES = RAIZ / "web" / "src" / "estilos" / "fuentes.css"
JS_FUENTES = RAIZ / "web" / "src" / "estilos" / "fuentes.js"

# El mismo que pide Base.astro. Si cambia una tipografia, cambia aqui.
CSS_URL = ("https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800"
           "&family=IBM+Plex+Mono:wght@400;500"
           "&family=Big+Shoulders+Display:wght@700;800;900&display=swap")
# Con un UA moderno la API devuelve woff2; con uno antiguo, ttf (que es lo unico que
# sabe leer Pillow para la og:image).
UA_MODERNO = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
UA_ANTIGUO = "Mozilla/4.0"
SUBCONJUNTOS = ("latin", "latin-ext")
# Las caras que pinta la primera pantalla: el titular condensado y el cuerpo. Se
# exportan a fuentes.js para que Base.astro las precargue sin escribir a mano un
# nombre de fichero que Google renombra en cada revision de la fuente.
PRECARGA = (("DISPLAY", ("Big Shoulders Display", "normal", "900", "latin")),
            ("ARCHIVO", ("Archivo", "normal", "400", "latin")))

PAPEL = (239, 237, 230)
TINTA = (20, 18, 16)
SENAL = (222, 59, 15)
TINTA_2 = (58, 52, 44)


def bajar(url, ua=UA_MODERNO):
    return urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": ua}), timeout=30).read()


def fuentes():
    """Baja los woff2 de Google y escribe fuentes.css apuntando a /fuentes/."""
    FUENTES.mkdir(parents=True, exist_ok=True)
    css = bajar(CSS_URL).decode("utf-8")
    # La API emite siempre "/* subconjunto */" delante de cada @font-face.
    bloques = re.findall(r"/\*\s*([\w-]+)\s*\*/\s*(@font-face\s*\{.*?\})", css, re.S)
    salida, bajados, caras = [], 0, {}
    for subconjunto, bloque in bloques:
        if subconjunto not in SUBCONJUNTOS:
            continue
        url = re.search(r"src:\s*url\((https://[^)]+)\)", bloque).group(1)
        nombre = url.rsplit("/", 1)[-1]
        destino = FUENTES / nombre
        if not destino.is_file():
            destino.write_bytes(bajar(url))
            bajados += 1
        salida.append(bloque.replace(url, f"/fuentes/{nombre}"))
        cara = (re.search(r"font-family: '([^']+)'", bloque).group(1),
                re.search(r"font-style: (\w+)", bloque).group(1),
                re.search(r"font-weight: (\d+)", bloque).group(1),
                subconjunto)
        caras[cara] = f"/fuentes/{nombre}"
    # Las dos caras que pinta la primera pantalla, para precargarlas. Google cambia el
    # nombre del fichero cada vez que revisa una fuente: escrito a mano en el layout,
    # un dia el preload apuntaria a un 404 y nadie se enteraria.
    JS_FUENTES.write_text(
        "// Generado por assets.py. No editar a mano.\n"
        + "".join("export const %s = '%s';\n" % (nombre, caras[cara])
                  for nombre, cara in PRECARGA),
        encoding="utf-8")
    CSS_FUENTES.write_text(
        "/* Generado por assets.py. No editar a mano: se sobrescribe.\n"
        "   Tipografias servidas desde este dominio, no desde Google: quita un viaje\n"
        "   de red del pintado inicial y no manda la IP del lector a un tercero. */\n\n"
        + "\n\n".join(salida) + "\n", encoding="utf-8")
    print(f"{len(salida)} @font-face ({bajados} ficheros nuevos) -> fuentes.css + fuentes.js")


def _ttf(familia, peso):
    """Un TrueType de Google en memoria, para dibujar la og:image."""
    css = bajar(f"https://fonts.googleapis.com/css?family={familia}:{peso}",
                ua=UA_ANTIGUO).decode("utf-8")
    return bajar(re.search(r"url\((https?://[^)]+)\)", css).group(1))


def _marca(dibujo, x, y, alto, grosor, hueco):
    """El glifo: cuatro barras ascendentes y un filete rojo debajo.

    Es la misma figura que la tabla: la barra corta, la mas barata, es la que lleva la
    tinta roja. Se dibuja a mano para que el favicon y la og:image no se separen nunca.
    """
    for i in range(4):
        h = alto * (0.30 + 0.2333 * i)
        bx = x + i * (grosor + hueco)
        dibujo.rectangle([bx, y + alto - h, bx + grosor, y + alto], fill=TINTA)
    ancho = 4 * grosor + 3 * hueco
    base = max(2, round(alto * 0.08))
    dibujo.rectangle([x, y + alto + base, x + ancho, y + alto + base * 2], fill=SENAL)


def imagenes():
    from PIL import Image, ImageDraw, ImageFont
    import io

    PUBLICO.mkdir(parents=True, exist_ok=True)

    # apple-touch-icon: iOS no lee SVG y sin esto la pantalla de inicio guarda una
    # captura de la pagina en vez del icono.
    icono = Image.new("RGB", (180, 180), PAPEL)
    d = ImageDraw.Draw(icono)
    _marca(d, 34, 40, 84, 18, 10)
    icono.save(PUBLICO / "apple-touch-icon.png")

    display = ImageFont.truetype(io.BytesIO(_ttf("Big+Shoulders+Display", 900)), 104)
    texto = ImageFont.truetype(io.BytesIO(_ttf("Archivo", 400)), 31)
    rotulo = ImageFont.truetype(io.BytesIO(_ttf("Archivo", 500)), 22)

    og = Image.new("RGB", (1200, 630), PAPEL)
    d = ImageDraw.Draw(og)
    d.rectangle([0, 0, 1200, 22], fill=TINTA)
    _marca(d, 90, 96, 66, 15, 9)
    d.text((90, 196), "FITNESSSUPPLEMENT", font=display, fill=TINTA)
    d.text((90, 290), "WIKI", font=display, fill=SENAL)
    d.text((90, 410), "Suplementos comparados por precio por kilo", font=texto, fill=TINTA_2)
    d.text((90, 452), "y por lo comprobable que es su certificacion.", font=texto, fill=TINTA_2)
    d.rectangle([90, 528, 1110, 530], fill=TINTA)
    d.text((90, 548), "MERCADO ESPANOL   ·   SIN COMISIONES QUE MUEVAN EL ORDEN",
           font=rotulo, fill=TINTA_2)
    og.save(PUBLICO / "og.png", optimize=True)
    print("og.png y apple-touch-icon.png escritos en web/public/")


if __name__ == "__main__":
    que = sys.argv[1] if len(sys.argv) > 1 else "todo"
    if que in ("todo", "fuentes"):
        fuentes()
    if que in ("todo", "imagenes"):
        imagenes()
