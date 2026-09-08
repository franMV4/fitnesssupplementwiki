# Plan visual: "Rotativa, segunda edicion"

> **Estado a 2026-09-07: plan terminado.** Ejecutadas F1 a F7, con una sola cosa
> deliberadamente sin hacer (el agrupado del desglose de la ficha, explicado al final:
> pide tocar el motor de scoring, que este plan declara intocable).
> Lo medido despues esta en la seccion 7. Verificado con `npm run build`
> (5.312 paginas), `python seo_check.py` (SEO OK), `python tests.py` (101) y
> `node --test` (39).


De cartel de quiosco a **comparador editorial**. No se tira el diseno actual: se le
quita el ruido, se le mete una segunda tinta con significado y se le pone delante lo
unico que la gente viene a ver, que es la tabla.

Todo lo medido aqui esta tomado del dev server (`preview_start` → `suplementos`,
puerto 4322) el 2026-09-07, a 1440x950 y a 375x812.

---

## 1. Diagnostico, con numeros

| Sintoma | Medida real |
|---|---|
| La portada es una lista infinita | 15.805 px de alto. **13.070 px (83 %) son un solo bloque**: "Lo mejor de cada categoria", 50 fichas seguidas. |
| En una categoria la tabla empieza tardisimo | En escritorio los primeros **1.150 px** son antetitulo + H1 de 3 lineas + respuesta corta + 2 parrafos + H2 + banda de 3 cifras. La primera fila de datos cae fuera de la primera pantalla. |
| Los filtros ocupan mas que los datos | **318 px** de controles en escritorio, **448 px en movil**, y el segmentado de "verificacion minima" se sale por la derecha (`4 V...` cortado). |
| La cola de enlaces SEO pesa mas que la tabla | "Preguntas mas concretas" (93 enlaces) + "Otras comparativas" (49) = **142 enlaces, 3.981 px en escritorio y 10.232 px en movil**, sobre una pagina de 18.379 px. El 64 % del movil es cola. |
| Cada fila lleva 4 cosas compitiendo | nombre, marca, `4.5★ (56)`, `· 1/1 requisitos`, sello `MEJOR CALIDAD-PRECIO VERIFICADA`, `+ COMPARAR`, `+ MI LISTA`. Fila de **89 px** en escritorio, **169 px** en movil. |
| El fondo fotografico pelea con el texto | `body` lleva `linear-gradient(velo) , url(fondo-claro.png) cover fixed`. Los botes se ven **detras de las etiquetas de los filtros y de la tabla**. Ademas `background-attachment: fixed` a pantalla completa es jank de scroll garantizado en movil. |
| La barra de navegacion no cabe | 7 entradas + tema + cuenta. A 1440 px ya reparte a dos lineas ("QUE / FUNCIONA", "QUIENES / SOMOS", "MI / LISTA"). |
| Una sola tinta para tres significados distintos | El naranja hace de precio, de accion, de destacado y de nivel de alarma a la vez. La verificacion (lo que diferencia a esta web) se cuenta con **cuatro colores sin relacion entre si**: verde, azul, mostaza y gris. |
| Huecos vacios | Las imagenes que no cargan dejan una caja en blanco con el pie "IMAGEN DE ZUMUB" (visto en `/producto/firm-foods-creatina-2-kg-2x-1-kg-zumub/`). |

Lo que **si** funciona y no se toca: la tipografia (Big Shoulders + Archivo + IBM Plex
Mono), el papel/tinta, los filetes de 2-3 px, el `border-radius: 0`, el tema oscuro y
el hecho de que todo salga de tokens en `global.css`.

---

## 2. Direccion: que se copia de los comparadores buenos

Referencias: Wirecutter, Which?, RTINGS, Consumer Reports, Idealo, Skyscanner.
Lo que todos tienen en comun y esta web no:

1. **La tabla manda.** El titular es una linea, no tres. Debajo, datos.
2. **Los filtros son una barra, no un formulario.** Una fila de controles compactos que
   se queda pegada al hacer scroll. Nunca un bloque etiquetado de 450 px.
3. **Densidad tranquila.** Filas bajas, mucha regla fina, poco color. El color aparece
   solo donde hay que decidir.
4. **Una accion por fila.** El resto se revela al pasar por encima o al abrir la ficha.
5. **Dos tintas maximo.** Una para el dinero, otra para la confianza.
6. **La cola de enlaces esta plegada.** Sigue en el HTML (vale para SEO), no en la cara.

La estetica "Rotativa" no se abandona: se aplica **al contenido en vez de al cromo**.
El cartel se queda para el H1 y las cifras; los rotulos en versales mono bajan de tono
y de tamano; el fondo fotografico deja de ser fondo de pagina.

---

## 3. La segunda tinta: azul de imprenta

Ya esta en la paleta, escondida como `--n3`. Se asciende a **tinta con papel propio**:

> **Naranja = el dinero.** Precio, ganador de categoria, boton de ir a la tienda.
> **Azul = la confianza.** Verificacion, analisis, fuente citada, metodologia.

Eso da a la web su argumento de venta en color, no en prosa. Y justifica la segunda
tinta dentro de la propia metafora: una rotativa a dos tintas.

```css
:root {
  --prueba:       #1f5c8c;  /* 6,04:1 sobre papel — grafismo y texto */
  --prueba-fuerte:#17456d;  /* 8,50:1 — texto pequeno sobre tinte */
  --prueba-tinte: #dde6ee;  /* relleno de sello y de cabecera de tabla */
  --prueba-sobre: #ffffff;  /* 7,08:1 sobre --prueba */
}
:root[data-tema="oscuro"] {
  --prueba:       #6fa8d8;  /* 7,36:1 sobre tinta */
  --prueba-fuerte:#8ec0e8;
  --prueba-tinte: #16303f;  /* 7,10:1 con --prueba-fuerte encima */
  --prueba-sobre: #141210;
}
```

**La escala de verificacion pasa a ser una sola familia**, que es lo que hoy no es:

| Nivel | Hoy | Propuesta |
|---|---|---|
| 4 verificado | verde `#0e6b4b` | azul solido `--prueba` con texto `--prueba-sobre` |
| 3 con analisis | azul `#1f5c8c` | tinte `--prueba-tinte` + texto `--prueba-fuerte` |
| 2 declarado | mostaza `#8a5c0a` | contorno azul sobre papel |
| 1 sin certificar | gris `#6b6558` | gris, sin caja |

Se lee de un vistazo como una escala (mas azul = mas comprobado) en vez de como cuatro
etiquetas de colores distintos. El verde y la mostaza desaparecen de la pagina: dos
colores menos de ruido.

El naranja se queda **solo** en: la cifra de precio unitario, el sello del numero 1, el
boton de tienda y el enlace activo. Regla dura: **cinco apariciones por pantalla**, que
es la que ya escribio el CSS actual y hoy no se cumple.

---

## 4. Fases

Orden por relacion ruido-quitado / riesgo. Cada fase es entregable por si sola.

### F1 — Quitar el fondo fotografico (1 fichero, el mayor cambio visual)

- **Que**: `body` deja de llevar la foto a pantalla completa. El papel vuelve a ser
  papel liso con el grano que ya existe (`body::before`). La foto se recupera **solo en
  la portada**, recortada a la banda del titular (`section.portada`), donde si aporta.
- **Por que**: es la fuente numero uno de "ruido". Ademas quita el
  `background-attachment: fixed` de todas las paginas, que es scroll jank en movil.
- **Fichero**: `web/src/estilos/global.css` §2 (`body`) y §9 (portada).
- **Hecho cuando**: ninguna tabla ni ningun formulario tiene una imagen detras;
  Lighthouse movil sube en CLS/scroll.

### F2 — Cabecera y navegacion

- **Que**:
  - Las 7 entradas bajan a **4**: `Categorias`, `Guias`, `Comparar`, `Metodologia`.
    "Que funciona" entra como grupo dentro de Guias; "Quienes somos" baja al pie;
    "Mi lista" pasa a icono junto al de cuenta (como el carrito de una tienda).
  - **Buscador siempre visible en la cabecera** a partir de 78rem, no solo en la
    portada. Es la navegacion real de una web de 50 categorias.
  - En movil: cabecera de 52 px con hamburguesa, marca y buscador; el resto dentro del
    panel, que ya funciona bien.
  - Migas de pan a `--tinta-3` y sin versales, hoy compiten con el antetitulo.
- **Ficheros**: `web/src/layouts/Base.astro`, `global.css` §5 y §15c.
- **Hecho cuando**: la barra cabe en una sola linea desde 1024 px; llegar a cualquier
  categoria son 2 clics o 1 busqueda desde cualquier pagina.

### F3 — La segunda tinta

- **Que**: los tokens de §3 de este plan + reescritura de `.nivel n1..n4` y de los
  sellos. Quitar el verde y la mostaza. Auditar donde aparece `--senal` y dejarlo en
  las cuatro funciones autorizadas.
- **Ficheros**: `global.css` §1 (tokens) y §10 (niveles, sellos, barras).
- **Hecho cuando**: `grep` de `--senal` en `global.css` no lo encuentra fuera de precio,
  sello, boton y activo; todos los pares de color pasan AA (ratios ya calculados arriba).

### F4 — La tabla: la pagina que de verdad importa

- **Cabecera de categoria a dieta**: antetitulo + H1 en **2 lineas maximo** (bajar el
  `clamp` del H1 en esta plantilla) + respuesta corta. Los dos parrafos de entradilla y
  la banda de 3 cifras se funden en **una linea de datos** bajo el H1
  (`253 productos · 17 tiendas · 8,95-293,27 €/kg · 36 con nivel 4`). Ahorro estimado:
  ~450 px antes de la tabla.
- **Filtros en barra**: de bloque etiquetado de 318/448 px a una fila de controles con
  el rotulo dentro del control (`placeholder` / `<option>` cabecera). El segmentado de
  verificacion pasa a `<select>` en movil (hoy se sale de la pantalla). La barra se
  queda **pegada al hacer scroll** con la cabecera de la tabla.
- **Fila mas baja y con una sola accion**: nombre + marca en una linea; `€/kg` y score a
  la derecha; la valoracion y `1/1 requisitos` bajan a la ficha. `+ COMPARAR` y
  `+ MI LISTA` se funden en **un boton `+`** que abre las dos opciones, o aparecen al
  hover en escritorio y en el swipe/ficha en movil. Objetivo: 89 → **~56 px** en
  escritorio, 169 → **~104 px** en movil.
- **Chips de filtro aplicado** encima de la tabla (`Zumub ✕`, `nivel 4 ✕`), que es lo
  que hace un comparador para que no te pierdas.
- **Ficheros**: `web/src/componentes/TablaProductos.astro`, `componentes/tabla.js`,
  `pages/[categoria].astro`, `global.css` §11, §12, §16, §26.
- **Hecho cuando**: a 1440x950 se ven **al menos 5 filas** en la primera pantalla; en
  375x812, **al menos 2**. Hoy: 0 y 0.

### F5 — Portada: de lista de 50 a portada de comparador

- **Que**: el bloque de 13.070 px se parte en tres:
  1. **Titular + buscador** (lo que ya hay, mas corto).
  2. **Las 8-10 categorias mas buscadas** como rejilla compacta con su ganador y su
     precio: eso es la portada de un comparador.
  3. **Las 50 por estante** (`porFamilia`, que ya existe) como indice de enlaces, no como
     50 fichas con foto y barra de precios.
- **Por que**: nadie recorre 50 fichas. Y las 50 siguen enlazadas, asi que el SEO no
  pierde nada.
- **Ficheros**: `web/src/pages/index.astro`, `global.css` §9, §18d, §18f.
- **Hecho cuando**: la portada baja de 15.805 px a **menos de 4.500 px** sin perder un
  solo enlace interno.

### F6 — Plegar la cola SEO y limpiar la ficha

- **Cola**: "Preguntas mas concretas" (93 enlaces) y "Otras comparativas" (49) pasan a
  `<details open={false}>` con un resumen que dice cuantas hay, y por dentro a rejilla
  de 3-4 columnas en vez de una fila por enlace. Los `<a>` siguen en el HTML servido
  (Astro es estatico, Google los ve igual). Ahorro: **~3.500 px escritorio, ~9.000 px
  movil**.
- **Ficha de producto**: la lista "Por que puntua asi" (7+ puntos numerados) se queda,
  pero los puntos que no aportan decision (`la ficha no publica la lista de
  ingredientes`) se agrupan bajo "lo que no consta". El hueco de imagen vacia deja de
  ser una caja en blanco: **marco con el glifo y el nombre de la tienda**, no un vacio.
- **Ficheros**: `pages/[categoria].astro`, `pages/producto/[slug].astro`,
  `global.css` §13, §30.
- **Hecho cuando**: la pagina de categoria en movil baja de 18.379 px a **menos de
  7.000 px**.

### F7 — Remates

- **Movimiento**: las 6 `.aparece` por pagina se quedan solo en la portada. En una
  tabla, el contenido que se desvanece al entrar retrasa la lectura del dato.
  Anadir `@media (prefers-reduced-motion: reduce)` si no esta.
- **Estado vacio y de carga** de la tabla filtrada con la misma voz de la web.
- **Foco y toque**: comprobar 44x44 px en los controles de movil (los `+` de fila
  actuales no llegan).
- **Impresion**: §17 ya existe; revisar que la segunda tinta no la rompa.

---

## 5. Lo que NO se toca

- El dataset, el scraper, el scoring y `exportar.py`. Esto es solo `web/src`.
- Ni un enlace interno se borra: todo lo que hoy esta enlazado, sigue enlazado.
- Las tres tipografias y el par papel/tinta. `assets.py` no se ejecuta.
- Los textos de metodologia, avisos legales y descargos.
- La estructura de clases: como en el rediseno del 27/08, se prefiere reescribir CSS a
  reescribir marcado. Solo F2, F4, F5 y F6 tocan `.astro`, y en lo minimo.

---

## 6. Como se verifica cada fase

```bash
cd web && npm run build && cd .. && python seo_check.py   # titulos/descripciones intactos
python tests.py                                            # 72 comprobaciones
cd web && node --test                                      # 39 de API, tabla y lista
```

Y a ojo, con el dev server en el puerto 4322, siempre las mismas cuatro pantallas:
`/` , `/creatina/` , `/producto/firm-foods-creatina-2-kg-2x-1-kg-zumub/` y `/guias/`,
en 1440x950 y en 375x812, en tema claro y oscuro.

Metrica de cabecera de cada fase: **altura del documento** y **filas visibles en la
primera pantalla**. Son dos numeros y no opiniones.

| Pagina | Hoy (escritorio) | Hoy (movil) | Objetivo movil |
|---|---|---|---|
| `/` | 15.805 px | — | < 6.000 px |
| `/creatina/` | ~9.900 px | 18.379 px | < 7.000 px |
| Filas en la 1a pantalla | 0 | 0 | 5 / 2 |

---

## 7. Resultado medido (2026-09-07)

Mismas cuatro pantallas, mismo metodo, despues de F1-F5 y media F6:

| Medida | Antes | Ahora | |
|---|---|---|---|
| `/` | 15.805 px | **6.162 px** | −61 % |
| `/creatina/` escritorio | 9.464 px | **4.648 px** | −51 % |
| `/creatina/` movil (390 px) | 18.379 px | **7.332 px** | −60 % |
| Fila de tabla, escritorio | 89 px | **70 px** | |
| Ficha de producto, movil | 169 px | **115 px** | |
| Mandos antes de la 1a fila | 318 / 448 px | **~130 / ~200 px** | |
| Filas visibles en la 1a pantalla (1440x950) | 0 | **3** | |
| Enlaces internos perdidos | — | **0** | 142 en categoria, 191 en portada |

Las tres filas en la primera pantalla se quedan por debajo de las cinco del objetivo, y
es a proposito: llegar a cinco pedia recortar la respuesta corta, que es justo el bloque
que leen Google y los modelos. Se prefirio 3 filas con la respuesta entera que 5 sin ella.

### Lo que se hizo, fase por fase

- **F1**: `body` deja de llevar la foto a pantalla completa (y con ella el
  `background-attachment: fixed`). La foto pasa a `.portada::before`, a sangre y con
  mascara, y se apaga en el papel antes del buscador.
- **F2**: menu de 7 pestanas a 4 (`Categorias`, `Guias`, `Metodologia`, `Comparar`);
  "Que funciona" entra como tres grupos dentro de la lamina de Guias; "Quienes somos" y
  "Mi lista" se quedan solo en el panel de movil (`.solo-panel`) y "Mi lista" gana icono
  al lado del de cuenta. **Buscador permanente en la cabecera** desde 62rem
  (`client:idle`, y no se pinta en la portada para no duplicar el atajo "/").
- **F3**: segunda tinta `--prueba` (azul de imprenta) con sus cuatro tonos y sus
  contrastes comprobados; los cuatro niveles pasan a ser una escala de esa tinta (4 azul
  lleno, 3 sobre tinte, 2 azul agrisado, 1 gris) y desaparecen el verde y la mostaza; la
  horquilla de precio pasa a una sola tinta, la del dinero.
- **F4**: fuera el parrafo del reparto del score (lo repetia la nota de debajo de la
  tabla); H1 de categoria a dos lineas; **titulo y cifras en la misma linea**; rotulos de
  filtro dentro del control (`.solo-lector` + placeholder); chips que ya no se salen de
  la pantalla; filas mas bajas y foto de 55 a 42 px.
- **F5**: la portada ensena las 10 categorias mas surtidas en la tabla ponderable y las
  otras 40 en un indice de una linea por categoria. Al navegador viajan 10 frentes de
  Pareto en vez de 50.
- **F6 (mitad)**: las dos colas de enlaces internos van en `<details>` cerrados con su
  recuento. Los 142 `<a>` siguen en el HTML servido.

- **Las cajas de la portada** (pedido del dueno el mismo dia): las otras 40 categorias
  dejan de ser filas de una lista y pasan a ser piezas con filete grueso arriba, borde
  fino, su precio de salida en la tinta del dinero y su recuento al pie. En movil van a
  dos columnas forzadas: a una columna eran 5.900 px y se cargaban la reduccion de F5.
- **Aire en la tabla** (mismo pedido): `tbody td` de `.6rem` a `.75rem`, la fila de 70 a
  74 px, y lo mismo en la ficha de movil.
- **F6, ficha de producto**: la foto que la tienda ha borrado ya no esconde la figura
  entera (la columna saltaba de sitio al fallar la carga): queda el marco con la trama
  de una plancha sin tinta y un pie que dice lo que ha pasado. Las dos leyendas van en
  el HTML y las cambia el CSS.
- **F7**: la entrada escalonada `.aparece` se queda SOLO en la portada (en una categoria
  eran seis bloques desvaneciendose encima de la tabla); el estado vacio de la tabla pasa
  de una linea gris a un bloque con la voz de la web, con el recuento y el boton de
  quitar los filtros dentro (`tabla.js` cambia `limpiar.contains` por
  `closest('[data-limpiar]')` para atender los dos botones); los chips y los resumenes de
  las colas suben a 44 px de toque; y la hoja de impresion aprende la segunda tinta (el
  nivel 4 se imprime en recuadro negro sobre blanco, no en un bloque azul lleno), esconde
  la mancha fotografica de la portada y los botones que en papel no se pueden pulsar.

### Lo unico que queda, y por que no se ha hecho

Agrupar bajo "lo que no consta" los puntos del desglose de la ficha ("la ficha no publica
la lista de ingredientes", "sin formato en gramos no se puede calcular el coste por
dosis"...).

`p.desglose` es una **lista plana de frases en castellano** que escribe `scoring/motor.py`
y que el dataset transporta tal cual: no hay ningun campo que diga cual es una falta de
dato y cual es un motivo de nota. Separarlas desde la plantilla obliga a reconocer la
prosa por patron (`^sin `, `no publica`, `no dice`...), y hay al menos cinco redacciones
distintas repartidas entre `motor.py` y `verificar.py`: el dia que alguien reescriba una,
el agrupado deja de funcionar sin que falle ni un test.

Hacerlo bien es etiquetar cada linea en el origen (`{"txt": ..., "tipo": "falta"}`), y eso
toca `scoring/motor.py`, `exportar.py`, el esquema del dataset y `tests.py`. Es una
tarea de capa de datos, no de capa visual, y la seccion 5 de este plan declara esas cuatro
piezas intocables. **Decision del dueno**: o se abre como tarea aparte, o se deja como
esta.
