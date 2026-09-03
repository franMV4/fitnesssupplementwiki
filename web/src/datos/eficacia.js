// Que suplementos funcionan, ordenados por lo que hay detras de cada uno.
//
// Es la consulta mas buscada de todo el tema ("los mejores suplementos", "cuales funcionan
// de verdad") y la que peor se contesta en internet, porque quien la contesta suele vender
// justo los que recomienda. Aqui la lista no la decide nadie: el nivel de evidencia lo trae
// EVIDENCIA (escrito a mano contra las fuentes, revisado con fecha) y el precio lo trae el
// dataset del dia. Lo unico que hace este fichero es juntarlos y ordenarlos.
//
// El orden es nivel de evidencia primero y coste al mes despues. NO se ordena por "cuanto
// funciona" porque eso no se puede ordenar: la creatina y la cafeina hacen cosas distintas
// y no hay una escala que las cruce. Lo que si se puede decir es cuanta evidencia tiene
// cada una y cuanto cuesta la dosis que usaron los estudios.
//
// ponytail: sin campo nuevo y sin ranking inventado. Es un join entre dos cosas que ya
// existian y que hasta ahora solo se veian por separado, una en /guias y otra en la tabla.

import datos from './dataset.json' with { type: 'json' };
import { EVIDENCIA } from './evidencia.js';
import { TIENDAS } from './util.js';
import { titula } from './seo.js';

// El peso de cada nivel para ordenar. Es el orden en el que se lee la lista, no una nota.
const PESO = { alta: 0, media: 1, baja: 2 };

export const NIVELES = {
  alta: {
    etiqueta: 'Evidencia alta',
    que: 'Varios ensayos controlados o un posicionamiento de sociedad cientifica con ' +
         'revision por pares. El efecto es pequeno y concreto, pero se repite.',
  },
  media: {
    etiqueta: 'Evidencia media',
    que: 'Hay estudios y hay efecto, pero el tamano es discutido, depende de quien lo tome ' +
         'o las revisiones no se ponen de acuerdo.',
  },
  baja: {
    etiqueta: 'Evidencia baja',
    que: 'La mayoria se vende mucho mejor de lo que rinde: o el efecto no aparece cuando ' +
         'la dieta ya cubre el hueco, o los estudios son pequenos y de parte.',
  },
};

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Lo que cuesta al mes tomar la dosis que usan los estudios, a una toma al dia. */
const alMes = (p) => (p.coste_por_dosis_efectiva != null ? p.coste_por_dosis_efectiva * 30 : null);

function deCategoria(cat) {
  const ev = EVIDENCIA[cat.slug];
  const ps = datos.productos.filter((p) => p.categoria === cat.slug);
  const conDosis = ps.filter((p) => p.coste_por_dosis_efectiva != null)
    .sort((a, b) => a.coste_por_dosis_efectiva - b.coste_por_dosis_efectiva);
  const mejor = [...ps].sort((a, b) => (b.score_final ?? -1) - (a.score_final ?? -1))[0] ?? null;
  const barato = conDosis[0] ?? null;
  return {
    cat,
    slug: cat.slug,
    nivel: ev.nivel,
    resumen: ev.resumen,
    // El efecto que abre la guia: el que tiene cifra y fuente, no un adjetivo. Varias
    // guias empiezan por una fila de dosis ("Valor de referencia diario en la UE") en vez
    // de por un efecto, y eso en una lista de "que funciona" se lee como si el efecto
    // fuera la dosis: se salta hasta el primero que sea un efecto de verdad.
    efecto: (ev.efectos ?? []).find((e) => !/^(dosis|valor de referencia|ingesta|techo|proteina por)/i.test(e.que))
      ?? ev.efectos?.[0] ?? null,
    fuente: ev.fuentes?.[ev.efectos?.[0]?.f?.[0] ?? 0] ?? ev.fuentes?.[0] ?? null,
    dosis: ev.protocolo?.dosis ?? null,
    productos: ps.length,
    mejor,
    barato,
    // Lo que cuesta ponerse al dia con el mas barato que llega a la dosis efectiva. Es la
    // cifra que convierte "tiene evidencia" en "y me cuesta esto": sin ella la lista es
    // otra lista de suplementos buenos.
    alMes: barato ? alMes(barato) : null,
    tiendaBarato: barato ? (TIENDAS[barato.tienda] ?? barato.tienda) : null,
  };
}

/** Las 50 categorias con guia escrita, por nivel de evidencia y luego por coste al mes. */
export const EFICACIA = datos.categorias
  .filter((c) => EVIDENCIA[c.slug])
  .map(deCategoria)
  .sort((a, b) => (PESO[a.nivel] - PESO[b.nivel])
    || ((a.alMes ?? Infinity) - (b.alMes ?? Infinity)));

export const porNivel = (nivel) => EFICACIA.filter((x) => x.nivel === nivel);

/** El titular de la pagina: cuantos hay de cada nivel, contados y no estimados. */
export const RECUENTO = Object.fromEntries(
  Object.keys(NIVELES).map((n) => [n, porNivel(n).length]),
);

/* --- Que tomar para cada objetivo -------------------------------------------------
   "Que suplementos tomar para ganar masa muscular" y sus cinco hermanas son consultas de
   volumen alto que hoy contesta un foro. El reparto de categorias por objetivo es una
   decision editorial, igual que las familias del menu, y va escrita aqui para que se vea:
   lo que NO es editorial es que entre solo lo que tiene evidencia alta o media, y que
   cada uno venga con su efecto, su dosis y su precio del dataset.

   `descarta` es la otra mitad del articulo y la razon de que exista: lo que a uno le
   intentan vender para ese objetivo y no le hace falta. Si no lo dice esta pagina, lo dice
   la tienda. */
export const OBJETIVOS = [
  {
    slug: 'ganar-masa-muscular',
    nombre: 'Ganar masa muscular',
    h1: 'Que suplementos sirven para ganar masa muscular',
    consulta: 'que suplementos tomar para ganar masa muscular',
    entrada: 'Ninguno de estos construye musculo por su cuenta. Lo que hacen es tapar los ' +
             'dos agujeros por los que se pierde el trabajo del gimnasio: no llegar a la ' +
             'proteina del dia y no poder entrenar tan duro como se podria.',
    incluye: ['creatina', 'proteina-whey', 'proteina-aislada', 'proteina-vegana', 'caseina',
              'ganador-peso', 'carbohidratos'],
    basico: ['creatina', 'proteina-whey'],
    descarta: ['bcaa', 'glutamina', 'eaa'],
  },
  {
    slug: 'perder-grasa',
    nombre: 'Perder grasa',
    h1: 'Que suplementos sirven para perder grasa (y cuales no)',
    consulta: 'suplementos para perder grasa',
    entrada: 'Es el objetivo con mas humo por metro cuadrado. Lo que tiene evidencia no ' +
             'quema grasa: sostiene el musculo mientras se come menos y ayuda a entrenar ' +
             'igual de fuerte con menos energia disponible.',
    incluye: ['proteina-whey', 'proteina-aislada', 'cafeina', 'creatina'],
    basico: ['proteina-whey', 'creatina'],
    descarta: ['carnitina', 'glutamina', 'bcaa'],
  },
  {
    slug: 'rendimiento',
    nombre: 'Rendimiento y fuerza',
    h1: 'Que suplementos mejoran el rendimiento en el entrenamiento',
    consulta: 'suplementos para rendimiento deportivo',
    entrada: 'Los cuatro que aparecen aqui son los que la ISSN da por buenos para ' +
             'rendimiento, cada uno para un tipo de esfuerzo distinto. Fuera de su rango ' +
             'de esfuerzo, no hacen nada.',
    incluye: ['creatina', 'cafeina', 'beta-alanina', 'carbohidratos', 'citrulina', 'preentreno'],
    basico: ['creatina', 'cafeina'],
    descarta: ['bcaa', 'glutamina', 'zma'],
  },
  {
    slug: 'articulaciones',
    nombre: 'Articulaciones',
    h1: 'Que suplementos sirven para las articulaciones',
    consulta: 'suplementos para las articulaciones',
    entrada: 'Aqui la evidencia es floja casi entera y conviene decirlo antes que nada: se ' +
             'habla de menos dolor, no de cartilago nuevo, y los efectos tardan meses.',
    incluye: ['colageno', 'omega3', 'curcuma', 'magnesio'],
    basico: ['omega3'],
    descarta: ['glucosamina'],
  },
  {
    slug: 'descanso-y-estres',
    nombre: 'Descanso y estres',
    h1: 'Que suplementos ayudan a dormir mejor y con el estres',
    consulta: 'suplementos para dormir y estres',
    entrada: 'Dormir mal no se arregla con un bote, pero dos de estos tienen efecto medido ' +
             'y barato. El resto de lo que se vende en esta estanteria es un multivitaminico ' +
             'con nombre de noche.',
    incluye: ['melatonina', 'magnesio', 'ashwagandha'],
    basico: ['melatonina'],
    descarta: ['zma'],
  },
  {
    slug: 'salud-general',
    nombre: 'Salud general',
    h1: 'Que suplementos tienen sentido para la salud general',
    consulta: 'que suplementos tomar para la salud',
    entrada: 'Sin deficit no hay efecto: un suplemento aqui solo hace algo si tapa un hueco ' +
             'que la dieta o el sol dejan abierto. Por eso los que tienen sentido son pocos ' +
             'y muy concretos.',
    incluye: ['omega3', 'vitamina-d', 'vitamina-b12', 'vitamina-c', 'hierro', 'probioticos', 'zinc'],
    basico: ['omega3', 'vitamina-d'],
    descarta: ['multivitaminico'],
  },
];

const conEvidencia = (slugs) => slugs
  .map((s) => EFICACIA.find((x) => x.slug === s))
  .filter(Boolean);

/** Un objetivo con sus categorias ya resueltas y el coste del conjunto al mes. */
export function elObjetivo(o) {
  const incluye = conEvidencia(o.incluye)
    .sort((a, b) => (PESO[a.nivel] - PESO[b.nivel]) || ((a.alMes ?? Infinity) - (b.alMes ?? Infinity)));
  const descarta = conEvidencia(o.descarta);
  // El basico NO es "todos los de evidencia alta": eso sumaba whey, aislada y vegana en el
  // mismo mes, y nadie se toma tres proteinas distintas. Es una lista corta y escrita a
  // mano de lo minimo defendible para ese objetivo, y la suma del mes sale de ahi.
  const nucleo = conEvidencia(o.basico ?? []);
  const conPrecio = nucleo.filter((x) => x.alMes != null);
  return {
    ...o,
    incluye,
    descarta,
    nucleo,
    // Solo suma lo que tiene dosis publicada; la pagina dice cuantos son y cuantos no.
    conPrecio,
    alMes: conPrecio.length ? conPrecio.reduce((n, x) => n + x.alMes, 0) : null,
    // El H1 ya es largo de por si, asi que el sufijo lo elige `titula`: el primero que
    // quepa en el tope de 65 caracteres, y si no cabe ninguno, el H1 solo. Sin esto,
    // los seis titulos se iban a 90 y pico y seo_check tumbaba el build.
    titulo: titula(o.h1, ': evidencia y dosis', ': con fuentes', ''),
  };
}

export const OBJETIVOS_RESUELTOS = OBJETIVOS.map(elObjetivo);

export const RUTAS_EFICACIA = [
  '/suplementos-que-funcionan',
  ...OBJETIVOS.map((o) => `/para/${o.slug}`),
];

export { cap };
