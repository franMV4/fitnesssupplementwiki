// La metodologia, en los tres idiomas.
//
// Igual que legal.js y por el mismo motivo: son treinta parrafos largos, y dentro de
// textos.js tapaban las doscientas claves cortas del resto de la web. Aqui estan juntos y
// se leen como lo que son, un documento.
//
// NINGUNA CIFRA VIVE AQUI. Los pesos, los umbrales y las penalizaciones salen del mismo
// fichero de configuracion que usa el motor de puntuacion, y la pagina los mete dentro de
// estas frases. Es la promesa de esta pagina: si el texto y el calculo pudieran decir
// cosas distintas, la pagina no valdria nada. Por eso los textos con numero son funciones
// que reciben el numero ya formateado, no cadenas con la cifra escrita.

export const METODO = {
  titulo: {
    es: 'Metodologia: como se calcula el score y que significa cada nivel',
    en: 'Methodology: how the score is calculated and what each level means',
    fr: 'Méthodologie : comment le score est calculé et ce que signifie chaque niveau',
  },
  descripcion: {
    es: 'Como se puntua cada suplemento, que significan los cuatro niveles de verificacion y '
      + 'por que un analisis pagado por la marca vale menos que una comprobacion contra la '
      + 'fuente.',
    en: 'How each supplement is scored, what the four verification levels mean, and why a lab '
      + 'report paid for by the brand is worth less than a check against the issuing body.',
    fr: 'Comment chaque complément est noté, ce que signifient les quatre niveaux de '
      + 'vérification, et pourquoi une analyse payée par la marque vaut moins qu’une '
      + 'vérification auprès de l’organisme émetteur.',
  },
  antetitulo: { es: 'Documento abierto', en: 'Open document', fr: 'Document ouvert' },
  h1: { es: 'Metodologia', en: 'Methodology', fr: 'Méthodologie' },
  entradilla: {
    es: 'Esta pagina explica exactamente como sale cada numero de esta web. Si algo no se '
      + 'puede explicar aqui, no deberia estar en el ranking.',
    en: 'This page explains exactly where every number on this site comes from. If something '
      + 'cannot be explained here, it should not be in the ranking.',
    fr: 'Cette page explique exactement d’où vient chaque chiffre de ce site. Si quelque chose '
      + 'ne peut pas être expliqué ici, cela ne devrait pas figurer dans le classement.',
  },
  contenido: { es: 'Contenido', en: 'Contents', fr: 'Sommaire' },

  // --- indice lateral ---
  idx_dosis: {
    es: 'Comparamos dosis, no gramos', en: 'We compare doses, not grams',
    fr: 'On compare des doses, pas des grammes',
  },
  idx_niveles: {
    es: 'Los cuatro niveles de verificacion', en: 'The four verification levels',
    fr: 'Les quatre niveaux de vérification',
  },
  idx_formula: { es: 'La formula', en: 'The formula', fr: 'La formule' },
  idx_composicion: {
    es: 'Que lleva de verdad cada bote', en: 'What each tub really contains',
    fr: 'Ce que contient vraiment chaque pot',
  },
  idx_requisitos: {
    es: 'Los requisitos de cada categoria', en: 'Each category’s requirements',
    fr: 'Les exigences de chaque catégorie',
  },
  idx_referencias: {
    es: 'De donde salen las dosis', en: 'Where the doses come from',
    fr: 'D’où viennent les doses',
  },
  idx_sellos: {
    es: 'Los sellos de recomendacion', en: 'The recommendation badges',
    fr: 'Les labels de recommandation',
  },
  idx_afiliacion: { es: 'Afiliacion', en: 'Affiliate links', fr: 'Affiliation' },
  idx_principios: { es: 'Que no hacemos', en: 'What we do not do', fr: 'Ce que nous ne faisons pas' },
  idx_limitaciones: {
    es: 'Limitaciones conocidas', en: 'Known limitations', fr: 'Limites connues',
  },

  // --- 01 unidad de venta ---
  h2_dosis: {
    es: 'Comparamos en la unidad en la que se vende',
    en: 'We compare in the unit it is sold in',
    fr: 'On compare dans l’unité de vente',
  },
  dosis_p1a: { es: 'Cada categoria se compara por ', en: 'Each category is compared by ', fr: 'Chaque catégorie est comparée au ' },
  dosis_por_kilo: { es: 'precio por kilo', en: 'price per kilo', fr: 'prix au kilo' },
  dosis_p1b: {
    es: ' si se vende en polvo y por ', en: ' if it is sold as a powder and by ',
    fr: ' si elle est vendue en poudre et au ',
  },
  dosis_por_capsula: { es: 'precio por capsula', en: 'price per capsule', fr: 'prix à la gélule' },
  dosis_p1c: {
    es: ' si se vende en perlas o comprimidos. Las dos unidades no se mezclan nunca en la '
      + 'misma tabla: 30 €/kg y 0,07 €/capsula no son numeros comparables, y ponerlos en la '
      + 'misma columna seria un ranking inventado. Un producto cuya ficha no dice cuanto trae '
      + 'el envase no entra en la comparativa.',
    en: ' if it is sold as softgels or tablets. The two units are never mixed in the same '
      + 'table: €30/kg and €0.07/capsule are not comparable numbers, and putting them in the '
      + 'same column would be a made-up ranking. A product whose page does not say how much '
      + 'the pack contains does not enter the comparison.',
    fr: ' si elle est vendue en capsules ou comprimés. Les deux unités ne sont jamais '
      + 'mélangées dans le même tableau : 30 €/kg et 0,07 €/gélule ne sont pas des nombres '
      + 'comparables, et les mettre dans la même colonne serait un classement inventé. Un '
      + 'produit dont la fiche ne dit pas ce que contient l’emballage n’entre pas dans le '
      + 'comparatif.',
  },
  dosis_p2: {
    es: 'El precio es el que paga hoy el comprador, no el tachado, y sale de la ficha de la '
      + 'tienda el dia que se recogieron los datos. Las variantes de sabor de un mismo '
      + 'producto se agrupan en una fila para que la tabla no ensene ocho veces lo mismo.',
    en: 'The price is the one a buyer pays today, not the crossed-out one, and it comes from '
      + 'the store page on the day the data was collected. Flavour variants of the same '
      + 'product are grouped into one row so the table does not show the same thing eight '
      + 'times.',
    fr: 'Le prix est celui que paie l’acheteur aujourd’hui, pas le prix barré, et il vient de '
      + 'la fiche de la boutique le jour du relevé. Les variantes de parfum d’un même produit '
      + 'sont regroupées en une ligne pour que le tableau ne montre pas huit fois la même '
      + 'chose.',
  },
  dosis_p3_negrita: {
    es: 'Y ademas, cuando se puede, el coste por dosis efectiva.',
    en: 'And on top of that, where possible, the cost per effective dose.',
    fr: 'Et en plus, quand c’est possible, le coût par dose efficace.',
  },
  dosis_p3a: {
    es: ' El precio por kilo compara envases, no lo que te llevas: un bote barato por kilo con '
      + 'la mitad de activo por servicio no es barato, es la mitad de bote. Cuando la tienda '
      + 'publica cuanto activo lleva cada dosis, calculamos tambien cuantas ',
    en: ' Price per kilo compares packs, not what you take home: a tub that is cheap per kilo '
      + 'with half the active ingredient per serving is not cheap, it is half a tub. When the '
      + 'store publishes how much active ingredient each dose carries, we also work out how '
      + 'many ',
    fr: ' Le prix au kilo compare des emballages, pas ce que vous emportez : un pot pas cher '
      + 'au kilo avec deux fois moins d’actif par portion n’est pas bon marché, c’est un demi-'
      + 'pot. Quand la boutique publie la quantité d’actif par dose, nous calculons aussi '
      + 'combien de ',
  },
  dosis_efectivas: {
    es: 'dosis efectivas', en: 'effective doses', fr: 'doses efficaces',
  },
  dosis_p3b: {
    es: ' da el envase segun la dosis de referencia citada, y esa cifra sale en la ficha del '
      + 'producto. No mueve el ranking, porque la mayoria de las tiendas no publican ese dato '
      + 'y rankear con el dejaria fuera a media tabla; pero cuando esta, es lo que de verdad '
      + 'distingue dos botes que cuestan lo mismo por kilo.',
    en: ' the pack gives according to the reference dose cited, and that figure appears on the '
      + 'product page. It does not move the ranking, because most stores do not publish that '
      + 'data and ranking with it would leave half the table out; but when it is there, it is '
      + 'what really separates two tubs that cost the same per kilo.',
    fr: ' donne l’emballage selon la dose de référence citée, et ce chiffre figure sur la '
      + 'fiche produit. Cela ne déplace pas le classement, car la plupart des boutiques ne '
      + 'publient pas cette donnée et classer avec elle exclurait la moitié du tableau ; mais '
      + 'quand elle est là, c’est ce qui distingue vraiment deux pots au même prix au kilo.',
  },
  dosis_p4: {
    es: 'Por eso el concentrado y el aislado de suero son dos categorias distintas y no una: '
      + 'un kilo de concentrado lleva unos 750 g de proteina y uno de aislado unos 880, asi '
      + 'que compararlos en la misma tabla por precio por kilo pondria siempre al concentrado '
      + 'por delante por llevar mas relleno. En el coste por dosis de la ficha esa diferencia '
      + 'si se descuenta, con la pureza tipica de cada categoria citada en la tabla de dosis.',
    en: 'That is why whey concentrate and whey isolate are two separate categories and not '
      + 'one: a kilo of concentrate carries about 750 g of protein and a kilo of isolate about '
      + '880, so comparing them in the same table by price per kilo would always put the '
      + 'concentrate ahead for carrying more filler. In the cost per dose on the product page '
      + 'that difference is discounted, with the typical purity of each category cited in the '
      + 'dose table.',
    fr: 'C’est pourquoi le concentré et l’isolat de lactosérum sont deux catégories distinctes '
      + 'et non une seule : un kilo de concentré contient environ 750 g de protéine et un kilo '
      + 'd’isolat environ 880, donc les comparer dans le même tableau au prix au kilo mettrait '
      + 'toujours le concentré devant parce qu’il contient plus de charge. Dans le coût par '
      + 'dose de la fiche, cette différence est bien déduite, avec la pureté typique de chaque '
      + 'catégorie citée dans le tableau des doses.',
  },
  dosis_p5_negrita: {
    es: 'Cuando no hay datos, no hay nota.', en: 'No data, no mark.',
    fr: 'Pas de donnée, pas de note.',
  },
  dosis_p5: {
    es: ' Si la tienda no publica cuanto activo lleva cada dosis, el producto aparece con su '
      + 'precio y con un cero: no le asignamos una dosis tipica ni le suponemos la formula. '
      + 'Los multivitaminicos van asi enteros, porque no existe una dosis de referencia unica '
      + 'para veinte micronutrientes a la vez.',
    en: ' If the store does not publish how much active ingredient each dose carries, the '
      + 'product appears with its price and a zero: we assign it no typical dose and assume no '
      + 'formula. Multivitamins go entirely this way, because there is no single reference '
      + 'dose for twenty micronutrients at once.',
    fr: ' Si la boutique ne publie pas la quantité d’actif par dose, le produit apparaît avec '
      + 'son prix et un zéro : nous ne lui attribuons pas de dose typique et ne supposons pas '
      + 'sa formule. Les multivitamines passent entièrement par là, car il n’existe pas de '
      + 'dose de référence unique pour vingt micronutriments à la fois.',
  },

  // --- 02 niveles ---
  h2_niveles: {
    es: 'Los cuatro niveles de verificacion', en: 'The four verification levels',
    fr: 'Les quatre niveaux de vérification',
  },
  col_nivel: { es: 'Nivel', en: 'Level', fr: 'Niveau' },
  col_significa: { es: 'Que significa', en: 'What it means', fr: 'Ce que cela signifie' },
  col_peso: { es: 'Peso en la calidad', en: 'Weight in quality', fr: 'Poids dans la qualité' },
  col_significa_corto: { es: 'Significa', en: 'Means', fr: 'Signifie' },
  col_peso_corto: { es: 'Peso', en: 'Weight', fr: 'Poids' },
  niveles_p1_negrita: {
    es: 'El nivel 4 lo dan dos cosas, y la ficha dice cual.',
    en: 'Level 4 comes from two things, and the product page says which.',
    fr: 'Le niveau 4 vient de deux choses, et la fiche dit laquelle.',
  },
  niveles_p1a: {
    es: ' La primera es una comprobacion nuestra contra la fuente que emite el sello: el '
      + 'codigo QS del envase en creapure.com, o el lote en la lista publica de Informed '
      + 'Sport. La segunda es que el producto lleve ',
    en: ' The first is a check of ours against the body that issues the certification: the QS '
      + 'code on the pack at creapure.com, or the batch in Informed Sport’s public list. The '
      + 'second is that the product carries ',
    fr: ' La première est une vérification de notre part auprès de l’organisme qui délivre le '
      + 'label : le code QS de l’emballage sur creapure.com, ou le lot dans la liste publique '
      + 'd’Informed Sport. La seconde est que le produit porte ',
  },
  niveles_en_nombre: {
    es: 'Creapure o IFOS en el nombre', en: 'Creapure or IFOS in its name',
    fr: 'Creapure ou IFOS dans son nom',
  },
  niveles_p1b: {
    es: '. Creapure es una marca registrada de Alzchem y solo puede ponerla en el nombre de su '
      + 'producto quien tiene contrato de licencia. IFOS es el programa de analisis por lotes '
      + 'de Nutrasource: los analiza un laboratorio independiente y publica el informe de cada '
      + 'lote, asi que tampoco es un logo que uno se ponga. Ninguno de los dos es decorativo: '
      + 'son afirmaciones que obligan legalmente a la marca y que la tienda firma al listarlas '
      + 'en su catalogo. Solo comparamos tiendas que responden de lo que publican, asi que lo '
      + 'tratamos como lo que es, una certificacion de un tercero, y no como un sello suelto '
      + 'impreso en la etiqueta.',
    en: '. Creapure is a registered trademark of Alzchem and only a licensee can put it in a '
      + 'product name. IFOS is Nutrasource’s batch testing programme: an independent lab tests '
      + 'them and publishes the report for each batch, so it is not a logo you just add '
      + 'either. Neither is decorative: they are claims that legally bind the brand and that '
      + 'the store signs off on by listing them in its catalogue. We only compare stores that '
      + 'answer for what they publish, so we treat it as what it is, a third-party '
      + 'certification, and not as a loose logo printed on the label.',
    fr: '. Creapure est une marque déposée d’Alzchem et seul un licencié peut la faire figurer '
      + 'dans le nom d’un produit. IFOS est le programme d’analyse par lots de Nutrasource : '
      + 'un laboratoire indépendant les analyse et publie le rapport de chaque lot, ce n’est '
      + 'donc pas non plus un logo qu’on s’attribue. Aucun des deux n’est décoratif : ce sont '
      + 'des affirmations qui engagent juridiquement la marque et que la boutique endosse en '
      + 'les listant dans son catalogue. Nous ne comparons que des boutiques qui répondent de '
      + 'ce qu’elles publient, donc nous le traitons pour ce que c’est, une certification '
      + 'd’un tiers, et pas un label isolé imprimé sur l’étiquette.',
  },
  niveles_p2_negrita: {
    es: 'Que no significa.', en: 'What it does not mean.', fr: 'Ce que cela ne signifie pas.',
  },
  niveles_p2a: {
    es: ' Que el nombre declare Creapure no quiere decir que hayamos tenido ese bote en la '
      + 'mano ni que hayamos tecleado su codigo QS: eso solo se puede hacer producto a '
      + 'producto, con el envase fisico delante. En la ficha de cada producto se ve exactamente '
      + 'de donde sale su nivel 4, con la fecha y el enlace de la prueba, y si viene de un '
      + 'codigo QS comprobado se dice con esas palabras. Y solo cuenta si esta en el ',
    en: ' That the name states Creapure does not mean we have held that tub in our hands or '
      + 'typed in its QS code: that can only be done product by product, with the physical '
      + 'pack in front of you. On each product page you can see exactly where its level 4 '
      + 'comes from, with the date and the link to the proof, and if it comes from a checked '
      + 'QS code it says so in those words. And it only counts if it is in the ',
    fr: ' Que le nom indique Creapure ne veut pas dire que nous avons eu ce pot en main ni que '
      + 'nous avons saisi son code QS : cela ne peut se faire que produit par produit, avec '
      + 'l’emballage physique devant soi. Sur la fiche de chaque produit on voit exactement '
      + 'd’où vient son niveau 4, avec la date et le lien de la preuve, et s’il vient d’un '
      + 'code QS vérifié, c’est dit en ces termes. Et cela ne compte que si c’est dans le ',
  },
  niveles_nombre: { es: 'nombre', en: 'name', fr: 'nom' },
  niveles_p2b: {
    es: ': en la descripcion larga de una ficha aparece "Creapure" de otros productos de la '
      + 'misma tienda, y eso no afirma nada de este.',
    en: ': the long description of a product page shows "Creapure" from other products in the '
      + 'same store, and that claims nothing about this one.',
    fr: ' : la description longue d’une fiche fait apparaître « Creapure » d’autres produits '
      + 'de la même boutique, et cela n’affirme rien sur celui-ci.',
  },
  niveles_p3_negrita: {
    es: 'Por que el nivel 3 vale menos que el 4.',
    en: 'Why level 3 is worth less than level 4.',
    fr: 'Pourquoi le niveau 3 vaut moins que le 4.',
  },
  niveles_p3: {
    es: ' Un analisis publicado por la propia marca lo encarga y lo paga la parte interesada: '
      + 'elige el laboratorio, elige el lote y elige si publica el resultado. Un codigo QS de '
      + 'Creapure o un lote en la lista de Informed Sport los emite y los mantiene un tercero '
      + 'al que la marca no paga por aprobar, y cualquiera puede consultarlos. No decimos que '
      + 'un analisis de marca sea falso: decimos que prueba menos.',
    en: ' A lab report published by the brand itself is commissioned and paid for by the '
      + 'interested party: it picks the lab, picks the batch and picks whether to publish the '
      + 'result. A Creapure QS code or a batch in the Informed Sport list are issued and '
      + 'maintained by a third party the brand does not pay to approve, and anyone can look '
      + 'them up. We are not saying a brand lab report is false: we are saying it proves less.',
    fr: ' Une analyse publiée par la marque elle-même est commandée et payée par la partie '
      + 'intéressée : elle choisit le laboratoire, choisit le lot et choisit si elle publie le '
      + 'résultat. Un code QS Creapure ou un lot dans la liste d’Informed Sport sont délivrés '
      + 'et tenus à jour par un tiers que la marque ne paie pas pour approuver, et n’importe '
      + 'qui peut les consulter. Nous ne disons pas qu’une analyse de marque est fausse : nous '
      + 'disons qu’elle prouve moins.',
  },
  niveles_p4_negrita: {
    es: 'Por que el nivel 2 es tan bajo.', en: 'Why level 2 is so low.',
    fr: 'Pourquoi le niveau 2 est si bas.',
  },
  niveles_p4: {
    es: ' Que un sello aparezca impreso en la etiqueta o mencionado en la ficha de la tienda '
      + 'no demuestra nada: ha habido casos de logos usados sin certificacion detras. Un sello '
      + 'solo sube a nivel 4 si lo hemos comprobado contra la fuente que lo emite, y queda '
      + 'registrada la fecha de esa comprobacion.',
    en: ' A certification printed on the label or mentioned on the store page proves nothing: '
      + 'there have been cases of logos used with no certification behind them. A '
      + 'certification only rises to level 4 if we have checked it against the body that '
      + 'issues it, and the date of that check is recorded.',
    fr: ' Qu’un label soit imprimé sur l’étiquette ou mentionné sur la fiche de la boutique ne '
      + 'prouve rien : il y a eu des cas de logos utilisés sans certification derrière. Un '
      + 'label ne monte au niveau 4 que si nous l’avons vérifié auprès de l’organisme qui le '
      + 'délivre, et la date de cette vérification est enregistrée.',
  },

  // --- 03 formula ---
  h2_formula: { es: 'La formula', en: 'The formula', fr: 'La formule' },
  formula_rotulo: { es: 'La formula', en: 'The formula', fr: 'La formule' },
  formula_nota: { es: 'nota', en: 'score', fr: 'note' },
  formula_coste: { es: 'coste', en: 'cost', fr: 'coût' },
  formula_calidad: { es: 'calidad', en: 'quality', fr: 'qualité' },
  formula_opiniones: { es: 'opiniones', en: 'reviews', fr: 'avis' },
  formula_intro: {
    es: 'El score final va de 0 a 100 y se reparte asi:',
    en: 'The final score runs from 0 to 100 and is split like this:',
    fr: 'Le score final va de 0 à 100 et se répartit ainsi :',
  },
  bloque_calidad: { es: 'Calidad', en: 'Quality', fr: 'Qualité' },
  bloque_calidad_p: {
    es: (pref, alt, desc) => 'Nivel de verificacion x forma quimica del activo x composicion '
      + 'real x adecuacion de las dosis (las dos ultimas, solo cuando la tienda las publica; '
      + `si no, no se afirma nada de la formula). La forma estudiada puntua ${pref}, una forma `
      + `alternativa ${alt} y una forma no declarada ${desc}.`,
    en: (pref, alt, desc) => 'Verification level x chemical form of the active ingredient x '
      + 'actual composition x how well the doses match (the last two only when the store '
      + `publishes them; if not, nothing is claimed about the formula). The studied form scores `
      + `${pref}, an alternative form ${alt} and an undeclared form ${desc}.`,
    fr: (pref, alt, desc) => 'Niveau de vérification x forme chimique de l’actif x composition '
      + 'réelle x adéquation des doses (les deux dernières seulement quand la boutique les '
      + `publie ; sinon, rien n’est affirmé sur la formule). La forme étudiée obtient ${pref}, `
      + `une forme alternative ${alt} et une forme non déclarée ${desc}.`,
  },
  bloque_precio: { es: 'Precio', en: 'Price', fr: 'Prix' },
  bloque_precio_p: {
    es: 'El precio por kilo (o por capsula) comparado con el mas barato de su categoria, que '
      + 'se lleva el 100 %. Un producto sin formato declarado se queda sin esta parte.',
    en: 'The price per kilo (or per capsule) compared with the cheapest in its category, which '
      + 'takes 100 %. A product with no declared pack size gets none of this part.',
    fr: 'Le prix au kilo (ou à la gélule) comparé au moins cher de sa catégorie, qui prend '
      + '100 %. Un produit sans format déclaré n’obtient rien de cette partie.',
  },
  bloque_requisitos: { es: 'Requisitos', en: 'Requirements', fr: 'Exigences' },
  bloque_requisitos_p: {
    es: 'De los requisitos de su categoria que se han podido comprobar en su ficha, cuantos '
      + 'cumple. Es la pregunta que no contestan ni el precio ni la certificacion: ',
    en: 'Of its category’s requirements that could be checked on its page, how many it meets. '
      + 'It is the question neither price nor certification answers: ',
    fr: 'Parmi les exigences de sa catégorie qui ont pu être vérifiées sur sa fiche, combien '
      + 'il en remplit. C’est la question à laquelle ni le prix ni la certification ne '
      + 'répondent : ',
  },
  bloque_requisitos_enlace: {
    es: '¿esto es lo que dice ser?', en: 'is this what it says it is?',
    fr: 'est-ce bien ce qu’il prétend être ?',
  },
  bloque_opiniones: { es: 'Opiniones', en: 'Reviews', fr: 'Avis' },
  bloque_opiniones_p: {
    es: (n) => 'La nota que le ponen los compradores en la tienda que lo vende, normalizada a '
      + '5 (hay tiendas que puntuan sobre 10). Pesa poco a proposito: son resenas sin '
      + 'verificar y moderadas por la propia tienda. Y se amortigua con la media de su '
      + `categoria, como si cada producto empezara con ${n} opiniones prestadas: asi una unica `
      + 'resena de cinco estrellas no adelanta a un producto con cientos. Quien no tiene '
      + 'opiniones cuenta como la media: no publicarlas no es una falta.',
    en: (n) => 'The rating buyers give it at the store that sells it, normalised to 5 (some '
      + 'stores rate out of 10). It weighs little on purpose: they are unverified reviews '
      + 'moderated by the store itself. And it is damped with the category average, as if each '
      + `product started with ${n} borrowed reviews: that way a single five-star review does `
      + 'not overtake a product with hundreds. A product with no reviews counts as the '
      + 'average: not publishing them is not a fault.',
    fr: (n) => 'La note que lui donnent les acheteurs dans la boutique qui le vend, normalisée '
      + 'sur 5 (certaines boutiques notent sur 10). Elle pèse peu à dessein : ce sont des avis '
      + 'non vérifiés et modérés par la boutique elle-même. Et elle est amortie par la moyenne '
      + `de sa catégorie, comme si chaque produit démarrait avec ${n} avis prêtés : ainsi un `
      + 'unique avis cinq étoiles ne dépasse pas un produit qui en a des centaines. Un produit '
      + 'sans avis compte comme la moyenne : ne pas en publier n’est pas une faute.',
  },
  infradosaje_negrita: { es: 'Infradosaje.', en: 'Underdosing.', fr: 'Sous-dosage.' },
  infradosaje: {
    es: (umbral, mult) => ` Un ingrediente clave presente por debajo del ${umbral} de su dosis `
      + `efectiva minima marca el producto como infradosificado y multiplica su calidad por `
      + `${mult}. Es el castigo al `,
    en: (umbral, mult) => ` A key ingredient present below ${umbral} of its minimum effective `
      + `dose marks the product as underdosed and multiplies its quality by ${mult}. It is the `
      + 'penalty for ',
    fr: (umbral, mult) => ` Un ingrédient clé présent sous ${umbral} de sa dose efficace `
      + `minimale marque le produit comme sous-dosé et multiplie sa qualité par ${mult}. C’est `
      + 'la sanction du ',
  },
  infradosaje_cola: {
    es: ': meter un ingrediente famoso en cantidad simbolica para poder ponerlo en la etiqueta.',
    en: ': putting a famous ingredient in token amounts just to be able to list it on the label.',
    fr: ' : mettre un ingrédient célèbre en quantité symbolique juste pour pouvoir l’afficher '
      + 'sur l’étiquette.',
  },
  formula_cierre: {
    es: 'Todos estos pesos estan en un unico fichero de configuracion del proyecto, y esta '
      + 'pagina se genera desde ese mismo fichero: no pueden decir una cosa distinta de lo que '
      + 'hace el calculo.',
    en: 'All of these weights live in a single configuration file in the project, and this '
      + 'page is generated from that same file: they cannot say something different from what '
      + 'the calculation does.',
    fr: 'Tous ces poids vivent dans un unique fichier de configuration du projet, et cette '
      + 'page est générée depuis ce même fichier : ils ne peuvent pas dire autre chose que ce '
      + 'que fait le calcul.',
  },

  // --- 04 composicion ---
  h2_composicion: {
    es: 'Que lleva de verdad cada bote', en: 'What each tub really contains',
    fr: 'Ce que contient vraiment chaque pot',
  },
  composicion_p1a: {
    es: 'Dos proteinas al mismo precio por kilo no son el mismo producto. Cuando la ficha '
      + 'publica su tabla nutricional, se lee ',
    en: 'Two proteins at the same price per kilo are not the same product. When the page '
      + 'publishes its nutrition table, we read ',
    fr: 'Deux protéines au même prix au kilo ne sont pas le même produit. Quand la fiche '
      + 'publie son tableau nutritionnel, on lit ',
  },
  composicion_negrita: {
    es: 'cuanto del bote es activo', en: 'how much of the tub is active ingredient',
    fr: 'quelle part du pot est de l’actif',
  },
  composicion_p1b: {
    es: (sube, baja) => ': si declara 82 g de proteina por cada 100 g de polvo, esos son los '
      + 'gramos que se pagan, y el coste por dosis efectiva se calcula con esa cifra y no con '
      + 'la media de la categoria. Una composicion mejor que la tipica sube la calidad hasta '
      + `un ${sube} y una peor la baja hasta un ${baja}.`,
    en: (sube, baja) => ': if it declares 82 g of protein per 100 g of powder, those are the '
      + 'grams you pay for, and the cost per effective dose is computed with that figure and '
      + 'not with the category average. A composition better than the typical one raises '
      + `quality by up to ${sube} and a worse one lowers it by up to ${baja}.`,
    fr: (sube, baja) => ' : s’il déclare 82 g de protéine pour 100 g de poudre, ce sont ces '
      + 'grammes-là que vous payez, et le coût par dose efficace est calculé avec ce chiffre '
      + 'et non avec la moyenne de la catégorie. Une composition meilleure que la moyenne fait '
      + `monter la qualité jusqu’à ${sube} et une moins bonne la fait baisser jusqu’à ${baja}.`,
  },
  aditivos_a: {
    es: 'De la lista de ingredientes de la etiqueta se leen ademas los',
    en: 'From the ingredient list on the label we also read the',
    fr: 'Dans la liste d’ingrédients de l’étiquette, on lit aussi les',
  },
  aditivos_negrita: { es: ' aditivos', en: ' additives', fr: ' additifs' },
  aditivos_b: {
    es: (uno, tope) => `: edulcorantes artificiales, colorantes, rellenos y antiaglomerantes. `
      + `Cada uno resta un ${uno} de la calidad, y entre todos no pueden restar mas del `
      + `${tope}. No son ilegales ni peligrosos: son lo que separa una etiqueta limpia de una `
      + 'que rellena y colorea.',
    en: (uno, tope) => ': artificial sweeteners, colourings, fillers and anti-caking agents. '
      + `Each one takes ${uno} off quality, and between them they cannot take off more than `
      + `${tope}. They are neither illegal nor dangerous: they are what separates a clean `
      + 'label from one that fills and colours.',
    fr: (uno, tope) => ' : édulcorants artificiels, colorants, charges et antiagglomérants. '
      + `Chacun retire ${uno} de la qualité, et à eux tous ils ne peuvent pas en retirer plus `
      + `de ${tope}. Ils ne sont ni illégaux ni dangereux : ils sont ce qui sépare une `
      + 'étiquette propre d’une étiquette qui remplit et colore.',
  },
  composicion_p3_negrita: {
    es: 'Lo que la tienda no publica no resta.',
    en: 'What the store does not publish does not count against it.',
    fr: 'Ce que la boutique ne publie pas ne retire rien.',
  },
  composicion_p3: {
    es: ' Un producto cuya ficha no trae tabla nutricional ni lista de ingredientes se puntua '
      + 'como hasta ahora, con la pureza tipica de su categoria y sin penalizacion ninguna. '
      + 'Castigarlo por lo que su tienda no escribe seria inventarse el dato.',
    en: ' A product whose page carries no nutrition table and no ingredient list is scored as '
      + 'before, with the typical purity of its category and no penalty at all. Punishing it '
      + 'for what its store does not write would be making the data up.',
    fr: ' Un produit dont la fiche ne comporte ni tableau nutritionnel ni liste d’ingrédients '
      + 'est noté comme avant, avec la pureté typique de sa catégorie et sans aucune pénalité. '
      + 'Le sanctionner pour ce que sa boutique n’écrit pas reviendrait à inventer la donnée.',
  },

  // --- 05 requisitos ---
  h2_requisitos: {
    es: 'Los requisitos de cada categoria', en: 'Each category’s requirements',
    fr: 'Les exigences de chaque catégorie',
  },
  requisitos_p1a: {
    es: 'El precio por kilo no distingue un kilo de creatina de un kilo de creatina con un '
      + 'tercio de maltodextrina: ',
    en: 'Price per kilo does not tell a kilo of creatine from a kilo of creatine with a third '
      + 'of maltodextrin in it: ',
    fr: 'Le prix au kilo ne distingue pas un kilo de créatine d’un kilo de créatine avec un '
      + 'tiers de maltodextrine : ',
  },
  requisitos_negrita: {
    es: 'el segundo sale mas barato y rinde menos',
    en: 'the second comes out cheaper and delivers less',
    fr: 'le second revient moins cher et rend moins',
  },
  requisitos_p1b: {
    es: (peso) => '. La certificacion tampoco lo ve, porque certifica que no hay dopantes, no '
      + `que no haya relleno. Los requisitos son la tercera pregunta, y valen ${peso} de la nota.`,
    en: (peso) => '. Certification does not see it either, because it certifies there are no '
      + `doping agents, not that there is no filler. Requirements are the third question, and `
      + `they are worth ${peso} of the mark.`,
    fr: (peso) => '. La certification ne le voit pas non plus, car elle certifie l’absence de '
      + 'produits dopants, pas l’absence de charge. Les exigences sont la troisième question, '
      + `et elles valent ${peso} de la note.`,
  },
  requisitos_p2: {
    es: 'Cada categoria tiene los suyos y son publicos: estan en la ficha de cada producto, '
      + 'uno a uno, con un si o un no y el motivo. Una whey tiene que traer al menos 70 g de '
      + 'proteina por cada 100 g, no llevar aminoacidos sueltos anadidos ni proteinas mas '
      + 'baratas mezcladas y no rebajarse con harinas. Un magnesio tiene que venir en una '
      + 'forma que se absorba y no en oxido. Un probiotico tiene que identificar sus cepas y '
      + 'declarar sus UFC. Un preentreno no puede esconder las dosis en una mezcla propietaria.',
    en: 'Each category has its own and they are public: they are on every product page, one '
      + 'by one, with a yes or a no and the reason. A whey has to carry at least 70 g of '
      + 'protein per 100 g, carry no added free amino acids and no cheaper proteins blended '
      + 'in, and not be cut with flours. A magnesium has to come in a form that is absorbed '
      + 'and not as oxide. A probiotic has to identify its strains and declare its CFU. A '
      + 'pre-workout cannot hide the doses in a proprietary blend.',
    fr: 'Chaque catégorie a les siennes et elles sont publiques : elles figurent sur la fiche '
      + 'de chaque produit, une par une, avec un oui ou un non et le motif. Une whey doit '
      + 'apporter au moins 70 g de protéine pour 100 g, ne pas contenir d’acides aminés libres '
      + 'ajoutés ni de protéines moins chères mélangées, et ne pas être coupée avec des '
      + 'farines. Un magnésium doit venir sous une forme qui s’absorbe et pas en oxyde. Un '
      + 'probiotique doit identifier ses souches et déclarer ses UFC. Un pré-workout ne peut '
      + 'pas cacher les doses dans un mélange propriétaire.',
  },
  requisitos_p3_negrita: {
    es: 'Un requisito que no se puede comprobar no puntua.',
    en: 'A requirement that cannot be checked does not score.',
    fr: 'Une exigence qui ne peut pas être vérifiée ne compte pas.',
  },
  requisitos_p3: {
    es: ' "No lleva relleno" solo se puede afirmar leyendo la lista de ingredientes de la '
      + 'etiqueta: que no salga en el nombre del producto no prueba nada, y darlo por bueno '
      + 'premiaria a la tienda que menos publica. La nota es "de los que se han podido juzgar, '
      + 'cuantos cumple", y a quien no se le ha podido juzgar ninguno se le pone la media de '
      + 'su categoria: ni premio ni castigo.',
    en: ' "No filler" can only be claimed by reading the ingredient list on the label: that it '
      + 'does not appear in the product name proves nothing, and taking it for granted would '
      + 'reward the store that publishes least. The mark is "of the ones that could be judged, '
      + 'how many it meets", and a product where none could be judged gets its category '
      + 'average: neither reward nor penalty.',
    fr: ' « Sans charge » ne peut s’affirmer qu’en lisant la liste d’ingrédients de '
      + 'l’étiquette : que cela n’apparaisse pas dans le nom du produit ne prouve rien, et le '
      + 'tenir pour acquis récompenserait la boutique qui publie le moins. La note est « parmi '
      + 'celles qui ont pu être jugées, combien il en remplit », et celui dont aucune n’a pu '
      + 'être jugée reçoit la moyenne de sa catégorie : ni récompense ni sanction.',
  },

  // --- 06 referencias ---
  h2_referencias: {
    es: 'De donde salen las dosis de referencia', en: 'Where the reference doses come from',
    fr: 'D’où viennent les doses de référence',
  },
  referencias_p1: {
    es: 'Cada cifra tiene su fuente citada y se revisa a mano. No se usa ninguna dosis sin '
      + 'referencia publicada.',
    en: 'Every figure has its source cited and is checked by hand. No dose is used without a '
      + 'published reference.',
    fr: 'Chaque chiffre a sa source citée et est vérifié à la main. Aucune dose n’est utilisée '
      + 'sans référence publiée.',
  },
  referencias_p2_negrita: {
    es: 'Quien revisa esto.', en: 'Who checks this.', fr: 'Qui vérifie cela.',
  },
  referencias_p2: {
    es: ' Nadie con un titulo sanitario. Estas cifras las contrasta contra su fuente la misma '
      + 'persona que escribe la web, y no tiene titulacion sanitaria. Por eso cada dosis lleva '
      + 'pegado el DOI del trabajo del que sale: para que no haya que fiarse de quien la '
      + 'copio, sino leer el original. Aqui no vas a encontrar un sello de "revisado por un '
      + 'profesional" mientras no haya un profesional detras de verdad, con nombre y numero de '
      + 'colegiado.',
    en: ' Nobody with a medical qualification. These figures are checked against their source '
      + 'by the same person who writes the site, and they have no healthcare qualification. '
      + 'That is why each dose carries the DOI of the work it comes from: so you do not have '
      + 'to trust whoever copied it, but can read the original. You will not find a "reviewed '
      + 'by a professional" badge here until there is a real professional behind it, with a '
      + 'name and a registration number.',
    fr: ' Personne avec un diplôme de santé. Ces chiffres sont confrontés à leur source par la '
      + 'même personne qui écrit le site, et elle n’a pas de diplôme de santé. C’est pourquoi '
      + 'chaque dose porte le DOI du travail dont elle est tirée : pour ne pas avoir à faire '
      + 'confiance à celui qui l’a recopiée, mais pouvoir lire l’original. Vous ne trouverez '
      + 'pas ici de label « relu par un professionnel » tant qu’il n’y aura pas un vrai '
      + 'professionnel derrière, avec un nom et un numéro d’inscription.',
  },
  col_ingrediente: { es: 'Ingrediente', en: 'Ingredient', fr: 'Ingrédient' },
  col_dosis: { es: 'Dosis efectiva', en: 'Effective dose', fr: 'Dose efficace' },
  col_dosis_corto: { es: 'Dosis', en: 'Dose', fr: 'Dose' },
  col_evidencia: { es: 'Evidencia', en: 'Evidence', fr: 'Preuves' },
  col_fuente: { es: 'Fuente', en: 'Source', fr: 'Source' },

  // --- 07 sellos ---
  h2_sellos: {
    es: 'Los sellos de recomendacion', en: 'The recommendation badges',
    fr: 'Les labels de recommandation',
  },
  sellos_p1a: { es: 'Un sello de esta web certifica un ', en: 'A badge from this site certifies an ', fr: 'Un label de ce site certifie un ' },
  sellos_negrita: {
    es: 'criterio editorial', en: 'editorial criterion', fr: 'critère éditorial',
  },
  sellos_p1b: {
    es: ': que un producto cumple una condicion objetiva y publica. No promete ningun efecto '
      + 'sobre tu cuerpo, tu rendimiento ni tu salud, y no deberia leerse asi.',
    en: ': that a product meets an objective, published condition. It promises no effect on '
      + 'your body, your performance or your health, and it should not be read that way.',
    fr: ' : qu’un produit remplit une condition objective et publique. Il ne promet aucun '
      + 'effet sur votre corps, votre performance ou votre santé, et ne devrait pas être lu '
      + 'ainsi.',
  },
  col_sello: { es: 'Sello', en: 'Badge', fr: 'Label' },
  col_criterio: { es: 'Se gana cuando', en: 'Earned when', fr: 'Obtenu quand' },
  col_criterio_corto: { es: 'Criterio', en: 'Criterion', fr: 'Critère' },
  sello_verificado: {
    es: (n) => `Verificado nivel ${n}`, en: (n) => `Verified level ${n}`,
    fr: (n) => `Vérifié niveau ${n}`,
  },
  sello_verificado_criterio: {
    es: 'Su certificacion la respalda un tercero: comprobada contra la fuente que la emite, o '
      + 'una marca de ingrediente licenciada declarada en el nombre del producto. Con fecha y '
      + 'prueba consultable en la ficha.',
    en: 'Its certification is backed by a third party: checked against the body that issues '
      + 'it, or a licensed ingredient trademark declared in the product name. With a date and '
      + 'evidence you can check on the product page.',
    fr: 'Sa certification est garantie par un tiers : vérifiée auprès de l’organisme qui la '
      + 'délivre, ou une marque d’ingrédient sous licence déclarée dans le nom du produit. '
      + 'Avec une date et une preuve consultable sur la fiche.',
  },
  sello_precio: { es: 'Mejor precio', en: 'Best value', fr: 'Meilleur prix' },
  sello_precio_criterio: {
    es: (umbral) => `Es el score mas alto de su categoria y supera ${umbral} sobre 100. Si el `
      + 'mejor de una categoria no llega a ese umbral, esa categoria se queda sin sello: no se '
      + 'reparte por obligacion.',
    en: (umbral) => `It has the highest score in its category and beats ${umbral} out of 100. `
      + 'If the best in a category does not reach that threshold, that category goes without a '
      + 'badge: it is not handed out out of obligation.',
    fr: (umbral) => `Il a le meilleur score de sa catégorie et dépasse ${umbral} sur 100. Si le `
      + 'meilleur d’une catégorie n’atteint pas ce seuil, cette catégorie reste sans label : '
      + 'il n’est pas distribué par obligation.',
  },
  sellos_cierre: {
    es: 'Los dos umbrales salen del mismo fichero de configuracion que puntua, asi que la '
      + 'respuesta a "por que tiene este producto el sello" es siempre su desglose del score, '
      + 'visible en su ficha. No hay sellos negociados ni patrocinados.',
    en: 'Both thresholds come from the same configuration file that does the scoring, so the '
      + 'answer to "why does this product have the badge" is always its score breakdown, '
      + 'visible on its page. There are no negotiated or sponsored badges.',
    fr: 'Les deux seuils viennent du même fichier de configuration qui fait la notation, donc '
      + 'la réponse à « pourquoi ce produit a-t-il le label » est toujours le détail de son '
      + 'score, visible sur sa fiche. Il n’y a ni label négocié ni label sponsorisé.',
  },

  // --- 08 afiliacion ---
  h2_afiliacion: { es: 'Afiliacion', en: 'Affiliate links', fr: 'Affiliation' },
  afil_con: {
    es: 'Algunos enlaces a tienda son de afiliado y pueden dejar una comision.',
    en: 'Some store links are affiliate links and may earn a commission.',
    fr: 'Certains liens vers les boutiques sont affiliés et peuvent rapporter une commission.',
  },
  afil_sin: {
    es: 'Ahora mismo esta web no tiene ningun enlace de afiliado: ningun enlace a tienda deja '
      + 'comision. La regla, para cuando la haya, ya esta escrita y ya esta programada.',
    en: 'Right now this site has no affiliate links at all: no store link earns a commission. '
      + 'The rule, for when there are any, is already written and already coded.',
    fr: 'Pour l’instant ce site n’a aucun lien affilié : aucun lien vers une boutique ne '
      + 'rapporte de commission. La règle, pour le jour où il y en aura, est déjà écrite et '
      + 'déjà codée.',
  },
  afil_a: {
    es: ' Los enlaces de afiliado se aplican ', en: ' Affiliate links are applied ',
    fr: ' Les liens affiliés sont appliqués ',
  },
  afil_despues: { es: 'despues', en: 'after', fr: 'après' },
  afil_b: {
    es: ' de calcular el ranking, en un fichero que el motor de puntuacion no lee. Un producto '
      + 'sin programa de afiliado se enlaza igual y ocupa exactamente el puesto que le da su '
      + 'score. Hay una prueba automatica que cambia los enlaces de afiliado y comprueba que '
      + 'el orden no se mueve.',
    en: ' the ranking is computed, in a file the scoring engine does not read. A product with '
      + 'no affiliate programme is linked just the same and takes exactly the place its score '
      + 'gives it. There is an automated test that swaps the affiliate links and checks the '
      + 'order does not move.',
    fr: ' le calcul du classement, dans un fichier que le moteur de notation ne lit pas. Un '
      + 'produit sans programme d’affiliation est lié pareil et occupe exactement la place que '
      + 'lui donne son score. Un test automatique change les liens affiliés et vérifie que '
      + 'l’ordre ne bouge pas.',
  },

  // --- 09 principios ---
  h2_principios: {
    es: 'Que no hacemos', en: 'What we do not do', fr: 'Ce que nous ne faisons pas',
  },
  pri_1: {
    es: 'No decimos que un producto mejore nada. Los efectos son del ingrediente a la dosis '
      + 'estudiada, con su cita. Un producto solo "contiene X gramos de Y".',
    en: 'We do not say a product improves anything. Effects belong to the ingredient at the '
      + 'studied dose, with its citation. A product only "contains X grams of Y".',
    fr: 'Nous ne disons pas qu’un produit améliore quoi que ce soit. Les effets sont ceux de '
      + 'l’ingrédient à la dose étudiée, avec sa citation. Un produit « contient X grammes de '
      + 'Y », rien de plus.',
  },
  pri_2: {
    es: 'No cobramos por posicion. Ningun acuerdo comercial mueve un producto en el ranking.',
    en: 'We do not charge for position. No commercial deal moves a product in the ranking.',
    fr: 'Nous ne facturons pas la position. Aucun accord commercial ne déplace un produit dans '
      + 'le classement.',
  },
  pri_3: {
    es: 'No marcamos un sello como verificado sin haberlo comprobado en su fuente.',
    en: 'We do not mark a certification as verified without having checked it at its source.',
    fr: 'Nous ne marquons pas un label comme vérifié sans l’avoir contrôlé à sa source.',
  },
  pri_4: {
    es: 'No inventamos datos que la tienda no publica: si falta la dosis por servicio, se dice '
      + 'que falta y el producto puntua peor por ello.',
    en: 'We do not make up data the store does not publish: if the dose per serving is '
      + 'missing, we say it is missing and the product scores worse for it.',
    fr: 'Nous n’inventons pas les données que la boutique ne publie pas : si la dose par '
      + 'portion manque, on dit qu’elle manque et le produit en est pénalisé.',
  },

  // --- 10 limitaciones ---
  h2_limitaciones: {
    es: 'Limitaciones conocidas', en: 'Known limitations', fr: 'Limites connues',
  },
  lim_1: {
    es: 'Los precios cambian a diario y las promociones distorsionan el ranking. La fecha de '
      + 'recogida esta al pie de cada pagina y en cada ficha.',
    en: 'Prices change daily and promotions distort the ranking. The collection date is in the '
      + 'footer of every page and on every product page.',
    fr: 'Les prix changent tous les jours et les promotions faussent le classement. La date de '
      + 'relevé est en pied de chaque page et sur chaque fiche.',
  },
  lim_2: {
    es: 'Hay tiendas que bloquean la recogida automatica de datos. No se fuerzan: simplemente '
      + 'no aparecen, y eso se dice en el repositorio del proyecto.',
    en: 'Some stores block automatic data collection. They are not forced: they simply do not '
      + 'appear, and that is stated in the project repository.',
    fr: 'Certaines boutiques bloquent le relevé automatique des données. Elles ne sont pas '
      + 'forcées : elles n’apparaissent simplement pas, et c’est indiqué dans le dépôt du '
      + 'projet.',
  },
  lim_3: {
    es: 'La verificacion de Creapure exige el codigo QS del envase fisico, asi que solo puede '
      + 'hacerse producto a producto y a mano.',
    en: 'Verifying Creapure requires the QS code on the physical pack, so it can only be done '
      + 'product by product and by hand.',
    fr: 'La vérification de Creapure exige le code QS de l’emballage physique, elle ne peut '
      + 'donc se faire que produit par produit et à la main.',
  },
  lim_nota_negrita: {
    es: 'Ultima actualizacion de los datos:', en: 'Data last updated:',
    fr: 'Dernière mise à jour des données :',
  },
  lim_nota: {
    es: ' Los pesos de esta pagina se leen del mismo fichero de configuracion que calcula el '
      + 'ranking.',
    en: ' The weights on this page are read from the same configuration file that computes the '
      + 'ranking.',
    fr: ' Les poids de cette page sont lus dans le même fichier de configuration qui calcule '
      + 'le classement.',
  },
};

/* Los cuatro niveles de verificacion.
   El dataset los trae en espanol (`datos.niveles`) porque los escribe el pipeline de
   Python, igual que el nombre de las categorias. Aqui van sus versiones en los otros dos
   idiomas, con el mismo par nombre/detalle. */
export const NIVELES_I18N = {
  en: {
    1: { nombre: 'No certification', detalle: 'No certification of any kind on record.' },
    2: { nombre: 'Claimed on the page',
         detalle: 'The certification appears on the product page or the label, with no way to '
                + 'check it.' },
    3: { nombre: 'Lab report published by the brand',
         detalle: 'The brand itself publishes a lab report. It is provided by the interested '
                + 'party, so it is worth less than an independent third party.' },
    4: { nombre: 'Third-party certification',
         detalle: 'The certification is backed by someone other than the brand. Either we '
                + 'checked it with the body that issues it (Creapure QS code, batch in the '
                + 'Informed Sport list), or the product carries in its name a trademark that '
                + 'cannot be used without a third party behind it: Creapure, which requires a '
                + 'licence agreement with the maker of the active ingredient, or IFOS, which '
                + 'tests the batch in an independent lab. Each product page shows which of the '
                + 'two it is and on what date.' },
  },
  fr: {
    1: { nombre: 'Sans certification', detalle: 'Aucune certification n’est enregistrée.' },
    2: { nombre: 'Déclarée sur la fiche',
         detalle: 'Le label figure sur la fiche ou l’étiquette, sans moyen de le vérifier.' },
    3: { nombre: 'Analyse publiée par la marque',
         detalle: 'La marque elle-même publie une analyse de laboratoire. Elle est fournie par '
                + 'la partie intéressée, elle vaut donc moins qu’un tiers indépendant.' },
    4: { nombre: 'Certification d’un tiers',
         detalle: 'Le label est garanti par quelqu’un d’autre que la marque. Soit nous l’avons '
                + 'vérifié auprès de l’organisme qui le délivre (code QS Creapure, lot dans la '
                + 'liste Informed Sport), soit le produit porte dans son nom une marque qui ne '
                + 'peut pas être utilisée sans un tiers derrière : Creapure, qui exige un '
                + 'contrat de licence avec le fabricant de l’actif, ou IFOS, qui analyse le lot '
                + 'dans un laboratoire indépendant. La fiche de chaque produit montre laquelle '
                + 'des deux et à quelle date.' },
  },
};

/** Un texto de la metodologia en el idioma que toque, con el espanol de respaldo. */
export const metodo = (lang) => (clave, ...args) => {
  const entrada = METODO[clave];
  const valor = entrada?.[lang] ?? entrada?.es ?? clave;
  return typeof valor === 'function' ? valor(...args) : valor;
};

/** Los cuatro niveles, traducidos. En espanol salen tal cual del dataset. */
export const nivelesEn = (delDataset, lang) => NIVELES_I18N[lang] ?? delDataset;

// Autocomprobacion: node src/datos/metodologia.js
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('metodologia.js')) {
  const faltan = Object.entries(METODO)
    .filter(([, v]) => !v.es || !v.en || !v.fr)
    .map(([k]) => k);
  if (faltan.length) throw new Error(`entradas incompletas: ${faltan.join(', ')}`);
  for (const l of ['en', 'fr']) {
    for (const n of [1, 2, 3, 4]) {
      const x = NIVELES_I18N[l][n];
      if (!x?.nombre || !x?.detalle) throw new Error(`nivel ${n} incompleto en ${l}`);
    }
  }
  if (!metodo('fr')('h1').startsWith('Méth')) throw new Error('metodo(fr) no devuelve frances');
  if (metodo('pt')('h1') !== METODO.h1.es) throw new Error('sin respaldo al espanol');
  console.log(`metodologia.js OK (${Object.keys(METODO).length} entradas x 3 idiomas)`);
}
