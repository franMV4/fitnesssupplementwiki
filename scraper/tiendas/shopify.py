"""Las cinco tiendas que corren sobre Shopify, en un solo modulo.

Shopify publica el catalogo de cada coleccion en JSON sin pedir permiso ni parsear
HTML: `/collections/<handle>/products.json`. Trae titulo, marca (`vendor`), imagen y
**una variante por formato** con su precio, que es justo lo que necesita el comparador.
Una peticion por categoria y tienda, igual que el listado de Nutritienda.

ponytail: cinco modulos identicos serian seis sitios donde arreglar el mismo fallo. Lo
unico que cambia entre estas tiendas es el dominio y como llaman a sus colecciones, asi
que eso es lo unico que hay escrito aqui: la tabla TIENDAS. Las clases se generan al
final del fichero y `run_scraper` las descubre igual que a las demas.

Anadir otra tienda de Shopify = una linea en TIENDAS. Para saber sus handles:
`https://<dominio>/collections.json?limit=250` (y `&page=2` si tiene mas de 250).

Weider.es se probo y se descarto el 2026-08-31: su Shopify contesta con todo el
catalogo a 0,00 EUR (es escaparate de marca, no vende al publico), y un producto sin
precio no se puede comparar. En su sitio entro TiendaCulturista, que si publica precio
(va en listado.py, que es donde le toca por como lo publica).

Un handle puede repetirse en varias categorias a proposito: cuando la tienda no separa
(Sotya mete vitaminas y minerales en el mismo listado), el filtro de la categoria es el que
decide que entra, igual que ya pasa con los minerales de Nutritienda.
"""

import json
import logging

from ..core import Scraper, es_valido, fetch, medida, raciones

log = logging.getLogger("scraper")

# Hasta 250 productos por peticion, dos paginas por coleccion. Ninguna de estas
# colecciones pasa de 500 botes; si alguna crece, sube esto y no otra cosa.
POR_PAGINA = 250
PAGINAS = 2

TIENDAS = {
    # Holland & Barrett Espana: la mas surtida de las cinco en vitaminas y minerales.
    "hollandbarrett": ("https://www.hollandandbarrett.es", {
        "creatina": "creatina",
        "preentreno": "pre-entreno",
        "proteina_whey": "proteina-de-suero",
        "proteina_aislada": "proteina-de-suero",
        "proteina_vegana": "proteina-vegetal",
        "caseina": "caseina",
        "bcaa": "bcaa",
        "eaa": "aminoacidos",
        "glutamina": "glutamina",
        "colageno": "colageno",
        "omega3": "aceite-de-pescado",
        "multivitaminico": "multivitaminas",
        "magnesio": "magnesio",
        "zinc": "zinc",
        "hierro": "hierro",
        "calcio": "calcio",
        "potasio": "potasio",
        "selenio": "selenio",
        "vitamina_c": "vitamina-c",
        "vitamina_d": "vitamina-d",
        "vitamina_e": "vitamina-e",
        "vitamina_k2": "vitamina-k2",
        "complejo_b": "vitamina-b",
        "coenzima_q10": "co-enzima-q10",
        "espirulina": "espirulina",
        "te_verde": "tes-verde",
        "curcuma": "curcuma",
        "glucosamina": "glucosamina",
        "melatonina": "sueno",
        "quemagrasas": "control-de-peso",
    }),
    # Crown Sport Nutrition: marca propia, catalogo corto y con certificado antidoping.
    "crown": ("https://crownsportnutrition.com", {
        "creatina": "creatina",
        "proteina_whey": "proteinas-y-aminoacidos",
        "proteina_aislada": "proteinas-y-aminoacidos",
        "proteina_vegana": "vegan-pro-line",
        "bcaa": "proteinas-y-aminoacidos",
        "eaa": "proteinas-y-aminoacidos",
        "glutamina": "proteinas-y-aminoacidos",
        "preentreno": "potenciadores-de-rendimiento",
        "beta_alanina": "potenciadores-de-rendimiento",
        "citrulina": "potenciadores-de-rendimiento",
        "carbohidratos": "hidratacion-y-energia",
        "potasio": "hidratacion-y-energia",
    }),
    # Quamtrax: la que mas categorias de las 50 cubre por si sola.
    "quamtrax": ("https://www.quamtrax.com", {
        "creatina": "creatina",
        "preentreno": "pre-entreno",
        "proteina_whey": "concentrada",
        "proteina_aislada": "aislada",
        "proteina_vegana": "vegetal",
        "caseina": "caseinas",
        "ganador_peso": "ganadores-de-masa",
        "bcaa": "bcaas",
        "eaa": "esenciales",
        "glutamina": "glutamina",
        "beta_alanina": "betalanina",
        "citrulina": "l-citrulina-malato",
        "carbohidratos": "carbohidratos",
        "carnitina": "l-carnitina",
        "arginina": "arginina",
        "hmb": "pro-hmb",
        "cla": "cla",
        "colageno": "colagenos",
        "omega3": "acidos-grasos",
        "probioticos": "probioticos",
        "multivitaminico": "vitaminas",
        "vitamina_c": "vitaminas",
        "vitamina_d": "vitaminas",
        "vitamina_e": "vitaminas",
        "complejo_b": "vitaminas",
        "magnesio": "minerales",
        "zinc": "minerales",
        "hierro": "minerales",
        "calcio": "minerales",
        "potasio": "minerales",
        "selenio": "minerales",
        "melatonina": "sueno",
        "quemagrasas": "termogenicos",
    }),
    # Sotya: herbolario con marca propia; sus plantas y vitaminas van en listados
    # comunes y los separa el filtro de cada categoria.
    "sotya": ("https://www.sotya.com", {
        "proteina_whey": "whey-protein",
        "proteina_vegana": "soy-protein",
        "colageno": "colagenos",
        "omega3": "omegas",
        "magnesio": "magnesios",
        "glucosamina": "articulaciones-y-huesos",
        "probioticos": "sistema-digestivo",
        "melatonina": "descanso-profundo",
        "quemagrasas": "control-de-peso",
        "multivitaminico": "vitaminas-y-minerales",
        "vitamina_c": "vitaminas-y-minerales",
        "vitamina_d": "vitaminas-y-minerales",
        "vitamina_e": "vitaminas-y-minerales",
        "vitamina_k2": "vitaminas-y-minerales",
        "complejo_b": "vitaminas-y-minerales",
        "zinc": "vitaminas-y-minerales",
        "hierro": "vitaminas-y-minerales",
        "calcio": "vitaminas-y-minerales",
        "selenio": "vitaminas-y-minerales",
        "potasio": "vitaminas-y-minerales",
        "espirulina": "plantas-medicinales",
        "maca": "plantas-medicinales",
        "te_verde": "plantas-medicinales",
        "ashwagandha": "plantas-medicinales",
        "curcuma": "plantas-medicinales",
        "tribulus": "plantas-medicinales",
    }),
    # 226ERS: nutricion de resistencia; poco bote de gimnasio y mucha sal mineral.
    "226ers": ("https://www.226ers.com", {
        "creatina": "creatina",
        "preentreno": "pre-entrenos",
        "proteina_whey": "proteinas",
        "proteina_vegana": "proteinas",
        "bcaa": "suplementos-bcaa",
        "eaa": "aminoacidos",
        "potasio": "sales-minerales-electrolitos",
        "multivitaminico": "vitaminas-para-deportistas",
    }),
}


def _extraer(self, categoria="creatina"):
    handle = self.colecciones[categoria]
    fuera, vistos = [], set()
    for pagina in range(1, PAGINAS + 1):
        url = "%s/collections/%s/products.json?limit=%d&page=%d" % (
            self.base, handle, POR_PAGINA, pagina)
        try:
            productos = json.loads(fetch(url)).get("products", [])
        except json.JSONDecodeError:
            # Un handle que ya no existe devuelve la pagina de error, no un JSON.
            log.warning("%s: la coleccion %s no contesta JSON", self.tienda, handle)
            break
        if not productos:
            break
        for p in productos:
            for v in p.get("variants", []):
                # El titulo de la variante es el formato ("1 kg", "500 g", "90 caps").
                # "Default Title" es como Shopify llama a no tener variantes.
                etiqueta = (v.get("title") or "").strip()
                nombre = p.get("title") or ""
                if etiqueta and etiqueta.lower() != "default title":
                    nombre = "%s %s" % (nombre, etiqueta)
                precio = v.get("price")
                if not (nombre and precio) or not es_valido(nombre, categoria):
                    continue
                # Una ficha por variante: el mismo bote en dos formatos son dos
                # precios distintos, y el upsert va por (tienda, url).
                purl = "%s/products/%s" % (self.base, p.get("handle"))
                if len(p.get("variants", [])) > 1:
                    purl += "?variant=%s" % v.get("id")
                if purl in vistos:
                    continue
                g, u = medida(nombre, etiqueta, purl, categoria=categoria)
                if not (g or u):
                    continue
                try:
                    precio = float(precio)
                except (TypeError, ValueError):
                    continue
                if precio <= 0:            # variante agotada o de regalo
                    continue
                vistos.add(purl)
                imagenes = p.get("images") or []
                fuera.append(self.item(
                    marca=p.get("vendor"), nombre=nombre, url=purl,
                    formato_gramos=g, unidades=u, precio_eur=precio,
                    categoria=categoria, servicios=raciones(nombre) or u,
                    texto_extra=purl,
                    imagen=imagenes[0].get("src") if imagenes else None))
        if len(productos) < POR_PAGINA:
            break
    return fuera


# Las clases se fabrican aqui para que no exista una clase base a medio hacer en el
# modulo: `run_scraper.descubre` instancia TODA subclase de Scraper que encuentre.
for _tienda, (_base, _cols) in TIENDAS.items():
    _nombre = _tienda.capitalize().replace("226", "Doscientos26")
    globals()[_nombre] = type(_nombre, (Scraper,), dict(
        __doc__="Tienda Shopify %s." % _tienda,
        tienda=_tienda, base=_base, colecciones=_cols,
        categorias=tuple(_cols), extraer=_extraer))
