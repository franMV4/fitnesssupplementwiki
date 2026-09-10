# Para pegar — semana del 09/09/2026

Quince minutos. Copia, pega, y ya. Todos los datos de aquí están sacados del dataset de
hoy y comprobados uno a uno: si alguien te discute una cifra, la cifra aguanta.

---

## Antes de pegar nada: tres reglas que evitan que te echen

1. **Nunca pegues el enlace en el cuerpo del mensaje.** Ni en Reddit ni en un foro. Pegas
   el dato. Si alguien pregunta de dónde sale, respondes con el enlace *en un comentario*.
   Un enlace en el primer mensaje de una cuenta nueva es expulsión automática en la mitad
   de los sitios, y encima quema el dominio para siempre en ese subreddit.
2. **Una cuenta nueva no publica un hilo el primer día.** Si la cuenta de Reddit es nueva o
   no tiene actividad, esta semana solo *comentas* en hilos de otros. El hilo propio, la
   semana que viene. Sí, es más lento. También es la diferencia entre que funcione o no.
3. **Lee la barra lateral del subreddit antes.** Varios prohíben webs propias sin permiso
   de los moderadores. Donde lo prohíba, escribe a los moderadores primero: enseñar
   `/metodologia` y decir que el dataset es abierto suele bastar, y te ahorra el veto.

---

## 1 · El dato de la creatina — para comentar, no para abrir hilo

**Dónde**: r/espanol_fitness, r/gym_es, o cualquier hilo de "¿qué creatina compro?".
**Cuándo**: cuando alguien pregunte precios o marcas. No lo fuerces.

> He sacado el precio por kilo real de las 240 creatinas en polvo que se venden ahora
> mismo en 19 tiendas españolas, y el reparto es más bestia de lo que esperaba:
>
> - Mediana: **58 €/kg**
> - La décima parte más barata: **por debajo de 17 €/kg**
> - La décima parte más cara: **por encima de 107 €/kg**
>
> La más barata sale a 8,95 €/kg (Zumub, bote de 2 kg a 17,89 €) y la más cara a 293 €/kg
> (Prozis, Creapure de 150 g a 43,99 €). Es el mismo monohidrato: lo que cambia es el
> formato y la tienda.
>
> Moraleja práctica: mirar el precio del bote no sirve de nada. Divide siempre entre los
> kilos. Un bote de 500 g a 25 € es más caro que uno de 2 kg a 60 €.

**Si preguntan de dónde sale**, respondes en un comentario aparte:

> Lo recojo yo a diario de las tiendas y lo publico en fitnesssupplementwiki.com, con el
> método explicado en /metodologia. Los datos en bruto están abiertos en /datos si los
> quieres para algo.

---

## 2 · El gancho fuerte: las 18 guías que dicen que no funciona

**Dónde**: este sí da para hilo propio, cuando la cuenta esté rodada. r/espanol_fitness,
Mundo Fitness, ForoMuscle. También funciona en LinkedIn con el ángulo de datos.
**Título sugerido**: *"He escrito 50 guías de suplementos y en 18 la conclusión es que no
funciona"*

> Llevo meses montando un comparador de suplementos y acabé escribiendo una guía de
> evidencia por cada una de las 50 categorías, con 122 fuentes citadas con su DOI.
>
> Lo que no esperaba es el reparto final:
>
> - **11 de 50** con evidencia sólida: creatina, whey, aislada, vegana, omega 3,
>   beta-alanina, carbohidratos, cafeína, melatonina, vitamina C y B12.
> - **21 de 50** con evidencia intermedia.
> - **18 de 50** con evidencia baja. Y aquí está lo incómodo: **BCAA, glutamina,
>   multivitamínicos y ZMA** están en ese grupo, y son de lo más vendido del sector.
>   También tribulus, HMB, CLA y los quemagrasas.
>
> No lo digo yo, lo dicen las revisiones que hay citadas en cada una. El tribulus no sube
> la testosterona. El HMB no hace nada en quien ya entrena. El CLA funcionó en animales y
> mucho peor en personas.
>
> Lo cuento porque a mí me habría ahorrado dinero saberlo hace años, y porque un
> comparador que solo dijera "compra esto" sería otra tienda más.

**Si preguntan**: mismo comentario que en el punto 1.

---

## 3 · El ángulo técnico — Hacker News / r/programming

**Dónde**: Hacker News como `Show HN`. Aquí sí va el enlace en el envío, que es lo normal
en ese sitio. Trae pocos compradores pero enlaces de calidad, que es justo lo que le falta
al dominio.
**Título**: `Show HN: I scrape 19 Spanish supplement stores and rank them by price per kilo`

> I built a price comparator for sports supplements in Spain. 4,113 products from 19
> stores, re-scraped daily, ranked 50% on price per kilo (or per capsule) and 50% on how
> well a certification can actually be verified by a third party.
>
> Two things I did on purpose that might interest this crowd:
>
> - **The scoring engine cannot read the affiliate file.** Affiliate parameters are
>   applied at export time, after the ranking is closed, and there is an automated test
>   (`test_los_afiliados_no_mueven_el_ranking`) that re-runs the ranking with and without
>   them and asserts the order is byte-identical. Without that test it is just a promise.
> - **The scraper is polite and it is written in the Python standard library**, one thread
>   per store with a per-host delay. Every store is read from whatever it already
>   publishes: JSON-LD, microdata, Shopify's products.json or its sitemap. No headless
>   browser anywhere.
>
> The whole dataset is open at /datos, and the methodology is a page, not a paragraph.
>
> Happy to talk about the parts that were harder than expected: normalising "2x1kg" and
> "30 servings" into a comparable unit, and deciding when a certification seal actually
> means a third party checked something.

---

## 4 · El correo a blogs pequeños — el que más enlaces da por minuto

**Dónde**: 3 a 5 blogs pequeños de nutrición o fitness en español. Búscalos en Google con
`nutricion deportiva blog` y descarta los que sean tiendas. Uno por correo, no en copia.
**Asunto**: `Datos abiertos de precios de suplementos, por si te sirven`

> Hola [nombre],
>
> Te escribo porque publico un comparador de suplementos y tengo abierto el dataset que
> uso: precios diarios de 4.113 productos de 19 tiendas españolas, con el precio por kilo
> ya calculado, en JSON, en fitnesssupplementwiki.com/datos.
>
> No te pido nada a cambio. Si algún día escribes sobre precios y te sirve el dato, úsalo;
> y si citas la fuente, mejor, pero tampoco es condición.
>
> Lo que igual te interesa más: tengo 50 guías con la evidencia de cada suplemento y sus
> DOI, y en 18 la conclusión es que no funciona. Si quieres el detalle de alguna en
> concreto, dímelo y te lo paso.
>
> Un saludo,
> Fran

---

## Cómo saber si esto sirvió de algo

No mires las visitas del día. Mira, a las dos semanas, si en Search Console han aparecido
impresiones que antes no estaban. Un enlace tarda en contar.

Y si un hilo se hunde o te ignoran, no es señal de nada: pasa la mayoría de las veces.
Lo que no funciona es dejar de intentarlo a la tercera.
