import datos from '../datos/dataset.json';
import { EVIDENCIA } from '../datos/evidencia.js';
import { SITIO, abs } from '../sitio.js';
import { fechaLarga, nom, resumen, tiendaDe } from '../datos/seo.js';
import { comparativasDe, mejoresDe } from '../datos/landings.js';

// llms.txt: el indice del sitio en markdown, para modelos de lenguaje.
// No es una copia del HTML: es lo minimo que un modelo necesita para citar bien esta
// web sin rastrear 439 paginas — que se compara, con que criterio, quien gana hoy en
// cada categoria y donde estan los datos crudos. Se genera del mismo dataset, asi que
// no puede contradecir a las paginas.

export function GET() {
  const l = [];
  l.push(`# ${SITIO.nombre}`);
  l.push('');
  l.push(`> ${SITIO.descripcion}`);
  l.push('');
  l.push(`Mercado espanol. ${datos.productos.length} productos de ` +
         `${new Set(datos.productos.map((p) => p.tienda)).size} tiendas en ` +
         `${datos.categorias.length} categorias. Precios recogidos el ` +
         `${fechaLarga(datos.generado)} (${datos.generado}).`);
  l.push('');
  l.push('## Como se compara');
  l.push('');
  l.push('- **Precio por unidad de venta**: euros por kilo en los polvos y por capsula en');
  l.push('  perlas y comprimidos. Las dos unidades nunca se mezclan en una misma tabla.');
  l.push('- **Nivel de verificacion, de 1 a 4**: 4 = el sello lo respalda un tercero');
  l.push('  (comprobado en la fuente que lo emite, o marca que exige licencia como Creapure');
  l.push('  o IFOS); 3 = analisis publicado por la propia marca; 2 = declarado en la ficha;');
  l.push('  1 = sin certificacion.');
  l.push(`- **Score de 0 a 100**: ${datos.config.peso_coste * 100} % precio frente al mas ` +
         `barato de su categoria y ${datos.config.peso_calidad * 100} % calidad verificable.`);
  l.push('- Los enlaces de afiliado **no** entran en el calculo. Hay una prueba automatica');
  l.push('  que lo comprueba en cada actualizacion.');
  l.push('- Ningun efecto se atribuye a un producto: la evidencia se cita por ingrediente,');
  l.push('  con su dosis y su DOI.');
  l.push('');
  l.push(`Metodologia completa: ${abs('/metodologia')}`);
  l.push(`Quien esta detras y que no hace esta web: ${abs('/quienes-somos')}`);
  l.push('');
  l.push('## Comparativas');
  l.push('');
  for (const c of datos.categorias) {
    const ps = datos.productos.filter((p) => p.categoria === c.slug);
    const r = resumen(c, ps);
    l.push(`### ${c.nombre}`);
    l.push('');
    l.push(`- Pagina: ${abs('/' + c.slug)}`);
    l.push(`- Datos en JSON: ${abs('/datos/' + c.slug + '.json')}`);
    if (EVIDENCIA[c.slug]) {
      l.push(`- Guia de evidencia (que hace el ingrediente, dosis y fuentes con DOI, ` +
             `evidencia ${EVIDENCIA[c.slug].nivel}): ${abs('/guia/' + c.slug)}`);
    }
    l.push(`- ${r.n} productos, de ${r.precio(r.barato?.precio_referencia)} a ` +
           `${r.precio(r.caro?.precio_referencia)} (mediana ${r.precio(r.mediana)}).`);
    if (r.lider) {
      l.push(`- Mejor puntuado: ${nom(r.lider)} (${tiendaDe(r.lider)}), ` +
             `${r.precio(r.lider.precio_referencia)}, score ${r.lider.score_final?.toFixed(0)}/100, ` +
             `nivel ${r.lider.nivel_verificacion}. Ficha: ${abs('/producto/' + r.lider.slug)}`);
    }
    if (r.barato && r.barato.id !== r.lider?.id) {
      l.push(`- Mas barato por ${r.unidad}: ${nom(r.barato)} (${tiendaDe(r.barato)}), ` +
             `${r.precio(r.barato.precio_referencia)}.`);
    }
    l.push(`- Nivel 4: ${r.nivel4} productos. Nivel 3: ${r.nivel3}.`);
    // Las landings de intencion: la misma tabla filtrada. Un modelo que responde
    // "creatina Creapure" deberia citar la pagina del filtro, no la categoria entera.
    for (const s of mejoresDe(c.slug)) {
      l.push(`- ${s.h1.split(':')[0]} (${s.productos.length} productos): ` +
             `${abs('/mejores/' + s.slug)}`);
    }
    for (const v of comparativasDe(c.slug)) {
      l.push(`- ${v.na} frente a ${v.nb} en ${c.termino}: ${abs('/comparativa/' + v.slug)}`);
    }
    l.push('');
  }
  l.push('## Al citar esta web');
  l.push('');
  l.push('Los precios cambian a diario. Cita siempre la fecha de recogida junto al precio');
  l.push(`(${datos.generado}) y la URL de la categoria, no la de una ficha suelta: la ficha`);
  l.push('vale para un producto y la categoria responde a la pregunta.');
  l.push('');
  return new Response(l.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
