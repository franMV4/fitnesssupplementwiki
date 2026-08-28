# Plan: respuesta a la auditoria SEO (2026-08-24)

Los cinco puntos de la auditoria, con lo que se hace y lo que **no** se hace y por que.
Regla del proyecto que sigue mandando: **el copy se genera desde el dataset**
(`web/src/datos/seo.js`), no se escribe a mano. Una landing nueva que hubiera que
reescribir a mano cada vez que cambia un precio no se crea.

## 1. H1 con palabra clave directa

- **Portada**: el H1 pasa a `Comparador de suplementos deportivos: precio por kilo y
  certificacion verificada`. La frase de marca ("Lo que cuesta de verdad...") no se tira:
  baja a antetitulo, donde hace de gancho sin robarle el H1 a la consulta.
- **Categoria**: el H1 pasa de la consulta suelta (`Que creatina comprar`) a
  `La mejor creatina de 2026: comparativa por precio por kilo y certificacion`, generado
  desde `cat.mejor` + el año de `datos.generado` + la unidad de la categoria. La consulta
  original sigue en la pagina como pregunta del FAQ, asi que no se pierde.

## 2. Landings de intencion de compra

Dos rutas nuevas, ambas **generadas** desde `web/src/datos/landings.js`. Cero copy a mano,
cero paginas vacias: una landing solo existe si el dataset tiene productos suficientes.

- `/comparativa/<a>-vs-<b>-<categoria>` — **29 paginas** (`hsn-vs-myprotein-proteina-whey`).
  Se genera el par solo si **las dos** tiendas tienen >= 6 productos en esa categoria.
  Contenido: quien gana por score, quien por precio, mediana de cada tienda, tabla con
  los productos de las dos y FAQ con las tres preguntas del comparador.
- `/mejores/<slug>` — **35 paginas** de tres tipos, segun lo que hay en los datos:
  - por sello real: `creatina-creapure`, `omega3-ifos` (solo donde existe la
    certificacion; no se inventan facetas);
  - por tienda: `mejor-proteina-whey-de-myprotein` (>= 6 productos);
  - por precio: `<categoria>-barata` = por debajo de la mediana por kg/capsula.

**No se crea** `/mejores/proteina-aislada-sin-lactosa` que pedia la auditoria: el dataset
no tiene el dato de lactosa. Una landing que filtra por un campo que no existe es una
pagina que miente. Si se quiere, se anade el campo en el scraper y la landing sale sola.

## 3. E-E-A-T (YMYL)

- `/quienes-somos`: quien esta detras, con nombre y correo, que se sabe hacer y **que no**.
  Enlazada desde la cabecera, el pie y la metodologia.
- JSON-LD: nodo `Person` (`#autor`) como `founder` de la Organization, y la Organization
  pasa a ser el `author` de las resenas, con `foundingDate` y `knowsAbout`.
- **No se firma con un dietista-nutricionista que no existe.** La linea E-E-A-T que si es
  cierta y si es defendible: esta web no da consejo de salud, publica **hechos
  verificables** (precio por kilo, sello comprobado en la fuente que lo emite) y ensena el
  metodo entero. La pagina lo dice literalmente, incluido que el autor no es sanitario.
  Un titulo inventado es lo unico que puede tirar abajo un dominio YMYL entero.

## 4. UX y conversion

- **Tres destacados** arriba de cada tabla de categoria: Mejor calidad-precio (score),
  Mas barato (por kg/capsula) y Mejor certificado (nivel + score). Componente
  `Destacados.astro`, reusando `.bloque` del sistema Boletin.
- **Filtros de la tabla** (isla React que ya existia):
  - el filtro de precio pasa de `precio_eur` (envase) a `precio_referencia` (€/kg o
    €/capsula), que es lo que de verdad busca el lector ("menos de 20 €/kg");
  - chip nuevo **Solo Creapure / Solo IFOS**, que solo aparece si esa categoria tiene
    productos con ese sello;
  - los chips de nivel ya existian ("4 verificado").

## 5. Datos estructurados

Lo que se anade al `Product` de cada ficha: `sku`, `itemCondition`, `priceValidUntil` en
la oferta, `name` en la resena y `AggregateOffer` en la categoria.

**No se anade `aggregateRating`**, y no es un olvido: es el invariante del proyecto y la
guia de Google. `aggregateRating` significa "media de opiniones de usuarios" y aqui no hay
usuarios opinando. Publicarlo es marcado enganoso, y la penalizacion manual por marcado se
lleva por delante el dominio entero, no la ficha. Las estrellas del resultado de busqueda
las da igual el `Review` editorial (con autor, fecha y `reviewRating` 0-100) que la ficha
**ya publica** desde la fase de SEO: ese es el camino legitimo al mismo snippet.

## Resultado

513 paginas construidas (antes 440): +64 landings, +1 `/quienes-somos`. `npm run build`,
`python seo_check.py` y `python tests.py` en verde.

Dos cosas que aparecieron al verificar y se arreglaron por el camino:

- **Bug previo en "Donde comprarlo".** Emparejaba "el mismo producto en otras tiendas" con
  solo marca + formato + forma, sin mirar la categoria ni la tienda: en la ficha de la
  creatina de 1 kg de HSN Raw Series salian la glutamina Kyowa y la Creatina Excell
  Creapure de **la misma tienda**, con precios de 14 a 53 EUR, como si fueran el mismo
  bote. Se veia en la tabla y se habria publicado como `AggregateOffer`. Ahora exige
  ademas misma categoria, mismas capsulas y **otra tienda**. Con los datos de hoy no queda
  ninguna coincidencia: las cinco tiendas venden marca propia.
- **Copy que afirmaba de mas.** El primer texto de `/mejores/creatina-creapure` decia que
  todos los de esa tabla eran nivel 4. Son 14 de 16: dos declaran Creapure en la ficha
  pero no lo llevan en el nombre, asi que se quedan en nivel 2. Ahora el reparto se
  cuenta, no se afirma.

## Verificacion

`cd web && npm run build` + `python seo_check.py` + `python tests.py`. El `seo_check` ya
comprueba titulo, descripcion, canonical, un solo H1, JSON-LD que parsea, enlaces internos
que no rompen y sitemap completo; las paginas nuevas entran en esa red sin tocarlo.
