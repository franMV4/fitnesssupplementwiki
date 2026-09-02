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
//   RESEND_KEY / CORREO_DESDE -> opcionales; sin ellos, el enlace de recuperar la
//                                contrasena se escribe en el log en vez de enviarse
//   ADMINS  -> correos con acceso a /admin, separados por comas. Sin este secreto no
//              hay administradores y /admin no deja entrar a nadie, que es el unico
//              valor por defecto seguro.

import { SITIO } from '../../src/sitio.js';

const DIAS = 30;
// Una hora para el enlace de recuperacion: lo suficiente para ir al correo y volver, no
// tanto como para que siga sirviendo el que quedo en un buzon abierto en otro sitio.
const HORA = 3600000;
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

  // El limite va aqui, antes de mirar que ruta es: si estuviera dentro de cada handler
  // habria que acordarse de ponerlo en la siguiente que se anada, y la que se olvide es
  // justo la que se lleva la fuerza bruta. Solo cuenta lo que escribe.
  if (metodo === 'POST') {
    const ip = request.headers.get('cf-connecting-ip');
    if (!await dentroDelLimite(env.DB, ip, ruta)) {
      return error('Demasiados intentos desde tu conexion. Espera un rato y vuelve a probar.', 429);
    }
  }

  try {
    if (ruta === 'registro' && metodo === 'POST') return await registro(request, env);
    if (ruta === 'entrar' && metodo === 'POST') return await entrar(request, env);
    if (ruta === 'olvide' && metodo === 'POST') return await olvide(request, env);
    if (ruta === 'restablecer' && metodo === 'POST') return await restablecer(request, env);
    if (ruta === 'salir' && metodo === 'POST') {
      return json({ ok: true }, 200, { 'set-cookie': 's=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0' });
    }
    if (ruta === 'yo' && metodo === 'GET') {
      const id = await sesion(request, env);
      const u = id && await env.DB.prepare('SELECT id, nombre, email FROM usuarios WHERE id = ?')
        .bind(id).first();
      // `google` dice si el boton de Google tiene con que funcionar. Sin esto, la
      // pagina de acceso ensena un boton que lleva a un 503.
      //
      // `admin` viaja aqui y no en una ruta aparte porque la cabecera ya llama a /api/yo
      // en las 2.985 paginas: preguntarlo dos veces seria doblar esa llamada para
      // ensenar un enlace. El correo se usa para calcularlo y NO se devuelve: la
      // cabecera solo necesita saber si el enlace sale o no.
      return json({
        usuario: u ? { id: u.id, nombre: u.nombre } : null,
        admin: Boolean(u && esAdmin(env.ADMINS, u.email)),
        google: Boolean(env.GOOGLE_ID && env.GOOGLE_SECRET),
      });
    }
    if (ruta === 'google' && metodo === 'GET') return await googleIda(request, env);
    if (ruta === 'google/vuelta' && metodo === 'GET') return await googleVuelta(request, env);
    if (ruta === 'resenas' && metodo === 'GET') return await listar(request, env);
    if (ruta === 'resenas' && metodo === 'POST') return await publicar(request, env);
    // HEAD ademas de GET: es la peticion que hacen los comprobadores de enlaces y los
    // monitores, y contestarles 404 sobre una foto que existe la da por rota. El runtime
    // ya se encarga de no mandar el cuerpo en un HEAD.
    if (ruta.startsWith('foto/') && (metodo === 'GET' || metodo === 'HEAD')) {
      return await foto(ruta.slice(5), env);
    }
    if (ruta.startsWith('admin/')) return await panel(ruta.slice(6), metodo, request, env);
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

// --- Recuperar la contrasena ----------------------------------------------------
// Sin tabla de tokens. El enlace lleva "id.caduca.firma" y la firma se calcula sobre el
// hash de la clave actual: en cuanto la clave cambia, el hash cambia y el enlace deja de
// valer solo. Una tabla de tokens seria una tabla mas, un INSERT mas y un borrado
// periodico de filas caducadas para conseguir exactamente lo mismo.

export async function tokenClave(secreto, id, claveGuardada, caduca) {
  return `${id}.${caduca}.${await firmar(secreto, `${id}.${caduca}.${claveGuardada}`)}`;
}

async function usuarioDeToken(env, token) {
  const [id, caduca, firma] = String(token ?? '').split('.');
  if (!firma || !(Number(caduca) > Date.now())) return null;
  const u = await env.DB.prepare('SELECT id, nombre, clave FROM usuarios WHERE id = ?')
    .bind(Number(id)).first();
  // Sin clave = cuenta de Google. No hay contrasena que restablecer y firmar sobre ''
  // haria que un mismo token valiese para todas ellas.
  if (!u || !u.clave) return null;
  if (!igual(firma, await firmar(env.SECRETO, `${id}.${caduca}.${u.clave}`))) return null;
  return u;
}

async function olvide(request, env) {
  const { email } = await request.json();
  const correo = String(email ?? '').toLowerCase().trim();
  // La misma respuesta pase lo que pase. Contestar "ese correo no existe" convierte el
  // formulario en un comprobador de cuentas para quien las pida una a una.
  const respuesta = json({ ok: true });
  if (!EMAIL.test(correo)) return respuesta;

  const u = await env.DB.prepare('SELECT id, clave FROM usuarios WHERE email = ?')
    .bind(correo).first();
  if (!u || !u.clave) return respuesta;

  const token = await tokenClave(env.SECRETO, u.id, u.clave, Date.now() + HORA);
  const enlace = `${new URL(request.url).origin}/recuperar?t=${encodeURIComponent(token)}`;
  await enviarCorreo(env, correo, enlace);
  return respuesta;
}

async function restablecer(request, env) {
  const { token, clave } = await request.json();
  if (String(clave ?? '').length < 8) return error('La contraseña necesita 8 caracteres como mínimo.');
  const u = await usuarioDeToken(env, token);
  if (!u) return error('Este enlace ya no vale: o ha caducado o la contraseña se cambio despues de pedirlo. Pide otro.', 400);

  await env.DB.prepare('UPDATE usuarios SET clave = ? WHERE id = ?')
    .bind(await hashClave(clave), u.id).run();
  // Se entra directamente: quien acaba de demostrar que controla el correo no tiene que
  // escribir la clave nueva otra vez en la pantalla siguiente.
  return json({ usuario: { id: u.id, nombre: u.nombre } }, 200, { 'set-cookie': await galleta(env, u.id) });
}

// Resend por HTTP y sin SDK: es un POST con una clave en la cabecera. Sin configurar, el
// enlace sale por el log del servidor, que en local es justo donde se lee, y en
// produccion deja constancia de que falta poner RESEND_KEY.
export async function enviarCorreo(env, para, enlace) {
  if (!env.RESEND_KEY || !env.CORREO_DESDE) {
    console.log(`[recuperar] Sin RESEND_KEY configurada. Enlace para ${para}: ${enlace}`);
    return;
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.CORREO_DESDE,
      to: para,
      // Nadie lee el buzon del que sale: CORREO_DESDE es una direccion del dominio, no
      // una cuenta de correo. Sin esto, contestar al aviso es escribirle a la nada.
      reply_to: SITIO.contacto,
      subject: 'Recuperar tu contraseña en FitnessSupplementWiki',
      text: `Para poner una contraseña nueva, entra aquí:

${enlace}

`
          + `El enlace caduca en una hora y solo sirve una vez.
`
          + `Si no has pedido nada, ignora este correo: tu cuenta sigue como estaba.`,
    }),
  });
  // Un fallo del proveedor no se le cuenta a quien lo pidio: la respuesta ya es siempre
  // la misma, y decir "no se pudo enviar" volveria a delatar que ese correo existe.
  if (!r.ok) console.log(`[recuperar] Resend ha fallado (${r.status}): ${await r.text()}`);
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


// --- Panel de administracion (/admin) -------------------------------------------
// Dos mundos que se administran distinto, y el panel lo dice en su cara:
//
//   EN VIVO   usuarios y resenas. Viven en D1, se editan aqui y el cambio se ve al
//             recargar la ficha. Borrar una resena borra tambien su foto de R2.
//   EN COLA   catalogo, categorias, dosis, pesos y textos. Esas paginas son HTML
//             estatico generado en build: aqui no se pueden cambiar en caliente, solo
//             se APUNTA la correccion en `ediciones`, y el pipeline la aplica en la
//             pasada siguiente (ediciones.py). Prometer lo contrario seria mentir.
//
// Quien es admin sale del secreto ADMINS, no de una columna: son dos correos que no
// cambian nunca, y una tabla de roles seria una tabla, una pantalla para editarla y
// una forma nueva de quedarse fuera de casa.

const AMBITOS = ['producto', 'categoria', 'dosis', 'config', 'evidencia', 'texto'];
const PAGINA = 50;

export const esAdmin = (lista, email) => {
  const correo = String(email ?? '').toLowerCase().trim();
  return Boolean(correo) && String(lista ?? '').toLowerCase().split(/[,;\s]+/)
    .filter(Boolean).includes(correo);
};

async function quienAdmin(request, env) {
  const id = await sesion(request, env);
  if (!id) return { estado: 401, mensaje: 'Hay que entrar para llegar aqui.' };
  const u = await env.DB.prepare('SELECT id, email, nombre FROM usuarios WHERE id = ?')
    .bind(id).first();
  if (!u || !esAdmin(env.ADMINS, u.email)) {
    return { estado: 403, mensaje: 'Esta zona es solo para administradores.' };
  }
  return { usuario: u };
}

async function panel(que, metodo, request, env) {
  const { usuario, estado, mensaje } = await quienAdmin(request, env);
  if (!usuario) return error(mensaje, estado);

  if (que === 'yo' && metodo === 'GET') return json({ admin: true, nombre: usuario.nombre });
  if (que === 'usuarios' && metodo === 'GET') return await admUsuarios(request, env);
  if (que === 'usuario' && metodo === 'POST') return await admUsuario(request, env);
  if (que === 'resenas' && metodo === 'GET') return await admResenas(request, env);
  if (que === 'resena' && metodo === 'POST') return await admResena(request, env);
  if (que === 'ediciones' && metodo === 'GET') return await admEdiciones(request, env);
  if (que === 'edicion' && metodo === 'POST') return await admEdicion(request, env, usuario);
  return error('Ruta no encontrada.', 404);
}

// El patron del LIKE se construye aqui y el texto viaja por bind: concatenar el termino
// dentro del SQL es como se cuela una inyeccion en la unica consulta con texto libre.
const busca = (q) => `%${String(q ?? '').trim().slice(0, 60)}%`;

async function admUsuarios(request, env) {
  const u = new URL(request.url);
  const q = u.searchParams.get('q');
  const desde = Math.max(0, Number(u.searchParams.get('desde')) || 0);
  // Se piden PAGINA+1 filas para saber si hay mas sin gastar un COUNT(*) sobre la tabla.
  const { results } = await env.DB.prepare(
    `SELECT us.id, us.email, us.nombre, us.creado, us.clave <> '' AS con_clave,
            (SELECT COUNT(*) FROM resenas r WHERE r.usuario = us.id) AS resenas
       FROM usuarios us
      WHERE (?1 = '' OR us.email LIKE ?2 OR us.nombre LIKE ?2)
      ORDER BY us.id DESC LIMIT ?3 OFFSET ?4`)
    .bind(String(q ?? '').trim(), busca(q), PAGINA + 1, desde).all();
  return json({
    usuarios: results.slice(0, PAGINA).map((r) => ({ ...r, con_clave: Boolean(r.con_clave) })),
    hay_mas: results.length > PAGINA,
    desde,
  });
}

async function admUsuario(request, env) {
  const { id, nombre, email, borrar } = await request.json();
  const uid = Number(id);
  if (!Number.isInteger(uid)) return error('Falta el usuario.');

  if (borrar) {
    // Las fotos primero: si se borran las filas antes, ya no hay forma de saber que
    // objetos de R2 se quedaron sin dueno, y el bucket se llena de basura para siempre.
    const { results } = await env.DB.prepare(
      'SELECT foto FROM resenas WHERE usuario = ? AND foto IS NOT NULL').bind(uid).all();
    for (const r of results) await env.FOTOS?.delete(`fotos/${r.foto}`);
    await env.DB.prepare('DELETE FROM resenas WHERE usuario = ?').bind(uid).run();
    await env.DB.prepare('DELETE FROM usuarios WHERE id = ?').bind(uid).run();
    return json({ ok: true, borrado: uid });
  }

  const correo = email == null ? null : String(email).toLowerCase().trim();
  if (correo !== null && !EMAIL.test(correo)) return error('Ese correo no tiene buena pinta.');
  const nom = nombre == null ? null : String(nombre).trim().slice(0, 40);
  if (nom !== null && !nom) return error('El nombre no puede quedarse vacio.');

  // COALESCE y no dos UPDATE distintos: lo que no viaja en la peticion no se toca.
  try {
    await env.DB.prepare(
      'UPDATE usuarios SET nombre = COALESCE(?, nombre), email = COALESCE(?, email) WHERE id = ?')
      .bind(nom, correo, uid).run();
  } catch (e) {
    // El UNIQUE de email es la unica forma realista de que esto falle, y "constraint
    // failed" no le dice nada a quien esta corrigiendo una ficha.
    if (String(e.message).includes('UNIQUE')) return error('Ya hay una cuenta con ese correo.', 409);
    throw e;
  }
  const u = await env.DB.prepare('SELECT id, email, nombre, creado FROM usuarios WHERE id = ?')
    .bind(uid).first();
  return json({ ok: true, usuario: u });
}

async function admResenas(request, env) {
  const u = new URL(request.url);
  const q = u.searchParams.get('q');
  const producto = String(u.searchParams.get('producto') ?? '').trim();
  const desde = Math.max(0, Number(u.searchParams.get('desde')) || 0);
  const { results } = await env.DB.prepare(
    `SELECT r.id, r.producto, r.puntuacion, r.texto, r.foto, r.creado,
            r.usuario, us.nombre, us.email
       FROM resenas r JOIN usuarios us ON us.id = r.usuario
      WHERE (?1 = '' OR r.producto = ?1)
        AND (?2 = '' OR r.texto LIKE ?3 OR r.producto LIKE ?3 OR us.nombre LIKE ?3
             OR us.email LIKE ?3)
      ORDER BY r.creado DESC LIMIT ?4 OFFSET ?5`)
    .bind(producto, String(q ?? '').trim(), busca(q), PAGINA + 1, desde).all();
  return json({ resenas: results.slice(0, PAGINA), hay_mas: results.length > PAGINA, desde });
}

async function admResena(request, env) {
  const { id, puntuacion, texto, borrar, quitar_foto } = await request.json();
  const rid = Number(id);
  if (!Number.isInteger(rid)) return error('Falta la resena.');
  const r = await env.DB.prepare('SELECT id, foto FROM resenas WHERE id = ?').bind(rid).first();
  if (!r) return error('Esa resena ya no existe.', 404);

  if (borrar) {
    if (r.foto) await env.FOTOS?.delete(`fotos/${r.foto}`);
    await env.DB.prepare('DELETE FROM resenas WHERE id = ?').bind(rid).run();
    return json({ ok: true, borrado: rid });
  }

  const n = puntuacion == null ? null : Number(puntuacion);
  if (n !== null && !(Number.isInteger(n) && n >= 1 && n <= 5)) {
    return error('La puntuacion va de 1 a 5 estrellas.');
  }
  if (quitar_foto && r.foto) await env.FOTOS?.delete(`fotos/${r.foto}`);
  await env.DB.prepare(
    `UPDATE resenas SET puntuacion = COALESCE(?1, puntuacion), texto = COALESCE(?2, texto),
            foto = CASE WHEN ?3 THEN NULL ELSE foto END WHERE id = ?4`)
    .bind(n, texto == null ? null : String(texto).slice(0, MAX_TEXTO),
          quitar_foto ? 1 : 0, rid).run();
  const fila = await env.DB.prepare(
    `SELECT r.id, r.producto, r.puntuacion, r.texto, r.foto, r.creado, us.nombre, us.email
       FROM resenas r JOIN usuarios us ON us.id = r.usuario WHERE r.id = ?`).bind(rid).first();
  return json({ ok: true, resena: fila });
}

async function admEdiciones(request, env) {
  const ambito = String(new URL(request.url).searchParams.get('ambito') ?? '').trim();
  const { results } = await env.DB.prepare(
    `SELECT ambito, clave, campo, valor, motivo, autor, fecha FROM ediciones
      WHERE (?1 = '' OR ambito = ?1) ORDER BY fecha DESC`).bind(ambito).all();
  return json({ ediciones: results });
}

async function admEdicion(request, env, quien) {
  const { ambito, clave, campo, valor, motivo, deshacer } = await request.json();
  if (!AMBITOS.includes(ambito)) return error('Ese ambito no existe.');
  if (!clave || !campo) return error('Falta la clave o el campo.');

  if (deshacer) {
    await env.DB.prepare('DELETE FROM ediciones WHERE ambito=? AND clave=? AND campo=?')
      .bind(ambito, String(clave), String(campo)).run();
    return json({ ok: true, deshecho: true });
  }

  // El valor se guarda serializado como JSON. Hacerlo aqui y no en el navegador es lo
  // que impide que una edicion mal formada entre en la tabla y reviente el build de la
  // madrugada siguiente, cuando ya nadie se acuerda de haberla escrito.
  let bruto;
  try {
    bruto = JSON.stringify(valor === undefined ? null : valor);
  } catch {
    return error('Ese valor no se puede guardar.');
  }
  if (bruto.length > 20000) return error('Ese valor es demasiado largo (20 KB como mucho).');

  await env.DB.prepare(
    `INSERT INTO ediciones (ambito, clave, campo, valor, motivo, autor, fecha)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT (ambito, clave, campo) DO UPDATE
        SET valor = excluded.valor, motivo = excluded.motivo,
            autor = excluded.autor, fecha = excluded.fecha`)
    .bind(ambito, String(clave), String(campo), bruto,
          String(motivo ?? '').slice(0, 300), quien.email).run();
  return json({ ok: true });
}

// --- Limite de peticiones -------------------------------------------------------
// Lo que frena a quien prueba contrasenas una a una o crea mil cuentas. PBKDF2 con
// 100.000 vueltas ya encarece cada intento (~120 ms de CPU), pero eso solo hace la
// fuerza bruta lenta, no imposible, y no frena en absoluto el alta masiva de cuentas.
//
// Cuenta por IP y por tramo de tiempo, con una fila en D1 por IP y tramo. Los topes son
// generosos a proposito: una oficina o un movil con CGNAT comparten IP, y dejar fuera a
// una persona de verdad es peor que dejar pasar unos cuantos intentos de mas.
//
//   [cuantos, minutos de la ventana]
const LIMITES = {
  entrar: [20, 15],       // probar claves: lo que mas importa frenar
  registro: [5, 60],      // darse de alta es algo que se hace una vez
  olvide: [5, 60],        // y ademas cada uno manda un correo
  restablecer: [10, 60],
  resenas: [20, 60],      // solo el POST; leerlas no se limita
};

// Una de cada cincuenta peticiones limitadas barre los tramos viejos. Un cron para esto
// seria una pieza mas que vigilar, y las filas caducadas no molestan a nadie mientras
// tanto: la consulta va por clave primaria.
const LIMPIEZA = 0.02;

export function tramo(minutos, ahora = Date.now()) {
  const min = Math.floor(ahora / 60000);
  return Math.floor(min / minutos) * minutos;
}

/** true si la peticion pasa; false si se ha pasado del tope. */
export async function dentroDelLimite(db, ip, ruta, ahora = Date.now(), azar = Math.random) {
  const limite = LIMITES[ruta];
  // Sin cabecera de IP (el servidor de desarrollo no la pone) no hay a quien contar, y
  // una ruta sin tope configurado no se limita.
  if (!limite || !ip) return true;
  const [tope, minutos] = limite;
  const ventana = tramo(minutos, ahora);

  // Fallar abierto: si D1 tiene un mal momento, la gente entra igual. Un contador roto
  // no puede convertirse en "nadie puede iniciar sesion en toda la web".
  try {
    const fila = await db.prepare(
      `INSERT INTO intentos (ip, ruta, ventana) VALUES (?, ?, ?)
       ON CONFLICT (ip, ruta, ventana) DO UPDATE SET n = n + 1
       RETURNING n`).bind(ip, ruta, ventana).first();
    if (azar() < LIMPIEZA) {
      await db.prepare('DELETE FROM intentos WHERE ventana < ?')
        .bind(tramo(1, ahora) - 24 * 60).run();
    }
    return Number(fila?.n ?? 0) <= tope;
  } catch {
    return true;
  }
}
