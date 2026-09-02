import datos from '../../datos/dataset.json';
import { abs } from '../../sitio.js';
import { porScore, resumen } from '../../datos/seo.js';

// El ranking de cada categoria en JSON limpio y citable: /datos/creatina.json.
// Un modelo que puede leer la tabla sin parsear HTML cita la fuente con mas facilidad,
// y una URL de datos es lo unico de esta web que otro sitio enlaza sin que se lo pidas.
// No es dataset.json entero (900 KB): solo lo que hace falta para citar.

export function getStaticPaths() {
  return datos.categorias.map((c) => ({ params: { categoria: c.slug }, props: { c } }));
}

export function GET({ props }) {
  const { c } = props;
  const productos = datos.productos.filter((p) => p.categoria === c.slug);
  const r = resumen(c, productos);
  const cuerpo = {
    categoria: c.nombre,
    url: abs(`/${c.slug}`),
    unidad_precio: c.unidad_precio,
    moneda: 'EUR',
    recogido: datos.generado,
    licencia: 'Uso libre citando la fuente y la fecha de recogida.',
    metodo: abs('/metodologia'),
    resumen: {
      productos: r.n,
      tiendas: r.tiendas,
      precio_min: r.barato?.precio_referencia ?? null,
      precio_max: r.caro?.precio_referencia ?? null,
      precio_mediana: r.mediana,
      con_nivel_4: r.nivel4,
    },
    productos: porScore(productos).map((p, i) => ({
      puesto: i + 1,
      slug: p.slug,
      nombre: `${p.marca} ${p.nombre}`,
      marca: p.marca,
      tienda: p.tienda,
      precio_envase_eur: p.precio_eur,
      precio_por_unidad_eur: p.precio_referencia,
      unidad: c.unidad_precio,
      formato_gramos: p.formato_gramos,
      unidades: p.unidades,
      servicios_por_envase: p.servicios_por_envase,
      score: p.score_final,
      nivel_verificacion: p.nivel_verificacion,
      // Lo que la ficha de la tienda declara de su composicion y lo que le ponen sus
      // compradores. null cuando esa tienda no lo publica.
      valoracion_tienda: p.valoracion,
      n_valoraciones: p.n_valoraciones,
      pureza_real: p.pureza_real,
      aditivos: p.aditivos,
      // Los requisitos de la categoria y cuales cumple, con su motivo: es la parte de la
      // nota que mas se puede discutir, asi que se publica entera.
      requisitos: p.requisitos,
      // Por que puntua lo que puntua, en las mismas palabras que la ficha.
      desglose: p.desglose,
      ficha: abs(`/producto/${p.slug}`),
      url_tienda: p.url,
    })),
  };
  return new Response(JSON.stringify(cuerpo, null, 1), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
