// Paginas de marca: /marca/<slug>.
//
// Search Console (09/2026) dice que lo que ya trae impresiones son consultas de marca y
// linea de producto ("hsn raw series", "myprotein impact whey isolate"). Quien busca asi
// ya ha elegido marca y viene a por el precio: la pagina le da todos los productos de esa
// marca, categoria a categoria, ordenados por precio por unidad y en cualquier tienda.
// "HSN Raw Series" ya es una marca en el dataset, asi que la consulta cae en su pagina
// sin escribir nada a mano.
//
// Igual que las landings, sale entera del dataset: una marca que deja de venderse
// desaparece sola en la siguiente pasada.

import datos from './dataset.json' with { type: 'json' };
import { porScore } from './seo.js';

// Por debajo de 6 productos la pagina es la ficha repetida. De 6 a 9 se publica y se
// enlaza (sirve a quien ya esta en la ficha) pero con noindex, por la misma razon que las
// facetas pequenas de /mejores: Google las archiva como "rastreada, sin indexar".
const MIN_MARCA = 6;
const MIN_MARCA_INDEXADO = 10;

export const slugMarca = (marca) => String(marca)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/&/g, ' y ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const grupos = new Map();
for (const p of datos.productos) {
  if (p.marca === 'Desconocida') continue;
  const slug = slugMarca(p.marca);
  if (!slug) continue;
  if (!grupos.has(slug)) grupos.set(slug, []);
  grupos.get(slug).push(p);
}

export const MARCAS = [...grupos.entries()]
  .filter(([, ps]) => ps.length >= MIN_MARCA)
  .map(([slug, ps]) => {
    // El nombre que mas se repite: una tienda escribe "QUAMTRAX" y otra "Quamtrax".
    const cuenta = new Map();
    for (const p of ps) cuenta.set(p.marca, (cuenta.get(p.marca) ?? 0) + 1);
    const nombre = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const categorias = datos.categorias
      .map((cat) => ({ cat, productos: ps.filter((p) => p.categoria === cat.slug)
        .sort((a, b) => (a.precio_referencia ?? Infinity) - (b.precio_referencia ?? Infinity)) }))
      .filter((g) => g.productos.length > 0)
      .sort((a, b) => b.productos.length - a.productos.length);
    return {
      slug, nombre, productos: ps, categorias,
      tiendas: [...new Set(ps.map((p) => p.tienda))],
      lider: porScore(ps)[0],
      indexable: ps.length >= MIN_MARCA_INDEXADO,
    };
  })
  .sort((a, b) => b.productos.length - a.productos.length);

const porSlug = new Map(MARCAS.map((m) => [m.slug, m]));
/** La pagina de marca de un producto, si existe. */
export const marcaDe = (p) => porSlug.get(slugMarca(p.marca)) ?? null;

export const RUTAS_MARCAS = MARCAS.filter((m) => m.indexable).map((m) => `/marca/${m.slug}`);
