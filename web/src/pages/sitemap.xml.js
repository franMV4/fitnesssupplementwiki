import datos from '../datos/dataset.json';
import { abs } from '../sitio.js';
import { EVIDENCIA, REVISADO } from '../datos/evidencia.js';
import { RUTAS_LANDING } from '../datos/landings.js';
import { RUTAS_EFICACIA } from '../datos/eficacia.js';
import { RUTAS_TIENDAS } from '../datos/tiendas.js';
import { indexable } from '../datos/seo.js';

// ponytail: 20 lineas de XML en vez de @astrojs/sitemap. Las URLs ya estan todas en el
// dataset, y asi el lastmod es la fecha real de recogida de precios y no la del build:
// un sitemap que dice "cambiado hoy" cuando no ha cambiado nada se deja de mirar.
// Las guias llevan su propio lastmod y changefreq: su texto no cambia cuando cambia un
// precio, y declararlas "daily" seria pedir que las rastreen en balde.
const url = (ruta, prioridad, desde = datos.generado, cada = 'daily') =>
  `  <url><loc>${abs(ruta)}</loc><lastmod>${desde}</lastmod>` +
  `<changefreq>${cada}</changefreq><priority>${prioridad}</priority></url>`;

// Una categoria cambia cuando cambia alguno de sus productos: su tabla es el ranking de
// todos. Si ninguno tiene fecha propia, la de la pasada.
const cambioEnCategoria = (slug) => {
  let ultima = null;
  for (const p of datos.productos) {
    if (p.categoria !== slug) continue;
    if (p.cambiado && (!ultima || p.cambiado > ultima)) ultima = p.cambiado;
  }
  return ultima ?? datos.generado;
};

export function GET() {
  const rutas = [
    url('/', '1.0'),
    url('/guias', '0.6', datos.generado, 'weekly'),
    url('/metodologia', '0.5'),
    // El dataset abierto: la pagina que enlaza quien cita el dato y la que lee un
    // modelo cuando le preguntan de donde salen estos precios. Cambia cada pasada,
    // porque las cifras que la encabezan salen del catalogo de ese dia.
    url('/datos', '0.7'),
    url('/quienes-somos', '0.4', datos.generado, 'monthly'),
    url('/legal', '0.2'),
    // Las categorias son las paginas que se quieren posicionar: van por delante de las
    // 428 fichas, que existen para dar profundidad y para responder busquedas de marca.
    ...datos.categorias.map((c) => url(`/${c.slug}`, '0.9', cambioEnCategoria(c.slug))),
    ...datos.categorias.filter((c) => EVIDENCIA[c.slug])
       .map((c) => url(`/guia/${c.slug}`, '0.8', REVISADO, 'monthly')),
    // Las landings de intencion van por delante de las fichas: responden una consulta de
    // compra entera, no un producto suelto.
    // Los articulos de arriba del embudo ("que funciona", "para ganar masa muscular",
    // "que tienda es mas barata"): responden la consulta que se hace ANTES de elegir
    // categoria, asi que van con la misma prioridad que las categorias.
    ...RUTAS_EFICACIA.map((r) => url(r, '0.9', REVISADO, 'weekly')),
    ...RUTAS_TIENDAS.map((r) => url(r, '0.8')),
    ...RUTAS_LANDING.map((r) => url(r, '0.7')),
    // El lastmod de cada ficha es el dia que cambio SU precio, no el de la pasada.
    // Decir que 4.293 URLs cambiaron hoy, todos los dias, es lo que hace que Google
    // deje de mirar el sitemap: de verdad cambia el 6-11 % en cada pasada.
    ...datos.productos.filter((p) => indexable(p, datos.productos))
       .map((p) => url(`/producto/${p.slug}`, '0.6', p.cambiado ?? datos.generado)),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rutas.join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
