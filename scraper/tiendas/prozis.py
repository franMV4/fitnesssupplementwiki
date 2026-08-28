"""Prozis. Desbloqueada el 2026-08-20: robots.txt, sitemap y fichas responden 200 a
nuestro UA honesto. Lo que fallaba eran dos cosas nuestras, no un bloqueo suyo:

  1. La URL de categoria estaba incompleta (le faltaba /desarrollo-muscular) y daba 403.
  2. Prozis envuelve su JSON-LD en /*<![CDATA[*/ y json.loads lo rechazaba; ld_json lo
     descartaba en silencio, asi que la ficha parecia no tener datos. Arreglado en core.

Sus LISTADOS de categoria si son JS puro: 48 KB sin un solo enlace a producto ni JSON-LD.
Las URLs salen del sitemap de productos, que es publico y esta anunciado en su robots.txt:
es la unica tienda que se descubre asi, y por eso cada categoria es un patron de slug y
no una URL de listado.

Sigue limitando por rate: una rafaga de peticiones devuelve 429. El DELAY_S de core basta;
si aun asi devuelve 429, fetch lanza TiendaBloqueada y run_scraper lo documenta, que es el
comportamiento correcto.
"""

import logging
import re

from ..core import (Scraper, TiendaBloqueada, es_valido, fetch, ld_json, medida,
                    raciones)

log = logging.getLogger("scraper")

SITEMAP = "https://www.prozis.com/es/es/sitemap_products.gz"
# El sitemap trae las ~1900 fichas del catalogo espanol. Filtrar por el slug antes de
# descargar nada evita cientos de peticiones inutiles a una tienda que limita por rate.
SLUG_CATEGORIA = {
    "creatina": r"creatin",
    "preentreno": r"pre-?workout|pre-?entrenamiento",
    "proteina_whey": r"whey|proteina",
    "proteina_aislada": r"isolate|aislad",
    "bcaa": r"bcaa",
    "glutamina": r"glutamin",
    "colageno": r"colageno|collagen",
    "omega3": r"omega-3|fish-oil|aceite-de-pescado|krill",
    "multivitaminico": r"multivitamin",
    # --- los 30 mas vendidos (2026-08-25) ---
    "proteina_vegana": r"vegan|vegetal|guisante|pea-protein|soy|soja",
    "caseina": r"casein",
    "ganador_peso": r"gainer|mass\b",
    "eaa": r"\beaa|essential-amino",
    "beta_alanina": r"beta-alanin",
    "citrulina": r"citrullin|citrulina",
    "carbohidratos": r"maltodextrin|dextrose|amylopectin|waxy|carb",
    "magnesio": r"magnesi",
    "zinc": r"zinc",
    "hierro": r"\biron\b|hierro|ferro",
    "vitamina_d": r"vitamin-d|vitamina-d",
    "vitamina_c": r"vitamin-c|vitamina-c",
    "vitamina_b12": r"b12",
    "zma": r"\bzma\b",
    "ashwagandha": r"ashwagandha",
    "melatonina": r"melatonin",
    "cafeina": r"caffeine|cafeina",
    "probioticos": r"probiotic",
    "curcuma": r"curcum|turmeric",
    "glucosamina": r"glucosamin|chondroitin|\bmsm\b",
    "carnitina": r"carnitin",
}


class Prozis(Scraper):
    tienda = "prozis"
    categorias = tuple(SLUG_CATEGORIA)

    def extraer(self, categoria="creatina"):
        xml = fetch(SITEMAP)                         # lanza TiendaBloqueada si 429
        slug = re.compile(SLUG_CATEGORIA[categoria], re.I)
        # El slug ya trae el formato ("...-900-g", "...-120-softgels"). Descartar aqui lo
        # que no lo trae ahorra decenas de peticiones a una tienda que limita por ratio:
        # sin formato el producto se acabaria tirando igual, pero despues de descargarlo.
        urls = [u for u in re.findall(r"<loc>(.*?)</loc>", xml)
                if slug.search(u) and es_valido(u, categoria)
                and any(medida(u, categoria=categoria))]

        fuera = []
        for url in dict.fromkeys(urls):
            try:
                pagina = fetch(url)
            except TiendaBloqueada as e:
                # Corta y se queda con lo traido. Lo que falta NO se puede dar por
                # retirado del catalogo, y run_scraper lo sabe por self.parcial.
                self.parcial = True
                log.warning("prozis: corta en %s (%s); %d productos traidos", url, e, len(fuera))
                break
            for p in ld_json(pagina):
                if p.get("@type") != "Product":
                    continue
                nombre = p.get("name") or ""
                precio = (p.get("offers") or {}).get("price")
                g, u = medida(nombre, url, categoria=categoria)
                if not ((g or u) and precio) or not es_valido(nombre, categoria):
                    continue
                fuera.append(self.item(
                    marca=(p.get("brand") or {}).get("name"), nombre=nombre, url=url,
                    formato_gramos=g, unidades=u, precio_eur=float(precio),
                    categoria=categoria, servicios=raciones(nombre) or u,
                    texto_extra=url, imagen=p.get("image")))
        return fuera
