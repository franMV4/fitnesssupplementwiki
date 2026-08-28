"""MASmusculo. BLOQUEADA en 2026-08-20: responde 307 en bucle infinito (redirige a si
misma esperando una cookie de sesion que solo pone su JS). No se fuerza. Mismo trato
que Prozis: el modulo esta listo por si abren.
"""

from ..core import Scraper, es_valido, fetch, ld_json, medida

# Solo creatina: no tiene sentido mapear ocho categorias mas de una tienda que no
# contesta. Si algun dia abre, se anaden aqui.
CATEGORIA_URL = {"creatina": "https://www.masmusculo.com/es/creatina"}


class Masmusculo(Scraper):
    tienda = "masmusculo"
    categorias = tuple(CATEGORIA_URL)

    def extraer(self, categoria="creatina"):
        html = fetch(CATEGORIA_URL[categoria])          # lanza TiendaBloqueada si 307/403
        fuera = []
        for d in ld_json(html):
            if d.get("@type") != "ItemList":
                continue
            for li in d.get("itemListElement", []):
                p = li.get("item") or li
                nombre, url = p.get("name"), p.get("url")
                precio = (p.get("offers") or {}).get("price")
                g, u = medida(nombre, url, categoria=categoria)
                if nombre and url and precio and (g or u) and es_valido(nombre, categoria):
                    fuera.append(self.item(
                        marca=(p.get("brand") or {}).get("name"), nombre=nombre, url=url,
                        formato_gramos=g, unidades=u, precio_eur=float(precio),
                        categoria=categoria))
        return fuera
