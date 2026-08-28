// Copy que responde a una consulta de busqueda, generado desde el dataset.
//
// Regla unica: ninguna frase de aqui afirma nada que no salga de un numero del
// dataset. Si el dato falta, la frase no se escribe y su pregunta desaparece del FAQ.
// Por eso este texto no envejece: se regenera con cada `python actualizar.py`.
//
// Lo que edita una persona (el termino con el que se busca la categoria y las
// consultas que quiere ganar) vive en categorias.py. Ver SEO-PRODUCTOS.md.

import { eur, TIENDAS, UNIDAD } from './util.js';
import { abs } from '../sitio.js';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
               'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const fechaLarga = (iso) => {
  const [a, m, d] = String(iso).split('-');
  return `${Number(d)} de ${MESES[Number(m) - 1]} de ${a}`;
};
export const anio = (iso) => String(iso).slice(0, 4);

// Marca + nombre, sin repetir la marca cuando la tienda ya la puso en el nombre
// ("Epaplus" + "Epaplus Arthicare Colageno" no es un producto distinto, es un titulo
// que dice la marca dos veces y ocupa el sitio del dato).
export const nom = (p) => {
  const nombre = String(p.nombre).replace(/\s+/g, ' ').trim();
  const marca = String(p.marca).replace(/\s+/g, ' ').trim();
  // Amazon no publica la marca en ningun campo y hay titulos que empiezan por el
  // producto: ahi el scraper la deja en "Desconocida", que es lo honesto en la tabla,
  // pero ponerla delante del nombre en el titulo de la ficha es ruido, no informacion.
  if (!marca || marca === 'Desconocida') return nombre;
  return nombre.toLowerCase().startsWith(marca.toLowerCase()) ? nombre : `${marca} ${nombre}`;
};

// Corta por la ultima palabra entera que cabe. Un titulo cortado a mitad de palabra
// en el resultado de busqueda parece un error del sitio, no del buscador.
const corta = (s, max) => {
  if (s.length <= max) return s;
  const trozo = s.slice(0, max - 1);
  const i = trozo.lastIndexOf(' ');
  return `${(i > max * 0.6 ? trozo.slice(0, i) : trozo).trim()}…`;
};
// Google corta el titulo del resultado por pixeles, alrededor de los 65 caracteres. Un
// titulo mas largo no penaliza, pero lo que se lleva el corte es siempre el final, que es
// justo donde va el dato ("precio por kilo", "y certificacion"). Asi que en vez de un
// sufijo fijo se prueba del mas informativo al mas corto y se queda el que entra entero.
export const TOPE_TITULO = 65;
export const titula = (base, ...sufijos) => {
  for (const sufijo of sufijos) {
    if ((base + sufijo).length <= TOPE_TITULO) return base + sufijo;
  }
  return corta(base, TOPE_TITULO);
};

export const tiendaDe = (p) => TIENDAS[p.tienda] ?? p.tienda;
export const porScore = (ps) => ps.slice().sort((a, b) => (b.score_final ?? -1) - (a.score_final ?? -1));

export const formatoDe = (p) =>
  p.formato_gramos ? `${p.formato_gramos} g`
  : p.unidades ? `${p.unidades} capsulas`
  : 'formato no declarado';

// Miligramos a la unidad en la que se habla: 5000 -> "5 g", 500 -> "500 mg".
export const dosisTexto = (mg) => (mg >= 1000 ? `${+(mg / 1000).toFixed(1)} g` : `${mg} mg`);

/** Los numeros de una categoria, calculados una sola vez por pagina. */
export function resumen(cat, productos) {
  const unidad = UNIDAD[cat.unidad_precio] ?? 'kg';
  const dec = unidad === 'kg' ? 2 : 3;
  const conPrecio = productos
    .filter((p) => p.precio_referencia != null)
    .sort((a, b) => a.precio_referencia - b.precio_referencia);
  return {
    unidad, dec,
    precio: (n) => (n == null ? '—' : `${eur(n, dec)}/${unidad}`),
    n: productos.length,
    // El lider se busca entre los que tienen precio: sin precio no hay fila que citar.
    lider: porScore(conPrecio)[0] ?? null,
    barato: conPrecio[0] ?? null,
    caro: conPrecio[conPrecio.length - 1] ?? null,
    mediana: conPrecio.length ? conPrecio[Math.floor(conPrecio.length / 2)].precio_referencia : null,
    tiendas: new Set(productos.map((p) => p.tienda)).size,
    nivel4: productos.filter((p) => p.nivel_verificacion === 4).length,
    nivel3: productos.filter((p) => p.nivel_verificacion === 3).length,
  };
}

/* --- La respuesta corta -------------------------------------------------------
   Tres frases bajo el H1 que contestan la consulta con nombre propio, precio y
   fecha. Es la unidad que copia un modelo de lenguaje y la que Google usa como
   fragmento destacado, asi que va antes que cualquier tabla. */
export function respuestaCategoria(cat, productos, generado) {
  const r = resumen(cat, productos);
  if (!r.lider || !r.barato) return null;
  const p = [];
  p.push(`De los ${r.n} productos de ${cat.termino} que compara esta web en ${r.tiendas} ` +
         `tiendas espanolas, el que mejor puntua es ${nom(r.lider)} de ${tiendaDe(r.lider)}: ` +
         `${r.precio(r.lider.precio_referencia)} y nivel ${r.lider.nivel_verificacion} de ` +
         `verificacion sobre 4.`);
  if (r.barato.id !== r.lider.id) {
    p.push(`Lo mas barato por ${r.unidad} es ${nom(r.barato)} de ${tiendaDe(r.barato)}, ` +
           `a ${r.precio(r.barato.precio_referencia)}.`);
  }
  p.push(`La categoria entera va de ${r.precio(r.barato.precio_referencia)} a ` +
         `${r.precio(r.caro.precio_referencia)}, con una mediana de ${r.precio(r.mediana)}.`);
  p.push(`Precios recogidos el ${fechaLarga(generado)}.`);
  return p.join(' ');
}

/* --- Respuestas del FAQ -------------------------------------------------------
   Una funcion por clave de `consultas` en categorias.py. Devolver null quita la
   pregunta de la pagina: preferimos una FAQ corta a una respuesta inventada. */
const RESPUESTAS = {
  mejor: (cat, r) => {
    if (!r.lider) return null;
    const razones = (r.lider.desglose ?? []).slice(0, 2).join('; ');
    return `${nom(r.lider)} de ${tiendaDe(r.lider)}, con ${r.lider.score_final?.toFixed(0)} ` +
      `puntos sobre 100 a ${r.precio(r.lider.precio_referencia)}` +
      (razones ? `. Puntua asi porque ${razones}` : '') +
      `. La nota es mitad precio frente al mas barato de la categoria y mitad calidad ` +
      `verificable, y ningun acuerdo comercial mueve el orden.`;
  },

  barato: (cat, r) => {
    if (!r.barato) return null;
    return `${nom(r.barato)} de ${tiendaDe(r.barato)}, a ${r.precio(r.barato.precio_referencia)} ` +
      `(envase de ${formatoDe(r.barato)} por ${eur(r.barato.precio_eur)}). Tiene nivel ` +
      `${r.barato.nivel_verificacion} de verificacion sobre 4. Barato no es lo mismo que bien ` +
      `puntuado: el precio es la mitad de la nota y la otra mitad es lo comprobable que sea ` +
      `su certificacion.`;
  },

  precio: (cat, r) => {
    if (r.mediana == null) return null;
    return `Entre ${r.precio(r.barato.precio_referencia)} y ${r.precio(r.caro.precio_referencia)} ` +
      `en las ${r.tiendas} tiendas comparadas, con una mediana de ${r.precio(r.mediana)}. ` +
      `Es el precio por ${r.unidad}, no el del envase: dos botes al mismo precio pueden ` +
      `costar el doble uno que otro segun lo que traigan dentro.`;
  },

  certificacion: (cat, r) => {
    const otros = r.n - r.nivel4 - r.nivel3;
    return `De los ${r.n} productos comparados, ${r.nivel4} llegan al nivel 4 (el sello lo ` +
      `respalda un tercero: o lo hemos comprobado en la fuente que lo emite, o el producto ` +
      `lleva en el nombre una marca que exige un tercero detras, como Creapure o IFOS) y ` +
      `${r.nivel3} al nivel 3 (analisis publicado por la propia marca). Los ${otros} restantes ` +
      `se quedan en un sello declarado en la ficha o en ninguno. Solo el nivel 4 esta ` +
      `comprobado contra quien emite el sello.`;
  },

  dosis: (cat, r, ctx) => {
    const ref = ctx.dosisRef?.[cat.dosis_key];
    if (!ref) return null;
    const rango = ref.dosis_efectiva_max_mg
      ? `de ${dosisTexto(ref.dosis_efectiva_min_mg)} a ${dosisTexto(ref.dosis_efectiva_max_mg)}`
      : `de ${dosisTexto(ref.dosis_efectiva_min_mg)}`;
    const fuente = ref.fuentes?.[0];
    return `La dosis de referencia que usa esta web para ${cat.termino} es ${rango} al dia, ` +
      `con evidencia ${ref.nivel_evidencia}` +
      (fuente ? `. Fuente: ${fuente.cita}` : '') +
      `. Es la dosis del ingrediente en el estudio citado, no una recomendacion para ti ni ` +
      `una afirmacion sobre ningun producto de la tabla.`;
  },
};

const pregunta = (s) => `¿${s.charAt(0).toUpperCase()}${s.slice(1)}?`;

export function faqsCategoria(cat, productos, dosisRef, generado) {
  const r = resumen(cat, productos);
  return Object.entries(cat.consultas ?? {})
    .map(([clave, consulta]) => {
      const respuesta = RESPUESTAS[clave]?.(cat, r, { dosisRef, generado });
      return respuesta ? { p: pregunta(consulta), r: respuesta } : null;
    })
    .filter(Boolean);
}

/* --- Ficha de producto --------------------------------------------------------- */

/** Puesto del producto en su categoria, con el mismo orden que ve el lector. */
export function puestoEn(p, productos) {
  const ranking = porScore(productos.filter((o) => o.categoria === p.categoria));
  return { puesto: ranking.findIndex((o) => o.id === p.id) + 1, total: ranking.length, ranking };
}

export function veredictoProducto(p, productos, cat, generado) {
  const r = resumen(cat, productos.filter((o) => o.categoria === p.categoria));
  const { puesto, total } = puestoEn(p, productos);
  const frases = [
    `${nom(p)} cuesta ${eur(p.precio_eur)} el envase de ${formatoDe(p)} en ` +
    `${tiendaDe(p)}, o ${r.precio(p.precio_referencia)}.`,
  ];
  if (puesto > 0) {
    frases.push(`Es el puesto ${puesto} de ${total} en ${cat.nombre.toLowerCase()}` +
      (p.score_final != null ? `, con ${p.score_final.toFixed(0)} puntos sobre 100` : '') + '.');
  }
  if (r.barato && p.precio_referencia != null && r.barato.precio_referencia != null) {
    const dif = p.precio_referencia / r.barato.precio_referencia;
    frases.push(r.barato.id === p.id
      ? `Es el mas barato por ${r.unidad} de su categoria.`
      : `Por ${r.unidad} cuesta un ${Math.round((dif - 1) * 100)} % mas que el mas barato de ` +
        `la categoria (${nom(r.barato)}, a ${r.precio(r.barato.precio_referencia)}).`);
  }
  frases.push(`Su certificacion esta en el nivel ${p.nivel_verificacion} de 4` +
    (p.nivel_verificacion === 4 ? ': comprobada contra un tercero.'
     : p.nivel_verificacion === 3 ? ': analisis publicado por la propia marca.'
     : p.nivel_verificacion === 2 ? ': declarada en la ficha, sin forma de comprobarla.'
     : ': no consta ninguna.'));
  frases.push(`Precio recogido el ${fechaLarga(p.fecha_scrape ?? generado)}.`);
  return frases.join(' ');
}

/* --- JSON-LD de producto --------------------------------------------------------
   Un producto se marca igual lo mire quien lo mire: la ficha, la tabla de categoria y
   las landings de intencion. Estaba copiado en tres sitios y el dia que se anadio
   `priceValidUntil` solo se entero uno; ahora sale de aqui. */

/** Hasta cuando vale este precio. Se vuelven a recoger en cada actualizacion, asi que lo
    honesto es un mes desde la recogida: sin fecha, Google marca la oferta como caducada
    y borra el precio del fragmento, que es el dato por el que existe esta web. */
export const validoHasta = (p) =>
  new Date(new Date(p.fecha_scrape).getTime() + 30 * 864e5).toISOString().slice(0, 10);

export const ofertaLd = (p, url = p.url) => ({
  '@type': 'Offer',
  price: p.precio_eur,
  priceCurrency: 'EUR',
  priceValidUntil: validoHasta(p),
  availability: 'https://schema.org/InStock',
  itemCondition: 'https://schema.org/NewCondition',
  url,
  seller: { '@type': 'Organization', name: tiendaDe(p) },
});

/** El producto tal y como se cita desde una lista (categoria, /mejores, /comparativa). */
export const productoLd = (p) => ({
  '@type': 'Product',
  name: nom(p),
  url: abs(`/producto/${p.slug}`),
  sku: String(p.id),
  brand: { '@type': 'Brand', name: p.marca },
  ...(p.imagen ? { image: p.imagen } : {}),
  offers: ofertaLd(p),
});

/** Los diez primeros de una tabla como ItemList. Mas no aporta: nadie lee una de 120. */
export const listaLd = (nombre, productos) => ({
  '@type': 'ItemList',
  name: nombre,
  numberOfItems: productos.length,
  itemListOrder: 'https://schema.org/ItemListOrderDescending',
  itemListElement: porScore(productos).slice(0, 10).map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: productoLd(p),
  })),
});

/* --- Titulos y descripciones ---------------------------------------------------
   El ano sale de la fecha de recogida, no esta escrito a mano: no se queda viejo. */
export const tituloCategoria = (cat, generado) =>
  titula(`Mejor ${cat.termino} ${anio(generado)}`,
         ': cual comprar por precio y certificacion',
         ': precio por unidad y certificacion',
         ': precio y certificacion',
         ': comparativa de precios');

// Primera letra en mayuscula sin tocar el resto ("la mejor creatina" -> "La mejor creatina").
export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// El H1 de categoria. Antes era la consulta suelta ("Que creatina comprar"), que es la
// pregunta del lector pero no dice ni que se compara ni con que criterio. Ahora lleva
// delante la palabra clave del producto y detras las dos por las que se busca esta web
// (precio por unidad y certificacion). La consulta original no se pierde: sigue siendo la
// primera pregunta del FAQ de la misma pagina.
export const h1Categoria = (cat, generado) =>
  `${cap(cat.mejor ?? `mejor ${cat.termino}`)} de ${anio(generado)}: comparativa por ` +
  `precio por ${UNIDAD[cat.unidad_precio] ?? 'kg'} y certificacion`;

export const descripcionCategoria = (cat, productos, generado) => {
  const r = resumen(cat, productos);
  return `${r.n} productos de ${cat.termino} de ${r.tiendas} tiendas comparados por precio ` +
    `por ${r.unidad} (desde ${r.precio(r.barato?.precio_referencia)}) y por el nivel de ` +
    `verificacion de sus certificaciones. Datos del ${fechaLarga(generado)}.`;
};

// El titulo se arma con el sufijo mas largo que quepa en TOPE_TITULO caracteres. Los nombres
// de las tiendas van de 12 a 90 caracteres: con un sufijo fijo, la mitad del catalogo
// sale cortado en el resultado de busqueda justo por donde estaba el dato.
export function tituloProducto(p, productos = []) {
  // El mismo producto en dos tiendas tendria el mismo titulo y competiria consigo
  // mismo: cuando pasa, la tienda entra en el titulo y lo desempata.
  // Se comparan los nombres RECORTADOS a lo que cabe en el titulo: dos productos de
  // Amazon cuyo nombre solo se diferencia en el gramaje que va en el caracter 90 tienen
  // nombres distintos y el MISMO titulo, que es justo lo que hay que evitar.
  const visible = (o) => corta(nom(o), TOPE_TITULO);
  const iguales = productos.filter((o) => visible(o) === visible(p));
  const repetido = iguales.length > 1;
  const otraTienda = repetido && new Set(iguales.map(tiendaDe)).size > 1;
  const base = nom(p) + (otraTienda ? ` en ${tiendaDe(p)}` : '');
  const unidad = p.unidad_precio === 'kg' ? 'kilo' : 'capsula';
  const sufijos = [`: precio por ${unidad}, dosis y certificacion`,
                   `: precio por ${unidad} y certificacion`,
                   ': precio y certificacion',
                   `: precio por ${unidad}`,
                   ''];
  for (const sufijo of sufijos) {
    if ((base + sufijo).length <= TOPE_TITULO) return base + sufijo;
  }
  // Nombres largos (Myprotein, Amazon): el nombre manda y se corta por palabra. El
  // formato va al final ("...1Kg") y es lo que distingue dos variantes, asi que no se
  // sacrifica por meter el sufijo.
  //
  // Y si DOS productos de la misma tienda comparten nombre, el formato deja de ser un
  // adorno: es lo unico que los distingue. En los titulos kilometricos de Amazon
  // ("...Citrulina Malato 150 g Ideal para deportistas...") cae despues del corte
  // y el corte se lo lleva, asi que se pega detras del recorte en vez de perderse.
  // Y si tampoco el formato los distingue (dos sabores del mismo bote de Amazon, con el
  // sabor escrito en el caracter 90), lo unico que queda y que ademas le sirve a quien
  // lee es el precio. Se genera en cada pasada, asi que no envejece.
  const mismoFormato = iguales.filter((o) => formatoDe(o) === formatoDe(p)).length > 1;
  const cola = !repetido || otraTienda ? ''
    : mismoFormato ? ` · ${formatoDe(p)}, ${eur(p.precio_eur)}`
    : ` · ${formatoDe(p)}`;
  return corta(base, TOPE_TITULO - cola.length) + cola;
}

export const descripcionProducto = (p, productos, cat) => {
  const r = resumen(cat, productos.filter((o) => o.categoria === p.categoria));
  const { puesto, total } = puestoEn(p, productos);
  // Google corta la descripcion alrededor de los 160-200 caracteres, y los nombres de
  // Myprotein se comen 90 ellos solos: se corta por palabra entera en vez de dejar que
  // el buscador la parta por donde quiera.
  return corta(
    `${nom(p)} a ${r.precio(p.precio_referencia)} en ${tiendaDe(p)}. Puesto ${puesto} de ` +
    `${total} en ${cat.nombre.toLowerCase()}, nivel ${p.nivel_verificacion} de verificacion y ` +
    `el desglose de su nota linea a linea.`, 200);
};
