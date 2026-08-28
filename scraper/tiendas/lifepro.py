"""Life Pro Nutrition (tienda propia de la marca).

El listado publica un ItemList con nombre y URL pero SIN precio; el precio esta en el
Product JSON-LD de cada ficha. Mismo patron que Myprotein: listado -> fichas.

Su descripcion es puro marketing: no publica ni tabla nutricional ni dosis en prosa.
Sus formulas (preentrenos) se listan con precio pero el motor no las puntua, y lo dice.
"""

from ..core import Scraper, es_valido, fetch, ld_json, medida, raciones

BASE = "https://www.lifepronutrition.com/es/"
CATEGORIA_URL = {
    "creatina": BASE + "creatina/",
    "preentreno": BASE + "preentreno/",
    "proteina_whey": BASE + "proteina/concentrado-suero/",
    "proteina_aislada": BASE + "proteina/aislados-de-suero/",
    "bcaa": BASE + "aminoacidos/aminoacidos-bcaa/",
    "glutamina": BASE + "aminoacidos/glutamina/",
    "omega3": BASE + "vitaminas-minerales/omega-3/",
    "multivitaminico": BASE + "vitaminas-minerales/multivitaminicos/",
    # No tiene categoria de colageno: sus colagenos estan en salud articular junto a
    # otras cosas, y el filtro de la categoria se queda solo con los que lo son.
    "colageno": BASE + "salud-articular/",
    # --- los 30 mas vendidos (2026-08-25) ---
    "proteina_vegana": BASE + "proteina/vegetal/",
    "caseina": BASE + "proteina/caseina/",
    "ganador_peso": BASE + "subidores-peso/",
    "eaa": BASE + "aminoacidos/eaa-y-map/",
    "beta_alanina": BASE + "aminoacidos/aminoacidos-aislados/",
    "citrulina": BASE + "aminoacidos/aminoacidos-aislados/",
    "carbohidratos": BASE + "hidratos-de-carbono/",
    "zma": BASE + "soporte-hormonal/zma/",
    "magnesio": BASE + "vitaminas-minerales/minerales/",
    "zinc": BASE + "vitaminas-minerales/minerales/",
    "hierro": BASE + "vitaminas-minerales/minerales/",
    "vitamina_d": BASE + "vitaminas-minerales/vitaminas/",
    "vitamina_c": BASE + "vitaminas-minerales/vitaminas/",
    "vitamina_b12": BASE + "vitaminas-minerales/vitaminas/",
    "ashwagandha": BASE + "salud-y-bienestar/ansiedad-y-estres/",
    "melatonina": BASE + "salud-y-bienestar/sueno-y-descanso/",
    "probioticos": BASE + "salud-y-bienestar/salud-digestiva/",
    "curcuma": BASE + "antioxidantes/",
    "glucosamina": BASE + "salud-articular/",
    "cafeina": BASE + "rendimiento-cognitivo/",
    "carnitina": BASE + "quemagrasas/",
}


class Lifepro(Scraper):
    tienda = "lifepro"
    categorias = tuple(CATEGORIA_URL)

    def extraer(self, categoria="creatina"):
        html = fetch(CATEGORIA_URL[categoria])
        urls = []
        for d in ld_json(html):
            if d.get("@type") != "ItemList":
                continue
            for p in d.get("itemListElement", []):
                if p.get("url") and es_valido(p.get("name"), categoria):
                    urls.append(p["url"])

        fuera = []
        for url in dict.fromkeys(urls):
            for p in ld_json(fetch(url)):
                if p.get("@type") != "Product":
                    continue
                nombre = p.get("name") or ""
                # Precio de oferta: la ficha trae price (el vigente) y un maxPrice que
                # es el tachado. Se compara lo que el comprador paga hoy.
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
