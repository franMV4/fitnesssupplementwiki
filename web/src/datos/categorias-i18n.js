// El nombre de cada categoria en los tres idiomas, y el termino con el que se busca.
//
// POR QUE NO SALE DEL DATASET: el nombre de la categoria lo escribe categorias.py, del
// lado de Python, y es la unica pieza del dataset que no viene de la tienda sino de una
// decision editorial ("proteina whey (concentrado)" y no "whey"). Traducirla en el
// scraper obligaria a que el pipeline de precios supiera de idiomas para nada: los
// precios son los mismos en los tres. Vive aqui, al lado de los demas textos.
//
// `termino` es lo que el buscador escribe en el campo cuando pulsas el chip de una
// categoria, y lo que se compara contra lo tecleado. Se traduce tambien porque quien
// busca en ingles escribe "whey protein", no "proteina whey"; el buscador sigue
// comparando tambien contra el nombre, asi que las dos formas encuentran.
//
// El SLUG no se traduce nunca: /en/proteina-whey/ y no /en/whey-protein/. Ver i18n.js.
//
// Una categoria que no este aqui sale con el nombre del dataset, en espanol. Es lo que
// tiene que pasar: una categoria nueva se publica igual y se ve que le falta el texto.

import { deFr } from '../frances.js';

export const CATEGORIAS_I18N = {
  'acido-hialuronico': {
    en: { nombre: 'Hyaluronic acid', termino: 'hyaluronic acid' },
    fr: { nombre: 'Acide hyaluronique', termino: 'acide hyaluronique' },
  },
  arginina: {
    en: { nombre: 'Arginine', termino: 'arginine' },
    fr: { nombre: 'Arginine', termino: 'arginine' },
  },
  ashwagandha: {
    en: { nombre: 'Ashwagandha', termino: 'ashwagandha' },
    fr: { nombre: 'Ashwagandha', termino: 'ashwagandha' },
  },
  bcaa: {
    en: { nombre: 'BCAA', termino: 'BCAA' },
    fr: { nombre: 'BCAA', termino: 'BCAA' },
  },
  'beta-alanina': {
    en: { nombre: 'Beta-alanine', termino: 'beta-alanine' },
    fr: { nombre: 'Bêta-alanine', termino: 'bêta-alanine' },
  },
  cafeina: {
    en: { nombre: 'Caffeine', termino: 'caffeine' },
    fr: { nombre: 'Caféine', termino: 'caféine' },
  },
  calcio: {
    en: { nombre: 'Calcium', termino: 'calcium' },
    fr: { nombre: 'Calcium', termino: 'calcium' },
  },
  carbohidratos: {
    en: { nombre: 'Carbohydrates', termino: 'carbohydrate powder' },
    fr: { nombre: 'Glucides', termino: 'glucides en poudre' },
  },
  carnitina: {
    en: { nombre: 'L-carnitine', termino: 'carnitine' },
    fr: { nombre: 'L-carnitine', termino: 'carnitine' },
  },
  caseina: {
    en: { nombre: 'Casein', termino: 'casein' },
    fr: { nombre: 'Caséine', termino: 'caséine' },
  },
  citrulina: {
    en: { nombre: 'Citrulline', termino: 'citrulline' },
    fr: { nombre: 'Citrulline', termino: 'citrulline' },
  },
  cla: {
    en: { nombre: 'CLA', termino: 'CLA' },
    fr: { nombre: 'CLA', termino: 'CLA' },
  },
  'coenzima-q10': {
    en: { nombre: 'Coenzyme Q10', termino: 'coenzyme Q10' },
    fr: { nombre: 'Coenzyme Q10', termino: 'coenzyme Q10' },
  },
  colageno: {
    en: { nombre: 'Collagen', termino: 'collagen' },
    fr: { nombre: 'Collagène', termino: 'collagène' },
  },
  colina: {
    en: { nombre: 'Choline and alpha-GPC', termino: 'choline' },
    fr: { nombre: 'Choline et alpha-GPC', termino: 'choline' },
  },
  'complejo-b': {
    en: { nombre: 'Vitamin B complex', termino: 'B complex' },
    fr: { nombre: 'Complexe vitaminique B', termino: 'complexe B' },
  },
  creatina: {
    en: { nombre: 'Creatine', termino: 'creatine' },
    fr: { nombre: 'Créatine', termino: 'créatine' },
  },
  curcuma: {
    en: { nombre: 'Turmeric', termino: 'turmeric' },
    fr: { nombre: 'Curcuma', termino: 'curcuma' },
  },
  eaa: {
    en: { nombre: 'Essential amino acids (EAA)', termino: 'EAA' },
    fr: { nombre: 'Acides aminés essentiels (EAA)', termino: 'EAA' },
  },
  espirulina: {
    en: { nombre: 'Spirulina', termino: 'spirulina' },
    fr: { nombre: 'Spiruline', termino: 'spiruline' },
  },
  'ganador-peso': {
    en: { nombre: 'Weight gainers', termino: 'mass gainer' },
    fr: { nombre: 'Gainers', termino: 'gainer' },
  },
  glucosamina: {
    en: { nombre: 'Glucosamine and chondroitin', termino: 'glucosamine' },
    fr: { nombre: 'Glucosamine et chondroïtine', termino: 'glucosamine' },
  },
  glutamina: {
    en: { nombre: 'Glutamine', termino: 'glutamine' },
    fr: { nombre: 'Glutamine', termino: 'glutamine' },
  },
  hierro: {
    en: { nombre: 'Iron', termino: 'iron' },
    fr: { nombre: 'Fer', termino: 'fer' },
  },
  hmb: {
    en: { nombre: 'HMB', termino: 'HMB' },
    fr: { nombre: 'HMB', termino: 'HMB' },
  },
  maca: {
    en: { nombre: 'Maca', termino: 'maca' },
    fr: { nombre: 'Maca', termino: 'maca' },
  },
  magnesio: {
    en: { nombre: 'Magnesium', termino: 'magnesium' },
    fr: { nombre: 'Magnésium', termino: 'magnésium' },
  },
  melatonina: {
    en: { nombre: 'Melatonin', termino: 'melatonin' },
    fr: { nombre: 'Mélatonine', termino: 'mélatonine' },
  },
  multivitaminico: {
    en: { nombre: 'Multivitamins', termino: 'multivitamin' },
    fr: { nombre: 'Multivitamines', termino: 'multivitamine' },
  },
  omega3: {
    en: { nombre: 'Omega 3', termino: 'omega 3' },
    fr: { nombre: 'Oméga 3', termino: 'oméga 3' },
  },
  potasio: {
    en: { nombre: 'Potassium and electrolytes', termino: 'potassium' },
    fr: { nombre: 'Potassium et électrolytes', termino: 'potassium' },
  },
  preentreno: {
    en: { nombre: 'Pre-workouts', termino: 'pre-workout' },
    fr: { nombre: 'Pré-workouts', termino: 'pre-workout' },
  },
  probioticos: {
    en: { nombre: 'Probiotics', termino: 'probiotic' },
    fr: { nombre: 'Probiotiques', termino: 'probiotique' },
  },
  'proteina-aislada': {
    en: { nombre: 'Whey protein isolate', termino: 'whey isolate' },
    fr: { nombre: 'Protéine whey isolate', termino: 'whey isolate' },
  },
  'proteina-vegana': {
    en: { nombre: 'Vegan protein', termino: 'vegan protein' },
    fr: { nombre: 'Protéine végétale', termino: 'protéine végétale' },
  },
  'proteina-whey': {
    en: { nombre: 'Whey protein (concentrate)', termino: 'whey protein' },
    fr: { nombre: 'Protéine whey (concentrée)', termino: 'protéine whey' },
  },
  quemagrasas: {
    en: { nombre: 'Fat burners', termino: 'fat burner' },
    fr: { nombre: 'Brûleurs de graisse', termino: 'brûleur de graisse' },
  },
  selenio: {
    en: { nombre: 'Selenium', termino: 'selenium' },
    fr: { nombre: 'Sélénium', termino: 'sélénium' },
  },
  taurina: {
    en: { nombre: 'Taurine', termino: 'taurine' },
    fr: { nombre: 'Taurine', termino: 'taurine' },
  },
  'te-verde': {
    en: { nombre: 'Green tea', termino: 'green tea' },
    fr: { nombre: 'Thé vert', termino: 'thé vert' },
  },
  teanina: {
    en: { nombre: 'L-theanine', termino: 'theanine' },
    fr: { nombre: 'L-théanine', termino: 'théanine' },
  },
  tribulus: {
    en: { nombre: 'Tribulus', termino: 'tribulus' },
    fr: { nombre: 'Tribulus', termino: 'tribulus' },
  },
  triptofano: {
    en: { nombre: 'Tryptophan and 5-HTP', termino: 'tryptophan' },
    fr: { nombre: 'Tryptophane et 5-HTP', termino: 'tryptophane' },
  },
  'vitamina-b12': {
    en: { nombre: 'Vitamin B12', termino: 'vitamin B12' },
    fr: { nombre: 'Vitamine B12', termino: 'vitamine B12' },
  },
  'vitamina-c': {
    en: { nombre: 'Vitamin C', termino: 'vitamin C' },
    fr: { nombre: 'Vitamine C', termino: 'vitamine C' },
  },
  'vitamina-d': {
    en: { nombre: 'Vitamin D', termino: 'vitamin D' },
    fr: { nombre: 'Vitamine D', termino: 'vitamine D' },
  },
  'vitamina-e': {
    en: { nombre: 'Vitamin E', termino: 'vitamin E' },
    fr: { nombre: 'Vitamine E', termino: 'vitamine E' },
  },
  'vitamina-k2': {
    en: { nombre: 'Vitamin K2', termino: 'vitamin K2' },
    fr: { nombre: 'Vitamine K2', termino: 'vitamine K2' },
  },
  zinc: {
    en: { nombre: 'Zinc', termino: 'zinc' },
    fr: { nombre: 'Zinc', termino: 'zinc' },
  },
  zma: {
    en: { nombre: 'ZMA', termino: 'ZMA' },
    fr: { nombre: 'ZMA', termino: 'ZMA' },
  },
};

/**
 * La categoria del dataset con su nombre y su termino en el idioma que toca.
 *
 * Devuelve SIEMPRE un objeto con la misma forma que el del dataset, asi que se puede
 * usar donde antes se usaba `c` sin tocar nada mas. En espanol devuelve el mismo objeto,
 * sin copiarlo: es el camino por el que pasan las 4.818 paginas del sitio.
 */
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/* --- Las consultas del FAQ, generadas ------------------------------------------------
   El dataset trae cinco preguntas escritas a mano POR CATEGORIA ("que creatina comprar",
   "cual es la creatina mas barata"...). Son 250 frases en espanol, y en ingles y frances
   serian otras 500 escritas una a una para decir cinco cosas.

   No hacen falta: las cinco son la misma plantilla con el termino dentro. Lo unico que
   obliga a escribirlas a mano en espanol es la concordancia ("la creatina mas barata" /
   "los BCAA mas baratos"), y eso en espanol ya esta resuelto en categorias.py. En ingles
   no hay concordancia, y en frances se esquiva poniendo el termino DELANTE con dos
   puntos ("Créatine : que choisir ?"), que ademas es como se titula alli una comparativa.

   ponytail: cinco plantillas por idioma en vez de 500 cadenas. Si algun dia una categoria
   necesita su pregunta a mano, se le pone un `consultas` propio en CATEGORIAS_I18N y
   gana sobre la plantilla; hoy ninguna lo necesita. */
const CONSULTAS = {
  en: {
    mejor: (x) => `which ${x} should you buy`,
    barato: (x) => `which is the cheapest ${x}`,
    precio: (x, capsulas) => (capsulas
      ? `how much does a capsule of ${x} cost`
      : `how much does a kilo of ${x} cost`),
    certificacion: (x) => `what certification should ${x} have`,
    dosis: (x) => `how much ${x} should you take a day`,
  },
  fr: {
    mejor: (x) => `${cap(x)} : que choisir`,
    barato: (x) => `${cap(x)} : quel est le prix le plus bas`,
    precio: (x, capsulas) => (capsulas
      ? `combien coûte une gélule ${deFr(x)}`
      : `combien coûte un kilo ${deFr(x)}`),
    certificacion: (x) => `${cap(x)} : quelle certification chercher`,
    dosis: (x) => `combien ${deFr(x)} faut-il prendre par jour`,
  },
};


/** El H1 de una categoria, que en cada idioma se titula distinto.
 *  El espanol lo trae el dataset en `cat.mejor` ("la mejor creatina"), escrito a mano
 *  porque el genero cambia con la palabra. El ingles no tiene ese problema. El frances
 *  si, y se esquiva con el termino delante, que ademas es el titular natural alli. */
const MEJOR = {
  en: (x) => `the best ${x}`,
  fr: (x) => `${cap(x)} : le comparatif`,
};

export const enIdioma = (cat, lang = 'es') => {
  const tr = CATEGORIAS_I18N[cat.slug]?.[lang];
  if (!tr) return cat;
  const plantillas = CONSULTAS[lang];
  const capsulas = cat.unidad_precio === 'capsula';
  // Solo se traducen las preguntas que la categoria YA tiene: si no trae `dosis` (porque
  // no hay dosis de referencia escrita), aqui tampoco aparece. La FAQ no se inventa.
  const consultas = Object.fromEntries(
    Object.keys(cat.consultas ?? {})
      .filter((k) => plantillas?.[k])
      .map((k) => [k, plantillas[k](tr.termino, capsulas)]));
  return {
    ...cat,
    nombre: tr.nombre,
    termino: tr.termino,
    mejor: tr.mejor ?? MEJOR[lang]?.(tr.termino) ?? cat.mejor,
    consultas: tr.consultas ?? consultas,
  };
};

/** La lista entera traducida. Lo que piden el menu, el indice y el buscador. */
export const categoriasEn = (cats, lang = 'es') =>
  (lang === 'es' ? cats : cats.map((c) => enIdioma(c, lang)));

// Autocomprobacion: node src/datos/categorias-i18n.js
// Comprueba lo unico que se puede romper en silencio aqui: que un slug del fichero deje
// de existir en el dataset (o al reves) y nadie se entere hasta ver una categoria en
// espanol dentro de la web en ingles.
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('categorias-i18n.js')) {
  const { default: datos } = await import('./dataset.json', { with: { type: 'json' } });
  const assert = (c, m) => { if (!c) throw new Error(m); };
  const delDataset = new Set(datos.categorias.map((c) => c.slug));
  const deAqui = Object.keys(CATEGORIAS_I18N);
  const sobran = deAqui.filter((s) => !delDataset.has(s));
  const faltan = [...delDataset].filter((s) => !CATEGORIAS_I18N[s]);
  assert(sobran.length === 0, `slugs que ya no existen en el dataset: ${sobran.join(', ')}`);
  assert(faltan.length === 0, `categorias sin traducir: ${faltan.join(', ')}`);
  for (const [slug, tr] of Object.entries(CATEGORIAS_I18N)) {
    for (const l of ['en', 'fr']) {
      assert(tr[l]?.nombre && tr[l]?.termino, `${slug} incompleta en ${l}`);
    }
  }
  const whey = datos.categorias.find((c) => c.slug === 'proteina-whey');
  assert(enIdioma(whey, 'en').nombre === 'Whey protein (concentrate)', 'enIdioma en');
  assert(enIdioma(whey, 'es') === whey, 'en espanol no se copia el objeto');
  const cre = datos.categorias.find((c) => c.slug === 'creatina');
  assert(enIdioma(cre, 'en').mejor === 'the best creatine', 'mejor en');
  assert(enIdioma(cre, 'fr').mejor === 'Créatine : le comparatif', 'mejor fr');
  assert(enIdioma(cre, 'en').consultas.precio === 'how much does a kilo of creatine cost',
         'consulta por kilo');
  const om = datos.categorias.find((c) => c.slug === 'omega3');
  assert(enIdioma(om, 'en').consultas.precio === 'how much does a capsule of omega 3 cost',
         'consulta por capsula');
  // Una categoria sin dosis escrita no gana una pregunta de dosis al traducirse.
  const hia = datos.categorias.find((c) => c.slug === 'acido-hialuronico');
  assert(!('dosis' in hia.consultas) && !('dosis' in enIdioma(hia, 'fr').consultas),
         'la FAQ no se inventa preguntas');
  console.log(`categorias-i18n.js OK (${deAqui.length} categorias)`);
}
