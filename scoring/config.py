"""Todos los pesos de la metodologia, en un solo sitio.

Cambiar aqui cambia el ranking entero sin tocar una linea del motor. Cada valor
esta explicado porque esta pagina se publica en /metodologia: si no sabes defender
un numero, no lo pongas.
"""

# Cuanto vale la calidad frente al precio en el score final. Suman 1.
# El precio se compara en la unidad en que se vende la categoria: EUR/kg en los polvos,
# EUR/capsula en perlas y comprimidos, siempre contra el mas barato de la categoria.
PESO_CALIDAD = 0.5
PESO_COSTE = 0.5

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

# Modo complejo (preentrenos, formulas): a partir de que ratio dosis_real/dosis_min
# se considera infradosaje ("fairy dusting") y cuanto castiga.
UMBRAL_INFRADOSAJE = 0.60
PENALIZACION_INFRADOSAJE = 0.50      # multiplica el score de calidad si hay infradosaje

# Ingredientes que no cuentan como "clave" al juzgar una formula (rellenos y saborizantes).
INGREDIENTES_IGNORADOS = {"sucralosa", "acido_citrico", "aroma", "colorante", "maltodextrina"}

# --- sellos de recomendacion (fase 6) -------------------------------------------
# Criterios objetivos y publicos. Se otorgan por umbral, nunca a dedo.
UMBRAL_SELLO_CALIDAD_PRECIO = 70     # score_final minimo para el nº1 de su categoria
NIVEL_SELLO_VERIFICADO = 4           # nivel de certificacion que da el sello "Verificado"
