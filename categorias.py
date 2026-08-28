"""Que categorias compara la web y como se juzga cada una.

Fuente unica de verdad: la leen el scraper (que producto entra en cada categoria),
el motor de scoring (si el bote entero es el activo o hay que mirar la ficha) y el
exportador (como se llama la categoria en la web). Si esto viviera en tres sitios,
tarde o temprano dirian tres cosas distintas.

Anadir una categoria = una entrada aqui + su URL en cada tienda que la venda
(scraper/tiendas/*.py) + su dosis de referencia con fuente (data/dosis_referencia.json).

Campos:
  nombre   Como se llama en la web.
  filtro   El nombre (o el slug) TIENE que casar con esto. None = el listado de la
           tienda ya acota la categoria y no hace falta filtrar por nombre.
  excluye  Lo que NO es de esta categoria, ademas del descarte comun.
  unidad   En que se vende y con que se compara el precio: "kg" (polvo) o "capsula".
           Un producto que no se pueda medir en la unidad de su categoria no entra: no
           hay forma de compararlo con los demas sin cambiar de unidad a mitad de tabla.
  activo   Ingrediente que ES el envase entero (modo simple). None en las formulas.
  ingredientes  Que activos cuentan para la nota en una formula. None = todos los que
           tengan dosis de referencia. Una tupla vacia = la categoria no se puntua.
  termino  Como llama la gente a esta categoria cuando la busca ("creatina", "omega 3").
           Se usa en los titulos, en la respuesta corta y en las preguntas de la ficha.
  mejor    "la mejor creatina" / "los mejores BCAA": el articulo y la concordancia ya
           resueltos a mano. Es una cadena y no un motor de genero a proposito.
  consultas  Las busquedas que esta categoria quiere ganar, por tipo de respuesta:
           mejor / barato / precio / certificacion / dosis. Cada clave la contesta un
           generador de web/src/datos/seo.js con datos del dataset, nunca con prosa fija.
           Quitar una clave quita la pregunta; no hay respuestas sin dato detras.
           Las categorias sin dosis de referencia (preentreno, multivitaminicos) no
           llevan "dosis". Ver SEO-PRODUCTOS.md.
  modo     "simple"  el bote entero es el activo: el coste por dosis sale del formato.
           "formula" mezcla de activos: las dosis salen de la ficha, NUNCA del envase.
                     Si no las publica, el producto se lista pero no se puntua.
"""

# Formas de presentacion que no se comparan por gramos. Las categorias en polvo las
# descartan; omega 3 y multivitaminicos se venden asi y las necesitan.
CAPSULAS = r"c[aá]psulas?|[a-z]*caps\b|softgels?|perlas|tabletas|tabs\b|comprimidos"

# Comida y bebida con proteina anadida: estan en los listados de proteina de las
# tiendas pero no son un bote de proteina y no se comparan por dosis.
# Ojo con esta lista al puntuar por precio por kilo: un muesli con proteina cuesta 17
# EUR/kg y una whey de verdad 30, asi que la comida colada en la categoria no queda
# escondida a media tabla, sale la primera y con sello.
# "cafe" va con \b a los dos lados: sin el, este patron casaba con "cafeina" y dejaba la
# categoria de cafeina en cero productos sin un solo error en el log.
NO_ES_UN_BOTE = (r"crema|\bcaf[eé]\b|smoothie|oats|avena|muesli|granola|cereal|galleta|"
                 r"cookie|tortita|bebida|shot\b|mug\s*cake|\bcake\b|gofre|pancake|"
                 r"harina|porridge|mermelada|sirope")

CATEGORIAS = {
    "creatina": dict(
        unidad="kg",
        nombre="Creatina",
        termino="creatina",
        mejor="la mejor creatina",
        consultas={
            "mejor": "que creatina comprar",
            "barato": "cual es la creatina mas barata",
            "precio": "cuanto cuesta un kilo de creatina",
            "certificacion": "que certificacion tiene que tener una creatina",
            "dosis": "cuanta creatina hay que tomar al dia",
        },
        filtro=r"creatin|kre[\s-]?alkalyn",
        # Prozis vende "100% Whey Prime + Creatine": lleva creatina anadida y entraria
        # como la creatina mas barata de la tabla sin serlo.
        excluye=r"whey|prote[ií]n|" + CAPSULAS,
        # Cada forma quimica es un ingrediente distinto con su propia evidencia, asi que
        # manda la forma; el activo de aqui es solo el respaldo para las fichas que no
        # declaran ninguna ("Zero Creatine", "MicronPure"). No es dar por hecho que son
        # monohidrato: el motor las compara con esa referencia y les descuenta un 40 %
        # de calidad por no decirlo (FACTOR_FORMA_DESCONOCIDA), que es justo para lo que
        # existe ese factor. Sin esto se quedaban sin nota y sin coste por dosis.
        activo="creatina_monohidrato",
        activo_por_forma=True,
        modo="simple",
    ),
    "preentreno": dict(
        unidad="kg",
        nombre="Preentrenos",
        termino="preentreno",
        mejor="el mejor preentreno",
        consultas={
            "mejor": "que preentreno comprar",
            "barato": "cual es el preentreno mas barato",
            "precio": "cuanto cuesta un kilo de preentreno",
            "certificacion": "que certificacion tiene que tener un preentreno",
        },
        filtro=None,                  # el listado de la tienda ya acota
        # Prozis lista un "Pre-workout Protein Mug Cake" entre sus preentrenos.
        excluye=r"gominolas|gel\b|" + NO_ES_UN_BOTE + "|" + CAPSULAS,
        activo=None,
        modo="formula",
    ),
    "proteina_whey": dict(
        unidad="kg",
        nombre="Proteina whey (concentrado)",
        termino="proteina whey",
        mejor="la mejor proteina whey",
        consultas={
            "mejor": "que proteina whey comprar",
            "barato": "cual es la proteina whey mas barata",
            "precio": "cuanto cuesta un kilo de proteina whey",
            "certificacion": "que certificacion tiene que tener una proteina whey",
            "dosis": "cuanta proteina whey hay que tomar al dia",
        },
        filtro=r"whey|suero|prote",
        excluye=(r"isolat|aislad|hidroliz|vegan|vegetal|guisante|soja|arroz|c[aá]seina|"
                 r"huevo|carne|colageno|col[aá]geno|" + NO_ES_UN_BOTE + "|" + CAPSULAS),
        activo="proteina_whey_concentrada",
        modo="simple",
    ),
    "proteina_aislada": dict(
        unidad="kg",
        nombre="Proteina whey aislada",
        termino="proteina aislada",
        mejor="la mejor proteina aislada",
        consultas={
            "mejor": "que proteina aislada comprar",
            "barato": "cual es la proteina aislada mas barata",
            "precio": "cuanto cuesta un kilo de proteina aislada",
            "certificacion": "que diferencia hay entre una proteina aislada y un concentrado",
            "dosis": "cuanta proteina aislada hay que tomar al dia",
        },
        filtro=r"isolat|aislad",
        excluye=(r"vegan|vegetal|guisante|soja|arroz|c[aá]seina|huevo|carne|"
                 + NO_ES_UN_BOTE + "|" + CAPSULAS),
        activo="proteina_whey_aislada",
        modo="simple",
    ),
    "bcaa": dict(
        unidad="kg",
        nombre="BCAA",
        termino="BCAA",
        mejor="los mejores BCAA",
        consultas={
            "mejor": "que BCAA comprar",
            "barato": "cuales son los BCAA mas baratos",
            "precio": "cuanto cuesta un kilo de BCAA",
            "certificacion": "que certificacion tienen que tener unos BCAA",
            "dosis": "cuantos BCAA hay que tomar al dia",
        },
        filtro=r"bcaa|ramificad",
        excluye=NO_ES_UN_BOTE + "|" + CAPSULAS,
        activo="bcaa",
        modo="simple",
    ),
    "glutamina": dict(
        unidad="kg",
        nombre="Glutamina",
        termino="glutamina",
        mejor="la mejor glutamina",
        consultas={
            "mejor": "que glutamina comprar",
            "barato": "cual es la glutamina mas barata",
            "precio": "cuanto cuesta un kilo de glutamina",
            "certificacion": "que certificacion tiene que tener una glutamina",
            "dosis": "cuanta glutamina hay que tomar al dia",
        },
        filtro=r"glutamin",
        # Una mezcla no es un bote de glutamina: el modo simple daria por hecho que el
        # envase entero lo es y saldria la glutamina mas barata de la tabla sin serlo.
        excluye=r"bcaa|whey|prote[ií]n|" + NO_ES_UN_BOTE + "|" + CAPSULAS,
        activo="glutamina",
        modo="simple",
    ),
    "colageno": dict(
        unidad="kg",
        nombre="Colageno",
        termino="colageno",
        mejor="el mejor colageno",
        consultas={
            "mejor": "que colageno comprar",
            "barato": "cual es el colageno mas barato",
            "precio": "cuanto cuesta un kilo de colageno",
            "certificacion": "que certificacion tiene que tener un colageno",
            "dosis": "cuanto colageno hay que tomar al dia",
        },
        filtro=r"col[aá]geno|collagen",
        # Idem: "Impact Whey Protein + Colageno" es una proteina con colageno anadido,
        # no un bote de colageno, y Myprotein tiene trece formatos de ella.
        excluye=r"whey|suero|prote[ií]n|" + NO_ES_UN_BOTE + "|" + CAPSULAS,
        activo="colageno_hidrolizado",
        modo="simple",
    ),
    "omega3": dict(
        unidad="capsula",
        nombre="Omega 3",
        termino="omega 3",
        mejor="el mejor omega 3",
        consultas={
            "mejor": "que omega 3 comprar",
            "barato": "cual es el omega 3 mas barato",
            "precio": "cuanto cuesta una capsula de omega 3",
            "certificacion": "que certificacion tiene que tener un omega 3",
            "dosis": "cuanto omega 3 hay que tomar al dia",
        },
        # El 3-6-9 no es un omega 3: el 6 sobra en la dieta occidental y diluye el EPA/DHA.
        filtro=r"omega[\s-]?3|epa\b|dha\b|aceite de pescado|fish[\s-]?oil|krill",
        excluye=r"3[\s-]?6[\s-]?9|gominolas",
        activo=None,
        # Lo unico que se juzga de un omega 3 es el EPA+DHA por capsula; la vitamina E
        # que llevan de conservante no es lo que se compra.
        ingredientes=("omega_3_epa_dha",),
        # Formula, aunque solo interese el EPA+DHA: la capsula lleva aceite, no activo
        # puro. Sin los mg por capsula en la ficha no hay coste por dosis que valga.
        modo="formula",
    ),
    "multivitaminico": dict(
        unidad="capsula",
        nombre="Multivitaminicos",
        termino="multivitaminico",
        mejor="el mejor multivitaminico",
        consultas={
            "mejor": "que multivitaminico comprar",
            "barato": "cual es el multivitaminico mas barato",
            "precio": "cuanto cuesta una capsula de multivitaminico",
            "certificacion": "que certificacion tiene que tener un multivitaminico",
        },
        # "Daily Vits" de Life Pro es un multivitaminico que no lleva "multi" en el
        # nombre; sin esto su categoria entera se quedaba fuera.
        filtro=r"multivit|multi[\s-]?vitamin|daily[\s-]?vits?",
        excluye=r"gominolas",
        activo=None,
        # Nada cuenta: no hay una dosis de referencia para veinte micronutrientes a la
        # vez. Sin esto, un multivitaminico con 100 mg de cafeina se puntuaba como si
        # fuera un suplemento de cafeina infradosificado y encabezaba su categoria.
        ingredientes=(),
        modo="formula",
    ),
    # --- Los 30 mas vendidos (ampliacion del 2026-08-25) --------------------------
    # Las nueve de arriba mas estas veintiuna son los treinta suplementos que encabezan
    # las listas de mas vendidos del sector: los bestsellers de Myprotein, el top ventas
    # de HSN y los mas vendidos de nutricion deportiva de Amazon.
    #
    # Casi todas las nuevas van en modo "formula" con `ingredientes=()`: es el mismo
    # trato que ya tenian los multivitaminicos. No hay una dosis efectiva citable para
    # un mineral o un extracto de planta que valga para toda la categoria, asi que la
    # tabla los compara por precio por capsula y por certificacion, y su pagina lo dice.
    # Inventarles una dosis para poder puntuarlos seria justo lo que este proyecto no
    # hace. Las ocho que si llevan dosis (proteina vegana, caseina, EAA, beta-alanina,
    # citrulina, cafeina, carnitina y melatonina) la tienen citada en
    # data/dosis_referencia.json, como todas las demas.
    "proteina_vegana": dict(
        unidad="kg",
        nombre="Proteina vegana",
        termino="proteina vegana",
        mejor="la mejor proteina vegana",
        consultas={
            "mejor": "que proteina vegana comprar",
            "barato": "cual es la proteina vegana mas barata",
            "precio": "cuanto cuesta un kilo de proteina vegana",
            "certificacion": "que certificacion tiene que tener una proteina vegana",
            "dosis": "cuanta proteina vegana hay que tomar al dia",
        },
        filtro=r"vegan|vegetal|guisante|\bpea\b|soja|\bsoy\b|arroz|c[aá][nñ]amo|hemp",
        # Ni una bebida vegetal ni una whey que menciona su version vegana de pasada.
        excluye=(r"whey|suero|c[aá]seina|colageno|col[aá]geno|huevo|carne|bebida vegetal|"
                 r"leche|" + NO_ES_UN_BOTE + "|" + CAPSULAS),
        activo="proteina_vegetal",
        modo="simple",
    ),
    "caseina": dict(
        unidad="kg",
        nombre="Caseina",
        termino="caseina",
        mejor="la mejor caseina",
        consultas={
            "mejor": "que caseina comprar",
            "barato": "cual es la caseina mas barata",
            "precio": "cuanto cuesta un kilo de caseina",
            "certificacion": "que certificacion tiene que tener una caseina",
            "dosis": "cuanta caseina hay que tomar al dia",
        },
        filtro=r"case[ií]n|micelar|micellar",
        # "Whey + caseina" es una mezcla de liberacion secuencial, no un bote de caseina:
        # en modo simple entraria como la caseina mas barata sin serlo.
        excluye=(r"whey|suero|blend|secuencial|" + NO_ES_UN_BOTE + "|" + CAPSULAS),
        activo="proteina_caseina",
        modo="simple",
    ),
    "ganador_peso": dict(
        unidad="kg",
        nombre="Ganadores de peso",
        termino="ganador de peso",
        mejor="el mejor ganador de peso",
        consultas={
            "mejor": "que ganador de peso comprar",
            "barato": "cual es el ganador de peso mas barato",
            "precio": "cuanto cuesta un kilo de ganador de peso",
            "certificacion": "que certificacion tiene que tener un ganador de peso",
        },
        filtro=r"gainer|ganador|subidor|\bmass\b|volumen",
        excluye=NO_ES_UN_BOTE + "|" + CAPSULAS,
        activo=None,
        # Un gainer es carbohidrato con proteina: el bote no es un activo y no existe una
        # dosis efectiva de "ganador de peso". Se compara por precio por kilo, que es
        # justo la pregunta de quien compra calorias a peso.
        ingredientes=(),
        modo="formula",
    ),
    "eaa": dict(
        unidad="kg",
        nombre="Aminoacidos esenciales (EAA)",
        termino="EAA",
        mejor="los mejores EAA",
        consultas={
            "mejor": "que EAA comprar",
            "barato": "cuales son los EAA mas baratos",
            "precio": "cuanto cuesta un kilo de EAA",
            "certificacion": "que certificacion tienen que tener unos EAA",
            "dosis": "cuantos EAA hay que tomar al dia",
        },
        filtro=r"\beaa|amino[aá]cidos esenciales|essential amino",
        excluye=r"\bbcaa\b|" + NO_ES_UN_BOTE + "|" + CAPSULAS,
        activo="aminoacidos_esenciales",
        modo="simple",
    ),
    "beta_alanina": dict(
        unidad="kg",
        nombre="Beta-alanina",
        termino="beta-alanina",
        mejor="la mejor beta-alanina",
        consultas={
            "mejor": "que beta alanina comprar",
            "barato": "cual es la beta alanina mas barata",
            "precio": "cuanto cuesta un kilo de beta alanina",
            "certificacion": "que certificacion tiene que tener una beta alanina",
            "dosis": "cuanta beta alanina hay que tomar al dia",
        },
        filtro=r"beta[\s-]?alanina|beta[\s-]?alanine|carnosyn",
        # Un preentreno lleva beta-alanina y no es un bote de beta-alanina.
        excluye=(r"pre[\s-]?entren|pre[\s-]?workout|\bbcaa\b|creatin|"
                 + NO_ES_UN_BOTE + "|" + CAPSULAS),
        activo="beta_alanina",
        modo="simple",
    ),
    "citrulina": dict(
        unidad="kg",
        nombre="Citrulina",
        termino="citrulina",
        mejor="la mejor citrulina",
        consultas={
            "mejor": "que citrulina comprar",
            "barato": "cual es la citrulina mas barata",
            "precio": "cuanto cuesta un kilo de citrulina",
            "certificacion": "que certificacion tiene que tener una citrulina",
            "dosis": "cuanta citrulina hay que tomar al dia",
        },
        filtro=r"citrulina|citrulline",
        excluye=(r"pre[\s-]?entren|pre[\s-]?workout|arginina|\baakg\b|"
                 + NO_ES_UN_BOTE + "|" + CAPSULAS),
        activo="citrulina_malato",
        modo="simple",
    ),
    "carbohidratos": dict(
        unidad="kg",
        nombre="Carbohidratos",
        termino="carbohidratos en polvo",
        mejor="el mejor carbohidrato en polvo",
        consultas={
            "mejor": "que carbohidrato en polvo comprar",
            "barato": "cual es el carbohidrato en polvo mas barato",
            "precio": "cuanto cuesta un kilo de maltodextrina",
            "certificacion": "que certificacion tiene que tener un carbohidrato en polvo",
        },
        # Sin la terminacion en -a: quien etiqueta en ingles escribe MALTODEXTRIN,
        # DEXTROSE y WAXYMAIZE, y toda una tienda se quedaba fuera de la categoria.
        filtro=(r"maltodextrin|dextros|amilopectina|ciclodextrin|vitargo|almid[oó]n|"
                r"waxy\s?maize|carbo|glucosa"),
        excluye=(r"gel\b|bloqueador|prote[ií]n|" + NO_ES_UN_BOTE + "|" + CAPSULAS),
        activo=None,
        # Azucar es azucar: no hay dosis efectiva que citar, y el precio por kilo es
        # exactamente lo que se pregunta quien lo compra.
        ingredientes=(),
        modo="formula",
    ),
    "magnesio": dict(
        unidad="capsula",
        nombre="Magnesio",
        termino="magnesio",
        mejor="el mejor magnesio",
        consultas={
            "mejor": "que magnesio comprar",
            "barato": "cual es el magnesio mas barato",
            "precio": "cuanto cuesta una capsula de magnesio",
            "certificacion": "que certificacion tiene que tener un magnesio",
        },
        filtro=r"magnesio|magnesium",
        # Un "Calcio + Magnesio" no es un bote de magnesio: sale mas barato por capsula
        # porque la mitad del contenido es otra cosa, y encabezaba la tabla (y la
        # respuesta corta) como si fuera el mejor magnesio. Mismo caso que el
        # "Whey + Creatina" de la creatina.
        excluye=r"\bzma\b|multivit|electrolit|calcio|potasio",
        activo=None,
        ingredientes=(),
        modo="formula",
    ),
    "zinc": dict(
        unidad="capsula",
        nombre="Zinc",
        termino="zinc",
        mejor="el mejor zinc",
        consultas={
            "mejor": "que zinc comprar",
            "barato": "cual es el zinc mas barato",
            "precio": "cuanto cuesta una capsula de zinc",
            "certificacion": "que certificacion tiene que tener un zinc",
        },
        filtro=r"\bzinc\b|\bcinc\b",
        excluye=r"\bzma\b|multivit|vitamina[\s-]?c",
        activo=None,
        ingredientes=(),
        modo="formula",
    ),
    "hierro": dict(
        unidad="capsula",
        nombre="Hierro",
        termino="hierro",
        mejor="el mejor hierro",
        consultas={
            "mejor": "que hierro comprar",
            "barato": "cual es el hierro mas barato",
            "precio": "cuanto cuesta una capsula de hierro",
            "certificacion": "que certificacion tiene que tener un hierro",
        },
        filtro=r"hierro|\biron\b|ferro|fumarato",
        excluye=r"multivit",
        activo=None,
        ingredientes=(),
        modo="formula",
    ),
    "vitamina_d": dict(
        unidad="capsula",
        nombre="Vitamina D",
        termino="vitamina D",
        mejor="la mejor vitamina D",
        consultas={
            "mejor": "que vitamina d comprar",
            "barato": "cual es la vitamina d mas barata",
            "precio": "cuanto cuesta una capsula de vitamina d",
            "certificacion": "que certificacion tiene que tener una vitamina d",
        },
        filtro=r"vitamina[\s-]?d3?\b|vitamin[\s-]?d3?\b|colecalciferol",
        excluye=r"multivit|calcio",
        activo=None,
        ingredientes=(),
        modo="formula",
    ),
    "vitamina_c": dict(
        unidad="capsula",
        nombre="Vitamina C",
        termino="vitamina C",
        mejor="la mejor vitamina C",
        consultas={
            "mejor": "que vitamina c comprar",
            "barato": "cual es la vitamina c mas barata",
            "precio": "cuanto cuesta una capsula de vitamina c",
            "certificacion": "que certificacion tiene que tener una vitamina c",
        },
        filtro=(r"vitamina[\s-]?c\b|vitamin[\s-]?c\b|[aá]cido asc[oó]rbico|ascorbato|"
                r"pureway"),
        excluye=r"multivit|col[aá]geno|collagen|\bzinc\b",
        activo=None,
        ingredientes=(),
        modo="formula",
    ),
    "vitamina_b12": dict(
        unidad="capsula",
        nombre="Vitamina B12",
        termino="vitamina B12",
        mejor="la mejor vitamina B12",
        consultas={
            "mejor": "que vitamina b12 comprar",
            "barato": "cual es la vitamina b12 mas barata",
            "precio": "cuanto cuesta una capsula de vitamina b12",
            "certificacion": "que certificacion tiene que tener una vitamina b12",
        },
        filtro=r"b12|cianocobalamina|metilcobalamina|adenosilcobalamina",
        excluye=r"multivit|complex",
        activo=None,
        ingredientes=(),
        modo="formula",
    ),
    "zma": dict(
        unidad="capsula",
        nombre="ZMA",
        termino="ZMA",
        mejor="el mejor ZMA",
        consultas={
            "mejor": "que zma comprar",
            "barato": "cual es el zma mas barato",
            "precio": "cuanto cuesta una capsula de zma",
            "certificacion": "que certificacion tiene que tener un zma",
        },
        filtro=r"\bzma\b",
        excluye=r"multivit",
        activo=None,
        ingredientes=(),
        modo="formula",
    ),
    "ashwagandha": dict(
        unidad="capsula",
        nombre="Ashwagandha",
        termino="ashwagandha",
        mejor="la mejor ashwagandha",
        consultas={
            "mejor": "que ashwagandha comprar",
            "barato": "cual es la ashwagandha mas barata",
            "precio": "cuanto cuesta una capsula de ashwagandha",
            "certificacion": "que certificacion tiene que tener una ashwagandha",
        },
        filtro=r"ashwagandha|withania|ksm[\s-]?66|shoden|sensoril",
        excluye=r"multivit",
        activo=None,
        ingredientes=(),
        modo="formula",
    ),
    "melatonina": dict(
        unidad="capsula",
        nombre="Melatonina",
        termino="melatonina",
        mejor="la mejor melatonina",
        consultas={
            "mejor": "que melatonina comprar",
            "barato": "cual es la melatonina mas barata",
            "precio": "cuanto cuesta una capsula de melatonina",
            "certificacion": "que certificacion tiene que tener una melatonina",
            "dosis": "cuanta melatonina hay que tomar",
        },
        filtro=r"melatonina|melatonin",
        excluye=r"multivit|\bcbd\b",
        activo=None,
        # De una melatonina solo se juzga su melatonina. La dosis de referencia es la de
        # la declaracion autorizada por la UE: 1 mg poco antes de acostarse.
        ingredientes=("melatonina",),
        modo="formula",
    ),
    "cafeina": dict(
        unidad="capsula",
        nombre="Cafeina",
        termino="cafeina",
        mejor="la mejor cafeina",
        consultas={
            "mejor": "que cafeina en capsulas comprar",
            "barato": "cual es la cafeina en capsulas mas barata",
            "precio": "cuanto cuesta una capsula de cafeina",
            "certificacion": "que certificacion tiene que tener una cafeina",
            "dosis": "cuanta cafeina hay que tomar antes de entrenar",
        },
        filtro=r"cafe[ií]na|caffeine|caffxtend",
        # Un preentreno lleva cafeina y no es un bote de cafeina; y "sin cafeina" es
        # literalmente lo contrario de esta categoria.
        excluye=(r"pre[\s-]?entren|pre[\s-]?workout|sin cafe[ií]na|caffeine[\s-]?free|"
                 r"gel\b|" + NO_ES_UN_BOTE),
        activo=None,
        ingredientes=("cafeina",),
        modo="formula",
    ),
    "probioticos": dict(
        unidad="capsula",
        nombre="Probioticos",
        termino="probiotico",
        mejor="el mejor probiotico",
        consultas={
            "mejor": "que probiotico comprar",
            "barato": "cual es el probiotico mas barato",
            "precio": "cuanto cuesta una capsula de probioticos",
            "certificacion": "que certificacion tiene que tener un probiotico",
        },
        filtro=r"probi[oó]tic|lactobacillus|bifidobacterium|\bufc\b|\bcfu\b",
        excluye=r"multivit",
        activo=None,
        ingredientes=(),
        modo="formula",
    ),
    "curcuma": dict(
        unidad="capsula",
        nombre="Curcuma",
        termino="curcuma",
        mejor="la mejor curcuma",
        consultas={
            "mejor": "que curcuma comprar",
            "barato": "cual es la curcuma mas barata",
            "precio": "cuanto cuesta una capsula de curcuma",
            "certificacion": "que certificacion tiene que tener una curcuma",
        },
        filtro=r"c[uú]rcuma|curcumin|turmeric",
        excluye=r"multivit",
        activo=None,
        ingredientes=(),
        modo="formula",
    ),
    "glucosamina": dict(
        unidad="capsula",
        nombre="Glucosamina y condroitina",
        termino="glucosamina",
        mejor="la mejor glucosamina",
        consultas={
            "mejor": "que glucosamina comprar",
            "barato": "cual es la glucosamina mas barata",
            "precio": "cuanto cuesta una capsula de glucosamina",
            "certificacion": "que certificacion tiene que tener una glucosamina",
        },
        filtro=r"glucosamina|glucosamine|condroitin|chondroitin|\bmsm\b|metilsulfonilmetano",
        # El colageno tiene su propia tabla y se compara por kilo: traerlo aqui seria
        # meter dos unidades en la misma columna.
        excluye=r"col[aá]geno|collagen|multivit",
        activo=None,
        ingredientes=(),
        modo="formula",
    ),
    "carnitina": dict(
        unidad="capsula",
        nombre="L-carnitina",
        termino="carnitina",
        mejor="la mejor carnitina",
        consultas={
            "mejor": "que carnitina comprar",
            "barato": "cual es la carnitina mas barata",
            "precio": "cuanto cuesta una capsula de carnitina",
            "certificacion": "que certificacion tiene que tener una carnitina",
            "dosis": "cuanta carnitina hay que tomar al dia",
        },
        filtro=r"carnitina|carnitine|carnipure|\balcar\b",
        excluye=r"multivit|quemagras|termog[eé]nic",
        activo=None,
        ingredientes=("carnitina",),
        modo="formula",
    ),
}


def config(categoria):
    return CATEGORIAS.get(categoria, {})


def unidad(categoria):
    return config(categoria).get("unidad", "kg")


def es_formula(categoria):
    return config(categoria).get("modo") == "formula"


def nombre(categoria):
    return config(categoria).get("nombre", categoria.replace("_", " ").capitalize())
