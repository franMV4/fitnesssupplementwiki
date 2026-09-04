// Pruebas de mi lista y de las cuentas con dosis:  node --test
//
// Lo que se prueba aqui es lo unico que puede mentir sin dar error: una cuenta de gasto
// mensual que devuelve un numero equivocado sale en pantalla igual de bonita que la
// correcta, y una lista que se guarda mal no se nota hasta la visita siguiente.
//
// El almacenamiento del navegador se sustituye por un objeto de cuatro lineas: no hace
// falta un navegador para comprobar que una entrada sin slug no entra en la lista.
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

const almacen = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => almacen.set(k, String(v)),
};

const { CLAVE_LISTA, aEnlace, alternarEnLista, apuntarVisto, conDosis, costeMes, deEnlace,
        duracionDias, enLista, guardarLista, leerMiLista,
        TOPE_VISTOS } = await import('./src/datos/util.js');

// 30 servicios en el envase, 15 EUR: medio euro el servicio.
const bote = { servicios_por_envase: 30, precio_eur: 15 };

test('la dosis manda en lo que dura el envase y en lo que cuesta el mes', () => {
  assert.equal(duracionDias(bote), 30);
  assert.equal(costeMes(bote), 15);
  // El doble de dosis: la mitad de dias y el doble de gasto.
  assert.equal(duracionDias(bote, 2), 15);
  assert.equal(costeMes(bote, 2), 30);
  assert.equal(duracionDias(bote, 0.5), 60);
});

test('sin servicios declarados no se inventa un numero', () => {
  const sinDatos = { servicios_por_envase: null, precio_eur: 15 };
  assert.equal(duracionDias(sinDatos), null);
  assert.equal(costeMes(sinDatos), null);
  // Y una dosis de cero tampoco puede dar "dura infinitos dias".
  assert.equal(duracionDias(bote, 0), null);
  assert.equal(costeMes(bote, 0), null);
});

test('guardar en mi lista es un interruptor, no un anadir', () => {
  const item = { s: 'creatina-hsn', c: 'creatina', d: 1 };
  const con = alternarEnLista([], item);
  assert.equal(enLista(con, 'creatina-hsn'), true);
  assert.deepEqual(alternarEnLista(con, item), []);
});

test('cambiar la dosis no toca al resto de la lista', () => {
  const lista = [{ s: 'a', c: 'c1', d: 1 }, { s: 'b', c: 'c2', d: 1 }];
  assert.deepEqual(conDosis(lista, 'b', 2),
    [{ s: 'a', c: 'c1', d: 1 }, { s: 'b', c: 'c2', d: 2 }]);
});

test('lo guardado por una version anterior no rompe la lista', () => {
  guardarLista(CLAVE_LISTA, [{ s: 'a', c: 'c1' }, null, { c: 'sin-slug' }]);
  assert.deepEqual(leerMiLista().map((e) => e.s), ['a']);
  almacen.set(CLAVE_LISTA, 'esto no es json');
  assert.deepEqual(leerMiLista(), []);
});

test('los vistos van del ultimo al primero, sin repetidos y con tope', () => {
  almacen.clear();
  for (let i = 0; i < TOPE_VISTOS + 3; i++) apuntarVisto({ s: `p${i}`, n: `Producto ${i}` });
  const vistos = apuntarVisto({ s: 'p0', n: 'Producto 0' });
  assert.equal(vistos[0].s, 'p0');
  assert.equal(vistos.length, TOPE_VISTOS);
  assert.equal(new Set(vistos.map((v) => v.s)).size, vistos.length);
});

test('la lista viaja entera en el enlace y vuelve igual', () => {
  const lista = [{ s: 'creatina-hsn', c: 'creatina', d: 2 }, { s: 'omega-3-x', c: 'omega-3', d: 1 }];
  assert.equal(aEnlace(lista), 'creatina-hsn~creatina~2,omega-3-x~omega-3~1');
  assert.deepEqual(deEnlace(aEnlace(lista)), lista);
});

test('un enlace escrito a mano no puede meter basura en la lista', () => {
  // Lo que llega por la barra de direcciones lo escribe cualquiera.
  assert.deepEqual(deEnlace('sin-categoria'), []);
  assert.deepEqual(deEnlace(''), []);
  assert.deepEqual(deEnlace(null), []);
  // Una dosis absurda no puede acabar dividiendo por cero en la tabla del gasto.
  assert.deepEqual(deEnlace('a~b~0'), [{ s: 'a', c: 'b', d: 1 }]);
  assert.deepEqual(deEnlace('a~b~hola'), [{ s: 'a', c: 'b', d: 1 }]);
});
