"""Tres tiendas grandes que no publican listados legibles: DosFarma, Bulevip y Promofarma.

Las tres pintan sus categorias con JavaScript, asi que la pagina de listado llega vacia
de datos. Lo que si publican es el **sitemap** (obligado por SEO) y un `Product` JSON-LD
completo en cada ficha. Con eso basta: el sitemap dice que fichas hay y el nombre del
producto viaja en el slug de la URL, que es exactamente lo que el filtro de la categoria
sabe leer. Del sitemap salen las candidatas y solo se descargan las fichas que ya han
pasado el filtro.

El precio de esta via es que cuesta una peticion por producto, no una por categoria: por
eso hay un tope (`LIMITE`) de fichas por categoria y tienda. No es el catalogo entero de
la tienda; son sus primeros productos de esa categoria, que es lo que compara la tabla.

No sirve para una categoria sin filtro de nombre (preentreno): esa se apoya en que el
listado de la tienda ya la acota, y aqui no hay listado. Se salta y se dice en el log.

Anadir una tienda asi = una entrada en TIENDAS con su sitemap. Si un dia publica un
listado con datos, se mueve a listado.py y se descarga en una peticion en vez de quince.
"""

import logging
import re

import categorias

from ..core import Scraper, es_valido, fetch, ld_json, medida, raciones

log = logging.getLogger("scraper")

# Fichas por categoria y tienda. Cada una es una peticion, y el delay de core es de 2 s
# por host: 15 fichas son 30 segundos de descarga por categoria.
LIMITE = 15
# Sitemaps hijos que se abren como mucho, para no recorrer el sitemap entero de una
# farmacia (Promofarma tiene 77 hijos, y 70 son de bebes, cosmetica o veterinaria).
MAX_HIJOS = 8

TIENDAS = {
    # DosFarma: parafarmacia grande, con marca propia (Hivital) y mucha vitamina.
    "dosfarma": dict(
        indice="https://www.dosfarma.com/media/sitemap/dosfarma_es/sitemap-index.xml",
        hijos=r".*",
    ),
    # Bulevip: de las que mas vende en nutricion deportiva en Espana. Su ficha no
    # publica la marca en ningun campo, pero la URL la lleva de tramo
    # (/suplementacion-deportiva/optimum-nutrition/creatina-powder-317-gr).
    "bulevip": dict(
        indice="https://www.bulevip.com/xmls/sitemap.xml",
        hijos=r"products",
        marca_en_url=True,
    ),
    # Promofarma: marketplace de farmacias, con su propio sitemap por familia.
    "promofarma": dict(
        indice="https://www.promofarma.com/es/sitemaps/index.xml",
        hijos=r"deportiva|vitaminas|dietetica-nutricion|herbolario",
    ),
}


def _urls_del_sitemap(indice, patron_hijos, profundidad=2):
    """Todas las URLs de ficha que cuelgan de un sitemap, indice incluido.

    Baja por los indices anidados: Bulevip tiene DOS niveles (sitemap.xml ->
    sitemap-products-es_ES.xml -> sitemap-products-es_ES_1.xml), y quedarse en el
    primero devuelve cero fichas sin dar un solo error.
    """
    locs = re.findall(r"<loc>([^<]+)</loc>", fetch(indice))
    hijos = [u for u in locs if u.endswith((".xml", ".xml.gz"))]
    urls = [u for u in locs if u not in hijos]
    if not profundidad:
        return urls
    for hijo in [h for h in hijos if re.search(patron_hijos, h, re.I)][:MAX_HIJOS]:
        try:
            urls += _urls_del_sitemap(hijo, patron_hijos, profundidad - 1)
        except Exception as e:
            log.info("sitemap hijo ilegible %s (%s)", hijo, e)
    return urls


def _texto_de_url(url):
    """El slug de la ficha como frase, que es de donde sale el nombre del producto.

    Se cogen los DOS ultimos tramos y no solo el ultimo: Promofarma termina sus fichas
    en un identificador (`.../creatina-350gr/p-30376`) y quedarse con "p 30376" deja al
    filtro sin nada que leer.
    """
    tramos = [t for t in url.split("?")[0].rstrip("/").split("/")[3:] if t]
    texto = " ".join(tramos[-2:])
    texto = re.sub(r"\.html?", " ", texto)
    return texto.replace("-", " ").replace("_", " ")


def _precio(oferta):
    """El precio de UNA unidad. None si la ficha no lo dice.

    DosFarma publica un AggregateOffer con un precio por tramo de cantidad (24 EUR
    sueltas, 22,80 a partir de cinco). El comparador ensena lo que cuesta comprar uno,
    asi que se coge el tramo que empieza en 1 y no el `lowPrice`, que es el de mayorista.
    """
    if not isinstance(oferta, dict):
        return None
    if oferta.get("price") is not None:
        return oferta["price"]
    for o in oferta.get("offers", []) or []:
        cantidad = ((o.get("priceSpecification") or {}).get("eligibleQuantity") or {})
        if cantidad.get("minValue") in (1, "1", None):
            return o.get("price")
    return oferta.get("lowPrice")


def _extraer(self, categoria="creatina"):
    # Una categoria sin filtro de nombre (preentreno) se apoya en que el listado de la
    # tienda ya la acota. Aqui no hay listado: sin filtro, `es_valido` deja pasar el
    # sitemap entero y se guardarian 15 fichas al azar como si fueran preentrenos.
    if not categorias.config(categoria).get("filtro"):
        log.info("%s: %s no se puede acotar desde el sitemap, se salta", self.tienda, categoria)
        return []
    try:
        urls = _urls_del_sitemap(self.indice, self.patron_hijos)
    except Exception as e:
        log.error("%s: sitemap ilegible (%s)", self.tienda, e)
        return []
    # El filtro de la categoria decide sobre el slug ANTES de descargar nada: sin esto
    # habria que abrir las 40.000 fichas del sitemap para saber cuales son creatina.
    candidatas = [u for u in dict.fromkeys(urls) if es_valido(_texto_de_url(u), categoria)]
    log.info("%s: %d fichas candidatas de %d en el sitemap", self.tienda,
             len(candidatas), len(urls))

    fuera = []
    for url in candidatas:
        if len(fuera) >= LIMITE:
            break
        try:
            pagina = fetch(url)
            fichas = [d for d in ld_json(pagina) if d.get("@type") == "Product"]
        except Exception as e:
            log.info("%s: ficha ilegible %s (%s)", self.tienda, url, e)
            continue
        if not fichas:
            continue
        p = fichas[0]
        nombre = p.get("name") or ""
        precio = _precio(p.get("offers"))
        # El slug paso el filtro, pero el nombre de verdad manda: es el que se publica.
        if not (nombre and precio) or not es_valido(nombre, categoria):
            continue
        g, u = medida(nombre, url, categoria=categoria)
        if not (g or u):
            continue
        try:
            precio = float(precio)
        except (TypeError, ValueError):
            continue
        marca = p.get("brand")
        if isinstance(marca, dict):
            marca = marca.get("name")
        if not marca and self.marca_en_url:
            tramos = url.split("?")[0].rstrip("/").split("/")
            # El tramo viene en minusculas ("amix"): sin capitalizar seria otra marca
            # distinta de la "Amix" de las demas tiendas, con su propia pagina.
            marca = tramos[-2].replace("-", " ").title() if len(tramos) > 4 else None
        fuera.append(self.item(
            marca=marca, nombre=nombre, url=url, formato_gramos=g, unidades=u,
            precio_eur=precio, categoria=categoria, servicios=raciones(nombre) or u,
            texto_extra=url, imagen=p.get("image"), ld=p, pagina=pagina))
    return fuera


for _tienda, _cfg in TIENDAS.items():
    _nombre = _tienda.capitalize()
    globals()[_nombre] = type(_nombre, (Scraper,), dict(
        __doc__="Tienda leida por sitemap + ficha JSON-LD: %s." % _tienda,
        tienda=_tienda, indice=_cfg["indice"], patron_hijos=_cfg["hijos"],
        marca_en_url=_cfg.get("marca_en_url", False),
        # Estas tres pueden vender cualquiera de las 50: no hay mapa de categorias que
        # mantener, lo decide el filtro sobre el slug.
        categorias=tuple(categorias.CATEGORIAS),
        extraer=_extraer))
