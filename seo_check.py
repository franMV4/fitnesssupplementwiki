"""Comprobaciones de SEO sobre el sitio ya construido (web/dist).

No mira el codigo fuente: mira el HTML que va a leer Google, que es el unico que
cuenta. Sin red, sin dependencias y sin framework, como el resto del proyecto.

    cd web && npm run build
    python seo_check.py

Falla (codigo de salida 1) si una pagina se queda sin titulo, sin descripcion o sin
canonical, si hay dos H1, si un JSON-LD no parsea, si un enlace interno apunta a una
pagina que no existe, si el sitemap no lista todo lo indexable o si queda un dominio
de ejemplo.
"""

import json
import pathlib
import re
import sys
import urllib.parse

DIST = pathlib.Path(__file__).parent / "web" / "dist"

# Limites de corte de Google. No son leyes, pero un titulo de 90 caracteres se corta
# a la mitad en el resultado y una descripcion de 40 la reescribe el buscador.
TITULO_MIN, TITULO_MAX = 15, 80
DESC_MIN, DESC_MAX = 50, 210

RE_TITULO = re.compile(r"<title>(.*?)</title>", re.S)
RE_DESC = re.compile(r'<meta name="description" content="(.*?)"', re.S)
RE_CANON = re.compile(r'<link rel="canonical" href="(.*?)"')
RE_H1 = re.compile(r"<h1[\s>]")
RE_LD = re.compile(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', re.S)
RE_HREF = re.compile(r'href="(/[^"]*)"')
RE_FILA = re.compile(r"<tbody[^>]*>\s*<tr")


def desescapar(s):
    return (s.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
             .replace("&quot;", '"').replace("&#39;", "'"))


def ruta_url(html):
    """De web/dist/creatina/index.html a /creatina."""
    rel = html.relative_to(DIST).as_posix()
    rel = re.sub(r"(^|/)index\.html$", "", rel)
    rel = re.sub(r"\.html$", "", rel)          # 404.html se sirve como /404
    return "/" + rel if rel else "/"


def existe(ruta):
    """Si una ruta absoluta del sitio tiene un fichero detras en dist."""
    limpia = urllib.parse.unquote(ruta.split("#")[0].split("?")[0]).lstrip("/")
    if not limpia:
        return True
    base = DIST / limpia
    return base.is_file() or (base / "index.html").is_file() or base.with_suffix(".html").is_file()


def revisa_ld(url, nodo, fallos=None):
    """Recorre el JSON-LD entero comprobando lo que Google penaliza a mano.

    Se hace aqui y no en tests.py porque estas cosas solo existen en el HTML ya
    construido: el dataset no sabe nada de schema.org.
    """
    fallos = [] if fallos is None else fallos
    if isinstance(nodo, list):
        for n in nodo:
            revisa_ld(url, n, fallos)
        return fallos
    if not isinstance(nodo, dict):
        return fallos

    tipo = nodo.get("@type")
    # Invariante del proyecto: NUNCA aggregateRating. Significa "media de opiniones de
    # usuarios" y aqui no hay usuarios opinando; publicarlo es marcado enganoso, y la
    # penalizacion manual por marcado se lleva el dominio entero, no la ficha. Las
    # estrellas se buscan por el camino legitimo: el Review editorial con su autor.
    if "aggregateRating" in nodo:
        fallos.append(f"{url}: JSON-LD con aggregateRating (no hay opiniones de usuarios)")
    if tipo == "Review":
        r = nodo.get("reviewRating") or {}
        if not nodo.get("author"):
            fallos.append(f"{url}: Review sin author")
        if r.get("ratingValue") is None:
            fallos.append(f"{url}: Review sin ratingValue")
        elif not (r.get("worstRating", 0) <= r["ratingValue"] <= r.get("bestRating", 5)):
            fallos.append(f"{url}: Review con ratingValue fuera de rango")
    if tipo == "AggregateOffer":
        ofertas = nodo.get("offers") or []
        if nodo.get("offerCount") != len(ofertas):
            fallos.append(f"{url}: AggregateOffer con offerCount que no cuadra")
        if (nodo.get("lowPrice") or 0) > (nodo.get("highPrice") or 0):
            fallos.append(f"{url}: AggregateOffer con lowPrice > highPrice")
    if tipo == "Offer" and not nodo.get("priceValidUntil"):
        # Sin fecha de caducidad Google marca la oferta como vieja y el fragmento se
        # queda sin precio, que es justo el dato por el que existe esta web.
        fallos.append(f"{url}: Offer sin priceValidUntil")

    for v in nodo.values():
        if isinstance(v, (dict, list)):
            revisa_ld(url, v, fallos)
    return fallos


def main():
    if not DIST.is_dir():
        sys.exit("No hay web/dist. Corre `cd web && npm run build` antes.")

    fallos = []
    titulos, descripciones = {}, {}
    paginas = sorted(DIST.rglob("*.html"))
    # Las paginas con noindex (entrar, registro) no van al sitemap A PROPOSITO: pedir
    # que se rastree lo que se ha marcado como no indexable es contradecirse.
    sin_indexar = set()

    for html in paginas:
        url = ruta_url(html)
        texto = html.read_text(encoding="utf-8", errors="replace")
        # El 404 no se indexa ni tiene canonical propio: se comprueba que existe y ya.
        es_404 = url == "/404"
        if re.search(r'name="robots"[^>]*content="noindex', texto):
            sin_indexar.add(url)

        t = RE_TITULO.search(texto)
        titulo = desescapar(t.group(1).strip()) if t else ""
        if not titulo:
            fallos.append(f"{url}: sin <title>")
        elif not TITULO_MIN <= len(titulo) <= TITULO_MAX:
            fallos.append(f"{url}: titulo de {len(titulo)} caracteres ({titulo[:60]}...)")
        titulos.setdefault(titulo, []).append(url)

        d = RE_DESC.search(texto)
        desc = desescapar(d.group(1).strip()) if d else ""
        if not desc:
            fallos.append(f"{url}: sin meta description")
        elif not DESC_MIN <= len(desc) <= DESC_MAX:
            fallos.append(f"{url}: descripcion de {len(desc)} caracteres")
        descripciones.setdefault(desc, []).append(url)

        c = RE_CANON.search(texto)
        if not c:
            fallos.append(f"{url}: sin canonical")
        elif not es_404 and urllib.parse.urlparse(c.group(1)).path.rstrip("/") != url.rstrip("/"):
            fallos.append(f"{url}: canonical apunta a {c.group(1)}")

        n_h1 = len(RE_H1.findall(texto))
        if n_h1 != 1:
            fallos.append(f"{url}: {n_h1} etiquetas h1 (tiene que haber una)")

        for i, bloque in enumerate(RE_LD.findall(texto)):
            try:
                fallos += revisa_ld(url, json.loads(bloque))
            except json.JSONDecodeError as e:
                fallos.append(f"{url}: JSON-LD #{i + 1} no parsea ({e})")
        if not RE_LD.search(texto):
            fallos.append(f"{url}: sin JSON-LD")

        if "ejemplo.es" in texto:
            fallos.append(f"{url}: queda un dominio de ejemplo")

        # Las landings de intencion (/mejores, /comparativa) existen para responder una
        # consulta de compra. Una con la tabla vacia no responde nada y ademas se lleva
        # por delante la confianza en las otras cincuenta.
        if url.startswith(("/mejores/", "/comparativa/")):
            if not RE_FILA.search(texto):
                fallos.append(f"{url}: landing sin ninguna fila de producto")
            if "/producto/" not in texto:
                fallos.append(f"{url}: landing sin enlaces a fichas")

        for href in set(RE_HREF.findall(texto)):
            if not existe(href):
                fallos.append(f"{url}: enlace interno roto -> {href}")

    for titulo, urls in titulos.items():
        if len(urls) > 1:
            # Dos paginas con el mismo titulo compiten entre ellas por la misma consulta.
            fallos.append(f"titulo repetido en {len(urls)} paginas: {titulo[:60]} ({urls[0]}, {urls[1]})")
    for desc, urls in descripciones.items():
        if len(urls) > 1:
            fallos.append(f"descripcion repetida en {len(urls)} paginas ({urls[0]}, {urls[1]})")

    sitemap = DIST / "sitemap.xml"
    if not sitemap.is_file():
        fallos.append("no hay sitemap.xml")
    else:
        norm = lambda u: (urllib.parse.urlparse(u).path.rstrip("/") or "/")
        locs = {norm(u) for u in re.findall(r"<loc>(.*?)</loc>",
                                            sitemap.read_text(encoding="utf-8"))}
        for html in paginas:
            url = ruta_url(html)
            if url == "/404" or url in sin_indexar:
                continue
            if norm(url) not in locs:
                fallos.append(f"el sitemap no lista {url}")

    robots = DIST / "robots.txt"
    if not robots.is_file():
        fallos.append("no hay robots.txt")
    else:
        cuerpo = robots.read_text(encoding="utf-8")
        if "Sitemap:" not in cuerpo:
            fallos.append("robots.txt sin linea Sitemap")
        for bot in ("GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"):
            if bot not in cuerpo:
                fallos.append(f"robots.txt no menciona {bot}")

    if not (DIST / "llms.txt").is_file():
        fallos.append("no hay llms.txt")

    print(f"{len(paginas)} paginas comprobadas.")
    if fallos:
        for f in fallos[:60]:
            print("  FALLO", f)
        if len(fallos) > 60:
            print(f"  ... y {len(fallos) - 60} mas")
        sys.exit(1)
    print("SEO OK.")


if __name__ == "__main__":
    main()
