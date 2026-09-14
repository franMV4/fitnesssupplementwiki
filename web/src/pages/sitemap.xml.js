import datos from '../datos/dataset.json';
import { abs } from '../sitio.js';
import { EVIDENCIA, REVISADO } from '../datos/evidencia.js';
import { RUTAS_LANDING } from '../datos/landings.js';
import { RUTAS_EFICACIA } from '../datos/eficacia.js';
import { RUTAS_TIENDAS } from '../datos/tiendas.js';
import { indexable } from '../datos/seo.js';
import { RUTAS_MARCAS } from '../datos/marcas.js';

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

// Un sitemap por tipo de pagina en vez de uno con todo. Search Console da la cobertura
// POR SITEMAP ("enviadas" frente a "indexadas"): con uno solo, 50 categorias sin indexar
// quedaban escondidas debajo de 900 fichas. Asi se ve en que grupo falla la indexacion.
export const GRUPOS = {
  paginas: () => [
    url('/', '1.0'),
    url('/guias', '0.6', datos.generado, 'weekly'),
    url('/metodologia', '0.5'),
    // El dataset abierto: la pagina que enlaza quien cita el dato y la que lee un
    // modelo cuando le preguntan de donde salen estos precios. Cambia cada pasada,
    // porque las cifras que la encabezan salen del catalogo de ese dia.
    url('/datos', '0.7'),
    url('/quienes-somos', '0.4', datos.generado, 'monthly'),
    url('/legal', '0.2'),
    url('/marcas', '0.6'),
    // Los articulos de arriba del embudo ("que funciona", "para ganar masa muscular",
    // "que tienda es mas barata"): responden la consulta que se hace ANTES de elegir
    // categoria, asi que van con la misma prioridad que las categorias.
    ...RUTAS_EFICACIA.map((r) => url(r, '0.9', REVISADO, 'weekly')),
    ...RUTAS_TIENDAS.map((r) => url(r, '0.8')),
  ],
  // Las categorias son las paginas que se quieren posicionar: van por delante de las
  // fichas, que existen para dar profundidad y para responder busquedas de marca.
  categorias: () => [
    ...datos.categorias.map((c) => url(`/${c.slug}`, '0.9', cambioEnCategoria(c.slug))),
    ...datos.categorias.filter((c) => EVIDENCIA[c.slug])
       .map((c) => url(`/guia/${c.slug}`, '0.8', REVISADO, 'monthly')),
  ],
  // Las landings de intencion van por delante de las fichas: responden una consulta de
  // compra entera, no un producto suelto.
  landings: () => RUTAS_LANDING.map((r) => url(r, '0.7')),
  // Las de marca responden la consulta de marca ("hsn raw series") con todos sus precios.
  marcas: () => RUTAS_MARCAS.map((r) => url(r, '0.8')),
  // El lastmod de cada ficha es el dia que cambio SU precio, no el de la pasada.
  // Decir que 4.293 URLs cambiaron hoy, todos los dias, es lo que hace que Google
  // deje de mirar el sitemap: de verdad cambia el 6-11 % en cada pasada.
  productos: () => datos.productos.filter((p) => indexable(p, datos.productos))
    .map((p) => url(`/producto/${p.slug}`, '0.6', p.cambiado ?? datos.generado)),
};

const NL = String.fromCharCode(10);

export const xml = (cuerpo) => new Response(
  `<?xml version="1.0" encoding="UTF-8"?>${NL}${cuerpo}${NL}`,
  { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });

export const urlset = (rutas) =>
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${NL}${rutas.join(NL)}${NL}</urlset>`;

// /sitemap.xml sigue siendo la URL que conocen Search Console y robots.txt: ahora es el
// indice y Google descubre los hijos solo. Enviar tambien cada hijo en Search Console
// es lo que da la cobertura separada por grupo.
export function GET() {
  const hijos = Object.keys(GRUPOS).map((g) =>
    `  <sitemap><loc>${abs(`/sitemap-${g}.xml`)}</loc><lastmod>${datos.generado}</lastmod></sitemap>`);
  return xml(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${NL}` +
             `${hijos.join(NL)}${NL}</sitemapindex>`);
}
