# Plan de rediseño del front — "Boletín"

> **Histórico (2026-08-21).** Lo sustituye el sistema "Rotativa" del 2026-08-27, descrito
> en `AGENTS.md`. Las clases y la estructura de este plan siguen vigentes; lo que cambió
> es la capa visual (paleta, tipografía de titular, grosor de filete). Se conserva porque
> explica **por qué** el front no tiene tarjetas ni sombras, que sigue siendo la regla.

Rediseño completo de `web/`. No es un retoque de colores: cambia la dirección estética,
la retícula, la tipografía, la jerarquía de la portada y la manera de enseñar los datos.
El backend (Python, BD, `dataset.json`) **no se toca**: el contrato de datos es el mismo.

> **Estado: ejecutado el 2026-08-21.** Las siete fases están aplicadas y el sitio compila
> (429 páginas, 0 errores) con los 46 asserts de `tests.py` pasando. Diferencias con lo
> planeado, todas anotadas en su sitio: el índice de `/metodologia` se quedó sin estado
> "activo" (§3.4), las barras no se animan con `animation-timeline: view()` (§2.4: 45 barras
> creciendo al hacer scroll son un truco, y este diseño no los quiere), la ficha de producto
> no lleva barra de score (el número basta y la barra
> ya vive en las tablas), y el CSS quedó en 583 líneas frente a las 506 de partida en vez de
> menos — el `@media print`, el menú `<details>` y la ficha técnica son piezas nuevas, y a
> cambio los ~90 `style=` en línea bajaron a 3 (los tres son anchos de barra calculados).

---

## 1. Diagnóstico: qué hay que matar

Lo que hay hoy es, punto por punto, el look que genera una IA cuando le pides "moderno":

| Tic actual | Dónde | Por qué se va |
|---|---|---|
| Casi-negro + acento lima con `box-shadow` de glow | tokens de `global.css`, `.boton.primario`, `.glifo` | Es *la* paleta por defecto de la IA. |
| Titular partido en dos colores (`<span class="resalte">`) | `index.astro` h1 | Petición explícita del dueño: fuera. |
| Tira de 4 estadísticas bajo el hero (`.tira-datos`) | portada y las 9 categorías | Ídem. Números decorativos que nadie usa. |
| Blob radial de color detrás del hero (`.hero::before`) | `global.css` | Cliché. |
| Retícula + grano a pantalla completa (`body::before/::after`) | `global.css` | "Textura" pegada encima, no diseño. |
| Cabecera *glassmorphism* con `backdrop-filter: blur(14px) saturate(1.3)` | `header.sitio` | Ídem. |
| Etiquetas mono en versalitas con `letter-spacing:.18em` (`.rotulo`) | 60+ usos | El tic AI más reconocible. Se reduce al 10 %. |
| Rejilla de tarjetas redondeadas (12/20px) que levitan al hover | `.tarjeta`, `a.tarjeta:hover` | Bootstrap con maquillaje. |
| Estilos en línea (`style="…"`) por todas las páginas | ~90 apariciones | Impiden que exista un sistema. |

Además hay un problema de fondo: **la web es un comparador y los datos están escondidos**.
La portada dedica dos pantallas a explicarse antes de enseñar un solo precio.

---

## 2. La dirección: prensa de datos española, en papel

**Concepto**: un boletín de precios impreso. Papel cálido, tinta negra, una tinta roja de
señal, filetes de 1px en vez de cajas, y **la tabla como protagonista**, no como anexo.
Referencia mental: la página de mercados de un diario económico, no una landing SaaS.

Por qué encaja: el producto *es* una tabla de números con procedencia citada. La estética
editorial da autoridad — que es justo lo que vende esta web ("ni estrellas, ni opiniones") —,
lee bien en móvil, imprime bien, y es el polo opuesto exacto al dark-mode-lima de hoy.

**Regla de oro**: cada pantalla enseña un dato real antes que una explicación.

### 2.1 Tipografía

| Rol | Familia | Uso |
|---|---|---|
| Titulares | **Newsreader** (600 + cursiva, eje óptico) | h1/h2, nombre de producto, antetítulos en cursiva. |
| Texto e interfaz | **Archivo** (400/500/600) | Prosa, navegación, tablas, filtros. Diseñada para prensa: no es Inter. |
| Códigos | **IBM Plex Mono** (400) | Solo códigos QS, fechas de scrape y DOIs. Nada más. |

- Las cifras **no** van en mono: van en Archivo con `font-variant-numeric: tabular-nums lining-nums`.
  Alinean igual y no se ven "de laboratorio".
- `h1` con `font-optical-sizing: auto`, `letter-spacing: -.015em`, `text-wrap: balance`.
- Escala fija (no todo con `clamp`): 3.4 / 2.1 / 1.45 / 1.15 / 1 / .875 / .78 rem. `clamp`
  solo en el h1 y en el antetítulo de portada.
- Medida de prosa: 62-68 caracteres (`max-width: 34rem` en Archivo a 1rem).

### 2.2 Color

```css
--papel:   #faf7f1;   /* fondo, blanco cálido de papel */
--papel-2: #f3eee4;   /* filas alternas, superficies hundidas */
--papel-3: #ebe4d7;   /* cabeceras de tabla */
--tinta:   #17130e;   /* texto principal */
--tinta-2: #4d463c;   /* secundario */
--tinta-3: #8b8172;   /* metadatos */
--regla:   rgba(23,19,14,.14);   /* filete 1px */
--regla-2: rgba(23,19,14,.28);   /* filete fuerte */
--senal:      #b2301c;   /* rojo de imprenta: acento unico */
--senal-piel: #f6e7e2;
```

Niveles de verificación, con una inversión deliberada: **el nivel 4 es tinta negra, no un
color llamativo**. Lo verificado no necesita gritar; lo dudoso sí se señala.

```css
--n4: #17130e;  --n3: #2b5a8f;  --n2: #9a6a12;  --n1: #8b8172;  --alarma: #b2301c;
```

El rojo aparece **cinco veces por pantalla como mucho**: el `01` del ranking, el subrayado
del enlace activo, el €/kg de la fila líder, el aviso de infradosis y el botón primario.
Todo lo demás es papel y tinta.

Modo oscuro: **fuera del alcance de v1**. Se añade luego como `@media (prefers-color-scheme: dark)`
sobre los mismos tokens si el dueño lo pide.

### 2.3 Retícula y forma

- Contenedor de 76rem con **carril izquierdo de 11rem** a partir de 78rem de ancho, para
  metadatos al margen (fecha de recogida, recuento, índice): asimetría de página impresa,
  no todo centrado.
- **Filetes en vez de cajas**: `border-radius` máximo 3px y solo en botones/chips. Cero
  `box-shadow` decorativa (una sola de 1px para la cabecera al hacer scroll).
- La superficie por defecto es el papel. Las "tarjetas" se convierten en **bloques separados
  por filetes** (`border-top: 1px solid var(--regla)`), no en rectángulos flotantes.
- Cabecera pegajosa **opaca**, sin blur, con filete inferior.
- Espaciado en escala nombrada de 4px: `--e1:.25rem … --e8:5rem`. Nada de números sueltos.

### 2.4 Movimiento

- **Una** entrada escalonada al cargar: `opacity` + `translateY(6px)`, 380 ms,
  `cubic-bezier(.2,.7,.3,1)`, retardos de 40 ms. (Hoy son 700 ms y 14 px: se nota "animado".)
- Hover: subrayado que crece desde la izquierda en enlaces de producto; la fila de tabla tiñe
  a `--papel-2`. **Nada levita, nada brilla, nada escala.**
- La barra del score se anima al entrar en pantalla con `animation-timeline: view()` dentro de
  `@supports`, sin JS.
- `prefers-reduced-motion` ya está cubierto: se mantiene tal cual.

### 2.5 Lista negra (repasar antes de dar por buena cada fase)

Ni titular bicolor · ni tira de estadísticas · ni degradado violeta/lima · ni blob radial ·
ni glassmorphism · ni emojis como iconos · ni rejilla de 3 tarjetas redondeadas · ni etiquetas
mono en versalitas fuera de códigos · ni sombras de más de 1 px · ni `✨`.

---

## 3. Rediseño pantalla a pantalla

### 3.1 Portada (`pages/index.astro`) — portada de boletín

1. **Cabecera de edición**: una línea de filete a filete — `Comparador de suplementos ·
   edición del {generado} · 428 productos · 9 categorías · 5 tiendas`. Ahí van los números
   que hoy ocupan la tira de estadísticas, en su sitio: pie de imprenta, no decoración.
2. **Titular** a una sola tinta, dos líneas, Newsreader 600. Entradilla de 3 líneas a 34rem.
3. **La tabla de portada** (lo nuevo): *Lo más barato de cada categoría hoy* — 9 filas, una por
   categoría: producto, tienda, €/kg o €/cápsula, nivel. Un dato real por encima del pliegue.
   Ya se calcula en el frontmatter actual (`podios[].top[0]`).
4. **Índice de categorías** en dos columnas con filetes (no tarjetas): nombre en Newsreader,
   `desde X €/kg` a la derecha en tabulares, recuento en tinta-3.
5. **Cómo se lee la puntuación**: tres bloques separados por filete vertical, numerados
   `01/02/03` en rojo pequeño. Mismo contenido, otro contenedor.
6. Aviso de orden y afiliación como **nota al pie con filete arriba**, no como caja de alerta.

Se elimina `.tira-datos`, `.resalte` y el bloque "Lo mejor ahora mismo" en su forma actual
(se funde con el punto 3 para no repetir podios).

### 3.2 Categoría (`pages/[categoria].astro` + `componentes/TablaProductos.jsx`)

Es la página que importa.

- Cabecera compacta: antetítulo en cursiva, h1, entradilla de dos líneas. **Sin tira de
  estadísticas**: los cuatro números pasan a una línea de resumen en tabulares justo encima de
  la tabla — `45 productos · de 22,10 a 118,00 €/kg · 0 verificados`.
- **Barra de filtros** deja de ser caja: fila con filete arriba y abajo, campos sin borde salvo
  un filete inferior (formulario impreso), foco con filete rojo de 2px.
- La tabla ocupa **el ancho completo del contenedor** (76rem) aunque la prosa siga a 34rem.
- Columnas: `#` (`01` en rojo para el líder), Producto (miniatura 44px sobre papel-2, marca en
  600), Tienda, Envase, €/unidad (tabulares, líder en rojo), Verificación, Score.
- Score: número + **barra de 3px a filete**, no barra redondeada de color.
- Fila con `flag_infradosaje`: filete izquierdo rojo de 2px en la celda principal.
- Móvil (≤46rem): se conserva el patrón `table.apilable` + `data-et` (funciona bien), con la
  ficha apilada rediseñada — nombre, precio grande en tabulares, meta en una línea.
- La isla React mantiene su lógica intacta: solo cambian `className` y estructura mínima.

### 3.3 Ficha de producto (`pages/producto/[slug].astro`)

Pasa a maqueta editorial a dos columnas en ≥62rem:

- **Columna izquierda (sticky, 17rem)**: foto sobre papel-2 y debajo la **ficha técnica** como
  lista de definición con filetes — Score, €/unidad, Envase, Coste por dosis efectiva, Nivel,
  Tienda, Fecha de recogida. Botón primario "Ver en la tienda" al final.
- **Columna derecha**: migas → antetítulo (`marca · formato · puesto N de M`) → h1 → "Por qué
  puntúa así" (numerales pequeños en rojo, no flechas) → ingredientes → certificaciones →
  dónde comprarlo.
- **Ingredientes**: hoy son cajas; pasan a filas de filete con el nombre en Newsreader, la
  dosis a la derecha en tabulares, la barra de 3px debajo y la fuente citada en `.sutil`.
  Es la sección con más valor SEO: gana medida corta y jerarquía real.
- El panel de 3 tarjetas (`.panel-producto`) desaparece: su contenido vive en la ficha técnica.

### 3.4 Metodología (`pages/metodologia.astro`)

Ya es lo más cercano a la dirección nueva; se reencuadra:

- El índice se muda al carril izquierdo global. Sin estado "activo al hacer scroll".
  *(ponytail: 12 líneas de `IntersectionObserver` ahorradas; se añaden si se echan de menos.)*
- Numeración `01…08` en rojo colgando al margen (hanging numerals).
- Las tablas heredan el estilo nuevo. El texto no se toca: está bien escrito.

### 3.5 Cabecera, pie y `Aviso`

- **Cabecera**: marca a la izquierda (glifo nuevo: cuadro de tinta con filete rojo, sin glow).
  Con 9 categorías + metodología no cabe una fila en portátil: se agrupan en `Categorías ▾`
  con `<details>` nativo. *(ponytail: `<details>`, no un dropdown con estado.)*
- **Pie**: tres columnas con filete superior, legal a 46rem, colofón de edición en mono pequeño
  (único uso de mono en el pie).
- **`Aviso.astro`**: deja de ser caja de alerta; nota con filete superior y `†` en rojo.

---

## 4. Fases de ejecución

Cada fase deja el sitio compilando y navegable (`npm run build`) y se verifica con captura en
`npm run dev` (puerto 4322) antes de pasar a la siguiente.

| # | Fase | Ficheros | Check |
|---|---|---|---|
| 0 | Tokens y base: paleta, tipos, escala, reset. Se borran retícula, grano, blob y glows. | `estilos/global.css` §1-3 | Build OK; la portada se ve rota, pero en papel. |
| 1 | Cascarón: cabecera, nav con `<details>`, pie, retícula con carril, `Aviso` | `layouts/Base.astro`, `componentes/Aviso.astro`, css §4-6 | Captura de cabecera y pie a 1440 y 390 px. |
| 2 | Portada | `pages/index.astro`, css §portada | Captura: tiene que haber un precio real sobre el pliegue. |
| 3 | Categoría + isla React | `pages/[categoria].astro`, `componentes/TablaProductos.jsx`, css §tabla/filtros | Filtros, orden y "limpiar filtros" siguen funcionando; captura móvil de la tabla apilada. |
| 4 | Ficha de producto | `pages/producto/[slug].astro`, css §ficha | Captura de una ficha con dosis (HSN) y otra sin ellas (Prozis). |
| 5 | Metodología | `pages/metodologia.astro`, css §doc | Captura; comprobar anclas `#niveles`, `#formula`, `#sellos`, `#afiliacion`. |
| 6 | Pulido: entrada escalonada, foco, `@media print`, favicon y `theme-color`, purga de `style=` en línea | todos | `npm run build` + repaso de la lista negra §2.5. |

**Higiene por fase**: no se añade una clase sin borrar la que sustituye. El CSS final debe pesar
**menos** que las 506 líneas actuales; si crece, es que se están apilando dos sistemas.

---

## 5. Detalles técnicos

- **Fuentes**: una sola petición a Google Fonts, 3 familias y 6 cortes (hoy 3 familias y 9
  cortes). `preconnect` + `display=swap` ya están; se añade un `@font-face` local de respaldo
  con `size-adjust` para que el *swap* no salte la maqueta.
- **Estilos en línea**: los ~90 `style="…"` pasan a clases. Es el trabajo aburrido que hace que
  el sistema exista de verdad; va repartido por fases, no en un commit aparte.
- **Nombres de clase**: se conservan los que sobreviven (`.envoltorio`, `.nivel`, `.barra`,
  `.puntos`, `.migas`, `.apilable`, `data-et`) para no tocar cinco ficheros por un renombrado.
  Se borran `.tira-datos`, `.resalte`, `.tarjeta-categoria`, `.panel-producto`, `.hero::before`
  y casi todo `.rotulo`.
- **Impresión**: `@media print` de unas 15 líneas — papel blanco, tabla entera sin scroll, URLs
  de afiliado no impresas. Una tabla de precios se imprime; hoy sale un rectángulo negro.
- **Accesibilidad**: contraste ≥7:1 (sale gratis con esta paleta), `:focus-visible` con filete
  rojo de 2px y `outline-offset: 2px`, `<caption>` oculto en cada tabla, miniatura con `alt=""`
  (decorativa: el nombre va al lado).
- **Rendimiento**: sin blur ni degradados a pantalla completa se van dos capas de composición
  fijas; la tabla pasa a pintarse como capa única.
- **SEO**: los `h2` de categoría pasan a describir contenido (`Los 45 productos de creatina,
  ordenados por score`) en vez de "Categorías", y la tabla de portada añade 9 enlaces internos
  a fichas concretas sin duplicar los podios.

---

## 6. Lo que este plan NO hace

- No toca Python, la BD, `dataset.json` ni el scoring.
- No añade dependencias: sigue siendo Astro + una isla React + CSS a mano. Nada de Tailwind ni
  de librerías de animación.
- No añade modo oscuro, buscador global ni gráficas. Se valoran cuando haya tráfico.
- No cambia los textos legales ni las afirmaciones sobre salud (invariante 1 de `AGENTS.md`).
