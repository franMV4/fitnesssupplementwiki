"""Tres tiendas PrestaShop que publican microdatos: USA Fitness, Vitobest y TiendaCulturista.

Las tres usan el mismo motor de tienda pero no publican lo mismo en el mismo sitio:

  - **TiendaCulturista** trae el producto entero (nombre, marca, precio, imagen) en los
    microdatos del LISTADO: una peticion por categoria y pagina, como Nutritienda.
  - **Vitobest** publica lo mismo en el listado, pero ahi el precio va SIN IVA (30,27
    frente a los 33,30 que se pagan). El del comprador esta en los microdatos de la
    ficha, asi que su listado sirve para saber que fichas hay y con que formato, y el
    precio se lee dentro: `precio_en_ficha`. Multiplicar por 1,10 seria adivinar el tipo
    de IVA de cada producto, y esta tienda tambien vende cosmetica.
  - **USA Fitness** publica en el listado un ItemList JSON-LD con nombre y URL pero sin
    precio, y el precio esta en los microdatos de la ficha: listado -> fichas, como
    Life Pro y Myprotein.

De ahi los dos modos. Lo demas (paginar, filtrar por categoria, medir el formato) es
identico, asi que va escrito una vez.

Vitobest es tienda de una sola marca, como iO.GENIX: su marca es constante y sus
categorias son anchas (una para todos los aminoacidos, otra para todos los minerales).
Las separa el filtro de cada categoria, igual que ya pasa con Nutritienda.
"""

import logging

from ..core import Scraper, es_valido, fetch, ld_json, medida, microdatos, raciones
from .amazon import _marca

log = logging.getLogger("scraper")

PAGINAS = 3          # 10-12 productos por pagina en las tres

USAFITNESS = "https://usafitness.es/"
CULTURISTA = "https://www.tiendaculturista.com/"
VITOBEST = "https://www.vitobest.com/es/"

TIENDAS = {
    # Multimarca, catalogo de gimnasio. Sus slugs son planos: usafitness.es/<slug>.
    "usafitness": dict(modo="ficha", base=USAFITNESS, categorias={
        "creatina": "creatina",
        "proteina_whey": "proteina-whey",
        "caseina": "caseina",
        "ganador_peso": "ganadores-de-peso",
        "bcaa": "aminoacidos",
        "eaa": "aminoacidos",
        "arginina": "arginina",
        "glutamina": "glutamina",
        "beta_alanina": "beta-alanina",
        "hmb": "hmb",
        "tribulus": "tribulus",
        "carbohidratos": "carbohidratos",
        "colageno": "colageno",
        "omega3": "omega-3",
        "cla": "cla",
        "magnesio": "magnesio",
        "zinc": "zinc",
        "glucosamina": "articulaciones",
    }),
    # Marca propia. Sus categorias llevan el id delante y no se pueden adivinar.
    "vitobest": dict(modo="listado", precio_en_ficha=True, base=VITOBEST, categorias={
        "creatina": "36-creatinas-vitobest",
        "preentreno": "44-entrenos-vitobest",
        "proteina_whey": "40-proteinas-vitobest",
        "proteina_aislada": "40-proteinas-vitobest",
        "proteina_vegana": "40-proteinas-vitobest",
        "caseina": "40-proteinas-vitobest",
        "bcaa": "35-aminoacidos-vitobest",
        "eaa": "35-aminoacidos-vitobest",
        "glutamina": "35-aminoacidos-vitobest",
        "arginina": "35-aminoacidos-vitobest",
        "taurina": "35-aminoacidos-vitobest",
        "beta_alanina": "35-aminoacidos-vitobest",
        "citrulina": "35-aminoacidos-vitobest",
        "carnitina": "35-aminoacidos-vitobest",
        "hmb": "35-aminoacidos-vitobest",
        "carbohidratos": "42-carbohidratos-vitobest",
        "omega3": "47-acidos-grasos-omega-vitobest",
        "cla": "47-acidos-grasos-omega-vitobest",
        "colageno": "175-colagenos",
        "glucosamina": "127-productos-articulaciones-Vitobest",
        "multivitaminico": "39-vitaminas-vitobest",
        "vitamina_c": "39-vitaminas-vitobest",
        "vitamina_d": "39-vitaminas-vitobest",
        "vitamina_e": "39-vitaminas-vitobest",
        "vitamina_k2": "39-vitaminas-vitobest",
        "vitamina_b12": "39-vitaminas-vitobest",
        "complejo_b": "39-vitaminas-vitobest",
        "magnesio": "74-minerales-vitobest",
        "zinc": "74-minerales-vitobest",
        "hierro": "74-minerales-vitobest",
        "calcio": "74-minerales-vitobest",
        "potasio": "74-minerales-vitobest",
        "selenio": "74-minerales-vitobest",
        "zma": "74-minerales-vitobest",
        "quemagrasas": "46-control-de-peso-vitobest",
        "maca": "59-plantas-vitobest",
        "tribulus": "59-plantas-vitobest",
        "ashwagandha": "59-plantas-vitobest",
        "curcuma": "59-plantas-vitobest",
        "espirulina": "59-plantas-vitobest",
        "te_verde": "59-plantas-vitobest",
        "coenzima_q10": "150-antioxidantes",
        "melatonina": "171-trastorno-del-sueno",
        "cafeina": "162-energia",
        "probioticos": "160-digestion",
        "triptofano": "161-emocional",
        "colina": "156-concentracion",
        "acido_hialuronico": "165-cabello-piel-y-unas",
    }),
    # TiendaCulturista: multimarca de gimnasio. Sus categorias llevan el id detras
    # ("creatina-3") y salen del sitemap, no se pueden adivinar.
    "tiendaculturista": dict(modo="listado", base=CULTURISTA, categorias={
        "creatina": "creatina-3",
        "preentreno": "PREENTRENO-39",
        "proteina_whey": "proteina-4",
        "proteina_aislada": "aislados-de-suero-27",
        "proteina_vegana": "productos-veganos-103",
        "caseina": "caseina-106",
        "bcaa": "aminoacidos-bcaa-108",
        "eaa": "eaa-y-map-109",
        "glutamina": "glutamina-110",
        "beta_alanina": "aminoacidos-aislados-107",
        "citrulina": "aminoacidos-aislados-107",
        "arginina": "aminoacidos-aislados-107",
        "taurina": "aminoacidos-aislados-107",
        "hmb": "aminoacidos-aislados-107",
        "carbohidratos": "carbohidratos-alto-nivel-glucemico-111",
        "multivitaminico": "multivitaminicos-129",
        "tribulus": "tribulus-124",
        "zma": "zma-125",
        "quemagrasas": "QUEMAGRASAS-8",
        "carnitina": "QUEMAGRASAS-8",
        "cla": "QUEMAGRASAS-8",
        "vitamina_c": "vitaminas-127",
        "vitamina_d": "vitaminas-127",
        "vitamina_e": "vitaminas-127",
        "vitamina_k2": "vitaminas-127",
        "vitamina_b12": "vitaminas-127",
        "complejo_b": "vitaminas-127",
        "magnesio": "vitaminas-minerales-38",
        "zinc": "vitaminas-minerales-38",
        "hierro": "vitaminas-minerales-38",
        "calcio": "vitaminas-minerales-38",
        "potasio": "vitaminas-minerales-38",
        "selenio": "vitaminas-minerales-38",
    }),
}


def _producto(md):
    """(nombre, url, precio, marca, imagen) de un Product en microdatos."""
    ofertas = md.get("offers")
    if isinstance(ofertas, list):
        ofertas = ofertas[0] if ofertas else {}
    ofertas = ofertas or {}
    return (md.get("name"), md.get("url") or ofertas.get("url"),
            ofertas.get("price"), md.get("brand"), md.get("image"))


def _extraer(self, categoria="creatina"):
    ruta = self.rutas[categoria]
    fuera, vistos = [], set()
    for pagina in range(1, PAGINAS + 1):
        url = self.base + ruta + ("" if pagina == 1 else "?page=%d" % pagina)
        try:
            html = fetch(url)
        except Exception as e:                      # una pagina que no existe no es un fallo
            log.info("%s: %s se corta en la pagina %d (%s)", self.tienda, ruta, pagina, e)
            break

        if self.modo == "listado":
            crudos = [_producto(m) for m in microdatos(html, "Product")]
            if self.precio_en_ficha:              # el del listado no es el que se paga
                crudos = [(n, u, None, m, i) for n, u, _, m, i in crudos]
        else:
            crudos = []
            for d in ld_json(html):
                if d.get("@type") != "ItemList":
                    continue
                for li in d.get("itemListElement", []):
                    p = li.get("item") or li
                    if p.get("url") and es_valido(p.get("name"), categoria):
                        crudos.append((p.get("name"), p["url"], None, None, None))

        if not crudos:
            break
        nuevos = 0
        for nombre, purl, precio, marca, imagen in crudos:
            if not purl or purl in vistos:
                continue
            vistos.add(purl)
            nuevos += 1
            # Solo hay Product de ESTE producto cuando se descarga su ficha: del
            # listado no se puede sacar la nota sin mezclarla con la del vecino.
            ficha_ld = None
            if precio is None:                      # el precio esta dentro de la ficha
                try:
                    ficha = microdatos(fetch(purl), "Product")
                except Exception as e:
                    log.info("%s: ficha ilegible %s (%s)", self.tienda, purl, e)
                    continue
                if not ficha:
                    continue
                # La ficha trae tambien los productos que recomienda al lado. El bueno es
                # el que se llama como el del listado; si no, el primero.
                mismo = [f for f in ficha if f.get("name") == nombre]
                ficha_ld = (mismo or ficha)[0]
                n2, _, precio, marca2, imagen2 = _producto(ficha_ld)
                nombre, marca, imagen = n2 or nombre, marca or marca2, imagen or imagen2
            if not (nombre and precio) or not es_valido(nombre, categoria):
                continue
            # PrestaShop cuelga el formato del fragmento de la URL
            # (#/38-tamano-500_g), y el guion bajo separa cifra y unidad.
            g, u = medida(nombre, purl.replace("_", " "), categoria=categoria)
            if not (g or u):
                continue
            try:
                precio = float(precio)
            except (TypeError, ValueError):
                continue
            if isinstance(marca, dict):
                marca = marca.get("name")
            fuera.append(self.item(
                marca=marca or self.marca_fija or _marca(nombre), nombre=nombre, url=purl,
                formato_gramos=g, unidades=u, precio_eur=precio, categoria=categoria,
                servicios=raciones(nombre) or u, texto_extra=purl, imagen=imagen,
                ld=ficha_ld))
        if nuevos == 0:                             # la paginacion repite: no hay mas
            break
    return fuera


# Igual que en shopify.py: las clases se fabrican para no dejar una clase base a medias
# en el modulo, que `run_scraper.descubre` instanciaria como si fuera una tienda.
for _tienda, _cfg in TIENDAS.items():
    _nombre = _tienda.capitalize()
    globals()[_nombre] = type(_nombre, (Scraper,), dict(
        __doc__="Tienda PrestaShop %s (modo %s)." % (_tienda, _cfg["modo"]),
        tienda=_tienda, base=_cfg["base"], modo=_cfg["modo"], rutas=_cfg["categorias"],
        # Vitobest solo vende su marca; USA Fitness es multimarca y la saca del titulo.
        marca_fija="Vitobest" if _tienda == "vitobest" else None,
        precio_en_ficha=_cfg.get("precio_en_ficha", False),
        categorias=tuple(_cfg["categorias"]), extraer=_extraer))
