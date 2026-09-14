# Plan para conseguir visitas (2026-09-14)

Complementa a `PARA-PEGAR.md`. Cada bloque dice **qué haces tú** y **qué le pides al agente**
(lo que es código). Ve en orden: los primeros son baratos y los últimos son los que más duran.

Cifras del dataset del 13/09/2026, para usarlas donde haga falta:

| Dato | Valor |
|---|---|
| Productos / tiendas / marcas | 4.152 / 19 / 828 |
| Con certificación de terceros comprobable desde su ficha (nivel 3-4) | 69 (1,7 %) |
| Creatina: precio por kilo, 10 % más barato vs 10 % más caro | 6,2 veces más |
| Creatina: mediana | 59,80 €/kg (la más barata, 8,95 €/kg) |
| Creatina Creapure: rango | 41,82 a 74,52 €/kg de mediana (55 productos) |
| Proteína whey: mediana | 41,65 €/kg (la más barata, 17,93 €/kg) |
| Vitamina D: dosis más barata vs 10 % más caro | 8,8 veces más |
| Productos más de un 10 % por debajo de su precio máximo | 389 |

> Ojo al redactar: "nivel 1" significa que **no se puede comprobar** una certificación desde
> la ficha, no que el producto sea malo. Di "sin certificación de terceros comprobable",
> nunca "sin control" o "de mala calidad".

---

## 1. Bing Webmaster Tools (10 min, tú)

1. Entra en <https://www.bing.com/webmasters> con tu cuenta de Google o Microsoft.
2. Pulsa **Importar desde Google Search Console** y autoriza. Se trae el sitio ya verificado.
3. Ve a **Sitemaps** y comprueba que aparece `https://fitnesssupplementwiki.com/sitemap.xml`
   (si no, añádelo a mano).
4. En **Configuración > IndexNow** copia la clave si te la ofrece y pásasela al agente
   (o deja que la genere él en el paso 2).
5. Vuelve en una semana a **Informe de búsqueda** para ver si ya salen impresiones.

## 2. IndexNow (agente, 20 min)

Pídele: *"Añade IndexNow: fichero de clave en public y que tras cada publicación se envíen
las URLs cuyo precio haya cambiado"*.

Tú después:
1. Publica (`git push`).
2. Abre `https://fitnesssupplementwiki.com/<clave>.txt` y comprueba que muestra la clave.
3. En Bing Webmaster > IndexNow, al día siguiente, deberían verse URLs recibidas.

## 3. Search Console: las búsquedas donde ya casi sales (30 min, tú + agente)

1. Search Console > **Rendimiento > Resultados de búsqueda**.
2. Arriba: periodo **últimos 3 meses**. Marca **Clics, Impresiones, CTR y Posición**.
3. Pestaña **Consultas** > botón de filtro > **Posición** > **Mayor que 7**. Otra vez filtro:
   **Posición menor que 21**.
4. Ordena por **Impresiones** (de más a menos).
5. **Exportar > CSV**. Haz lo mismo en la pestaña **Páginas**.
6. Pásale los dos CSV al agente: *"Mejora título y primer párrafo de las páginas de este CSV"*.
7. Publica. Repite cada 4 semanas: los cambios tardan 2-4 semanas en notarse.

## 4. Fichas que responden "¿Es buena la X?" (agente)

Pídele: *"En las fichas con impresiones en Search Console, que el title y el primer párrafo
respondan a '¿Es buena la [producto]?' con los datos de la ficha (€/kg, nivel de verificación,
ingredientes, alternativa verificada)"*.

Tú: publica y revisa en 3-4 semanas en Search Console si esas páginas ganan clics.

## 5. Página "Bajadas de precio de la semana" (agente)

Pídele: *"Crea /bajadas/ con los productos cuyo precio baja más de un 10 % frente a su
histórico, ordenados por porcentaje, enlazada desde la portada y en el sitemap"*.

Tú:
1. Publica y abre `/bajadas/` para comprobar que tiene sentido (hoy saldrían unos 389).
2. En Search Console > **Inspección de URLs**, pega la URL y pulsa **Solicitar indexación**.

## 6. Canal de Telegram de bajadas (tú 15 min + agente)

1. Telegram > lápiz > **Nuevo canal**. Nombre: *FitnessSupplementWiki – Bajadas de precio*.
   Público, enlace `t.me/fitnesssupplementwiki` (o el que esté libre).
2. Habla con **@BotFather** > `/newbot` > nombre y usuario del bot. Te da un **token**.
   **No lo pegues en el chat ni en el código.** Guárdalo como secreto:
   `cd web; npx wrangler pages secret put TELEGRAM_TOKEN --project-name fitnesssupplement`
3. Añade el bot al canal como **administrador** con permiso para publicar.
4. Pídele al agente: *"Que cada publicación mande al canal de Telegram las 5 bajadas más
   grandes nuevas, con enlace a la ficha de la web"*.
5. Pon el enlace del canal en tu bio de redes y en el pie de la web (pídelo al agente).
6. Para los primeros suscriptores: compártelo en los hilos de `PARA-PEGAR.md` y en grupos
   de gimnasio donde ya estés. Nunca en grupos donde no participas.

> Chollometro: lo descarto por ahora. Las ofertas enlazan a la tienda, no a tu web, y
> promocionar tu propio sitio va contra sus normas. Traería poco y arriesga la cuenta.

## 7. Vídeos cortos (TikTok, Shorts, Reels) (tú, 1 h por vídeo al principio)

1. Crea la cuenta **@fitnesssupplementwiki** en TikTok, YouTube e Instagram (el mismo vídeo
   vale para los tres).
2. Formato: 20-40 s, pantalla grabada o tú hablando, un solo dato por vídeo.
3. Guiones con los datos de arriba:
   - *"La misma creatina puede costar 6 veces más según dónde la compres"* > enseña la tabla
     de `/creatina/` ordenada por €/kg.
   - *"Esta proteína de 27 €/kg es la más barata de los aislados. ¿Es buena?"* > ficha de Bulk.
   - *"Solo el 1,7 % de 4.152 suplementos tiene una certificación que se pueda comprobar"*.
   - *"Cuánto te cuesta de verdad la vitamina D: de 2 céntimos a casi 1 euro la dosis"*.
4. Texto en pantalla con la cifra grande. Última frase: *"Comparativa completa: enlace en bio"*.
5. Bio: enlace a la web (o a `/bajadas/` cuando exista).
6. Constancia: 3 vídeos por semana durante 6 semanas antes de juzgar si funciona.

## 8. Estudio de datos para prensa (tú, una tarde + agente)

Es lo que más ayuda a largo plazo: un enlace de un medio vale más que meses de foros.

1. Pídele al agente: *"Crea /estudio-precios-suplementos-2026/ con las cifras del dataset,
   metodología, 3 gráficos y una tabla descargable"*. Revisa cada cifra antes de enviarla.
2. Publica y comprueba la página en móvil.
3. Haz una lista de 20-30 destinatarios en una hoja de cálculo: nombre, medio, email, fecha
   de envío, respuesta. Busca en cada medio al periodista que firma artículos de suplementos
   o nutrición deportiva (el email suele estar en su perfil de autor, LinkedIn o X).
   Empieza por: Vitónica, Sport Life, Men's Health España, Runner's World España, Xataka,
   20minutos (salud), El Español (Omicrono / salud), blogs de nutricionistas deportivos.
4. Manda un correo por persona, nunca en copia:

   > **Asunto:** La misma creatina cuesta hasta 6 veces más según la tienda (datos de 4.152 suplementos)
   >
   > Hola, [nombre]:
   >
   > He analizado los precios de 4.152 suplementos a la venta en 19 tiendas online españolas.
   > Tres datos que pueden interesarte para [medio]:
   >
   > - En creatina, el 10 % más caro cuesta 6,2 veces más por kilo que el 10 % más barato.
   > - Solo el 1,7 % de los productos tiene una certificación de terceros que se pueda comprobar desde su ficha.
   > - En vitamina D, la dosis va de 2 céntimos a casi 1 euro.
   >
   > El estudio completo, con metodología y datos descargables: [URL]
   >
   > Puedes usar los datos citando la fuente. Si necesitas otra cifra o un desglose, te lo preparo.
   >
   > Un saludo,
   > Fran Muñoz Villanova – FitnessSupplementWiki

5. Si no contestan, **un solo recordatorio** a los 7 días. Luego no insistas.
6. Cuando alguien lo publique, comprueba si enlaza a la web. Si solo te nombra, responde
   agradeciendo y pregunta con educación si pueden añadir el enlace a la fuente.
7. Repite con datos nuevos cada 3-6 meses (por ejemplo, "cómo han cambiado los precios").

---

## Resumen de pedidos al agente

1. IndexNow.
2. Títulos y primer párrafo desde los CSV de Search Console.
3. Fichas "¿Es buena la X?".
4. Página `/bajadas/`.
5. Envío automático a Telegram + enlace al canal en el pie.
6. Página del estudio de precios.
