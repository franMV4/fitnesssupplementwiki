// Pruebas del filtrado y el orden de la tabla de categoria:  node --test
//
// Sin navegador, sin jsdom y sin framework de UI: la logica que puede mentir esta en
// datos/util.js y es JavaScript puro. Un filtro roto no da error, da una tabla que
// parece correcta con los productos equivocados dentro; eso es lo que cubren estos
// asserts. Lo que se ve (que la fila se pinte) no se prueba aqui: eso ya lo comprueba
// el build y no falla en silencio.
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { filtrar, paraTabla } from './src/datos/util.js';

const P = (over) => ({
  id: 1, slug: 's', marca: 'Marca', nombre: 'Creatina', tienda: 'hsn',
  precio_eur: 20, precio_referencia: 20, unidad_precio: 'kg', score_final: 50,
  nivel_verificacion: 1, certificaciones: [], ...over,
});

test('el tope de precio mira la unidad de venta, no el envase', () => {
  const barato_por_kg = P({ id: 1, precio_eur: 40, precio_referencia: 20 });   // bote de 2 kg
  const caro_por_kg = P({ id: 2, precio_eur: 15, precio_referencia: 60 });     // bote de 250 g
  const visibles = filtrar([barato_por_kg, caro_por_kg], { precioMax: '30' });
  assert.deepEqual(visibles.map((p) => p.id), [1]);
});

test('el nivel minimo es un suelo, no una igualdad', () => {
  const productos = [P({ id: 1, nivel_verificacion: 1 }), P({ id: 2, nivel_verificacion: 3 }),
                     P({ id: 3, nivel_verificacion: 4 })];
  assert.deepEqual(filtrar(productos, { nivelMin: 3 }).map((p) => p.id), [2, 3]);
  assert.equal(filtrar(productos, { nivelMin: 1 }).length, 3);
});

test('la busqueda mira marca y nombre juntos, sin mayusculas', () => {
  const productos = [P({ id: 1, marca: 'Optimum Nutrition', nombre: 'Gold Standard' }),
                     P({ id: 2, marca: 'HSN', nombre: 'Evocreatine' })];
  assert.deepEqual(filtrar(productos, { busqueda: 'optimum gold' }).map((p) => p.id), []);
  assert.deepEqual(filtrar(productos, { busqueda: 'OPTIMUM' }).map((p) => p.id), [1]);
  assert.deepEqual(filtrar(productos, { busqueda: 'evocrea' }).map((p) => p.id), [2]);
});

test('el filtro de sello mira el tipo de certificacion, no el nivel', () => {
  const conCreapure = P({ id: 1, certificaciones: [{ tipo: 'creapure' }] });
  const conIfos = P({ id: 2, certificaciones: [{ tipo: 'ifos' }] });
  assert.deepEqual(filtrar([conCreapure, conIfos], { sello: 'creapure' }).map((p) => p.id), [1]);
});

test('los tres ordenes ordenan por lo que dicen', () => {
  const productos = [
    P({ id: 1, score_final: 10, precio_referencia: 5, precio_eur: 90 }),
    P({ id: 2, score_final: 90, precio_referencia: 50, precio_eur: 10 }),
  ];
  assert.deepEqual(filtrar(productos, { orden: 'score' }).map((p) => p.id), [2, 1]);
  assert.deepEqual(filtrar(productos, { orden: 'kg' }).map((p) => p.id), [1, 2]);
  assert.deepEqual(filtrar(productos, { orden: 'precio' }).map((p) => p.id), [2, 1]);
});

test('un producto sin precio de referencia no se cuela por delante ni por el tope', () => {
  const sinPrecio = P({ id: 9, precio_referencia: null });
  const conPrecio = P({ id: 1, precio_referencia: 30 });
  assert.deepEqual(filtrar([sinPrecio, conPrecio], { orden: 'kg' }).map((p) => p.id), [1, 9]);
  assert.deepEqual(filtrar([sinPrecio, conPrecio], { precioMax: '99' }).map((p) => p.id), [1]);
});

test('paraTabla deja fuera lo que la tabla no pinta', () => {
  const gordo = P({ desglose: ['una linea larguisima'], ingredientes: [{ referencia: {} }],
                    historico: { serie: [] }, coste_por_dosis_efectiva: 0.1 });
  const fino = paraTabla(gordo);
  for (const campo of ['desglose', 'ingredientes', 'historico', 'coste_por_dosis_efectiva']) {
    assert.equal(campo in fino, false, campo + ' viaja a la isla sin que nadie lo mire');
  }
  // Y lo que si pinta sigue estando, con el mismo nombre.
  for (const campo of ['slug', 'marca', 'nombre', 'tienda', 'precio_eur', 'precio_referencia',
                       'score_final', 'nivel_verificacion', 'categoria']) {
    assert.equal(campo in fino, true, 'falta ' + campo);
  }
  // El filtrado tiene que seguir funcionando con el producto ya adelgazado.
  assert.equal(filtrar([fino], { nivelMin: 1 }).length, 1);
});
