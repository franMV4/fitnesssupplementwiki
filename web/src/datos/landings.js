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

import datos from './dataset.json' with { type: 'json' };
import { TIENDAS, eur, reparto } from './util.js';
import { anio, formatoDe, nom, porScore, resumen, tiendaDe, titula } from './seo.js';
import { porQuePrecio } from './porque.js';
import { copia } from './landings-i18n.js';
import { enIdioma } from './categorias-i18n.js';
import { fechaLargaEn } from '../i18n.js';

// Cuantos productos hacen falta para que la pagina tenga algo que contar.
const MIN_SELLO = 3;
const MIN_TIENDA = 6;
const MIN_BARATO = 10;

// Cuantos productos hacen falta para que una faceta por tienda entre en el INDICE.
// No es lo mismo que MIN_TIENDA: la pagina se sigue publicando y enlazando desde 6
// productos (a un lector le sirve ver que vende esa tienda en esa categoria), pero
// "/mejores/arginina-de-promofarma" con 6 filas es un filtro de la pagina de arginina,
// no una pagina distinta, y Google lo trata como tal: Search Console (09/2026) las
// metio en "rastreada: actualmente sin indexar" junto con las fichas y las 436
// comparativas. A partir de 20 hay catalogo propio que contar. El corte esta ahi
// porque el reparto se acaba justo ahi: 187 facetas con 6, 80 con 15, 34 con 20 y
// ya solo 30 con 30. Si las categorias recuperan indexacion, se baja.
const MIN_TIENDA_INDEXADO = 20;

// Sellos que existen de verdad en el dataset y que son nivel 4 (un tercero detras). Lo
// que se dice de cada uno vive en landings-i18n.js (`sello_que`), en los tres idiomas.
const SELLOS = { creapure: 'Creapure', ifos: 'IFOS' };

const productosDe = (slug) => datos.productos.filter((p) => p.categoria === slug);
const tieneSello = (p, tipo) => p.certificaciones.some((c) => c.tipo === tipo);

// El genero y el numero salen del articulo que ya escribio una persona en categorias.py
// ("la mejor creatina", "los mejores BCAA"), asi que no hay que declararlos otra vez:
// "creatina barata", "BCAA baratos". Concordar mal en el H1 delata una pagina generada.
// Solo cuenta en espanol: el ingles no concuerda y el frances esquiva el genero.
function concordancia(cat) {
  const m = String(cat.mejor ?? '').toLowerCase();
  if (m.startsWith('las ')) return { adj: 'baratas' };
  if (m.startsWith('los ')) return { adj: 'baratos' };
  if (m.startsWith('la ')) return { adj: 'barata' };
  return { adj: 'barato' };
}

/* --- /mejores/<slug> -----------------------------------------------------------
   Cada landing guarda los DATOS (que filtro, que productos) y los textos se piden en un
   idioma con `textosMejores(l, lang)`. Los campos h1/titulo/criterio/matiz del objeto son
   los del espanol, calculados con la misma funcion, para quien ya los leia (sitemap,
   portada, llms.txt). Asi no hay dos maneras de escribir el mismo titular. */

export function textosMejores(l, lang = 'es') {
  const T = copia(lang);
  const cat = enIdioma(l.cat, lang);
  const r = resumen(l.cat, l.productos, lang);
  const a = anio(datos.generado);
  if (l.tipo === 'sello') {
    const s = SELLOS[l.sello];
    return {
      matiz: T.sello_matiz(s),
      // "16 productos" y no "16 comparadas": el articulo de cat.mejor puede ser femenino
      // ("la mejor creatina") y el sustantivo que sigue tiene que concordar con algo, asi
      // que se le pone uno neutro en vez de intentar declinar el participio.
      h1: T.sello_h1(cat, s, l.productos.length, r.unidad),
      titulo: titula(T.sello_titulo(cat, s, a), ...T.sello_sufijos(r.unidad)),
      // El reparto de niveles NO se afirma, se cuenta. Declarar el sello en la ficha no
      // es lo mismo que llevarlo en el nombre: lo primero es la palabra de la tienda
      // (nivel 2) y lo segundo exige contrato de licencia (nivel 4).
      criterio: T.sello_criterio(cat, s, productosDe(cat.slug).length, T.sello_que[l.sello],
                                 l.productos.length, r.nivel4),
    };
  }
  if (l.tipo === 'tienda') {
    const rTodo = resumen(l.cat, productosDe(cat.slug), lang);
    // Lo util de una landing de tienda no es "aqui esta el catalogo": es si esa tienda
    // esta por encima o por debajo del mercado en la unidad en la que se compara.
    const dif = r.mediana != null && rTodo.mediana != null
      ? Math.round(((r.mediana / rTodo.mediana) - 1) * 100) : null;
    const med = rTodo.precio(rTodo.mediana);
    const sit = dif == null ? '.'
      : dif === 0 ? T.situacion_igual(med)
      : dif > 0 ? T.situacion_encima(dif, rTodo.tiendas, med)
      : T.situacion_debajo(Math.abs(dif), rTodo.tiendas, med);
    return {
      matiz: T.tienda_matiz(l.nombreTienda),
      h1: T.tienda_h1(cat, l.nombreTienda, l.productos.length, r.unidad),
      titulo: titula(T.tienda_titulo(cat, l.nombreTienda, a), ...T.tienda_sufijos(r.unidad)),
      criterio: T.tienda_criterio(cat, l.nombreTienda, l.productos.length, r.precio(r.mediana), sit),
    };
  }
  // tipo === 'precio'
  const rTodo = resumen(l.cat, productosDe(cat.slug), lang);
  const { adj } = concordancia(l.cat);
  return {
    matiz: T.precio_matiz,
    h1: T.precio_h1(cat, adj, l.productos.length, rTodo.precio(rTodo.mediana)),
    titulo: titula(T.precio_titulo(cat, adj, a),
                   ...T.precio_sufijos(l.productos.length, eur(rTodo.mediana, rTodo.dec, lang), rTodo.unidad)),
    criterio: T.precio_criterio(cat, l.productos.length, rTodo.precio(rTodo.mediana),
                                productosDe(cat.slug).length, r.precio(r.barato?.precio_referencia),
                                r.precio(r.caro?.precio_referencia), reparto(undefined, lang)),
  };
}

const conTextos = (l) => ({ ...l, ...textosMejores(l, 'es') });

function porSello(cat, ps) {
  return Object.keys(SELLOS).flatMap((tipo) => {
    const sel = ps.filter((p) => tieneSello(p, tipo));
    if (sel.length < MIN_SELLO) return [];
    return [conTextos({ slug: `${cat.slug}-${tipo}`, indexable: true, cat, productos: sel,
                        tipo: 'sello', sello: tipo })];
  });
}

function porTienda(cat, ps) {
  const tiendas = [...new Set(ps.map((p) => p.tienda))]
    .filter((t) => ps.filter((p) => p.tienda === t).length >= MIN_TIENDA)
    .sort();
  return tiendas.map((t) => {
    const sel = ps.filter((p) => p.tienda === t);
    // Quien es la tienda, para que la pagina pueda compararla con el resto del mercado en
    // la seccion de "por que". Las otras landings (sello, precio) no la llevan y por eso no
    // pintan esa seccion: comparar "los Creapure" con "el resto" no explica ningun precio.
    return conTextos({ slug: `${cat.slug}-de-${t}`, indexable: sel.length >= MIN_TIENDA_INDEXADO,
                       cat, productos: sel, tipo: 'tienda', tienda: t,
                       nombreTienda: TIENDAS[t] ?? t });
  });
}

function porPrecio(cat, ps) {
  const r = resumen(cat, ps);
  if (ps.length < MIN_BARATO || r.mediana == null) return [];
  const sel = ps.filter((p) => p.precio_referencia != null && p.precio_referencia <= r.mediana);
  const { adj } = concordancia(cat);
  return [conTextos({ slug: `${cat.slug}-${adj}`, indexable: true, cat, productos: sel,
                      tipo: 'precio' })];
}

export const MEJORES = datos.categorias.flatMap((cat) => {
  const ps = productosDe(cat.slug);
  return [...porSello(cat, ps), ...porTienda(cat, ps), ...porPrecio(cat, ps)];
});

/* --- /comparativa/<a>-vs-<b>-<categoria> ---------------------------------------- */

// "HSN o Myprotein" es una consulta con la compra medio decidida: quien la busca no
// quiere 120 filas, quiere saber cual de las dos y por que. La pagina lo dice en la
// primera linea y luego ensena los dos catalogos en la misma tabla.
// Cuantas tiendas se cruzan entre si por categoria. Emparejar todas las que pasan el
// minimo es cuadratico: con 22 tiendas y 50 categorias salian 436 paginas, todas con la
// misma forma, y "HSN vs Zumub en vitamina K2" no lo busca nadie. Search Console (09/2026)
// las metio en el mismo saco que las fichas: rastreadas y sin indexar. Se cruzan las tres
// con mas catalogo en esa categoria, que son las que aparecen en la consulta de verdad.
const MAX_TIENDAS_CRUZADAS = 3;

/** H1 y titulo de un versus en un idioma. */
export function textosComparativa(l, lang = 'es') {
  const T = copia(lang);
  const cat = enIdioma(l.cat, lang);
  const u = resumen(l.cat, l.pa, lang).unidad;
  return {
    h1: T.vs_h1(l.na, l.nb, cat, u),
    titulo: titula(T.vs_titulo(l.na, l.nb, cat), ...T.vs_sufijos(u)),
  };
}

export const COMPARATIVAS = datos.categorias.flatMap((cat) => {
  const ps = productosDe(cat.slug);
  const cuantos = (t) => ps.filter((p) => p.tienda === t).length;
  const tiendas = [...new Set(ps.map((p) => p.tienda))]
    .filter((t) => cuantos(t) >= MIN_TIENDA)
    .sort((a, b) => cuantos(b) - cuantos(a))
    .slice(0, MAX_TIENDAS_CRUZADAS)
    // El slug es alfabetico (ver el comentario del cara a cara global): el orden por
    // catalogo solo sirve para elegir cuales, no para nombrarlas.
    .sort();
  const pares = [];
  for (let i = 0; i < tiendas.length; i++) {
    for (let j = i + 1; j < tiendas.length; j++) pares.push([tiendas[i], tiendas[j]]);
  }
  return pares.map(([a, b]) => {
    const pa = ps.filter((p) => p.tienda === a);
    const pb = ps.filter((p) => p.tienda === b);
    const juntos = [...pa, ...pb];
    const l = {
      slug: `${a}-vs-${b}-${cat.slug}`,
      cat, a, b, na: TIENDAS[a] ?? a, nb: TIENDAS[b] ?? b, pa, pb,
      ra: resumen(cat, pa),
      rb: resumen(cat, pb),
      productos: juntos,
      ganaScore: porScore(juntos)[0] ?? null,
      barato: juntos.filter((p) => p.precio_referencia != null)
        .sort((x, y) => x.precio_referencia - y.precio_referencia)[0] ?? null,
    };
    return { ...l, ...textosComparativa(l, 'es') };
  });
});

/* --- Copy generado, compartido por las dos rutas -------------------------------- */

/** La respuesta corta de una landing de /mejores: quien gana, cuanto cuesta y de cuando es. */
export function respuestaMejores(l, lang = 'es') {
  const T = copia(lang);
  const r = resumen(l.cat, l.productos, lang);
  if (!r.lider || !r.barato) return null;
  const f = [T.rm_lider(r.n, nom(r.lider), tiendaDe(r.lider), r.precio(r.lider.precio_referencia),
                        r.lider.nivel_verificacion)];
  if (r.barato.id !== r.lider.id) {
    f.push(T.rm_barato(r.unidad, nom(r.barato), tiendaDe(r.barato), r.precio(r.barato.precio_referencia)));
  }
  f.push(T.rm_horquilla(r.precio(r.barato.precio_referencia), r.precio(r.caro.precio_referencia),
                        r.precio(r.mediana)));
  return f.join(' ');
}

/** La respuesta corta de un versus: quien gana por nota, quien por precio y por cuanto. */
export function respuestaComparativa(l, lang = 'es') {
  const T = copia(lang);
  const cat = enIdioma(l.cat, lang);
  const ra = resumen(l.cat, l.pa, lang);
  const rb = resumen(l.cat, l.pb, lang);
  const { na, nb } = l;
  if (!ra.lider || !rb.lider) return null;
  const f = [T.rc_medianas(cat, na, ra.n, nb, rb.n, ra.unidad, ra.precio(ra.mediana), rb.precio(rb.mediana))];
  if (l.ganaScore) {
    f.push(T.rc_gana(nom(l.ganaScore), tiendaDe(l.ganaScore), l.ganaScore.score_final?.toFixed(0),
                     ra.precio(l.ganaScore.precio_referencia)));
  }
  if (l.barato && l.barato.id !== l.ganaScore?.id) {
    f.push(T.rc_barato(ra.unidad, nom(l.barato), tiendaDe(l.barato), ra.precio(l.barato.precio_referencia)));
  }
  // "0 y 0 llegan al nivel 4" es un dato, pero se lee como un error de la pagina. Cuando
  // en una categoria no hay ni un sello con tercero detras, lo que hay que decir es eso.
  f.push(ra.nivel4 === 0 && rb.nivel4 === 0 ? T.rc_sin_n4(cat) : T.rc_n4(ra.nivel4, na, rb.nivel4, nb));
  return f.join(' ');
}

/** Descripcion para el <meta>: el numero, el precio y la fecha. Sin adjetivos. */
export const descripcionMejores = (l, lang = 'es') => {
  const r = resumen(l.cat, l.productos, lang);
  const { matiz } = textosMejores(l, lang);
  return copia(lang).desc_mejores(matiz, r.n, enIdioma(l.cat, lang), r.unidad,
    r.precio(r.barato?.precio_referencia), fechaLargaEn(lang, datos.generado)).trim();
};

export const descripcionComparativa = (l, lang = 'es') => {
  const ra = resumen(l.cat, l.pa, lang);
  const rb = resumen(l.cat, l.pb, lang);
  return copia(lang).desc_vs(l.na, l.nb, enIdioma(l.cat, lang), ra.n, rb.n, ra.unidad,
    ra.precio(ra.mediana), rb.precio(rb.mediana), fechaLargaEn(lang, datos.generado));
};

/** FAQ de una landing de /mejores. Las tres preguntas que trae quien busca asi. */
export function faqsMejores(l, lang = 'es') {
  const T = copia(lang);
  const cat = enIdioma(l.cat, lang);
  const r = resumen(l.cat, l.productos, lang);
  const { criterio } = textosMejores(l, lang);
  const faqs = [];
  if (r.lider) {
    faqs.push({
      p: T.fm1_p(cat),
      r: T.fm1_r(nom(r.lider), tiendaDe(r.lider), r.lider.score_final?.toFixed(0),
                 r.precio(r.lider.precio_referencia), criterio),
    });
  }
  if (r.barato) {
    faqs.push({
      p: T.fm2_p(r.unidad),
      r: T.fm2_r(nom(r.barato), tiendaDe(r.barato), r.precio(r.barato.precio_referencia),
                 formatoDe(r.barato, lang), eur(r.barato.precio_eur, 2, lang), r.barato.nivel_verificacion),
    });
  }
  faqs.push({
    p: T.fm3_p,
    r: T.fm3_r(criterio, reparto(r.unidad, lang), fechaLargaEn(lang, datos.generado)),
  });
  return faqs;
}

/** FAQ de un versus: las cosas que se pregunta quien compara dos tiendas. */
export function faqsComparativa(l, lang = 'es') {
  const T = copia(lang);
  const cat = enIdioma(l.cat, lang);
  const ra = resumen(l.cat, l.pa, lang);
  const rb = resumen(l.cat, l.pb, lang);
  const { na, nb } = l;
  const faqs = [];
  const masBarata = ra.mediana != null && rb.mediana != null
    ? (ra.mediana <= rb.mediana ? { r: ra, n: na, otro: rb, nOtro: nb } : { r: rb, n: nb, otro: ra, nOtro: na })
    : null;
  if (masBarata) {
    const dif = Math.round(((masBarata.otro.mediana / masBarata.r.mediana) - 1) * 100);
    faqs.push({
      p: T.fv1_p(na, nb, cat),
      r: T.fv1_r(ra.unidad, masBarata.n, masBarata.r.precio(masBarata.r.mediana),
                 masBarata.otro.precio(masBarata.otro.mediana), masBarata.nOtro, dif,
                 na, ra.nivel4, nb, rb.nivel4),
    });
  }
  if (l.barato) {
    faqs.push({
      p: T.fv2_p(cat, ra.unidad),
      r: T.fv2_r(nom(l.barato), tiendaDe(l.barato), ra.precio(l.barato.precio_referencia),
                 formatoDe(l.barato, lang), eur(l.barato.precio_eur, 2, lang), l.barato.nivel_verificacion),
    });
  }
  // La pregunta que trae de verdad quien compara dos tiendas y que la pagina no
  // contestaba: por que una cuesta menos. La respuesta sale de los mismos factores que
  // pinta la seccion "por que", asi que la FAQ no puede decir una cosa y la tabla otra.
  const { intro, factores } = porQuePrecio(l.cat, { nombre: na, productos: l.pa },
                                                  { nombre: nb, productos: l.pb }, lang);
  if (intro) {
    faqs.push({ p: T.fv3_p(na, nb), r: [intro, ...factores.slice(0, 2).map((f) => f.texto)].join(' ') });
  }
  if (l.ganaScore) {
    faqs.push({
      p: T.fv4_p,
      r: T.fv4_r(nom(l.ganaScore), tiendaDe(l.ganaScore), l.ganaScore.score_final?.toFixed(0),
                 reparto(ra.unidad, lang), fechaLargaEn(lang, datos.generado)),
    });
  }
  return faqs;
}

/** Landings hermanas de una categoria, para el enlazado interno. */
export const mejoresDe = (slug) => MEJORES.filter((l) => l.cat.slug === slug);
export const comparativasDe = (slug) => COMPARATIVAS.filter((l) => l.cat.slug === slug);

// Para el sitemap y el llms.txt: todas las rutas nuevas en una lista.
export const RUTAS_LANDING = [
  ...MEJORES.filter((l) => l.indexable).map((l) => `/mejores/${l.slug}`),
  ...COMPARATIVAS.map((l) => `/comparativa/${l.slug}`),
];
