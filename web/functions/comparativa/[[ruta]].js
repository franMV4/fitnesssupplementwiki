// Las landings de /comparativa/ y /mejores/ salen de los datos: cuando una tienda se queda
// sin productos en una categoria, su pagina deja de generarse y la URL que Google ya
// conocia da 404 (Search Console, 09/2026: 10 de ellas). Aqui la pagina se sirve si existe
// y, si no, se manda con un 301 a su categoria, que es lo que buscaba quien llego.
//
// La categoria esta dentro del slug: al final en /comparativa/ ("amazon-vs-zumub-zinc")
// y al principio en /mejores/ ("colageno-de-zumub"). Como las tiendas y las categorias
// llevan guiones, no se parte: se prueban los cortes, del mas largo al mas corto, hasta
// dar con una categoria que exista. Solo corre cuando ya hay un 404, asi que las paginas
// vivas no pagan nada mas que el next().
export async function onRequest({ request, next, env }) {
  const res = await next();
  if (res.status !== 404) return res;
  const url = new URL(request.url);
  const [, seccion, slug = ''] = url.pathname.split('/');
  const partes = slug.split('-');
  for (let i = 1; i < partes.length; i++) {
    const cat = (seccion === 'comparativa' ? partes.slice(i) : partes.slice(0, -i)).join('-');
    const destino = new URL(`/${cat}/`, url);
    if ((await env.ASSETS.fetch(destino)).ok) return Response.redirect(destino, 301);
  }
  return res;
}
