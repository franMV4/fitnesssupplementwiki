// API de cuentas y resenas. Un unico fichero para las siete rutas: ninguna llega a
// veinte lineas y repartirlas en siete modulos solo anade siete cabeceras de import.
//
// Es lo unico dinamico de la web: el resto se sigue generando en build desde
// dataset.json y se sirve como HTML estatico. Aqui no se consulta el catalogo, solo
// se guarda lo que escribe el lector, referenciado por el slug del producto.
//
// Sin dependencias: el runtime de Cloudflare ya trae WebCrypto (PBKDF2 para las
// claves, HMAC para la cookie de sesion), FormData y R2. Meter bcrypt o una libreria
// de JWT aqui seria pagar 40 KB por lo que hacen doce lineas del propio runtime.
//
// Bindings que espera (ver wrangler.toml y PUBLICAR.md paso 9):
//   DB      -> base de datos D1
//   FOTOS   -> bucket de R2
//   SECRETO -> secreto con el que se firma la cookie
//   GOOGLE_ID / GOOGLE_SECRET -> opcionales; sin ellos, el boton de Google no sale

const DIAS = 30;
const MAX_FOTO = 2 * 1024 * 1024;
const MAX_TEXTO = 1500;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const UUID = /^[0-9a-f-]{36}$/;

const json = (dato, estado = 200, cabeceras = {}) => new Response(JSON.stringify(dato), {
  status: estado,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...cabeceras },
});
const error = (mensaje, estado = 400) => json({ error: mensaje }, estado);

const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const desdeHex = (h) => new Uint8Array((h.match(/../g) ?? []).map((x) => parseInt(x, 16)));
const utf8 = (s) => new TextEncoder().encode(s);

// Comparacion en tiempo constante. Con ===, el tiempo de respuesta cuenta cuantos
// caracteres del hash ha acertado quien prueba, y eso convierte adivinar 64 bytes en
// adivinar 64 veces un byte.
export function igual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// 100.000 vueltas de PBKDF2-SHA256 es lo que recomienda OWASP para este algoritmo.
export async function hashClave(clave, sal = crypto.getRandomValues(new Uint8Array(16))) {
  const k = await crypto.subtle.importKey('raw', utf8(clave), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: 100000 }, k, 256);
  return `${hex(sal)}:${hex(bits)}`;
}

export async function claveOk(clave, guardado) {
  const [sal] = String(guardado).split(':');
  return igual(await hashClave(clave, desdeHex(sal)), guardado);
}

// Sesion sin tabla de sesiones: la cookie lleva "id.caducidad.firma" y el servidor
// valida la firma con el secreto. Una tabla de sesiones seria una consulta mas por
// peticion para guardar un dato que ya cabe firmado en la propia cookie.
export async function firmar(secreto, dato) {
  const k = await crypto.subtle.importKey('raw', utf8(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, utf8(dato)));
}

async function galleta(env, id) {
  const dato = `${id}.${Date.now() + DIAS * 86400000}`;
  const valor = `${dato}.${await firmar(env.SECRETO, dato)}`;
  return `s=${valor}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${DIAS * 86400}`;
}

export async function sesion(request, env) {
  const c = (request.headers.get('cookie') ?? '').match(/(?:^|;\s*)s=([^;]+)/);
  if (!c) return null;
  const [id, caduca, firma] = c[1].split('.');
  if (!firma || !(Number(caduca) > Date.now())) return null;
  if (!igual(firma, await firmar(env.SECRETO, `${id}.${caduca}`))) return null;
  return Number(id);
}

export async function onRequest({ request, env, params }) {
  const ruta = [].concat(params.ruta ?? []).join('/');
  const metodo = request.method;

  // Un fallo de configuracion no puede parecer un fallo del lector: sin bindings, la
  // pagina tiene que decir por que, y no devolver un 500 mudo.
  if (!env.DB || !env.SECRETO) return error('La base de datos aun no esta configurada.', 503);

  try {
    if (ruta === 'registro' && metodo === 'POST') return await registro(request, env);
    if (ruta === 'entrar' && metodo === 'POST') return await entrar(request, env);
    if (ruta === 'salir' && metodo === 'POST') {
      return json({ ok: true }, 200, { 'set-cookie': 's=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0' });
    }
    if (ruta === 'yo' && metodo === 'GET') {
      const id = await sesion(request, env);
      const u = id && await env.DB.prepare('SELECT id, nombre FROM usuarios WHERE id = ?').bind(id).first();
      // `google` dice si el boton de Google tiene con que funcionar. Sin esto, la
      // pagina de acceso ensena un boton que lleva a un 503.
      return json({ usuario: u ?? null, google: Boolean(env.GOOGLE_ID && env.GOOGLE_SECRET) });
    }
    if (ruta === 'google' && metodo === 'GET') return await googleIda(request, env);
    if (ruta === 'google/vuelta' && metodo === 'GET') return await googleVuelta(request, env);
    if (ruta === 'resenas' && metodo === 'GET') return await listar(request, env);
    if (ruta === 'resenas' && metodo === 'POST') return await publicar(request, env);
    if (ruta.startsWith('foto/') && metodo === 'GET') return await foto(ruta.slice(5), env);
  } catch (e) {
    return error(`Error del servidor: ${e.message}`, 500);
  }
  return error('Ruta no encontrada.', 404);
}

async function registro(request, env) {
  const { email, nombre, clave } = await request.json();
  if (!EMAIL.test(String(email ?? ''))) return error('Ese correo no parece valido.');
  if (String(nombre ?? '').trim().length < 2) return error('Escribe un nombre de al menos 2 caracteres.');
  if (String(clave ?? '').length < 8) return error('La contraseña necesita 8 caracteres como mínimo.');

  const limpio = nombre.trim().slice(0, 40);
  const existe = await env.DB.prepare('SELECT 1 FROM usuarios WHERE email = ?')
    .bind(email.toLowerCase()).first();
  if (existe) return error('Ya hay una cuenta con ese correo.', 409);

  const r = await env.DB.prepare('INSERT INTO usuarios (email, nombre, clave) VALUES (?, ?, ?)')
    .bind(email.toLowerCase(), limpio, await hashClave(clave)).run();
  const id = r.meta.last_row_id;
  return json({ usuario: { id, nombre: limpio } }, 200, { 'set-cookie': await galleta(env, id) });
}

async function entrar(request, env) {
  const { email, clave } = await request.json();
  const u = await env.DB.prepare('SELECT id, nombre, clave FROM usuarios WHERE email = ?')
    .bind(String(email ?? '').toLowerCase()).first();
  // El mismo mensaje si no existe el correo y si falla la clave: distinguirlos regala
  // la lista de correos registrados a quien la pida uno a uno.
  // Las cuentas creadas con Google no tienen clave (la columna guarda ''): sin este
  // corte, PBKDF2 se llamaria con la sal vacia y el fallo saldria como un 500.
  if (!u || !u.clave || !await claveOk(String(clave ?? ''), u.clave)) {
    return error('Correo o contraseña incorrectos.', 401);
  }
  return json({ usuario: { id: u.id, nombre: u.nombre } }, 200, { 'set-cookie': await galleta(env, u.id) });
}

// El producto se puede pasar aparte: al publicar, la lista se devuelve en la respuesta
// del POST, y ese request no lleva el slug en la query como el GET.
async function listar(request, env, producto = new URL(request.url).searchParams.get('producto')) {
  if (!producto) return error('Falta el producto.');
  const yo = await sesion(request, env);

  const { results } = await env.DB.prepare(
    `SELECT r.id, r.puntuacion, r.texto, r.foto, r.creado, r.usuario, u.nombre
       FROM resenas r JOIN usuarios u ON u.id = r.usuario
      WHERE r.producto = ? ORDER BY r.creado DESC LIMIT 100`).bind(producto).all();

  // La media se calcula sobre las mismas filas que se envian: un contador guardado en
  // otra tabla acaba diciendo 4,8 cuando la lista visible dice 3,1.
  const media = results.length
    ? results.reduce((s, r) => s + r.puntuacion, 0) / results.length : null;
  return json({
    media,
    total: results.length,
    resenas: results.map(({ usuario, ...r }) => ({ ...r, mia: usuario === yo })),
  });
}

async function publicar(request, env) {
  const id = await sesion(request, env);
  if (!id) return error('Hay que entrar para dejar una resena.', 401);

  // multipart y no JSON: la foto viaja en la misma peticion que la puntuacion, asi no
  // queda estado a medias con la resena guardada y la imagen sin subir.
  const f = await request.formData();
  const producto = String(f.get('producto') ?? '');
  const puntuacion = Number(f.get('puntuacion'));
  const texto = String(f.get('texto') ?? '').trim().slice(0, MAX_TEXTO);
  if (!producto) return error('Falta el producto.');
  if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
    return error('La puntuacion va de 1 a 5 estrellas.');
  }

  const archivo = f.get('foto');
  let clave = null;
  if (archivo && typeof archivo.arrayBuffer === 'function' && archivo.size > 0) {
    if (!String(archivo.type).startsWith('image/')) return error('El archivo tiene que ser una imagen.');
    if (archivo.size > MAX_FOTO) return error('La foto no puede pasar de 2 MB.');
    if (!env.FOTOS) return error('Las fotos aun no estan configuradas en el servidor.', 503);
    clave = crypto.randomUUID();
    await env.FOTOS.put(`fotos/${clave}`, await archivo.arrayBuffer(),
      { httpMetadata: { contentType: archivo.type } });
  }

  // La resena previa se lee antes de sobreescribirla para poder borrar su foto: sin
  // esto, cada correccion deja en R2 un objeto huerfano que ya no apunta a nada.
  const previa = await env.DB.prepare('SELECT foto FROM resenas WHERE usuario = ? AND producto = ?')
    .bind(id, producto).first();
  if (clave && previa?.foto) await env.FOTOS.delete(`fotos/${previa.foto}`);

  await env.DB.prepare(
    `INSERT INTO resenas (usuario, producto, puntuacion, texto, foto) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (usuario, producto) DO UPDATE
        SET puntuacion = excluded.puntuacion, texto = excluded.texto,
            foto = COALESCE(excluded.foto, resenas.foto), creado = datetime('now')`)
    .bind(id, producto, puntuacion, texto, clave).run();

  // Se devuelve la lista entera ya recalculada: el navegador no tiene que volver a
  // pedirla para ensenar la media nueva.
  return await listar(request, env, producto);
}

// --- Entrar con Google ---------------------------------------------------------
// Flujo de codigo de autorizacion, a mano y sin libreria: son dos redirecciones y una
// llamada a un endpoint. Una libreria de OAuth aqui pesaria mas que las dos funciones.

// Solo rutas de esta web: sin esto, "?volver=https://otra.com" convierte el login en
// un redirector abierto para quien quiera disfrazar un enlace.
export const seguro = (u) => (/^\/(?!\/)/.test(u ?? '') ? u : '/');

async function googleIda(request, env) {
  if (!env.GOOGLE_ID || !env.GOOGLE_SECRET) return error('El acceso con Google no esta configurado.', 503);
  const url = new URL(request.url);
  const estado = crypto.randomUUID();
  const ir = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  ir.search = new URLSearchParams({
    client_id: env.GOOGLE_ID,
    redirect_uri: `${url.origin}/api/google/vuelta`,
    response_type: 'code',
    scope: 'openid email profile',
    state: estado,
    prompt: 'select_account',
  }).toString();
  // El estado viaja en una cookie de diez minutos junto a la pagina desde la que se
  // pulso: si al volver no coinciden, la vuelta no la ha empezado quien dice.
  const volver = encodeURIComponent(seguro(url.searchParams.get('volver')));
  return new Response(null, {
    status: 302,
    headers: {
      location: ir.toString(),
      'set-cookie': `g=${estado}|${volver}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
    },
  });
}

async function googleVuelta(request, env) {
  const url = new URL(request.url);
  const codigo = url.searchParams.get('code');
  const estado = url.searchParams.get('state');
  const c = (request.headers.get('cookie') ?? '').match(/(?:^|;\s*)g=([^;]+)/);
  const [guardado, volver = '/'] = (c?.[1] ?? '').split('|');
  if (!codigo || !estado || !guardado || !igual(estado, guardado)) {
    return error('La vuelta de Google no cuadra. Vuelve a intentarlo.', 400);
  }

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: codigo,
      client_id: env.GOOGLE_ID,
      client_secret: env.GOOGLE_SECRET,
      redirect_uri: `${url.origin}/api/google/vuelta`,
      grant_type: 'authorization_code',
    }).toString(),
  });
  const t = await r.json();
  if (!t.id_token) return error('Google no ha devuelto la identidad.', 502);

  // El id_token llega del propio Google por TLS en esta misma peticion, no a traves del
  // navegador: no hace falta verificar su firma, solo leer lo que dice.
  const dato = jwtCuerpo(t.id_token);
  if (!dato?.email || dato.email_verified === false) {
    return error('Esa cuenta de Google no tiene el correo verificado.', 400);
  }

  const email = String(dato.email).toLowerCase();
  const nombre = String(dato.given_name || dato.name || email.split('@')[0]).slice(0, 40);
  let u = await env.DB.prepare('SELECT id FROM usuarios WHERE email = ?').bind(email).first();
  if (!u) {
    // clave vacia = esta cuenta entra por Google. No es un hash valido, asi que ninguna
    // clave escrita a mano puede coincidir con ella.
    const nuevo = await env.DB.prepare('INSERT INTO usuarios (email, nombre, clave) VALUES (?, ?, ?)')
      .bind(email, nombre, '').run();
    u = { id: nuevo.meta.last_row_id };
  }

  // Dos cookies: la de sesion y el borrado de la del estado, que ya no pinta nada.
  const cabeceras = new Headers({ location: seguro(decodeURIComponent(volver)) });
  cabeceras.append('set-cookie', await galleta(env, u.id));
  cabeceras.append('set-cookie', 'g=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  return new Response(null, { status: 302, headers: cabeceras });
}

// El cuerpo de un JWT es base64url sin relleno: atob quiere base64 con el, y el nombre
// puede traer acentos, asi que se decodifica como UTF-8 y no caracter a caracter.
export function jwtCuerpo(token) {
  try {
    const t = String(token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bruto = atob(t + '='.repeat((4 - t.length % 4) % 4));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bruto, (ch) => ch.charCodeAt(0))));
  } catch {
    return null;
  }
}

async function foto(clave, env) {
  // Solo uuids: la clave entra por la URL y sin este filtro se puede pedir cualquier
  // objeto del bucket escribiendo su nombre.
  if (!UUID.test(clave) || !env.FOTOS) return new Response('No encontrada', { status: 404 });
  const obj = await env.FOTOS.get(`fotos/${clave}`);
  if (!obj) return new Response('No encontrada', { status: 404 });
  return new Response(obj.body, {
    headers: {
      'content-type': obj.httpMetadata?.contentType ?? 'image/jpeg',
      // El nombre es un uuid: el contenido de esa URL no cambia nunca.
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}

