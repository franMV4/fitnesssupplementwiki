# Comparador calidad-precio de suplementos

Compara suplementos por **coste por dosis efectiva** y por **nivel de verificacion** de
sus certificaciones, no por precio por kilo. Datos reales de tiendas espanolas.

Estado: fases 0 a 7 del [plan](plan-comparador-suplementos.md) ejecutadas.

## Puesta en marcha

```bash
python data/db.py          # crea data/suplementos.sqlite y se autocomprueba
python actualizar.py       # scraper + verificacion + scoring + export a la web
cd web && npm install && npm run build
```

`npm run dev` (puerto 4322) para verlo en local. `python tests.py` corre las
comprobaciones del proyecto (sin red, sin framework).

## Estructura

| Ruta | Que hace |
|------|----------|
| `data/schema.sql`, `data/db.py` | Esquema SQLite y acceso. Sin ORM, solo `sqlite3`. |
| `data/dosis_referencia.json` | **El activo del proyecto**: dosis efectivas con su fuente citada. Se edita a mano. |
| `data/afiliados.json` | Enlaces de afiliado por tienda. El scoring no lo lee nunca. |
| `scraper/core.py` | Descarga educada (robots.txt, delay, cache) y normalizacion. |
| `scraper/tiendas/*.py` | Un modulo por tienda. Anadir una 6a tienda = un fichero nuevo. |
| `verificar.py` | Capa de certificaciones: cruce automatico + curacion manual. |
| `scoring/config.py` | **Todos** los pesos de la metodologia, en un sitio. |
| `scoring/motor.py` | Motor de scoring: logica pura, con desglose explicable. |
| `exportar.py` | Vuelca la BD a `web/src/datos/dataset.json`. |
| `web/` | Sitio Astro estatico + islas React (filtros de la tabla y comparativa del lector). |
| `tests.py` | Comprobaciones de todo lo anterior (63). `cd web && node --test` prueba la API y el filtrado de la tabla (15). |

## Que hay dentro de cada pieza

### Scraper (fases 1 y 7)

Extrae contra **JSON-LD schema.org**, que las tiendas publican para Google y cambia mucho
menos que su HTML. Respeta `robots.txt` con el User-Agent real del bot, espacia las
peticiones 2 s por host y cachea 6 h en `data/cache/`.

**Treinta categorias** (ampliado el 25/08/2026): los treinta suplementos que encabezan las
listas de mas vendidos del sector. Las nueve originales (creatina, preentreno, proteina whey,
proteina aislada, BCAA, glutamina, colageno, omega 3 y multivitaminicos) mas veintiuna:
proteina vegana, caseina, ganadores de peso, EAA, beta-alanina, citrulina, carbohidratos,
magnesio, zinc, hierro, vitamina D, vitamina C, vitamina B12, ZMA, ashwagandha, melatonina,
cafeina, probioticos, curcuma, glucosamina y L-carnitina.

Que entra en cada una (filtro de nombre, exclusiones, activo y modo de scoring) esta en
`categorias.py`, que leen a la vez el scraper, el motor y la web: anadir una categoria es una
entrada ahi mas su URL en cada tienda.

Casi todas las nuevas van sin nota de dosis, igual que ya iban los multivitaminicos: no existe
una dosis efectiva citable para un mineral o un extracto de planta, asi que se comparan por
precio por capsula y por certificacion, y su pagina lo dice. Las ocho que si la tienen
(proteina vegana, caseina, EAA, beta-alanina, citrulina, cafeina, carnitina y melatonina) la
tienen citada en `data/dosis_referencia.json`.

Estado de las nueve tiendas (28/08/2026):

| Tienda | Estado | Detalle |
|--------|--------|---------|
| HSN | funciona | Las nueve categorias. Precios por formato desde la config de variantes de Magento; **publica la tabla nutricional completa** (mg por activo y servicio), que es lo que hace posible puntuar formulas. |
| Myprotein | funciona | Las nueve. `ProductGroup` con `hasVariant`: tamano, raciones y precio por variante. Sin tabla nutricional, pero cuenta la formula en prosa en la descripcion y de ahi salen algunas dosis. |
| Nutritienda | funciona | Las nueve. `ItemList` con marca y precio. Solo la primera pagina: el listado es scroll infinito por JS. |
| Life Pro | funciona | Las nueve. Listado sin precio: hay que abrir cada ficha. |
| Amazon | funciona | **La sexta, y la unica sin datos estructurados.** No publica ni JSON-LD ni microdatos: se lee el HTML de la pagina de resultados de busqueda, que ya trae ASIN, titulo con formato, precio e imagen. Una peticion por pagina de resultados en vez de una por ficha. Su robots.txt permite `/s?k=`. Como el titulo lo escribe el vendedor y no la tienda, **no se le concede el nivel 4 automatico** por llevar Creapure o IFOS en el nombre. |
| Zumub | funciona a rachas | **La septima.** Su listado publica `CollectionPage` sin precio y sus fichas un `ProductGroup` JSON-LD con un `hasVariant` por formato (nombre, sku, `size`, precio). Hasta el 28/08/2026 lo publicaba en microdatos y el modulo se quedo trayendo cero fichas sin un solo error. El formato de cada variante sale de su `size`, nunca de la URL: la ficha es una sola para todos los formatos y el sobre de 30 g heredaba el kilo del bote (1,23 EUR/kg, primero del ranking). Limita por rate: 6 s entre peticiones y tope de fichas por categoria. |
| Prozis | funciona a rachas | Las nueve, descubiertas por su sitemap de productos (su listado es JS puro). Limita por rate: en las categorias largas devuelve 429 y esa pasada se documenta como bloqueada. |
| iO.GENIX | funciona | **La novena.** Tienda oficial de la marca (PrestaShop). No publica `Product` en ningun formato de schema.org, pero su rejilla de categoria trae nombre, precio sin formatear, imagen y URL en atributos: **una peticion por categoria y ninguna ficha**. El formato de lo que no lo lleva en el nombre sale del fragmento de la URL (`#/3898-formatos-300_g`). Tienda de una sola marca, asi que la marca es constante y su categoria "otras marcas" no se mapea. |
| MASmusculo | **bloqueada** | 307 en bucle infinito esperando una cookie que pone su JS. Solo creatina mapeada. No se fuerza. |

El modulo bloqueado esta escrito y listo: si abren, funciona sin tocar nada mas. No se usan
proxies ni navegadores headless para saltarse un bloqueo.

Reejecutar es idempotente: upsert por `(tienda, url)`, y lo que la tienda deja de listar
se retira de la BD para no ensenar precios muertos.

Cada pasada **congela el precio del dia** en `precio_historico` (una fila por producto y
dia, `INSERT OR IGNORE`). Es el unico dato del proyecto que no se puede reconstruir mas
tarde: ninguna tienda publica lo que costaba algo el mes pasado. De ahi salen la grafica
de la ficha y el minimo historico, y de ahi saldran las alertas de bajada de precio.
La misma pasada normaliza las marcas ya guardadas (`limpiar_marcas`): lo que no puede ser
un nombre propio ("Citrato de", "Extracto de") pasa a "Desconocida", porque una marca
inventada rompe el emparejamiento entre tiendas y ensucia el JSON-LD.

### Verificacion de certificaciones (fase 2)

```bash
python verificar.py auto          # cruza contra listas publicas y busca analisis de marca
python verificar.py pendientes    # cola de curacion manual
python verificar.py qs 27 123456  # Creapure, DESPUES de comprobarlo en creapure.com
```

- **Informed Sport / Informed Choice**: se descargan sus listas publicas (1.869 y 847
  productos) y se cruzan con criterio estricto. Un nombre parecido no basta.
- **Creapure**: la prueba es un codigo QS de 6 digitos impreso en el envase fisico. No
  esta en ninguna ficha: es curacion manual, y el CLI pregunta si de verdad lo has
  comprobado antes de guardarlo.
- **Analisis de marca**: los PDF de analisis enlazados en la ficha entran como nivel 3
  con su URL. Los publica la parte interesada; por eso no son nivel 4.

La BD **rechaza** un nivel 4 sin codigo QS ni URL de evidencia: el guardarrail vive en el
esquema, no en la buena voluntad de quien inserta.

### Scoring (fase 3)

El score es **mitad precio, mitad calidad**. El precio se compara en la unidad en que se vende
la categoria (€/kg en polvo, €/capsula en perlas), siempre contra el mas barato de esa categoria,
y las dos unidades no se mezclan nunca en la misma tabla. La calidad sale del nivel de
verificacion, de la forma quimica del activo y, cuando la tienda publica las dosis, de si la
formula llega a la dosis efectiva.

El **coste por dosis efectiva** se sigue calculando y se enseña en la ficha de cada producto
(es lo que distingue dos botes que cuestan lo mismo por kilo), pero no ordena las tablas: solo
sola de las ocho tiendas (HSN) publica los mg por dosis y rankear con ese dato dejaba sin
nota a la mitad del catalogo.

Dos modos para juzgar la dosis, y el modo lo decide la categoria:

- **Simple** (creatina, proteina, BCAA, glutamina, colageno): el producto es el activo.
  Dosis efectivas por envase = gramos x pureza tipica / dosis de referencia. Coste =
  precio / esas dosis. La pureza (0,75 en concentrado de suero, 0,88 en aislado) es lo que
  hace que un kilo de concentrado no se compare como si fuera un kilo de proteina.
- **Complejo** (preentrenos, omega 3, multivitaminicos): cada ingrediente clave contra su
  dosis efectiva minima. El bote nunca se toma como activo: si la tienda no publica los mg
  por servicio, el producto se lista con su precio y **score 0**, y el desglose dice que no
  hay datos para puntuarlo. Los multivitaminicos van asi en bloque (no existe una dosis de
  referencia para veinte micronutrientes a la vez) y su pagina lo avisa. Si
  el peor ingrediente esta al 50 %, hacen falta 2 servicios para llegar a dosis, el envase
  rinde la mitad y **el coste real se dobla**. Por debajo del 60 % se marca infradosaje y
  la calidad se multiplica por 0,5.

Ejemplo real, que es justo el caso que justifica el proyecto:

| Producto | Precio por kilo | Dosis | Score |
|----------|-----------------|-------|-------|
| Evostamina 500 g | 34,1 €/kg (barato) | beta-alanina a 2 de 4 g; hacen falta 2 servicios | **47** |
| Evobomb 500 g | 51,2 €/kg (caro) | citrulina 8 g, beta-alanina 4 g, cafeina 200 mg, en rango | **90** |

El caro gana, y la ficha lo explica con esas mismas frases.

### Web (fase 4)

Astro estatico + una isla React (filtros y orden). En build no toca la BD: lee
`dataset.json`. Paginas: home, una por categoria (`/creatina`, `/proteina_whey`,
`/omega3`...), ficha de producto y `/metodologia`.

La pagina de metodologia **se genera desde el mismo fichero de configuracion que puntua**,
asi que no puede contar una cosa distinta de la que hace el calculo.

### Afiliacion (fase 5) y sellos (fase 6)

Los enlaces de afiliado se aplican al exportar, cuando el ranking ya esta cerrado, desde
`data/afiliados.json`, que el motor de scoring no importa ni puede leer. Hay una prueba
(`test_los_afiliados_no_mueven_el_ranking`) que cambia los enlaces y comprueba que el
orden es identico. El disclosure va visible en cada pagina con enlaces, no enterrado en el
pie, y los enlaces llevan `rel="sponsored"`.

Dos sellos, ambos por umbral publico definido en `scoring/config.py`:

- **Verificado nivel 4**: su certificacion esta comprobada contra la fuente.
- **Mejor calidad-precio verificada**: nº 1 de su categoria y score ≥ 70. Si nadie llega
  al umbral, la categoria se queda sin sello.

Certifican criterio editorial, nunca un efecto fisiologico.

### Ads (fase 7, no implementado a proposito)

El plan los deja para "solo si hay trafico real y lo decides". Con cero trafico, meter
display ahora resta credibilidad y no ingresa nada; la afiliacion ya esta puesta y
monetiza mejor en este nicho. Cuando toque: nunca intercalados en el ranking y siempre
separados como publicidad.

## Reglas que no se negocian

- Nunca afirmaciones de salud o eficacia sobre un producto. Solo hechos. El efecto se
  atribuye al **ingrediente** con su fuente citada, jamas al producto.
- El score y el orden **nunca** leen los enlaces de afiliado.
- Nivel 4 solo contra la fuente, nunca contra la etiqueta.
- Ninguna dosis de referencia sin su cita.

## Antes de publicar esto de verdad

1. Abre cada DOI de `data/dosis_referencia.json` y confirma cifra y referencia. Son
   posicionamientos de la ISSN, pero la responsabilidad de lo que publicas es tuya.
2. Da de alta los programas de afiliado y rellena `data/afiliados.json`.
3. Revisa `web/src/sitio.js`: dominio, nombre, contacto del aviso legal y titular. Es el
   unico sitio donde viven; de ahi salen canonical, sitemap, robots, llms.txt, og:image
   y el JSON-LD.
4. Cura a mano los Creapure con su codigo QS. Hoy no hay ningun nivel 4 en la BD, y eso
   es lo correcto mientras nadie lo haya comprobado.

5. Construye y pasa el chequeo de SEO antes de desplegar:

   ```
   cd web && npm run build
   cd .. && python seo_check.py
   ```

   Comprueba las ~3.000 paginas: titulos, descripciones, canonical, un solo `h1`, JSON-LD
   que parsea, enlaces internos rotos, duplicados y el sitemap. Las premisas para que
   siga cumpliendose al anadir productos o categorias estan en **`SEO-PRODUCTOS.md`**.
6. Despliegue: Cloudflare Pages, directorio raiz `web`, build `npm run build`, salida
   `dist`. Despues, alta del dominio en Search Console y enviar `/sitemap.xml` a mano.
