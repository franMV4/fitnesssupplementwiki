"""Todos los pesos de la metodologia, en un solo sitio.

Cambiar aqui cambia el ranking entero sin tocar una linea del motor. Cada valor
esta explicado porque esta pagina se publica en /metodologia: si no sabes defender
un numero, no lo pongas.
"""

# Cuanto vale cada cosa en el score final. Suman 1.
# El precio se compara en la unidad en que se vende la categoria: EUR/kg en los polvos,
# EUR/capsula en perlas y comprimidos, siempre contra el mas barato de la categoria.
# La valoracion es la de los compradores EN LA TIENDA que lo vende, y pesa poco a
# proposito: son opiniones sin verificar, de tiendas que moderan sus propias resenas, y
# lo que esta pagina compara es composicion, certificacion y precio. Cuenta, pero no
# manda sobre un dato comprobable.
PESO_CALIDAD = 0.35
PESO_COSTE = 0.35
PESO_REQUISITOS = 0.20
PESO_VALORACION = 0.10

# Los requisitos de la categoria (scoring/requisitos.py) responden la pregunta que no
# contestan ni el precio ni la certificacion: ¿esto es lo que dice ser? El precio por kilo
# no distingue un kilo de creatina de un kilo de creatina con un tercio de maltodextrina
# -el segundo sale MAS BARATO y rinde menos- y la certificacion tampoco, porque certifica
# que no hay dopantes, no que no haya relleno. Los 20 puntos salen de ahi: diez del precio
# y diez de la calidad, que es de donde se estaban dando por bueno lo que ahora se
# comprueba.

# Requisitos "prestados" de la media de la categoria, por la misma razon que las
# opiniones: cuanto menos se le ha podido juzgar a una ficha, mas cerca de la media se
# queda. Un producto al que solo se le puede comprobar UN requisito no puede perder los
# 20 puntos enteros por ese unico si o no, y uno al que se le comprueban cuatro si tiene
# que notarlo. Con K=2, un solo requisito incumplido mueve un tercio de lo que mueven
# cuatro, y la nota converge a la del producto segun su ficha publica mas.
REQUISITOS_DE_REFERENCIA = 2

# Opiniones "prestadas" de la media de la categoria en la media bayesiana. Un producto
# con una sola resena de cinco estrellas no puede adelantar a uno con cuatrocientas y un
# 4,6: con M=10, esa unica resena mueve la nota una decima, y con cien opiniones la
# media del producto ya manda casi entera. Sin esto el podio lo decidiria la ficha
# recien publicada que se ha valorado a si misma.
OPINIONES_DE_REFERENCIA = 10

# Factor de calidad segun el nivel de verificacion de la mejor certificacion.
# Un sello verificado contra fuente (4) vale mas que uno pagado por la marca (3),
# y este mas que uno solo declarado en la ficha (2).
FACTOR_VERIFICACION = {4: 1.00, 3: 0.85, 2: 0.70, 1: 0.60}

# Marca de ingrediente licenciada (Creapure) declarada en el NOMBRE del producto, en la
# ficha de una tienda que revisamos. Cuenta como nivel 4: "Creapure" es marca registrada
# de Alzchem y solo puede ponerla en el nombre quien tiene contrato de licencia, asi que
# no es un logo decorativo sino una afirmacion que obliga a la marca y que la tienda firma
# en su catalogo. Decision del dueno del proyecto, tomada a sabiendas de que el codigo QS
# del envase no se ha comprobado en creapure.com producto a producto.
#
# Si cambias esto, cambia con ello el texto del nivel 4 en NIVELES (exportar.py), el
# criterio del sello "Verificado" (sellos_de) y la seccion 2 de /metodologia: los tres
# describen al lector que significa un nivel 4 y no pueden decir otra cosa que esto.
NIVEL_MARCA_LICENCIADA = 4

# Factor por la forma quimica frente a la forma preferida de la tabla de dosis.
FACTOR_FORMA_PREFERIDA = 1.00
FACTOR_FORMA_ALTERNATIVA = 0.75      # p.ej. HCL o kre-alkalyn donde lo estudiado es monohidrato
FACTOR_FORMA_DESCONOCIDA = 0.60      # la ficha no dice que forma es

# --- composicion real de la ficha (fase 14) -------------------------------------
# Lo que la tabla nutricional y la lista de ingredientes dicen de ESTE bote, frente a lo
# tipico de su categoria. Dos whey al mismo precio por kilo no son el mismo producto si
# una lleva 82 g de proteina por cada 100 y la otra 52.
#
# El factor es la pureza real dividida entre la tipica de la categoria, acotado: por
# arriba porque una proteina no es el doble de buena por tener diez puntos mas, y por
# abajo porque el producto sigue siendo lo que dice ser y ya paga su parte en el coste
# por dosis efectiva, que se calcula con la pureza REAL.
FACTOR_PUREZA_MAX = 1.15
FACTOR_PUREZA_MIN = 0.75

# Aditivos declarados en la etiqueta (edulcorantes artificiales, colorantes, rellenos,
# antiaglomerantes). No son ilegales ni peligrosos: son lo que separa una etiqueta limpia
# de una que rellena y colorea, y quien compara suplementos lo mira. Por eso resta poco y
# tiene suelo. Solo se aplica cuando la tienda PUBLICA la lista: a nadie se le penaliza
# por lo que su ficha no dice.
PENALIZACION_POR_ADITIVO = 0.04
SUELO_ADITIVOS = 0.88

# Modo complejo (preentrenos, formulas): a partir de que ratio dosis_real/dosis_min
# se considera infradosaje ("fairy dusting") y cuanto castiga.
UMBRAL_INFRADOSAJE = 0.60
PENALIZACION_INFRADOSAJE = 0.50      # multiplica el score de calidad si hay infradosaje

# Ingredientes que no cuentan como "clave" al juzgar una formula (rellenos y saborizantes).
INGREDIENTES_IGNORADOS = {"sucralosa", "acido_citrico", "aroma", "colorante", "maltodextrina"}

# Techo de credibilidad de una dosis leida de la etiqueta, en mg por servicio.
#
# NO es un limite de salud ni un consejo: es hasta donde una cifra impresa al lado del
# nombre de un activo puede SER la dosis de ese activo. Por encima, en la etiqueta hay
# otra cosa, y se ha comprobado producto a producto cual:
#   "Curcuma 20.000mg"            -> equivalencia de extracto (lleva 500 mg reales)
#   "Ashwagandha 9000mg"          -> lo mismo, un extracto 10:1
#   "Citrato de magnesio 1490 mg" -> el peso de la sal, no el del magnesio
#   "Hierro 556,8 Mg"             -> lo que pesa la capsula entera
#   "Onagra + Vitamina E 660 mg"  -> el aceite de onagra, no la vitamina
# Pasado el techo, el motor hace lo mismo que cuando no hay cifra: no afirma nada de la
# formula de ese producto. Una ficha que dice "esta tienda no publica la dosis" es mejor
# que una que dice "en rango efectivo" y se equivoca.
#
# Son tres veces la dosis de referencia de cada uno, salvo las vitaminas C y E, que se
# venden legitimamente muy por encima de su valor de etiquetado y llevan el limite
# superior de ingesta tolerable publicado (2.000 mg y 300 mg).
TECHO_DOSIS_MG = {
    "magnesio": 1125, "zinc": 75, "hierro": 60, "calcio": 2400, "potasio": 3000,
    "vitamina_c": 2000, "vitamina_e": 300,
    "ashwagandha": 1800, "curcuminoides": 3000,
    "glucosamina": 4500, "condroitina": 3600,
}

# --- sellos de recomendacion (fase 6) -------------------------------------------
# Criterios objetivos y publicos. Se otorgan por umbral, nunca a dedo.
UMBRAL_SELLO_CALIDAD_PRECIO = 70     # score_final minimo para el nº1 de su categoria
NIVEL_SELLO_VERIFICADO = 4           # nivel de certificacion que da el sello "Verificado"
