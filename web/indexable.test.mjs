// Que fichas se le ofrecen a Google:  node --test
//
// Esta regla no falla en voz alta. Si alguien la aprieta de mas, el build sigue verde,
// el sitemap sigue valido y lo unico que pasa es que dentro de tres meses no hay
// trafico. Ya paso una vez: el criterio de "top 10 por nota" saco del indice el 90 %
// de los clics de fichas que habia (ver con-impresiones.json). Por eso hay un test.
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { indexable, TOPE_INDEXADO } from './src/datos/seo.js';
import CON_IMPRESIONES from './src/datos/con-impresiones.json' with { type: 'json' };
import datos from './src/datos/dataset.json' with { type: 'json' };

const productos = datos.productos;
const porSlug = new Map(productos.map((p) => [p.slug, p]));

test('una ficha con impresiones medidas se indexa aunque no este en el top 10', () => {
  // Las que estan en la lista Y ademas puntuan alto no prueban nada: entrarian igual.
  // La prueba es una que la nota deja fuera.
  const fuera = CON_IMPRESIONES.slugs
    .map((s) => porSlug.get(s))
    .filter(Boolean)
    .filter((p) => {
      const cat = productos.filter((o) => o.categoria === p.categoria && o.marca !== 'Desconocida'
                                          && o.precio_referencia != null);
      cat.sort((a, b) => (b.score_final ?? -1) - (a.score_final ?? -1));
      return !cat.slice(0, TOPE_INDEXADO).some((o) => o.id === p.id);
    });
  assert.ok(fuera.length > 0, 'la lista medida ya no aporta nada: revisa que se genero bien');
  for (const p of fuera) {
    assert.equal(indexable(p, productos), true, `${p.slug} tenia impresiones y se ha caido del indice`);
  }
});

test('sin impresiones y sin nota, la ficha se queda fuera', () => {
  const medidas = new Set(CON_IMPRESIONES.slugs);
  const sobra = productos.filter((p) => !medidas.has(p.slug) && !indexable(p, productos));
  assert.ok(sobra.length > 1000, 'se estan indexando casi todas: el tope no esta haciendo nada');
});
