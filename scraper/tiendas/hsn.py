"""HSN (Magento). El listado da las URLs; el precio por formato NO esta en el JSON-LD
(usa AggregateOffer con low/high), sino en la config de variantes embebida:
   "attributes": {"216": {"code": "content_weight", "options": [{"label": "500g",
                   "products": ["10122"]}]}}
   "optionPrices": {"10122": {"finalPrice": {"amount": 7.50}}}
"""

import json
import re

from categorias import es_formula
from ..core import (Scraper, es_valido, fetch, ld_json, medida,
                    normalizar_ingrediente)

CATEGORIA_URL = {
    "creatina": "https://www.hsnstore.com/nutricion-deportiva/creatina",
    # HSN es la unica de las cinco que publica la tabla nutricional completa en HTML,
    # con los mg por servicio de cada activo. Por eso sus formulas se puntuan con datos
    # de la ficha y las de las demas tiendas solo con lo que digan en prosa.
    "preentreno": "https://www.hsnstore.com/nutricion-deportiva/pre-entrenamiento",
    "proteina_whey": "https://www.hsnstore.com/nutricion-deportiva/proteinas/whey/"
                     "concentrados-de-suero",
    "proteina_aislada": "https://www.hsnstore.com/nutricion-deportiva/proteinas/whey/"
                        "aislados-de-suero",
    "bcaa": "https://www.hsnstore.com/nutricion-deportiva/aminoacidos/bcaa-s-ramificados",
    "glutamina": "https://www.hsnstore.com/nutricion-deportiva/aminoacidos/glutamina",
    "colageno": "https://www.hsnstore.com/ingredientes/colageno",
    "omega3": "https://www.hsnstore.com/ingredientes/omega-3",
    "multivitaminico": "https://www.hsnstore.com/nutricion-deportiva/multivitaminicos",
    # --- los 30 mas vendidos (2026-08-25) ---
    "proteina_vegana": "https://www.hsnstore.com/nutricion-deportiva/proteinas/vegetales",
    "caseina": "https://www.hsnstore.com/nutricion-deportiva/proteinas/caseina",
    "ganador_peso": "https://www.hsnstore.com/nutricion-deportiva/ganadores-de-peso",
    "eaa": "https://www.hsnstore.com/nutricion-deportiva/aminoacidos/esenciales-eaas",
    "carbohidratos": "https://www.hsnstore.com/nutricion-deportiva/carbohidratos",
    "zma": "https://www.hsnstore.com/nutricion-deportiva/anabolicos-naturales/zma",
    "probioticos": "https://www.hsnstore.com/salud-bienestar/digestion/probioticos",
    # HSN publica una pagina por ingrediente con el mismo CollectionPage que sus
    # categorias, y para un mineral o un extracto es mas precisa que la categoria
    # ("minerales" trae de todo, "/ingredientes/magnesio" trae magnesio).
    "beta_alanina": "https://www.hsnstore.com/ingredientes/beta-alanina",
    "citrulina": "https://www.hsnstore.com/ingredientes/citrulina",
    "magnesio": "https://www.hsnstore.com/ingredientes/magnesio",
    "zinc": "https://www.hsnstore.com/ingredientes/zinc",
    "hierro": "https://www.hsnstore.com/ingredientes/hierro",
    "vitamina_d": "https://www.hsnstore.com/ingredientes/vitamina-d",
    "vitamina_c": "https://www.hsnstore.com/ingredientes/vitamina-c",
    "vitamina_b12": "https://www.hsnstore.com/ingredientes/vitamina-b12",
    "ashwagandha": "https://www.hsnstore.com/ingredientes/ashwagandha",
    "melatonina": "https://www.hsnstore.com/ingredientes/melatonina",
    "cafeina": "https://www.hsnstore.com/ingredientes/cafeina",
    "curcuma": "https://www.hsnstore.com/ingredientes/curcuma",
    "glucosamina": "https://www.hsnstore.com/ingredientes/glucosamina",
    "carnitina": "https://www.hsnstore.com/ingredientes/carnitina",
    # --- ampliacion a los 50 mas vendidos (2026-08-31) ---
    # Las cuatro que faltan (hmb, tribulus, vitamina_k2, quemagrasas) no tienen
    # pagina de ingrediente en HSN: no vende la categoria y run_scraper se la salta.
    "taurina": "https://www.hsnstore.com/ingredientes/taurina",
    "arginina": "https://www.hsnstore.com/ingredientes/arginina",
    "maca": "https://www.hsnstore.com/ingredientes/maca",
    "coenzima_q10": "https://www.hsnstore.com/ingredientes/coenzima-q10",
    "espirulina": "https://www.hsnstore.com/ingredientes/espirulina",
    "te_verde": "https://www.hsnstore.com/ingredientes/te-verde",
    "teanina": "https://www.hsnstore.com/ingredientes/teanina",
    "triptofano": "https://www.hsnstore.com/ingredientes/triptofano",
    "colina": "https://www.hsnstore.com/ingredientes/colina",
    "acido_hialuronico": "https://www.hsnstore.com/ingredientes/acido-hialuronico",
    "vitamina_e": "https://www.hsnstore.com/ingredientes/vitamina-e",
    "calcio": "https://www.hsnstore.com/ingredientes/calcio",
    "selenio": "https://www.hsnstore.com/ingredientes/selenio",
    "potasio": "https://www.hsnstore.com/ingredientes/potasio",
    "cla": "https://www.hsnstore.com/ingredientes/cla",
    "complejo_b": "https://www.hsnstore.com/ingredientes/vitamina-b",
}

# Filas de la tabla "Cantidad de nutrientes": el sangrado (ml-1, ml-3, ml-6) dice si la
# fila es un activo o el desglose del de arriba. ml-1 es el activo; ml-3 su desglose;
# ml-6 el desglose del desglose, que no aporta nada nuevo.
FILA_NUTRIENTE = re.compile(
    r'<p class="ml-(\d+)[^"]*"\s*>([^<]+)</p>.*?>\s*([\d.,]+)\s*(mg|g)\s*<', re.S)
NIVELES_UTILES = ("1", "3")
DOSIS_SERVICIO = re.compile(r"Tama.o de la dosis:[^<]*?\((\d+(?:[.,]\d+)?)\s*g\)", re.I)


def _objeto_json(html, clave):
    """Extrae el objeto JSON que sigue a "clave": { ... }, contando llaves."""
    m = re.search(r'"%s"\s*:\s*\{' % clave, html)
    if not m:
        return None
    i = html.index("{", m.end() - 1)
    prof, en_cadena, escapa = 0, False, False
    for j in range(i, len(html)):
        c = html[j]
        if escapa:
            escapa = False
        elif c == "\\":
            escapa = True
        elif c == '"':
            en_cadena = not en_cadena
        elif not en_cadena:
            if c == "{":
                prof += 1
            elif c == "}":
                prof -= 1
                if prof == 0:
                    try:
                        return json.loads(html[i:j + 1])
                    except json.JSONDecodeError:
                        return None
    return None


class Hsn(Scraper):
    tienda = "hsn"
    categorias = tuple(CATEGORIA_URL)

    def extraer(self, categoria="creatina"):
        html = fetch(CATEGORIA_URL[categoria])
        urls = []
        for d in ld_json(html):
            lista = d.get("mainEntity") if d.get("@type") == "CollectionPage" else None
            for li in (lista or {}).get("itemListElement", []):
                if li.get("url") and es_valido(li.get("name"), categoria):
                    urls.append(li["url"])

        fuera = []
        for url in dict.fromkeys(urls):
            pagina = fetch(url)
            prod = next((d for d in ld_json(pagina) if d.get("@type") == "Product"), {})
            nombre = prod.get("name") or ""
            marca = (prod.get("brand") or {}).get("name") or prod.get("manufacturer")
            if isinstance(marca, dict):
                marca = marca.get("name")
            desc = (prod.get("description") or "")[:2000]

            variantes = list(self._variantes(pagina))
            if not variantes:                       # producto simple: un solo formato
                oferta = prod.get("offers") or {}
                precio = oferta.get("price") or oferta.get("lowPrice")
                if precio and any(medida(nombre, categoria=categoria)):
                    variantes = [("", round(float(precio), 2))]

            ingredientes = self._ingredientes(pagina) if es_formula(categoria) else None
            # Un preentreno es una formula. Un bote de beta-alanina pura esta en el mismo
            # listado de la tienda, pero compararlo con una formula no dice nada: fuera.
            if categoria == "preentreno" and len(ingredientes or []) < 2:
                continue
            gramos_dosis = self._gramos_por_servicio(pagina)

            for etiqueta, precio in dict.fromkeys(variantes):
                g, u = medida(etiqueta, nombre, categoria=categoria)
                # Nombre Y etiqueta juntos: una etiqueta de formato ("150g") no contiene
                # nunca "creatina", asi que filtrar solo por ella tiraba todo el catalogo
                # de HSN. Los "Pack (5x150g)" siguen cayendo: el descarte mira las dos.
                if not (g or u) or not es_valido("%s %s" % (nombre, etiqueta), categoria):
                    continue          # los "Pack (5x150g)" no son un formato, son un lote
                fuera.append(self.item(
                    marca=marca, nombre=("%s %s" % (nombre, etiqueta)).strip(),
                    url="%s?formato=%s" % (url, etiqueta) if etiqueta else url,
                    formato_gramos=g, unidades=u, precio_eur=precio, categoria=categoria,
                    texto_extra=desc,
                    # En capsulas el servicio es la capsula: el envase rinde tantas tomas
                    # como unidades trae.
                    servicios=round(g / gramos_dosis) if (g and gramos_dosis) else u,
                    ingredientes=ingredientes, imagen=prod.get("image"),
                    ld=prod, pagina=pagina))
        return fuera

    def _ingredientes(self, pagina):
        """Activos y mg por servicio de la tabla nutricional. [] si no la publica.

        Dos pasadas por nivel de sangrado. El desglose (ml-3) solo cuenta si el activo
        no aparecio ya sin sangrar: asi la citrulina de un preentreno no se suma dos
        veces, y el "Omega 3 (EPA+DHA)" de un aceite de pescado (que cuelga de la fila
        "Aceite de Pescado", que no es el activo) si entra.
        """
        # Una fila por etiqueta distinta: la ficha repite la tabla entera una vez por
        # formato (tres veces en el aceite de pescado), y sumarlas triplicaba la dosis.
        filas = {}
        for nivel, etiqueta, cantidad, unidad in FILA_NUTRIENTE.findall(pagina):
            ing = normalizar_ingrediente(etiqueta)
            clave = (nivel, " ".join(etiqueta.split()))
            if not ing or nivel not in NIVELES_UTILES or clave in filas:
                continue
            mg = float(cantidad.replace(".", "").replace(",", ".")) * (1000 if unidad == "g" else 1)
            filas[clave] = (ing, mg)

        por_nivel = {}
        for (nivel, _), (ing, mg) in filas.items():
            # Etiquetas distintas del mismo nivel SI se suman: una ficha puede publicar
            # el EPA y el DHA en dos filas y la dosis citada es la de los dos juntos.
            nivel_ = por_nivel.setdefault(nivel, {})
            nivel_[ing] = nivel_.get(ing, 0.0) + mg
        suma = dict(por_nivel.get("3", {}))
        suma.update(por_nivel.get("1", {}))
        return [{"ingrediente": i, "dosis_por_servicio_mg": mg} for i, mg in suma.items()]

    def _gramos_por_servicio(self, pagina):
        """"Tamano de la dosis: 2 dosificadores de 15ml (20g)" -> 20.0"""
        m = DOSIS_SERVICIO.search(pagina)
        return float(m.group(1).replace(",", ".")) if m else None

    def _variantes(self, pagina):
        """[(etiqueta, precio)] por formato. Vacio si la ficha no es configurable.

        Ojo: la pagina trae 8 bloques de config, casi todos de los carruseles de
        productos relacionados. El del producto principal es el unico que arranca con
        initConfigurableOptions('<id>'; sin ese ancla se cogian los precios del vecino.
        """
        anclas = list(re.finditer(r"initConfigurableOptions\(\s*'(\d+)'", pagina))
        if not anclas:
            return
        pagina = pagina[anclas[-1].start():]        # el ultimo bloque es el del producto
        atributos = _objeto_json(pagina, "attributes") or {}
        precios = _objeto_json(pagina, "optionPrices") or {}
        for attr in atributos.values():
            codigo = (attr.get("code") or "").lower()
            # content_weight en polvo; los botes de capsulas traen la cuenta de unidades
            # en otro atributo ("120 perlas"), asi que valen los dos.
            if not ("weight" in codigo or "unit" in codigo or "content" in codigo):
                continue
            for opcion in attr.get("options", []):
                for pid in opcion.get("products", []):
                    importe = ((precios.get(pid) or {}).get("finalPrice") or {}).get("amount")
                    if importe:
                        yield opcion.get("label", ""), round(float(importe), 2)
