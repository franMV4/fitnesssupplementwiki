"""Zumub. Su listado trae `CollectionPage` con su `ItemList` (nombre, URL e imagen,
sin precio) y sus fichas publican un `ProductGroup` JSON-LD con un `hasVariant` por
formato: nombre, sku, `size`, precio y disponibilidad.

Cambio del 2026-08-28: hasta hoy esto se leia por microdatos (itemprop), que es como lo
publicaba en agosto. Zumub se paso a JSON-LD y el modulo se quedo trayendo CERO fichas
sin un solo error en el log, mientras la web seguia enseñando lo scrapeado en la pasada
anterior. `core.microdatos` sigue en pie para la proxima tienda que los use.

Su robots.txt no prohibe nada. Pagina con `?page=N` y sirve 36 productos por pagina.

Sus categorias son anchas a proposito: nueve de las nuestras salen del mismo listado de
salud y bienestar y seis del de vitaminas y minerales. El filtro de nombre de
`categorias.py` es el que separa la ashwagandha de la melatonina, igual que ya hacia con
el colageno de Life Pro, y como se aplica ANTES de descargar cada ficha, una categoria
ancha no cuesta una peticion de mas.
"""

import logging

from ..core import Scraper, TiendaBloqueada, es_valido, fetch, ld_json, medida

log = logging.getLogger("scraper")

BASE = "https://www.zumub.com/ES/"
CATEGORIA_URL = {
    "creatina": BASE + "creatina",
    "preentreno": BASE + "pre-entrenamiento",
    "proteina_whey": BASE + "proteinas",
    "proteina_aislada": BASE + "proteinas",
    "caseina": BASE + "proteinas",
    "proteina_vegana": BASE + "proteinas",
    "bcaa": BASE + "aminoacidos-bcaas",
    "glutamina": BASE + "aminoacidos-bcaas",
    "eaa": BASE + "aminoacidos-bcaas",
    "beta_alanina": BASE + "aminoacidos-bcaas",
    "citrulina": BASE + "aminoacidos-bcaas",
    "carbohidratos": BASE + "carbohidratos",
    "ganador_peso": BASE + "ganadores-de-peso",
    "carnitina": BASE + "adelgazamiento-l-carnitina-c-83_80",
    "vitamina_d": BASE + "vitamina-d",
    "vitamina_c": BASE + "vitaminas-y-minerales",
    "vitamina_b12": BASE + "vitaminas-y-minerales",
    "magnesio": BASE + "vitaminas-y-minerales",
    "zinc": BASE + "vitaminas-y-minerales",
    "hierro": BASE + "vitaminas-y-minerales",
    "multivitaminico": BASE + "vitaminas-y-minerales",
    "omega3": BASE + "vitaminas-y-minerales",
    "colageno": BASE + "salud-y-bienestar",
    "ashwagandha": BASE + "salud-y-bienestar",
    "melatonina": BASE + "salud-y-bienestar",
    "curcuma": BASE + "salud-y-bienestar",
    "probioticos": BASE + "salud-y-bienestar",
    "glucosamina": BASE + "salud-y-bienestar",
    "zma": BASE + "salud-y-bienestar",
    "cafeina": BASE + "salud-y-bienestar",
}
PAGINAS = 4          # 36 productos por pagina
MAX_FICHAS = 40      # tope de fichas por categoria: mas es tiempo, no mas comparativa


class Zumub(Scraper):
    tienda = "zumub"
    categorias = tuple(CATEGORIA_URL)

    def extraer(self, categoria="creatina"):
        base = CATEGORIA_URL[categoria]
        urls = []
        for pagina in range(1, PAGINAS + 1):
            url = base if pagina == 1 else "%s?page=%d" % (base, pagina)
            html = fetch(url)
            listados = []
            for d in ld_json(html):
                if d.get("@type") == "CollectionPage":
                    listados += (d.get("mainEntity") or {}).get("itemListElement", [])
                elif d.get("@type") == "ItemList":
                    listados += d.get("itemListElement", [])
            # Sin `break`: la primera pagina de sus categorias anchas (salud-y-bienestar)
            # es una portada de subcategorias y no trae ni un producto en su JSON-LD, pero
            # ?page=2 en adelante si. Cortar ahi dejaba nueve categorias nuestras en cero
            # productos y sin un solo error en el log.
            if not listados:
                continue
            for li in listados:
                # El listado repite la misma ficha una vez por formato ("Creatina 500 g",
                # "Creatina 1 kg"): la URL es la misma y los formatos salen de dentro.
                if li.get("url") and es_valido(li.get("name"), categoria):
                    urls.append(li["url"])

        fuera = []
        for url in list(dict.fromkeys(urls))[:MAX_FICHAS]:
            try:
                pagina = fetch(url)
            except TiendaBloqueada as e:
                self.parcial = True
                log.warning("zumub: corta en %s (%s); %d productos traidos", url, e, len(fuera))
                break
            for grupo in ld_json(pagina):
                if grupo.get("@type") != "ProductGroup":
                    continue
                marca = grupo.get("brand")
                if isinstance(marca, dict):
                    marca = marca.get("name")
                for p in grupo.get("hasVariant") or []:
                    nombre = p.get("name") or ""
                    oferta = p.get("offers") if isinstance(p.get("offers"), dict) else {}
                    precio = oferta.get("price")
                    # El formato sale de la VARIANTE (su `size` y su nombre) y NUNCA de la
                    # URL: la ficha es una sola para todos los formatos, asi que el sobre
                    # monodosis de 30 g -que `gramos` descarta por ser una dosis- heredaba
                    # el kilo del bote y salia en la tabla a 1,23 EUR/kg, el primero del
                    # ranking. Sin formato propio, la variante no entra.
                    g, u = medida(p.get("size"), nombre, categoria=categoria)
                    if not ((g or u) and precio) or not es_valido(nombre, categoria):
                        continue
                    # El sku distingue los formatos: todos comparten la URL de la ficha y
                    # sin esto el upsert por (tienda, url) los machacaria unos a otros.
                    fuera.append(self.item(
                        marca=marca, nombre=nombre,
                        url="%s?sku=%s" % (url, p.get("sku")) if p.get("sku") else url,
                        formato_gramos=g, unidades=u, precio_eur=float(precio),
                        categoria=categoria, servicios=u, texto_extra=url,
                        imagen=p.get("image")))
        log.info("zumub: %s -> %d productos", categoria, len(fuera))
        return fuera
