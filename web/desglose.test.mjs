// El desglose se pinta en castellano: node --test
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { formateaDesglose } from './src/datos/seo.js';

test('coma decimal, simbolo de euro y mayuscula inicial', () => {
  assert.equal(
    formateaDesglose('2000 g dan 667 dosis efectivas de 3000 mg: 0.027 EUR por dosis'),
    '2000 g dan 667 dosis efectivas de 3000 mg: 0,027 € por dosis');
  assert.equal(
    formateaDesglose('17.93 EUR por kilo (el mas barato de la categoria son 17.93)'),
    '17,93 € por kilo (el mas barato de la categoria son 17,93 €)');
  // Sin numeros ni EUR: solo la mayuscula inicial.
  assert.equal(formateaDesglose('sin certificacion (nivel 1)'), 'Sin certificacion (nivel 1)');
  // Los porcentajes y las proporciones no son decimales: no se tocan.
  assert.equal(formateaDesglose('81% de activo, ratio 2:1'), '81% de activo, ratio 2:1');
});
