import datos from '../datos/dataset.json';
import { abs } from '../sitio.js';
import { EVIDENCIA, REVISADO } from '../datos/evidencia.js';
import { RUTAS_LANDING } from '../datos/landings.js';

// ponytail: 20 lineas de XML en vez de @astrojs/sitemap. Las URLs ya estan todas en el
// dataset, y asi el lastmod es la fecha real de recogida de precios y no la del build:
// un sitemap que dice "cambiado hoy" cuando no ha cambiado nada se deja de mirar.
// Las guias llevan su propio lastmod y changefreq: su texto no cambia cuando cambia un
// precio, y declararlas "daily" seria pedir que las rastreen en balde.
const url = (ruta, prioridad, desde = datos.generado, cada = 'daily') =>
  `  <url><loc>${abs(ruta)}</loc><lastmod>${desde}</lastmod>` +
  `<changefreq>${cada}</changefreq><priority>${prioridad}</priority></url>`;

export function GET() {
  const rutas = [
    url('/', '1.0'),
    url('/guias', '0.6', datos.generado, 'weekly'),
    url('/metodologia', '0.5'),
    url('/quienes-somos', '0.4', datos.generado, 'monthly'),
    url('/legal', '0.2'),
    // Las categorias son las paginas que se quieren posicionar: van por delante de las
    // 428 fichas, que existen para dar profundidad y para responder busquedas de marca.
    ...datos.categorias.map((c) => url(`/${c.slug}`, '0.9')),
    ...datos.categorias.filter((c) => EVIDENCIA[c.slug])
       .map((c) => url(`/guia/${c.slug}`, '0.8', REVISADO, 'monthly')),
    // Las landings de intencion van por delante de las fichas: responden una consulta de
    // compra entera, no un producto suelto.
    ...RUTAS_LANDING.map((r) => url(r, '0.7')),
    ...datos.productos.map((p) => url(`/producto/${p.slug}`, '0.6')),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rutas.join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
