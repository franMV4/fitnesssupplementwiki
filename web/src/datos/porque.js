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

import { UNIDAD, eur, nombreIngrediente } from './util.js';

const conDato = (xs) => xs.filter((x) => x != null && !Number.isNaN(x));

export const mediana = (xs) => {
  const a = conDato(xs).sort((x, y) => x - y);
  return a.length ? a[Math.floor(a.length / 2)] : null;
};

const pct = (n, total) => (total ? Math.round((100 * n) / total) : 0);

/** Cuanto mas caro es b que a, en porcentaje. null si falta alguno o si a es cero. */
export const sobrecoste = (a, b) => (a && b ? Math.round(((b / a) - 1) * 100) : null);

const coma = (n, dec = 1) => n.toFixed(dec).replace(/[.,]0$/, '').replace('.', ',');

/** Dosis en la unidad que se lee: 3 g, 250 mg. */
export const mg = (v) => (v == null ? '—' : v >= 1000 ? `${coma(v / 1000)} g` : `${Math.round(v)} mg`);

/** Tamano del envase: 2,5 kg, 300 g. */
export const formato = (g) =>
  (g == null ? '—' : g >= 1000 ? `${coma(g / 1000)} kg` : `${Math.round(g)} g`);

const ADITIVOS = {
  edulcorante_artificial: 'edulcorantes artificiales',
  colorante: 'colorantes',
  aroma_artificial: 'aromas artificiales',
  relleno: 'rellenos',
};

/* --- Los ingredientes cara a cara ------------------------------------------------
   Que activo lleva cada catalogo, a que dosis por servicio y cuantos llegan a la dosis
   que tiene evidencia detras. En una categoria simple (creatina) es una fila y dice si el
   polvo barato esta aguado; en una formula (preentreno) son ocho y ahi se ve entero el
   truco de la etiqueta: el mismo nombre en el bote y la mitad de citrulina dentro. */
export function ingredientesCaraACara(ladoA, ladoB, tope = 8) {
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
        nombre: nombreIngrediente(clave),
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
export function porQuePrecio(cat, ladoA, ladoB) {
  const unidad = UNIDAD[cat.unidad_precio] ?? 'kg';
  const dec = unidad === 'kg' ? 2 : 3;
  const precio = (n) => (n == null ? '—' : `${eur(n, dec)}/${unidad}`);
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
    f.push({
      id: 'dosis',
      titulo: 'Coste de una dosis efectiva',
      a: eur(dosisA, 3),
      b: eur(dosisB, 3),
      texto: vuelta
        ? `Aqui se da la vuelta la comparacion: ${refA < refB ? ladoA.nombre : ladoB.nombre} ` +
          `gana por ${unidad} y ${dosisA < dosisB ? ladoA.nombre : ladoB.nombre} gana por dosis. ` +
          `El precio por ${unidad} mide polvo o capsulas; este mide lo que hay que tomarse para ` +
          `que el ingrediente haga lo que dice el estudio, que es lo que se acaba pagando.`
        : `El precio por ${unidad} y el precio por dosis apuntan a la misma tienda, asi que la ` +
          `diferencia de la etiqueta no la borra la dosis: ` +
          `${dosisA < dosisB ? ladoA.nombre : ladoB.nombre} sale mas barata de las dos maneras.`,
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
    const dAlto = Math.round(Math.max(purA, purB) * 100);
    const dBajo = Math.round(Math.min(purA, purB) * 100);
    f.push({
      id: 'pureza',
      titulo: 'Activo por cada 100 g',
      a: `${Math.round(purA * 100)} g`,
      b: `${Math.round(purB * 100)} g`,
      texto: `${alto.nombre} pone ${dAlto} g de activo por cada 100 g de producto y ` +
             `${bajo.nombre}, ${dBajo} g. Los ${dAlto - dBajo} g de diferencia son aroma, ` +
             `edulcorante y espesante, y en un bote se pagan al mismo precio que el activo: por ` +
             `eso un kilo mas barato puede salir mas caro en cuanto se mide por dosis.`,
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
      titulo: capsulas ? 'Capsulas por envase (mediana)' : 'Tamano del envase (mediana)',
      a: capsulas ? `${Math.round(tamA)} caps.` : formato(tamA),
      b: capsulas ? `${Math.round(tamB)} caps.` : formato(tamB),
      texto: `${grande.nombre} vende envases mas grandes, y el envase grande reparte el mismo ` +
             `bote, la misma etiqueta y el mismo porte entre mas ` +
             `${capsulas ? 'capsulas' : 'kilos'}. Parte de la diferencia de precio por ` +
             `${unidad} es esto y no una rebaja: comparar el formato pequeno de una con el ` +
             `grande de la otra infla la brecha.`,
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
      titulo: 'Marcas distintas en el catalogo',
      a: `${dA.marcas} (${dA.pct} % ${dA.marca})`,
      b: `${dB.marcas} (${dB.pct} % ${dB.marca})`,
      texto: `${propia.l.nombre} vende sobre todo una marca, ${propia.d.marca}: ` +
             `${propia.d.pct} % de su catalogo en esta categoria. ${reventa.l.nombre} reparte el ` +
             `suyo entre ${reventa.d.marcas} marcas. Quien vende su propia marca se salta el ` +
             `margen del fabricante y puede bajar el precio sin tocar la formula; quien revende ` +
             `paga ese margen y lo repercute, y a cambio tiene marcas que la otra no vende.`,
    });
  }

  // 5. Aditivos. Lo barato suele llevar mas relleno y mas edulcorante; conviene decirlo con
  //    el porcentaje delante y sin llamarlo veneno, que es lo que hace todo el mundo.
  const conAd = (ps) => ps.filter((p) => p.aditivos?.length).length;
  const adA = pct(conAd(A), A.length);
  const adB = pct(conAd(B), B.length);
  if (A.length && B.length && Math.abs(adA - adB) >= 15) {
    const lista = [...new Set([...A, ...B].flatMap((p) => p.aditivos ?? []))]
      .map((a) => ADITIVOS[a] ?? a.replace(/_/g, ' '));
    f.push({
      id: 'aditivos',
      titulo: 'Productos con aditivos declarados',
      a: `${adA} %`,
      b: `${adB} %`,
      texto: `Lo que declaran las fichas de las dos: ${lista.join(', ')}. Un aditivo no es un ` +
             `fraude, pero ocupa gramos que no son activo y es mas barato que el activo: donde ` +
             `hay mas aditivo declarado, el precio por ${unidad} baja sin que el producto sea mejor.`,
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
      titulo: 'Con analisis publicado (nivel 3 o 4)',
      a: `${vA} de ${A.length}`,
      b: `${vB} de ${B.length}`,
      texto: `${mas.nombre} publica analisis en mas fichas. Analizar un lote en un laboratorio ` +
             `cuesta dinero y se repercute en el precio: parte de lo que se paga de mas es la ` +
             `comprobacion de que dentro hay lo que dice la etiqueta. Es el unico trozo del ` +
             `sobreprecio que se puede leer en un PDF.`,
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
    const enumera = (xs) => xs.map(([n, k]) => `${nombreIngrediente(n)} (${k})`).join(', ');
    f.push({
      id: 'forma',
      titulo: 'Forma quimica del activo',
      a: fA.map(([n, k]) => `${nombreIngrediente(n)} ${k}`).join(' · '),
      b: fB.map(([n, k]) => `${nombreIngrediente(n)} ${k}`).join(' · '),
      texto: `${ladoA.nombre}: ${enumera(fA)}. ${ladoB.nombre}: ${enumera(fB)}. La forma cambia ` +
             `el coste de fabricacion y la evidencia que hay detras, asi que dos botes del mismo ` +
             `ingrediente a distinto precio pueden no ser el mismo producto.`,
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
      titulo: 'Nota mediana en la tienda',
      a: `${coma(notaA)}/5`,
      b: `${coma(notaB)}/5`,
      texto: `Sobre ${opA.toLocaleString('es-ES')} opiniones en ${ladoA.nombre} y ` +
             `${opB.toLocaleString('es-ES')} en ${ladoB.nombre}. Son notas de la propia tienda, ` +
             `que es juez y parte: valen para detectar un producto que llega mal o que sabe a ` +
             `rayos, no para decidir que formula es mejor.`,
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
      ? `Las dos medianas se quedan en ${precio(refA)}, asi que el precio no desempata: lo que ` +
        `cambia entre ${ladoA.nombre} y ${ladoB.nombre} esta en las filas de abajo.`
      : `${cara.nombre} cuesta un ${d} % mas por ${unidad} que ${barata.nombre} ` +
        `(${precio(Math.max(refA, refB))} frente a ${precio(Math.min(refA, refB))}, medianas de ` +
        `los dos catalogos). ` +
        (causas.length
          ? `Esa diferencia no cae del cielo. Estos son los datos que la explican, con el ` +
            `numero de cada tienda al lado: ${causas.join(', ')}.`
          : `Con lo que declaran las dos fichas no hay diferencias de composicion ni de formato ` +
            `que lo expliquen: aqui la brecha es politica de precios de la tienda.`);

  return { intro, factores: f, unidad };
}
