import datos from '../../datos/dataset.json';
import { nom } from '../../datos/seo.js';

// Indice minimo para el buscador de la portada. Se pide una sola vez, cuando alguien
// toca el campo: la portada no va a cargar 426 productos por si acaso. Claves de una
// letra porque son 426 filas y aqui cada caracter se paga en cada busqueda.
export function GET() {
  const nombre = Object.fromEntries(datos.categorias.map((c) => [c.slug, c.nombre]));
  const cuerpo = {
    generado: datos.generado,
    productos: datos.productos.map((p) => ({
      s: p.slug,
      n: nom(p),
      c: nombre[p.categoria] ?? p.categoria,
      g: p.categoria,
      p: p.precio_referencia,
      u: p.unidad_precio,
      v: p.nivel_verificacion,
      q: p.score_final,
    })),
  };
  return new Response(JSON.stringify(cuerpo), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
