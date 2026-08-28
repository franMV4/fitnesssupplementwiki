# Premisas de SEO al añadir productos, tiendas o categorías

Este documento existe para que ampliar el catálogo **no** degrade el posicionamiento.
La regla que lo resume todo:

> **Ninguna frase de esta web la escribe una persona para una categoría concreta. Se
> genera desde el dataset.** Si añades algo y su copy no se genera solo, no has añadido
> un producto: has añadido una página que mañana mentirá.

Léelo entero la primera vez. Después basta con la checklist del final.

---

## 0. Por qué está montado así

Los rankings de "qué creatina comprar" los ganan páginas que cumplen tres cosas a la vez,
y esta web las cumple **solo si respetas lo de abajo**:

1. **Responden la pregunta en la forma de la pregunta.** El `<h1>` de cada categoría es
   literalmente la consulta objetivo, y debajo hay un párrafo ("La respuesta corta") que
   la contesta con nombre propio, precio y fecha. Es lo que Google usa como fragmento
   destacado y lo que un modelo de lenguaje copia cuando le preguntan.
2. **Son verificables.** Precio con fecha, método público, autor identificado, evidencia
   citada por ingrediente. Es lo que separa una comparativa de una lista de afiliados.
3. **Están frescas.** Un comparador de precios de hace ocho meses no lo cita nadie.

Todo lo que sigue protege una de esas tres.

---

## 1. Añadir un producto

Un producto entra por el scraper, no a mano. Lo que tienes que comprobar:

- **Tiene la medida de su categoría.** Kilos si la categoría se compara por kilo,
  unidades si se compara por cápsula. Un producto sin ella **no debe entrar**: el
  invariante 0 de `AGENTS.md` existe porque 30 €/kg y 0,07 €/cápsula en la misma
  columna no son un ranking, y una tabla incoherente la penaliza Google y la ignora
  un modelo.
- **No es una mezcla que invada la categoría.** "Whey + Creatina" en creatina sale a
  precio de proteína y encabeza la tabla sin ser creatina. Ese producto no solo da una
  respuesta mala: da una respuesta mala **en el párrafo de la respuesta corta**, que es
  la frase que se lleva la cita. Cada categoría lo filtra en su `excluye` de
  `categorias.py`.
- **Su nombre distingue el formato.** El título de la ficha se corta a 78 caracteres por
  palabra entera, y el formato ("1Kg", "120 perlas") va al final. Dos variantes cuyo
  nombre solo se diferencie más allá del carácter 78 acabarían con el mismo título, y
  dos páginas con el mismo título compiten entre ellas. `seo_check.py` lo detecta.
- **Si se vende en varias tiendas**, no hagas nada: el título añade la tienda solo
  cuando hay empate de nombre, y la ficha lista las demás tiendas en "Dónde comprarlo".

Nada de esto se toca a mano en el HTML: el título, la descripción, el veredicto y las
cuatro preguntas de la ficha los genera `web/src/datos/seo.js` desde el dataset.

## 2. Añadir una categoría

Aquí sí hay campos que edita una persona, y son **los que deciden por qué consulta
compite la página**. En su entrada de `categorias.py`:

```python
"creatina": dict(
    unidad="kg",
    nombre="Creatina",                 # como se llama en la web
    termino="creatina",                # como la busca la gente
    mejor="la mejor creatina",         # articulo y concordancia ya resueltos
    consultas={
        "mejor":         "que creatina comprar",
        "barato":        "cual es la creatina mas barata",
        "precio":        "cuanto cuesta un kilo de creatina",
        "certificacion": "que certificacion tiene que tener una creatina",
        "dosis":         "cuanta creatina hay que tomar al dia",
    },
    ...
)
```

### Cómo se eligen las `consultas`

- **Escríbelas como las teclea una persona**, en minúsculas y sin signos: "que creatina
  comprar", no "Mejor creatina calidad-precio 2026". Los signos y las mayúsculas los
  pone la plantilla.
- **`mejor` es la consulta principal** y se convierte en el `<h1>` de la página. Elige la
  que tenga más intención de compra y menos ambigüedad. Casi siempre es
  `"que <termino> comprar"`.
- **Sin tildes**, como el resto del copy de la web. Google normaliza los acentos, así
  que no se pierde nada y se gana consistencia con el código.
- **Solo estas cinco claves**: `mejor`, `barato`, `precio`, `certificacion`, `dosis`.
  Cada una la contesta un generador de `seo.js`. Una clave que no exista se ignora en
  silencio, y `tests.py` falla si inventas una.
- **`dosis` solo si hay dosis de referencia con fuente.** Si la categoría no tiene un
  único activo con su DOI en `data/dosis_referencia.json` (preentrenos,
  multivitamínicos), **quita la clave**. Prometer "cuánta X tomar al día" y contestar con
  una dosis inventada es exactamente lo que hunde a un sitio: una vez que Google o un
  modelo detectan un dato falso, el resto de la web deja de valer. `tests.py` comprueba
  que si declaras `dosis` existe la referencia.
- **`mejor` (la cadena) tiene que empezar por artículo**: "la mejor creatina", "el mejor
  preentreno", "los mejores BCAA". Es una cadena escrita a mano a propósito: un motor de
  género en español para treinta categorías es más código del que ahorra.

### Y además

- **El slug de la URL lo genera `web_slug()`**: guiones, nunca guiones bajos. Google no
  parte palabras en `_`, así que `/proteina_whey` es un token único y `/proteina-whey`
  son dos palabras. La clave de Python se queda con guion bajo (la usan la BD, el
  scraper y el motor).
- **No cambies un slug ya publicado.** Una URL indexada que cambia pierde su histórico.
  Si hay que cambiarla, hace falta una redirección 301 en `web/public/_redirects`.
- La categoría entra sola en el menú, en el pie, en el sitemap, en `llms.txt` y en
  `/datos/<slug>.json`. No hay ninguna lista que actualizar a mano.

## 3. Añadir una tienda

- **Documenta el bloqueo, no lo fuerces** (invariante 5). Un scraper que evade
  protecciones acaba con la IP en una lista y con la web sin datos.
- Cuantas más tiendas, más fuerte la frase de la respuesta corta ("de las 8 tiendas
  que compara esta web"): ese número es parte de por qué un modelo elige esta
  fuente y no otra. Sale solo del dataset.
- Si la tienda publica la tabla nutricional, gana toda la web: la clave `dosis` de las
  FAQ y la sección de dosis de las fichas solo existen donde hay datos.

## 4. Lo que nunca se hace

- **Escribir prosa fija con un precio, un ganador o un año dentro.** Envejece sin avisar
  y nadie se acuerda de actualizarla. Todo eso se genera; el año sale de la fecha de
  recogida.
- **Publicar `aggregateRating` en el JSON-LD.** Esta web no tiene opiniones de usuarios.
  El score va como `Review` editorial, con su autor y su fecha, que es lo que es.
  Fingir valoraciones de usuarios es motivo de penalización manual.
- **Afirmar un efecto de un producto.** La evidencia se cita por ingrediente con su
  dosis y su DOI (invariante 1). Además de ser lo honesto, "creatina + salud" es una
  consulta YMYL: un texto que promete resultados hunde el dominio entero.
- **Bloquear rastreadores de IA en `robots.txt`.** Están permitidos uno a uno y a
  propósito: aparecer en las respuestas de ChatGPT, Perplexity y los AI Overviews es
  justo el tráfico que esta web quiere.
- **Rellenar el `<h1>` o el título con palabras clave repetidas.** Una consulta por
  página. La página de creatina compite por creatina.
- **Dejar una página sin enlaces entrantes.** Cada ficha se enlaza desde su categoría,
  desde "Alternativas" de sus vecinas y desde el sitemap.

## 5. Checklist antes de publicar un cambio

```bash
python actualizar.py      # scrape -> verificar -> score -> dataset
python tests.py           # 57 asserts, incluido el contrato de SEO de las categorias
cd web && npm run build   # ~3.000 paginas
cd .. && python seo_check.py
```

`seo_check.py` corre sobre `web/dist` y falla si:

| Comprueba | Por qué importa |
|---|---|
| `<title>` presente y de 15 a 80 caracteres | Un título de 100 sale cortado en el resultado |
| `meta description` de 50 a 210 | Fuera de rango, Google la reescribe |
| `canonical` que coincide con la ruta | Evita que dos URLs compitan por lo mismo |
| Exactamente un `<h1>` | Una página, una pregunta |
| Todo el JSON-LD parsea | Un JSON roto invalida el marcado de la página entera |
| Ningún título ni descripción repetidos | Dos páginas iguales compiten entre ellas |
| Ningún enlace interno roto | Es lo que pasa al renombrar un slug |
| El sitemap lista todas las páginas | Lo que no está en el sitemap tarda semanas en indexarse |
| `robots.txt` con `Sitemap:` y los bots de IA | Ver arriba |
| Que no quede ningún `ejemplo.es` | El dominio vive solo en `web/src/sitio.js` |

## 6. Al publicar de verdad

1. Revisar `web/src/sitio.js`: `url`, `nombre`, `contacto` y `titular`. Es el único
   sitio donde viven. Si cambia la identidad visual, `python assets.py` regenera
   `og.png`, `apple-touch-icon.png` y las fuentes propias.
2. `cd web && npm run build`, y `python seo_check.py`: falla si queda algo del dominio viejo.
3. Cloudflare Pages: build `npm run build`, directorio raíz `web`, salida `dist`.
4. Dar de alta el dominio en Google Search Console y **enviar `/sitemap.xml`** a mano la
   primera vez.
5. Volver a ejecutar el pipeline y desplegar con la frecuencia con la que quieras que te
   citen: en un comparador de precios, la fecha de recogida es media reputación.
