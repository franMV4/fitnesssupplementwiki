import datos from '../../datos/dataset.json';

// El catalogo entero en un fichero, para el panel de /admin: 2.665 productos con los
// campos que se pueden corregir a mano, mas las categorias y las dosis de referencia.
//
// Por que un fichero aparte y no dataset.json: dataset.json lleva la serie de precios de
// cada producto y el desglose del score, y el panel no edita ni una cosa ni la otra. Sin
// ellos esto baja de 4,4 MB a 2, y comprimido por Cloudflare viaja en bastante menos.
//
// Por que un endpoint y no props de la pagina: /admin se queda en una pagina de 19 KB que
// carga al instante, y el catalogo se pide una sola vez y lo cachea el navegador. Meterlo
// en el HTML seria pintar los 2 MB en cada visita al panel para volver a parsearlos.
//
// ponytail: si algun dia molesta la espera, el corte es servirlo por categoria como ya
// hace /datos/<categoria>.json. Hoy son 2 MB una vez al dia en la unica pagina que no
// tiene que ir rapida, y partirlo serian 30 peticiones y un estado que mantener.
//
// No expone nada nuevo: son los mismos datos que ya publican los 30 ficheros de
// /datos/<categoria>.json, que existen a proposito para que otros los citen.

export function GET() {
  const cuerpo = {
    generado: datos.generado,
    // La clave con la que el panel guarda una correccion, y la unica estable entre
    // pasadas del scraper: el slug se calcula del nombre y cambia en cuanto lo corriges.
    // Se manda ya montada para que el navegador no tenga que saber como se arma.
    productos: datos.productos.map((p) => ({
      clave: `${p.tienda}|${p.url}`,
      slug: p.slug,
      marca: p.marca,
      nombre: p.nombre,
      categoria: p.categoria,
      tienda: p.tienda,
      url: p.url,
      imagen: p.imagen,
      formato_gramos: p.formato_gramos,
      unidades: p.unidades,
      servicios_por_envase: p.servicios_por_envase,
      precio_eur: p.precio_eur,
      precio_referencia: p.precio_referencia,
      unidad_precio: p.unidad_precio,
      forma: p.forma,
      // Composicion y opiniones: el panel no las edita, pero son parte del catalogo
      // publico y de lo que explica la nota de un producto.
      valoracion: p.valoracion,
      n_valoraciones: p.n_valoraciones,
      pureza_real: p.pureza_real,
      aditivos: p.aditivos,
      score_requisitos: p.score_requisitos,
      score_final: p.score_final,
      nivel_verificacion: p.nivel_verificacion,
      certificaciones: p.certificaciones,
      ingredientes: p.ingredientes.map((i) => ({
        ingrediente: i.ingrediente,
        dosis_por_servicio_mg: i.dosis_por_servicio_mg,
      })),
      fecha_scrape: p.fecha_scrape,
    })),
    categorias: datos.categorias,
    dosis_referencia: datos.dosis_referencia,
    config: datos.config,
  };
  return new Response(JSON.stringify(cuerpo), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
