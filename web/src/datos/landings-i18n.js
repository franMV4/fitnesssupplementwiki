// El copy generado de las landings (/mejores/, /comparativa/), del "por que una tienda es
// mas barata" (porque.js) y del cara a cara de ingredientes, en los tres idiomas.
//
// POR QUE UN OBJETO POR IDIOMA Y NO UNA CLAVE CON TRES VERSIONES (como textos.js): esto
// no son rotulos, son plantillas con cuatro y cinco huecos que se leen como frases. Con
// las tres versiones de cada plantilla juntas, una funcion de seis lineas quedaba partida
// en tres trozos y no se podia leer ninguna. Aqui cada idioma se lee de corrido, y el
// respaldo es el mismo que en el resto de la web: lo que falte en un idioma sale en
// espanol (ver `copia()`), asi que una plantilla nueva no rompe /en/ ni /fr/.
//
// REGLA DEL FRANCES: el genero. "La meilleure créatine" / "le meilleur collagène" no se
// puede adivinar para 50 terminos, y equivocarse delata una pagina generada. Todas las
// plantillas francesas ponen el termino DELANTE con dos puntos o detras de una
// preposicion ("de créatine", "en créatine"), que no concuerdan con nada.

import { auFr, deFr } from '../frances.js';

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** El nombre de cada ingrediente del dataset (las claves de dosis_referencia). */
const INGREDIENTES = {
  en: {
    proteina_whey_concentrada: 'Whey protein concentrate', creatina_monohidrato: 'Creatine monohydrate',
    glutamina: 'Glutamine', beta_alanina: 'Beta-alanine', zinc: 'Zinc', cafeina: 'Caffeine',
    proteina_whey_aislada: 'Whey protein isolate', bcaa: 'BCAA',
    aminoacidos_esenciales: 'Essential amino acids', calcio: 'Calcium',
    proteina_caseina: 'Casein protein', vitamina_c: 'Vitamin C', proteina_vegetal: 'Plant protein',
    colageno_hidrolizado: 'Hydrolysed collagen', vitamina_e: 'Vitamin E',
    citrulina_malato: 'Citrulline malate', melatonina: 'Melatonin', omega_3_epa_dha: 'Omega 3 EPA DHA',
    glucosamina: 'Glucosamine', magnesio: 'Magnesium', arginina: 'Arginine', hierro: 'Iron',
    taurina: 'Taurine', tirosina: 'Tyrosine', potasio: 'Potassium', carnitina: 'Carnitine',
    creatina_hcl: 'Creatine HCl', ashwagandha: 'Ashwagandha',
    creatina_kre_alkalyn: 'Creatine Kre-Alkalyn', curcuminoides: 'Curcuminoids',
    condroitina: 'Chondroitin',
    // Formas quimicas (campo `forma` del producto).
    hcl: 'HCl', monohidrato: 'Monohydrate', gluconato: 'Gluconate', citrato: 'Citrate',
    kre_alkalyn: 'Kre-Alkalyn',
  },
  fr: {
    proteina_whey_concentrada: 'Protéine whey concentrée', creatina_monohidrato: 'Créatine monohydrate',
    glutamina: 'Glutamine', beta_alanina: 'Bêta-alanine', zinc: 'Zinc', cafeina: 'Caféine',
    proteina_whey_aislada: 'Protéine whey isolate', bcaa: 'BCAA',
    aminoacidos_esenciales: 'Acides aminés essentiels', calcio: 'Calcium',
    proteina_caseina: 'Protéine de caséine', vitamina_c: 'Vitamine C', proteina_vegetal: 'Protéine végétale',
    colageno_hidrolizado: 'Collagène hydrolysé', vitamina_e: 'Vitamine E',
    citrulina_malato: 'Citrulline malate', melatonina: 'Mélatonine', omega_3_epa_dha: 'Oméga 3 EPA DHA',
    glucosamina: 'Glucosamine', magnesio: 'Magnésium', arginina: 'Arginine', hierro: 'Fer',
    taurina: 'Taurine', tirosina: 'Tyrosine', potasio: 'Potassium', carnitina: 'Carnitine',
    creatina_hcl: 'Créatine HCl', ashwagandha: 'Ashwagandha',
    creatina_kre_alkalyn: 'Créatine Kre-Alkalyn', curcuminoides: 'Curcuminoïdes',
    condroitina: 'Chondroïtine',
    hcl: 'HCl', monohidrato: 'Monohydrate', gluconato: 'Gluconate', citrato: 'Citrate',
    kre_alkalyn: 'Kre-Alkalyn',
  },
};

/** El nombre legible de un ingrediente o de una forma, en el idioma que toque. */
export const ingrediente = (clave, lang = 'es') => INGREDIENTES[lang]?.[clave]
  ?? String(clave).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

const TXT = {
  es: {
    // --- numeros ---
    decimal: (n, dec = 1) => n.toFixed(dec).replace(/[.,]0$/, '').replace('.', ','),
    miles: (n) => n.toLocaleString('es-ES'),
    caps: 'caps.',

    // --- sellos ---
    sello_que: {
      creapure: 'Creapure es creatina de Alzchem: usar la marca exige contrato de licencia, asi '
        + 'que el sello lo respalda un tercero y no la tienda.',
      ifos: 'IFOS analiza el lote en un laboratorio independiente y publica el informe, asi que '
        + 'el sello no depende de lo que diga la marca.',
    },

    // --- /mejores/ por sello ---
    sello_matiz: (s) => `Solo los que declaran ${s}.`,
    sello_h1: (c, s, n, u) => `${cap(c.mejor)} con sello ${s}: ${n} productos por precio por ${u}`,
    sello_titulo: (c, s, a) => `Mejor ${c.termino} ${s} ${a}`,
    sello_sufijos: (u) => [`: precio por ${u} y certificacion`, `: precio por ${u} comparado`,
                           `: precio por ${u}`],
    sello_criterio: (c, s, total, que, n, n4) => `Solo los productos cuya ficha declara ${s}, de `
      + `los ${total} de ${c.termino} que compara esta web. ${que} De los ${n}, `
      + (n4 === n
        ? `los ${n} llegan al nivel 4: el sello se ha podido comprobar contra un tercero.`
        : `${n4} llegan al nivel 4 (el sello se ha podido comprobar contra un tercero) y `
          + `${n - n4} se quedan por debajo: lo declaran en la ficha pero no lo llevan en el `
          + 'nombre, y un sello suelto en la etiqueta es la palabra de quien vende.'),

    // --- /mejores/ por tienda ---
    tienda_matiz: (t) => `Solo lo que vende ${t}.`,
    tienda_h1: (c, t, n, u) => `${cap(c.mejor)} de ${t}: ${n} productos por precio por ${u}`,
    tienda_titulo: (c, t, a) => `Mejor ${c.termino} de ${t} ${a}`,
    tienda_sufijos: (u) => [`: precio por ${u} comparado`, `: precio por ${u}`, ': precios comparados'],
    situacion_igual: (m) => `, la misma que la del mercado comparado aqui (${m}).`,
    situacion_encima: (d, n, m) => `, un ${d} % por encima de la mediana de las ${n} tiendas comparadas (${m}).`,
    situacion_debajo: (d, n, m) => `, un ${d} % por debajo de la mediana de las ${n} tiendas comparadas (${m}).`,
    tienda_criterio: (c, t, n, med, sit) => `Los ${n} productos de ${c.termino} que vende ${t}, `
      + `puntuados con el mismo score que el resto de la web. Su mediana es ${med}${sit}`,

    // --- /mejores/ por precio ---
    precio_matiz: 'Solo la mitad mas barata de la categoria.',
    precio_h1: (c, adj, n, med) => `${cap(c.mejor)} ${adj}: ${n} por debajo de ${med}`,
    precio_titulo: (c, adj, a) => `${cap(c.termino)} ${adj} ${a}`,
    precio_sufijos: (n, medEur, u) => [`: ${n} por debajo de ${medEur}/${u}`,
                                       `: ${n} por debajo de la mediana`,
                                       ': los mas baratos por unidad'],
    precio_criterio: (c, n, med, total, desde, hasta, rep) => `La mitad barata de la categoria: `
      + `los ${n} productos de ${c.termino} que cuestan ${med} o menos, que es la mediana de los `
      + `${total} comparados. Van de ${desde} a ${hasta}. Barato no es lo mismo que bueno: el `
      + `orden sigue siendo el score: ${rep}.`,

    // --- /comparativa/ ---
    vs_h1: (a, b, c, u) => `${a} o ${b} en ${c.termino}: cual sale mejor por precio por ${u}`,
    vs_titulo: (a, b, c) => `${a} vs ${b} en ${c.termino}`,
    vs_sufijos: (u) => [`: cual sale mas barato por ${u}`, ': cual sale mas barato', ': precios comparados'],

    // --- respuesta corta de /mejores/ ---
    rm_lider: (n, nom, t, p, nivel) => `De los ${n} productos que pasan este filtro, el que mejor `
      + `puntua es ${nom} de ${t}: ${p} y nivel ${nivel} de verificacion sobre 4.`,
    rm_barato: (u, nom, t, p) => `El mas barato por ${u} es ${nom} de ${t}, a ${p}.`,
    rm_horquilla: (a, b, m) => `La seleccion va de ${a} a ${b}, con una mediana de ${m}.`,

    // --- respuesta corta de /comparativa/ ---
    rc_medianas: (c, a, na, b, nb, u, ma, mb) => `En ${c.termino}, ${a} pone ${na} productos y `
      + `${b} otros ${nb}. Por precio por ${u}, la mediana de ${a} es ${ma} y la de ${b}, ${mb}.`,
    rc_gana: (nom, t, s, p) => `El que mejor puntua de los dos catalogos es ${nom} de ${t}, con ${s} sobre 100 a ${p}.`,
    rc_barato: (u, nom, t, p) => `El mas barato por ${u} es ${nom} de ${t}, a ${p}.`,
    rc_sin_n4: (c) => `Ninguna de las dos tiene productos en el nivel 4 de verificacion: en `
      + `${c.termino} el techo hoy es el analisis publicado por la propia marca, y eso no es un sello.`,
    rc_n4: (n4a, a, n4b, b) => `${n4a} productos de ${a} y ${n4b} de ${b} llegan al nivel 4 de verificacion.`,

    // --- descripciones ---
    desc_mejores: (matiz, n, c, u, desde, f) => `${matiz} ${n} productos de ${c.termino} `
      + `comparados por precio por ${u} (desde ${desde}) y por su nivel de verificacion. `
      + `Datos del ${f}.`,
    desc_vs: (a, b, c, na, nb, u, ma, mb, f) => `${a} o ${b} en ${c.termino}: ${na} y ${nb} `
      + `productos comparados por precio por ${u} (medianas ${ma} y ${mb}) y por certificacion. `
      + `Datos del ${f}.`,

    // --- FAQ de /mejores/ ---
    fm1_p: (c) => `¿${cap(c.mejor)} de esta seleccion?`,
    fm1_r: (nom, t, s, p, crit) => `${nom} de ${t}, con ${s} puntos sobre 100 a ${p}. ${crit}`,
    fm2_p: (u) => `¿Cual es el mas barato por ${u}?`,
    fm2_r: (nom, t, p, formato, envase, nivel) => `${nom} de ${t}, a ${p} (envase de ${formato} `
      + `por ${envase}). Tiene nivel ${nivel} de verificacion sobre 4: el precio es solo la mitad de la nota.`,
    fm3_p: '¿Como se ha hecho esta seleccion?',
    fm3_r: (crit, rep, f) => `${crit} El orden dentro de la tabla es el score de siempre: ${rep}. `
      + `Los enlaces de afiliado no entran en el calculo. Precios recogidos el ${f}.`,

    // --- FAQ de /comparativa/ ---
    fv1_p: (a, b, c) => `¿${a} o ${b} para ${c.termino}?`,
    fv1_r: (u, gana, mg, mo, otro, dif, a, n4a, b, n4b) => `Por precio por ${u}, ${gana}: su `
      + `mediana es ${mg} frente a ${mo} de ${otro}` + (dif > 0 ? `, un ${dif} % mas cara.` : '.')
      + ` La mediana no decide sola: la otra mitad de la nota es la certificacion, y ahi ${a} `
      + `tiene ${n4a} productos en nivel 4 y ${b} tiene ${n4b}.`,
    fv2_p: (c, u) => `¿Cual es ${c.mejor} mas ${u === 'kg' ? 'barata' : 'barato'} de las dos tiendas?`,
    fv2_r: (nom, t, p, formato, envase, nivel) => `${nom} de ${t}, a ${p} (envase de ${formato} `
      + `por ${envase}), con nivel ${nivel} de verificacion sobre 4.`,
    fv3_p: (a, b) => `¿Por que ${a} y ${b} no cuestan lo mismo?`,
    fv4_p: '¿Cual puntua mejor de las dos tiendas?',
    fv4_r: (nom, t, s, rep, f) => `${nom} de ${t}, con ${s} sobre 100. El score es ${rep}, y se `
      + `calcula sin mirar los enlaces de afiliado. Precios del ${f}.`,

    // --- por que una es mas barata (porque.js) ---
    pq_dosis_t: 'Coste de una dosis efectiva',
    pq_dosis_vuelta: (gK, u, gD) => `Aqui se da la vuelta la comparacion: ${gK} gana por ${u} y `
      + `${gD} gana por dosis. El precio por ${u} mide polvo o capsulas; este mide lo que hay que `
      + 'tomarse para que el ingrediente haga lo que dice el estudio, que es lo que se acaba pagando.',
    pq_dosis_igual: (u, g) => `El precio por ${u} y el precio por dosis apuntan a la misma tienda, `
      + `asi que la diferencia de la etiqueta no la borra la dosis: ${g} sale mas barata de las dos maneras.`,
    pq_pureza_t: 'Activo por cada 100 g',
    pq_pureza: (alto, dA, bajo, dB) => `${alto} pone ${dA} g de activo por cada 100 g de producto `
      + `y ${bajo}, ${dB} g. Los ${dA - dB} g de diferencia son aroma, edulcorante y espesante, y `
      + 'en un bote se pagan al mismo precio que el activo: por eso un kilo mas barato puede salir '
      + 'mas caro en cuanto se mide por dosis.',
    pq_formato_t: (caps) => (caps ? 'Capsulas por envase (mediana)' : 'Tamano del envase (mediana)'),
    pq_formato: (grande, caps, u) => `${grande} vende envases mas grandes, y el envase grande `
      + `reparte el mismo bote, la misma etiqueta y el mismo porte entre mas ${caps ? 'capsulas' : 'kilos'}. `
      + `Parte de la diferencia de precio por ${u} es esto y no una rebaja: comparar el formato `
      + 'pequeno de una con el grande de la otra infla la brecha.',
    pq_catalogo_t: 'Marcas distintas en el catalogo',
    pq_catalogo: (propia, marca, pct, reventa, n) => `${propia} vende sobre todo una marca, ${marca}: `
      + `${pct} % de su catalogo en esta categoria. ${reventa} reparte el suyo entre ${n} marcas. `
      + 'Quien vende su propia marca se salta el margen del fabricante y puede bajar el precio sin '
      + 'tocar la formula; quien revende paga ese margen y lo repercute, y a cambio tiene marcas '
      + 'que la otra no vende.',
    pq_aditivos_t: 'Productos con aditivos declarados',
    aditivo: { edulcorante_artificial: 'edulcorantes artificiales', colorante: 'colorantes',
               aroma_artificial: 'aromas artificiales', relleno: 'rellenos',
               antiaglomerante: 'antiaglomerantes' },
    pq_aditivos: (lista, u) => `Lo que declaran las fichas de las dos: ${lista}. Un aditivo no es `
      + 'un fraude, pero ocupa gramos que no son activo y es mas barato que el activo: donde hay '
      + `mas aditivo declarado, el precio por ${u} baja sin que el producto sea mejor.`,
    pq_verif_t: 'Con analisis publicado (nivel 3 o 4)',
    pq_de: (a, b) => `${a} de ${b}`,
    pq_verif: (mas) => `${mas} publica analisis en mas fichas. Analizar un lote en un laboratorio `
      + 'cuesta dinero y se repercute en el precio: parte de lo que se paga de mas es la '
      + 'comprobacion de que dentro hay lo que dice la etiqueta. Es el unico trozo del '
      + 'sobreprecio que se puede leer en un PDF.',
    pq_forma_t: 'Forma quimica del activo',
    pq_forma: (a, la, b, lb) => `${a}: ${la}. ${b}: ${lb}. La forma cambia el coste de `
      + 'fabricacion y la evidencia que hay detras, asi que dos botes del mismo ingrediente a '
      + 'distinto precio pueden no ser el mismo producto.',
    pq_nota_t: 'Nota mediana en la tienda',
    pq_nota: (opA, a, opB, b) => `Sobre ${opA} opiniones en ${a} y ${opB} en ${b}. Son notas de `
      + 'la propia tienda, que es juez y parte: valen para detectar un producto que llega mal o '
      + 'que sabe a rayos, no para decidir que formula es mejor.',
    pq_intro_empate: (p, a, b) => `Las dos medianas se quedan en ${p}, asi que el precio no `
      + `desempata: lo que cambia entre ${a} y ${b} esta en las filas de abajo.`,
    pq_intro: (cara, d, u, barata, pc, pb) => `${cara} cuesta un ${d} % mas por ${u} que ${barata} `
      + `(${pc} frente a ${pb}, medianas de los dos catalogos). `,
    pq_intro_causas: (l) => 'Esa diferencia no cae del cielo. Estos son los datos que la explican, '
      + `con el numero de cada tienda al lado: ${l}.`,
    pq_intro_politica: 'Con lo que declaran las dos fichas no hay diferencias de composicion ni '
      + 'de formato que lo expliquen: aqui la brecha es politica de precios de la tienda.',

    // --- cara a cara (CaraACara.astro) ---
    cc_lo_llevan: (a, b) => `${a} de ${b} lo llevan`,
    cc_llegan: (n) => `${n} llegan a la dosis`,
    cc_ninguno: 'ninguno publica la dosis',
    cc_h2_ing: 'Que lleva dentro cada bote',
    cc_apunte_ing: 'Dosis mediana por servicio',
    cc_ing_p: 'El precio por kilo no dice cuanto activo hay dentro del kilo. Esta tabla si: por '
      + 'cada ingrediente, la dosis mediana de un servicio en cada tienda y cuantos productos '
      + 'llegan a la dosis que tiene estudios detras (la misma referencia con la que puntua esta web).',
    cc_caption_ing: (a, b, c) => `Ingredientes y dosis por servicio en ${a} y ${b}, en ${c.termino}`,
    cc_col_ing: 'Ingrediente',
    cc_desde: (d) => `Dosis con evidencia: desde ${d} por toma`,
    cc_no_lleva: 'no lo lleva',
    cc_nota_ing_t: 'La dosis es por servicio, no por bote.',
    cc_nota_ing: ' Un bote grande con la dosis corta obliga a tomar dos cazos para llegar a lo '
      + 'mismo, y entonces dura la mitad: por eso el precio por dosis de la seccion siguiente no '
      + 'coincide con el precio por kilo.',
    cc_h2_pq: 'Por que una es mas barata que la otra',
    cc_apunte_pq: 'Factor a factor, con el dato de las dos',
    cc_caption_pq: (a, b, c) => `De donde sale la diferencia de precio entre ${a} y ${b} en ${c.termino}`,
    cc_col_factor: 'Factor',
    cc_nota_pq_t: 'Ninguno de estos factores es una acusacion.',
    cc_nota_pq: ' Son medianas de lo que cada tienda publica en sus fichas el dia de la recogida '
      + 'de precios: donde una ficha no declara un dato, esa tienda no cuenta en esa fila en vez '
      + 'de contar como un cero. Un producto concreto puede desmentir la mediana de su tienda, y '
      + 'para eso esta la tabla completa. ',
    cc_como: 'Como se calcula todo esto',
    cc_resto: 'El resto de tiendas',
  },

  en: {
    decimal: (n, dec = 1) => n.toFixed(dec).replace(/\.0$/, ''),
    miles: (n) => n.toLocaleString('en-GB'),
    caps: 'caps.',

    sello_que: {
      creapure: 'Creapure is creatine made by Alzchem: using the trademark requires a licence '
        + 'agreement, so the certification is backed by a third party and not by the store.',
      ifos: 'IFOS tests the batch in an independent lab and publishes the report, so the '
        + 'certification does not depend on what the brand says.',
    },

    sello_matiz: (s) => `Only the ones that declare ${s}.`,
    sello_h1: (c, s, n, u) => `${cap(c.mejor)} with ${s} certification: ${n} products by price per ${u}`,
    sello_titulo: (c, s, a) => `Best ${s} ${c.termino} ${a}`,
    sello_sufijos: (u) => [`: price per ${u} and certification`, `: price per ${u} compared`,
                           `: price per ${u}`],
    sello_criterio: (c, s, total, que, n, n4) => `Only the products whose page declares ${s}, out `
      + `of the ${total} ${c.termino} products this site compares. ${que} Of the ${n}, `
      + (n4 === n
        ? `all ${n} reach level 4: the certification could be checked against a third party.`
        : `${n4} reach level 4 (the certification could be checked against a third party) and `
          + `${n - n4} fall below: they declare it on the page but do not carry it in the name, `
          + 'and a loose logo on the label is the seller’s word.'),

    tienda_matiz: (t) => `Only what ${t} sells.`,
    tienda_h1: (c, t, n, u) => `${cap(c.mejor)} from ${t}: ${n} products by price per ${u}`,
    tienda_titulo: (c, t, a) => `Best ${c.termino} from ${t} ${a}`,
    tienda_sufijos: (u) => [`: price per ${u} compared`, `: price per ${u}`, ': prices compared'],
    situacion_igual: (m) => `, the same as the market compared here (${m}).`,
    situacion_encima: (d, n, m) => `, ${d} % above the median of the ${n} stores compared (${m}).`,
    situacion_debajo: (d, n, m) => `, ${d} % below the median of the ${n} stores compared (${m}).`,
    tienda_criterio: (c, t, n, med, sit) => `The ${n} ${c.termino} products sold by ${t}, scored `
      + `with the same score as the rest of the site. Its median is ${med}${sit}`,

    precio_matiz: 'Only the cheaper half of the category.',
    precio_h1: (c, adj, n, med) => `The best cheap ${c.termino}: ${n} below ${med}`,
    precio_titulo: (c, adj, a) => `Cheap ${c.termino} ${a}`,
    precio_sufijos: (n, medEur, u) => [`: ${n} below ${medEur}/${u}`, `: ${n} below the median`,
                                       ': the cheapest per unit'],
    precio_criterio: (c, n, med, total, desde, hasta, rep) => 'The cheaper half of the category: '
      + `the ${n} ${c.termino} products that cost ${med} or less, which is the median of the `
      + `${total} compared. They run from ${desde} to ${hasta}. Cheap is not the same as good: the `
      + `order is still the score: ${rep}.`,

    vs_h1: (a, b, c, u) => `${a} or ${b} for ${c.termino}: which is better value per ${u}`,
    vs_titulo: (a, b, c) => `${a} vs ${b} for ${c.termino}`,
    vs_sufijos: (u) => [`: which is cheaper per ${u}`, ': which is cheaper', ': prices compared'],

    rm_lider: (n, nom, t, p, nivel) => `Of the ${n} products that pass this filter, the highest `
      + `scoring is ${nom} from ${t}: ${p} and verification level ${nivel} out of 4.`,
    rm_barato: (u, nom, t, p) => `The cheapest per ${u} is ${nom} from ${t}, at ${p}.`,
    rm_horquilla: (a, b, m) => `The selection runs from ${a} to ${b}, with a median of ${m}.`,

    rc_medianas: (c, a, na, b, nb, u, ma, mb) => `For ${c.termino}, ${a} lists ${na} products and `
      + `${b} another ${nb}. By price per ${u}, ${a}’s median is ${ma} and ${b}’s is ${mb}.`,
    rc_gana: (nom, t, s, p) => `The highest scoring across both catalogues is ${nom} from ${t}, with ${s} out of 100 at ${p}.`,
    rc_barato: (u, nom, t, p) => `The cheapest per ${u} is ${nom} from ${t}, at ${p}.`,
    rc_sin_n4: (c) => 'Neither has products at verification level 4: for '
      + `${c.termino} the ceiling today is a lab report published by the brand itself, and that is not a certification.`,
    rc_n4: (n4a, a, n4b, b) => `${n4a} products from ${a} and ${n4b} from ${b} reach verification level 4.`,

    desc_mejores: (matiz, n, c, u, desde, f) => `${matiz} ${n} ${c.termino} products compared by `
      + `price per ${u} (from ${desde}) and by how verifiable their certification is. Data from ${f}.`,
    desc_vs: (a, b, c, na, nb, u, ma, mb, f) => `${a} or ${b} for ${c.termino}: ${na} and ${nb} `
      + `products compared by price per ${u} (medians ${ma} and ${mb}) and by certification. `
      + `Data from ${f}.`,

    fm1_p: (c) => `Which is the best ${c.termino} in this selection?`,
    fm1_r: (nom, t, s, p, crit) => `${nom} from ${t}, with ${s} points out of 100 at ${p}. ${crit}`,
    fm2_p: (u) => `Which is the cheapest per ${u}?`,
    fm2_r: (nom, t, p, formato, envase, nivel) => `${nom} from ${t}, at ${p} (${formato} pack for `
      + `${envase}). It is at verification level ${nivel} out of 4: price is only half the mark.`,
    fm3_p: 'How was this selection made?',
    fm3_r: (crit, rep, f) => `${crit} The order within the table is the usual score: ${rep}. `
      + `Affiliate links do not enter the calculation. Prices collected on ${f}.`,

    fv1_p: (a, b, c) => `${a} or ${b} for ${c.termino}?`,
    fv1_r: (u, gana, mg, mo, otro, dif, a, n4a, b, n4b) => `On price per ${u}, ${gana}: its `
      + `median is ${mg} against ${mo} at ${otro}` + (dif > 0 ? `, which is ${dif} % dearer.` : '.')
      + ` The median does not decide on its own: the other half of the mark is certification, and `
      + `there ${a} has ${n4a} products at level 4 and ${b} has ${n4b}.`,
    fv2_p: (c) => `Which is the cheapest ${c.termino} across the two stores?`,
    fv2_r: (nom, t, p, formato, envase, nivel) => `${nom} from ${t}, at ${p} (${formato} pack for `
      + `${envase}), at verification level ${nivel} out of 4.`,
    fv3_p: (a, b) => `Why don’t ${a} and ${b} cost the same?`,
    fv4_p: 'Which of the two stores scores better?',
    fv4_r: (nom, t, s, rep, f) => `${nom} from ${t}, with ${s} out of 100. The score is ${rep}, and `
      + `it is computed without looking at affiliate links. Prices from ${f}.`,

    pq_dosis_t: 'Cost of one effective dose',
    pq_dosis_vuelta: (gK, u, gD) => `Here the comparison flips: ${gK} wins per ${u} and ${gD} wins `
      + `per dose. Price per ${u} measures powder or capsules; this measures what you have to take `
      + 'for the ingredient to do what the study says, which is what you end up paying for.',
    pq_dosis_igual: (u, g) => `Price per ${u} and price per dose point to the same store, so the `
      + `dose does not erase the label difference: ${g} is cheaper both ways.`,
    pq_pureza_t: 'Active ingredient per 100 g',
    pq_pureza: (alto, dA, bajo, dB) => `${alto} puts ${dA} g of active ingredient in every 100 g `
      + `of product and ${bajo}, ${dB} g. The ${dA - dB} g difference is flavouring, sweetener and `
      + 'thickener, and in a tub it is paid for at the same price as the active ingredient: that is '
      + 'why a cheaper kilo can turn out dearer once measured per dose.',
    pq_formato_t: (caps) => (caps ? 'Capsules per pack (median)' : 'Pack size (median)'),
    pq_formato: (grande, caps, u) => `${grande} sells bigger packs, and a big pack spreads the same `
      + `tub, the same label and the same shipping over more ${caps ? 'capsules' : 'kilos'}. Part of `
      + `the price gap per ${u} is this and not a discount: comparing one store’s small pack with the `
      + 'other’s large one inflates the gap.',
    pq_catalogo_t: 'Different brands in the catalogue',
    pq_catalogo: (propia, marca, pct, reventa, n) => `${propia} mostly sells one brand, ${marca}: `
      + `${pct} % of its catalogue in this category. ${reventa} spreads its own across ${n} brands. `
      + 'A store selling its own brand skips the manufacturer’s margin and can cut the price '
      + 'without touching the formula; a reseller pays that margin and passes it on, and in '
      + 'exchange carries brands the other does not sell.',
    pq_aditivos_t: 'Products with declared additives',
    aditivo: { edulcorante_artificial: 'artificial sweeteners', colorante: 'colourings',
               aroma_artificial: 'artificial flavourings', relleno: 'fillers',
               antiaglomerante: 'anti-caking agents' },
    pq_aditivos: (lista, u) => `What the pages of both declare: ${lista}. An additive is not fraud, `
      + 'but it takes up grams that are not active ingredient and is cheaper than the active '
      + `ingredient: where more additive is declared, the price per ${u} drops without the product being better.`,
    pq_verif_t: 'With a published lab report (level 3 or 4)',
    pq_de: (a, b) => `${a} of ${b}`,
    pq_verif: (mas) => `${mas} publishes lab reports on more product pages. Testing a batch in a `
      + 'lab costs money and is passed on in the price: part of what you pay extra is the check '
      + 'that the tub contains what the label says. It is the only part of the premium you can '
      + 'read in a PDF.',
    pq_forma_t: 'Chemical form of the active ingredient',
    pq_forma: (a, la, b, lb) => `${a}: ${la}. ${b}: ${lb}. The form changes the manufacturing cost `
      + 'and the evidence behind it, so two tubs of the same ingredient at different prices may '
      + 'not be the same product.',
    pq_nota_t: 'Median rating at the store',
    pq_nota: (opA, a, opB, b) => `Based on ${opA} reviews at ${a} and ${opB} at ${b}. These are the `
      + 'store’s own ratings, which is judge and party: they help spot a product that arrives '
      + 'damaged or tastes awful, not decide which formula is better.',
    pq_intro_empate: (p, a, b) => `Both medians sit at ${p}, so price does not break the tie: what `
      + `changes between ${a} and ${b} is in the rows below.`,
    pq_intro: (cara, d, u, barata, pc, pb) => `${cara} costs ${d} % more per ${u} than ${barata} `
      + `(${pc} against ${pb}, medians of both catalogues). `,
    pq_intro_causas: (l) => 'That difference does not come out of nowhere. These are the data that '
      + `explain it, with each store’s figure alongside: ${l}.`,
    pq_intro_politica: 'Going by what both pages declare, there are no differences in composition '
      + 'or pack size that explain it: here the gap is the store’s pricing policy.',

    cc_lo_llevan: (a, b) => `${a} of ${b} contain it`,
    cc_llegan: (n) => `${n} reach the dose`,
    cc_ninguno: 'none publishes the dose',
    cc_h2_ing: 'What each tub contains',
    cc_apunte_ing: 'Median dose per serving',
    cc_ing_p: 'Price per kilo does not tell you how much active ingredient is inside the kilo. '
      + 'This table does: for each ingredient, the median dose per serving at each store and how '
      + 'many products reach the dose backed by studies (the same reference this site scores with).',
    cc_caption_ing: (a, b, c) => `Ingredients and dose per serving at ${a} and ${b}, for ${c.termino}`,
    cc_col_ing: 'Ingredient',
    cc_desde: (d) => `Evidence-backed dose: from ${d} per serving`,
    cc_no_lleva: 'not included',
    cc_nota_ing_t: 'The dose is per serving, not per tub.',
    cc_nota_ing: ' A big tub with a short dose forces you to take two scoops to get the same, and '
      + 'then it lasts half as long: that is why the price per dose in the next section does not '
      + 'match the price per kilo.',
    cc_h2_pq: 'Why one is cheaper than the other',
    cc_apunte_pq: 'Factor by factor, with both stores’ data',
    cc_caption_pq: (a, b, c) => `Where the price difference between ${a} and ${b} for ${c.termino} comes from`,
    cc_col_factor: 'Factor',
    cc_nota_pq_t: 'None of these factors is an accusation.',
    cc_nota_pq: ' They are medians of what each store publishes on its pages on the day prices were '
      + 'collected: where a page does not declare a figure, that store does not count in that row '
      + 'instead of counting as a zero. A specific product can contradict its store’s median, and '
      + 'that is what the full table is for. ',
    cc_como: 'How all of this is calculated',
    cc_resto: 'All other stores',
  },

  fr: {
    decimal: (n, dec = 1) => n.toFixed(dec).replace(/[.,]0$/, '').replace('.', ','),
    miles: (n) => n.toLocaleString('fr-FR'),
    caps: 'gél.',

    sello_que: {
      creapure: 'Creapure est une créatine d’Alzchem : utiliser la marque exige un contrat de '
        + 'licence, le label est donc garanti par un tiers et non par la boutique.',
      ifos: 'IFOS analyse le lot dans un laboratoire indépendant et publie le rapport, le label ne '
        + 'dépend donc pas de ce que dit la marque.',
    },

    sello_matiz: (s) => `Uniquement ceux qui déclarent ${s}.`,
    sello_h1: (c, s, n, u) => `${cap(c.termino)} avec label ${s} : ${n} produits par prix ${auFr(u)}`,
    sello_titulo: (c, s, a) => `${cap(c.termino)} ${s} ${a}`,
    sello_sufijos: (u) => [` : prix ${auFr(u)} et certification`, ` : prix ${auFr(u)} comparé`,
                           ` : prix ${auFr(u)}`],
    sello_criterio: (c, s, total, que, n, n4) => `Uniquement les produits dont la fiche déclare ${s}, `
      + `sur les ${total} produits ${deFr(c.termino)} comparés par ce site. ${que} Sur les ${n}, `
      + (n4 === n
        ? `les ${n} atteignent le niveau 4 : le label a pu être vérifié auprès d’un tiers.`
        : `${n4} atteignent le niveau 4 (le label a pu être vérifié auprès d’un tiers) et `
          + `${n - n4} restent en dessous : ils le déclarent sur la fiche mais ne le portent pas `
          + 'dans le nom, et un logo isolé sur l’étiquette n’est que la parole du vendeur.'),

    tienda_matiz: (t) => `Uniquement ce que vend ${t}.`,
    tienda_h1: (c, t, n, u) => `${cap(c.termino)} chez ${t} : ${n} produits par prix ${auFr(u)}`,
    tienda_titulo: (c, t, a) => `${cap(c.termino)} chez ${t} ${a}`,
    tienda_sufijos: (u) => [` : prix ${auFr(u)} comparé`, ` : prix ${auFr(u)}`, ' : prix comparés'],
    situacion_igual: (m) => `, identique à celle du marché comparé ici (${m}).`,
    situacion_encima: (d, n, m) => `, ${d} % au-dessus de la médiane des ${n} boutiques comparées (${m}).`,
    situacion_debajo: (d, n, m) => `, ${d} % en dessous de la médiane des ${n} boutiques comparées (${m}).`,
    tienda_criterio: (c, t, n, med, sit) => `Les ${n} produits ${deFr(c.termino)} vendus par ${t}, notés `
      + `avec le même score que le reste du site. Sa médiane est de ${med}${sit}`,

    precio_matiz: 'Uniquement la moitié la moins chère de la catégorie.',
    precio_h1: (c, adj, n, med) => `${cap(c.termino)} au meilleur prix : ${n} sous ${med}`,
    precio_titulo: (c, adj, a) => `${cap(c.termino)} pas cher ${a}`,
    precio_sufijos: (n, medEur, u) => [` : ${n} sous ${medEur}/${u}`, ` : ${n} sous la médiane`,
                                       ' : les moins chers par unité'],
    precio_criterio: (c, n, med, total, desde, hasta, rep) => 'La moitié la moins chère de la '
      + `catégorie : les ${n} produits ${deFr(c.termino)} qui coûtent ${med} ou moins, la médiane des `
      + `${total} comparés. Ils vont de ${desde} à ${hasta}. Pas cher ne veut pas dire bon : `
      + `l’ordre reste le score : ${rep}.`,

    vs_h1: (a, b, c, u) => `${a} ou ${b} en ${c.termino} : lequel revient le moins cher ${auFr(u)}`,
    vs_titulo: (a, b, c) => `${a} vs ${b} en ${c.termino}`,
    vs_sufijos: (u) => [` : lequel est le moins cher ${auFr(u)}`, ' : lequel est le moins cher', ' : prix comparés'],

    rm_lider: (n, nom, t, p, nivel) => `Sur les ${n} produits qui passent ce filtre, le mieux noté `
      + `est ${nom} chez ${t} : ${p} et niveau de vérification ${nivel} sur 4.`,
    rm_barato: (u, nom, t, p) => `Le moins cher ${auFr(u)} est ${nom} chez ${t}, à ${p}.`,
    rm_horquilla: (a, b, m) => `La sélection va de ${a} à ${b}, avec une médiane de ${m}.`,

    rc_medianas: (c, a, na, b, nb, u, ma, mb) => `En ${c.termino}, ${a} propose ${na} produits et `
      + `${b} ${nb} autres. Au prix ${auFr(u)}, la médiane de ${a} est de ${ma} et celle de ${b} de ${mb}.`,
    rc_gana: (nom, t, s, p) => `Le mieux noté des deux catalogues est ${nom} chez ${t}, avec ${s} sur 100 à ${p}.`,
    rc_barato: (u, nom, t, p) => `Le moins cher ${auFr(u)} est ${nom} chez ${t}, à ${p}.`,
    rc_sin_n4: (c) => 'Aucune des deux n’a de produits au niveau 4 de vérification : en '
      + `${c.termino}, le plafond aujourd’hui est l’analyse publiée par la marque elle-même, et ce n’est pas un label.`,
    rc_n4: (n4a, a, n4b, b) => `${n4a} produits de ${a} et ${n4b} de ${b} atteignent le niveau 4 de vérification.`,

    desc_mejores: (matiz, n, c, u, desde, f) => `${matiz} ${n} produits ${deFr(c.termino)} comparés au `
      + `prix ${auFr(u)} (dès ${desde}) et selon leur niveau de vérification. Données du ${f}.`,
    desc_vs: (a, b, c, na, nb, u, ma, mb, f) => `${a} ou ${b} en ${c.termino} : ${na} et ${nb} `
      + `produits comparés au prix ${auFr(u)} (médianes ${ma} et ${mb}) et par certification. `
      + `Données du ${f}.`,

    fm1_p: (c) => `${cap(c.termino)} : quel est le meilleur produit de cette sélection ?`,
    fm1_r: (nom, t, s, p, crit) => `${nom} chez ${t}, avec ${s} points sur 100 à ${p}. ${crit}`,
    fm2_p: (u) => `Quel est le moins cher ${auFr(u)} ?`,
    fm2_r: (nom, t, p, formato, envase, nivel) => `${nom} chez ${t}, à ${p} (emballage de ${formato} `
      + `pour ${envase}). Il est au niveau de vérification ${nivel} sur 4 : le prix n’est que la moitié de la note.`,
    fm3_p: 'Comment cette sélection a-t-elle été faite ?',
    fm3_r: (crit, rep, f) => `${crit} L’ordre dans le tableau est le score habituel : ${rep}. `
      + `Les liens affiliés n’entrent pas dans le calcul. Prix relevés le ${f}.`,

    fv1_p: (a, b, c) => `${a} ou ${b} pour ${c.termino} ?`,
    fv1_r: (u, gana, mg, mo, otro, dif, a, n4a, b, n4b) => `Au prix ${auFr(u)}, ${gana} : sa médiane `
      + `est de ${mg} contre ${mo} chez ${otro}` + (dif > 0 ? `, soit ${dif} % plus cher.` : '.')
      + ` La médiane ne décide pas seule : l’autre moitié de la note est la certification, et là ${a} `
      + `a ${n4a} produits au niveau 4 et ${b} en a ${n4b}.`,
    fv2_p: (c) => `${cap(c.termino)} : quelle est l’offre la moins chère des deux boutiques ?`,
    fv2_r: (nom, t, p, formato, envase, nivel) => `${nom} chez ${t}, à ${p} (emballage de ${formato} `
      + `pour ${envase}), au niveau de vérification ${nivel} sur 4.`,
    fv3_p: (a, b) => `Pourquoi ${a} et ${b} ne coûtent-ils pas la même chose ?`,
    fv4_p: 'Laquelle des deux boutiques obtient la meilleure note ?',
    fv4_r: (nom, t, s, rep, f) => `${nom} chez ${t}, avec ${s} sur 100. Le score est ${rep}, et il `
      + `est calculé sans regarder les liens affiliés. Prix du ${f}.`,

    pq_dosis_t: 'Coût d’une dose efficace',
    pq_dosis_vuelta: (gK, u, gD) => `Ici la comparaison s’inverse : ${gK} gagne ${auFr(u)} et ${gD} `
      + `gagne à la dose. Le prix ${auFr(u)} mesure de la poudre ou des gélules ; celui-ci mesure ce qu’il `
      + 'faut prendre pour que l’ingrédient fasse ce que dit l’étude, et c’est cela qu’on finit par payer.',
    pq_dosis_igual: (u, g) => `Le prix ${auFr(u)} et le prix à la dose désignent la même boutique, la `
      + `dose n’efface donc pas l’écart d’étiquette : ${g} est moins chère des deux façons.`,
    pq_pureza_t: 'Actif pour 100 g',
    pq_pureza: (alto, dA, bajo, dB) => `${alto} met ${dA} g d’actif pour 100 g de produit et ${bajo}, `
      + `${dB} g. Les ${dA - dB} g d’écart sont de l’arôme, de l’édulcorant et de l’épaississant, et `
      + 'dans un pot ils se paient au même prix que l’actif : c’est pourquoi un kilo moins cher peut '
      + 'revenir plus cher dès qu’on mesure à la dose.',
    pq_formato_t: (caps) => (caps ? 'Gélules par emballage (médiane)' : 'Taille de l’emballage (médiane)'),
    pq_formato: (grande, caps, u) => `${grande} vend des emballages plus grands, et un grand `
      + `emballage répartit le même pot, la même étiquette et le même port sur plus de ${caps ? 'gélules' : 'kilos'}. `
      + `Une partie de l’écart de prix ${auFr(u)} vient de là et non d’une remise : comparer le petit format `
      + 'de l’une au grand de l’autre gonfle l’écart.',
    pq_catalogo_t: 'Marques différentes au catalogue',
    pq_catalogo: (propia, marca, pct, reventa, n) => `${propia} vend surtout une marque, ${marca} : `
      + `${pct} % de son catalogue dans cette catégorie. ${reventa} répartit le sien entre ${n} marques. `
      + 'Qui vend sa propre marque évite la marge du fabricant et peut baisser le prix sans toucher '
      + 'à la formule ; qui revend paie cette marge et la répercute, et en échange propose des '
      + 'marques que l’autre ne vend pas.',
    pq_aditivos_t: 'Produits avec additifs déclarés',
    aditivo: { edulcorante_artificial: 'édulcorants artificiels', colorante: 'colorants',
               aroma_artificial: 'arômes artificiels', relleno: 'charges',
               antiaglomerante: 'antiagglomérants' },
    pq_aditivos: (lista, u) => `Ce que déclarent les fiches des deux : ${lista}. Un additif n’est pas `
      + 'une fraude, mais il occupe des grammes qui ne sont pas de l’actif et coûte moins cher que '
      + `l’actif : là où il y a plus d’additifs déclarés, le prix ${auFr(u)} baisse sans que le produit soit meilleur.`,
    pq_verif_t: 'Avec analyse publiée (niveau 3 ou 4)',
    pq_de: (a, b) => `${a} sur ${b}`,
    pq_verif: (mas) => `${mas} publie des analyses sur plus de fiches. Analyser un lot en laboratoire `
      + 'coûte de l’argent et se répercute sur le prix : une partie de ce qu’on paie en plus est la '
      + 'vérification que le pot contient ce que dit l’étiquette. C’est la seule part du surcoût qui '
      + 'se lit dans un PDF.',
    pq_forma_t: 'Forme chimique de l’actif',
    pq_forma: (a, la, b, lb) => `${a} : ${la}. ${b} : ${lb}. La forme change le coût de fabrication `
      + 'et les preuves qui la soutiennent, donc deux pots du même ingrédient à des prix différents '
      + 'ne sont pas forcément le même produit.',
    pq_nota_t: 'Note médiane en boutique',
    pq_nota: (opA, a, opB, b) => `Sur ${opA} avis chez ${a} et ${opB} chez ${b}. Ce sont les notes de `
      + 'la boutique elle-même, juge et partie : elles servent à repérer un produit qui arrive abîmé '
      + 'ou qui a mauvais goût, pas à décider quelle formule est la meilleure.',
    pq_intro_empate: (p, a, b) => `Les deux médianes sont à ${p}, le prix ne départage donc pas : ce `
      + `qui change entre ${a} et ${b} est dans les lignes ci-dessous.`,
    pq_intro: (cara, d, u, barata, pc, pb) => `${cara} coûte ${d} % de plus ${auFr(u)} que ${barata} `
      + `(${pc} contre ${pb}, médianes des deux catalogues). `,
    pq_intro_causas: (l) => 'Cet écart ne tombe pas du ciel. Voici les données qui l’expliquent, avec '
      + `le chiffre de chaque boutique à côté : ${l}.`,
    pq_intro_politica: 'D’après ce que déclarent les deux fiches, aucune différence de composition '
      + 'ni de format ne l’explique : ici l’écart relève de la politique de prix de la boutique.',

    cc_lo_llevan: (a, b) => `${a} sur ${b} en contiennent`,
    cc_llegan: (n) => `${n} atteignent la dose`,
    cc_ninguno: 'aucun ne publie la dose',
    cc_h2_ing: 'Ce que contient chaque pot',
    cc_apunte_ing: 'Dose médiane par portion',
    cc_ing_p: 'Le prix au kilo ne dit pas combien d’actif il y a dans le kilo. Ce tableau, si : pour '
      + 'chaque ingrédient, la dose médiane par portion dans chaque boutique et combien de produits '
      + 'atteignent la dose étayée par des études (la même référence que celle utilisée pour la note).',
    cc_caption_ing: (a, b, c) => `Ingrédients et dose par portion chez ${a} et ${b}, en ${c.termino}`,
    cc_col_ing: 'Ingrédient',
    cc_desde: (d) => `Dose étayée : dès ${d} par prise`,
    cc_no_lleva: 'n’en contient pas',
    cc_nota_ing_t: 'La dose est par portion, pas par pot.',
    cc_nota_ing: ' Un grand pot avec une petite dose oblige à prendre deux doseurs pour arriver au '
      + 'même résultat, et il dure alors deux fois moins : c’est pourquoi le prix à la dose de la '
      + 'section suivante ne coïncide pas avec le prix au kilo.',
    cc_h2_pq: 'Pourquoi l’une est moins chère que l’autre',
    cc_apunte_pq: 'Facteur par facteur, avec les données des deux',
    cc_caption_pq: (a, b, c) => `D’où vient l’écart de prix entre ${a} et ${b} en ${c.termino}`,
    cc_col_factor: 'Facteur',
    cc_nota_pq_t: 'Aucun de ces facteurs n’est une accusation.',
    cc_nota_pq: ' Ce sont des médianes de ce que chaque boutique publie sur ses fiches le jour du relevé '
      + 'des prix : là où une fiche ne déclare pas une donnée, la boutique ne compte pas dans cette '
      + 'ligne au lieu de compter pour zéro. Un produit précis peut démentir la médiane de sa '
      + 'boutique, et c’est à cela que sert le tableau complet. ',
    cc_como: 'Comment tout cela est calculé',
    cc_resto: 'Toutes les autres boutiques',
  },
};

/** Las plantillas de un idioma, con las espanolas debajo para lo que falte. */
export const copia = (lang = 'es') => (lang === 'es' ? TXT.es : { ...TXT.es, ...TXT[lang] });

// Autocomprobacion: node src/datos/landings-i18n.js
// Que ninguna plantilla se quede sin traducir al anadirla solo en espanol.
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('landings-i18n.js')) {
  for (const l of ['en', 'fr']) {
    const faltan = Object.keys(TXT.es).filter((k) => !(k in TXT[l]));
    if (faltan.length) throw new Error(`${l}: plantillas sin traducir: ${faltan.join(', ')}`);
  }
  const c = { termino: 'creatine', mejor: 'the best creatine' };
  if (!copia('en').vs_h1('HSN', 'Prozis', c, 'kg').startsWith('HSN or Prozis')) throw new Error('en');
  if (ingrediente('hierro', 'fr') !== 'Fer') throw new Error('ingrediente fr');
  if (ingrediente('clave_nueva', 'en') !== 'Clave nueva') throw new Error('respaldo ingrediente');
  console.log(`landings-i18n.js OK (${Object.keys(TXT.es).length} plantillas x 3 idiomas)`);
}
