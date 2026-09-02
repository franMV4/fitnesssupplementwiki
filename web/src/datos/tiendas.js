// Las tiendas, medidas entre ellas: quien es cara y quien es barata en todo el catalogo.
//
// Las comparativas de tienda que ya habia son por categoria ("HSN o Zumub en proteina
// vegana"), y esa es la comparacion util para comprar. Pero la consulta mas buscada de
// todas es la de antes: "que tienda de suplementos es mas barata". No se puede contestar
// sumando precios, porque un catalogo son kilos de proteina y capsulas de omega 3 y no se
// suman; y la mediana global tampoco vale, porque una tienda que solo vende creatina
// parece barata al lado de una que vende de todo.
//
// Lo que si se puede comparar entre unidades distintas es la POSICION: en cada categoria,
// cuanto se separa la mediana de esa tienda de la mediana del mercado, en porcentaje. Eso
// es un numero sin unidad, y la mediana de esos porcentajes es el indice de precio de la
// tienda. -12 significa que en una categoria tipica esta un 12 % por debajo del mercado.
//
// ponytail: ni un campo nuevo. El indice es una mediana de medianas del dataset que ya
// esta; si manana entra una tienda nueva, aparece sola con su indice y sus paginas.

import datos from './dataset.json' with { type: 'json' };
import { TIENDAS } from './util.js';
import { mediana } from './porque.js';

// Cuantos productos tiene que tener una tienda en una categoria para que su mediana en
// esa categoria signifique algo, y cuantas categorias asi para tener indice global. Con
// menos, el numero existe pero es un producto suelto disfrazado de estadistica.
const MIN_EN_CATEGORIA = 3;
const MIN_CATEGORIAS = 3;
// Y cuantos productos en total para salir en el ranking publico. Por debajo de esto no
// hay tienda que juzgar (y ademas es donde cae la tienda de prueba del scraper).
const MIN_PRODUCTOS = 5;

const nombreDe = (t) => TIENDAS[t] ?? t;

/** La mediana del mercado en cada categoria: el punto cero contra el que se mide todo. */
const MERCADO = Object.fromEntries(datos.categorias.map((c) => [
  c.slug,
  mediana(datos.productos.filter((p) => p.categoria === c.slug).map((p) => p.precio_referencia)),
]));

function deTienda(t) {
  const ps = datos.productos.filter((p) => p.tienda === t);
  const categorias = datos.categorias
    .map((c) => {
      const sel = ps.filter((p) => p.categoria === c.slug);
      const med = mediana(sel.map((p) => p.precio_referencia));
      const mercado = MERCADO[c.slug];
      return {
        cat: c,
        n: sel.length,
        mediana: med,
        mercado,
        // El signo importa y no se redondea a cero: -1 % es "clavada al mercado", no
        // "barata". La frase que lo lee decide a partir de cuanto es diferencia de verdad.
        dif: sel.length >= MIN_EN_CATEGORIA && med != null && mercado
          ? Math.round(((med / mercado) - 1) * 100) : null,
      };
    })
    .filter((x) => x.n > 0);

  const conDif = categorias.filter((x) => x.dif != null);
  const conAditivos = ps.filter((p) => p.aditivos?.length).length;
  const marcas = new Set(ps.map((p) => p.marca));
  return {
    tienda: t,
    nombre: nombreDe(t),
    productos: ps.length,
    categorias,
    // Solo las que cuentan para el indice, que son las que la pagina puede ensenar.
    comparables: conDif,
    indice: conDif.length >= MIN_CATEGORIAS ? mediana(conDif.map((x) => x.dif)) : null,
    baratas: conDif.filter((x) => x.dif <= -10).length,
    caras: conDif.filter((x) => x.dif >= 10).length,
    nivel4: ps.filter((p) => p.nivel_verificacion === 4).length,
    nivel3: ps.filter((p) => p.nivel_verificacion === 3).length,
    verificados: ps.filter((p) => p.nivel_verificacion >= 3).length,
    aditivos: ps.length ? Math.round((100 * conAditivos) / ps.length) : null,
    marcas: marcas.size,
    nota: mediana(ps.map((p) => p.valoracion)),
    opiniones: ps.reduce((n, p) => n + (p.n_valoraciones ?? 0), 0),
  };
}

/** Todas las tiendas del dataset, de la mas barata a la mas cara. Sin indice, al final. */
export const RANKING = [...new Set(datos.productos.map((p) => p.tienda))]
  .map(deTienda)
  .filter((t) => t.productos >= MIN_PRODUCTOS)
  .sort((a, b) => {
    if (a.indice == null && b.indice == null) return b.productos - a.productos;
    if (a.indice == null) return 1;
    if (b.indice == null) return -1;
    return a.indice - b.indice;
  });

export const laTienda = (t) => RANKING.find((x) => x.tienda === t) ?? null;

/* --- Los cara a cara globales ----------------------------------------------------
   "HSN o Prozis" a secas, sin categoria: la comparacion que se busca antes de elegir
   donde comprar. Solo entre tiendas que compartan suficientes categorias, porque si no
   no hay nada que comparar: son dos catalogos distintos, no dos precios. */
const MIN_COMUNES = 4;

export const VERSUS_TIENDAS = (() => {
  const aptas = RANKING.filter((t) => t.indice != null);
  const pares = [];
  for (let i = 0; i < aptas.length; i++) {
    for (let j = i + 1; j < aptas.length; j++) {
      // El orden lo manda el slug (alfabetico) y no el ranking: si la URL dice
      // "hsn-vs-zumub", el titulo tiene que decir HSN y luego Zumub, o la pagina parece
      // otra. Es el mismo criterio que las comparativas por categoria.
      const [a, b] = aptas[i].tienda < aptas[j].tienda
        ? [aptas[i], aptas[j]] : [aptas[j], aptas[i]];
      const comunes = a.comparables
        .map((x) => ({
          cat: x.cat,
          a: x,
          b: b.comparables.find((y) => y.cat.slug === x.cat.slug),
        }))
        .filter((x) => x.b);
      if (comunes.length < MIN_COMUNES) continue;
      // Quien gana cada categoria: la mediana mas baja de las dos, en su propia unidad.
      const ganaA = comunes.filter((x) => x.a.mediana < x.b.mediana).length;
      const ganaB = comunes.filter((x) => x.b.mediana < x.a.mediana).length;
      pares.push({
        slug: `${a.tienda}-vs-${b.tienda}`,
        a, b, comunes, ganaA, ganaB,
        h1: `${a.nombre} o ${b.nombre}: cual es mas barata en ${comunes.length} categorias`,
        titulo: `${a.nombre} vs ${b.nombre}: que tienda de suplementos sale mas barata`,
      });
    }
  }
  return pares;
})();

export const versusDe = (t) => VERSUS_TIENDAS.filter((v) => v.a.tienda === t || v.b.tienda === t);

export const RUTAS_TIENDAS = [
  '/tiendas',
  ...VERSUS_TIENDAS.map((v) => `/tiendas/${v.slug}`),
];
