// De donde sale la diferencia de precio entre dos tiendas, y que lleva dentro cada bote.
//
// Las comparativas tenian resuelto el "cual es mas barata" (mediana, minimo, maximo) y no
// contestaban la pregunta que trae de verdad quien busca "HSN o Zumub": POR QUE una es
// mas barata. Un precio por kilo no se explica solo; se explica con lo que hay dentro del
// kilo (cuanto activo, a que dosis por servicio, con que aditivos) y con como se vende
// (formato del envase, marca propia o reventa, analitica pagada o no).
//
// Todo lo de aqui son medianas del dataset, no opiniones: cada factor solo aparece si las
// dos partes tienen el dato, y si no lo tienen no se escribe la frase. Un "por que"
// inventado es peor que no tenerlo, porque suena igual de convincente.
//
// ponytail: un modulo de calculo y ningun campo nuevo en el scraper. Los ocho factores
// salen de columnas que ya se recogian y que ninguna pagina estaba leyendo.

import { UNIDAD, eur } from './util.js';
import { copia, ingrediente } from './landings-i18n.js';

const conDato = (xs) => xs.filter((x) => x != null && !Number.isNaN(x));

export const mediana = (xs) => {
  const a = conDato(xs).sort((x, y) => x - y);
  return a.length ? a[Math.floor(a.length / 2)] : null;
};

const pct = (n, total) => (total ? Math.round((100 * n) / total) : 0);

/** Cuanto mas caro es b que a, en porcentaje. null si falta alguno o si a es cero. */
export const sobrecoste = (a, b) => (a && b ? Math.round(((b / a) - 1) * 100) : null);

const coma = (n, dec = 1, lang = 'es') => copia(lang).decimal(n, dec);

/** Dosis en la unidad que se lee: 3 g, 250 mg. */
export const mg = (v, lang = 'es') =>
  (v == null ? '—' : v >= 1000 ? `${coma(v / 1000, 1, lang)} g` : `${Math.round(v)} mg`);

/** Tamano del envase: 2,5 kg, 300 g. */
export const formato = (g, lang = 'es') =>
  (g == null ? '—' : g >= 1000 ? `${coma(g / 1000, 1, lang)} kg` : `${Math.round(g)} g`);


/* --- Los ingredientes cara a cara ------------------------------------------------
   Que activo lleva cada catalogo, a que dosis por servicio y cuantos llegan a la dosis
   que tiene evidencia detras. En una categoria simple (creatina) es una fila y dice si el
   polvo barato esta aguado; en una formula (preentreno) son ocho y ahi se ve entero el
   truco de la etiqueta: el mismo nombre en el bote y la mitad de citrulina dentro. */
export function ingredientesCaraACara(ladoA, ladoB, tope = 8, lang = 'es') {
  const todos = [...ladoA.productos, ...ladoB.productos];
  const claves = [...new Set(todos.flatMap((p) => (p.ingredientes ?? []).map((i) => i.ingrediente)))];

  const lado = (ps, clave) => {
    const filas = ps.map((p) => p.ingredientes?.find((i) => i.ingrediente === clave)).filter(Boolean);
    const dosis = filas.map((i) => i.dosis_por_servicio_mg);
    const min = filas.find((i) => i.referencia?.dosis_efectiva_min_mg)
      ?.referencia.dosis_efectiva_min_mg ?? null;
    const declaradas = conDato(dosis);
    return {
      llevan: filas.length,
      total: ps.length,
      pctLlevan: pct(filas.length, ps.length),
      dosis: mediana(dosis),
      conDosis: declaradas.length,
      // "Llega a la dosis" se mide contra la referencia de la categoria, la misma que usa
      // el motor de scoring: no es un umbral puesto a ojo en esta pagina. Sin dosis en la
      // ficha esto es null y NO cero: una tienda que no publica la dosis no es una tienda
      // que infradosifica, y pintar un 0 de 11 la condenaria por no rellenar un campo.
      cumplen: min == null || !declaradas.length
        ? null : declaradas.filter((d) => d >= min).length,
      min,
    };
  };

  return claves
    .map((clave) => {
      const a = lado(ladoA.productos, clave);
      const b = lado(ladoB.productos, clave);
      return {
        clave,
        nombre: ingrediente(clave, lang),
        min: a.min ?? b.min,
        a,
        b,
        // Para ordenar: primero el activo que casi todos llevan, que es el que define la
        // categoria; despues los que solo aparecen en algunas formulas.
        peso: a.llevan + b.llevan,
      };
    })
    .filter((f) => f.peso > 0)
    .sort((x, y) => y.peso - x.peso)
    .slice(0, tope);
}

/* --- Por que una es mas barata ---------------------------------------------------
   Ocho factores posibles; salen los que tienen dato en las dos partes. Cada uno lleva el
   numero de cada lado y una frase que dice que significa esa diferencia para quien paga.
   El orden es el de importancia: primero lo que cambia el precio real por dosis, luego lo
   que cambia el precio de la etiqueta, y al final lo que cambia el riesgo. */
export function porQuePrecio(cat, ladoA, ladoB, lang = 'es') {
  const T = copia(lang);
  const unidad = UNIDAD[lang][cat.unidad_precio] ?? 'kg';
  const dec = cat.unidad_precio === 'capsula' ? 3 : 2;
  const precio = (n) => (n == null ? '—' : `${eur(n, dec, lang)}/${unidad}`);
  const A = ladoA.productos;
  const B = ladoB.productos;
  const f = [];
  const dosDatos = (xa, xb) => xa != null && xb != null;

  const refA = mediana(A.map((p) => p.precio_referencia));
  const refB = mediana(B.map((p) => p.precio_referencia));

  // 1. El precio por dosis. Es el unico que compara lo que de verdad se toma: dos
  //    creatinas al mismo precio por kilo no cuestan lo mismo si una se toma a 3 g y la
  //    otra a 5. Cuando el orden por kilo y el orden por dosis no coinciden, esta fila
  //    sola contesta la pregunta de la pagina.
  const dosisA = mediana(A.map((p) => p.coste_por_dosis_efectiva));
  const dosisB = mediana(B.map((p) => p.coste_por_dosis_efectiva));
  if (dosDatos(dosisA, dosisB)) {
    const vuelta = dosDatos(refA, refB) && (refA < refB) !== (dosisA < dosisB);
    const gD = dosisA < dosisB ? ladoA.nombre : ladoB.nombre;
    f.push({
      id: 'dosis',
      titulo: T.pq_dosis_t,
      a: eur(dosisA, 3, lang),
      b: eur(dosisB, 3, lang),
      texto: vuelta
        ? T.pq_dosis_vuelta(refA < refB ? ladoA.nombre : ladoB.nombre, unidad, gD)
        : T.pq_dosis_igual(unidad, gD),
    });
  }

  // 2. Cuanto activo hay en 100 g. Lo primero que explica un kilo barato: el kilo pesa lo
  //    mismo, pero parte de ese peso es aroma, edulcorante y espesante, y se paga al mismo
  //    precio que el activo.
  // Myprotein publica sus aislados de soja como "21 % de proteina", que no existe: es un
  // error de lectura de la ficha, no una formula aguada. Un dato asi, dicho en prosa
  // ("pone 24 g de activo por cada 100 g"), es una acusacion falsa repetida en cientos de
  // paginas, asi que se descarta lo que quede por debajo de la mitad de la pureza tipica
  // de la categoria.
  // ponytail: filtro de visualizacion, no arreglo. El dato malo sigue en el dataset y
  // sigue entrando en el score; eso se corrige en el scraper, que es donde se lee mal.
  const purezas = (ps) => ps.map((p) => {
    const tipica = p.ingredientes?.find((i) => i.referencia?.pureza_tipica)?.referencia.pureza_tipica;
    return p.pureza_real != null && (!tipica || p.pureza_real >= tipica / 2) ? p.pureza_real : null;
  }).filter((x) => x != null);
  const pzA = purezas(A);
  const pzB = purezas(B);
  const purA = mediana(pzA);
  const purB = mediana(pzB);
  // Con una o dos fichas no hay mediana que valga: hay dos productos sueltos.
  if (pzA.length >= 3 && pzB.length >= 3
      && dosDatos(purA, purB) && Math.round(purA * 100) !== Math.round(purB * 100)) {
    const alto = purA > purB ? ladoA : ladoB;
    const bajo = purA > purB ? ladoB : ladoA;
    f.push({
      id: 'pureza',
      titulo: T.pq_pureza_t,
      a: `${Math.round(purA * 100)} g`,
      b: `${Math.round(purB * 100)} g`,
      texto: T.pq_pureza(alto.nombre, Math.round(Math.max(purA, purB) * 100),
                         bajo.nombre, Math.round(Math.min(purA, purB) * 100)),
    });
  }

  // 3. El tamano del envase. La causa mas aburrida y la mas frecuente: el mismo producto en
  //    2 kg baja el precio por kilo sin que nadie haya rebajado nada.
  const capsulas = cat.unidad_precio === 'capsula';
  const tamA = mediana(A.map((p) => (capsulas ? p.unidades : p.formato_gramos)));
  const tamB = mediana(B.map((p) => (capsulas ? p.unidades : p.formato_gramos)));
  if (dosDatos(tamA, tamB) && tamA !== tamB) {
    const grande = tamA > tamB ? ladoA : ladoB;
    f.push({
      id: 'formato',
      titulo: T.pq_formato_t(capsulas),
      a: capsulas ? `${Math.round(tamA)} ${T.caps}` : formato(tamA, lang),
      b: capsulas ? `${Math.round(tamB)} ${T.caps}` : formato(tamB, lang),
      texto: T.pq_formato(grande.nombre, capsulas, unidad),
    });
  }

  // 4. Marca propia o reventa. Una tienda que fabrica su marca se ahorra el margen del
  //    fabricante; una que revende lo paga y lo repercute. Se deduce de cuanto pesa su
  //    marca principal dentro de su propio catalogo, que es un dato del dataset y no una
  //    suposicion sobre su modelo de negocio.
  const dominante = (ps) => {
    const cuenta = {};
    for (const p of ps) cuenta[p.marca] = (cuenta[p.marca] ?? 0) + 1;
    const [marca, n] = Object.entries(cuenta).sort((x, y) => y[1] - x[1])[0] ?? [];
    return { marca, n, pct: pct(n ?? 0, ps.length), marcas: Object.keys(cuenta).length };
  };
  const dA = dominante(A);
  const dB = dominante(B);
  // Un catalogo donde la marca que mas pesa es "Desconocida" (Amazon, sobre todo) no
  // demuestra marca propia: demuestra que la ficha no dice la marca. Sin ese dato no se
  // afirma nada sobre el margen del fabricante.
  const marcaFiable = (d) => d.marca && d.marca !== 'Desconocida';
  if (A.length && B.length && Math.abs(dA.pct - dB.pct) >= 25
      && marcaFiable(dA.pct > dB.pct ? dA : dB)) {
    const propia = dA.pct > dB.pct ? { d: dA, l: ladoA } : { d: dB, l: ladoB };
    const reventa = dA.pct > dB.pct ? { d: dB, l: ladoB } : { d: dA, l: ladoA };
    f.push({
      id: 'catalogo',
      titulo: T.pq_catalogo_t,
      a: `${dA.marcas} (${dA.pct} % ${dA.marca})`,
      b: `${dB.marcas} (${dB.pct} % ${dB.marca})`,
      texto: T.pq_catalogo(propia.l.nombre, propia.d.marca, propia.d.pct, reventa.l.nombre,
                           reventa.d.marcas),
    });
  }

  // 5. Aditivos. Lo barato suele llevar mas relleno y mas edulcorante; conviene decirlo con
  //    el porcentaje delante y sin llamarlo veneno, que es lo que hace todo el mundo.
  const conAd = (ps) => ps.filter((p) => p.aditivos?.length).length;
  const adA = pct(conAd(A), A.length);
  const adB = pct(conAd(B), B.length);
  if (A.length && B.length && Math.abs(adA - adB) >= 15) {
    const lista = [...new Set([...A, ...B].flatMap((p) => p.aditivos ?? []))]
      .map((a) => T.aditivo[a] ?? a.replace(/_/g, ' '));
    f.push({
      id: 'aditivos',
      titulo: T.pq_aditivos_t,
      a: `${adA} %`,
      b: `${adB} %`,
      texto: T.pq_aditivos(lista.join(', '), unidad),
    });
  }

  // 6. La analitica. Cuesta dinero por lote y alguien la paga: cuando una tienda es mas cara
  //    y ademas es la que publica analisis, parte de esa diferencia esta comprada.
  const verif = (ps) => ps.filter((p) => p.nivel_verificacion >= 3).length;
  const vA = verif(A);
  const vB = verif(B);
  if (A.length && B.length && (vA || vB) && Math.abs(pct(vA, A.length) - pct(vB, B.length)) >= 15) {
    const mas = pct(vA, A.length) > pct(vB, B.length) ? ladoA : ladoB;
    f.push({
      id: 'verificacion',
      titulo: T.pq_verif_t,
      a: T.pq_de(vA, A.length),
      b: T.pq_de(vB, B.length),
      texto: T.pq_verif(mas.nombre),
    });
  }

  // 7. La forma quimica, solo en las categorias donde cambia (creatina monohidrato frente a
  //    HCl, magnesio bisglicinato frente a oxido). Dos formas del mismo ingrediente no
  //    cuestan lo mismo de fabricar y no son la misma compra.
  const formas = (ps) => {
    const c = {};
    for (const p of ps) if (p.forma) c[p.forma] = (c[p.forma] ?? 0) + 1;
    return Object.entries(c).sort((x, y) => y[1] - x[1]);
  };
  const fA = formas(A);
  const fB = formas(B);
  if (fA.length && fB.length && (fA[0][0] !== fB[0][0] || fA.length !== fB.length)) {
    const enumera = (xs) => xs.map(([n, k]) => `${ingrediente(n, lang)} (${k})`).join(', ');
    f.push({
      id: 'forma',
      titulo: T.pq_forma_t,
      a: fA.map(([n, k]) => `${ingrediente(n, lang)} ${k}`).join(' · '),
      b: fB.map(([n, k]) => `${ingrediente(n, lang)} ${k}`).join(' · '),
      texto: T.pq_forma(ladoA.nombre, enumera(fA), ladoB.nombre, enumera(fB)),
    });
  }

  // 8. La nota de los compradores. No explica el precio, pero es lo que se mira justo
  //    despues, y sin ella la seccion parece decir que solo cuenta el coste.
  const notaA = mediana(A.map((p) => p.valoracion));
  const notaB = mediana(B.map((p) => p.valoracion));
  if (dosDatos(notaA, notaB)) {
    const opA = A.reduce((n, p) => n + (p.n_valoraciones ?? 0), 0);
    const opB = B.reduce((n, p) => n + (p.n_valoraciones ?? 0), 0);
    f.push({
      id: 'valoracion',
      titulo: T.pq_nota_t,
      a: `${T.decimal(notaA)}/5`,
      b: `${T.decimal(notaB)}/5`,
      texto: T.pq_nota(T.miles(opA), ladoA.nombre, T.miles(opB), ladoB.nombre),
    });
  }

  // La entradilla de la seccion: cuanta diferencia hay y a que se le puede atribuir.
  const d = sobrecoste(Math.min(refA, refB), Math.max(refA, refB));
  const barata = refA <= refB ? ladoA : ladoB;
  const cara = refA <= refB ? ladoB : ladoA;
  const causas = f
    .filter((x) => ['pureza', 'formato', 'catalogo', 'aditivos', 'verificacion', 'forma'].includes(x.id))
    .map((x) => x.titulo.toLowerCase());
  const intro = !dosDatos(refA, refB) ? null
    : !d
      ? T.pq_intro_empate(precio(refA), ladoA.nombre, ladoB.nombre)
      : T.pq_intro(cara.nombre, d, unidad, barata.nombre, precio(Math.max(refA, refB)),
                   precio(Math.min(refA, refB)))
        + (causas.length ? T.pq_intro_causas(causas.join(', ')) : T.pq_intro_politica);

  return { intro, factores: f, unidad };
}
