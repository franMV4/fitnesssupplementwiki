"""iO.GENIX. La tienda oficial de la marca (PrestaShop), la novena.

No publica `Product` ni en JSON-LD ni en microdatos: de schema.org solo emite
`Organization` y el `BreadcrumbList`. Pero su rejilla de categoria trae, por producto y
en atributos pensados para maquinas, todo lo que hace falta -nombre, precio sin formatear
(`content="29.85"`), imagen y URL-, asi que se lee de ahi: una peticion por categoria y
ni una ficha que descargar.

Es la tienda de UNA marca, asi que la marca es constante. Su categoria "otras marcas" no
se mapea justo por eso: seria la unica en la que esa constante mentiria.
"""

import html as _html
import logging
import re

from ..core import Scraper, es_valido, fetch, medida

log = logging.getLogger("scraper")

BASE = "https://tienda.iogenixnutrition.com/"
MARCA = "iO.GENIX"
CATEGORIA_URL = {
    # Solo las que vende de verdad: no lista EAA, beta-alanina ni ashwagandha,
    # y mapear una categoria a un listado que no la tiene es una peticion tirada.
    "creatina": BASE + "176-creatinas",
    "preentreno": BASE + "383-pre-entrenos",
    "proteina_whey": BASE + "159-proteinas",
    "proteina_aislada": BASE + "159-proteinas",
    "caseina": BASE + "159-proteinas",
    "proteina_vegana": BASE + "159-proteinas",
    "bcaa": BASE + "162-aminoacidos",
    "glutamina": BASE + "162-aminoacidos",
    "citrulina": BASE + "162-aminoacidos",
    "carbohidratos": BASE + "161-carbohidrtaos-de-asimilacion-rapida",
    "ganador_peso": BASE + "160-subidores-de-peso-limpios",
    "carnitina": BASE + "164-control-de-peso-y-termogenicos",
    "colageno": BASE + "177-colageno",
    "omega3": BASE + "179-acidos-grasos",
    "multivitaminico": BASE + "180-vitaminas-y-minerales",
    "vitamina_d": BASE + "180-vitaminas-y-minerales",
    "vitamina_c": BASE + "180-vitaminas-y-minerales",
    "vitamina_b12": BASE + "180-vitaminas-y-minerales",
    "magnesio": BASE + "195-salud-y-bienestar",
    "zinc": BASE + "180-vitaminas-y-minerales",
    "hierro": BASE + "180-vitaminas-y-minerales",
    "zma": BASE + "195-salud-y-bienestar",
    "melatonina": BASE + "370-nutraceuticals",
    "curcuma": BASE + "180-vitaminas-y-minerales",
    "probioticos": BASE + "195-salud-y-bienestar",
    "glucosamina": BASE + "195-salud-y-bienestar",
    "cafeina": BASE + "164-control-de-peso-y-termogenicos",
}

# Cada tarjeta de la rejilla. El carrusel de destacados que la tienda repite IGUAL en
# todas las categorias vive fuera de estos bloques y usa <h6 class="product-title">, no
# <h3>: por eso el nombre se busca con el h3 y no entran once productos de relleno en
# cada categoria.
TARJETA = 'class="js-product-miniature-wrapper'
NOMBRE = re.compile(r'class="h3 product-title">\s*<a[^>]*>(.*?)</a>', re.S)
PRECIO = re.compile(r'class="product-price"[^>]*content="([\d.]+)"')
ENLACE = re.compile(r'<a href="(https://tienda\.iogenixnutrition\.com/[^"]+?\.html)([^"]*)"')
IMAGEN = re.compile(r'data-src="(https://tienda\.iogenixnutrition\.com/[^"]+?\.jpg)"')


class Iogenix(Scraper):
    tienda = "iogenix"
    categorias = tuple(CATEGORIA_URL)

    def extraer(self, categoria="creatina"):
        pagina = fetch(CATEGORIA_URL[categoria])     # sin paginar: sirve la categoria entera
        fuera = []
        for bloque in pagina.split(TARJETA)[1:]:
            nombre, precio, enlace = (NOMBRE.search(bloque), PRECIO.search(bloque),
                                      ENLACE.search(bloque))
            if not (nombre and precio and enlace):
                continue
            nombre = _html.unescape(nombre.group(1)).strip()
            if not es_valido(nombre, categoria):
                continue
            url, variante = enlace.group(1), enlace.group(2)
            # PrestaShop cuelga la variante del fragmento (#/3898-formatos-300_g). Es el
            # unico sitio donde consta el formato de lo que no lo lleva en el nombre
            # ("iO.CREATINE"); el guion bajo separa cifra y unidad y `gramos` no lo espera.
            g, u = medida(nombre, variante.replace("_", " "), categoria=categoria)
            if not (g or u):
                continue                       # sin formato no hay con que compararlo
            imagen = IMAGEN.search(bloque)
            fuera.append(self.item(
                # El fragmento va en la URL a proposito: distingue dos formatos del mismo
                # producto, que comparten el .html, para el upsert por (tienda, url).
                marca=MARCA, nombre=nombre, url=url + variante,
                formato_gramos=g, unidades=u, precio_eur=float(precio.group(1)),
                categoria=categoria, servicios=u, texto_extra=url,
                imagen=imagen.group(1) if imagen else None))
        log.info("iogenix: %s -> %d productos", categoria, len(fuera))
        return fuera
