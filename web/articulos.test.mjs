// Pruebas de lo que afirman los articulos nuevos:  node --test articulos.test.mjs
//
// Estas dos funciones escriben frases con numeros dentro ("X cuesta un 30 % mas que Y",
// "8 de 10 llegan a la dosis") y las publican en cientos de paginas. Un signo al reves o
// un null contado como cero no da error: da una frase perfectamente redactada que dice lo
// contrario de lo que pasa. Eso es lo que cubren estos asserts, y no el HTML.
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { ingredientesCaraACara, porQuePrecio, sobrecoste } from './src/datos/porque.js';
import { RANKING } from './src/datos/tiendas.js';
import { EFICACIA, OBJETIVOS_RESUELTOS } from './src/datos/eficacia.js';
import { productoLd } from './src/datos/seo.js';

const CAT = { unidad_precio: 'kg', termino: 'creatina' };
const P = (over) => ({
  marca: 'Marca', tienda: 'x', precio_referencia: 20, coste_por_dosis_efectiva: 0.1,
  formato_gramos: 1000, aditivos: [], certificaciones: [], nivel_verificacion: 1,
  valoracion: 4.5, n_valoraciones: 10, ingredientes: [], ...over,
});
const lado = (nombre, productos) => ({ nombre, productos });

test('el porcentaje dice cuanto mas cara es la cara, no al reves', () => {
  const barata = lado('Barata', [P({ precio_referencia: 10 })]);
  const cara = lado('Cara', [P({ precio_referencia: 20 })]);
  const { intro } = porQuePrecio(CAT, barata, cara);
  // 10 -> 20 es un 100 % mas cara, y la frase tiene que nombrar a la cara como la cara.
  assert.match(intro, /Cara cuesta un 100 % mas por kg que Barata/);
  assert.equal(sobrecoste(10, 20), 100);
});

test('gana por kilo y pierde por dosis: la pagina lo dice en vez de taparlo', () => {
  const a = lado('A', [P({ precio_referencia: 10, coste_por_dosis_efectiva: 0.5 })]);
  const b = lado('B', [P({ precio_referencia: 20, coste_por_dosis_efectiva: 0.2 })]);
  const dosis = porQuePrecio(CAT, a, b).factores.find((f) => f.id === 'dosis');
  assert.match(dosis.texto, /se da la vuelta/);
});

test('una pureza imposible no se publica como composicion', () => {
  // Un aislado leido como 21 % (error del scraper) frente a tres fichas al 90 %.
  const ref = { referencia: { pureza_tipica: 0.8 }, ingrediente: 'proteina', dosis_por_servicio_mg: 25000 };
  const sano = (p) => P({ pureza_real: p, ingredientes: [ref] });
  const a = lado('A', [sano(0.9), sano(0.9), sano(0.9)]);
  const b = lado('B', [sano(0.21), sano(0.21), sano(0.21)]);
  assert.equal(porQuePrecio(CAT, a, b).factores.some((f) => f.id === 'pureza'), false);
});

test('sin dosis publicada no es lo mismo que no llegar a la dosis', () => {
  const conDosis = P({ ingredientes: [{ ingrediente: 'creatina', dosis_por_servicio_mg: 5000,
                                        referencia: { dosis_efectiva_min_mg: 3000 } }] });
  const sinDosis = P({ ingredientes: [{ ingrediente: 'creatina', dosis_por_servicio_mg: null,
                                        referencia: { dosis_efectiva_min_mg: 3000 } }] });
  const [fila] = ingredientesCaraACara(lado('A', [conDosis]), lado('B', [sinDosis]));
  assert.equal(fila.a.cumplen, 1);
  assert.equal(fila.b.cumplen, null);   // null, NO 0: la tienda no publica el dato
  assert.equal(fila.b.llevan, 1);
});

test('el indice de tienda va de barata a cara y sin tiendas de prueba', () => {
  const conIndice = RANKING.filter((t) => t.indice != null);
  assert.ok(conIndice.length >= 5);
  for (let i = 1; i < conIndice.length; i++) {
    assert.ok(conIndice[i - 1].indice <= conIndice[i].indice);
  }
  assert.ok(RANKING.every((t) => t.productos >= 5));
});

test('el basico de un objetivo no suma tres proteinas distintas', () => {
  for (const o of OBJETIVOS_RESUELTOS) {
    const proteinas = o.nucleo.filter((x) => x.slug.startsWith('proteina') || x.slug === 'caseina');
    assert.ok(proteinas.length <= 1, `${o.slug} lleva ${proteinas.length} proteinas en el basico`);
    // Y lo que se suma en euros es solo lo que tiene precio, no lo que falta.
    assert.equal(o.conPrecio.every((x) => x.alMes != null), true);
  }
});

test('la lista de eficacia va por nivel de evidencia', () => {
  const peso = { alta: 0, media: 1, baja: 2 };
  for (let i = 1; i < EFICACIA.length; i++) {
    assert.ok(peso[EFICACIA[i - 1].nivel] <= peso[EFICACIA[i].nivel]);
  }
});

// --- Marcado de producto -------------------------------------------------------
// Google exige `image` en toda ficha de comerciante (Product + offers con precio).
// Un producto sin foto con oferta declarada no puede salir en Google Y ademas mete
// un error en Search Console. La regla es: sin imagen, sin offers.
test('un producto sin foto no declara oferta en el JSON-LD', () => {
  const base = { slug: 's', id: 7, marca: 'Marca', nombre: 'Bote', tienda: 'hsn',
                 precio_eur: 20, url: 'https://tienda.example/bote',
                 fecha_scrape: '2026-09-04' };
  const con = productoLd({ ...base, imagen: 'https://cdn.example/bote.jpg' });
  assert.equal(con.image, 'https://cdn.example/bote.jpg');
  assert.equal(con.offers.price, 20);

  const sin = productoLd(base);
  assert.equal(sin.image, undefined);
  assert.equal(sin.offers, undefined, 'sin foto no puede haber oferta: falta image');
  assert.equal(sin.name.length > 0, true, 'el producto se sigue publicando entero');
});
