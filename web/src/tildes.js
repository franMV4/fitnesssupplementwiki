// Restaura tildes y enes sobre el texto YA renderizado (PLAN-ESTETICA F1.1).
//
// Por que aqui y no en cada fichero: el texto sin tilde sale de quince sitios (categorias,
// landings, seo, evidencia, tiendas, y los nombres que escriben las propias tiendas en el
// dataset). Escribirlo con tilde en el codigo choca con la regla de AGENTS.md ("sin tildes
// en el codigo") y ademas no arregla los nombres de producto, que vienen de fuera. Un solo
// paso sobre el HTML construido los cubre todos, incluidos los 4.800 productos.
//
// Regla de oro: SOLO palabras que en espanol llevan tilde SIEMPRE, en esa forma exacta. Nada
// de monosilabos ambiguos (el/tu/mi/si), ni demostrativos (esta/este), ni verbos que
// colisionan (publica, hacia). Asi el reemplazo es seguro sin analizar la frase. `mas` entra
// porque en esta web es siempre el comparativo. Lo que no este en el mapa, se queda igual.

// forma sin tilde -> forma con tilde. El plural solo entra cuando TAMBIEN lleva tilde
// (proteina/proteinas si; certificacion si, certificaciones NO: es llana acabada en -s).
const MAPA = {
  certificacion: 'certificación', verificacion: 'verificación', informacion: 'información',
  composicion: 'composición', absorcion: 'absorción', funcion: 'función', opinion: 'opinión',
  version: 'versión', edicion: 'edición', seleccion: 'selección', racion: 'ración',
  porcion: 'porción', presentacion: 'presentación', puntuacion: 'puntuación',
  categoria: 'categoría', categorias: 'categorías', metodologia: 'metodología',
  proteina: 'proteína', proteinas: 'proteínas', caseina: 'caseína', cafeina: 'cafeína',
  energia: 'energía', garantia: 'garantía', dia: 'día', dias: 'días',
  analisis: 'análisis', capsula: 'cápsula', capsulas: 'cápsulas', pagina: 'página',
  paginas: 'páginas', articulo: 'artículo', articulos: 'artículos', metodo: 'método',
  metodos: 'métodos', indice: 'índice', indices: 'índices', formula: 'fórmula',
  formulas: 'fórmulas', numero: 'número', numeros: 'números', sintesis: 'síntesis',
  quimica: 'química', quimico: 'químico', quimicas: 'químicas', quimicos: 'químicos',
  acido: 'ácido', acidos: 'ácidos', acida: 'ácida', acidas: 'ácidas',
  aminoacido: 'aminoácido', aminoacidos: 'aminoácidos',
  vitaminico: 'vitamínico', vitaminicos: 'vitamínicos', vitaminica: 'vitamínica',
  multivitaminico: 'multivitamínico', multivitaminicos: 'multivitamínicos',
  maximo: 'máximo', maxima: 'máxima', maximos: 'máximos', maximas: 'máximas',
  minimo: 'mínimo', minima: 'mínima', minimos: 'mínimos', minimas: 'mínimas',
  ultimo: 'último', ultima: 'última', ultimos: 'últimos', ultimas: 'últimas',
  unico: 'único', unica: 'única', unicos: 'únicos', unicas: 'únicas',
  rapido: 'rápido', rapida: 'rápida', rapidos: 'rápidos', rapidas: 'rápidas',
  medico: 'médico', medica: 'médica', medicos: 'médicos', medicas: 'médicas',
  practico: 'práctico', practica: 'práctica', practicas: 'prácticas',
  fisico: 'físico', fisica: 'física',
  tambien: 'también', segun: 'según', asi: 'así', aqui: 'aquí', ahi: 'ahí', alli: 'allí',
  mas: 'más', comun: 'común', facil: 'fácil', dificil: 'difícil', despues: 'después',
  ademas: 'además', quiza: 'quizá', alla: 'allá',
  tenia: 'tenía', seria: 'sería', podria: 'podría', deberia: 'debería', habria: 'habría',
  habia: 'había', queria: 'quería', estan: 'están', sera: 'será', seran: 'serán',
  espanol: 'español', espanola: 'española', espanoles: 'españoles', espanolas: 'españolas',
  diseno: 'diseño', disenos: 'diseños', tamano: 'tamaño', tamanos: 'tamaños',
  ano: 'año', anos: 'años', pequeno: 'pequeño', pequena: 'pequeña',
  pequenos: 'pequeños', pequenas: 'pequeñas', sueno: 'sueño', manana: 'mañana',
  ensena: 'enseña', ensenan: 'enseñan', ensenar: 'enseñar', ensenamos: 'enseñamos',
  anade: 'añade', anaden: 'añaden', anadir: 'añadir', anadido: 'añadido',
  anadidos: 'añadidos', anadida: 'añadida', anadidas: 'añadidas', anadimos: 'añadimos',
  companero: 'compañero', desempeno: 'desempeño', dano: 'daño', danos: 'daños',
  // Verbos y nombres frecuentes, sin colision de significado en esta web.
  puntua: 'puntúa', puntuan: 'puntúan', sesion: 'sesión', opcion: 'opción',
  atencion: 'atención', monton: 'montón', mostro: 'mostró', mejoro: 'mejoró',
  caloria: 'caloría', calorias: 'calorías', proposito: 'propósito',
  cientifico: 'científico', cientifica: 'científica', cientificos: 'científicos',
  cientificas: 'científicas', dietetico: 'dietético', dietetica: 'dietética',
  dieteticos: 'dietéticos', dieteticas: 'dietéticas', parrafo: 'párrafo',
};

// Interrogativos: solo llevan tilde cuando preguntan, y en esta web eso se marca con "¿".
// Asi que se acentuan pegados a la apertura de pregunta y no en su uso relativo.
const PREGUNTAS = [
  [/¿Por que\b/g, '¿Por qué'], [/¿por que\b/g, '¿por qué'],
  [/¿Que\b/g, '¿Qué'], [/¿que\b/g, '¿qué'],
  [/¿Como\b/g, '¿Cómo'], [/¿como\b/g, '¿cómo'],
  [/¿Cuales\b/g, '¿Cuáles'], [/¿cuales\b/g, '¿cuáles'],
  [/¿Cual\b/g, '¿Cuál'], [/¿cual\b/g, '¿cuál'],
  [/¿Cuantos\b/g, '¿Cuántos'], [/¿cuantos\b/g, '¿cuántos'],
  [/¿Cuantas\b/g, '¿Cuántas'], [/¿cuantas\b/g, '¿cuántas'],
  [/¿Cuanta\b/g, '¿Cuánta'], [/¿cuanta\b/g, '¿cuánta'],
  [/¿Cuanto\b/g, '¿Cuánto'], [/¿cuanto\b/g, '¿cuánto'],
  [/¿Cuando\b/g, '¿Cuándo'], [/¿cuando\b/g, '¿cuándo'],
  [/¿Donde\b/g, '¿Dónde'], [/¿donde\b/g, '¿dónde'],
  [/¿Quienes\b/g, '¿Quiénes'], [/¿quienes\b/g, '¿quiénes'],
  [/¿Quien\b/g, '¿Quién'], [/¿quien\b/g, '¿quién'],
];

const claves = Object.keys(MAPA);
const RE = new RegExp('\\b(' + claves.join('|') + ')\\b', 'gi');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const enTexto = (txt) => {
  let t = txt.replace(RE, (m) => {
    const dest = MAPA[m.toLowerCase()];
    if (!dest) return m;
    return m[0] === m[0].toUpperCase() ? cap(dest) : dest;
  });
  for (const [re, rep] of PREGUNTAS) t = t.replace(re, rep);
  return t;
};

// Marcador con caracteres de uso privado (U+E000/U+E001): ni son letra ni aparecen en el
// HTML, asi que ni enTexto los toca ni chocan con un numero suelto del texto ("de 5 tiendas").
const M0 = String.fromCharCode(0xe000);
const M1 = String.fromCharCode(0xe001);
const RE_MARCA = new RegExp(M0 + '(\\d+)' + M1, 'g');

// Se aplica al HTML construido. Solo toca:
//   - nodos de texto (lo que hay entre > y <), incluido el <title>;
//   - el atributo content="" de los <meta> (descripcion, og:title, og:description).
// NO toca el resto de atributos (href, src, class, data-*, id: ahi viven slugs y URLs con
// palabras como "proteina-vegana", que no se pueden acentuar sin romper el enlace) ni el
// contenido de <script> (incluido el JSON-LD, que lleva URLs) ni de <style>.
export function restaurarTildesHTML(html) {
  const bloques = [];
  const protegido = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, (m) => {
    bloques.push(m);
    return M0 + (bloques.length - 1) + M1;
  });

  const conMeta = protegido.replace(
    /(<meta\b[^>]*\bcontent=")([^"]*)(")/gi,
    (_, a, val, c) => a + enTexto(val) + c);

  const conTexto = conMeta.replace(/>([^<]+)</g, (_, txt) => '>' + enTexto(txt) + '<');

  return conTexto.replace(RE_MARCA, (_, i) => bloques[+i]);
}

// Las palabras que, ya construido el sitio, NO deben quedar sin tilde en el texto visible.
// Es lo que comprueba seo_check.py: si aparece una, el paso de arriba no se aplico a esa
// pagina (o alguien metio copy nuevo saltandoselo). Lista corta y de las mas visibles.
export const SIN_TILDE_PROHIBIDAS = [
  'categoria', 'categorias', 'certificacion', 'verificacion', 'proteina', 'proteinas',
  'capsula', 'capsulas', 'analisis', 'metodologia', 'pagina', 'informacion', 'espanol',
  'espanola', 'espanolas',
];

// Autocomprobacion: node src/tildes.js
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('tildes.js')) {
  const assert = (c, m) => { if (!c) throw new Error(m); };
  assert(restaurarTildesHTML('<p>categoria y certificacion</p>') === '<p>categoría y certificación</p>', 'texto');
  assert(restaurarTildesHTML('<h1>Proteina y Analisis</h1>') === '<h1>Proteína y Análisis</h1>', 'cap');
  assert(restaurarTildesHTML('<a href="/proteina-vegana/">proteina</a>') === '<a href="/proteina-vegana/">proteína</a>', 'href intacto');
  assert(restaurarTildesHTML('<meta name="description" content="proteina espanola">') === '<meta name="description" content="proteína española">', 'meta');
  assert(restaurarTildesHTML('<script>var proteina=1</script><p>proteina</p>') === '<script>var proteina=1</script><p>proteína</p>', 'script intacto');
  assert(restaurarTildesHTML('<p>certificaciones</p>') === '<p>certificaciones</p>', 'plural llano no cambia');
  assert(restaurarTildesHTML('<p>¿Que creatina?</p>') === '<p>¿Qué creatina?</p>', 'pregunta');
  assert(restaurarTildesHTML('<p>esta web</p>') === '<p>esta web</p>', 'demostrativo intacto');
  assert(restaurarTildesHTML('<td>de 5 tiendas</td>') === '<td>de 5 tiendas</td>', 'numero suelto intacto');
  console.log('tildes.js OK');
}
