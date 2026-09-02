"""Nutritienda. La mejor de las cinco: publica ItemList JSON-LD con marca y precio.

El formato en gramos (o las capsulas) sale del slug de la URL
(.../creatina-creapure-400g, .../omega-3-90-capsulas).
"""

from ..core import Scraper, es_valido, fetch, ld_json, medida

BASE = "https://www.nutritienda.com/es/"
CATEGORIA_URL = {
    "creatina": BASE + "creatina",
    "preentreno": BASE + "pre-entrenamiento",
    "proteina_whey": BASE + "concentrado-proteina-suero",
    "proteina_aislada": BASE + "aislado-proteina-suero",
    "bcaa": BASE + "aminoacidos-ramificados",
    "glutamina": BASE + "glutamina",
    "colageno": BASE + "parafarmacia/nutricion-y-dietetica/colageno",
    "omega3": BASE + "acidos-grasos-omega-3",
    "multivitaminico": BASE + "multivitaminicos",
    # --- los 30 mas vendidos (2026-08-25) ---
    "proteina_vegana": BASE + "proteina-vegetal",
    "caseina": BASE + "proteina-secuencial",
    "eaa": BASE + "aminoacidos-esenciales",
    "beta_alanina": BASE + "beta-alanina",
    "citrulina": BASE + "oxido-nitrico",
    "carbohidratos": BASE + "carbohidratos",
    "carnitina": BASE + "l-carnitina",
    "glucosamina": BASE + "articulaciones",
    "zma": BASE + "zma",
    "melatonina": BASE + "sueno",
    "cafeina": BASE + "energia",
    "probioticos": BASE + "parafarmacia/salud/cuidado-digestivo/probioticos",
    # Su parafarmacia no tiene una pagina por mineral: el listado es comun y lo separa
    # el filtro de nombre de la categoria.
    "magnesio": BASE + "parafarmacia/nutricion-y-dietetica/vitaminas-y-minerales/minerales",
    "zinc": BASE + "parafarmacia/nutricion-y-dietetica/vitaminas-y-minerales/minerales",
    "hierro": BASE + "parafarmacia/nutricion-y-dietetica/vitaminas-y-minerales/minerales",
    "vitamina_d": BASE + "parafarmacia/nutricion-y-dietetica/vitaminas-y-minerales/vitaminas",
    "vitamina_c": BASE + "parafarmacia/nutricion-y-dietetica/vitaminas-y-minerales/vitaminas",
    "vitamina_b12": BASE + "parafarmacia/nutricion-y-dietetica/vitaminas-y-minerales/vitaminas",
    # No lista ganadores de peso, ni ashwagandha ni curcuma como categoria propia: una
    # tienda no tiene por que vender las treinta, y run_scraper se salta las que no.
}
# ponytail: solo la primera pagina. El listado es scroll infinito por JS: ?page=N
# devuelve siempre los mismos 20 items en el JSON-LD (de 266 totales). Suficiente para
# creatina en polvo; si algun dia hace falta el catalogo entero, hay que ir por su API.
PAGINAS = 1


class Nutritienda(Scraper):
    tienda = "nutritienda"
    categorias = tuple(CATEGORIA_URL)

    def extraer(self, categoria="creatina"):
        base = CATEGORIA_URL[categoria]
        fuera = []
        for pagina in range(1, PAGINAS + 1):
            url = base if pagina == 1 else "%s?page=%d" % (base, pagina)
            html = fetch(url)
            items = [d for d in ld_json(html) if d.get("@type") == "ItemList"]
            if not items:
                break
            for li in items[0].get("itemListElement", []):
                p = li.get("item") or {}
                nombre, purl = p.get("name"), p.get("url")
                if not (nombre and purl) or not es_valido(nombre, categoria):
                    continue
                g, u = medida(purl, nombre, categoria=categoria)
                precio = (p.get("offers") or {}).get("price")
                if not (g or u) or not precio:
                    continue
                fuera.append(self.item(
                    marca=(p.get("brand") or {}).get("name"), nombre=nombre, url=purl,
                    formato_gramos=g, unidades=u, precio_eur=float(precio),
                    categoria=categoria, servicios=u, texto_extra=purl,
                    # Sin `pagina`: aqui no se descarga la ficha, y la tabla nutricional
                    # del listado seria la de otro producto.
                    imagen=p.get("image"), ld=p))
        return fuera
