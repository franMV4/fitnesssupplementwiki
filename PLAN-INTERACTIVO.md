# Plan: dar cosas que hacer al que entra

## Estado: las once cosas estan hechas (04/09/2026)

Las tres fases se construyeron enteras, en este orden. Lo que hay que hacer a mano antes
de que funcionen en produccion:

1. Volver a aplicar el esquema, que tiene tres tablas nuevas (`votos`, `preguntas`,
   `alertas`). Es idempotente:
   `npx wrangler d1 execute suplementos --remote --file=schema.sql`
2. Poner el secreto `CRON_CLAVE` en Cloudflare **y** en los secretos de GitHub Actions,
   con el mismo valor (PUBLICAR.md, paso 9.8). Sin el, los avisos de precio no salen.

| # | Que | Donde |
|---|-----|-------|
| 1 | Favoritos ("+ mi lista" en cada fila y en la ficha) | `util.js`, `tabla.js`, `TablaProductos.astro` |
| 2 | Calculadora de dosis: dias que dura, EUR/mes, cuando recomprar | `componentes/Dosis.jsx` |
| 3 | Gasto mensual de todo lo que tomas | `componentes/MiLista.jsx`, `/mis-suplementos` |
| 4 | Vistos recientemente, al pie de la ficha | `componentes/Vistos.jsx` |
| 5 | Nota de los lectores en las tablas, y orden por ella | `GET /api/valoraciones`, `tabla.js` |
| 6 | Ordenar y filtrar las opiniones | `componentes/Resenas.jsx` |
| 7 | "Me ha sido util" | tabla `votos`, `POST /api/util` |
| 8 | Perfil publico del lector | `GET /api/lector`, `/lector?id=` |
| 9 | Preguntas y respuestas por producto | tabla `preguntas`, `componentes/Preguntas.jsx` |
| 10 | Avisos de precio por correo | tabla `alertas`, `POST /api/alertas/revisar`, `.github/workflows/alertas.yml` |
| 11 | Compartir la lista por enlace | `aEnlace`/`deEnlace` en `util.js` |

Comprobado: 101 asserts de Python, 39 de Node (`cd web && node --test`) y el build de las
5.351 paginas. La API se probo entera contra la D1 local: votar y desvotar, votarse a uno
mismo (rechazado), responder a una respuesta (rechazado), borrar lo de otro (rechazado), y
el repaso de precios avisando una sola vez y rearmandose cuando el precio vuelve a subir.

Lo que sigue debajo es el plan tal y como se escribio, con el porque de cada decision.

Hoy un lector solo puede registrarse y dejar una reseña. Esto es la lista de lo que
puede hacer además, ordenada por lo mismo de siempre: lo que más cambia la web por
menos código.

## La regla que ordena la lista

Todo lo que necesita una multitud (votos, hilos, preguntas, rankings sociales) nace
vacío. Un "0 respuestas" repetido en 426 fichas se ve peor que no tener la sección.
Lo que funciona con UN visitante son las herramientas personales. Ese es el orden:
primero lo que sirve estando solo, después lo que necesita gente.

---

## Fase 1 — Sin base de datos, sin cuenta, sin infra

Todo en el navegador (`localStorage`), como ya hace la selección del comparador
(`src/datos/util.js`) y el tema oscuro (`layouts/Base.astro`). Cero filas en D1, cero
endpoints, cero moderación.

**1. Favoritos / "Mi estantería"** — corazón en cada fila de tabla y en la ficha, y una
página `/mis-suplementos` con lo guardado.
Reusa: `guardarSeleccion`/`leerSeleccion` de `util.js` (misma mecánica, otra clave) y el
render de `Comparador.jsx`.
Toca: `util.js`, `tabla.js`, `producto/[slug].astro`, una página nueva. ~60 líneas.

**2. Calculadora de duración y coste real** — en la ficha: "tomo ___ g/día" → cuántos días
dura el envase, €/mes a esa dosis, y fecha aproximada de recompra.
Es la pregunta que de verdad se hace el que compra, y sale entera de datos que ya están en
la página (`precio_envase_eur`, `servicios_por_envase`, dosis). Cálculo puro, sin red.
Toca: un `.jsx` nuevo de ~50 líneas + una línea en la ficha.

**3. Coste mensual del stack** — la suma de la fase 1.1 con la dosis de la 1.2: "tus 5
suplementos te cuestan 47 €/mes". Es lo que hace volver a la página guardada.
Toca: la página `/mis-suplementos`. ~20 líneas encima de lo anterior.

**4. Vistos recientemente** — franja al pie con las últimas 8 fichas visitadas.
~15 líneas, y quita la sensación de callejón sin salida de una ficha.

> Fase 1 entera: una tarde. Sin tocar D1, sin riesgo de spam, funciona sin registrarse
> (que es justo el 95% de las visitas).

---

## Fase 2 — Reusando las tablas que ya existen

`usuarios` y `resenas` ya están. Aquí no hay tablas nuevas salvo una de dos columnas.

**5. Valoración de lectores visible fuera de la ficha** — hoy la media solo se ve dentro
de `Resenas.jsx`, después de cargar. Un endpoint `/api/valoraciones` que devuelva
`{slug: {media, total}}` de todos los productos con reseñas (un `GROUP BY`, respuesta
cacheable) permite pintar las estrellas en las tablas y ordenar por ellas.
Toca: 1 ruta en `functions/api/[[ruta]].js` (~10 líneas) + `tabla.js`.
Ojo: mantener la separación que ya está documentada — esto no entra en el JSON-LD.

**6. Ordenar y filtrar reseñas** — por nota, por recientes, "solo con foto". Cliente puro
sobre lo que ya devuelve `listar()`.
Toca: `Resenas.jsx`. ~20 líneas.

**7. "Me ha sido útil"** — tabla `votos (usuario, resena)` con PK compuesta (misma idea que
el `UNIQUE (usuario, producto)` de `resenas`: un voto por persona), un `POST /api/util`,
y el recuento en el `SELECT` que ya existe.
Es lo que hace que una reseña buena suba y una de tres palabras baje, sin moderar nada.
Toca: `schema.sql` (+6 líneas), 1 ruta, `Resenas.jsx`.

**8. Perfil público de lector** `/u/[id]` — sus reseñas y su media. Una consulta y una
página; le da al que escribe una razón para escribir la segunda.
Toca: 1 ruta + 1 página. ~40 líneas.

---

## Fase 3 — Solo cuando haya gente escribiendo

Si las fases 1 y 2 no producen reseñas, ninguna de estas tres las va a producir tampoco.
Volver aquí cuando haya, digamos, 50 reseñas reales.

**9. Preguntas y respuestas por producto** — tabla `preguntas` + respuestas (una columna
`padre` nullable, no dos tablas). Es el mejor contenido generado por usuarios después de
la reseña, y además posiciona. Necesita moderación: sin nadie leyendo el buzón, es spam.

**10. Alertas de precio por email** — "avísame si baja de 25 €". La única de toda la lista
que necesita infra nueva: una tarea programada (Cron Trigger de Cloudflare) tras el scraper
y un proveedor de email. Es la de más valor real para el usuario y la más cara de montar.
Estimación honesta: un día entero, y luego hay que vigilarla.

**11. Stacks compartibles** — una URL que abre "mi estantería" de la fase 1 en el navegador
de otro (los slugs codificados en el enlace, sin guardar nada en servidor). Compartir sin
base de datos.

---

## Lo que no haría

- **Foro o comentarios generales.** Moderación diaria a cambio de tres mensajes al mes.
- **Gamificación** (insignias, karma, niveles). Mecánica para retener una comunidad que
  todavía no existe; se añade cuando sobre gente, no para conseguirla.
- **Chat / asistente IA.** Coste por visita y una respuesta menos fiable que la tabla que
  ya está debajo.
- **Seguir usuarios, feed de actividad, notificaciones push.** Tres sistemas para una web
  que se consulta, no se habita.

---

## Recomendación

Fase 1 completa + punto 5. Es lo que más cambia la sensación de la web (deja de ser una
tabla que se lee y pasa a ser algo que se usa) por el menor código, sin tocar la base de
datos y sin abrir un frente de moderación.

Después, el 7 y el 8 si empiezan a llegar reseñas. El 10 solo cuando alguien lo pida.
