# Plan estético: «Rotativa, hecha a mano»

> Estado (2026-09-14): **F2 hecha** (imágenes fundidas en el papel, foto de ficha sin
> carga diferida, plancha sin foto con la figura de la marca). **F1.1 hecha** (tildes y
> eñes en todo el texto visible, resueltas en un paso al final del build:
> `web/src/tildes.js` + integración en `astro.config.mjs`, con guard en `seo_check.py`).
> **F1.2 hecha** (desglose del score en castellano: coma decimal, €, mayúscula, en
> `formateaDesglose`). **F1.3 hecha** (H1 de categoría corto: "La mejor creatina de 2026").
> **F3 hecha** (móvil: aviso de afiliación plegado a una línea, filtros plegados tras un
> botón "Filtrar y ordenar" que `tabla.js` cierra solo en móvil, chips con pista de scroll;
> primera fila a 446 px en 375×812). **Pendiente de F1**: firma y nota del editor (F1.4,
> necesita frases del dueño). **F1.5 hecha** (espacio duro en `eur()` para que "8,95 €" no
> se parta; horquilla de cifras como "de X a Y" y el conector "a" legible). F1.4 descartada
> por el dueño.
> **F4.1 hecha** (la regla de precios como cabecera de categoría: `ReglaPrecios.astro`).
> **F5 hecha** en su parte segura (`text-wrap: balance/pretty`, `hanging-punctuation`,
> `text-underline-offset`, hamburguesa hereda la fuente); el rediseño del logotipo (F5.4)
> queda fuera para no tocar los assets de marca. **F6 hecha** (botón/chip se hunden al
> pulsar, filete naranja en la fila al pasar el ratón, celda más barata resaltada en las
> tablas de marca y de formatos, 404 con voz). Pendiente: F1.4, F1.5, F4.2 (ficha como
> etiqueta de precio) y F4.3 (notas al margen).
> Nota: en F2.3 se usó el favicon en vez de doce pictogramas por familia.
>
> Sucede a `PLAN-VISUAL.md`, que ya está terminado. Aquí no se cambia de identidad, se le quitan las marcas de fábrica.

Medido sobre la web publicada (fitnesssupplementwiki.com) el 2026-09-14, a 1440×900 y a
375×812, en portada, `/creatina/` y la ficha de HSN Raw Series Creatina 1 kg.

---

## 0. La tesis

La identidad «Rotativa» ya es lo contrario de una web de IA: nada de Inter, nada de
degradados morados, nada de tarjetas redondeadas. El diseño **no** es el problema.
Lo que delata que la web la ha generado una máquina es otra cosa, y es más barata de
arreglar:

1. **La escritura.** Es lo primero que nota un lector español, antes que cualquier color.
2. **La plantilla repetida.** Las 4.800 páginas tienen la misma pila: migas → antetítulo →
   H1 de fórmula → «La respuesta corta.» → aviso → tabla → FAQ.
3. **Los datos en crudo.** Frases de log de programa pintadas como si fueran texto.
4. **Los detalles de oficio que faltan.** Justo los que un diseñador hace sin pensar y un
   generador no hace nunca.

Las guías coinciden en esto: una página parece genérica cuando **podría hablar de
cualquier cosa**. La cura es enseñar lo que solo tiene esta web (nombres, precios, fechas,
la gráfica de la horquilla) y que se note una persona detrás.

---

## 1. Diagnóstico, con números

| # | Síntoma | Medida |
|---|---|---|
| D1 | Texto sin tildes ni eñes | **47 palabras** sin tilde visibles solo en `/creatina/` («categoria», «certificacion», «espanolas», «analisis», «mas»). En la portada, «Compara 4152 suplementos de 19 tiendas espanolas». |
| D2 | Versales por todas partes | **594 elementos** con `text-transform: uppercase` en `/creatina/`. En móvil el antetítulo en mono ocupa dos líneas antes del H1. |
| D3 | H1 de fórmula | Las 50 categorías dicen «La mejor X de 2026: comparativa por precio por kg y certificacion». Tres líneas en escritorio y cuatro en móvil. |
| D4 | «La respuesta corta.» en cada página | El mismo rótulo en portada, categoría, ficha, marca y landing. |
| D5 | El desglose es un log | «1000 g dan 333 dosis efectivas de 3000 mg: 0.042 EUR por dosis», «14.00 EUR por kilo (el mas barato de la categoria son 8.95)», «cumple: No es una mezcla…». Punto decimal, «EUR» y minúsculas de programa. Sale de `scoring/motor.py`. |
| D6 | Cajas blancas sobre papel | Las fotos de producto son de fondo blanco y dejan un recuadro blanco en la tabla (238 miniaturas en `/creatina/`) y en la ficha. |
| D7 | La foto de la ficha tarda en salir | Está en la primera pantalla con `loading="lazy"`: en la captura salió un rectángulo blanco vacío. |
| D8 | Móvil: la tabla empieza en la segunda pantalla | En `/creatina/`, a 375 px, primero van H1 de 4 líneas, un aviso de afiliación de 6 líneas, 3 cifras apiladas y 4 filtros. La primera fila no aparece en la primera pantalla. |
| D9 | Chips cortados | «Verificación mínima» en móvil: el último chip sale partido («4 V») sin indicar que hay scroll. |
| D10 | Marca con tres eses | «FITNESSSUPPLEMENT» en versales condensadas no se lee, y «WIKI» flota desalineado a la derecha. |
| D11 | Detalles que faltan en el CSS | 0 `mix-blend-mode`, 0 `font-variant-caps`, 0 `hanging-punctuation`, 0 `fetchpriority`, 1 solo `text-underline-offset`. El botón hamburguesa hereda Arial. |
| D12 | Rotura rara de precios | En móvil: «8,95 €ₐ293,27 € POR KG», con la «a» en subíndice y el precio partible. |

Lo que **ya está bien** y no se toca: la paleta papel/tinta con dos tintas con significado,
Big Shoulders + Archivo + Plex Mono, filetes y `border-radius: 0`, la sombra dura, los
números tabulares (25 usos), el tema oscuro, el `prefers-reduced-motion` y la regla de no
animar con el scroll.

---

## 2. Lo que dicen las guías, reducido a reglas para esta web

| Fuente | Regla | Aplicación aquí |
|---|---|---|
| Butterick, *Practical Typography* | Cuerpo de 15–25 px, interlineado de 120–145 %, líneas de 45–90 caracteres. Una tipografía profesional es la mejora más visible. | Tipografías: ya cumple. Cuerpo: ~17 px con 1,5 de interlineado. Medida: 60–75 ch en prosa. |
| NN/g, *Comparison Tables* | Opciones en columnas y atributos en filas. Cabecera fija. Entradas breves, sin frases. Filtrar a ≤5 opciones. En móvil, convertir en lista o pestañas. Resaltar las diferencias. | D8 y D9. En «todos los formatos» y en las comparativas, resaltar la celda que gana. |
| NN/g, *Explicit differences* | Decir la diferencia, no obligar a buscarla. | Etiqueta «−57 % frente al más barato» junto al precio, en vez de solo en la prosa. |
| Refactoring UI (Wathan y Schoger) | Jerarquía con tamaño, peso y color, en ese orden. El color al final. Dar aire. | D2: la jerarquía hoy la hacen las versales. Pasar a tamaño y peso, y dejar las versales para 3 niveles. |
| Guías «AI slop» (925studios, 21st.dev) | Delatan: titulares genéricos, espaciado y radios uniformes, cero estados *hover*, fundidos idénticos al hacer scroll, imágenes de stock. Curan: escribir el contenido primero, datos reales, capturas del producto, variar la composición, movimiento con intención. | D3, D4 y D5 (contenido). Sección 5 (composición) y sección 6 (movimiento). |
| Stripe / editorial fintech | La confianza se transmite con tipografía de revista, no con cromo. Titular seguro y explicación discreta. La profundidad sale de cambios de tono de fondo, no de sombras. | Encaja con la Rotativa: bajar la voz de los rótulos y dejar que hablen el H1 y la cifra. |
| Wirecutter | Una persona firma, con fecha y «por qué fiarte». La recomendación va en una frase escrita por alguien. | Firma visible y una línea de editor por categoría (F1.4). |

---

## 3. Dirección

**«El diario de precios que hace una persona.»** Se mantiene la rotativa: papel, dos
tintas, cartel condensado. Se añade lo que tiene un diario de verdad y no tiene una
plantilla: firma, ortografía cuidada, notas al margen, cifras compuestas a mano y una
**gráfica propia que se repite como firma visual**: la regla de precios con la mediana y
el líder, que hoy solo sale en la portada.

Lo memorable, en una frase: *cada página enseña su regla de precios antes que su texto.*

---

## 4. Plan por fases (ordenado por impacto ÷ esfuerzo)

### F1 · La voz: que se lea escrito por alguien (impacto máximo, esfuerzo medio)

1. **Tildes y eñes en todo el texto visible** (D1). Identificadores, claves y comentarios
   siguen sin tildes, como manda `AGENTS.md`. El texto que ve el lector, con ellas.
   - Ficheros: `web/src/datos/seo.js`, `landings.js`, `porque.js`, `tiendas.js`,
     `eficacia.js`, las páginas `.astro`, `NIVELES` en `exportar.py` y los `nombre`,
     `termino`, `mejor` y `consultas` de `categorias.py`. Los slugs **no** cambian.
   - Protección: `seo_check.py` falla si el HTML visible contiene alguna palabra de una
     lista cerrada («categoria», «certificacion», «espanol», «analisis», «capsula»,
     «mas barato»…). Sin test, vuelven.
2. **El desglose en castellano** (D5). No se toca el motor: se reescribe al exportar
   (`exportar.py`), con coma decimal, «€/kg», espacio duro y mayúscula inicial.
   «1000 g dan 333 dosis efectivas de 3000 mg: 0.042 EUR por dosis» →
   «**333 dosis** de 3 g por envase · 0,04 € la dosis».
3. **H1 corto y distinto de la etiqueta de SEO** (D3). El `<title>` ya lleva las palabras
   clave. El H1 puede ser humano, en dos líneas como mucho:
   «Creatina: 239 botes, del más barato al mejor». La fórmula «comparativa por precio por kg
   y certificación» baja al antetítulo, que ya existe.
4. **Firma y nota del editor** (D4). Se sustituye el rótulo «La respuesta corta.» por
   una firma: «Por Fran Muñoz · precios del 13 sept.». Además, un campo opcional
   `nota` en `categorias.py`: **una frase escrita por el dueño** por categoría («Si no te
   importa la marca, la monohidrato de 1 kg de cualquier tienda grande basta»). Donde no
   hay nota, no se inventa. Es el elemento que ningún generador puede falsificar.
5. **Español tipográfico** (D12): espacio duro entre cifra y unidad (`8,95 €/kg`),
   «de 8,95 a 293,27 €/kg» en vez del subíndice, comillas «latinas» y raya — en los
   incisos. Un helper en `util.js`, no a mano en cada plantilla.

### F2 · Imágenes: que el producto viva en el papel (impacto alto, esfuerzo bajo)

1. **Fundir el fondo blanco en el papel** (D6): `mix-blend-mode: multiply` sobre
   `background: var(--papel)` en miniaturas y en la foto de la ficha. El blanco del
   packshot desaparece y el bote queda impreso en la hoja. Es el cambio más barato del
   plan y el que más se nota.
   - Modo oscuro: `multiply` ennegrece. Ahí va una ficha de papel claro (`--papel`) con
     filete, como un recorte pegado en la página oscura.
2. **La foto de la ficha, al momento** (D7): `loading="eager"`, `fetchpriority="high"`
   y `aspect-ratio` fijo solo en la ficha. Mejora también el LCP.
3. **Sin foto, dibujo propio**: en vez del marco vacío, el pictograma de la categoría con
   el trazo del favicon. Doce iconos SVG como mucho, uno por familia de `familias.js`.

### F3 · Móvil: la tabla en la primera pantalla (impacto alto, esfuerzo medio)

1. **Aviso de afiliación en una línea** (D8): «† Algunos enlaces son de afiliado ·
   no cambian el orden» con `<details>` para el resto. De 6 líneas a 1.
2. **Las tres cifras en una fila** con la regla de precios debajo (ver F4.1).
3. **Los filtros tras un botón**: «Filtrar · Ordenar» fijo, y los controles en una hoja
   que sube desde abajo. Es la adaptación móvil que pide NN/g. Los chips, con scroll
   horizontal y un degradado de papel en el borde que avisa de que siguen (D9).
4. **Objetivo medible**: a 375×812, la primera fila de datos antes de los 812 px.

### F4 · Composición: romper la plantilla única (impacto alto, esfuerzo medio-alto)

1. **La regla de precios como cabecera de categoría.** La barra de la portada (horquilla
   en escala logarítmica, mediana y líder) sube a la cabecera de `/[categoria]`,
   `/marca/*` y `/mejores/*`, a todo el ancho y grande. Es el dato propio de la web
   convertido en imagen: la «captura del producto real» que piden las guías.
2. **La ficha como etiqueta de precio**: el bloque de precio de la ficha se compone como
   un tique de balda (precio grande en Big Shoulders, €/kg, «−57 % frente al más barato»
   con la tinta que toque y el puesto «4.º de 239»). Se diferencia a primera vista de la
   cabecera de categoría.
3. **Notas al margen en escritorio**: el token `--carril` ya existe. Fecha de recogida,
   fuente y enlace a la metodología van al margen izquierdo, como la columna de un diario,
   en vez de ser un párrafo más encima de la tabla.
4. **Cada plantilla con su apertura**:
   - Portada: buscador y titular.
   - Categoría: la regla de precios.
   - Ficha: la etiqueta de precio.
   - Guía: la cita con el DOI.
   - Marca: el mosaico de sus botes, fundidos con F2.1.
   - Tienda contra tienda: el marcador «14–9».

### F5 · Tipografía y jerarquía (impacto medio, esfuerzo bajo)

1. **Tres niveles de versal y ni uno más** (D2): H1, H2 y los rótulos de cabecera de tabla.
   Migas, antetítulos, chips y pies van en caja normal. Donde se quiera el tono de rótulo,
   `font-variant-caps: all-small-caps` en Plex Mono, con menos tracking. Objetivo: menos de
   150 elementos en versales en `/creatina/`.
2. `text-wrap: balance` en todos los H1/H2/H3 y `text-wrap: pretty` en párrafos: nada de
   una palabra sola en la última línea.
3. `hanging-punctuation: first` en citas y en la respuesta. Subrayado de enlaces con
   `text-underline-offset: .18em` y `text-decoration-thickness: 1px`, que pasa a 2px al
   pasar el ratón.
4. **Rótulo de la marca** (D10): «Fitness**Supplement**» con cambio de peso en vez de
   todo en versal, y «wiki» en Plex Mono sobre la misma línea base. Se redibuja en
   `favicon.svg` y en `og.png` con `python assets.py`.
5. El botón hamburguesa hereda `--texto` y no Arial (D11).

### F6 · Oficio y movimiento (impacto medio, esfuerzo bajo)

1. **Estados que se sienten de papel**: al pulsar, el botón se desplaza 2 px hacia su
   sombra dura (`translate(2px,2px)` y sombra de `9px` a `7px`), con 120 ms `ease-out`. Sin
   rebotes ni fundidos.
2. **Fila de tabla al pasar el ratón**: fondo `--papel-2` y la barra de naranja de 3 px a
   la izquierda del puesto. Hoy no hay respuesta.
3. **Diferencias resaltadas** (NN/g): en «todos los formatos», en comparativas y en marca,
   la celda de €/kg más baja lleva el relleno `--senal-piel`. La del nivel 4 lleva
   `--prueba-tinte`.
4. **Página 404 con voz**: «Este bote ya no está en la balda», con los tres más buscados
   de su categoría. Suele ser la página más genérica de cualquier web.
5. Sin cambios en lo que ya prohíbe `AGENTS.md`: nada de animación ligada al scroll, nada
   de `backdrop-filter`, nada de sombras difuminadas.

---

## 5. Lo que no se hace (lista anti-«AI slop»)

- Ni degradados de colores, ni *glassmorphism*, ni tarjetas redondeadas que flotan.
- Ni iconos de librería genérica en cada título, ni emojis como iconos.
- Ni fotos de stock ni ilustraciones generadas. Solo fotos de tienda y dibujo propio.
- Ni fundidos de entrada al hacer scroll.
- Ni textos tipo «Descubre», «Potencia tu rendimiento» o «Todo lo que necesitas».
- Ni una tercera tinta: naranja = dinero y azul = confianza, sin más.
- Ni texto inventado para rellenar notas de editor: si el dueño no la escribe, no sale.

---

## 6. Resumen de prioridades

| Fase | Impacto | Esfuerzo | Ficheros principales |
|---|---|---|---|
| F1 Voz y ortografía | ★★★ | Medio (1–2 sesiones) | `datos/*.js`, `categorias.py`, `exportar.py`, `seo_check.py` |
| F2 Imágenes | ★★★ | Bajo (1 h) | `global.css`, `TablaProductos.astro`, `producto/[slug].astro` |
| F3 Móvil | ★★★ | Medio | `[categoria].astro`, `TablaProductos.astro`, `tabla.js`, `global.css` §19 |
| F4 Composición | ★★☆ | Medio-alto | nuevo `ReglaPrecios.astro`, fichas, marca, landings |
| F5 Tipografía | ★★☆ | Bajo | `global.css`, `assets.py`, `Base.astro` |
| F6 Oficio | ★☆☆ | Bajo | `global.css`, `404.astro` |

**Orden recomendado:** F2 → F1 → F3 → F5 → F4 → F6. F2 da el resultado más visible en
una hora y sirve de prueba de la dirección. F1 es lo que más cambia la percepción.

## 7. Cómo se comprueba cada fase

- Capturas antes y después a 1440×900 y 375×812, en claro y en oscuro, en portada,
  `/creatina/`, una ficha, `/marca/hsn-raw-series/` y una comparativa.
- Las cifras de la sección 1 se vuelven a medir: palabras sin tilde (0), elementos en
  versales (<150), altura de la primera fila en móvil (<812 px).
- Contraste AA en los dos temas para cualquier color tocado (regla de `AGENTS.md`).
- `npm run build`, `python seo_check.py`, `python tests.py` y `node --test`. Los títulos
  y los H1 cambian (F1.3), así que hay que revisar que `seo_check` no detecte H1 repetidos.

---

## Fuentes

- [Butterick's Practical Typography: resumen de reglas](https://practicaltypography.com/summary-of-key-rules.html) y [longitud de línea](https://practicaltypography.com/line-length.html)
- [NN/g: Comparison Tables for Products, Services, and Features](https://www.nngroup.com/articles/comparison-tables/)
- [NN/g: Explicitly State the Difference Between Options](https://www.nngroup.com/articles/explicit-differences/)
- [Refactoring UI, notas (Wathan y Schoger)](https://iamaatoh.com/essays/refactoring-ui.html)
- [AI Slop Web Design: guía para detectarlo y corregirlo (925studios)](https://www.925studios.co/blog/ai-slop-web-design-guide)
- [How to Make a Site Not Look AI Generated (21st.dev)](https://21st.dev/blog/website-not-look-ai-generated)
- [Stripe DESIGN.md: estética editorial](https://www.webdesignhot.com/design.md/stripe/)
- [Redesigning & Rebranding The Wirecutter (Design Driven)](https://www.youtube.com/watch?v=qQnCKSc8Zm0)
