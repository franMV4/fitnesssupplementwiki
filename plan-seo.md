# Plan SEO + AI SEO — Comparador de suplementos

Objetivo: que esta web sea el primer resultado (y la fuente que citan ChatGPT, Perplexity,
Gemini y AI Overviews) para consultas del tipo **"qué creatina comprar"**, **"cuál es la mejor
proteína whey"**, **"creatina más barata"**.

## La tesis

Google y los LLM premian cosas distintas y esta web ya tiene lo caro de conseguir en las dos:

| Lo que premia | Lo que ya tenemos |
|---|---|
| Google: contenido único, no copiable | 428 precios reales recogidos hoy, actualizados por pipeline |
| Google: E-E-A-T (método explícito, fuentes) | `/metodologia` generada desde la config que puntúa + DOIs |
| LLM: hechos extraíbles y citables | tablas con unidad declarada, desglose línea a línea |
| LLM: frescura fechada | `fecha_scrape` por producto |

Lo que **falta** no es contenido: es que nada de eso esté *marcado*, *enlazado* ni *respondido
en la forma de la pregunta*. Un LLM no cita una tabla si no encuentra la frase que responde;
Google no da un fragmento destacado si no hay un párrafo que conteste en 40 palabras.

Por eso el plan no escribe prosa nueva a mano (envejecería y mentiría en cuanto cambien los
precios): **genera la respuesta desde el dataset**, así que siempre es verdad y se actualiza
sola en cada `actualizar.py`.

## Fases

### F1 · Sitio publicable (bloqueaba todo lo demás)
- `web/src/sitio.js`: dominio, nombre y descripción en **una sola constante**. Provisional:
  `comparador-suplementos.pages.dev` (el que da Cloudflare Pages). Cambiarla ahí lo cambia en
  canonical, sitemap, robots, llms.txt y JSON-LD.
- `sitemap.xml` generado desde el dataset (endpoint Astro, sin dependencia nueva), con
  `lastmod` = fecha de recogida.
- `robots.txt` generado: permite todo, **permite explícitamente los bots de IA**
  (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot…) y apunta al sitemap.
  Bloquear esos bots es renunciar a aparecer en las respuestas de IA.
- `404.astro` que devuelve al lector a las categorías (páginas huérfanas = enlaces muertos).
- `web/public/_headers` para Cloudflare Pages: caché inmutable de `/_astro/*` + cabeceras
  de seguridad.

### F2 · Datos estructurados (JSON-LD)
Sin esto Google ve texto; con esto ve productos, precios y preguntas.
- Todas las páginas: `WebSite` + `Organization` (editor) en un `@graph`.
- Categoría: `BreadcrumbList` + `ItemList` con los 10 primeros y su `Offer` (precio, moneda,
  disponibilidad, tienda) + `FAQPage`.
- Producto: `Product` (marca, imagen, `offers` con precio real) + `Review` editorial con
  nuestro score (0–100) — es una reseña de crítico, no un rating de usuarios inventado +
  `BreadcrumbList` + `FAQPage`.
- Nunca `aggregateRating` falso: no tenemos opiniones de usuarios y fingirlas es penalizable.

### F3 · Responder la consulta con la forma de la consulta
- **Las consultas objetivo son datos**, no adivinanzas del agente: cada categoría declara en
  `categorias.py` las 5 preguntas que quiere ganar (`consultas`), y el `termino` con el que la
  busca la gente. Es lo que edita el dueño cuando añade una categoría.
- **Bloque "La respuesta corta"** bajo el H1 de cada categoría y de cada ficha: 3 frases
  generadas desde el dataset que nombran ganador, precio más bajo, rango y fecha. Es la unidad
  que copia un LLM y la que Google usa como fragmento destacado.
- **FAQ al pie** de categoría y ficha, con las respuestas generadas desde los mismos datos y
  marcadas como `FAQPage`.
- Títulos y descripciones reescritos hacia la consulta real:
  `Mejor creatina 2026: cuál comprar según precio por kg y certificación`.
  El año sale de la fecha de recogida, así que no se queda viejo.

### F4 · SEO para IA (GEO)
- `/llms.txt`: índice del sitio en markdown para modelos — qué es, cómo se puntúa, las nueve
  comparativas con su ganador y su precio más bajo, y dónde están los datos crudos.
- `/datos/{categoria}.json`: el mismo ranking en JSON limpio y citable. Un modelo que puede
  leer la tabla sin parsear HTML cita la fuente con más facilidad.
- Fecha visible y marcada (`<time datetime>`) en cada página: la frescura es la mitad de por
  qué un modelo elige una fuente de precios.
- Enlazado interno: categorías relacionadas al pie de cada tabla y alternativas reales al pie
  de cada ficha (más barata, mejor puntuada, misma marca en otra tienda).

### F5 · Comprobación
- `seo_check.py`: corre sobre `web/dist` ya construido y falla si una página se queda sin
  título, sin descripción, sin canonical, con dos H1, con JSON-LD que no parsea, si el sitemap
  no lista todas las páginas o si queda un `ejemplo.es` suelto.

### F6 · Documentación
- `SEO-PRODUCTOS.md`: las premisas para que añadir un producto, una tienda o una categoría no
  rompa nada de lo anterior. Es el entregable que pediste.

## Fuera de plan (deliberado)

- **og:image**: no mueve el ranking y generar una imagen decente sin diseño es peor que no
  tenerla. Cuando haya identidad visual, una PNG en `public/` y dos metas.
- **Blog / guías largas**: la ventaja de esta web es el dato fresco, no la prosa. Escribir
  1.500 palabras sobre la creatina compite con Examine y con Healthline y se pierde.
- **Backlinks**: no es trabajo de código. Lo que sí hace el código: el JSON y el `llms.txt`
  son enlazables y citables, que es como se consiguen enlaces sin pedirlos.
- **Ads**: siguen sin implementarse hasta que haya tráfico (decisión previa del dueño).
