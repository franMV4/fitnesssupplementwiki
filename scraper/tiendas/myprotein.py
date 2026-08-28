"""Myprotein. El listado da las URLs; cada ficha trae un ProductGroup con hasVariant,
y cada variante lleva su tamano y su precio ("... 1KG - 294raciones Sin Sabor").

Es la unica tienda que, sin publicar tabla nutricional, cuenta la formula en la
descripcion ("200 mg de cafeina... 3 g de monohidrato de creatina"): de ahi salen las
dosis de sus preentrenos (core.dosis_en_texto).
"""

from ..core import Scraper, es_valido, fetch, ld_json, medida, raciones

BASE = "https://www.myprotein.es"
CATEGORIA_URL = {
    "creatina": BASE + "/c/nutrition/creatine/",
    "preentreno": BASE + "/c/nutrition/pre-post-workout/pre-workout/",
    "proteina_whey": BASE + "/c/nutrition/protein/whey-protein/",
    "proteina_aislada": BASE + "/c/nutrition/protein/protein-isolate-powders/",
    "bcaa": BASE + "/c/nutrition/amino-acids/bcaa/",
    "glutamina": BASE + "/c/nutrition/amino-acids/glutamine/",
    "colageno": BASE + "/c/nutrition/collagen/",
    # El omega 3 no cuelga de /nutrition sino de la gama myvitamins.
    "omega3": BASE + "/c/ranges/myvitamins/omega-3/",
    "multivitaminico": BASE + "/c/nutrition/vitamins-minerals/multivitamin-supplements/",
    # --- los 30 mas vendidos (2026-08-25) ---
    "proteina_vegana": BASE + "/c/nutrition/protein/vegan-protein/",
    # No tiene categoria de caseina: sale del listado de proteinas y la separa el filtro.
    "caseina": BASE + "/c/nutrition/protein/",
    "ganador_peso": BASE + "/c/nutrition/weight-management/weight-gainers/",
    "eaa": BASE + "/c/nutrition/amino-acids/eaa/",
    "beta_alanina": BASE + "/c/nutrition/amino-acids/",
    "citrulina": BASE + "/c/nutrition/amino-acids/",
    "carnitina": BASE + "/c/nutrition/amino-acids/l-carnitine/",
    "carbohidratos": BASE + "/c/nutrition/carbohydrates/",
    "cafeina": BASE + "/c/nutrition/carbohydrates/energy-supplements/",
    "magnesio": BASE + "/c/nutrition/vitamins-minerals/magnesium-supplements/",
    "zinc": BASE + "/c/nutrition/vitamins-minerals/zinc-supplements/",
    "vitamina_d": BASE + "/c/nutrition/vitamins-minerals/vitamin-d/",
    "vitamina_c": BASE + "/c/nutrition/vitamins-minerals/vitamin-c/",
    "vitamina_b12": BASE + "/c/nutrition/vitamins-minerals/essentials/vitamin-b/",
    "hierro": BASE + "/c/nutrition/vitamins-minerals/",
    "zma": BASE + "/c/nutrition/vitamins-minerals/",
    "ashwagandha": BASE + "/c/vitamins-minerals/ashwagandha/",
    "melatonina": BASE + "/c/ranges/myvitamins/sleep-relaxation/",
    "curcuma": BASE + "/c/nutrition/fibre-essential-fats/herbal-plant-supplements/",
    "glucosamina": BASE + "/c/ranges/myvitamins/joints/",
}


def _abs(u):
    return u if u.startswith("http") else BASE + u


class Myprotein(Scraper):
    tienda = "myprotein"
    categorias = tuple(CATEGORIA_URL)

    def extraer(self, categoria="creatina"):
        html = fetch(CATEGORIA_URL[categoria])
        urls = []
        for d in ld_json(html):
            if d.get("@type") != "ItemList":
                continue
            for p in d.get("itemListElement", []):
                if p.get("url") and es_valido(p.get("name"), categoria):
                    urls.append(_abs(p["url"]))

        fuera = []
        for url in dict.fromkeys(urls):
            for grupo in ld_json(fetch(url)):
                if grupo.get("@type") != "ProductGroup":
                    continue
                marca = (grupo.get("brand") or {}).get("name")
                # La formula se cuenta una vez para todo el grupo: las variantes solo
                # cambian el sabor y el tamano.
                desc = (grupo.get("description") or "")[:2000]
                for v in grupo.get("hasVariant", []):
                    nombre = v.get("name") or ""
                    g, u = medida(nombre, categoria=categoria)
                    # "THE Pre-Workout 30raciones" no dice los gramos en ninguna parte
                    # de su JSON-LD. Las raciones valen para las dosis, pero no para el
                    # precio por kilo, que es con lo que se compara: fuera de la tabla.
                    serv = raciones(nombre) or u
                    precio = (v.get("offers") or {}).get("price")
                    if not ((g or u) and precio) or not es_valido(nombre, categoria):
                        continue
                    # Cada variante es un producto distinto: su URL lleva el sku.
                    vurl = "%s?variante=%s" % (url, v.get("sku"))
                    fuera.append(self.item(
                        marca=marca, nombre=nombre, url=vurl, formato_gramos=g,
                        unidades=u, precio_eur=float(precio), categoria=categoria,
                        servicios=serv,
                        texto_extra=desc,
                        imagen=v.get("image") or grupo.get("image")))
        return fuera
