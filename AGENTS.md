# Contexto para IA — FitnessSupplementWiki

**Qué es**: web estática que compara suplementos por **precio en la unidad en que se venden**
(€/kg en polvo, €/cápsula en perlas y comprimidos) y por **nivel de verificación (1-4) de sus
certificaciones**. Mercado español. Fases 0-7 del `plan-comparador-suplementos.md` ejecutadas.

**Cambio de criterio del 2026-08-21 (decisión del dueño)**: el ranking iba por *coste por dosis
efectiva*; ahora va por precio por kilo o por cápsula. El motivo: solo HSN (y Myprotein en
prosa) publican los mg por dosis, así que el 60 % del catálogo se quedaba sin nota. El coste por
dosis **se sigue calculando y se enseña en la ficha del producto**, pero no mueve el ranking ni
sale en las tablas. Si esto se revierte, hay que revertir con ello los textos de `/metodologia`,
la portada, el pie de `Base.astro` y la cabecera de la tabla.

**Categorías** (2026-08-25): **30**, los suplementos más vendidos del sector. Las 9
originales (creatina, preentreno, proteína whey, proteína aislada, BCAA, glutamina, colágeno,
omega 3, multivitamínicos) + 21 nuevas: proteína vegana, caseína, ganadores de peso, EAA,
beta-alanina, citrulina, carbohidratos, magnesio, zinc, hierro, vitamina D, vitamina C,
vitamina B12, ZMA, ashwagandha, melatonina, cafeína, probióticos, cúrcuma, glucosamina y
L-carnitina. **21 de las 30 no se puntúan por dosis** (`modo="formula"` con
`ingredientes=()`), igual que ya pasaba con los multivitamínicos: no hay dosis efectiva
citable para un mineral o un extracto, y se dice en su página en vez de inventarla.

**Tiendas** (2026-08-28): **9**. Las 5 de siempre (HSN, Myprotein, Nutritienda, Life Pro,
Prozis) + **Amazon** (HTML de resultados de búsqueda; no publica datos estructurados),
**Zumub** (`ProductGroup` JSON-LD con un `hasVariant` por formato) y **iO.GENIX** (tienda
oficial de la marca, PrestaShop: la rejilla de categoría trae nombre, precio e imagen en
atributos, una petición por categoría). MASmusculo sigue bloqueada y solo tiene creatina
mapeada.

**Stack**: Python 3 **solo stdlib** (sin requests, sin bs4, sin ORM) + SQLite + Astro
estático con una isla React. `npm` solo dentro de `web/`.

## Pipeline (orden fijo)

```
run_scraper.py → verificar.py auto → limpiar_marcas + guardar_historico → scoring/motor.py
   tiendas         certificaciones      normaliza marcas y congela el precio    tabla score

  →  exportar.py  →  astro build
     dataset.json     web/dist
```

- `python actualizar.py` — hace los 4 primeros pasos de todas las categorías.
- `python tests.py` — 63 asserts, sin red ni framework. Correr siempre antes de terminar.
- `cd web && node --test` — 15 asserts de la API y del filtrado de la tabla.
- `cd web && npm run dev` (puerto 4322) / `npm run build`.

## Mapa de ficheros

| Fichero | Rol |
|---|---|
| `data/schema.sql` | 6 tablas: producto, ingrediente_producto, certificacion, dosis_referencia, score y **precio_historico** (un precio por producto y día; es el único dato que no se puede reconstruir después). |
| `data/db.py` | `connect/init/guardar_producto` (upsert por `tienda+url`), `limpiar_marcas` y `guardar_historico`. Autocomprobación en `__main__`. |
| `categorias.py` | **Registro único de categorías**: filtro de nombre, exclusiones, activo y modo (simple/fórmula). Lo leen scraper, motor y exportador. |
| `data/dosis_referencia.json` | Dosis efectivas, purezas típicas y fuentes citadas. **Lo edita una persona, nunca el código.** |
| `data/afiliados.json` | Enlaces de afiliado. El scoring NO lo importa. |
| `scraper/core.py` | fetch educado (robots/delay/caché), `ld_json`, normalizadores, clase `Scraper`. |
| `scraper/tiendas/*.py` | Una tienda por módulo, autodescubiertos. Añadir tienda = fichero nuevo. |
| `verificar.py` | CLI: `auto`, `pendientes`, `qs`, `analisis`, `bajar`. |
| `scoring/config.py` | **Todos** los pesos. Cambiar aquí cambia ranking y página /metodologia. |
| `scoring/motor.py` | `evaluar()` puro + `puntuar_categoria()` + `sellos_de()`. |
| `exportar.py` | BD → `web/src/datos/dataset.json` (agrupa sabores, aplica afiliados y sellos). |
| `web/functions/api/[[ruta]].js` | **Toda la API** (cuentas y reseñas de lectores), una sola Pages Function. Sin dependencias: PBKDF2 y HMAC de WebCrypto. |
| `web/schema.sql` | Tablas de D1 (`usuarios`, `resenas`). Ojo: NO es `data/schema.sql`, que es la de SQLite del catálogo. |
| `web/wrangler.toml` | Bindings de D1 y R2. Existe para que `wrangler pages deploy` suba también las funciones. |
| `web/api.test.mjs` | `cd web && node --test`. Prueba claves, firma de sesión y el filtro de `?volver`. |
| `web/tabla.test.mjs` | El filtrado y el orden de la tabla, y que `paraTabla` no deje pasar campos que la isla no pinta. |
| `web/src/datos/util.js` | Helpers compartidos **y** `filtrar`/`ORDENES` (fuera del componente para poder probarlos sin navegador), `paraTabla` (adelgaza las props de la isla) y la selección de `/comparar` en localStorage. |
| `web/src/componentes/Historico.astro` | La serie de precios de la ficha, SVG dibujado en build. No pinta nada hasta que haya dos lecturas. |
| `web/src/componentes/Comparador.jsx` | `/comparar`: lo que el lector guarda con "+ comparar". Lee `localStorage` y pide `/datos/<categoria>.json`; no lleva datos en el HTML. |
| `web/src/componentes/Acceso.jsx` | **Un solo formulario de acceso** para `/entrar`, `/registro` y el hueco de la ficha. Tres copias acaban siendo tres formularios distintos. |
| `web/src/datos/evidencia.js` | **Guías de evidencia por ingrediente** (efectos con cifra + DOI, dosis, cuándo sí y cuándo no). **Lo edita una persona, nunca el código**, igual que `dosis_referencia.json`. |

## El front: sistema "Rotativa" (rediseñado el 2026-08-27)

Portada de diario de precios impresa a dos tintas, no landing SaaS. Sustituye al sistema
"Boletin" (2026-08-21) sin tocar una sola clase: el rediseño entero es `global.css` mas
cuatro retoques de marcado. Todo el CSS sigue en `web/src/estilos/global.css` (un fichero,
18 secciones comentadas).

- **Color**: papel `#efede6`, tinta `#141210`, y **tres tonos del mismo naranja** porque
  ninguno vale para las tres cosas: `--senal` `#de3b0f` solo para grafismo (cuadrados, barras,
  degradados, pulsador del mando; 3,78:1 basta para un grafismo), `--senal-txt` `#b2301c` para
  texto pequeño y para los rellenos que llevan letra dentro (5,19:1), `--senal-neg` `#f5511f`
  para el naranja **dentro** de una banda en negativo. Los dos ultimos se intercambian en modo
  oscuro, y `--senal-sobre` es la letra que va encima del relleno. **No inventes un cuarto.**
- **Niveles**: el 4 pasa a ser verde `#0e6b4b` (antes era tinta negra): en esta paleta la tinta
  ya la gastan el titular y los filetes. n3 `#1f5c8c`, n2 `#8a5c0a`, n1 `#6b6558`.
- **Tipografia**: Big Shoulders Display 800/900 para h1, h2 y **todas las cifras** (`.cifra`,
  `.puesto`, numerales de `.bloque` y `.desglose`), siempre en versales. Archivo para texto,
  interfaz y h3 (los h3 rotulan nombres de producto con cifras y parentesis: en condensada
  se leen peor). IBM Plex Mono para rotulos, migas, fechas y la formula.
- **Forma**: filetes de 2-3px (6px en `.bloque`), `border-radius: 0` en todo, y la unica sombra
  es dura y desplazada (`9px 9px 0`, papel sobre papel). Bandas `.negativo` para la tira de
  edicion, el pie, la formula y lo que el lector tiene que creerse. En claro son tinta llena
  sobre papel; en oscuro **no se invierten** (un bloque blanco en una pagina oscura deslumbra):
  son un escalon de superficie (`#231e17`) con filete. Los tokens `--neg*` lo resuelven en un
  sitio, no lo escribas a mano.
- **Movil (seccion 19 de `global.css`, va la ULTIMA a proposito)**: dos suelos que no se
  negocian, **11,5 px** para lo que se lee y **44 px de alto** para lo que se pulsa. Estaban
  en la seccion 16 y las secciones 17-18 (que van despues, misma especificidad) los pisaban:
  por eso ahora cierran el fichero. Si anades un rotulo pequeno o un enlace de una linea,
  metelo en esa lista. Dos renuncias medidas: el menu pierde las versalitas en movil
  (`CATEGORIAS` con tracking mide 90 px y las cuatro no caben en 357), y por debajo de 22rem
  la cabecera deja de ser pegajosa (dos filas de menu = 147 px de una pantalla de 700).
  Auditado a 320, 360 y 375 px en las once plantillas: cero desbordes.
- **Movimiento**: solo dos, y ninguno con el scroll. `.aparece` (+`.d1`..`.d4`) escalona la
  primera pantalla al cargar, y la tira de edicion desfila. El fundido por scroll con
  `animation-timeline: view()` **se quito el 2026-08-27**: mareaba al bajar. No lo repongas.
- **Contraste**: el gris de rotulo del boceto (`#8a8478`) se queda en 3,17:1 sobre este papel.
  Los tokens estan ajustados para pasar AA (4,5:1 texto normal, 3:1 texto grande) en claro Y
  en oscuro. Si tocas un color, recomprueba los dos esquemas antes de darlo por bueno.
- **Prohibido**: titular a dos colores, blob radial, `backdrop-filter`, tarjetas redondeadas
  que levitan, sombras difuminadas, y **naranja de senal como texto pequeño** (usa `--senal-txt`).
- **Tres destacados** (`Destacados.astro`) encima de cada tabla: mejor calidad-precio,
  mas barato por unidad y mejor certificado. Reusan `.bloque`, no son tarjetas. El de
  "mejor certificado" **solo sale si hay nivel 4**: en proteinas el techo es el analisis
  de la propia marca y llamar a eso certificado seria vender la palabra del fabricante.
  Si un producto gana dos, se funde en una tarjeta con las dos razones.
- **Filtros de la tabla** (`TablaProductos.jsx`): el tope de precio es por **unidad de
  venta** (€/kg o €/capsula), no por envase; filtrar por el precio del bote deja fuera
  justo los formatos grandes, que son los baratos por kilo. Los chips "Solo Creapure" y
  "Solo IFOS" solo aparecen si esa tabla tiene esos sellos.
- **Paginas de acceso (rediseno del 2026-08-28)**: `/entrar` y `/registro` son la misma
  hoja partida en dos (seccion 20 de `global.css`): margen impreso a la izquierda
  (rotulo, titular de cartel y tres lineas numeradas de para que sirve la cuenta) y la
  ficha a la derecha, con el filete de 2px y la sombra dura. En movil se apilan titular,
  ficha y sumario, en ese orden. Entrar y crear cuenta son **dos pestanas pegadas**
  (`.mando-acceso`) dentro de la ficha, no un enlace al final del formulario. El boton de
  Google **sale siempre**: sin `GOOGLE_ID`/`GOOGLE_SECRET` sale apagado y con la razon
  debajo, porque antes desaparecia y no se distinguia de un fallo. El lector lee
  "contrasena" (y la repite al registrarse, comparada en el navegador); el campo y la
  columna de D1 se siguen llamando `clave`.
- **Medida de lectura**: `.prosa` estrecha *por elemento* (34rem en p/ul/h2), no en bloque, para
  que las tablas de `/metodologia` usen la columna entera.
- **Trampas ya pagadas**: (1) `table.apilable thead` se esconde con `left:-9999px`, no con
  `clip-path`, porque recortada seguia contando en el ancho del documento y el movil salia con
  scroll horizontal; (2) las rejillas usan `minmax(min(Xrem,100%),1fr)` o desbordan a 375px;
  (3) `thead th` pegajoso va con `top:0`, porque el scrollport es `.tabla-scroll`, no el viewport;
  (4) `.acceso-cabecera` **ya es** el icono de cuenta de la cabecera y va `position:absolute`:
  reusar ese nombre en la rejilla de `/entrar` sacaba la columna del grid. La columna del
  titular se llama `.acceso-titular`.

## SEO y SEO para IA (2026-08-21)

El copy que responde a una consulta **se genera desde el dataset**, nunca se escribe a
mano: `web/src/datos/seo.js`. Las consultas objetivo de cada categoria (`termino`,
`mejor`, `consultas`) viven en `categorias.py` y las exporta `exportar.seo()`.
**Las premisas completas estan en `SEO-PRODUCTOS.md`; leerlo antes de anadir una
categoria, un producto o una tienda.**

- El dominio vive **solo** en `web/src/sitio.js`, junto al nombre, el contacto del
  aviso legal y el hueco del token de analitica. De ahi salen canonical, sitemap,
  robots, llms.txt, og:image y todo el JSON-LD. Dominio: fitnesssupplementwiki.com.
- **Marca**: la figura (cuatro barras ascendentes con filete rojo) se dibuja una sola
  vez en `web/public/favicon.svg` y la reusan cabecera, pestana, icono de iOS y
  og:image. `python assets.py` regenera og.png, apple-touch-icon.png y las fuentes
  propias (`web/public/fuentes/` + `estilos/fuentes.css` + `estilos/fuentes.js`).
  Las tipografias **no** se piden a Google en tiempo de ejecucion: bloqueaban el
  pintado y mandaban la IP del lector a un tercero. Pillow solo hace falta ahi.
- `/legal` (aviso legal, privacidad, cookies, afiliacion) sale de `sitio.js`. Sin
  `titular` la pagina lo marca como pendiente a la vista: es deliberado.
- El slug de la web lleva guiones (`exportar.web_slug`): Google no parte palabras en
  `_`. La clave de Python sigue con guion bajo (BD, scraper y motor).
- Cada categoria: `<h1>` = la consulta objetivo, "La respuesta corta" debajo, FAQ
  generada al pie, y `CollectionPage` + `BreadcrumbList` + `ItemList` + `FAQPage`.
- **`/guia/<categoria>`: las treinta guias de evidencia** (`web/src/datos/evidencia.js` +
  `pages/guia/[categoria].astro`). Son la excepcion consciente a "el copy se genera": no
  llevan ni un precio ni un ganador ni un ano, asi que no envejecen con el dataset. Existen
  porque `/creatina` responde "que creatina comprar" (quiero comprar) y "para que sirve la
  creatina" es otra intencion: meter las dos en la misma pagina la hace competir consigo
  misma. Se enlazan mutuamente y ninguna repite el `<h1>` de la otra. `Article` con
  `citation`, y `dateModified` = `REVISADO`, **no** `datos.generado`: el texto no se reviso
  porque hoy se rasparan precios. Toda cifra apunta con `f` a un indice de `fuentes` y el
  build revienta si esa fuente no existe.
- **Landings de intencion (2026-08-24, respuesta a la auditoria)**: `/mejores/<slug>` (35)
  y `/comparativa/<a>-vs-<b>-<categoria>` (29), generadas enteras desde
  `web/src/datos/landings.js`. Tres tipos de `/mejores`: por sello real
  (`creatina-creapure`, `omega3-ifos`, minimo 3 productos), por tienda
  (`proteina-whey-de-myprotein`, minimo 6) y por precio (`creatina-barata` = por debajo
  de la mediana, minimo 10). Ninguna se escribe a mano y ninguna filtra por un campo que
  el dataset no tenga: **no** existe `proteina-aislada-sin-lactosa` porque no hay dato de
  lactosa. Al anadir o quitar una tienda, sus landings aparecen y desaparecen solas.
- **`/quienes-somos` (E-E-A-T)**: la suplementacion es YMYL para Google. El `Person`
  (`#autor`, en el grafo de `Base.astro`) sale de `SITIO.autor` y dice lo que se puede
  afirmar **y lo que no**: no hay ningun titulo sanitario porque no lo hay, y esa pagina
  lo publica. Inventar un dietista-nutricionista tumba el dominio entero, no la pagina.
- Cada ficha: veredicto generado, alternativas reales, FAQ, y `Product` con `sku`,
  `Offer` (con `priceValidUntil`, `itemCondition`) y un `Review` editorial (nuestro
  score, con `author` y `creator`). **Nunca `aggregateRating`**: no hay opiniones de
  usuarios y fingirlas es penalizacion manual. `seo_check.py` lo comprueba en el HTML ya
  construido y **falla** si aparece uno, o si un `Offer` se queda sin `priceValidUntil`.
- El JSON-LD de producto se escribe **una vez**, en `seo.js` (`ofertaLd`, `productoLd`,
  `listaLd`). Estuvo copiado en tres paginas y al anadir `priceValidUntil` solo se entero
  una: si se toca el marcado de producto, se toca ahi.
- Endpoints nuevos: `/sitemap.xml`, `/robots.txt` (permite los bots de IA uno a uno),
  `/llms.txt` y `/datos/<categoria>.json`.
- `python seo_check.py` corre sobre `web/dist` ya construido: titulos, descripciones,
  canonical, un solo h1, JSON-LD que parsea, enlaces internos, sitemap y duplicados.
  Correrlo despues de `npm run build` y antes de desplegar.
- Trampas ya pagadas: los nombres de Myprotein pasan de 90 caracteres, asi que el
  titulo elige el sufijo mas largo que quepa en 78 y la descripcion se corta por
  palabra entera; `nom()` no repite la marca cuando la tienda ya la puso en el nombre
  ("Epaplus Epaplus Arthicare").

## Invariantes (no romper)

0. **La unidad no se mezcla dentro de una tabla.** Cada categoría declara su `unidad` en
   `categorias.py` (kg o cápsula) y `core.medida(..., categoria=)` solo devuelve esa: un
   preentreno en cápsulas o un omega 3 a granel no entran, porque 30 €/kg y 0,07 €/cápsula en la
   misma columna no son un ranking. Un producto sin la medida de su categoría (Myprotein vende
   preentrenos que solo declaran "30raciones") se queda fuera del catálogo.
1. Nunca afirmaciones de salud sobre un producto. El efecto se atribuye al **ingrediente**
   con su cita. Los textos de la web ya están redactados así.
2. Score y orden **jamás** leen `afiliados.json`. Cubierto por `test_los_afiliados_no_mueven_el_ranking`.
3. Nivel 4 = **el sello lo respalda un tercero, no la marca**. Dos caminos, y la BD lo fuerza
   con un CHECK (exige código QS o url_evidencia):
   a) comprobado por nosotros en la fuente que lo emite (código QS en creapure.com, lote en
      Informed Sport) → curación manual, `verificar.py qs`;
   b) marca en el **nombre** del producto que exige un tercero detrás
      (`MARCAS_LICENCIADAS` en `verificar.py`: Creapure, que exige contrato de licencia con
      Alzchem, e IFOS, que analiza el lote en un laboratorio independiente y publica el
      informe) → automático, `NIVEL_MARCA_LICENCIADA`.
      Decisión del dueño: usar la marca exige contrato de licencia y la tienda firma la
      afirmación al listarla. Solo el nombre — en las descripciones aparece el Creapure de
      otros productos (40 veces por página en Myprotein).
   Un sello suelto en la etiqueta sigue siendo nivel 2. El desglose del score distingue (a)
   de (b) con `creapure_qs` vs `creapure`. **Si mueves `NIVEL_MARCA_LICENCIADA`, mueve con
   él los tres textos que se lo explican al lector**: `NIVELES` (exportar.py), el criterio
   del sello en `sellos_de` y la sección 2 de `/metodologia`.
2b. **El aviso de afiliacion sale solo si hay afiliacion.** `exportar` publica
   `hay_afiliados` (hay algun `url_afiliado` en el dataset) y de ese flag cuelgan tres
   textos: el componente `Aviso.astro`, la seccion 6 de `/metodologia` y la de
   afiliacion en `/legal`. Con el flag en falso, el aviso desaparece y las dos secciones
   dicen que hoy no hay comision; con el en cierto, vuelven los tres. Advertir de una
   comision que no existe no es transparencia, es ruido, y en el aviso legal es
   directamente una afirmacion falsa. Al rellenar `data/afiliados.json` se enciende solo:
   no hay nada que descomentar.
3b. Un sello que la regla ya no justifica se **retira solo** en la siguiente pasada
   (`verificar.py auto` y el rescrape). Arreglar una detección no puede dejar vivo lo que
   metió mal la versión anterior.
4. Ninguna dosis sin fuente citada.
3c. **Una marca inventada es peor que no tener marca.** `core.marca_canonica` rechaza lo que
   no puede ser un nombre propio ("Citrato de", "Extracto de", "L") y devuelve "Desconocida".
   Viajaba al `brand` del JSON-LD, rompía el emparejamiento del mismo bote entre tiendas y
   crearía páginas de marca fantasma. `limpiar_marcas` lo aplica también a lo ya guardado, y
   `test_una_marca_no_puede_ser_un_trozo_de_nombre_de_producto` fija los casos.
3d. **El histórico se escribe antes de puntuar y nunca se reescribe.** `guardar_historico`
   usa INSERT OR IGNORE por (producto, día): dos pasadas el mismo día no pisan la primera.
   Lo que no se guarde hoy no lo devuelve ningún scraper mañana.
3e. **La isla de React recibe `paraTabla(p)`, no el producto entero.** El desglose, los
   ingredientes con sus fuentes y la serie de precios no los mira la tabla y pesaban 600 KB
   por página, que además viajaban dos veces (HTML pintado + props de la isla).
5. Tienda que bloquea al bot se documenta, no se fuerza (nada de proxies ni headless).

## Cosas que ya costaron tiempo (no re-descubrir)

- **`data/dosis_referencia.json` se carga en cada pasada** (`actualizar.py`, 2026-08-25).
  Antes solo entraba en la BD ejecutando `python data/db.py` a mano: anadir una dosis
  nueva y olvidarse de ese paso dejaba la categoria sin coste por dosis y sin la FAQ de
  "cuanto tomar", en silencio y con todo lo demas funcionando. El upsert es idempotente.
- **Amazon no publica datos estructurados.** Ni JSON-LD ni microdatos, en ninguna de sus
  páginas: es la única de las ocho donde hay que leer HTML. Se lee el bloque de cada
  resultado en `/s?k=...` (ASIN, `<h2>` con el título completo, primer `a-offscreen` con el
  precio vigente, `s-image`), no las fichas: **una petición por página de resultados en vez
  de una por producto**. Su robots.txt permite `/s?k=` y solo prohíbe las búsquedas con
  filtros encadenados. Dos cosas que no tiene ninguna otra tienda: **la marca no viene en
  ningún campo** (`amazon._marca` la saca del principio del título, cortando en la primera
  palabra de producto) y **el título lo escribe el vendedor**, no la tienda, así que
  `verificar.TIENDAS_SIN_NOMBRE_FIRMADO` le niega el nivel 4 automático por Creapure o IFOS.
- **Microdatos** (`core.microdatos`, 2026-08-25): el otro formato de schema.org, con
  `itemscope`/`itemprop` repartidos por el HTML. Es lo que publica Zumub, y por eso el sondeo
  de agosto lo descartó por "no publica Product". Va con `html.parser` de la stdlib y no con
  regex, porque un itemscope dentro de otro (la marca dentro del producto) hay que cerrarlo
  por profundidad de etiqueta. Devuelve dicts con la misma forma que `ld_json`.
- **Zumub**: listado con `CollectionPage` (nombre, URL, imagen; **sin precio**) y ficha con
  un `ProductGroup` JSON-LD y un `hasVariant` por formato, cada uno con su sku, su `size` y su
  precio. Hasta el 2026-08-28 lo publicaba en microdatos; cuando se pasó a JSON-LD el módulo
  se quedó trayendo **cero fichas sin un solo error en el log**, y la web siguió enseñando lo
  scrapeado en la pasada anterior. El formato de cada variante sale de su `size` y su nombre y
  **nunca de la URL**: la ficha es una sola para todos los formatos, así que el sobre monodosis
  de 30 g heredaba el kilo del bote y salía a 1,23 €/kg, primero del ranking. La URL de la ficha es la misma para todos
  los formatos, así que el sku va en la URL guardada o el upsert por `(tienda, url)` los
  machacaría entre sí. Sus categorías son anchas a propósito (nueve de las nuestras salen de
  `salud-y-bienestar`): el filtro de nombre las separa y se aplica **antes** de descargar
  cada ficha. Limita por ratio.
- **`core.sospechoso` + filtro en `run_scraper`** (2026-08-28): un precio por unidad de venta
  fuera de `core.LIMITES_EUR` (2,5–300 €/kg, 0,005–3 €/unidad) no se guarda. No es un gusto:
  por debajo del suelo lo que hay es el formato de una variante emparejado con el precio de
  otra, y eso sale **de primero** en la tabla, que es donde más daño hace. Está en `core` y no
  en cada módulo porque cada tienda se equivoca a su manera pero un €/kg imposible se ve igual
  en todas. Al no entrar en `vistos`, el `DELETE` de `run_scraper` también retira lo que coló
  una versión anterior. Calibrado contra el catálogo real: lo más barato de verdad es la
  dextrosa a 3,02 €/kg; lo más caro creíble, 150 g de Creapure a 293 €/kg.
- **iO.GENIX**: PrestaShop sin `Product` en JSON-LD ni en microdatos (solo `Organization` y
  `BreadcrumbList`), pero su rejilla de categoría trae por tarjeta el nombre (`h3.product-title`),
  el precio sin formatear (`content="29.85"`), la imagen y la URL: **una petición por categoría y
  ninguna ficha**. El carrusel de destacados que repite en todas las categorías usa `h6`, no `h3`,
  y por eso no cuela once productos de relleno. El formato de lo que no lo lleva en el nombre
  ("iO.CREATINE") sale del fragmento de la URL, donde PrestaShop cuelga la variante
  (`#/3898-formatos-300_g`). Es tienda de una sola marca: la marca es constante y su categoría
  "otras marcas" no se mapea justo por eso.
- **Delay por host** (`core.DELAY_POR_HOST`): Zumub y Prozis devuelven 429 con los 2 s
  comunes, y un 429 a media pasada deja la categoría a medias. Esperar más trae **más**
  datos, no menos.
- **`run_scraper` descarga en paralelo, una tienda por hilo** (2026-08-25). El delay de
  `core` es por host, así que esperar a que HSN conteste para empezar con Prozis no hacía la
  descarga más educada, solo más larga: con 8 tiendas y 30 categorías, en serie son horas.
  Los hilos **solo descargan**; los `INSERT` siguen siendo secuenciales en el hilo principal,
  que es lo único que sqlite no lleva bien.
- **La melatonina es la única dosis por debajo de 10 mg** (`core.MIN_MG`). El suelo general de
  10 mg existe para que un precio o una caloría suelta no pase por dosis, pero la dosis útil
  de melatonina es 1 mg (condición de uso de su declaración autorizada en la UE) y con el
  suelo común la categoría entera se quedaba sin nota.

- **"Donde comprarlo" no puede emparejar por marca + formato + forma a secas** (arreglado
  el 2026-08-24). Sin exigir la misma categoria y **otra tienda**, la ficha de la creatina
  de 1 kg de HSN Raw Series listaba la glutamina Kyowa y la Creatina Excell Creapure de la
  propia HSN como "el mismo producto en otras tiendas", con precios de 14 a 53 EUR. Con
  los datos de hoy no hay ninguna coincidencia legitima (las cinco tiendas venden marca
  propia), asi que la tabla ensena una fila y el `AggregateOffer` no llega a construirse.

- **MASmusculo** (307 en bucle) bloquea. Su módulo existe y reporta el bloqueo; es el
  comportamiento correcto, no un bug.
- **Prozis NO bloquea** (revisado 2026-08-21; la nota vieja decía lo contrario). Su
  robots.txt, su sitemap y sus fichas responden 200 a nuestro UA. Lo que fallaba era
  nuestro: la URL de categoría estaba incompleta (faltaba `/desarrollo-muscular`) y su
  JSON-LD viene envuelto en `/*<![CDATA[*/`, que `json.loads` rechaza — `ld_json`
  descartaba la ficha entera en silencio y parecía que no publicaban datos. **Antes de
  declarar bloqueada una tienda, comprobar robots.txt y sitemap por separado**: un 403 en
  una sola URL no es un bloqueo.
  Su listado de categoría sí es JS puro (48 KB, ni un enlace a producto), así que las URLs
  salen del sitemap de productos. Sigue limitando por ráfaga: pedir varios `.gz` seguidos
  devuelve 429; con el `DELAY_S` de core basta. Su JSON-LD publica el **PVP sin
  descuento**, que es lo único que exponen de forma estructurada.
- **Life Pro**: su ItemList da nombre y URL pero NO el precio; hay que abrir cada ficha
  (Product JSON-LD). Lista el mismo producto en dos URLs ("...650g" y "...650g-unflavoured"):
  no es un bug, `agrupar_sabores` los colapsa. **Corregido el 2026-08-21**: los colapsaba
  solo si ademas coincidia el precio, y su glutamina esta en las dos URLs a 26,01 y 26,91.
  Ahora hay un segundo pase por tienda+marca+nombre+formato que se queda con el mas barato.
- **Una ficha, una URL** (2026-08-21). El slug es marca+nombre+tienda, y `agrupar_sabores`
  le quitaba el sabor al nombre siempre que hubiera agrupado algo. Myprotein vende el mismo
  formato a dos precios (el sin sabor mas barato que el de cacao), asi que dos grupos
  distintos acababan con el mismo nombre y el mismo slug: **9 URLs y 19 productos**, de los
  que se publicaba uno y los demas enlazaban a una ficha con otro precio. Tres arreglos, en
  este orden: el sabor solo se quita si sin el el producto sigue siendo unico; el mismo bote
  listado dos veces colapsa; y `desambiguar_slugs` es la red final (sufijo del hash de la URL
  de la tienda, estable entre pasadas). `seo_check.py` lo caza por el titulo repetido.
- **Tiendas sondeadas y descartadas** (2026-08-20, no repetir el sondeo): **Nutrisport**
  responde bien y publica sitemap, pero sus fichas **no traen Product JSON-LD**; sacar el
  precio exigiria parsear su HTML, que es justo lo que este scraper evita. **Bulevip** no
  expone ninguna categoria con "creatin" en su sitemap de categorias. **Zumub** sirve la
  pagina sin ItemList ni Product. **Bulk** y **Decathlon**: 404 en las URLs de categoria
  publicas. Ninguna se fuerza.
- **HSN**: cada ficha trae ~8 bloques de config de carruseles vecinos; el bueno es el
  **último** `initConfigurableOptions('id'`. Es la única tienda que publica la tabla
  nutricional completa (mg por activo y servicio).
- **HSN**: sus variantes se filtran con `es_valido("nombre etiqueta")`. Filtrar solo por la
  etiqueta ("150g") deja el catálogo en **cero productos sin un solo error en el log**, y el
  sitio sigue sirviendo los precios viejos como si nada. Cubierto por `test_filtro_categoria`.
- **PDFs de la ficha**: el certificado **IFS Food** de la fábrica de HSN y las guías de
  etiquetado de `europa.eu` cuelgan de todas las páginas. No son análisis del producto:
  `CERTIFICADO_DE_FABRICA` + `MAX_FICHAS_POR_ANALISIS` + mismo dominio los descartan.
- **Prozis y el 429**: en las categorías largas (whey son 91 fichas) corta a media pasada.
  Dos cosas lo hacen soportable y ninguna fuerza nada: el slug ya trae el formato, así que
  se descartan antes de descargar las URLs sin gramos ni cápsulas; y si aun así corta,
  `Scraper.parcial` marca la pasada y **run_scraper no retira nada de la BD** (lo que no se
  llegó a mirar no es lo mismo que lo que la tienda ha dejado de vender).
- **Nutritienda**: solo la primera página; `?page=N` devuelve siempre lo mismo (scroll JS).
  Sus fichas de cápsulas (omega 3, multivitamínicos) no dicen cuántas trae el bote ni en el
  nombre ni en el slug, así que esas dos categorías salen vacías en esta tienda. Es correcto:
  sin unidades no hay nada que comparar.
  Sus URLs de categoría no se adivinan: salen de `/es/sitemap/categories/N.xml`.
- **Myprotein**: sus slugs de categoría están en inglés aunque la tienda sea española
  (`/c/nutrition/protein/whey-protein/`), menos el omega 3, que cuelga de
  `/c/ranges/myvitamins/`. Y hay productos que no dicen los gramos en ninguna parte
  ("THE Pre-Workout 30raciones"): con las raciones basta para el coste por dosis, así que
  `formato_gramos` puede ser NULL y el producto sigue entrando.
- **Mezclas**: "Impact Whey Protein + Colágeno" no es un bote de colágeno y "BCAA +
  Glutamina" no es un bote de glutamina. En modo simple el motor da por hecho que el envase
  entero es el activo, así que una mezcla entra como el producto más barato de la categoría
  sin serlo (es el mismo caso que el "Whey Prime + Creatine" de Prozis). Cada categoría
  excluye por nombre las mezclas que la invaden: está en su `excluye` de `categorias.py`.
- **Ingredientes que cuentan**: `categorias.CATEGORIAS[x]["ingredientes"]` acota qué activos
  puntúan en una fórmula. Un multivitamínico de HSN con 100 mg de cafeína se estaba
  puntuando (y ganando su categoría) como si fuera un suplemento de cafeína infradosificado.
- **Modo del motor**: lo manda la **categoría** (`categorias.py`), no cuántos ingredientes
  se hayan podido leer. `simple` = el bote es el activo (creatina, proteína, BCAA);
  `formula` = preentreno, omega 3 y multivitamínicos, donde la dosis solo puede salir de la
  ficha. Un preentreno del que solo se pudo leer la cafeína seguiría siendo fórmula: en
  modo simple saldría a 0,03 €/dosis y encabezaría la tabla.
- **Dosis de las fórmulas, por tienda**: HSN publica tabla nutricional; Myprotein cuenta la
  fórmula en prosa en la descripción (`core.dosis_en_texto`, ~5 productos); Prozis, Life Pro
  y Nutritienda no publican ninguna cifra. Sus fórmulas se listan con precio y **score 0**,
  con el desglose diciendo por qué. Es deliberado: premia a quien publica lo que vende, y
  la alternativa (inventar una dosis típica) sería mentir.
- **Multivitamínicos**: no hay dosis de referencia posible (son 20 micronutrientes con VRN
  distintos), así que la categoría entera va sin puntuar. La página de categoría lo avisa
  cuando ningún producto tiene coste por dosis, y la tabla ordena por precio.
- **Creatina sin forma declarada** ("Zero Creatine", "MicronPure" de Prozis): se compara
  contra la referencia de monohidrato (`activo` de la categoría) y paga el no declararlo con
  `FACTOR_FORMA_DESCONOCIDA`. Antes se quedaba sin ingrediente y por tanto sin nota **y sin
  coste por dosis**, con lo que ese factor no llegaba a usarse nunca. Si la ficha sí dice la
  forma, manda la forma (`activo_por_forma`): una HCL sigue sin puntuar porque su dosis
  efectiva no tiene fuente citada.
- **Pureza**: un kilo de concentrado de suero no es un kilo de proteína. `pureza_tipica` en
  la tabla de dosis (0,75 concentrado / 0,88 aislado, con cita) es lo único que hace
  comparables las dos categorías de proteína. Si una marca publica su analítica, manda la
  ficha; hoy ninguna lo hace en JSON-LD.
- **Cápsulas**: omega 3 y multivitamínicos no tienen gramos. `producto.unidades` +
  `precio_por_unidad`; `formato_gramos` es opcional desde el 2026-08-21 (hay una migración
  en `db._migrar_producto` que reconstruye la tabla sin perder lo curado a mano).
- **Tabla nutricional de HSN**: la ficha repite la tabla entera una vez por formato (tres
  veces en el aceite de pescado): hay que deduplicar por etiqueta o la dosis se triplica.
  El sangrado importa: `ml-1` es el activo, `ml-3` su desglose (de ahí sale el "Omega 3
  (EPA+DHA)", que cuelga de "Aceite de Pescado"), `ml-6` no aporta nada nuevo.
- `robotparser.read()` pide robots.txt con el UA de urllib y varias tiendas devuelven 403,
  que se interpreta como "prohibido todo": por eso se descarga a mano y se usa `parse()`.
- Sin datos que parezcan reales sin serlo: hoy **no hay ningún nivel 4** en la BD y así debe
  quedarse hasta que alguien compruebe un código QS de verdad.

## Cuentas y reseñas (añadido el 2026-08-28)

Lo único dinámico de la web. El catálogo sigue siendo estático y se genera cada noche;
esto vive aparte, en Cloudflare, y no toca el pipeline de Python para nada.

- **Dónde**: `web/functions/api/[[ruta]].js`, siete rutas bajo `/api/`. Un fichero: ninguna
  ruta llega a veinte líneas.
- **Datos**: D1 (`DB`) para usuarios y reseñas, R2 (`FOTOS`) para las imágenes, servidas por
  `/api/foto/<uuid>` y nunca desde un bucket público.
- **Sesión sin tabla de sesiones**: cookie `id.caducidad.firma` con HMAC-SHA256. Las claves
  son PBKDF2-SHA256 de 100.000 vueltas con sal. Cero dependencias: todo es WebCrypto, que el
  runtime de Cloudflare ya trae.
- **Una reseña por persona y producto** (`UNIQUE (usuario, producto)`): la segunda edita la
  primera. Sin eso, una sola persona votando veinte veces fija la media.
- **El producto se referencia por slug, no por id**: el dataset se regenera cada día y los ids
  cambian con él.
- **La media de lectores no entra en el JSON-LD.** Las fichas son estáticas: un
  `aggregateRating` diría la nota de hace horas. Lo que Google lee sigue siendo la reseña
  editorial. Está escrito también en la cabecera de `Resenas.jsx`, que es donde tienta
  cambiarlo.
- **Desplegar**: `cd web; npx wrangler pages deploy`. Desde la carpeta de arriba se sube el
  sitio sin la API. Ver `PUBLICAR.md` paso 9 para crear D1, R2 y el secreto.
- **Entrar con Google**: flujo de código de autorización escrito a mano (dos redirecciones
  y una llamada). El `id_token` llega de Google por TLS en la misma petición, no a través
  del navegador, así que no hace falta verificar su firma. El `state` viaja en una cookie
  de 10 minutos junto al `volver`, y `seguro()` impide que el login sea un redirector
  abierto. Es **opcional**: sin `GOOGLE_ID` y `GOOGLE_SECRET`, `/api/yo` devuelve
  `google:false` y el botón no se pinta.
- **Una cuenta de Google guarda `clave = ''`**, que no es un hash válido y por tanto no
  puede coincidir con nada escrito a mano. `entrar` corta antes de llamar a PBKDF2 con esa
  cadena vacía, que reventaría con un 500 en vez de un 401.
- **El icono de cuenta de la cabecera va FUERA del `.envoltorio`**, posicionado contra
  `header.sitio`: el envoltorio está limitado a 82rem y centrado, así que su borde derecho
  no es el de la ventana. Quién ha entrado lo resuelven diez líneas de JS suelto en
  `Base.astro`, no otra isla de React en las 2.996 páginas.
- **`/entrar` y `/registro` llevan `noindex`** (prop `noindex` de `Base.astro`) y no entran
  en el sitemap. `seo_check.py` salta las páginas con noindex al comprobar el sitemap: pedir
  que se rastree lo que se marcó como no indexable es contradecirse.
- **Sin recuperar clave, sin moderación y sin rate limit** a propósito: los tres se añaden el
  día que hagan falta, y los dos últimos se resuelven desde el panel de Cloudflare sin tocar
  código.

## Pendiente (decisiones del dueño, no del agente)

- Verificar los DOI de `data/dosis_referencia.json` antes de publicar.
- Alta en programas de afiliado → rellenar `data/afiliados.json`.
- ~~Dominio real y contacto real en el UA de `scraper/core.py`~~: hechos. El dominio sale de
  `web/src/sitio.js` (el `astro.config.mjs` lo lee de ahí) y el UA lleva ya el correo real.
- Ads: deliberadamente no implementados hasta que haya tráfico.

## Estilo del código

Comentarios y nombres en español, sin tildes en el código. Marcas de simplificación
deliberada con comentario `ponytail:`. Preferir stdlib y menos ficheros antes que
abstracciones; cada pieza no trivial deja un assert en `tests.py`.
