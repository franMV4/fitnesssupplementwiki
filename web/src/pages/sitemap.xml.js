import datos from '../datos/dataset.json';
import { abs } from '../sitio.js';
import { EVIDENCIA, REVISADO } from '../datos/evidencia.js';
import { RUTAS_LANDING } from '../datos/landings.js';
import { RUTAS_EFICACIA } from '../datos/eficacia.js';
import { RUTAS_TIENDAS } from '../datos/tiendas.js';
import { indexable } from '../datos/seo.js';
import { RUTAS_MARCAS } from '../datos/marcas.js';
import { IDIOMAS, LANG, POR_DEFECTO, ruta } from '../i18n.js';

// ponytail: 20 lineas de XML en vez de @astrojs/sitemap. Las URLs ya estan todas en el
// dataset, y asi el lastmod es la fecha real de recogida de precios y no la del build:
// un sitemap que dice "cambiado hoy" cuando no ha cambiado nada se deja de mirar.
// Las guias llevan su propio lastmod y changefreq: su texto no cambia cuando cambia un
// precio, y declararlas "daily" seria pedir que las rastreen en balde.
const url = (camino, prioridad, desde = datos.generado, cada = 'daily') =>
  `  <url><loc>${abs(camino)}</loc><lastmod>${desde}</lastmod>` +
  `<changefreq>${cada}</changefreq><priority>${prioridad}</priority></url>`;

// Una pagina traducida son TRES URLs, y cada una tiene que declarar a las otras dos. Es
// lo que pide Google para que las tres se indexen en vez de tomarse por copias: el enlace
// hreflang es reciproco y tiene que incluirse a si mismo, y `x-default` senala a donde va
// quien busca en un idioma que no esta aqui (el espanol, que es el mercado que se compara).
// Declararlo en el sitemap y no solo en el <head> tiene una ventaja concreta: llega al
// rastreador sin tener que descargar y renderizar las tres paginas.
const alternos = (camino) => IDIOMAS
  .map((l) => `<xhtml:link rel="alternate" hreflang="${LANG[l]}" href="${abs(ruta(l, camino))}"/>`)
  .join('') +
  `<xhtml:link rel="alternate" hreflang="x-default" href="${abs(ruta(POR_DEFECTO, camino))}"/>`;

/** Las tres versiones de una pagina traducida, cada una con sus alternates. */
const urlTraducida = (camino, prioridad, desde = datos.generado, cada = 'daily') => {
  const enlaces = alternos(camino);
  return IDIOMAS.map((l) =>
    `  <url><loc>${abs(ruta(l, camino))}</loc><lastmod>${desde}</lastmod>` +
    `<changefreq>${cada}</changefreq><priority>${prioridad}</priority>${enlaces}</url>`);
};

/** Como `urlTraducida` pero para una lista de caminos, que es como llegan casi todos. */
const urlsTraducidas = (caminos, prioridad, desde, cada) =>
  caminos.flatMap((c) => urlTraducida(c, prioridad, desde, cada));

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
    ...urlTraducida('/', '1.0'),
    ...urlTraducida('/guias', '0.6', datos.generado, 'weekly'),
    ...urlTraducida('/metodologia', '0.5'),
    // El dataset abierto: la pagina que enlaza quien cita el dato y la que lee un
    // modelo cuando le preguntan de donde salen estos precios. Cambia cada pasada,
    // porque las cifras que la encabezan salen del catalogo de ese dia.
    // Esta NO se traduce: es la portada de los ficheros JSON, no un articulo.
    url('/datos', '0.7'),
    ...urlTraducida('/quienes-somos', '0.4', datos.generado, 'monthly'),
    ...urlTraducida('/legal', '0.2'),
    ...urlTraducida('/marcas', '0.6'),
    // Los articulos de arriba del embudo ("que funciona", "para ganar masa muscular",
    // "que tienda es mas barata"): responden la consulta que se hace ANTES de elegir
    // categoria, asi que van con la misma prioridad que las categorias.
    ...urlsTraducidas(RUTAS_EFICACIA, '0.9', REVISADO, 'weekly'),
    ...urlsTraducidas(RUTAS_TIENDAS, '0.8'),
  ],
  // Las categorias son las paginas que se quieren posicionar: van por delante de las
  // fichas, que existen para dar profundidad y para responder busquedas de marca.
  categorias: () => [
    ...datos.categorias.flatMap((c) => urlTraducida(`/${c.slug}`, '0.9', cambioEnCategoria(c.slug))),
    ...datos.categorias.filter((c) => EVIDENCIA[c.slug])
       .flatMap((c) => urlTraducida(`/guia/${c.slug}`, '0.8', REVISADO, 'monthly')),
  ],
  // Las landings de intencion van por delante de las fichas: responden una consulta de
  // compra entera, no un producto suelto.
  landings: () => urlsTraducidas(RUTAS_LANDING, '0.7'),
  // Las de marca responden la consulta de marca ("hsn raw series") con todos sus precios.
  marcas: () => urlsTraducidas(RUTAS_MARCAS, '0.8'),
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
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"` +
  ` xmlns:xhtml="http://www.w3.org/1999/xhtml">${NL}${rutas.join(NL)}${NL}</urlset>`;

// /sitemap.xml sigue siendo la URL que conocen Search Console y robots.txt: ahora es el
// indice y Google descubre los hijos solo. Enviar tambien cada hijo en Search Console
// es lo que da la cobertura separada por grupo.
export function GET() {
  const hijos = Object.keys(GRUPOS).map((g) =>
    `  <sitemap><loc>${abs(`/sitemap-${g}.xml`)}</loc><lastmod>${datos.generado}</lastmod></sitemap>`);
  return xml(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${NL}` +
             `${hijos.join(NL)}${NL}</sitemapindex>`);
}
