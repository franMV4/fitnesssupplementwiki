"""Que tiene que cumplir un producto para ser lo que su categoria dice que es.

El precio por kilo no distingue un kilo de creatina de un kilo de creatina con un tercio
de maltodextrina: el segundo sale mas barato y rinde menos. La certificacion tampoco lo
ve, porque certifica que no hay dopantes, no que no haya relleno. Este fichero es la
tercera pregunta, la que faltaba: **¿esto es lo que dice ser, o se ha abaratado con otra
cosa?**

Cada requisito es objetivo y comprobable contra lo que la propia ficha publica, lleva
escrito el porque (esta pagina se publica en /metodologia: si no sabes defenderlo, no lo
pongas) y solo cuenta cuando hay con que juzgarlo:

  fuente="ficha"    el nombre del producto, que existe siempre. Solo para PROHIBIR:
                    ver "oxido de magnesio" en el nombre es la prueba; no verlo no lo es.
  fuente="declara"  pide un dato DECLARADO (la forma quimica, las UFC, el peso molecular)
                    y lo busca en la descripcion de la tienda. Una ficha que solo publica
                    el nombre no suspende: no se le juzga.
  fuente="lista"    necesita la lista de ingredientes de la etiqueta. Si la tienda no la
                    publica, ese requisito NO cuenta: no se puede afirmar que un bote
                    lleva relleno porque su tienda no diga lo que lleva, ni lo contrario.
  fuente="tabla"    necesita la tabla nutricional (la pureza real por 100 g).
  fuente="dosis"    necesita que la ficha publique los mg de sus activos.

La nota de un producto es "de los requisitos que se le han podido juzgar, cuantos cumple".
Un producto al que no se le puede juzgar ninguno se queda con la media de su categoria: ni
premio ni castigo, igual que con las opiniones.

    python -m scoring.requisitos            # cuantos requisitos tiene cada categoria
    python -m scoring.requisitos creatina   # los de una, con su texto publicable
"""

import re
import sys

import categorias


def req(id, que, porque, fuente="ficha", exige=None, prohibe=None):
    """Un requisito. `exige` incumple si NO aparece; `prohibe`, si aparece.

    Un `exige` sobre la ficha se convierte solo en fuente "declara", que es lo que de
    verdad necesita: un dato DECLARADO. Ningun nombre de producto dice su peso molecular,
    sus UFC ni su porcentaje de withanolidos -eso vive en la descripcion-, asi que
    juzgarlo con el nombre a secas daba un 0 % en categorias enteras. No medía el mercado,
    medía que yo estaba mirando donde no era.
    """
    assert exige or prohibe, "%s no comprueba nada" % id
    if fuente == "ficha" and exige:
        fuente = "declara"
    return {"id": id, "que": que, "porque": porque, "fuente": fuente,
            "exige": exige, "prohibe": prohibe}


# --- piezas que se repiten entre categorias --------------------------------------
# Escritas una vez y repartidas por familias: cincuenta categorias con sus requisitos a
# mano serian cincuenta sitios donde corregir la misma frase.

# Lo que abarata un polvo sin que se note en el precio por kilo. Solo se aplica a los
# POLVOS: en una capsula, la celulosa y el estearato son la capsula y el antiadherente de
# la maquina, no relleno, y penalizarlos seria penalizar que el producto exista.
#
# Las harinas van UNA A UNA y no como "harina de": la harina de arroz y la de maiz son
# peso barato, pero la de cacahuete de una whey con sabor a cacahuete es el sabor, y con
# el patron generico toda esa gama salia marcada como rebajada. Un requisito que castiga
# a un producto por saber a lo que dice saber no vale para nada.
RELLENOS = (r"maltodextrina|dextrosa|almid[oó]n|inulina|polidextrosa|jarabe de glucosa|"
            r"celulosa microcristalina|suero en polvo|lactosa|"
            r"harina de (?:arroz|ma[ií]z|trigo|soja|avena)")

# Aminoacidos baratos anadidos sueltos a una proteina. Suben el nitrogeno que mide el
# analisis de Kjeldahl -y con el la "proteina" de la etiqueta- sin aportar lo que se
# compra. Es el fraude clasico del sector y tiene nombre propio: amino spiking.
AMINO_SPIKING = r"glicina|taurina|l-alanina|\balanina\b|acido glutamico|glutamato"

# Proteinas mas baratas que la de suero, mezcladas para bajar el coste del bote. El
# colageno ademas no tiene los nueve aminoacidos esenciales: como proteina de dieta no
# hace el mismo trabajo.
PROTEINA_BARATA = r"col[aá]geno|gelatina|prote[ií]na de soja|prote[ií]na de trigo|caseinato"

# Formas de mineral que se absorben mal. No son un fraude: son la version barata, y a
# igual precio por capsula no es el mismo producto.
MINERAL_POBRE = r"[oó]xido de|carbonato de|sulfato de(?! glucosamina)"
MINERAL_BUENO = (r"bisglicinato|glicinato|citrato|quelato|quelad|malato|picolinato|"
                 r"gluconato|treonato|taurato|orotato|aspartato|bisglycinate")

# Un extracto botanico sin porcentaje ni ratio es polvo de planta molida: puede llevar el
# activo o no llevarlo, y la ficha no permite saberlo.
ESTANDARIZADO = r"estandarizado|standardi|\d+\s*[:1]\s*1|\d+\s*%|extracto seco|KSM|Sensoril"


def polvo_puro(activo, patron_activo, otros=None, forma_ya_juzgada=False):
    """Requisitos de un polvo de un solo ingrediente: creatina, glutamina, beta-alanina...

    Dos preguntas: ¿el bote es el activo, o lleva azucar barato dentro? y ¿la ficha dice
    que forma es, o hay que fiarse?

    `forma_ya_juzgada` quita la segunda donde el motor YA la puntua: en las categorias
    cuya dosis de referencia declara una forma_preferida (creatina, citrulina), el factor
    de forma de la calidad ya baja la nota a 0,60 por no declararla. Cobrar dos veces la
    misma falta -una en calidad y otra en requisitos- no la hace mas grave: solo hunde a
    esos productos el doble de lo que dice la metodologia publicada.
    """
    fuera = [
        req("sin_relleno",
            "El bote es solo %s, sin rellenos" % activo,
            "Un kilo de %s con un tercio de maltodextrina cuesta menos por kilo y rinde un "
            "tercio menos. El precio por kilo no distingue las dos cosas; la lista de "
            "ingredientes, si." % activo,
            fuente="lista", prohibe=RELLENOS),
    ]
    if not forma_ya_juzgada:
        fuera.append(req(
            "activo_nombrado",
            "La ficha dice que lleva %s y en que forma" % activo,
            "Un producto que no nombra su propio activo en la ficha no se puede comparar "
            "con los que si lo hacen.",
            fuente="ficha", exige=patron_activo))
    if otros:
        fuera.append(req(
            "sin_mezcla",
            "No es una mezcla con otros activos",
            "Una mezcla puede ser buena, pero no se compara por el kilo con el ingrediente "
            "solo: parte de lo que pagas es otra cosa y la tabla estaria comparando peras "
            "con manzanas.",
            fuente="ficha", prohibe=otros))
    return fuera


def proteina(pureza_min, fuente_esperada):
    """Requisitos de un bote de proteina. `fuente_esperada` es la que da nombre a la
    categoria: suero, guisante, caseina..."""
    return [
        req("pureza_suficiente",
            "Al menos %d g de proteina por cada 100 g de polvo" % (pureza_min * 100),
            "Es la diferencia entre pagar por proteina y pagar por lo que la acompana. Por "
            "debajo de %d %% el bote es mas azucar, grasa y aroma que otra cosa, y el precio "
            "por kilo no lo dice." % (pureza_min * 100),
            fuente="tabla", exige=("pureza", pureza_min)),
        req("sin_amino_spiking",
            "Sin aminoacidos sueltos anadidos",
            "La glicina, la taurina y la alanina son aminoacidos baratos que suben el "
            "nitrogeno que mide el analisis -y con el la proteina que declara la etiqueta- "
            "sin aportar lo que se compra. El sector lo llama amino spiking.",
            fuente="lista", prohibe=AMINO_SPIKING),
        req("sin_proteina_barata",
            "La proteina es de %s, no rebajada con otra mas barata" % fuente_esperada,
            "El colageno y la proteina de soja cuestan una fraccion de lo que cuesta el "
            "suero. Mezclados suben los gramos de proteina de la etiqueta y bajan el coste "
            "del bote; el colageno ademas no lleva los nueve aminoacidos esenciales.",
            fuente="lista", prohibe=PROTEINA_BARATA),
        req("sin_relleno",
            "Sin harinas ni azucares de relleno",
            "La maltodextrina y la harina son el carbohidrato mas barato del mercado. En un "
            "bote que se vende por su proteina, cada gramo suyo es un gramo que no es lo "
            "que has ido a comprar.",
            fuente="lista", prohibe=RELLENOS),
    ]


def mineral(nombre, patron):
    return [
        req("forma_biodisponible",
            "En una forma que se absorbe: bisglicinato, citrato o quelato",
            "El oxido de magnesio se absorbe en torno al 4 %% y el bisglicinato muy por "
            "encima. Al mismo precio por capsula no es el mismo producto, y la etiqueta de "
            "los dos pone los mismos miligramos de %s." % nombre,
            fuente="ficha", exige=MINERAL_BUENO),
        req("no_forma_pobre",
            "No es oxido, carbonato ni sulfato",
            "Son las formas baratas. Rellenan los miligramos que declara la etiqueta con "
            "mineral que en su mayor parte no se absorbe.",
            fuente="ficha", prohibe=MINERAL_POBRE),
        req("activo_nombrado",
            "La ficha dice que forma quimica es",
            "Una ficha que no dice la forma no permite saber cual de las dos anteriores es. "
            "En un mineral, la forma ES el producto.",
            fuente="ficha", exige=patron),
    ]


def botanico(planta, patron_activo, nombre_activo):
    return [
        req("extracto_estandarizado",
            "Extracto estandarizado, con su ratio o su porcentaje",
            "Un %s sin ratio ni porcentaje es planta molida: puede llevar el activo o no "
            "llevarlo, y la ficha no permite saberlo. Un extracto estandarizado se "
            "compromete con una cifra." % planta,
            fuente="ficha", exige=ESTANDARIZADO),
        req("activo_declarado",
            "Declara su %s" % nombre_activo,
            "Es lo que tienen los estudios de %s. Sin esa cifra, dos botes al mismo precio "
            "pueden llevar diez veces mas uno que otro." % planta,
            fuente="ficha", exige=patron_activo),
    ]


# --- los requisitos de cada categoria --------------------------------------------
# Anadir una categoria = una entrada aqui. Si no la tiene, sus productos se puntuan sin
# esta parte y la web lo dice: no hay requisitos por defecto ni inventados.

REQUISITOS = {
    # La forma de la creatina y la de la citrulina ya las puntua el factor de forma de la
    # calidad, porque su dosis de referencia declara una forma_preferida. Aqui solo se
    # mira que el bote sea el activo y no una mezcla.
    "creatina": polvo_puro(
        "creatina", r"monohidrato|monohydrate|creapure|micronizad|hcl|kre[\s-]?alkalyn|"
                    r"clorhidrato|citrato|malato", forma_ya_juzgada=True,
        otros=r"\bmatrix\b|\bblend\b|transport|\bcon\b\s+(?:carbohidratos|hmb|beta)"),

    "glutamina": polvo_puro("glutamina", r"glutamina|glutamine"),
    "beta_alanina": polvo_puro("beta-alanina", r"beta[\s-]?alanina|beta[\s-]?alanine|carnosyn"),
    "citrulina": polvo_puro(
        "citrulina", r"citrulina|citrulline", forma_ya_juzgada=True,
        otros=r"matrix|blend|preentreno|pre[\s-]?workout|con\s+(?:beta|arginina)"),
    "taurina": polvo_puro("taurina", r"taurina|taurine"),
    "arginina": polvo_puro("arginina", r"arginina|arginine|\baakg\b"),

    "bcaa": polvo_puro("BCAA", r"\d+\s*[:.]\s*1\s*[:.]\s*1|leucina|bcaa") + [
        req("ratio_declarado",
            "Declara su ratio de leucina",
            "El 2:1:1 es el de los estudios. Un BCAA que no dice su ratio puede llevar "
            "cualquier proporcion, y la leucina es la cara y la que hace el trabajo.",
            fuente="ficha", exige=r"\d+\s*[:.]\s*1\s*[:.]\s*1|leucina"),
    ],
    "eaa": polvo_puro("EAA", r"\beaa\b|esenciales|essential") + [
        req("los_nueve",
            "Lleva los nueve aminoacidos esenciales",
            "Un EAA al que le faltan aminoacidos es un BCAA caro con otro nombre: lo que "
            "define la categoria es que esten los nueve.",
            fuente="ficha", exige=r"\b9\b|nueve|los esenciales|complete|completo"),
    ],

    "proteina_whey": proteina(0.70, "suero"),
    "proteina_aislada": proteina(0.80, "suero aislado") + [
        req("es_aislado",
            "Es aislado de verdad, no un concentrado con otro nombre",
            "Un aislado se paga por su pureza. Si la ficha no dice isolate ni aislado, lo "
            "que se esta comprando a precio de aislado es otra cosa.",
            fuente="ficha", exige=r"isolat|aislad|hidroliz|hydrolys"),
    ],
    "proteina_vegana": proteina(0.70, "origen vegetal"),
    "caseina": proteina(0.70, "caseina") + [
        req("micelar",
            "Es caseina micelar, no caseinato",
            "La micelar es la que libera despacio, que es para lo que se compra una "
            "caseina. El caseinato se digiere mas rapido y cuesta menos de fabricar.",
            fuente="ficha", exige=r"micelar|micellar"),
    ],
    "colageno": [
        req("hidrolizado",
            "Colageno hidrolizado (peptidos), no gelatina",
            "Los estudios estan hechos con peptidos de colageno hidrolizado. La gelatina es "
            "el mismo colageno sin hidrolizar, cuesta menos y no se absorbe igual.",
            fuente="ficha", exige=r"hidroliz|hydroly|p[eé]ptid|peptan|verisol|fortigel"),
        req("sin_relleno",
            "Sin azucares ni harinas de relleno",
            "Un colageno se vende por gramos de colageno. Cada gramo de maltodextrina del "
            "bote es un gramo que no lo es.",
            fuente="lista", prohibe=RELLENOS),
        req("origen_declarado",
            "Dice de donde viene el colageno",
            "Bovino, porcino o marino no rinden igual ni valen para todo el mundo, y el "
            "marino cuesta bastante mas. Una ficha que no lo dice no permite elegir.",
            fuente="ficha", exige=r"bovino|porcino|marino|pescado|bovine|marine|vacuno"),
    ],

    "omega3": [
        req("epa_dha_declarados",
            "Declara sus miligramos de EPA y DHA",
            "Lo que se compra es el EPA y el DHA, no los miligramos de aceite. Un bote de "
            "1000 mg de aceite puede llevar 300 mg de omega 3 o 700, y la unica dosis con "
            "respaldo (EFSA) esta escrita en EPA+DHA.",
            fuente="ficha", exige=r"\bepa\b|\bdha\b|eicosapentaenoico|docosahexaenoico"),
        req("forma_triglicerido",
            "En forma de trigliceridos, no de ester etilico",
            "El ester etilico es la forma barata de concentrar el aceite y se absorbe peor. "
            "Los reesterificados (rTG) lo dicen en la ficha porque cuestan mas de hacer.",
            fuente="ficha", exige=r"triglic|\brtg\b|\btg\b|reesterific"),
        req("analisis_oxidacion",
            "Publica su analisis de frescura o su certificacion",
            "El aceite de pescado se oxida, y un aceite rancio no solo no sirve: es peor "
            "que no tomarlo. IFOS, TOTOX y los analisis por lote son lo unico que lo dice.",
            fuente="ficha", exige=r"\bifos\b|totox|frescura|analisis por lote|epax|nordic"),
    ],

    "magnesio": mineral("magnesio", r"bisglicinato|citrato|malato|treonato|carbonato|"
                                    r"[oó]xido|cloruro|taurato|lactato|glicinato"),
    "zinc": mineral("zinc", r"bisglicinato|picolinato|citrato|gluconato|[oó]xido|sulfato|"
                            r"monometionina"),
    "hierro": mineral("hierro", r"bisglicinato|fumarato|sulfato|gluconato|pirofosfato|"
                                r"[oó]xido|carbonilo"),
    "calcio": mineral("calcio", r"citrato|carbonato|bisglicinato|gluconato|lactato|"
                                r"hidroxiapatita|coral"),
    "potasio": mineral("potasio", r"citrato|cloruro|gluconato|bicarbonato|aspartato"),
    "selenio": [
        req("forma_organica",
            "Selenio organico (selenometionina o levadura), no selenito",
            "La selenometionina es la forma de los estudios y la que el cuerpo almacena. El "
            "selenito de sodio es la sal inorganica barata.",
            fuente="ficha", exige=r"selenometionina|levadura|organic|selenocist"),
        req("dosis_declarada",
            "Declara los microgramos por capsula",
            "El selenio tiene una ventana estrecha: la dosis de seguridad de EFSA son 300 "
            "µg al dia. Sin la cifra en la ficha no se puede saber si se pasa.",
            fuente="ficha", exige=r"\d+\s*(?:µg|mcg|ug)\b"),
    ],
    "zma": [
        req("los_tres",
            "Lleva zinc, magnesio y vitamina B6",
            "Es lo que significa la sigla. Un ZMA al que le falta uno de los tres no es la "
            "formula que estudiaron.",
            fuente="ficha", exige=r"(?=.*zinc)(?=.*magnesio)(?=.*b6|.*piridoxina)"),
        req("forma_biodisponible",
            "En formas que se absorben, no en oxido",
            "El ZMA original se hizo con aspartato de magnesio y monometionina de zinc. Un "
            "ZMA de oxido cuesta la mitad de fabricar y se absorbe mucho peor.",
            fuente="ficha", exige=MINERAL_BUENO + r"|monometionina"),
    ],

    "vitamina_d": [
        req("es_d3",
            "Es vitamina D3 (colecalciferol), no D2",
            "La D3 sube y mantiene los niveles en sangre mejor que la D2 a igual dosis, y "
            "cuesta practicamente lo mismo.",
            fuente="ficha", exige=r"\bd3\b|colecalciferol|cholecalciferol"),
        req("dosis_declarada",
            "Declara sus UI o microgramos por capsula",
            "Entre 400 UI y 4000 UI hay diez veces la dosis y casi el mismo precio de "
            "fabricacion. Sin la cifra, el precio por capsula no compara nada.",
            fuente="ficha", exige=r"\d+\s*(?:ui\b|iu\b|µg|mcg|ug\b)"),
    ],
    "vitamina_b12": [
        req("forma_activa",
            "Metilcobalamina o adenosilcobalamina, no cianocobalamina",
            "Las dos formas activas son las que el cuerpo usa directamente. La "
            "cianocobalamina es la sintetica barata y hay que convertirla.",
            fuente="ficha", exige=r"metilcobalamina|adenosilcobalamina|hidroxocobalamina|"
                                  r"methylcobalamin"),
        req("dosis_declarada",
            "Declara sus microgramos por capsula",
            "Las dosis van de 10 µg a 5000 µg con precios parecidos: sin la cifra no hay "
            "comparacion posible.",
            fuente="ficha", exige=r"\d+\s*(?:µg|mcg|ug)\b"),
    ],
    "vitamina_k2": [
        req("es_mk7",
            "Es K2 en forma MK-7",
            "La MK-7 se mantiene en sangre mucho mas tiempo que la MK-4, que es la que se "
            "usa cuando se quiere abaratar la formula.",
            fuente="ficha", exige=r"mk[\s-]?7|menaquinona[\s-]?7|k2vital|menaq"),
        req("dosis_declarada",
            "Declara sus microgramos por capsula",
            "La dosis de los estudios son de 90 a 200 µg. Sin la cifra no se sabe si el "
            "bote llega.",
            fuente="ficha", exige=r"\d+\s*(?:µg|mcg|ug)\b"),
    ],
    "vitamina_e": [
        req("natural",
            "Tocoferol natural (d-alfa), no sintetico (dl-alfa)",
            "El sintetico rinde alrededor de la mitad por miligramo. La etiqueta los "
            "distingue con una sola letra y la mayoria de las fichas no lo explican.",
            fuente="ficha", exige=r"\bd-alfa|d-alpha|natural|tocoferoles mezclados|"
                                  r"mixed tocopherol|tocotrienol"),
        req("dosis_declarada",
            "Declara sus miligramos o UI por capsula",
            "Sin la cifra, dos capsulas al mismo precio pueden llevar el triple una que "
            "otra.",
            fuente="ficha", exige=r"\d+\s*(?:mg|ui\b|iu\b)"),
    ],
    "vitamina_c": [
        req("dosis_declarada",
            "Declara sus miligramos por capsula",
            "Es lo unico que separa una vitamina C de otra: el acido ascorbico es el mismo "
            "en todas y lo que cambia es cuanto trae.",
            fuente="ficha", exige=r"\d+\s*(?:mg|g)\b"),
        req("sin_relleno_de_azucar",
            "Sin azucares anadidos",
            "Los efervescentes y masticables llevan azucar o edulcorante como grueso del "
            "comprimido, y se comparan por capsula con capsulas que son solo vitamina.",
            fuente="lista", prohibe=r"az[uú]car|sacarosa|glucosa|jarabe|dextrosa"),
    ],
    "complejo_b": [
        req("formas_activas",
            "Con las formas activas de folato y B12",
            "El metilfolato y la metilcobalamina son las formas que el cuerpo usa. El acido "
            "folico y la cianocobalamina son las sinteticas baratas.",
            fuente="ficha", exige=r"metilfolato|5-mthf|quatrefolic|metilcobalamina|"
                                  r"p-5-p|p5p|piridoxal"),
        req("las_ocho",
            "Lleva las ocho vitaminas del grupo B",
            "Es lo que define un complejo B. Un bote con cuatro es un bote con cuatro.",
            fuente="ficha", exige=r"\bb12\b.*\bb6\b|complejo|complex|\b8\b|ocho"),
    ],
    "colina": [
        req("forma_declarada",
            "Dice que forma de colina lleva",
            "El bitartrato, la alfa-GPC y la citicolina no cuestan lo mismo ni llegan igual "
            "al cerebro. Una ficha que solo pone colina no permite elegir.",
            fuente="ficha", exige=r"bitartrato|alfa[\s-]?gpc|alpha[\s-]?gpc|citicolina|"
                                  r"cdp[\s-]?colina|fosfatidilcolina"),
        req("dosis_declarada",
            "Declara sus miligramos por capsula",
            "Las dosis utiles van de 300 a 1000 mg y hay botes de 50. Sin la cifra el "
            "precio por capsula no dice nada.",
            fuente="ficha", exige=r"\d+\s*mg"),
    ],

    "ashwagandha": botanico("ashwagandha", r"withan[oó]lido|withanolide|ksm|sensoril|\d+\s*%",
                            "porcentaje de withanolidos"),
    "curcuma": botanico("curcuma", r"curcuminoide|curcumin|95\s*%|piperina|bioperine|"
                                   r"meriva|fitosoma", "porcentaje de curcuminoides"),
    "te_verde": botanico("te verde", r"egcg|catequina|polifenol|\d+\s*%",
                         "porcentaje de EGCG"),
    "maca": botanico("maca", r"macamida|gelatinizada|\d+\s*[:1]\s*1|\d+\s*%",
                     "ratio de extracto"),
    "tribulus": botanico("tribulus", r"saponina|protodioscina|\d+\s*%",
                         "porcentaje de saponinas"),
    "espirulina": [
        req("origen_declarado",
            "Dice de donde viene y si esta analizada de metales",
            "La espirulina concentra los metales pesados del agua en la que crece. El "
            "origen y el analisis son la unica diferencia real entre dos botes.",
            fuente="ficha", exige=r"analiz|metales|ecol[oó]gic|organic|hawai|certificad|"
                                  r"origen"),
        req("sin_relleno",
            "Es espirulina, sin rellenos",
            "Se vende por gramos de alga. Lo que no es alga es peso que se paga a precio "
            "de alga.",
            fuente="lista", prohibe=RELLENOS),
    ],
    "glucosamina": [
        req("es_sulfato",
            "Sulfato de glucosamina, no clorhidrato",
            "Los ensayos que dieron resultado se hicieron con sulfato de glucosamina "
            "cristalino. El clorhidrato es mas barato y es el que suele fallar en los "
            "estudios.",
            fuente="ficha", exige=r"sulfato|sulphate|sulfate"),
        req("dosis_declarada",
            "Declara sus miligramos por capsula",
            "La dosis estudiada son 1500 mg al dia. Sin la cifra no se sabe cuantas "
            "capsulas hacen falta ni cuanto cuesta de verdad el dia.",
            fuente="ficha", exige=r"\d+\s*mg"),
    ],
    "acido_hialuronico": [
        req("peso_molecular",
            "Declara su peso molecular",
            "El bajo peso molecular es el que se absorbe por via oral y el que tienen los "
            "estudios. Sin esa cifra, un hialuronico oral puede no llegar a ninguna parte.",
            fuente="ficha", exige=r"peso molecular|\bkda\b|\bdalton|bajo peso|low molecular"),
        req("dosis_declarada",
            "Declara sus miligramos por capsula",
            "Las dosis de los ensayos van de 120 a 240 mg al dia.",
            fuente="ficha", exige=r"\d+\s*mg"),
    ],
    "coenzima_q10": [
        req("forma_declarada",
            "Dice si es ubiquinona o ubiquinol",
            "El ubiquinol es la forma reducida, se absorbe mejor y cuesta bastante mas. Una "
            "ficha que solo pone Q10 se esta comparando con las dos.",
            fuente="ficha", exige=r"ubiquinol|ubiquinona|ubiquinone|kaneka"),
        req("con_grasa",
            "En aceite o con grasa, no en polvo seco",
            "La Q10 es liposoluble: en una capsula seca se absorbe una fraccion de lo que "
            "se absorbe disuelta en aceite.",
            fuente="ficha", exige=r"aceite|oil|softgel|perla|liposom|oliva|girasol"),
    ],
    "cla": [
        req("isomeros_declarados",
            "Declara su porcentaje de isomeros activos",
            "Lo que se estudia son los isomeros c9,t11 y t10,c12. Un CLA al 60 % y otro al "
            "80 % se venden al mismo precio por capsula y no traen lo mismo.",
            fuente="ficha", exige=r"\d+\s*%|c9|t10|is[oó]mero|clarinol|tonalin"),
        req("origen_cartamo",
            "De aceite de cartamo, que es el de los estudios",
            "Es la fuente con la que se hicieron los ensayos y la que declaran las marcas "
            "que se lo pueden permitir.",
            fuente="ficha", exige=r"c[aá]rtamo|safflower|clarinol|tonalin"),
    ],

    "melatonina": [
        req("dosis_util",
            "Dosis por comprimido dentro de lo estudiado",
            "La condicion de uso autorizada en la UE es 1 mg. Las megadosis de 10 mg no "
            "funcionan mejor: en melatonina, mas no es mejor.",
            fuente="ficha", exige=r"(?:^|[^\d])(?:0[.,]\d+|1|1[.,]\d|2|3|5)\s*mg"),
        req("sin_azucar",
            "Sin azucar anadido",
            "Se toma a diario y antes de dormir. Los masticables y las gominolas llevan "
            "azucar como grueso del producto.",
            fuente="lista", prohibe=r"az[uú]car|sacarosa|jarabe|glucosa|dextrosa"),
    ],
    "cafeina": [
        req("dosis_declarada",
            "Declara sus miligramos por capsula",
            "Es lo unico que hay que saber de una cafeina, y es lo que decide si una "
            "capsula equivale a un cafe o a tres.",
            fuente="ficha", exige=r"\d+\s*mg"),
        req("sin_mezcla",
            "Es cafeina, no un termogenico con cafeina dentro",
            "Una mezcla no se compara por capsula con la cafeina sola: parte de lo que se "
            "paga es otra cosa, y no siempre una que haga algo.",
            fuente="ficha", prohibe=r"termog|quemagras|fat burn|\bmatrix\b|\bblend\b|complex"),
    ],
    "carnitina": [
        req("forma_declarada",
            "Dice que forma de carnitina lleva",
            "La tartrato, la acetil y la propionil no valen para lo mismo ni cuestan lo "
            "mismo. Una ficha que solo pone carnitina no permite elegir.",
            fuente="ficha", exige=r"tartrato|acetil|acetyl|propionil|\blcltt?\b|carnipure"),
        req("dosis_declarada",
            "Declara sus miligramos por dosis",
            "Las dosis con respaldo van de 2 a 4 g al dia. Sin la cifra no se sabe cuanto "
            "rinde el bote.",
            fuente="ficha", exige=r"\d+\s*(?:mg|g)\b"),
    ],
    "teanina": [
        req("es_l_teanina",
            "Es L-teanina, la forma natural",
            "La D-teanina de las mezclas racemicas no es la que se ha estudiado, y sale mas "
            "barata de sintetizar.",
            fuente="ficha", exige=r"l[\s-]?teanina|l[\s-]?theanine|suntheanine"),
        req("dosis_declarada",
            "Declara sus miligramos por capsula",
            "Las dosis de los estudios son de 100 a 200 mg.",
            fuente="ficha", exige=r"\d+\s*mg"),
    ],
    "triptofano": [
        req("es_l_triptofano",
            "Es L-triptofano o 5-HTP, con su forma declarada",
            "No son el mismo producto ni la misma dosis, y las fichas los mezclan en la "
            "misma categoria.",
            fuente="ficha", exige=r"l[\s-]?tript[oó]fano|l[\s-]?tryptophan|5[\s-]?htp"),
        req("dosis_declarada",
            "Declara sus miligramos por capsula",
            "Sin la cifra no se sabe cuantas capsulas hacen falta al dia.",
            fuente="ficha", exige=r"\d+\s*mg"),
    ],
    "hmb": [
        req("forma_declarada",
            "Dice si es HMB calcico o acido libre",
            "El acido libre se absorbe mas rapido y cuesta bastante mas. Es la unica "
            "diferencia entre dos botes que por capsula valen lo mismo.",
            fuente="ficha", exige=r"c[aá]lcico|calcium|[aá]cido libre|free acid|myhmb"),
        req("dosis_declarada",
            "Declara sus gramos por dosis",
            "La dosis estudiada son 3 g al dia. Sin la cifra no se sabe cuanto dura el bote.",
            fuente="ficha", exige=r"\d+\s*(?:mg|g)\b"),
    ],
    "probioticos": [
        req("cepas_identificadas",
            "Identifica sus cepas, no solo el genero",
            "Los efectos son de la CEPA, no del genero: Lactobacillus rhamnosus GG no es "
            "cualquier lactobacilo. Una etiqueta que solo pone el genero no permite buscar "
            "un solo estudio.",
            fuente="ficha", exige=r"\b[A-Z]{2,}[\s-]?\d+\b|\bgg\b|\bds-?1\b|bb-?12|"
                                  r"la-?5|ncfm|hn0?19|shirota|\bcect\b|\bdsm\b|\batcc\b"),
        req("ufc_declaradas",
            "Declara sus UFC por capsula",
            "Es la unidad en la que se vende un probiotico. Sin ella, el precio por capsula "
            "compara botes que pueden llevar mil veces mas uno que otro.",
            fuente="ficha", exige=r"\bufc\b|\bcfu\b|millones|billones|mil millones|10\^"),
    ],

    "preentreno": [
        req("sin_blend_propietario",
            "Sin mezclas propietarias que escondan las dosis",
            "Un blend propietario da la suma de la mezcla y no lo que lleva cada cosa. Es "
            "lo que permite poner un ingrediente famoso en cantidad simbolica sin que se "
            "note, que es exactamente lo que esta web existe para detectar.",
            fuente="ficha", prohibe=r"blend propietario|proprietary blend|mezcla patentada|"
                                    r"\bmatrix\b"),
        req("dosis_publicadas",
            "Publica los miligramos de cada activo",
            "Sin las dosis por servicio no se puede saber si la formula llega a lo que "
            "dicen los estudios, y el producto se lista sin poder juzgar su formula.",
            fuente="dosis", exige=("dosis", 1)),
    ],
    "multivitaminico": [
        req("formas_biodisponibles",
            "Con las formas que se absorben, no las baratas",
            "Un multivitaminico de oxido de magnesio, acido folico y cianocobalamina cuesta "
            "una fraccion de uno con bisglicinato, metilfolato y metilcobalamina, y la "
            "etiqueta de los dos declara los mismos miligramos.",
            fuente="ficha", exige=MINERAL_BUENO + r"|metilfolato|metilcobalamina|5-mthf|p5p"),
        req("cantidades_declaradas",
            "Declara la cantidad de cada micronutriente",
            "Un multivitaminico que solo lista nombres no permite compararse con nadie ni "
            "saber si algo va en dosis simbolica.",
            fuente="ficha", exige=r"\d+\s*(?:mg|µg|mcg|ug|ui\b)"),
    ],
    "quemagrasas": [
        req("activos_con_evidencia",
            "Sus activos son de los que tienen algun estudio detras",
            "La cafeina y el te verde tienen efectos medidos, pequenos y conocidos. El "
            "resto del catalogo de esta categoria son extractos sin ensayos en humanos.",
            fuente="ficha", exige=r"cafe[ií]na|caffeine|t[eé] verde|green tea|egcg|"
                                  r"carnitina|\bcla\b"),
        req("sin_blend_propietario",
            "Sin mezclas propietarias que escondan las dosis",
            "Es la categoria donde mas se usan, y por lo mismo: una mezcla que no dice sus "
            "dosis no se puede desmentir.",
            fuente="ficha", prohibe=r"blend propietario|proprietary blend|mezcla patentada|"
                                    r"\bmatrix\b"),
    ],
    "ganador_peso": [
        req("ratio_declarado",
            "Declara su ratio de proteina y carbohidrato",
            "Es lo que separa un ganador de un saco de azucar con sabor. Sin el ratio, el "
            "precio por kilo compara cosas distintas.",
            fuente="ficha", exige=r"\d+\s*[:/]\s*\d+|prote[ií]na.*carbo|\d+\s*g de prote"),
        req("sin_azucar_como_base",
            "El carbohidrato no es azucar simple",
            "La maltodextrina y la avena no son lo mismo que el azucar, y muchos ganadores "
            "baratos son sobre todo azucar con proteina espolvoreada.",
            fuente="lista", prohibe=r"az[uú]car|sacarosa|jarabe de glucosa|fructosa"),
    ],
    "carbohidratos": [
        req("tipo_declarado",
            "Dice que carbohidrato es",
            "La amilopectina, la ciclodextrina y la maltodextrina no vacian el estomago "
            "igual ni cuestan lo mismo. Un bote que solo pone carbohidratos no se puede "
            "comparar.",
            fuente="ficha", exige=r"maltodextrina|amilopectina|ciclodextrina|dextrosa|"
                                  r"vitargo|palatinosa|isomaltulosa|waxy|glucosa"),
        req("sin_azucar_anadido",
            "Sin azucar de mesa anadido",
            "Es el carbohidrato mas barato que existe y el que menos falta hace comprar en "
            "un bote.",
            fuente="lista", prohibe=r"az[uú]car|sacarosa"),
    ],
}


# --- evaluacion ------------------------------------------------------------------


def _cumple(r, producto, nombre, lista):
    """(cumple, evaluable) de un requisito sobre un producto.

    Un requisito que no se puede juzgar no puntua: ni a favor ni en contra. Es la misma
    regla que el resto del proyecto -lo que la tienda no publica no resta- y la que hace
    que esta parte de la nota se pueda defender.
    """
    fuente = r["fuente"]
    if fuente == "tabla":                       # necesita la tabla nutricional
        pureza = producto.get("pureza_real")
        if not pureza:
            return False, False
        return pureza >= r["exige"][1], True
    if fuente == "dosis":                       # necesita las dosis de la ficha
        return bool(producto.get("_n_dosis")), True
    if fuente == "lista":
        # Un "no lleva relleno" solo se puede afirmar leyendo la lista: que no salga en el
        # NOMBRE no prueba nada, y darlo por bueno premiaria a la tienda mas opaca.
        if not lista:
            return False, False
        texto = lista
    elif fuente == "declara":
        # Pide un dato declarado, y un dato declarado necesita donde estar escrito. Una
        # tienda que solo publica el nombre del producto no suspende: no se le juzga.
        desc = producto.get("descripcion")
        if not (desc or lista):
            return False, False
        texto = "%s %s %s" % (nombre, desc or "", lista or "")
    else:
        # "ficha": lo que se puede AFIRMAR con el nombre. Solo se usa para prohibiciones
        # ("no es un oxido", "no es una mezcla"), donde ver la palabra es la prueba. La
        # descripcion se queda fuera a proposito: una que diga "sin oxido de magnesio"
        # marcaria el producto por justo lo contrario de lo que pone.
        texto = "%s %s" % (nombre, lista or "")

    if r["prohibe"]:
        return not re.search(r["prohibe"], texto, re.I), True
    return bool(re.search(r["exige"], texto, re.I)), True


def evaluar(producto, categoria, n_dosis=0):
    """(nota 0-100 o None, [(cumple, requisito)]) de los requisitos de esa categoria.

    None = a este producto no se le ha podido juzgar ni un requisito. No es un cero: es
    que su ficha no publica lo suficiente, y el motor lo trata como la media.
    """
    lista = REQUISITOS.get(categoria)
    if not lista:
        return None, []
    p = dict(producto, _n_dosis=n_dosis)
    nombre = "%s %s" % (producto.get("marca") or "", producto.get("nombre") or "")
    texto_lista = producto.get("lista_ingredientes")
    detalle, cumplidos, evaluables = [], 0, 0
    for r in lista:
        cumple, evaluable = _cumple(r, p, nombre, texto_lista)
        if not evaluable:
            continue
        evaluables += 1
        cumplidos += bool(cumple)
        detalle.append((bool(cumple), r))
    if not evaluables:
        return None, []
    return round(100.0 * cumplidos / evaluables, 1), detalle


def main():
    if len(sys.argv) > 1:
        cat = sys.argv[1]
        for r in REQUISITOS.get(cat, []):
            print("[%s] %s\n    %s\n" % (r["fuente"], r["que"], r["porque"]))
        if cat not in REQUISITOS:
            print("%s no tiene requisitos escritos" % cat)
        return
    sin = []
    for c in categorias.CATEGORIAS:
        n = len(REQUISITOS.get(c, []))
        print("%-20s %d requisitos" % (c, n))
        if not n:
            sin.append(c)
    print("\n%d de %d categorias con requisitos" % (
        len(categorias.CATEGORIAS) - len(sin), len(categorias.CATEGORIAS)))
    if sin:
        print("sin requisitos:", ", ".join(sin))


if __name__ == "__main__":
    main()
