"""Amazon.es. La sexta tienda, y la unica que no publica datos estructurados.

Amazon no emite Product JSON-LD ni microdatos en ninguna de sus paginas, asi que aqui
no queda mas remedio que leer su HTML. Se hace en la pagina de RESULTADOS DE BUSQUEDA y
no en las 40 fichas que hagan falta por categoria: el bloque de cada resultado ya trae
ASIN, titulo completo (con el formato dentro), precio vigente e imagen, que es
exactamente lo que necesita este comparador. Una peticion por pagina de resultados en
vez de una por producto.

Que permite su robots.txt (comprobado el 2026-08-25): `/s?k=...` esta permitido; lo unico
que prohibe de las busquedas son las URLs con filtros encadenados (`*/s?k=*&rh=n*p_*p_*p_`),
que aqui no se usan. `core.fetch` lo comprueba igualmente antes de cada peticion, asi que
si Amazon cambia de idea el modulo deja de traer datos solo, sin tocar nada.

Dos cosas que Amazon tiene y las otras cinco tiendas no, y que obligan a tratarla distinto:

  1. **El titulo lo escribe quien vende**, no la tienda. Por eso `verificar.py` no le
     concede el nivel 4 automatico por llevar "Creapure" en el nombre: en un marketplace
     esa palabra la teclea el vendedor. En Amazon, Creapure se queda en nivel 2
     (declarado) mientras nadie compruebe el codigo QS del bote.
  2. **La marca no viene en ningun campo**: hay que sacarla del principio del titulo.
     `_marca` corta en cuanto aparece una palabra de producto o una cifra, que es como
     estan escritos estos titulos ("HSN Creatina...", "Optimum Nutrition Creatina...").
"""

import html as _html
import logging
import re
import time

from ..core import Scraper, es_valido, fetch, medida, raciones

log = logging.getLogger("scraper")

BUSQUEDA = "https://www.amazon.es/s?k=%s"
# Que se teclea en el buscador de Amazon para cada categoria. No es el nombre de la
# categoria: es la busqueda que devuelve botes de eso y no accesorios ni libros.
CONSULTA = {
    "creatina": "creatina monohidrato en polvo",
    "preentreno": "pre entreno preworkout en polvo",
    "proteina_whey": "proteina whey concentrada en polvo",
    "proteina_aislada": "proteina aislada isolate en polvo",
    "bcaa": "bcaa en polvo",
    "glutamina": "glutamina en polvo",
    "colageno": "colageno hidrolizado en polvo",
    "omega3": "omega 3 capsulas epa dha",
    "multivitaminico": "multivitaminico capsulas",
    "proteina_vegana": "proteina vegana en polvo guisante",
    "caseina": "caseina micelar en polvo",
    "ganador_peso": "ganador de peso gainer en polvo",
    "eaa": "aminoacidos esenciales eaa en polvo",
    "beta_alanina": "beta alanina en polvo",
    "citrulina": "citrulina malato en polvo",
    "carbohidratos": "maltodextrina amilopectina en polvo",
    "magnesio": "magnesio capsulas",
    "zinc": "zinc capsulas",
    "hierro": "hierro capsulas",
    "vitamina_d": "vitamina d3 capsulas",
    "vitamina_c": "vitamina c capsulas",
    "vitamina_b12": "vitamina b12 capsulas",
    "zma": "zma capsulas",
    "ashwagandha": "ashwagandha capsulas",
    "melatonina": "melatonina capsulas",
    "cafeina": "cafeina capsulas",
    "probioticos": "probioticos capsulas",
    "curcuma": "curcuma capsulas",
    "glucosamina": "glucosamina condroitina capsulas",
    "carnitina": "l carnitina capsulas",
}
# Dos paginas por categoria (~96 resultados). A partir de la tercera lo que sale ya no
# es de la categoria: son accesorios, libros y productos de relleno.
PAGINAS = 2

# Un resultado empieza en el div que lleva su ASIN. El bloque trae todo lo demas dentro.
BLOQUE = re.compile(r'(?=<div[^>]+data-asin=")')
ASIN = re.compile(r'data-asin="([A-Z0-9]{10})"')
TITULO = re.compile(r'<h2[^>]*>\s*<span[^>]*>(.*?)</span>', re.S)
# El precio vigente es el primer a-offscreen del bloque; los siguientes son el tachado
# y el precio por unidad de medida que calcula Amazon.
PRECIO = re.compile(r'class="a-price"[^>]*>.*?<span class="a-offscreen">([^<]+)</span>', re.S)
IMAGEN = re.compile(r'<img[^>]+class="s-image"[^>]+src="([^"]+)"')

# Donde acaba la marca y empieza el producto en un titulo de Amazon.
FIN_DE_MARCA = re.compile(
    r"^(creatina|proteina|prote[ií]na|whey|bcaa|glutamina|colageno|col[aá]geno|omega|"
    r"multivitamin|vitamina|magnesio|zinc|hierro|zma|ashwagandha|melatonina|cafe[ií]na|"
    r"probiotic|curcuma|c[uú]rcuma|glucosamina|carnitina|beta|citrulina|maltodextrina|"
    r"amilopectina|aminoacidos|amino[aá]cidos|eaa|caseina|case[ií]na|pre|gainer|\d)", re.I)


def _marca(nombre):
    """La marca es lo que va delante del producto en el titulo. Tres palabras como mucho.

    Amazon no publica la marca en ningun campo del resultado de busqueda. Los titulos de
    esta categoria empiezan casi siempre por ella ("HSN Creatina...", "Optimum Nutrition
    Creatina Monohidrato..."), asi que se corta en la primera palabra que ya es producto.
    Si el titulo empieza por el producto, no hay marca que sacar y se dice.
    """
    palabras = []
    for palabra in re.sub(r"[®™]", "", nombre).split():
        if FIN_DE_MARCA.match(palabra) or len(palabras) == 3:
            break
        palabras.append(palabra.strip(",|-"))
    return " ".join(palabras) if palabras else "Desconocida"


def _nombre_corto(nombre):
    """El titulo de Amazon sin la cola de marketing.

    Un titulo de Amazon son 200 caracteres con la ficha tecnica dentro, separada por "|"
    ("HSN Creatina Monohidrato en Polvo 1 Kg | 100% Puro Monohidrato... Libre de DCD").
    Sin cortar, el titulo de la ficha se corta a 78 caracteres por palabra entera y dos
    formatos del mismo producto acaban con el MISMO titulo, que es lo que
    SEO-PRODUCTOS.md prohibe. La cabeza casi siempre trae marca y formato; si no trae el
    formato, se queda el titulo entero, que es lo unico que lo distingue.
    """
    cabeza = re.split(r"\s*[|]\s*", nombre)[0].strip(" ,-")
    return cabeza if (len(cabeza) >= 15 and any(medida(cabeza))) else nombre


def _precio(texto):
    """"16,40 €" -> 16.4. None si Amazon no ensena precio (sin stock o solo de segunda mano)."""
    m = re.search(r"(\d[\d.]*),(\d{2})", _html.unescape(texto or "").replace("\xa0", " "))
    return float("%s.%s" % (m.group(1).replace(".", ""), m.group(2))) if m else None


# Amazon contesta a veces con una pagina de 2 KB que dice, literalmente, "vuelve a
# cargar esto dentro de 5 segundos" (<meta http-equiv="refresh">). No es un captcha ni un
# bloqueo: es como pide bajar el ritmo, y lo unico que hay que hacer es esperar lo que
# pide y volver a pedirlo, que es lo que haria el navegador de cualquiera.
ESPERA = re.compile(r'http-equiv="refresh"[^>]*content="(\d+)', re.I)


class Amazon(Scraper):
    tienda = "amazon"
    categorias = tuple(CONSULTA)

    def _buscar(self, url, intentos=3):
        for intento in range(intentos):
            # El reintento no usa cache: si no, releeria la pagina de espera que acaba
            # de guardar. Al traer la buena, la cache se queda con la buena.
            html = fetch(url, usar_cache=(intento == 0))
            espera = ESPERA.search(html[:3000])
            if not (espera and len(html) < 10000):
                return html
            time.sleep(float(espera.group(1)) + 1)
        # Sin resultados no se puede concluir que Amazon haya dejado de vender esto:
        # la pasada queda marcada como parcial y run_scraper no retira nada.
        self.parcial = True
        log.warning("amazon: sigue pidiendo esperar en %s; pasada parcial", url)
        return ""

    def extraer(self, categoria="creatina"):
        vistos, fuera = set(), []
        for pagina in range(1, PAGINAS + 1):
            url = BUSQUEDA % CONSULTA[categoria].replace(" ", "+")
            if pagina > 1:
                url += "&page=%d" % pagina
            html = self._buscar(url)
            encontrados = 0
            for bloque in BLOQUE.split(html):
                asin = ASIN.search(bloque or "")
                titulo = TITULO.search(bloque or "")
                if not (asin and titulo):
                    continue
                encontrados += 1
                nombre = re.sub(r"<[^>]+>", "", titulo.group(1))
                nombre = _nombre_corto(" ".join(_html.unescape(nombre).split()))
                if asin.group(1) in vistos or not es_valido(nombre, categoria):
                    continue
                marcado = PRECIO.search(bloque)
                precio = _precio(marcado.group(1)) if marcado else None
                g, u = medida(nombre, categoria=categoria)
                if not ((g or u) and precio):
                    continue
                vistos.add(asin.group(1))
                imagen = IMAGEN.search(bloque)
                fuera.append(self.item(
                    marca=_marca(nombre), nombre=nombre,
                    url="https://www.amazon.es/dp/%s" % asin.group(1),
                    formato_gramos=g, unidades=u, precio_eur=precio, categoria=categoria,
                    servicios=raciones(nombre) or u,
                    imagen=imagen.group(1) if imagen else None))
            if not encontrados:                  # sin resultados no hay pagina siguiente
                break
        log.info("amazon: %s -> %d productos", categoria, len(fuera))
        return fuera
