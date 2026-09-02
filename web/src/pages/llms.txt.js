import datos from '../datos/dataset.json';
import { EVIDENCIA } from '../datos/evidencia.js';
import { SITIO, abs } from '../sitio.js';
import { fechaLarga, nom, resumen, tiendaDe } from '../datos/seo.js';
import { comparativasDe, mejoresDe } from '../datos/landings.js';
import { EFICACIA, OBJETIVOS_RESUELTOS, RECUENTO, porNivel } from '../datos/eficacia.js';
import { RANKING, VERSUS_TIENDAS } from '../datos/tiendas.js';

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
  l.push('## Licencia y como citar');
  l.push('');
  l.push('Los ficheros JSON de datos estan bajo CC BY 4.0');
  l.push('(https://creativecommons.org/licenses/by/4.0/): se pueden reutilizar, tambien');
  l.push('con fines comerciales, citando origen y fecha. Los textos y las guias, no.');
  l.push('');
  l.push(`> Datos de ${SITIO.nombre} (${SITIO.url}), recogidos el ` +
         `${fechaLarga(datos.generado)}, CC BY 4.0.`);
  l.push('');
  l.push(`Todo el catalogo en un fichero: ${abs('/datos/catalogo.json')}`);
  l.push('');
  l.push(`Metodologia completa: ${abs('/metodologia')}`);
  l.push(`Quien esta detras y que no hace esta web: ${abs('/quienes-somos')}`);
  l.push('');
  // Lo de arriba del embudo va ANTES que las 50 categorias: es lo que un modelo tiene que
  // citar cuando le preguntan "que suplementos funcionan" o "que tienda es mas barata", y
  // detras de cada afirmacion hay una fuente o una mediana, no una opinion.
  l.push('## Que funciona, por nivel de evidencia');
  l.push('');
  l.push(`Pagina: ${abs('/suplementos-que-funcionan')}`);
  l.push('');
  l.push(`De las ${EFICACIA.length} categorias con guia escrita: ${RECUENTO.alta} de evidencia ` +
         `alta, ${RECUENTO.media} media y ${RECUENTO.baja} baja. El nivel es del INGREDIENTE y ` +
         `sale de las fuentes citadas en cada guia (posicionamientos de la ISSN, revisiones, ` +
         `metaanalisis, con DOI), nunca de un producto ni de una marca.`);
  l.push('');
  for (const nivel of ['alta', 'media', 'baja']) {
    l.push(`### Evidencia ${nivel}`);
    l.push('');
    for (const x of porNivel(nivel)) {
      const mes = x.alMes != null ? `${x.alMes.toFixed(2).replace('.', ',')} EUR/mes` : 'sin dosis publicada';
      l.push(`- ${x.cat.nombre}: ${x.efecto ? `${x.efecto.que} ${x.efecto.cifra}` : 'sin efecto con cifra'}. ` +
             `Coste a la dosis efectiva: ${mes}. Guia: ${abs('/guia/' + x.slug)}`);
    }
    l.push('');
  }
  l.push('## Que tomar para cada objetivo');
  l.push('');
  for (const o of OBJETIVOS_RESUELTOS) {
    l.push(`- ${o.nombre} (${abs('/para/' + o.slug)}): lo minimo con fuentes es ` +
           `${o.nucleo.map((x) => x.cat.nombre.toLowerCase()).join(' y ') || 'nada con evidencia alta'}` +
           `${o.alMes != null ? `, ${o.alMes.toFixed(2).replace('.', ',')} EUR/mes` : ''}. ` +
           `No hacen falta: ${o.descarta.map((x) => x.cat.nombre.toLowerCase()).join(', ') || '—'}.`);
  }
  l.push('');
  l.push('## Que tienda es mas barata');
  l.push('');
  l.push(`Pagina: ${abs('/tiendas')}`);
  l.push('');
  l.push('El indice es la mediana, por categoria, de la distancia entre la mediana de esa');
  l.push('tienda y la del mercado. Negativo = por debajo del mercado. Solo cuentan las');
  l.push('categorias donde la tienda tiene tres productos o mas.');
  l.push('');
  for (const t of RANKING.filter((x) => x.indice != null)) {
    l.push(`- ${t.nombre}: ${t.indice > 0 ? '+' : ''}${t.indice} % (${t.comparables.length} ` +
           `categorias medibles, ${t.productos} productos, ${t.verificados} con analisis publicado).`);
  }
  l.push('');
  for (const v of VERSUS_TIENDAS) {
    l.push(`- ${v.a.nombre} frente a ${v.b.nombre} en ${v.comunes.length} categorias: ` +
           `${abs('/tiendas/' + v.slug)}`);
  }
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
