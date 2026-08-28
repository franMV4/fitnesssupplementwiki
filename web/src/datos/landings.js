// Landings de intencion de compra: /mejores/<slug> y /comparativa/<a>-vs-<b>-<categoria>.
//
// Las nueve paginas de categoria responden "que creatina compro". Estas responden la
// consulta de mas abajo del embudo, la que ya trae la decision medio tomada: "creatina
// Creapure", "proteina whey de Myprotein", "HSN o Myprotein". Son las que convierten.
//
// Igual que el resto del copy del sitio, aqui no se escribe ni un titulo a mano: la lista
// entera sale del dataset. Una landing solo existe si hay datos que la sostengan (umbrales
// abajo), asi que cuando una tienda deje de tener productos de una categoria su pagina
// desaparece sola en el siguiente `python actualizar.py`. Y al reves: al anadir una tienda
// aparecen sus landings sin tocar codigo.
//
// ponytail: ninguna faceta que el dataset no tenga. La auditoria pedia
// "/mejores/proteina-aislada-sin-lactosa" y no se hace: no hay campo de lactosa. Una
// landing que filtra por un dato inexistente es una pagina que miente. Se anade el campo
// al scraper y la landing sale sola.

import datos from './dataset.json';
import { TIENDAS, eur } from './util.js';
import { anio, cap, fechaLarga, formatoDe, nom, porScore, resumen, tiendaDe, titula } from './seo.js';

// Cuantos productos hacen falta para que la pagina tenga algo que contar.
const MIN_SELLO = 3;
const MIN_TIENDA = 6;
const MIN_BARATO = 10;

// Sellos que existen de verdad en el dataset y que son nivel 4 (un tercero detras).
const SELLOS = {
  creapure: {
    nombre: 'Creapure',
    que: 'Creapure es creatina de Alzchem: usar la marca exige contrato de licencia, asi ' +
         'que el sello lo respalda un tercero y no la tienda.',
  },
  ifos: {
    nombre: 'IFOS',
    que: 'IFOS analiza el lote en un laboratorio independiente y publica el informe, asi ' +
         'que el sello no depende de lo que diga la marca.',
  },
};

const productosDe = (slug) => datos.productos.filter((p) => p.categoria === slug);
const tieneSello = (p, tipo) => p.certificaciones.some((c) => c.tipo === tipo);

// El genero y el numero salen del articulo que ya escribio una persona en categorias.py
// ("la mejor creatina", "los mejores BCAA"), asi que no hay que declararlos otra vez:
// "creatina barata", "BCAA baratos". Concordar mal en el H1 delata una pagina generada.
function concordancia(cat) {
  const m = String(cat.mejor ?? '').toLowerCase();
  if (m.startsWith('las ')) return { adj: 'baratas' };
  if (m.startsWith('los ')) return { adj: 'baratos' };
  if (m.startsWith('la ')) return { adj: 'barata' };
  return { adj: 'barato' };
}

/* --- /mejores/<slug> ----------------------------------------------------------- */

function porSello(cat, ps) {
  return Object.entries(SELLOS).flatMap(([tipo, sello]) => {
    const sel = ps.filter((p) => tieneSello(p, tipo));
    if (sel.length < MIN_SELLO) return [];
    const r = resumen(cat, sel);
    return [{
      slug: `${cat.slug}-${tipo}`,
      cat,
      productos: sel,
      // El matiz distingue esta descripcion de la de las otras landings de la misma
      // categoria: cuando el conjunto de productos coincide (una categoria que vende
      // una sola tienda), sin el salian dos <meta description> identicas.
      matiz: `Solo los que declaran ${sello.nombre}.`,
      // "16 productos" y no "16 comparadas": el articulo de cat.mejor puede ser femenino
      // ("la mejor creatina") y el sustantivo que sigue tiene que concordar con algo, asi
      // que se le pone uno neutro en vez de intentar declinar el participio.
      h1: `${cap(cat.mejor)} con sello ${sello.nombre}: ${sel.length} productos por precio por ${r.unidad}`,
      titulo: titula(`Mejor ${cat.termino} ${sello.nombre} ${anio(datos.generado)}`,
                     `: precio por ${r.unidad} y certificacion`,
                     `: precio por ${r.unidad} comparado`,
                     `: precio por ${r.unidad}`),
      // El reparto de niveles NO se afirma, se cuenta. Declarar el sello en la ficha no
      // es lo mismo que llevarlo en el nombre: lo primero es la palabra de la tienda
      // (nivel 2) y lo segundo exige contrato de licencia (nivel 4). Aqui salen los dos
      // grupos, porque decir "todos son nivel 4" seria mentira en cuanto una tienda
      // ponga el sello en la descripcion y no en el nombre, que es justo lo que pasa.
      criterio: `Solo los productos cuya ficha declara ${sello.nombre}, de los ${ps.length} ` +
                `de ${cat.termino} que compara esta web. ${sello.que} De los ${sel.length}, ` +
                (r.nivel4 === sel.length
                  ? `los ${sel.length} llegan al nivel 4: el sello se ha podido comprobar ` +
                    `contra un tercero.`
                  : `${r.nivel4} llegan al nivel 4 (el sello se ha podido comprobar contra ` +
                    `un tercero) y ${sel.length - r.nivel4} se quedan por debajo: lo ` +
                    `declaran en la ficha pero no lo llevan en el nombre, y un sello suelto ` +
                    `en la etiqueta es la palabra de quien vende.`),
    }];
  });
}

function porTienda(cat, ps) {
  const tiendas = [...new Set(ps.map((p) => p.tienda))]
    .filter((t) => ps.filter((p) => p.tienda === t).length >= MIN_TIENDA)
    .sort();
  const rTodo = resumen(cat, ps);
  return tiendas.map((t) => {
    const sel = ps.filter((p) => p.tienda === t);
    const r = resumen(cat, sel);
    const nombre = TIENDAS[t] ?? t;
    // Lo util de una landing de tienda no es "aqui esta el catalogo": es si esa tienda
    // esta por encima o por debajo del mercado en la unidad en la que se compara.
    const dif = r.mediana != null && rTodo.mediana != null
      ? Math.round(((r.mediana / rTodo.mediana) - 1) * 100) : null;
    const situacion =
      dif == null ? '.'
      : dif === 0 ? `, la misma que la del mercado comparado aqui (${rTodo.precio(rTodo.mediana)}).`
      : dif > 0 ? `, un ${dif} % por encima de la mediana de las ${rTodo.tiendas} tiendas comparadas (${rTodo.precio(rTodo.mediana)}).`
      : `, un ${Math.abs(dif)} % por debajo de la mediana de las ${rTodo.tiendas} tiendas comparadas (${rTodo.precio(rTodo.mediana)}).`;
    return {
      slug: `${cat.slug}-de-${t}`,
      cat,
      productos: sel,
      matiz: `Solo lo que vende ${nombre}.`,
      h1: `${cap(cat.mejor)} de ${nombre}: ${sel.length} productos por precio por ${r.unidad}`,
      titulo: titula(`Mejor ${cat.termino} de ${nombre} ${anio(datos.generado)}`,
                     `: precio por ${r.unidad} comparado`,
                     `: precio por ${r.unidad}`,
                     ': precios comparados'),
      criterio: `Los ${sel.length} productos de ${cat.termino} que vende ${nombre}, puntuados ` +
                `con el mismo score que el resto de la web. Su mediana es ` +
                `${r.precio(r.mediana)}${situacion}`,
    };
  });
}

function porPrecio(cat, ps) {
  const r = resumen(cat, ps);
  if (ps.length < MIN_BARATO || r.mediana == null) return [];
  const sel = ps.filter((p) => p.precio_referencia != null && p.precio_referencia <= r.mediana);
  const rSel = resumen(cat, sel);
  const { adj } = concordancia(cat);
  return [{
    slug: `${cat.slug}-${adj}`,
    cat,
    productos: sel,
    matiz: 'Solo la mitad mas barata de la categoria.',
    h1: `${cap(cat.mejor)} ${adj}: ${sel.length} por debajo de ${r.precio(r.mediana)}`,
    titulo: titula(`${cap(cat.termino)} ${adj} ${anio(datos.generado)}`,
                   `: ${sel.length} por debajo de ${eur(r.mediana, r.dec)}/${r.unidad}`,
                   `: ${sel.length} por debajo de la mediana`,
                   ': los mas baratos por unidad'),
    criterio: `La mitad barata de la categoria: los ${sel.length} productos de ${cat.termino} ` +
              `que cuestan ${r.precio(r.mediana)} o menos, que es la mediana de los ` +
              `${ps.length} comparados. Van de ${rSel.precio(rSel.barato?.precio_referencia)} ` +
              `a ${rSel.precio(rSel.caro?.precio_referencia)}. Barato no es lo mismo que bueno: ` +
              `el orden sigue siendo el score, mitad precio y mitad calidad verificable.`,
  }];
}

export const MEJORES = datos.categorias.flatMap((cat) => {
  const ps = productosDe(cat.slug);
  return [...porSello(cat, ps), ...porTienda(cat, ps), ...porPrecio(cat, ps)];
});

/* --- /comparativa/<a>-vs-<b>-<categoria> ---------------------------------------- */

// "HSN o Myprotein" es una consulta con la compra medio decidida: quien la busca no
// quiere 120 filas, quiere saber cual de las dos y por que. La pagina lo dice en la
// primera linea y luego ensena los dos catalogos en la misma tabla.
export const COMPARATIVAS = datos.categorias.flatMap((cat) => {
  const ps = productosDe(cat.slug);
  const tiendas = [...new Set(ps.map((p) => p.tienda))]
    .filter((t) => ps.filter((p) => p.tienda === t).length >= MIN_TIENDA)
    .sort();
  const pares = [];
  for (let i = 0; i < tiendas.length; i++) {
    for (let j = i + 1; j < tiendas.length; j++) pares.push([tiendas[i], tiendas[j]]);
  }
  return pares.map(([a, b]) => {
    const pa = ps.filter((p) => p.tienda === a);
    const pb = ps.filter((p) => p.tienda === b);
    const ra = resumen(cat, pa);
    const rb = resumen(cat, pb);
    const na = TIENDAS[a] ?? a;
    const nb = TIENDAS[b] ?? b;
    const juntos = [...pa, ...pb];
    return {
      slug: `${a}-vs-${b}-${cat.slug}`,
      cat, a, b, na, nb, pa, pb, ra, rb,
      productos: juntos,
      ganaScore: porScore(juntos)[0] ?? null,
      barato: juntos.filter((p) => p.precio_referencia != null)
        .sort((x, y) => x.precio_referencia - y.precio_referencia)[0] ?? null,
      h1: `${na} o ${nb} en ${cat.termino}: cual sale mejor por precio por ${ra.unidad}`,
      titulo: titula(`${na} vs ${nb} en ${cat.termino}`,
                     `: cual sale mas barato por ${ra.unidad}`,
                     ': cual sale mas barato',
                     ': precios comparados'),
    };
  });
});

/* --- Copy generado, compartido por las dos rutas -------------------------------- */

/** La respuesta corta de una landing de /mejores: quien gana, cuanto cuesta y de cuando es. */
export function respuestaMejores(l) {
  const r = resumen(l.cat, l.productos);
  if (!r.lider || !r.barato) return null;
  const f = [
    `De los ${r.n} productos que pasan este filtro, el que mejor puntua es ` +
    `${nom(r.lider)} de ${tiendaDe(r.lider)}: ${r.precio(r.lider.precio_referencia)} y ` +
    `nivel ${r.lider.nivel_verificacion} de verificacion sobre 4.`,
  ];
  if (r.barato.id !== r.lider.id) {
    f.push(`El mas barato por ${r.unidad} es ${nom(r.barato)} de ${tiendaDe(r.barato)}, a ` +
           `${r.precio(r.barato.precio_referencia)}.`);
  }
  f.push(`La seleccion va de ${r.precio(r.barato.precio_referencia)} a ` +
         `${r.precio(r.caro.precio_referencia)}, con una mediana de ${r.precio(r.mediana)}.`);
  return f.join(' ');
}

/** La respuesta corta de un versus: quien gana por nota, quien por precio y por cuanto. */
export function respuestaComparativa(l) {
  const { ra, rb, na, nb, cat } = l;
  if (!ra.lider || !rb.lider) return null;
  const f = [];
  f.push(`En ${cat.termino}, ${na} pone ${ra.n} productos y ${nb} otros ${rb.n}. Por precio ` +
         `por ${ra.unidad}, la mediana de ${na} es ${ra.precio(ra.mediana)} y la de ${nb}, ` +
         `${rb.precio(rb.mediana)}.`);
  if (l.ganaScore) {
    f.push(`El que mejor puntua de los dos catalogos es ${nom(l.ganaScore)} de ` +
           `${tiendaDe(l.ganaScore)}, con ${l.ganaScore.score_final?.toFixed(0)} sobre 100 a ` +
           `${ra.precio(l.ganaScore.precio_referencia)}.`);
  }
  if (l.barato && l.barato.id !== l.ganaScore?.id) {
    f.push(`El mas barato por ${ra.unidad} es ${nom(l.barato)} de ${tiendaDe(l.barato)}, a ` +
           `${ra.precio(l.barato.precio_referencia)}.`);
  }
  // "0 y 0 llegan al nivel 4" es un dato, pero se lee como un error de la pagina. Cuando
  // en una categoria no hay ni un sello con tercero detras, lo que hay que decir es eso.
  f.push(ra.nivel4 === 0 && rb.nivel4 === 0
    ? `Ninguna de las dos tiene productos en el nivel 4 de verificacion: en ${cat.termino} ` +
      `el techo hoy es el analisis publicado por la propia marca, y eso no es un sello.`
    : `${ra.nivel4} productos de ${na} y ${rb.nivel4} de ${nb} llegan al nivel 4 de ` +
      `verificacion.`);
  return f.join(' ');
}

/** Descripcion para el <meta>: el numero, el precio y la fecha. Sin adjetivos. */
export const descripcionMejores = (l) => {
  const r = resumen(l.cat, l.productos);
  return (`${l.matiz ?? ''} ${r.n} productos de ${l.cat.termino} comparados por precio por ` +
    `${r.unidad} (desde ${r.precio(r.barato?.precio_referencia)}) y por el nivel de ` +
    `verificacion de su certificacion. Datos del ${datos.generado}.`).trim();
};

export const descripcionComparativa = (l) =>
  `${l.na} o ${l.nb} en ${l.cat.termino}: ${l.ra.n} y ${l.rb.n} productos comparados por ` +
  `precio por ${l.ra.unidad} (medianas ${l.ra.precio(l.ra.mediana)} y ` +
  `${l.rb.precio(l.rb.mediana)}) y por certificacion. Datos del ${datos.generado}.`;

/** FAQ de una landing de /mejores. Las tres preguntas que trae quien busca asi. */
export function faqsMejores(l) {
  const r = resumen(l.cat, l.productos);
  const faqs = [];
  if (r.lider) {
    faqs.push({
      p: `¿${cap(l.cat.mejor)} de esta seleccion?`,
      r: `${nom(r.lider)} de ${tiendaDe(r.lider)}, con ` +
         `${r.lider.score_final?.toFixed(0)} puntos sobre 100 a ` +
         `${r.precio(r.lider.precio_referencia)}. ${l.criterio}`,
    });
  }
  if (r.barato) {
    faqs.push({
      p: `¿Cual es el mas barato por ${r.unidad}?`,
      r: `${nom(r.barato)} de ${tiendaDe(r.barato)}, a ` +
         `${r.precio(r.barato.precio_referencia)} (envase de ${formatoDe(r.barato)} por ` +
         `${eur(r.barato.precio_eur)}). Tiene nivel ${r.barato.nivel_verificacion} de ` +
         `verificacion sobre 4: el precio es solo la mitad de la nota.`,
    });
  }
  faqs.push({
    p: '¿Como se ha hecho esta seleccion?',
    r: `${l.criterio} El orden dentro de la tabla es el score de siempre: mitad precio por ` +
       `${r.unidad} frente al mas barato de la categoria y mitad calidad verificable. Los ` +
       `enlaces de afiliado no entran en el calculo. Precios recogidos el ` +
       `${fechaLarga(datos.generado)}.`,
  });
  return faqs;
}

/** FAQ de un versus: las tres cosas que se pregunta quien compara dos tiendas. */
export function faqsComparativa(l) {
  const { ra, rb, na, nb, cat } = l;
  const faqs = [];
  const masBarata = ra.mediana != null && rb.mediana != null
    ? (ra.mediana <= rb.mediana ? { r: ra, n: na, otro: rb, nOtro: nb } : { r: rb, n: nb, otro: ra, nOtro: na })
    : null;
  if (masBarata) {
    const dif = Math.round(((masBarata.otro.mediana / masBarata.r.mediana) - 1) * 100);
    faqs.push({
      p: `¿${na} o ${nb} para ${cat.termino}?`,
      r: `Por precio por ${ra.unidad}, ${masBarata.n}: su mediana es ` +
         `${masBarata.r.precio(masBarata.r.mediana)} frente a ` +
         `${masBarata.otro.precio(masBarata.otro.mediana)} de ${masBarata.nOtro}` +
         (dif > 0 ? `, un ${dif} % mas cara.` : '.') +
         ` La mediana no decide sola: la otra mitad de la nota es la certificacion, y ahi ` +
         `${na} tiene ${ra.nivel4} productos en nivel 4 y ${nb} tiene ${rb.nivel4}.`,
    });
  }
  if (l.barato) {
    faqs.push({
      p: `¿Cual es ${cat.mejor} mas ${ra.unidad === 'kg' ? 'barata' : 'barato'} de las dos tiendas?`,
      r: `${nom(l.barato)} de ${tiendaDe(l.barato)}, a ` +
         `${ra.precio(l.barato.precio_referencia)} (envase de ${formatoDe(l.barato)} por ` +
         `${eur(l.barato.precio_eur)}), con nivel ${l.barato.nivel_verificacion} de ` +
         `verificacion sobre 4.`,
    });
  }
  if (l.ganaScore) {
    faqs.push({
      p: `¿Cual puntua mejor de las dos tiendas?`,
      r: `${nom(l.ganaScore)} de ${tiendaDe(l.ganaScore)}, con ` +
         `${l.ganaScore.score_final?.toFixed(0)} sobre 100. El score es mitad precio por ` +
         `${ra.unidad} frente al mas barato de la categoria entera y mitad calidad ` +
         `verificable, y se calcula sin mirar los enlaces de afiliado. Precios del ` +
         `${fechaLarga(datos.generado)}.`,
    });
  }
  return faqs;
}

/** Landings hermanas de una categoria, para el enlazado interno. */
export const mejoresDe = (slug) => MEJORES.filter((l) => l.cat.slug === slug);
export const comparativasDe = (slug) => COMPARATIVAS.filter((l) => l.cat.slug === slug);

// Para el sitemap y el llms.txt: todas las rutas nuevas en una lista.
export const RUTAS_LANDING = [
  ...MEJORES.map((l) => `/mejores/${l.slug}`),
  ...COMPARATIVAS.map((l) => `/comparativa/${l.slug}`),
];
