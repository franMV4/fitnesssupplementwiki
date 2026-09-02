"""Fontaneria comun de los scrapers: descarga educada, cache y normalizacion.

ponytail: solo stdlib. La extraccion va contra JSON-LD (schema.org), que las
tiendas publican para Google y cambia mucho menos que su HTML. Sin requests ni bs4.
"""

import gzip
import hashlib
import html as _html
import json
import logging
import os
import re
import urllib.parse
import time
import unicodedata
import urllib.error
import urllib.request
import urllib.robotparser as robotparser
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

import categorias
from categorias import config as config_categoria

log = logging.getLogger("scraper")

UA = ("FitnessSupplementWikiBot/0.1 "
      "(+https://fitnesssupplementwiki.com/legal; franmunozvillanova@gmail.com)")
DELAY_S = 2.0            # entre peticiones al mismo host
# Hosts que necesitan mas aire del comun. No es cortesia abstracta: Zumub y Prozis
# devuelven 429 con los 2 s de todos, y un 429 a media pasada deja la categoria a
# medias (`Scraper.parcial`). Esperar mas trae MAS datos, no menos.
DELAY_POR_HOST = {"www.zumub.com": 6.0, "www.prozis.com": 4.0}
CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "cache"
# Seis horas: dos pasadas del robot en el mismo dia no vuelven a pedir la misma pagina.
# La variable de entorno existe para reprocesar SIN volver a descargar nada: cuando lo que
# cambia es como se lee la ficha (un patron de ingrediente nuevo, una dosis de referencia)
# y no el precio, bajar a las tiendas otra vez es pedirles 4.000 paginas para nada.
#     CACHE_TTL_H=720 python run_scraper.py --categoria magnesio
CACHE_TTL_S = int(float(os.environ.get("CACHE_TTL_H", 6)) * 3600)

_ultimo_acceso = {}
_robots = {}


class TiendaBloqueada(Exception):
    """La tienda rechaza al bot. Se documenta, no se fuerza."""


def _robots_permite(url):
    host = urlparse(url).netloc
    if host not in _robots:
        rp = robotparser.RobotFileParser()
        # rp.read() pide el robots.txt con el UA de urllib, y varias tiendas devuelven
        # 403 a ese UA: RobotFileParser lo interpreta como "prohibido todo". Lo pedimos
        # nosotros con nuestro UA honesto y le pasamos el texto ya descargado.
        try:
            req = urllib.request.Request("https://" + host + "/robots.txt",
                                         headers={"User-Agent": UA})
            texto = urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "replace")
            rp.parse(texto.splitlines())
        except Exception as e:            # sin robots legible -> solo URLs conocidas
            log.warning("robots.txt de %s ilegible (%s)", host, e)
            rp = None
        _robots[host] = rp
    rp = _robots[host]
    return True if rp is None else rp.can_fetch(UA, url)


def _decodifica(b, ctype):
    """Alguna tienda declara UTF-8 y sirve latin-1. Probamos estricto y caemos."""
    m = re.search(r"charset=([\w-]+)", ctype or "", re.I)
    for enc in ([m.group(1)] if m else []) + ["utf-8", "cp1252"]:
        try:
            return b.decode(enc)
        except (UnicodeDecodeError, LookupError):
            continue
    return b.decode("latin-1")      # nunca falla; mejor mojibake raro que perder caracteres


def fetch(url, usar_cache=True):
    """GET educado: respeta robots.txt, espacia peticiones y cachea en disco."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache = CACHE_DIR / (hashlib.sha1(url.encode()).hexdigest() + ".html")
    if usar_cache and cache.exists() and time.time() - cache.stat().st_mtime < CACHE_TTL_S:
        return cache.read_text(encoding="utf-8")

    if not _robots_permite(url):
        raise TiendaBloqueada("robots.txt prohibe " + url)

    host = urlparse(url).netloc
    espera = DELAY_POR_HOST.get(host, DELAY_S) - (time.monotonic() - _ultimo_acceso.get(host, 0))
    if espera > 0:
        time.sleep(espera)
    _ultimo_acceso[host] = time.monotonic()

    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "es-ES,es",
    })
    try:
        r = urllib.request.urlopen(req, timeout=40)
        crudo = r.read()
        if crudo[:2] == bytes.fromhex('1f8b'):      # los sitemaps .gz vienen comprimidos
            crudo = gzip.decompress(crudo)
        html = _decodifica(crudo, r.headers.get("Content-Type"))
    except urllib.error.HTTPError as e:
        if e.code in (307, 403, 429, 503):
            raise TiendaBloqueada("HTTP %s en %s" % (e.code, url)) from e
        raise
    except urllib.error.URLError as e:
        raise TiendaBloqueada("%s en %s" % (e.reason, url)) from e
    cache.write_text(html, encoding="utf-8")
    return html


# Envoltorio CDATA del JSON-LD. Prozis emite /*<![CDATA[*/ {...} /*]]>*/ (herencia
# XHTML, legal y comun): json.loads se atraganta con el comentario y ld_json descartaba
# la ficha entera en silencio. Quitarlo aqui vale para cualquier tienda que lo use.
CDATA = re.compile(r"/\*\s*<!\[CDATA\[\s*\*/|/\*\s*\]\]>\s*\*/|<!\[CDATA\[|\]\]>")


def ld_json(html):
    """Todos los objetos JSON-LD de la pagina, con @graph y listas aplanados."""
    fuera = []
    for bloque in re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', html, re.S):
        try:
            d = json.loads(CDATA.sub("", bloque))
        except json.JSONDecodeError:
            continue
        pila = [d]
        while pila:
            x = pila.pop()
            if isinstance(x, list):
                pila.extend(x)
            elif isinstance(x, dict):
                fuera.append(x)
                pila.extend(x.get("@graph", []))
    return fuera


# --- microdatos ----------------------------------------------------------------
# Schema.org tiene dos formatos y cada tienda elige uno: JSON-LD (un bloque de JSON en
# un <script>, que es lo que usan las cinco primeras) o microdatos, con los atributos
# itemscope/itemprop repartidos por el HTML. Zumub publica exactamente lo mismo que las
# demas (nombre, marca, sku, precio, disponibilidad) pero en microdatos, y sin esto
# habria que parsear su HTML a mano, que es justo lo que este scraper evita.
#
# ponytail: con html.parser de la stdlib, no con expresiones regulares. Un itemscope
# dentro de otro (la marca dentro del producto) hay que cerrarlo por profundidad de
# etiqueta, y eso una regex no lo sabe hacer. Vale para cualquier tienda que los use.
ETIQUETAS_VACIAS = {"meta", "link", "img", "br", "hr", "input", "source", "area", "base",
                    "col", "embed", "param", "track", "wbr"}


class _Microdatos(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.objetos = []          # todos los itemscope encontrados, en orden de apertura
        self.abiertos = []         # [(profundidad, objeto)] de los que siguen abiertos
        self.capturando = None     # [propiedad, objeto, profundidad, texto] o None
        self.prof = 0

    def _guardar(self, obj, prop, valor):
        valor = " ".join(str(valor).split())
        if not valor:
            return
        previo = obj.get(prop)
        # Una propiedad repetida no se pisa: en una ficha con varias ofertas, "price"
        # aparece una vez por variante. La primera es la del producto principal.
        if previo is None:
            obj[prop] = valor

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        vacia = tag in ETIQUETAS_VACIAS
        if not vacia:
            self.prof += 1
        prop = a.get("itemprop")
        padre = self.abiertos[-1][1] if self.abiertos else None
        if "itemscope" in a:
            obj = {"@type": (a.get("itemtype") or "").rstrip("/").rsplit("/", 1)[-1]}
            self.objetos.append(obj)
            if prop and padre is not None and padre.get(prop) is None:
                padre[prop] = obj      # la marca cuelga del producto, no flota suelta
            if not vacia:
                self.abiertos.append((self.prof, obj))
            return
        if prop and padre is not None:
            # El valor puede venir en un atributo (content/href/src) o ser el texto.
            valor = a.get("content") or a.get("href") or a.get("src")
            if valor is not None:
                self._guardar(padre, prop, valor)
            elif not vacia and self.capturando is None:
                self.capturando = [prop, padre, self.prof, []]

    def handle_data(self, data):
        if self.capturando:
            self.capturando[3].append(data)

    def handle_endtag(self, tag):
        if tag in ETIQUETAS_VACIAS:
            return
        if self.capturando and self.prof <= self.capturando[2]:
            prop, obj, _, trozos = self.capturando
            self._guardar(obj, prop, "".join(trozos))
            self.capturando = None
        while self.abiertos and self.abiertos[-1][0] >= self.prof:
            self.abiertos.pop()
        self.prof = max(0, self.prof - 1)


def microdatos(html, tipo=None):
    """Objetos schema.org publicados como microdatos. Con `tipo`, solo los de ese tipo.

    Devuelve dicts con la misma forma que ld_json ({"@type": "Product", "name": ...}),
    asi que un modulo de tienda trata igual las dos fuentes.
    """
    p = _Microdatos()
    try:
        p.feed(html)
    except Exception as e:                        # HTML roto: lo leido hasta ahi vale
        log.warning("microdatos: parser corta (%s)", e)
    return [o for o in p.objetos if tipo is None or o.get("@type") == tipo]


# --- normalizacion -------------------------------------------------------------

ALIAS_MARCA = {
    "hsn": "HSN", "raw series": "HSN Raw Series", "sport series": "HSN Sport Series",
    "essential series": "HSN Essential Series",
    "myprotein": "Myprotein", "my protein": "Myprotein",
    "prozis": "Prozis", "prozis foods": "Prozis",
    "life pro": "Life Pro", "lifepro nutrition": "Life Pro", "life pro nutrition": "Life Pro",
    "amazin' foods": "Amazin' Foods", "amazin foods": "Amazin' Foods",
    "optimum nutrition": "Optimum Nutrition",
    "weider": "Weider", "scitec nutrition": "Scitec Nutrition", "scitec": "Scitec Nutrition",
    "biotech usa": "BioTechUSA", "biotechusa": "BioTechUSA",
}


# Palabras que NO pueden ser una marca. Salen de leer lo que habia guardado como marca en
# la BD: "Citrato de", "Extracto de", "Aceite de pescado", "Peptidos de" o "L-Glutamina en
# Polvo" son trozos del nombre del producto que la heuristica de Amazon (cortar por la
# primera palabra que ya es producto) se traia cuando el titulo no empieza por la marca.
# Una marca inventada es PEOR que no tener marca: viaja al brand del JSON-LD, rompe el
# emparejamiento del mismo bote entre tiendas y crearia paginas de marca fantasma.
NO_ES_MARCA = set("""
aislado aislada isolate concentrado concentrada micronizada hidrolizado hidrolizada
peptidos peptido citrato bisglicinato glicinato gluconato carbonato oxido quelato
complejo extracto aceite pescado krill acido folico ascorbico hialuronico
capsulas capsula comprimidos comprimido tabletas perlas polvo gramos sabor sabores
suplemento complemento pack formula potencia dosis jengibre pimienta negra
colina inositol biotina jalea propoleo espirulina levadura fibra minerales vitaminas
calcio potasio selenio condroitina malato alanina curcumina probiotico probioticos
monohidrato leche suero soja guisante arroz huevo colageno glutamina creatina proteina
carnitina citrulina magnesio vitamina cafeina melatonina
""".split())

# Coletillas de marketing pegadas al final de la marca ("Optimum Nutrition Gold",
# "AMIX Complemento"). Se quitan SOLO por el final: hay marcas que empiezan por una de
# estas palabras de verdad, y ahi no sobran.
COLETILLAS = set("pure premium gold mass ultimate complex plus advanced max".split())
# Sueltas dentro de la marca delatan un trozo de frase, no un nombre propio.
CONECTORES = ("de", "del", "y", "con", "en", "para", "sin")


def _sin_tildes(palabra):
    llana = unicodedata.normalize("NFKD", palabra)
    return "".join(c for c in llana if not unicodedata.combining(c)).strip("-+.,'\"").lower()


def marca_canonica(nombre):
    """Nombre de marca normalizado, o "Desconocida" si lo que llega no es una marca.

    Vale para las nueve tiendas, no solo para Amazon: cualquier modulo que un dia se
    traiga media frase como marca la deja aqui, y no en la BD ni en el JSON-LD.
    """
    if not nombre:
        return "Desconocida"
    limpio = re.sub(r"\s+", " ", str(nombre)).strip()
    if limpio.lower() in ALIAS_MARCA:
        return ALIAS_MARCA[limpio.lower()]
    palabras = limpio.split()
    # Tambien se cae un simbolo suelto al final ("Fair & Pure" -> "Fair").
    while len(palabras) > 1 and (_sin_tildes(palabras[-1]) in COLETILLAS
                                 or not _sin_tildes(palabras[-1]).isalnum()):
        palabras.pop()
    planas = [_sin_tildes(p) for p in palabras]
    if (not planas or len("".join(planas)) < 3
            or any(p in NO_ES_MARCA or p in CONECTORES for p in planas)):
        return "Desconocida"
    limpio = " ".join(palabras)
    return ALIAS_MARCA.get(limpio.lower(), limpio)


_UNIDAD = {"kg": 1000.0, "kgs": 1000.0, "g": 1.0, "gr": 1.0, "grs": 1.0, "gramos": 1.0}


def gramos(texto):
    """Formato en gramos a partir del nombre o el slug. None si no es fiable."""
    if not texto:
        return None
    t = str(texto).replace(",", ".").lower()
    mejor = None
    for m in re.finditer(r"(\d+(?:\.\d+)?)\s*-?\s*(kgs|kg|gramos|grs|gr|g)\b", t):
        v = float(m.group(1)) * _UNIDAD[m.group(2)]
        if 50 <= v <= 5000:                      # descarta dosis ("5 g por toma") y ruido
            mejor = v if mejor is None else max(mejor, v)
    return mejor


def url_imagen(valor):
    """Primera imagen utilizable del JSON-LD, absoluta y con esquema. None si no hay.

    Las tiendas la publican de tres formas: HSN y Myprotein en absoluta, Prozis sin
    esquema ("//static.sscontent.com/..."), Life Pro sin esquema NI barras
    ("www.lifepronutrition.com/5105/..."). Y unas la dan como cadena y otras como lista.

    Zumub ademas mete espacios en el nombre del fichero ("zumub_egg white powder_LRG.jpg"):
    sin escapar, urllib la rechaza al vuelo y el navegador la pide partida.
    """
    for u in (valor if isinstance(valor, list) else [valor]):
        if isinstance(u, dict):                     # a veces es un ImageObject
            u = u.get("url") or u.get("contentUrl")
        u = (u or "").strip()
        if not u:
            continue
        if u.startswith("//"):
            u = "https:" + u
        elif not u.startswith("http"):
            u = "https://" + u.lstrip("/")
        return urllib.parse.quote(u, safe=":/?#[]@!$&'()*+,;=%~")
    return None


def raciones(texto):
    m = re.search(r"(\d+)\s*raciones|(\d+)\s*servicios|(\d+)\s*dosis|(\d+)\s*tomas",
                  (texto or "").lower())
    return float(next(g for g in m.groups() if g)) if m else None


def unidades(texto):
    """Capsulas (o perlas, tabletas...) por envase. None si no es fiable.

    Omega 3 y multivitaminicos no se venden en polvo: sin esto no hay forma de
    comparar dos botes de la misma categoria.
    """
    # [a-z]*caps: cada tienda las llama distinto (caps, vcaps, vegancaps, softcaps).
    m = re.search(r"(\d+)\s*(?:c[aá]psulas?|[a-z]*caps\b|softgels?|perlas|tabletas|"
                  r"tabs\b|comprimidos|unidades)", (texto or "").lower())
    if not m:
        return None
    n = float(m.group(1))
    return n if 10 <= n <= 1000 else None     # descarta "1 capsula al dia" y el ruido


def medida(*textos, categoria=None):
    """(gramos, unidades) de lo primero que lo diga: nombre, etiqueta de formato o slug.

    Con categoria, solo devuelve la medida en la que se vende y se compara ESA categoria
    (kg en polvo, capsulas en perlas). Un preentreno en capsulas o un omega 3 a granel
    quedan asi fuera: no es que sobren, es que no hay forma de ponerlos en la misma tabla
    sin cambiar de unidad a mitad de columna. El guardarraíl esta aqui y no en el motor
    porque asi ni siquiera se descargan.
    """
    g = u = None
    for t in textos:
        g = g or gramos(t)
        u = u or unidades(t)
    if categoria:
        unidad = categorias.unidad(categoria)
        return (g, None) if unidad == "kg" else (None, u)
    return g, u


FORMAS = [
    ("kre_alkalyn", r"kre[\s-]?alkalyn|creatina alcalina|evokalyn"),
    ("hcl", r"\bhcl\b|clorhidrato"),
    ("gluconato", r"gluconato"),
    ("citrato", r"citrato"),
    ("monohidrato", r"monohidrato|monohydrate|creapure|micronizada|micronized|mesh"),
]


def forma(texto):
    t = (texto or "").lower()
    for nombre, patron in FORMAS:
        if re.search(patron, t):
            return nombre
    return None


INGREDIENTE_POR_FORMA = {
    "monohidrato": "creatina_monohidrato", "hcl": "creatina_hcl",
    "kre_alkalyn": "creatina_kre_alkalyn", "gluconato": "creatina_gluconato",
    "citrato": "creatina_citrato",
}

SELLOS = [
    ("creapure", r"creapure"),
    ("informed_sport", r"informed[\s-]?sport"),
    ("informed_choice", r"informed[\s-]?choice"),
    ("ifos", r"\bifos\b"),
    ("nsf", r"nsf certified|nsf for sport"),
]


def sellos_declarados(texto):
    """Sellos MENCIONADOS en la ficha. Nivel 2 siempre: mencionar no es verificar."""
    t = (texto or "").lower()
    return [{"tipo": tipo, "nivel_verificacion": 2, "verificado_por": "auto"}
            for tipo, patron in SELLOS if re.search(patron, t)]


# Lo que no es un producto comparable en ninguna categoria: lotes, ropa y muestras.
# Lo que distingue a UNA categoria de otra (capsulas, whey, isolate...) vive en
# categorias.py, porque el motor de scoring necesita saber lo mismo.
DESCARTAR = re.compile(r"\bpack\b|bundle|shaker|camiseta|toalla|botella|muestra|sample|"
                       r"gummies|barrita", re.I)

_cache_patron = {}


def _patron(clave, texto):
    """re.compile con memoria: los filtros se evaluan una vez por producto y tienda."""
    if clave not in _cache_patron:
        _cache_patron[clave] = re.compile(texto, re.I) if texto else None
    return _cache_patron[clave]


def es_valido(nombre, categoria="creatina"):
    """Si ese nombre (o ese slug) es un producto de esa categoria."""
    n = nombre or ""
    cfg = config_categoria(categoria)
    filtro = _patron((categoria, "filtro"), cfg.get("filtro"))
    if filtro and not filtro.search(n):
        return False
    excluye = _patron((categoria, "excluye"), cfg.get("excluye"))
    if excluye and excluye.search(n):
        return False
    return not DESCARTAR.search(n)


# Nombres de la tabla nutricional -> ingrediente normalizado.
# ponytail: la citrulina total se compara contra la referencia de citrulina malato. No es
# exacto (la base rinde mas por gramo que el malato); si aparece una referencia citada
# para citrulina base, se separan en dos ingredientes.
INGREDIENTES_TABLA = [
    ("creatina_monohidrato",
     r"creatina\s+monohidrato|monohidrato\s+de\s+creatina|creapure"),
    ("citrulina_malato", r"citrulina"),
    ("beta_alanina", r"beta[\s-]?alanina"),
    ("cafeina", r"cafe[ií]na"),
    ("taurina", r"\btaurina\b"),
    ("tirosina", r"tirosina"),
    ("arginina", r"arginina"),
    ("carnitina", r"carnitina"),
    # EPA y DHA van a la MISMA referencia: la dosis citada (EFSA) es la suma de los dos,
    # y las fichas los publican en dos filas. _ingredientes de HSN las suma.
    # "Acidos grasos Omega 3" a secas es como titula HSN esa misma suma en la mitad de
    # sus fichas de aceite de pescado: sin esta alternativa se quedaban sin dosis.
    ("omega_3_epa_dha",
     r"\bepa\b|\bdha\b|eicosapentaenoico|docosahexaenoico|omega[\s-]?3"),
    ("melatonina", r"melatonina|melatonin"),
    # Los que se leen desde que la tabla de dosis tiene su referencia (11 mas). Van
    # DESPUES de los de arriba porque el primero que casa gana y varios son mas
    # genericos: "vitamina c" aparece dentro de la ficha de un multivitaminico.
    #
    # OJO con la sal: una ficha que dice "oxido de magnesio 500 mg" no declara 500 mg de
    # magnesio elemental, sino de la sal. Aqui se lee lo que la etiqueta pone al lado del
    # nombre del activo, que es lo unico comprobable sin abrir el bote.
    # ponytail: techo conocido. Si algun dia se quiere el elemental, hay que leer la
    # tabla nutricional entera y no una cifra suelta, y eso es otro scraper.
    ("curcuminoides", r"curcuminoid|curcumin|c[uú]rcuma|curcuma|turmeric"),
    ("ashwagandha", r"ashwagandha|withania"),
    ("glucosamina", r"glucosamina|glucosamine"),
    ("condroitina", r"condroitin|chondroitin"),
    ("magnesio", r"magnesio|magnesium"),
    ("zinc", r"\bzinc\b|\bcinc\b"),
    ("hierro", r"\bhierro\b|bisglicinato de hierro|ferroso|ferrico"),
    ("vitamina_c", r"vitamina[\s-]?c\b|vitamin[\s-]?c\b|[aá]cido asc[oó]rbico|ascorbato"),
    ("vitamina_e", r"vitamina[\s-]?e\b|vitamin[\s-]?e\b|tocoferol"),
    ("calcio", r"\bcalcio\b|\bcalcium\b"),
    ("potasio", r"\bpotasio\b|\bpotassium\b"),
]

# Suelo de la cifra que se acepta como dosis, por ingrediente. El general son 10 mg:
# por debajo, en la ficha de un preentreno, lo que hay son precios, calorias y numeros
# sueltos, no dosis. La melatonina es la excepcion de verdad: su dosis util es 1 mg (la
# condicion de uso de la declaracion autorizada en la UE), asi que con el suelo comun
# ninguna melatonina llegaba a tener dosis y la categoria entera se quedaba sin nota.
MIN_MG = {"melatonina": 0.5, "zinc": 4, "hierro": 4, "vitamina_e": 4}

# Minerales: la etiqueta casi nunca declara el elemento, declara la SAL. "Citrato de
# magnesio 1490 mg" no son 1490 mg de magnesio, son unos 240: el citrato pesa seis veces
# mas que el magnesio que lleva dentro. Leer esa cifra como dosis publica un "en rango
# efectivo" falso en la ficha de un producto que no llega ni a la mitad.
#
# No se convierte (cada sal tiene su factor y la etiqueta no dice cual, ni en que
# proporcion cuando mezcla dos). Se descarta: de la formula de un producto que no publica
# el elemental, esta web no afirma nada. Es la misma regla que ya rige en el motor.
MINERALES = {"magnesio", "zinc", "hierro", "calcio", "potasio"}
SAL = re.compile(r"(citrato|[oó]xido|hidr[oó]xido|carbonato|sulfato|cloruro|gluconato|"
                 r"lactato|malato|aspartato|orotato|quelato|bisglicinato|glicinato|"
                 r"picolinato|taurato|treonato|fumarato|pidolato|marino|"
                 r"pirofosfato|ascorbato)\s+(de\s+)?$")


def normalizar_ingrediente(texto):
    t = (texto or "").lower()
    for nombre, patron in INGREDIENTES_TABLA:
        if re.search(patron, t):
            return nombre
    return None


# Activos cuya cifra NO se lee del nombre del producto, solo de la ficha.
#
# En el titulo, la cifra de una planta es publicidad: "Ashwagandha 9000mg" es la
# equivalencia de un extracto 10:1 (lleva 900 de extracto, no 9000 de nada), "Curcuma
# 20.000mg" lo mismo, "Onagra + Vitamina E 660 mg" son 660 mg de aceite de onagra y no de
# vitamina E, y "Hierro 556,8 Mg" es lo que pesa la capsula entera. Las cuatro salian como
# dosis y ponian "en rango efectivo" donde no lo hay.
#
# Los de siempre (creatina, cafeina, los de un preentreno) se siguen leyendo del titulo:
# ahi la cifra si es la dosis, y de ahi salen la mitad de las formulas del sitio.
SOLO_EN_FICHA = {"ashwagandha", "curcuminoides", "vitamina_e", "vitamina_c", "hierro",
                 "zinc", "magnesio", "calcio", "potasio", "glucosamina", "condroitina"}


def dosis_en_texto(texto, ficha=None):
    """Dosis por servicio que la ficha declara EN PROSA: "3 g de monohidrato de creatina".

    Myprotein publica asi la formula de sus preentrenos; Prozis, Life Pro y Nutritienda
    no publican ninguna cifra y esto devuelve []. El motor lo dice en el desglose: un
    producto que esconde su formula no se puntua a ciegas.

    `ficha` es la descripcion sola, sin el titulo. Cuando se pasa, los activos de
    SOLO_EN_FICHA se buscan ahi y no en el nombre comercial.
    """
    limpia = lambda x: re.sub(r"\s+", " ", _html.unescape(x or "")).lower()
    t_todo = limpia(texto)
    t_ficha = limpia(ficha) if ficha is not None else None
    fuera = []
    for ing, patron in INGREDIENTES_TABLA:
        t = t_ficha if (t_ficha is not None and ing in SOLO_EN_FICHA) else t_todo
        # La cifra puede ir delante ("200 mg de cafeina") o detras ("cafeina: 200 mg").
        # El [^.;] la ata a la misma frase: sin eso se cruzan dos ingredientes distintos.
        #
        # Se prueban las dos formas y gana la MAS CORTA, es decir, la cifra que esta mas
        # pegada al nombre del activo. Antes ganaba siempre la primera, y en una ficha de
        # "glucosamina 1500 mg y condroitina 1200 mg" la condroitina se quedaba con los
        # 1500 de su vecina: la dosis de al lado leida como propia.
        # El hueco entre la cifra y el nombre. En un mineral se deja mas largo porque la
        # etiqueta europea mete la sal en medio: "Magnesio (de citrato de magnesio) 375 mg"
        # son 34 caracteres desde el elemental hasta su cifra, y con 25 no llegaba.
        hueco = 40 if ing in MINERALES else 25
        candidatos = [m for x in (
            r"(\d+(?:[.,]\d+)?)\s*(mg|g)\b[^.;]{0,%d}?(?:%s)" % (hueco, patron),
            r"(?:%s)[^.;]{0,%d}?(\d+(?:[.,]\d+)?)\s*(mg|g)\b" % (patron, hueco),
        ) for m in re.finditer(x, t)]
        # En un mineral, la cifra pegada a una sal es la de la SAL, no la del elemento:
        # "citrato de magnesio 1490 mg" son unos 240 mg de magnesio. Se descarta cada
        # aparicion que cuelgue de una sal y se sigue mirando el resto, que es lo que deja
        # pasar la etiqueta europea de toda la vida, "Magnesio (de citrato de magnesio)
        # 375 mg": ahi el primer "magnesio" va suelto y es el elemental que hay que
        # declarar. Si todas cuelgan de una sal, este producto se queda sin dosis.
        if ing in MINERALES:
            limpios = []
            for m in candidatos:
                donde = re.search(patron, m.group(0))
                i = m.start() + (donde.start() if donde else 0)
                if not SAL.search(t[max(0, i - 22):i]):
                    limpios.append(m)
            candidatos = limpios
        if not candidatos:
            continue
        m = min(candidatos, key=lambda x: len(x.group(0)))
        mg = float(m.group(1).replace(",", ".")) * (1000 if m.group(2) == "g" else 1)
        if MIN_MG.get(ing, 10) <= mg <= 20000:   # fuera precios, calorias y numeros sueltos
            fuera.append({"ingrediente": ing, "dosis_por_servicio_mg": mg})
    return fuera


# --- lo que la ficha dice de la COMPOSICION y de lo que opinan los compradores -------
# Tres datos que ya estan publicados en la ficha y que hasta ahora se tiraban: la nota
# de los compradores, cuanto del bote es de verdad el activo y que aditivos lleva.


def valoracion(obj):
    """(nota sobre 5, numero de opiniones) del aggregateRating de la ficha.

    `obj` es el Product ya parseado, venga de ld_json o de microdatos: los dos devuelven
    la misma forma. Puede ser una lista y entonces vale la primera que traiga nota: en
    Zumub y Myprotein la variante no la lleva y su ProductGroup si. (None, None) si la
    tienda no publica opiniones.

    La nota se normaliza SIEMPRE a 5. Prozis y Promofarma puntuan sobre 10, y un 9,3 de
    Prozis no es el doble de bueno que un 4,7 de HSN: es lo mismo. Comparar las dos
    escalas sin normalizar pondria a media tienda por delante por como escribe su HTML.
    """
    if isinstance(obj, (list, tuple)):
        for candidato in obj:
            nota = valoracion(candidato)
            if nota[0] is not None:
                return nota
        return None, None
    ar = (obj or {}).get("aggregateRating") or {}
    if isinstance(ar, list):
        ar = ar[0] if ar else {}
    if not isinstance(ar, dict):
        return None, None
    try:
        nota = float(ar.get("ratingValue"))
        tope = float(ar.get("bestRating") or 5)
        n = int(float(ar.get("reviewCount") or ar.get("ratingCount") or 0))
    except (TypeError, ValueError):
        return None, None
    # Fuera notas imposibles (una escala mal declarada) y fichas con cero opiniones: una
    # media de cero votos no es una media.
    if not (tope > 0 and 0 <= nota <= tope and n >= 1):
        return None, None
    return round(5.0 * nota / tope, 2), n


# "Proteinas 22 g 74g": la tabla nutricional publica dos columnas, por servicio y por
# 100 g. La segunda ES la pureza del bote, sin estimarla: 74 g de proteina por cada 100 g
# de polvo. Es la diferencia real entre dos whey al mismo precio por kilo.
FILA_PROTEINA = re.compile(
    r"prote[ií]nas?\s*:?\s*(\d{1,3}(?:[.,]\d+)?)\s*g\b"
    r"(?:\s*(\d{1,3}(?:[.,]\d+)?)\s*g\b)?", re.I)


def texto_plano(html):
    """El HTML sin etiquetas y con los espacios colapsados. Para leer tablas y listas."""
    return re.sub(r"\s+", " ", _html.unescape(re.sub(r"<[^>]+>", " ", html or "")))


def pureza_declarada(html):
    """Fraccion del envase que ES proteina segun la tabla nutricional (0-1). None si no.

    Solo cuenta cuando la ficha publica la columna "por 100 g": con la del servicio sola
    haria falta saber cuanto pesa el servicio, y ahi ya se estaria estimando. Si la
    tienda no publica la tabla, esto devuelve None y el motor lo dice en el desglose:
    se sigue usando la pureza tipica de la categoria, que es lo que habia hasta ahora.
    """
    m = FILA_PROTEINA.search(texto_plano(html))
    if not m or not m.group(2):
        return None
    pureza = float(m.group(2).replace(",", ".")) / 100.0
    # Por debajo del 15 % no es un bote de proteina y por encima del 100 % es un error de
    # lectura (haber cogido dos numeros de filas distintas).
    return round(pureza, 3) if 0.15 <= pureza <= 1.0 else None


# Aditivos que restan calidad a un suplemento. No son ilegales ni peligrosos: son lo que
# distingue una etiqueta limpia de una que rellena, colorea y endulza. Cada tipo resta lo
# mismo, y el conjunto no puede restar mas de lo que dice SUELO_ADITIVOS.
# El RELLENO no esta aqui a proposito: no es lo mismo endulzar un bote (una preferencia
# de quien lo toma) que rebajarlo con maltodextrina para bajar el precio por kilo (dinero
# de quien lo compra). Lo segundo lo juzga scoring/requisitos.py, categoria a categoria,
# porque en un ganador de peso ese mismo carbohidrato es lo que has ido a comprar.
ADITIVOS = [
    ("edulcorante_artificial", r"sucralosa|acesulfamo|aspartamo|ciclamato|sacarina"),
    ("colorante", r"colorante|di[oó]xido de titanio|\bE1(?:0[1-9]|1\d|2\d)\b"),
    ("aroma_artificial", r"aroma artificial|sabor artificial|aromas? artificiales"),
    ("antiaglomerante", r"di[oó]xido de silicio|estearato de magnesio|sales de magnesio "
                        r"de [aá]cidos grasos|talco"),
]

# La declaracion de ingredientes de la etiqueta. La palabra "ingredientes" aparece varias
# veces en una ficha (tambien en la prosa de marketing), y una ficha con cinco sabores
# publica CINCO listas distintas: la de chocolate lleva cacao y la de vainilla no.
# Se leen todas y se suman, porque en la tabla hay una fila por formato y no por sabor:
# lo que se puede afirmar del producto es lo que declara en los sabores que vende.
_DECLARACION = re.compile(r"ingredientes\s*:?\s*(.{20,700})", re.I | re.S)
_FIN = re.compile(r"\.\s|al[eé]rgenos|modo de empleo|informaci[oó]n nutricional|"
                  r"puede contener|conservar en", re.I)


def listas_ingredientes(html):
    """Las declaraciones de ingredientes de la ficha. [] si no publica ninguna.

    Se corta en el primer punto y aparte: una lista de ingredientes no lleva puntos por
    dentro y un parrafo de marketing si, asi que lo que sobrevive con dos comas o mas es
    una lista y no una frase que menciona la palabra "ingredientes".

    Distinguir "no lleva aditivos" de "no lo dice" importa: castigar a un producto por lo
    que su tienda no publica seria inventarse el dato.
    """
    fuera = []
    for m in _DECLARACION.finditer(texto_plano(html)):
        corte = _FIN.search(m.group(1))
        trozo = (m.group(1)[:corte.start()] if corte else m.group(1)).strip(" .;")
        if trozo.count(",") >= 1 and len(trozo) >= 25 and trozo not in fuera:
            fuera.append(trozo)
    return fuera


# "Sin edulcorantes, colorantes ni aromas artificiales" es una etiqueta LIMPIA, y buscar
# las palabras sueltas la marcaria como la mas sucia de la tabla. Lo negado se borra antes
# de mirar nada. Se corta a 60 caracteres para no tragarse media lista detras de un
# inocente "sin gluten": equivocarse por aqui deja de penalizar, nunca penaliza de mas.
NEGADO = re.compile(r"\b(?:sin|libre de|no contiene|0\s*%\s+de)\b[^.;|]{0,60}", re.I)


# Tope de lo que se guarda de la etiqueta. Una ficha con cinco sabores publica cinco
# listas y las cinco se suman; sin tope, un producto de Amazon mete 6 KB de texto en una
# fila que se lee entera en cada pasada del motor.
TOPE_LISTA = 1500
# La descripcion se guarda entera hasta aqui: es de donde salen los requisitos que piden
# un dato declarado, y cortarla corta justo la parte tecnica, que va al final.
TOPE_DESCRIPCION = 3000


def lista_declarada(html):
    """La declaracion de ingredientes de la ficha, para guardarla tal cual.

    Se guarda el TEXTO y no solo lo que se dedujo de el: los requisitos de cada categoria
    se afinan a mano (scoring/requisitos.py) y afinarlos no puede obligar a volver a
    descargar 3.000 fichas. Ademas es lo que la ficha ensena al lector.
    """
    listas = listas_ingredientes(html)
    return " | ".join(listas)[:TOPE_LISTA] if listas else None


def aditivos(html, categoria=None):
    """Tipos de aditivo declarados en la etiqueta. None si la ficha no publica la lista."""
    listas = listas_ingredientes(html)
    if not listas:
        return None
    texto = NEGADO.sub(" ", " | ".join(listas))
    return [tipo for tipo, patron in ADITIVOS if re.search(patron, texto, re.I)]


class Scraper:
    """Interfaz comun. Anadir una tienda = un modulo nuevo en scraper/tiendas/."""

    tienda = "?"
    # Categorias que esta tienda cubre. run_scraper se salta las que no.
    categorias = ("creatina",)
    # La tienda corto la pasada a medias (429 por ratio). Lo que se trajo vale, pero no
    # se puede concluir que lo que falta haya dejado de venderse: run_scraper no borra.
    parcial = False

    def extraer(self, categoria="creatina"):
        """[{producto: {...}, ingredientes: [...], certificaciones: [...]}, ...]"""
        raise NotImplementedError

    def item(self, *, marca, nombre, url, precio_eur, formato_gramos=None, unidades=None,
             categoria="creatina", servicios=None, texto_extra="", ingredientes=None,
             imagen=None, ld=None, pagina=None):
        """Construye la fila normalizada. Los modulos de tienda solo rellenan campos.

        ld      El Product ya parseado de ESA ficha (ld_json o microdatos). De ahi sale
                la nota de los compradores.
        pagina  El HTML de ESA ficha, no el del listado. De ahi salen la pureza real y
                los aditivos. Un modulo que trabaje sobre un listado no lo pasa: mezclaria
                la tabla nutricional de un producto con el precio de otro.

        Los dos son opcionales a proposito: una tienda que no publique nada de esto
        (Amazon no emite schema.org) sigue entrando en la tabla con lo que si tiene.
        """
        # Alguna tienda sirve bytes rotos (Creapure�) y entidades HTML sin decodificar.
        nombre = _html.unescape(nombre).replace("\N{REPLACEMENT CHARACTER}", "")
        marca = marca_canonica(marca)
        # La marca dentro del nombre entra dos veces: en el titulo de la ficha se lee
        # "HSN HSN Creatina..." y, peor, la MISMA tienda puede listar el mismo bote con y
        # sin ella (Zumub: "EAA powder 250 g" y "Zumub EAA powder 250 g"), y entonces son
        # dos productos distintos para el agrupador, dos fichas y dos titulos iguales.
        # Se quita aqui una vez; la web vuelve a anteponerla al ensenarlo (seo.nom).
        if marca and nombre.lower().startswith(marca.lower() + " "):
            nombre = nombre[len(marca) + 1:].lstrip("-  ·|")
        contexto = "%s %s %s" % (nombre, url, texto_extra)
        f = forma(contexto)
        cfg = config_categoria(categoria)
        # En una formula el activo no es el bote: la dosis solo puede salir de la ficha.
        if cfg.get("modo") == "formula":
            ing = None
        elif cfg.get("activo_por_forma"):     # creatina: manda la forma quimica
            ing = INGREDIENTE_POR_FORMA.get(f) or cfg.get("activo")
        else:
            ing = cfg.get("activo")
        dosis = (formato_gramos * 1000 / servicios) if (servicios and formato_gramos) else None
        if ingredientes is None:
            # `texto_extra` es la ficha sin el titulo: de ahi salen los activos cuya cifra
            # en el nombre comercial es publicidad y no dosis (ver SOLO_EN_FICHA).
            ingredientes = (dosis_en_texto(contexto, ficha=texto_extra)
                            if cfg.get("modo") == "formula"
                            else [dict(ingrediente=ing, dosis_por_servicio_mg=dosis)]
                            if ing else [])
        # Una categoria puede acotar que activos cuentan: en un multivitaminico no
        # cuenta ninguno, y en un omega 3 solo el EPA+DHA.
        permitidos = cfg.get("ingredientes")
        if permitidos is not None:
            ingredientes = [i for i in ingredientes if i["ingrediente"] in permitidos]
        nota, n_opiniones = valoracion(ld)
        # La descripcion de la tienda, que es donde estan los datos que no caben en el
        # nombre (forma quimica, UFC, peso molecular, ratio del extracto). Sale del
        # schema.org de la ficha; si el modulo no lo pasa, del texto extra, pero solo
        # cuando es prosa: la mitad de las tiendas mandan ahi la URL.
        # `ld` puede ser una lista (Zumub y Myprotein pasan la variante y su ProductGroup):
        # vale la primera que traiga descripcion, igual que con la nota.
        desc = next((o.get("description") for o in (ld if isinstance(ld, list) else [ld])
                     if isinstance(o, dict) and o.get("description")), None)
        if not desc and len(texto_extra or "") > 80 and " " in (texto_extra or ""):
            desc = texto_extra
        desc = " ".join(_html.unescape(str(desc)).split())[:TOPE_DESCRIPCION] if desc else None
        # La pureza solo se lee donde significa algo: en un bote de proteina, donde la
        # diferencia entre el 71 % y el 82 % es la mitad de lo que estas comparando. En
        # una creatina el bote ES el activo y la tabla no anade nada.
        pureza = (pureza_declarada(pagina)
                  if pagina and (cfg.get("activo") or "").startswith(("proteina", "colageno"))
                  else None)
        return {
            "producto": dict(marca=marca, nombre=" ".join(nombre.split()),
                             categoria=categoria, tienda=self.tienda, url=url,
                             formato_gramos=formato_gramos, unidades=unidades,
                             servicios_por_envase=servicios,
                             precio_eur=precio_eur, forma=f,
                             imagen=url_imagen(imagen),
                             valoracion=nota, n_valoraciones=n_opiniones,
                             pureza_real=pureza,
                             # None = la ficha no publica la lista de ingredientes, que no
                             # es lo mismo que publicarla sin aditivos ([]).
                             aditivos=aditivos(pagina, categoria) if pagina else None,
                             lista_ingredientes=lista_declarada(pagina) if pagina else None,
                             descripcion=desc),
            # Manda lo que publique la ficha (tabla nutricional o prosa). Si no publica
            # nada y el bote ES el activo, el unico ingrediente es ese.
            "ingredientes": ingredientes,
            # Los sellos solo cuentan si se afirman del producto (nombre/URL).
            # En la descripcion larga aparecen de otros productos de la marca.
            "certificaciones": sellos_declarados("%s %s" % (nombre, url)),
        }


# Cuantos productos con la MISMA nota exacta hacen falta para sospechar, y que fraccion
# del catalogo de la tienda tienen que ser. DosFarma publica en las 51 fichas que se le
# leyeron el mismo 4,86 con 36.502 opiniones: no es la nota del producto, es la de la
# TIENDA, sacada de su widget de resenas. Publicarla como si fuera del bote pondria a
# toda la tienda con sobresaliente sin que nadie haya valorado nada.
MIN_FICHAS_SOSPECHA = 5
FRACCION_SOSPECHA = 0.8


def valoracion_es_de_la_tienda(filas):
    """True si la nota que trae esa tienda es la del sitio y no la de cada producto.

    Se decide por lo que hacen TODAS sus fichas juntas, no ficha a ficha: una nota
    repetida en dos productos es normal; repetida en el catalogo entero, con el mismo
    numero de opiniones al decimal y CRUZANDO MARCAS, no es la de ningun producto.

    Lo de las marcas no es un adorno: Zumub publica sus ocho formatos de creatina como
    variantes de una sola ficha y los ocho comparten, con razon, el 4,5 de 2.504 opiniones
    del producto. Sin mirar la marca, ese caso legitimo se tiraba igual que el de DosFarma.
    """
    notas = {}
    for f in filas:
        p = f["producto"]
        if p.get("valoracion") is not None:
            pareja = (p["valoracion"], p.get("n_valoraciones"))
            veces, marcas = notas.get(pareja, (0, set()))
            notas[pareja] = (veces + 1, marcas | {p.get("marca")})
    total = sum(veces for veces, _ in notas.values())
    if total < MIN_FICHAS_SOSPECHA:
        return False
    return any(veces >= total * FRACCION_SOSPECHA and len(marcas) > 1
               for veces, marcas in notas.values())
    for pareja, marcas in notas.items():
        cuantos = sum(1 for f in filas
                      if (f["producto"].get("valoracion"),
                          f["producto"].get("n_valoraciones")) == pareja)
        if cuantos >= total * FRACCION_SOSPECHA and len(marcas) > 1:
            return True
    return False


# --- guardarrail de plausibilidad -----------------------------------------------
# Rangos en los que un precio por unidad de venta es CREIBLE. No son gustos: por debajo
# del suelo lo que hay es un error de emparejamiento, no una ganga. El caso real:
# Zumub vende el sobre monodosis de 30 g en la MISMA ficha que el bote de 1 kg; como
# `gramos` descarta 30 g (es una dosis, no un formato), el formato caia al de la URL
# -el del bote- y el sobre de 1,23 EUR salia en la tabla a 1,23 EUR/kg, primero del
# ranking. Por arriba pasa lo mismo al reves (una caja de 20x60 g leida como 60 g).
#
# Calibrado contra el catalogo real del 2026-08-28: lo mas barato de verdad es la
# dextrosa a 3,02 EUR/kg y la melatonina a 0,011 EUR/comprimido; lo mas caro creible,
# una creatina Creapure de 150 g a 293 EUR/kg y un probiotico a 1,96 EUR/capsula.
LIMITES_EUR = {"kg": (2.5, 300.0), "unidad": (0.005, 3.0)}


def sospechoso(producto):
    """Motivo por el que esta fila no es creible, o None si lo es.

    Vive en core y lo aplica run_scraper a las nueve tiendas: cada scraper se equivoca
    a su manera, pero un precio por kilo imposible se ve igual en todas.
    """
    precio = producto.get("precio_eur")
    if not precio or precio <= 0:
        return "precio %r" % (precio,)
    for campo, unidad, por in (("formato_gramos", "kg", 1000.0), ("unidades", "unidad", 1.0)):
        cantidad = producto.get(campo)
        if not cantidad:
            continue
        ratio = precio / (cantidad / por)
        suelo, techo = LIMITES_EUR[unidad]
        if not suelo <= ratio <= techo:
            return "%.3f EUR/%s (%s=%s, precio=%s)" % (ratio, unidad, campo, cantidad, precio)
    return None
