# Plan de construcción — Comparador calidad-precio de suplementos

**Cómo usar este documento.** Cada fase es un prompt autocontenido. Pégalo en tu herramienta de código (Claude Code, Cursor, o como brief para ti mismo), ajusta rutas y nombres, y no pases de fase hasta cumplir su "Hecho cuando". El orden importa: construye la fontanería con una categoría fácil (creatina), mete el valor real en la difícil (preentrenos), y deja el sello para el final, cuando la metodología ya esté probada.

**Stack de referencia** (el tuyo, no cambies a nada nuevo):
- Scraper y motor de datos: **Python**
- Motor de scoring: **TypeScript** (o Python si prefieres todo junto; el scoring es lógica pura)
- Web: **Astro 4 + islas React** con generación estática desde el dataset
- Datos: SQLite para empezar (un fichero, cero infra), migrable a Postgres si escala

---

## Guardarraíles permanentes (aplican a TODAS las fases)

Copia esto al final de cada prompt. No son opcionales: definen si tu web es legal y si la gente se la cree.

```
GUARDARRAÍLES:
- NUNCA generes afirmaciones de salud o eficacia sobre un producto concreto
  ("este producto mejora X"). Solo hechos: "contiene creatina monohidrato a 5 g",
  "el ingrediente X tiene evidencia a dosis Y [cita]". El efecto se atribuye al
  INGREDIENTE con su fuente, nunca al producto.
- El ranking y el score NO dependen jamás de si el producto tiene enlace de
  afiliado ni de cuánto paga. El orden lo manda el score. Punto.
- Una certificación solo cuenta como "verificada" si se comprueba contra la
  FUENTE (código QS de Creapure, lote en la web de Informed Sport, IFOS), no
  contra lo que diga la etiqueta o la ficha de la tienda. Lo que solo aparece
  en la ficha se marca como "declarado", nivel inferior.
- Toda cifra de dosis de referencia debe llevar su fuente citada. No inventes
  dosis ni las des por buenas sin verificarlas tú.
```

---

## Fase 0 — Esquema de datos y cimientos

*El esquema es la decisión de la que cuelga todo lo demás. Media tarde bien invertida.*

```
Quiero montar la base de datos de un comparador de suplementos calidad-precio
para el mercado español. Usa SQLite y Python (SQLModel o SQLAlchemy).

Diseña y crea el esquema con estas tablas:

1. producto: id, marca, nombre, categoria, tienda, url, formato_gramos,
   servicios_por_envase, precio_eur, precio_por_kg (calculado), forma
   (ej: monohidrato, HCL, kre-alkalyn), fecha_scrape.

2. ingrediente_producto: producto_id (FK), ingrediente (normalizado, ej:
   "citrulina_malato"), dosis_por_servicio_mg. Un producto tiene N filas.

3. certificacion: producto_id (FK), tipo (creapure | informed_sport | informed_choice
   | ifos | nsf | analisis_marca | etiqueta), nivel_verificacion (1-4, ver abajo),
   codigo_qs (nullable), url_evidencia (nullable), verificado_fecha, verificado_por
   (auto | manual).

   Escala nivel_verificacion:
   4 = verificado contra fuente oficial (código QS Creapure, lote Informed Sport, IFOS)
   3 = análisis de laboratorio de terceros publicado por la propia marca (ej: Life Pro
       publica pureza >99% de su lote, sin sello Creapure)
   2 = declarado en la ficha/etiqueta sin verificación posible
   1 = nada

4. dosis_referencia: ingrediente, dosis_efectiva_min_mg, dosis_efectiva_max_mg,
   forma_preferida, nivel_evidencia (alta | media | baja), fuentes (JSON con citas).
   Esta tabla la relleno YO a mano; es el activo del proyecto.

5. score: producto_id (FK), score_calidad, coste_por_dosis_efectiva,
   flag_infradosaje (bool), score_final, fecha_calculo.

Genera el esquema, las migraciones y un seed mínimo con 3 productos de creatina
inventados para poder probar. Añade el repo con estructura: /scraper, /scoring,
/web, /data (el .sqlite), y un README con cómo levantar cada parte.

[+ GUARDARRAÍLES PERMANENTES]
```

**Hecho cuando:** tienes el `.sqlite` con las 5 tablas y puedes insertar/leer un producto de prueba con sus ingredientes y certificaciones.

---

## Fase 1 — Scraper de creatina (validar la fontanería)

*Creatina primero porque el score es trivial (todo es monohidrato, 5 g): así te concentras en que el pipeline funcione, no en la lógica.*

```
Tengo un esquema SQLite (adjunto/en /data) para un comparador de suplementos.
Quiero un scraper en Python que extraiga SOLO la categoría creatina de estas
tiendas españolas: HSN, Prozis, MyProtein, Nutritienda, MASmusculo.

Requisitos:
- Un módulo por tienda con una interfaz común (clase base Scraper con método
  .extraer() que devuelve una lista de dicts normalizados). Cada tienda cambia
  su HTML, así que aísla los selectores por tienda.
- Campos a extraer por producto: marca, nombre, url, formato_gramos, precio_eur,
  forma (monohidrato/HCL/etc si la ficha lo dice), y CUALQUIER mención de sello
  (Creapure, Informed Sport, etc.) tal cual aparezca en la ficha — SIN verificarla
  aún (eso es otra fase). Guárdala como certificacion nivel 2 ("declarado").
- Normaliza: precio_por_kg calculado, marcas con nombre canónico (mapa de alias),
  ingrediente "creatina_monohidrato" normalizado.
- Respeta robots.txt, mete delays y User-Agent honesto. Si una tienda bloquea,
  documenta el bloqueo, no fuerces.
- Persistencia idempotente: reejecutar no duplica; actualiza precio y fecha_scrape.
- Registra en log qué extrajo y qué falló por tienda.

Estructura el código para que añadir una 6ª tienda sea crear un módulo nuevo,
no tocar el core. Entrégame también un script `run_scraper.py` que corra todas
las tiendas y vuelque a la BD.

[+ GUARDARRAÍLES PERMANENTES]
```

**Hecho cuando:** ejecutas `run_scraper.py` y tienes en la BD las creatinas reales de al menos 3 de las 5 tiendas, con precio y €/kg correctos, verificado a mano contra la web.

---

## Fase 2 — Capa de certificaciones y verificación

*Aquí está parte del foso, y es semi-manual a propósito. Sé honesto con la herramienta sobre qué se puede automatizar y qué no.*

```
Sobre el comparador de suplementos. Quiero la capa que convierte "sello mencionado
en la ficha" en "sello verificado", según una escala de 4 niveles ya definida en
la tabla certificacion.

Realidad a tener en cuenta (no la ignores):
- Creapure: la verificación real es un código QS de 6 dígitos que está en el ENVASE
  físico, se comprueba en creapure.com. NO está en la ficha de la tienda. Por tanto
  esto NO se puede automatizar a escala: prepáralo como flujo de curación MANUAL
  (una vista donde yo, o alguien, mete el código QS y marca nivel 4).
- Informed Sport / Informed Choice / IFOS: publican bases de lotes/productos
  consultables. Donde exista una lista pública consultable, intenta un verificador
  automático que cruce marca+producto contra esa lista y suba a nivel 4. Donde no,
  déjalo en curación manual.
- Análisis de marca (caso Life Pro, pureza >99% publicada por la propia marca sin
  sello): eso es nivel 3. Necesito un campo url_evidencia y una nota de que lo
  aporta la parte interesada.

Construye:
1. Un verificador automático para lo que SÍ se pueda cruzar contra fuente pública.
2. Un pequeño panel de curación manual (puede ser un CLI o una tabla editable) para
   meter códigos QS, urls de análisis y subir/bajar niveles a mano.
3. Que cada certificación quede con nivel, fuente y fecha de verificación.

No marques nada como nivel 4 sin comprobación real contra fuente. Un sello impreso
o mencionado NO es verificación: ha habido marcas que falsifican logos.

[+ GUARDARRAÍLES PERMANENTES]
```

**Hecho cuando:** puedes coger una creatina con "Creapure" en la ficha, meter su código QS a mano, y que quede registrada como nivel 4 con fecha; y las que solo lo declaran quedan en nivel 2.

---

## Fase 3 — Tabla de dosis de referencia + motor de scoring

*El corazón del proyecto. Aquí es donde tu tabla vale oro y donde preentrenos deja en ridículo a los comparadores de solo precio.*

```
Sobre el comparador de suplementos. Quiero el motor de scoring en TypeScript
(lógica pura, testeable, sin dependencias de red). Lee de la BD y escribe en la
tabla score.

Concepto central: NO comparamos €/kg de producto. Comparamos calidad y coste por
DOSIS EFECTIVA del principio activo. Un producto puede ser barato por gramo y una
estafa por dosis (infradosaje / "fairy dusting").

La tabla dosis_referencia la relleno yo. Ejemplo ilustrativo de cómo la usarás
(VERIFICA y CITA tú las cifras reales antes de fiarte de ninguna):
- citrulina_malato: efectiva 6000-8000 mg/servicio [fuente]
- beta_alanina: efectiva 3200-6400 mg/servicio [fuente]
- cafeina: efectiva 3-6 mg/kg peso corporal [fuente]
- creatina_monohidrato: efectiva 3000-5000 mg/día [fuente]

Lógica del motor, en dos modos:

MODO SIMPLE (categorías tipo creatina, un solo activo estándar):
- score_calidad = f(nivel_verificacion_certificacion, forma correcta, pureza declarada)
- coste_por_dosis_efectiva = precio / (nº de dosis efectivas que da el envase)
- score_final combina ambos, con la calidad como filtro y el coste como ordenador.

MODO COMPLEJO (preentrenos, multivitamínicos, fórmulas):
- Para CADA ingrediente clave del producto, compara dosis_por_servicio contra
  dosis_referencia y calcula un "ratio de adecuación de dosis" (dosis_real /
  dosis_efectiva_min).
- flag_infradosaje = true si un ingrediente clave está presente pero por debajo de,
  p.ej., el 60% de su dosis efectiva mínima (umbral configurable).
- Calcula cuántos servicios (scoops) harían falta para alcanzar dosis efectiva de
  los ingredientes principales, y expresa el coste como €/servicio-efectivo real
  (si necesitas 2 scoops para llegar a dosis, el coste real se dobla).
- score_calidad penaliza el fairy dusting y premia que los activos clave estén en
  rango efectivo y en la forma preferida.

Requisitos:
- Todo el peso de cada factor debe ser un parámetro configurable en un solo sitio
  (un fichero de config), para poder ajustar la metodología sin tocar el código.
- Cada score_final debe poder "explicarse": genera junto al número un desglose
  legible ("penalizado por citrulina a 3g de 6g recomendados") que luego mostraré
  en la web. La transparencia del cálculo ES el producto.
- Tests unitarios con casos: producto bien dosificado caro vs mal dosificado barato,
  y comprueba que el bien dosificado gana.

[+ GUARDARRAÍLES PERMANENTES]
```

**Hecho cuando:** metes dos preentrenos reales —uno bien dosificado y caro, otro barato e infradosificado— y el motor coloca primero al bueno, con el desglose explicando por qué.

---

## Fase 4 — La web en Astro

*Ahora sí, la página. Estática, generada desde el dataset. Aquí defines qué debe ser cada página.*

```
Sobre el comparador de suplementos. Quiero la web en Astro 4 con islas React solo
donde haga falta interacción (filtros, ordenación). Generación estática desde la BD
en build: nada de llamar a la BD en runtime.

Páginas:

1. Home: explica en una frase qué hace la web (comparar calidad-precio real, no solo
   precio) y enlaza a las categorías disponibles. Sobria, sin humo.

2. Página de categoría (ej: /creatina, /preentrenos): tabla/listado de productos
   ordenados por score_final. Cada fila muestra: marca+nombre, tiendas donde está y
   precio, €/dosis-efectiva, nivel de verificación de certificación (con un icono claro
   por nivel 1-4), y el score. Filtros: por tienda, por nivel de certificación mínimo,
   por rango de precio. Ordenación configurable. Isla React solo para esto.

3. Página de producto (/producto/[slug]): ficha completa con el DESGLOSE del score
   (el "por qué" que genera el motor), ingredientes con su dosis vs dosis efectiva de
   referencia (barra visual: en rango / infradosificado), certificaciones con su nivel
   y enlace a la evidencia, y precios por tienda. Aquí NADA de afirmaciones de salud:
   los efectos se atribuyen al ingrediente con su cita, nunca al producto.

4. Página de metodología (/metodologia): explica en cristiano cómo se calcula el score,
   qué significan los 4 niveles de verificación, y por qué un análisis que paga la propia
   marca (nivel 3) vale menos que un código QS verificado por un tercero (nivel 4). Esta
   página es la que sostiene la credibilidad de todo. Escríbela con rigor.

Diseño: limpio, legible, mobile-first, rápido. Sin dark patterns. El nivel de
verificación y el desglose del score deben ser lo más visible, porque son el
diferencial frente a los comparadores de solo precio.

[+ GUARDARRAÍLES PERMANENTES]
```

**Hecho cuando:** `astro build` genera un sitio estático navegable con la categoría creatina real, fichas de producto con desglose, y la página de metodología escrita.

---

## Fase 5 — Afiliación con disclosure

*Desde el principio en cuanto tengas la web, no "más adelante": paga mucho mejor que ads y, bien hecho, no mancha nada. Los ads sí conviene retrasarlos.*

```
Sobre el comparador de suplementos. Quiero integrar enlaces de afiliado a las tiendas
(HSN, Prozis, MyProtein, etc. — daré de alta los programas) SIN comprometer la
independencia del ranking.

Requisitos:
- Una tabla/config de enlaces de afiliado por producto+tienda. Si un producto no tiene
  programa de afiliado, se enlaza igual a la tienda con enlace normal y aparece en el
  ranking en su posición por score, exactamente igual que los demás.
- El score y el orden NO leen esta tabla jamás. Verifícalo con un test: cambia los
  enlaces de afiliado y comprueba que el ranking no se mueve ni un puesto.
- Disclosure visible en cada página con enlaces (no en el footer enterrado): una línea
  clara de que la web puede ganar comisión por algunas compras y que eso no afecta al
  orden ni a la puntuación.
- Los enlaces de afiliado con rel="sponsored" y los atributos correctos.

[+ GUARDARRAÍLES PERMANENTES]
```

**Hecho cuando:** los productos enlazan a tienda con tu afiliado donde exista, el disclosure es visible, y el test confirma que el ranking es idéntico con o sin enlaces de afiliado.

---

## Fase 6 — Sello de recomendación + metodología pública

*El último paso, no el primero. El sello solo vale si detrás hay una metodología ya probada en al menos una categoría real. Si lo sacas antes, es una pegatina que te has puesto tú.*

```
Sobre el comparador de suplementos. Ya tengo el score funcionando y la página de
metodología. Quiero un "sello de recomendación" propio.

Reglas del sello (importantes, legales):
- El sello certifica MI CRITERIO EDITORIAL, no promete un efecto fisiológico.
  Texto válido: "Mejor calidad-precio verificada" / "Verificado nivel 4". Texto
  PROHIBIDO: cualquier cosa que insinúe salud o resultados ("el mejor para ganar
  músculo").
- El sello se otorga por umbral objetivo del score, definido y público en la página
  de metodología, no a dedo. Debe poder responderse "¿por qué este producto tiene el
  sello?" con el desglose del score.
- Distintos niveles de sello si quieres (ej: "Verificado" para nivel 4 de certificación,
  "Mejor calidad-precio" para el nº1 por score de su categoría), cada uno con criterio
  público.

Construye el componente del sello, la lógica que lo asigna por umbral, y añade a la
página de metodología la explicación de qué significa cada sello y cómo se gana.

[+ GUARDARRAÍLES PERMANENTES]
```

**Hecho cuando:** el sello aparece solo en productos que cruzan un umbral público y objetivo, y cualquiera puede leer en /metodologia por qué.

---

## Fase 7 — Escalado y ads (opcional, tardío)

```
Sobre el comparador de suplementos, ya funcionando con creatina y preentrenos.

1. ESCALADO: añade una categoría nueva siguiendo el patrón: extender dosis_referencia
   para sus ingredientes (con fuentes), añadir el módulo de scraper de esa categoría,
   y validar que el motor de scoring la maneja sin tocar el core. Empieza por la
   categoría donde el juicio de dosis aporte más valor (proteína, omega-3 con IFOS...).

2. ADS (solo si hay tráfico real y lo decides): integra display de forma que NO
   estorbe la percepción de independencia — nunca intercalado en el ranking, nunca
   confundible con un producto recomendado, claramente separado como publicidad.
   Si tienes que elegir entre ads y confianza, elige confianza: la afiliación ya
   monetiza mejor en este nicho.

[+ GUARDARRAÍLES PERMANENTES]
```

---

## Orden de arranque, en una línea

Fase 0 (esquema) → 1 (scraper creatina) → 2 (verificar certificados) → 3 (dosis + scoring, aquí entra preentrenos) → 4 (web) → 5 (afiliación) → 6 (sello) → 7 (más categorías; ads si acaso).

**No saltes la fase 3 antes de la 1.** La tentación es empezar por lo interesante (el scoring de preentrenos). Pero sin el scraper y los datos reales de creatina funcionando, el motor no tiene qué comer y no puedes validar nada.

---

## Tres cosas que decidir antes de escribir código

1. **De dónde salen las dosis de referencia.** Es tu activo. No lo pobles con números de memoria (ni míos ni tuyos): cada cifra con su fuente. Empieza por creatina (fácil) y prepara con calma la de preentrenos, que es la que te diferencia.

2. **Hasta dónde llega tu web legalmente.** Reportas hechos y atribuyes evidencia al ingrediente con cita. No prescribes, no prometes salud. El sello es criterio editorial, no promesa fisiológica. Si dudas de una frase, pásala a hecho verificable o quítala.

3. **Una categoría entera antes de la segunda.** Creatina completa —scraper, verificación, score, web, afiliación— y solo entonces preentrenos. Validar el ciclo completo en lo fácil te ahorra rehacerlo cinco veces en lo difícil.
