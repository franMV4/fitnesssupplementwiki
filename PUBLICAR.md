# Publicar FitnessSupplementWiki en Cloudflare Pages, desde cero

Guía para hacerlo sin saber nada de despliegues. Sigue los pasos en orden. Cada uno dice
**qué vas a ver** cuando salga bien, para que sepas si puedes seguir.

Tiempo: unos 40 minutos la primera vez. Después, actualizar son 2 minutos de trabajo tuyo
(el ordenador tarda media hora, pero sin ti delante).

**Qué se publica** (25/08/2026): **30 categorías** (los suplementos más vendidos),
**2.715 productos** de **8 tiendas** (HSN, Myprotein, Nutritienda, Life Pro, Prozis,
Amazon, Zumub; MASmusculo bloquea al bot y se documenta), **30 guías de evidencia** y
**~3.010 páginas**. Todo son ficheros estáticos: no hay servidor ni base de datos que
mantener encendida.

**Coste:** Cloudflare Pages es gratis para lo que hace esta web (tráfico ilimitado, sin
tarjeta). Lo único que se paga es el dominio: un `.com` ronda los 10-12 € al año, y
Cloudflare lo vende a precio de coste, sin margen ni renovación inflada.

---

## ⚠️ Antes de nada: no subas tu carpeta de usuario a ningún sitio

Muchas guías de Cloudflare Pages empiezan por "conecta tu repositorio de GitHub". **En tu
caso no hagas eso todavía**, porque el repositorio de git que contiene este proyecto no es
el proyecto: es toda tu carpeta de usuario `C:\Users\f.munoz.THERMOLYMPIC`. Ahí dentro
están tus claves SSH (`.ssh`), tu llavero GPG (`.gnupg`) y tus credenciales de
herramientas. Subir eso a GitHub sería regalar tus claves privadas.

Los pasos 1 a 7 usan **subida directa**, que no necesita GitHub para nada: sirven para
tener la web publicada hoy y comprobar que todo funciona. El
[paso 8](#paso-8--que-se-actualice-sola-todos-los-días) es el que sube el proyecto a GitHub
para que el scraper se lance solo cada día, y explica cómo hacerlo **sin** subir tu carpeta
de usuario.

**Hazlos en orden.** Automatizar antes de haber visto la web funcionando es depurar dos
cosas a la vez.

---

## Paso 1 · Generar la web en tu ordenador

Abre PowerShell y ve a la carpeta del proyecto:

```powershell
cd C:\Users\f.munoz.THERMOLYMPIC\Desktop\Fran\Proyects\FitnessSupplementWiki
```

Recoge los precios de las tiendas y recalcula el ranking. **Tarda entre 20 y 30 minutos**
(30 categorías por 8 tiendas, con esperas entre peticiones para no machacar a nadie) y va
imprimiendo lo que hace. Si lo lanzas dos veces el mismo día, la segunda tarda 5 minutos:
la caché del scraper dura 6 horas.

```powershell
python actualizar.py
```

> **Qué tienes que ver:** un bloque por categoría con el reparto por tienda, y al final
> `NNNN productos exportados a la web`. Es **normal** que aparezcan avisos de
> `BLOQUEADA masmusculo`, algún `429` de Zumub o de Prozis y algún `pasada parcial`: el
> scraper lo documenta y sigue, y una pasada parcial **no borra** nada de la base de datos.
> Lo que no es normal es que una categoría entera salga a cero (mira `AGENTS.md`).

Comprueba que no se ha roto nada:

```powershell
python tests.py
```

> **Qué tienes que ver:** `57 comprobaciones pasan`. Si algo falla, **para aquí** y no
> publiques: los tests protegen cosas como que la afiliación no mueva el ranking o que no
> se mezclen euros por kilo con euros por cápsula en la misma tabla.

Construye las páginas:

```powershell
cd web ; npm install ; npm run build ; cd ..
```
Para probar en local
npm run dev


> **Qué tienes que ver:** `3011 page(s) built` (el número sube cuando entran productos
> nuevos), en algo menos de un minuto. El `npm install` solo hace falta la primera vez o si
> cambias de ordenador; dejarlo puesto no molesta.

Y el último control, el de SEO:

```powershell
python seo_check.py
```

> **Qué tienes que ver:** `3011 paginas comprobadas.` y `SEO OK.` Si sale algún `FALLO`,
> arréglalo antes de subir: son cosas como un título duplicado o un enlace roto, y cuestan
> mucho más de arreglar cuando Google ya las ha indexado. El fallo que más sale al ampliar
> catálogo es **título repetido**, y casi siempre son dos anuncios de Amazon del mismo bote:
> está explicado en la tabla de problemas del final.

Ya tienes la web entera dentro de la carpeta **`web\dist`**. Eso es lo que se sube:
**3.066 ficheros, 117 MB**. No hay servidor, ni base de datos, ni nada que mantener
encendido.

> Con este tamaño, **arrastrar la carpeta al navegador va lento y a veces se corta**. La
> primera vez hazlo así igualmente para ver la web publicada (paso 3); a partir de ahí,
> súbela con un comando (`wrangler`, en el paso 6). Es la diferencia entre diez minutos
> mirando una barra de progreso y veinte segundos.

---

## Paso 2 · Crear la cuenta de Cloudflare

1. Entra en <https://dash.cloudflare.com/sign-up>.
2. Correo y contraseña. Usa el mismo correo que aparece en el aviso legal de la web
   (`franmunozvillanova@gmail.com`) para no acabar con la cuenta a nombre de un correo que
   no miras.
3. Confirma el correo que te envían.
4. Activa la verificación en dos pasos cuando te lo ofrezca. Esta cuenta va a controlar tu
   dominio: si alguien entra en ella, se lleva la web.

No hace falta meter tarjeta para el plan gratuito. Solo la pedirán si compras el dominio
ahí (paso 4).

---

## Paso 3 · Primer despliegue: subir la carpeta a mano

Esto pone la web en internet en 5 minutos, en una dirección provisional de Cloudflare, para
comprobar que todo funciona **antes** de tocar el dominio.

1. En el panel de Cloudflare, en el menú de la izquierda, busca la sección de
   **Workers y Pages** (Cloudflare le cambia el nombre cada pocos meses: puede poner
   "Workers & Pages", "Compute" o "Compute (Workers)"; es la que lleva a los proyectos de
   Pages).

2. Botón **Create** → pestaña **Pages** → **Upload assets** (subir archivos).
   - Si solo ves opciones de Workers, busca dentro un enlace tipo *"Pages"* o
     *"Deploy a static site"*. Es la misma pantalla.

3. **Project name:** escribe `fitnesssupplementwiki`.
   Este nombre decide tu dirección provisional: `fitnesssupplementwiki.pages.dev`.
   No se puede cambiar después sin crear otro proyecto, así que escríbelo bien.

4. Te pedirá los ficheros. Abre el explorador de Windows en
   `...\FitnessSupplementWiki\web\` y **arrastra la carpeta `dist` entera** al recuadro.
   - Arrastra la carpeta `dist`, no su contenido suelto, y **no** la carpeta `web`.
   - Tampoco subas un `.zip`: quiere la carpeta.

5. **Deploy site**.

> **Qué tienes que ver:** una barra de progreso subiendo **3.066 ficheros** (tarda, no la
> cierres) y después *"Success! Your project is deployed"* con un enlace a
> `https://fitnesssupplementwiki.pages.dev`.

Ábrelo. Deberías ver la portada, con el logo de las cuatro barras en la pestaña del
navegador.

### Comprueba estas diez direcciones

Cambia `fitnesssupplementwiki.pages.dev` por tu dirección si pusiste otro nombre:

| Dirección | Qué tienes que ver |
|---|---|
| `/` | La portada, con la tabla de "lo mejor de cada categoría" |
| `/creatina` | El titular **"Que creatina comprar"** y la tabla con filtros |
| `/proteina-whey` | Igual, con más de 200 productos. Ojo al guion, no guion bajo |
| `/magnesio` | Una de las 21 categorías nuevas: aviso de que su fórmula no se puntúa |
| `/guia/melatonina` | Una guía de evidencia, con sus fuentes y la fecha de revisión |
| `/legal` | El aviso legal con tu nombre y tu correo |
| `/robots.txt` | Texto plano que empieza por `User-agent: *` |
| `/sitemap.xml` | Un XML larguísimo con todas las direcciones |
| `/llms.txt` | El resumen en texto para las IA |
| `/datos/creatina.json` | El ranking en JSON |

Prueba también a **pegar el enlace en WhatsApp o en X**: tiene que salir la tarjeta con el
logo, el nombre y la frase de debajo. Si sale gris, es que la imagen `og.png` no subió.

Si algo de esto da error 404, casi siempre es que subiste la carpeta equivocada. Repite el
paso 4 arrastrando `dist`.

---

## Paso 4 · El dominio: fitnesssupplementwiki.com

La dirección `.pages.dev` funciona, pero la web está preparada para
`fitnesssupplementwiki.com`: es lo que dicen sus etiquetas `canonical`, su sitemap y su
JSON-LD. **Hasta que el dominio no esté puesto, no la mandes a Google.**

### Opción A (recomendada): comprar el dominio en Cloudflare

Te ahorras toda la configuración de DNS, porque ya está donde tiene que estar.

1. En el panel, menú izquierdo → **Domain Registration** → **Register Domain**.
2. Busca `fitnesssupplementwiki.com`.
3. Si está libre, cómpralo (tarjeta, unos 10-12 € al año).
4. **Deja activada la renovación automática.** Un dominio que caduca se puede perder para
   siempre, y con él todo el posicionamiento que hayas construido.
5. Deja también activada la protección de privacidad del WHOIS, que Cloudflare pone gratis:
   evita que tu nombre y tu dirección aparezcan en las bases de datos públicas de dominios.

### Opción B: ya lo compraste en otro sitio (GoDaddy, Namecheap, IONOS…)

1. Panel → **Add a site** → escribe `fitnesssupplementwiki.com` → plan **Free**.
2. Cloudflare te dará **dos nameservers** (algo tipo `xxx.ns.cloudflare.com`).
3. Entra en el sitio donde compraste el dominio, busca *"nameservers"* o *"servidores de
   nombres"*, borra los que haya y pon esos dos.
4. Vuelve a Cloudflare y pulsa *"Check nameservers"*. Puede tardar de 10 minutos a 24 horas.

> **Qué tienes que ver:** el dominio en estado **Active** en tu panel de Cloudflare.

### Enchufar el dominio al sitio

Con el dominio ya en Cloudflare:

1. Menú izquierdo → **Workers y Pages** → tu proyecto `fitnesssupplementwiki`.
2. Pestaña **Custom domains** → **Set up a custom domain**.
3. Escribe `fitnesssupplementwiki.com` → **Continue** → **Activate domain**.
4. Repite con `www.fitnesssupplementwiki.com`. Cloudflare crea el registro solo y redirige
   una a otra: así nadie acaba en una versión "www" duplicada, que es un clásico que parte
   el posicionamiento en dos.

> **Qué tienes que ver:** los dos dominios en estado **Active** con un candado. El
> certificado HTTPS tarda entre 1 y 15 minutos en emitirse; hasta entonces puede salir un
> aviso de "no seguro". Es normal, espera.

Cuando `https://fitnesssupplementwiki.com` cargue la portada, ya está publicada.

---

## Paso 5 · Decirle a Google que existe

Una web nueva puede tardar semanas en aparecer sola. Esto lo acelera muchísimo y es
gratis.

1. Entra en <https://search.google.com/search-console>.

2. **Añadir propiedad** → columna **Prefijo de la URL** → pega
   `https://fitnesssupplementwiki.com` (con `https://` y sin barra al final).

3. Para verificar que la web es tuya te dará varios métodos. Con el dominio en Cloudflare,
   el cómodo es **Registro DNS**: Google te da una línea de texto, la pegas en Cloudflare
   (tu dominio → **DNS** → **Add record** → tipo **TXT**, nombre `@`, contenido lo que te
   dio Google) y vuelves a pulsar *Verificar*. Si te lías, dime que quieres la
   verificación por etiqueta HTML y te la dejo puesta en la web.

4. Ya dentro, menú izquierdo → **Sitemaps** → escribe `sitemap.xml` → **Enviar**.
5. Menú **Inspección de URLs** → pega `https://fitnesssupplementwiki.com/creatina` →
   **Solicitar indexación**. Haz lo mismo con dos o tres categorías más. No lo hagas con
   las 3.000 páginas: el sitemap ya se encarga.

> **Qué tienes que ver:** el sitemap en estado *"Correcto"* con unas **3.010 URLs**
> detectadas.
> Los datos de tráfico tardan 2-3 días en aparecer, y la indexación completa de las fichas
> puede llevar semanas. Es normal, no lo toques.

**Bing también importa** (es lo que hay detrás de las respuestas de ChatGPT cuando busca):
entra en <https://www.bing.com/webmasters>, y ahí puedes **importar directamente desde
Google Search Console** en dos clics. Hazlo, son 30 segundos.

---

## Paso 6 · Actualizar: el manual entero

Aquí está todo lo que se puede cambiar de esta web y qué hay que tocar en cada caso. Van de
lo más frecuente a lo más raro.

### 6.0 · La regla que ordena todo lo demás

**Los datos se recogen, el copy se genera y la evidencia se escribe a mano.** Son tres
cosas distintas y se actualizan en tres sitios distintos:

| Qué | Dónde vive | Quién lo escribe | Cada cuánto |
|---|---|---|---|
| Precios, formatos, marcas | Las tiendas → `data/suplementos.sqlite` | El scraper | Semanal |
| Títulos, respuestas, FAQ, rankings | Se generan desde el dataset | Nadie: `seo.js` | Solo |
| Dosis efectivas y guías | `data/dosis_referencia.json` y `web/src/datos/evidencia.js` | **Tú** | Cuando cambie la evidencia |

Si algo que sale en la web no está en esa tabla, es que se genera solo. **No lo edites en
el HTML**: se regenera entero en la siguiente construcción y perderías el cambio.

### 6.1 · Rutina semanal: refrescar precios y subir

Es el 95 % de las veces. Una web de precios de hace ocho meses no la cita nadie; con **una
vez por semana** vas sobrado.

```powershell
cd C:\Users\f.munoz.THERMOLYMPIC\Desktop\Fran\Proyects\FitnessSupplementWiki ; python actualizar.py ; python tests.py ; cd web ; npm run build ; cd .. ; python seo_check.py
```

Eso hace, en este orden: recoger precios de las 8 tiendas (20-30 min) → verificar
certificaciones → recalcular el ranking → volcar `dataset.json` → construir las ~3.000
páginas → validar el SEO.

**Si termina en `SEO OK.`, súbelo.** Con un comando (la primera vez te abrirá el navegador
para dar permiso):

```powershell
cd web; npx wrangler pages deploy; cd ..
```

> **Por qué `cd web`:** desde el paso 9 la web lleva una pequeña API (cuentas y
> reseñas) que vive en `web/functions/`. El comando tiene que ejecutarse dentro de
> `web` para que Wrangler lea `web/wrangler.toml` y suba **la web y la API**. Con el
> comando antiguo (`wrangler pages deploy web/dist`) se sube solo el sitio estático y
> las reseñas dejan de funcionar.

> **Qué tienes que ver:** `Success! Uploaded N files` y la dirección del despliegue.
> Wrangler solo sube los ficheros que han cambiado, así que la segunda vez tarda segundos.

O a mano, si prefieres: panel → **Workers y Pages** → tu proyecto → **Create new
deployment** → arrastrar `web\dist`. Con 3.066 ficheros esto va lento; el comando es mejor.

La fecha de recogida que sale en la portada, en cada tabla, en cada ficha y en `llms.txt`
se actualiza sola: sale de los datos, no está escrita a mano.

**Si termina en `FALLO`, no subas.** Mira la tabla de problemas del final: el fallo típico
al ampliar catálogo es un título repetido, y significa que dos páginas van a competir entre
ellas en Google.

### 6.2 · Añadir (o quitar) una categoría

Lee antes **`SEO-PRODUCTOS.md`**, que es donde están las reglas. El resumen:

1. **`categorias.py`**: una entrada nueva con `unidad` (kg o cápsula), `nombre`, `termino`,
   `mejor` (con su artículo: "la mejor creatina"), las `consultas` que quieres ganar,
   `filtro`, `excluye`, `activo` y `modo`.
   - `modo="simple"` = el bote **es** el activo (creatina, proteína). Necesita su dosis de
     referencia con fuente.
   - `modo="formula"` con `ingredientes=()` = **no se puntúa por dosis**, solo por precio y
     certificación. Es lo correcto para minerales y extractos: no hay una dosis efectiva
     citable para el magnesio o la ashwagandha, y la página lo dice en vez de inventarla.
   - La clave `"dosis"` en `consultas` **solo** si esa categoría tiene una dosis con DOI en
     `data/dosis_referencia.json`. `tests.py` falla si prometes responder "cuánto tomar" y
     no hay fuente detrás.
2. **Su URL en cada tienda** (`scraper/tiendas/*.py`). Puede ser una categoría ancha: el
   filtro de nombre separa lo que entra. Una tienda que no la venda, se salta sola.
3. **Su dosis de referencia** en `data/dosis_referencia.json`, si la tiene, **con cita**.
   Se carga sola en cada `python actualizar.py`.
4. **Su guía** en `web/src/datos/evidencia.js` (opcional pero recomendable): sin ella la
   categoría se publica igual, pero sin `/guia/<categoria>`.
5. `python actualizar.py` → `python tests.py` → `npm run build` → `python seo_check.py`.

La categoría entra sola en el menú, en el pie, en el buscador, en el sitemap, en `llms.txt`
y en `/datos/<slug>.json`. **No hay ninguna lista que actualizar a mano.**

> **Ojo con las mezclas.** Un "Calcio + Magnesio" no es un bote de magnesio: sale más barato
> por cápsula porque la mitad es otra cosa, y encabezaría la tabla **y la respuesta corta**
> sin serlo. Cada categoría las echa por nombre en su `excluye`. Cuando añadas una, mira
> quién queda primero: si es una mezcla, ajusta el `excluye` y vuelve a pasar el scraper de
> esa categoría (`python run_scraper.py --categoria <slug>`).

Para **quitar** una categoría, borra su entrada y vuelve a construir. Sus páginas
desaparecen; si ya estaban indexadas, deja una redirección en `web/public/_redirects`.

### 6.3 · Añadir una tienda

Un fichero nuevo en `scraper/tiendas/`, con una clase que herede de `Scraper`. Se descubre
sola: no hay que registrarla en ningún sitio. Lo único que hay que tocar aparte es
`web/src/datos/util.js` (`TIENDAS`, para que salga con su nombre bonito) y
`data/afiliados.json` si tiene programa de afiliados.

Antes de escribir nada, mira **cómo publica sus datos**, en este orden:

1. **JSON-LD** (`core.ld_json`): lo que usan HSN, Myprotein, Nutritienda, Life Pro y Prozis.
2. **Microdatos** (`core.microdatos`): lo que usa Zumub. Mismo schema.org, otro formato.
3. **HTML a pelo**: el último recurso, y hoy solo Amazon lo necesita.

Y respeta el invariante: **una tienda que bloquea se documenta, no se fuerza.** Nada de
proxies ni de navegadores sin cabeza. MASmusculo lleva bloqueando desde el principio y su
módulo sigue ahí, listo para el día que abra.

### 6.4 · Revisar las guías de evidencia

`web/src/datos/evidencia.js` es lo único de la web que escribe una persona, y a propósito:
un metaanálisis de 2018 dice lo mismo dentro de un año, así que no envejece con los precios.
Cuando revises las cifras contra sus fuentes, sube la fecha de `REVISADO` (arriba del
fichero). Esa fecha es la que sale en `/guia/*` y en el `dateModified` del marcado; **no es**
la fecha de recogida de precios, y mezclarlas sería decir que revisaste algo que no
revisaste.

Reglas que no se saltan: ninguna cifra sin fuente (el build revienta si un efecto cita una
fuente que no existe), el efecto es del **ingrediente** y nunca del producto, y si la
evidencia es mala se dice que es mala.

### 6.5 · Enchufar la afiliación

Cuando te den de alta en un programa, rellena `data/afiliados.json` con los parámetros de la
tienda. A partir de ahí:

- Los enlaces salen con tu identificador y con `rel="sponsored"`.
- El aviso de afiliación aparece solo en las páginas con enlaces, y las secciones de
  `/metodologia` y `/legal` cambian solas de "hoy no hay comisión" a la versión con
  comisión. No hay nada que descomentar.
- El ranking **no se mueve**: la afiliación se aplica al exportar, cuando el orden ya está
  cerrado, y hay un test que lo comprueba cambiando los enlaces y verificando que el orden
  es idéntico.

### 6.6 · Curar una certificación a mano (nivel 4)

Es lo que separa esta web de una lista de afiliados. Solo con el bote delante:

```powershell
python verificar.py pendientes          # la cola de lo que se puede comprobar
python verificar.py qs 27 123456        # Creapure, DESPUÉS de mirarlo en creapure.com
```

Lo curado a mano no lo pisa ninguna pasada automática. Y ojo con **Amazon**: allí el título
lo escribe el vendedor, así que la web **no** concede el nivel 4 automático por ver
"Creapure" en el nombre, aunque sí lo haga en las tiendas que escriben sus propias fichas.

### 6.7 · Cuánto tarda cada cosa

| Comando | Tarda | Cuándo |
|---|---|---|
| `python actualizar.py` | 20-30 min (5 min si lo repites en el mismo día) | Semanal |
| `python run_scraper.py --categoria <slug>` | 1-3 min | Al retocar una categoría |
| `python tests.py` | 2 segundos | Siempre, antes de subir |
| `npm run build` | ~1 min | Siempre |
| `python seo_check.py` | ~20 segundos | Siempre, antes de subir |
| `cd web; npx wrangler pages deploy` | 20 s - 3 min | Al subir |

La carpeta `data/cache/` crece hasta cerca de **1 GB**. Es normal y está fuera del
repositorio: son las páginas descargadas, caducan a las 6 horas y se pueden borrar enteras
cuando quieras (solo hará que la siguiente pasada tarde lo normal en vez de 5 minutos).

---

## Paso 7 · Opcional: saber cuánta gente entra

La web no lleva ninguna analítica, y por eso **no necesita banner de cookies**. Si quieres
medir visitas sin perder eso:

1. Panel de Cloudflare → **Analytics & Logs** → **Web Analytics** → **Add a site**.
2. Pon `fitnesssupplementwiki.com`. Te dará un **token** (una cadena larga de letras y
   números).
3. Ábreme `web\src\sitio.js` y pega el token en la línea `analitica: ''`.
4. Reconstruye y vuelve a subir (paso 6).

Es analítica sin cookies y sin datos personales, así que sigues sin necesitar banner.

---

## Paso 8 · Que se actualice sola todos los días

Aquí está la parte que hay que entender antes de tocar nada, porque explica por qué esto
no se hace "en Cloudflare" a secas.

### Por qué hacen falta dos servicios y no uno

**Cloudflare Pages no puede ejecutar el scraper.** No es una limitación del plan gratuito:
Pages sirve para construir sitios estáticos, no ejecuta Python, no tiene tareas
programadas, y cada construcción arranca en una máquina vacía que se destruye al acabar.
Esto último es lo que lo hace inviable aunque lo demás se pudiera forzar: el scraper
**necesita recordar la pasada anterior**.

Lo necesita por dos motivos concretos:

- Las verificaciones de **nivel 4** se comprueban a mano (`verificar.py qs`) y viven en la
  base de datos. En una máquina que empieza vacía se perderían en cada pasada.
- Si Prozis devuelve un `429` a media categoría, el scraper marca la pasada como parcial y
  **no retira nada** de la base de datos. Sin la base de datos anterior, "no me ha dado
  tiempo a mirarlo" y "la tienda ha dejado de venderlo" serían lo mismo, y la web borraría
  media categoría sola.

Así que el trabajo se reparte:

| Quién | Qué hace | Cada cuánto |
|---|---|---|
| **GitHub Actions** | Ejecuta el scraper, recalcula y confirma `dataset.json` + la base de datos | Todos los días |
| **Cloudflare Pages** | Ve el commit nuevo, construye el sitio y lo publica | Automático, al recibir el push |

El fichero que lo hace ya está creado: **`.github/workflows/actualizar.yml`**.

### 8.1 · Subir el proyecto a GitHub (con cuidado)

Vuelve a leer el aviso del principio: el repositorio de git que hay ahora mismo **es toda
tu carpeta de usuario**, con tus claves SSH y tu llavero GPG dentro. Lo que se sube es solo
la carpeta del proyecto, con su propio repositorio:

```powershell
cd C:\Users\f.munoz.THERMOLYMPIC\Desktop\Fran\Proyects\FitnessSupplementWiki ; git init ; git add . ; git status --short
```

> **Qué tienes que ver:** una lista de unos 70-80 ficheros, todos de este proyecto
> (`web/`, `scraper/`, `data/`, `scoring/`, los `.py` y los `.md`). Tiene que aparecer
> `data/suplementos.sqlite` y **no** puede aparecer nada de `data/cache/`, ni `.ssh`, ni
> `.gnupg`, ni `node_modules`, ni `web/dist`. Si ves cualquier cosa de tu carpeta de
> usuario, **para y avísame**.

El `.gitignore` ya está preparado para esto: deja fuera el casi 1 GB de caché del scraper
(`data/cache/`) y **mete dentro** la base de datos (2,5 MB), que es justo al revés de lo que
haría por defecto. La base de datos va al repositorio porque es el estado del que depende
que una pasada parcial no borre productos y donde viven las verificaciones curadas a mano.

Ahora crea el repositorio en GitHub:

1. Entra en <https://github.com/new>.
2. **Repository name:** `fitnesssupplementwiki`.
3. **Privado.** Importante: en `data/afiliados.json` van tus enlaces de afiliado, y esos
   son tuyos. Además, con repositorio privado tienes 2.000 minutos de Actions gratis al
   mes. Con 30 categorías y 8 tiendas, cada pasada son **30-45 minutos**: unos 1.100-1.400
   minutos al mes si lo dejas diario. Cabe, pero sin margen para reintentos. Si algún mes te
   quedas corto, pásalo a semanal (final del paso 8) y bajas a ~180 minutos.
4. **No** marques ninguna casilla de "Add README", "Add .gitignore" ni licencia: ya los
   tienes y chocarían.
5. **Create repository**.

GitHub te enseña dos líneas para enlazarlo. Son estas, con tu usuario:

```powershell
git commit -m "FitnessSupplementWiki: comparador de suplementos" ; git branch -M main ; git remote add origin https://github.com/TU-USUARIO/fitnesssupplementwiki.git ; git push -u origin main
```

> **Qué tienes que ver:** el contador de `git push` subiendo y, al recargar la página de
> GitHub, tus ficheros. Si te pide usuario y contraseña y falla, es que GitHub ya no acepta
> contraseñas: instala <https://cli.github.com> y ejecuta `gh auth login` una vez.

### 8.2 · Conectar Cloudflare Pages al repositorio

Ya tienes el proyecto de Pages creado por subida directa (paso 3). Un proyecto de subida
directa **no se puede convertir** en uno conectado a Git, así que hay que crear uno nuevo:

1. **Workers y Pages** → **Create** → pestaña **Pages** → **Connect to Git**.
2. Autoriza a Cloudflare a ver tu GitHub y elige `fitnesssupplementwiki`.
3. Configuración de build:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `web` ← el que se olvida todo el mundo
4. **Save and Deploy.**

> **Qué tienes que ver:** un registro de construcción que acaba en `3011 page(s) built` y
> `Success` (unos 2-3 minutos). Cloudflare **no** ejecuta Python en ningún momento: construye desde el
> `dataset.json` que ya viene confirmado en el repositorio.

Cuando este proyecto funcione, mueve el dominio: en el proyecto **viejo** quita el dominio
personalizado (**Custom domains** → los tres puntos → **Remove**), y en el **nuevo** añádelo
como en el paso 4. Después borra el proyecto viejo para no confundirte dentro de un mes.

### 8.3 · Encender el robot diario

El workflow ya está en el repositorio, así que solo hay que darle permiso para escribir:

1. En GitHub, tu repositorio → **Settings** → **Actions** → **General**.
2. Abajo del todo, **Workflow permissions** → marca **Read and write permissions** →
   **Save**. Sin esto el robot recoge los precios pero no puede confirmarlos, y falla justo
   en el último paso.

Pruébalo sin esperar a mañana:

3. Pestaña **Actions** → **Actualizar precios** → botón **Run workflow** → **Run workflow**.

> **Qué tienes que ver:** la ejecución en verde en unos 35-50 minutos, un commit nuevo tipo
> `datos: precios del 2026-08-25`, y detrás un despliegue automático en Cloudflare. Si
> ningún precio ha cambiado, el paso final dice `Sin cambios en los precios. No se
> despliega.` y **eso también es correcto**: no tiene sentido republicar lo mismo.

A partir de ahí se lanza solo a las **05:15 UTC** (07:15 en verano, 06:15 en invierno).
Para cambiar la hora, edita la línea `cron` del workflow.

### ⚠️ El riesgo real de esto: la dirección IP

Este es el punto donde esto puede no funcionar, y prefiero decírtelo ahora que dentro de
tres días.

Tu ordenador sale a internet con una IP doméstica. **GitHub Actions sale con una IP de
centro de datos**, y las tiendas online las bloquean mucho más agresivamente. Ya sabemos que
MASmusculo bloquea incluso desde casa, que Prozis y Zumub limitan por ráfaga y que Amazon
contesta a veces con una página de "recarga esto en 5 segundos". Es perfectamente posible
que desde GitHub alguna tienda que hoy funciona empiece a devolver `403` o `429`, y las
candidatas son justo esas tres.

Si pasa, **no se fuerza** (es el invariante 5 del proyecto: nada de proxies ni de navegador
sin cabeza; una tienda que bloquea se documenta). El scraper ya está preparado para
degradarse bien: la tienda bloqueada se salta, sus productos se quedan como estaban y las
demás siguen. Lo verás en el registro de la ejecución.

Si acaban bloqueando varias, la alternativa es ejecutar el robot en tu ordenador, con tu IP
de siempre:

```powershell
schtasks /create /tn "FitnessSupplementWiki" /tr "powershell -NoProfile -Command \"cd 'C:\Users\f.munoz.THERMOLYMPIC\Desktop\Fran\Proyects\FitnessSupplementWiki'; python actualizar.py; python tests.py; cd web; npm run build; cd ..; python seo_check.py; git add -A; git commit -m 'datos: actualizacion'; git push\"" /sc daily /st 07:15
```

Eso hace lo mismo desde casa y también dispara el despliegue en Cloudflare al hacer push.
Requiere que el ordenador esté encendido a esa hora. Si te decides por esto, borra el
`schedule:` del workflow para que no corran los dos.

### ¿Diario o semanal?

Está puesto diario, pero ahora la pasada dura el triple que cuando eran 9 categorías, así
que el cálculo ha cambiado: **semanal es lo razonable**. Molesta mucho menos a las tiendas
(que es lo que decide si te siguen dejando entrar), gasta ~180 minutos de Actions al mes en
vez de ~1.300, y para un comparador de precios es de sobra.

Para dejarlo en los lunes, cambia en `.github/workflows/actualizar.yml`:

```yaml
- cron: '15 5 * * 1'
```

El `timeout-minutes` del workflow está en **120**: si una pasada se atasca, muere sola en
vez de gastarte la cuota del mes.

---

## Problemas típicos y qué significan

| Lo que ves | Qué pasa | Qué hacer |
|---|---|---|
| Error 404 en todo menos la portada | Subiste la carpeta `web` en vez de `dist` | Repite el despliegue arrastrando `dist` |
| La portada sale sin estilos, en blanco y negro | Subiste el contenido de `dist` suelto y se perdió la carpeta `_astro` | Arrastra la carpeta `dist` entera |
| "No seguro" en el navegador al estrenar el dominio | El certificado HTTPS aún se está emitiendo | Esperar hasta 15 minutos |
| Al compartir el enlace sale una tarjeta gris | La imagen `og.png` no llegó, o la red social tiene cacheada la versión vieja | Comprueba que `/og.png` carga; para forzar el refresco, usa el depurador de la red social |
| `seo_check.py` dice "enlace interno roto" | Alguna página apunta a una dirección que ya no existe | No subas hasta arreglarlo: son errores 404 para Google |
| `python tests.py` falla | El pipeline ha traído datos raros | No subas. Mira qué test falla, el nombre te dice qué protegía |
| Google no indexa nada tras 3 días | Normal en un dominio nuevo | Paciencia. Comprueba en Search Console que el sitemap está "Correcto" |
| El robot falla en el último paso: `permission denied to github-actions` | Falta el permiso de escritura | Settings → Actions → General → **Read and write permissions** (paso 8.3) |
| `git push` rechazado: `file exceeds 100 MB` | Se coló `data/cache/` | El `.gitignore` ya lo excluye. Si ya hiciste `git add`, ejecuta `git rm -r --cached data/cache` |
| El robot va en verde pero la web no cambia | No había cambios de precio, o Pages apunta al proyecto viejo | Mira si el paso final dijo `Sin cambios`. Si no, revisa que el dominio esté en el proyecto conectado a Git |
| Una tienda devuelve `403`/`429` solo en GitHub | IP de centro de datos bloqueada | Es lo esperado, no se fuerza. Si son varias, pásate a la tarea programada local (paso 8) |
| Cloudflare falla con `Cannot find module` | Falta el **Root directory** `web` | Settings del proyecto de Pages → Builds → Root directory: `web` |
| El robot tarda y se corta a los 120 min | Alguna tienda respondiendo muy lenta | Normal de vez en cuando; el `timeout-minutes` está para que no gaste la cuota. Al día siguiente reintenta solo |
| `seo_check.py` dice **título repetido** y las dos URLs son de Amazon | Dos anuncios del mismo bote con títulos que solo se diferencian en la cola de marketing | Se colapsan solos al exportar; si sobreviven es que cambia el formato o el precio, y el título ya los distingue. Si aun así se repite, mira `exportar.agrupar_sabores` |
| Una categoría sale con **0 productos** y sin errores | Un filtro de `categorias.py` que se come lo que debía dejar pasar (le pasó a la cafeína con "café") o un listado de tienda que no trae `ItemList` en su primera página | Prueba `python run_scraper.py --categoria <slug>` y mira el log tienda por tienda |
| El log dice `pasada parcial, no se retira nada` | Una tienda cortó a media categoría (429) | Es el comportamiento correcto: lo que no se llegó a mirar no es lo mismo que lo que ha dejado de venderse. Se arregla solo en la siguiente pasada |
| `amazon: sigue pidiendo esperar` | Amazon está limitando por ratio | La pasada se marca parcial y no borra nada. Si se repite todos los días, baja la frecuencia |
| La subida a Cloudflare se corta a media barra | 3.066 ficheros por el navegador | Usa `cd web; npx wrangler pages deploy` |
| `python actualizar.py` tarda 5 minutos en vez de 25 | La caché del scraper (6 h) sigue caliente de la pasada anterior | No es un error: no se vuelve a pedir lo que ya se pidió hoy |

---

## Lo que NO hay que hacer

- **No subas el repositorio de tu carpeta de usuario a GitHub.** Ahí están tus claves.
- **No cambies el nombre del proyecto de Pages** después de enchufar el dominio.
- **No cambies las direcciones de las páginas** (`/creatina`, `/proteina-whey`…) una vez
  indexadas. Una URL que cambia pierde todo lo que había ganado. Si hace falta cambiar
  alguna, hay que dejar una redirección; está explicado en `SEO-PRODUCTOS.md`.
- **No dejes caducar el dominio.** Renovación automática activada, y el correo de la cuenta
  tiene que ser uno que mires.
- **No añadas publicidad todavía.** Está decidido a propósito: los anuncios en una web sin
  tráfico solo estropean la velocidad y la confianza, que ahora mismo es lo único que
  tienes.
- **No toques `web\dist` a mano.** Se regenera entero en cada build y perderías el cambio
  sin enterarte.

---

## Paso 9 · Cuentas y reseñas de lectores

Hasta aquí la web era un folleto: se genera cada noche y se sirve igual para todo el
mundo. Este paso añade lo único que **escribe**: quien se registra puede puntuar un
producto de 1 a 5 estrellas, dejar un texto y subir una foto, y en cada ficha aparece la
media de todos los lectores.

Son tres recursos de Cloudflare, todos con plan gratuito de sobra para esto:

| Qué | Para qué | Coste |
|---|---|---|
| **D1** (base de datos) | Usuarios y reseñas | Gratis hasta 5 GB y 5 M de lecturas al día |
| **R2** (almacén de archivos) | Las fotos de las reseñas | Gratis hasta 10 GB |
| **Un secreto** | Firmar la cookie de sesión | Gratis |
| **Google OAuth** (opcional) | El botón *Continuar con Google* | Gratis |

> **Se hace una sola vez.** Después, subir la web sigue siendo un comando.

### 9.1 · Crear la base de datos

En una terminal, dentro de la carpeta del proyecto:

```powershell
cd web; npx wrangler d1 create suplementos
```

Wrangler imprime un bloque con un `database_id` (una ristra larga con guiones).
**Cópialo** y pégalo en `web/wrangler.toml`, sustituyendo
`PON-AQUI-EL-ID-QUE-TE-DA-CLOUDFLARE`.

Ahora crea las tablas, primero en tu ordenador y luego en internet:

```powershell
npx wrangler d1 execute suplementos --local --file=schema.sql
npx wrangler d1 execute suplementos --remote --file=schema.sql
```

> **Qué tienes que ver:** varios bloques `"success": true`.

### 9.2 · Crear el almacén de fotos

```powershell
npx wrangler r2 bucket create suplementos-fotos
```

El nombre tiene que ser exactamente ese, porque es el que está escrito en
`web/wrangler.toml`. El bucket **no** se hace público: las fotos se sirven por
`/api/foto/...`, es decir, a través de la propia web.

### 9.3 · El secreto de las sesiones

Con él se firma la cookie que dice "este navegador es fulanito". Si alguien lo supiera,
podría fabricarse una cookie de cualquier usuario, así que **no se escribe en ningún
fichero del repositorio**.

Genera uno largo al azar y guárdalo en Cloudflare:

```powershell
npx wrangler pages secret put SECRETO --project-name fitnesssupplementwiki
```

Te pedirá el valor: pega una ristra larga (40 caracteres al azar valen). No hace falta
que la recuerdes; si algún día la cambias, todo el mundo tendrá que volver a entrar, y
nada más.

Para trabajar en tu ordenador, crea `web/.dev.vars` con una línea:

```
SECRETO=lo-que-quieras-esto-es-solo-local
```

Ese fichero está en `.gitignore` y no se sube nunca.

### 9.4 · Probarlo en tu ordenador

```powershell
cd web; npm run build; npx wrangler pages dev
```

Abre <http://127.0.0.1:8788>, entra en cualquier producto y baja hasta *Opiniones de los
lectores*. Crea una cuenta, pon estrellas, escribe algo y sube una foto.

Las cuentas tienen tres puertas, y las tres usan el mismo formulario:

| Dónde | Qué es |
|---|---|
| El icono de la esquina superior derecha | Lleva a `/entrar` y vuelve a donde estabas. Con sesión abierta enseña tu inicial |
| `/entrar` y `/registro` | Las páginas de acceso. Llevan `noindex`: son una utilidad, no contenido, y no salen en Google |
| Dentro de la ficha de producto | El mismo formulario, para no tener que salir de la página que estabas leyendo |

> **Qué tienes que ver:** la reseña aparece bajo el formulario y la media de arriba
> cambia. Los datos van a una base de datos local, no a la de internet.

### 9.5 · Subirlo

```powershell
cd web; npx wrangler pages deploy
```

Este comando, ejecutado **dentro de `web`**, sube el sitio y la API. Si lo lanzas desde
la carpeta de arriba, Wrangler no encuentra `wrangler.toml` y las reseñas se quedan sin
servidor.

Si la web se despliega sola desde GitHub (paso 8), no hay que tocar nada: Cloudflare lee
`web/wrangler.toml` y publica las funciones con cada commit. Los bindings de D1 y R2 sí
hay que confirmarlos una vez en el panel: **Workers y Pages** → tu proyecto →
**Settings** → **Bindings**, y comprobar que aparecen `DB` y `FOTOS`.

### 9.6 · Entrar con Google (opcional)

Si no haces este apartado, la web funciona igual: se entra con correo y contraseña. El
botón de Google **sale siempre, pero apagado y diciendo que está sin configurar**
mientras falten las dos variables, así que no hay forma de dejar un botón que lleve a
un error. En cuanto las pongas, se enciende solo: no hay que tocar código.

1. Entra en <https://console.cloud.google.com/> y crea un proyecto (el nombre da igual).
2. Menú → **APIs y servicios** → **Pantalla de consentimiento de OAuth**. Tipo
   **Externo**, nombre de la aplicación `FitnessSupplementWiki`, tu correo de contacto.
   No pidas permisos adicionales: con `email` y `perfil` sobra, y son los que Google
   aprueba sin revisión.
3. **Credenciales** → **Crear credenciales** → **ID de cliente de OAuth** → tipo
   **Aplicación web**.
4. En **URI de redirección autorizados** añade estas dos, exactamente:

   ```
   https://fitnesssupplementwiki.com/api/google/vuelta
   http://127.0.0.1:8788/api/google/vuelta
   ```

   La segunda es para probarlo en tu ordenador. Si te falta una, Google contesta
   `redirect_uri_mismatch` y no pasa de ahí.
5. Google te da un **ID de cliente** y un **secreto de cliente**. Guárdalos en Cloudflare:

   ```powershell
   npx wrangler pages secret put GOOGLE_ID --project-name fitnesssupplementwiki
   npx wrangler pages secret put GOOGLE_SECRET --project-name fitnesssupplementwiki
   ```

Para probarlo en local, descomenta las dos líneas de `web/.dev.vars` y pon ahí los
mismos valores. **Wrangler lee ese fichero al arrancar**: si lo cambias, para el
servidor y vuélvelo a lanzar.

> **Qué tienes que ver:** en <http://127.0.0.1:8788/entrar> aparece *Continuar con
> Google*, te lleva a la pantalla de Google, eliges cuenta y vuelves a la misma página
> desde la que saliste, con el icono de la esquina ya con tu inicial.

Una cuenta creada con Google **no tiene clave**: siempre entra por ese botón. Si la
misma persona ya tenía cuenta con ese correo y clave, Google la reconoce y entra en la
que ya existía; no se duplica.

### Lo que este paso NO hace

Está escrito así a propósito, para no mantener lo que nadie ha pedido todavía:

- **No hay "he olvidado mi clave"**: haría falta enviar correos, y eso es otro servicio.
  Quien pierda la clave, se hace otra cuenta (o entra con Google, que no gasta clave).
- **No hay moderación ni denuncias**: si aparece una reseña que sobra, se borra a mano:
  `npx wrangler d1 execute suplementos --remote --command "DELETE FROM resenas WHERE id = 7"`.
- **No hay límite de peticiones**: para frenar a un robot que registre mil cuentas,
  Cloudflare tiene *Rate limiting* en el panel (gratis, una regla sobre `/api/*`).
- **La media de lectores no entra en el marcado de Google**: las fichas son estáticas y
  se generan cada noche, así que el `aggregateRating` diría una nota de hace horas. La
  puntuación que Google lee sigue siendo la editorial, la de la metodología.

Los tres primeros se añaden el día que hagan falta de verdad, no antes.

---

## Resumen de una línea

```
python actualizar.py → python tests.py → cd web → npm run build → cd .. → python seo_check.py → cd web → npx wrangler pages deploy
```

Media hora de ordenador, dos minutos tuyos. Todo lo demás (títulos, respuestas, preguntas
frecuentes, rankings, sitemap, fechas) se genera solo desde los datos: lo único que se
escribe a mano son las dosis de referencia con su fuente y las guías de evidencia. Ver
`SEO-PRODUCTOS.md` antes de añadir una categoría o una tienda, y `AGENTS.md` para el detalle
técnico de por qué cada cosa está como está.
