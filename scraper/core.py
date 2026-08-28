"""Fontaneria comun de los scrapers: descarga educada, cache y normalizacion.

ponytail: solo stdlib. La extraccion va contra JSON-LD (schema.org), que las
tiendas publican para Google y cambia mucho menos que su HTML. Sin requests ni bs4.
"""

import gzip
import hashlib
import html as _html
import json
import logging
import re
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
CACHE_TTL_S = 6 * 3600

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
    """
    for u in (valor if isinstance(valor, list) else [valor]):
        if isinstance(u, dict):                     # a veces es un ImageObject
            u = u.get("url") or u.get("contentUrl")
        u = (u or "").strip()
        if not u:
            continue
        if u.startswith("//"):
            return "https:" + u
        if not u.startswith("http"):
            return "https://" + u.lstrip("/")
        return u
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
]

# Suelo de la cifra que se acepta como dosis, por ingrediente. El general son 10 mg:
# por debajo, en la ficha de un preentreno, lo que hay son precios, calorias y numeros
# sueltos, no dosis. La melatonina es la excepcion de verdad: su dosis util es 1 mg (la
# condicion de uso de la declaracion autorizada en la UE), asi que con el suelo comun
# ninguna melatonina llegaba a tener dosis y la categoria entera se quedaba sin nota.
MIN_MG = {"melatonina": 0.5}


def normalizar_ingrediente(texto):
    t = (texto or "").lower()
    for nombre, patron in INGREDIENTES_TABLA:
        if re.search(patron, t):
            return nombre
    return None


def dosis_en_texto(texto):
    """Dosis por servicio que la ficha declara EN PROSA: "3 g de monohidrato de creatina".

    Myprotein publica asi la formula de sus preentrenos; Prozis, Life Pro y Nutritienda
    no publican ninguna cifra y esto devuelve []. El motor lo dice en el desglose: un
    producto que esconde su formula no se puntua a ciegas.
    """
    t = re.sub(r"\s+", " ", _html.unescape(texto or "")).lower()
    fuera = []
    for ing, patron in INGREDIENTES_TABLA:
        # La cifra puede ir delante ("200 mg de cafeina") o detras ("cafeina: 200 mg").
        # El [^.;] la ata a la misma frase: sin eso se cruzan dos ingredientes distintos.
        m = (re.search(r"(\d+(?:[.,]\d+)?)\s*(mg|g)\b[^.;]{0,25}?(?:%s)" % patron, t)
             or re.search(r"(?:%s)[^.;]{0,25}?(\d+(?:[.,]\d+)?)\s*(mg|g)\b" % patron, t))
        if not m:
            continue
        mg = float(m.group(1).replace(",", ".")) * (1000 if m.group(2) == "g" else 1)
        if MIN_MG.get(ing, 10) <= mg <= 20000:   # fuera precios, calorias y numeros sueltos
            fuera.append({"ingrediente": ing, "dosis_por_servicio_mg": mg})
    return fuera


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
             imagen=None):
        """Construye la fila normalizada. Los modulos de tienda solo rellenan campos."""
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
            ingredientes = (dosis_en_texto(contexto) if cfg.get("modo") == "formula"
                            else [dict(ingrediente=ing, dosis_por_servicio_mg=dosis)]
                            if ing else [])
        # Una categoria puede acotar que activos cuentan: en un multivitaminico no
        # cuenta ninguno, y en un omega 3 solo el EPA+DHA.
        permitidos = cfg.get("ingredientes")
        if permitidos is not None:
            ingredientes = [i for i in ingredientes if i["ingrediente"] in permitidos]
        return {
            "producto": dict(marca=marca, nombre=" ".join(nombre.split()),
                             categoria=categoria, tienda=self.tienda, url=url,
                             formato_gramos=formato_gramos, unidades=unidades,
                             servicios_por_envase=servicios,
                             precio_eur=precio_eur, forma=f,
                             imagen=url_imagen(imagen)),
            # Manda lo que publique la ficha (tabla nutricional o prosa). Si no publica
            # nada y el bote ES el activo, el unico ingrediente es ese.
            "ingredientes": ingredientes,
            # Los sellos solo cuentan si se afirman del producto (nombre/URL).
            # En la descripcion larga aparecen de otros productos de la marca.
            "certificaciones": sellos_declarados("%s %s" % (nombre, url)),
        }


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
