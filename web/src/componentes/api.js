// Una sola forma de hablar con /api desde el navegador.
//
// Existe por un fallo que estaba repetido en los tres formularios: `await r.json()` sin
// red de seguridad. Si la respuesta no era JSON (el dev server de Astro sirve su 404 en
// HTML cuando la API no esta levantada) o la conexion se caia, la promesa se rompia a
// medias, el `setEnviando(false)` de despues no llegaba a ejecutarse nunca y el boton se
// quedaba en "Un momento..." para siempre, sin decir que habia pasado.
//
// Aqui todo camino acaba en un Error con un mensaje que se puede ensenar tal cual.

// Solo rutas de esta web. El equivalente de `seguro()` de la API: `?volver=` lo escribe
// quien quiera en la barra de direcciones, y sin este filtro el login redirige a donde
// le digan.
export const seguro = (u) => (/^\/(?!\/)/.test(u ?? '') ? u : '/');

// El `?volver=` no se puede leer en el .astro: las paginas son estaticas y ese codigo
// corre una sola vez, al generar el HTML, cuando todavia no hay ninguna peticion.
export const destino = (porDefecto = '/') => {
  const q = seguro(new URLSearchParams(location.search).get('volver'));
  return q === '/' ? porDefecto : q;
};

// Con tope de tiempo: un servidor que acepta la conexion y luego no contesta nunca deja
// un fetch que ni resuelve ni falla, y con el un boton girando para siempre. 20 s son de
// sobra para PBKDF2 y una escritura en D1, y muy por debajo de lo que nadie espera mirando
// una pantalla parada.
export async function pedir(ruta, cuerpo, ms = 20000) {
  return await llamar(ruta, {
    method: 'POST',
    ...(cuerpo instanceof FormData
      ? { body: cuerpo }
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) }),
  }, ms);
}

// El GET del panel de administracion, con la misma red de seguridad. Existe porque
// `pedir` es POST siempre y las listas del panel son lecturas: mandarlas por POST para
// reusar la funcion seria mentir en el metodo para ahorrarse cuatro lineas.
export async function traer(ruta, ms = 20000) {
  return await llamar(ruta, { method: 'GET' }, ms);
}

async function llamar(ruta, opciones, ms) {
  let r;
  try {
    r = await fetch(ruta, { signal: AbortSignal.timeout(ms), ...opciones });
  } catch (fallo) {
    throw new Error(fallo?.name === 'TimeoutError' || fallo?.name === 'AbortError'
      ? 'El servidor no contesta. Vuelve a intentarlo en un momento.'
      : 'No se ha podido conectar con el servidor. Revisa tu conexion e intentalo otra vez.');
  }
  // `.catch(() => null)` y no un try suelto: una respuesta 500 con una pagina de error
  // en HTML tiene que salir como "el servidor ha fallado", no como un SyntaxError.
  const d = await r.json().catch(() => null);
  if (!r.ok || !d) throw new Error(d?.error ?? mensajeDe(r.status));
  return d;
}

const mensajeDe = (estado) => estado === 404
  ? 'La API no responde. Si estas en local, arranca "npm run api" en otra terminal.'
  : `El servidor ha respondido con un error (${estado}). Intentalo otra vez en un momento.`;
