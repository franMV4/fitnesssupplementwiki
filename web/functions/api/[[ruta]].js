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
    if (ruta === 'valoraciones' && metodo === 'GET') return await valoraciones(env);
    if (ruta === 'util' && metodo === 'POST') return await util(request, env);
    if (ruta === 'lector' && metodo === 'GET') return await lector(request, env);
    if (ruta === 'preguntas' && metodo === 'GET') return await verPreguntas(request, env);
    if (ruta === 'preguntas' && metodo === 'POST') return await preguntar(request, env);
    if (ruta === 'pregunta' && metodo === 'POST') return await borrarPregunta(request, env);
    if (ruta === 'alertas' && metodo === 'GET') return await misAlertas(request, env);
    if (ruta === 'alerta' && metodo === 'POST') return await alerta(request, env);
    // El repaso de precios no lo llama un navegador: lo llama el robot de GitHub Actions
    // despues de cada pasada del scraper, con su clave en la cabecera.
    if (ruta === 'alertas/revisar' && metodo === 'POST') return await revisar(request, env);
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

  // Los dos recuentos van en subconsultas dentro de la misma lectura: dos viajes mas a
  // D1 para saber cuantos votos tiene cada resena serian dos viajes mas por ficha.
  // `?2` es quien lee (0 si no ha entrado), y es lo que decide si el boton sale pulsado.
  const { results } = await env.DB.prepare(
    `SELECT r.id, r.puntuacion, r.texto, r.foto, r.creado, r.usuario, u.nombre,
            (SELECT COUNT(*) FROM votos v WHERE v.resena = r.id) AS utiles,
            (SELECT COUNT(*) FROM votos v WHERE v.resena = r.id AND v.usuario = ?2) AS mio
       FROM resenas r JOIN usuarios u ON u.id = r.usuario
      WHERE r.producto = ?1 ORDER BY r.creado DESC LIMIT 100`)
    .bind(producto, yo ?? 0).all();

  // La media se calcula sobre las mismas filas que se envian: un contador guardado en
  // otra tabla acaba diciendo 4,8 cuando la lista visible dice 3,1.
  const media = results.length
    ? results.reduce((s, r) => s + r.puntuacion, 0) / results.length : null;
  return json({
    media,
    total: results.length,
    resenas: results.map(({ usuario, mio, ...r }) => ({
      ...r, mia: usuario === yo, votada: Boolean(mio), lector: usuario,
    })),
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

// La nota de los lectores de TODOS los productos que tienen alguna, en una consulta y un
// objeto. Existe porque las 30 tablas de categoria son HTML generado de noche y las
// resenas viven en D1: sin esto, la media de lectores solo existe dentro de la ficha, que
// es justo donde ya no hace falta para elegir.
//
// Se cachea cinco minutos en el borde: es un dato que cambia cuando alguien escribe una
// resena, no cuando alguien mira una tabla. Meterlo en el dataset del build seria mas
// barato aun y estaria congelado hasta la pasada siguiente, que son hasta 48 horas.
async function valoraciones(env) {
  const { results } = await env.DB.prepare(
    `SELECT producto, ROUND(AVG(puntuacion), 2) AS media, COUNT(*) AS n
       FROM resenas GROUP BY producto`).all();
  // [media, cuantas] y no {media, n}: son dos numeros por producto repetidos cientos de
  // veces, y las etiquetas pesan mas que los datos.
  return json(Object.fromEntries(results.map((r) => [r.producto, [r.media, r.n]])),
    200, { 'cache-control': 'public, max-age=300' });
}

// "Me ha sido util", que es lo unico que ordena las resenas sin que nadie modere: la que
// ayuda sube y la de tres palabras se queda donde esta.
//
// Es un interruptor, no un contador: la segunda pulsacion quita el voto. Devuelve la
// lista entera ya recalculada, como publicar(), para que el navegador no tenga que
// volver a pedirla.
async function util(request, env) {
  const id = await sesion(request, env);
  if (!id) return error('Hay que entrar para marcar una resena como util.', 401);
  const { resena } = await request.json();
  const rid = Number(resena);
  if (!Number.isInteger(rid)) return error('Falta la resena.');

  const fila = await env.DB.prepare('SELECT usuario, producto FROM resenas WHERE id = ?')
    .bind(rid).first();
  if (!fila) return error('Esa resena ya no existe.', 404);
  // Votarse a uno mismo es la forma mas facil de subir la propia resena a lo alto de la
  // ficha, y no cuesta nada impedirlo.
  if (fila.usuario === id) return error('Tu propia resena no puedes votarla.', 403);

  // DELETE ... RETURNING dice en el mismo viaje si habia voto que quitar. Un SELECT antes
  // para decidir serian dos viajes y una carrera entre ellos.
  const quitado = await env.DB.prepare(
    'DELETE FROM votos WHERE resena = ? AND usuario = ? RETURNING resena').bind(rid, id).first();
  if (!quitado) {
    await env.DB.prepare('INSERT INTO votos (resena, usuario) VALUES (?, ?)').bind(rid, id).run();
  }
  return await listar(request, env, fila.producto);
}

// El perfil publico de un lector: su nombre, desde cuando esta y lo que ha escrito.
//
// Le da al que escribe una razon para escribir la segunda resena, que es lo que mas falta
// hace cuando todavia hay pocas. El correo NO sale de aqui: es lo unico de la tabla de
// usuarios que no es publico, y una pagina que lo ensenase convertiria cada resena en una
// direccion recolectable.
async function lector(request, env) {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return error('Falta el lector.');
  const u = await env.DB.prepare('SELECT nombre, creado FROM usuarios WHERE id = ?')
    .bind(id).first();
  if (!u) return error('Ese lector no existe.', 404);

  const { results } = await env.DB.prepare(
    `SELECT r.id, r.producto, r.puntuacion, r.texto, r.foto, r.creado,
            (SELECT COUNT(*) FROM votos v WHERE v.resena = r.id) AS utiles
       FROM resenas r WHERE r.usuario = ? ORDER BY r.creado DESC LIMIT 50`).bind(id).all();
  const media = results.length
    ? results.reduce((s, r) => s + r.puntuacion, 0) / results.length : null;
  return json({ lector: { nombre: u.nombre, desde: String(u.creado).slice(0, 10) },
                media, total: results.length, resenas: results });
}

// --- Preguntas y respuestas de la ficha -------------------------------------------
// Lo que un lector quiere saber antes de comprar y no esta en la tabla nutricional: si
// sabe a algo, si el bote trae cuchara, si se apelmaza. Una tabla, un solo nivel de
// respuesta y nada mas: ver schema.sql.

const MAX_PREGUNTA = 700;

async function verPreguntas(request, env, producto = new URL(request.url).searchParams.get('producto')) {
  if (!producto) return error('Falta el producto.');
  const yo = await sesion(request, env);

  // El hilo entero en una consulta y el arbol se arma aqui: son como mucho 200 filas de
  // una ficha, y una consulta por pregunta serian veinte viajes a D1 por visita.
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.padre, p.texto, p.creado, p.usuario, u.nombre
       FROM preguntas p JOIN usuarios u ON u.id = p.usuario
      WHERE p.producto = ? ORDER BY p.creado LIMIT 200`).bind(producto).all();

  const mio = ({ usuario, ...r }) => ({ ...r, mia: usuario === yo, lector: usuario });
  const hilos = results.filter((r) => r.padre == null).map((r) => ({
    ...mio(r),
    // Las respuestas, en el orden en que se escribieron: es una conversacion.
    respuestas: results.filter((x) => x.padre === r.id).map(mio),
  }));
  // Las preguntas al reves: la ultima arriba, que es la que sigue sin contestar.
  return json({ preguntas: hilos.reverse(), total: results.length });
}

async function preguntar(request, env) {
  const id = await sesion(request, env);
  if (!id) return error('Hay que entrar para preguntar o responder.', 401);
  const { producto, texto, padre } = await request.json();
  const slug = String(producto ?? '');
  const limpio = String(texto ?? '').trim().slice(0, MAX_PREGUNTA);
  if (!slug) return error('Falta el producto.');
  if (limpio.length < 5) return error('Escribelo con un poco mas de detalle.');

  let padreId = null;
  if (padre != null) {
    padreId = Number(padre);
    const arriba = await env.DB.prepare('SELECT padre, producto FROM preguntas WHERE id = ?')
      .bind(padreId).first();
    // Un solo nivel, y dentro de la misma ficha. Sin esto, una respuesta puede colgar de
    // otra respuesta (y entonces no se pinta) o salir en un producto que no es el suyo.
    if (!arriba || arriba.padre != null || arriba.producto !== slug) {
      return error('Esa pregunta ya no esta.', 404);
    }
  }

  await env.DB.prepare(
    'INSERT INTO preguntas (usuario, producto, padre, texto) VALUES (?, ?, ?, ?)')
    .bind(id, slug, padreId, limpio).run();
  return await verPreguntas(request, env, slug);
}

// Toda la moderacion que hay, y llega: cada uno borra lo suyo y un administrador borra
// cualquier cosa. Una cola de revision con estados es para cuando entran cien mensajes al
// dia; para lo que hay, es una pantalla mas que mantener.
async function borrarPregunta(request, env) {
  const id = await sesion(request, env);
  if (!id) return error('Hay que entrar.', 401);
  const pid = Number((await request.json()).id);
  if (!Number.isInteger(pid)) return error('Falta la pregunta.');

  const fila = await env.DB.prepare('SELECT usuario, producto FROM preguntas WHERE id = ?')
    .bind(pid).first();
  if (!fila) return error('Eso ya no existe.', 404);
  if (fila.usuario !== id) {
    const u = await env.DB.prepare('SELECT email FROM usuarios WHERE id = ?').bind(id).first();
    if (!esAdmin(env.ADMINS, u?.email)) return error('Solo puedes borrar lo que escribes tu.', 403);
  }
  // Las respuestas se van con su pregunta por la cascada de la clave foranea.
  await env.DB.prepare('DELETE FROM preguntas WHERE id = ?').bind(pid).run();
  return await verPreguntas(request, env, fila.producto);
}

// --- Avisos de precio --------------------------------------------------------------
// "Escribeme si este bote baja de 25 EUR". Es lo unico de la web que sale a buscar al
// lector en vez de esperarle, y por eso lo unico que usa su correo de verdad.

async function misAlertas(request, env) {
  const id = await sesion(request, env);
  // Sin sesion no es un error: la ficha pregunta siempre y con esto no tiene que saber
  // antes si hay alguien dentro.
  if (!id) return json({ alertas: [] });
  const { results } = await env.DB.prepare(
    'SELECT producto, objetivo, avisado FROM alertas WHERE usuario = ? ORDER BY creado DESC')
    .bind(id).all();
  return json({ alertas: results });
}

async function alerta(request, env) {
  const id = await sesion(request, env);
  if (!id) return error('Hay que entrar para que podamos avisarte.', 401);
  const { producto, objetivo, borrar } = await request.json();
  const slug = String(producto ?? '');
  if (!slug) return error('Falta el producto.');

  if (borrar) {
    await env.DB.prepare('DELETE FROM alertas WHERE usuario = ? AND producto = ?')
      .bind(id, slug).run();
    return json({ ok: true, alerta: null });
  }

  const tope = Math.round(Number(objetivo) * 100) / 100;
  if (!(tope > 0) || tope > 100000) return error('Escribe a partir de que precio quieres el aviso.');

  // `avisado = NULL` al cambiar el objetivo: si ya se aviso a 30 EUR y ahora se pide a
  // 25, aquel aviso viejo no puede tapar el nuevo.
  await env.DB.prepare(
    `INSERT INTO alertas (usuario, producto, objetivo) VALUES (?, ?, ?)
     ON CONFLICT (usuario, producto) DO UPDATE
        SET objetivo = excluded.objetivo, avisado = NULL, creado = datetime('now')`)
    .bind(id, slug, tope).run();
  return json({ ok: true, alerta: { producto: slug, objetivo: tope, avisado: null } });
}

// El repaso. No lo llama un navegador: lo llama el robot de GitHub Actions cuando ya se
// ha publicado el sitio con los precios del dia (.github/workflows/alertas.yml).
//
// Por que no un cron de Cloudflare: Pages no tiene. El scraper ya vive en Actions, que si
// lo tiene, asi que el aviso se dispara desde donde ya hay reloj.
//
// Los precios NO se leen de D1 sino del catalogo publicado, que es exactamente el que ve
// el lector. Asi no hay dos verdades: si la web dice 24 EUR, el correo dice 24 EUR.
async function revisar(request, env) {
  // Sin clave configurada no se puede llamar. Una ruta que lee todas las alertas y manda
  // correos no puede quedarse abierta porque falte un secreto.
  if (!env.CRON_CLAVE || request.headers.get('authorization') !== `Bearer ${env.CRON_CLAVE}`) {
    return error('No autorizado.', 401);
  }

  const { results } = await env.DB.prepare(
    `SELECT a.usuario, a.producto, a.objetivo, a.avisado, u.email
       FROM alertas a JOIN usuarios u ON u.id = a.usuario`).all();
  if (results.length === 0) return json({ alertas: 0, avisos: 0, rearmadas: 0 });

  const origen = new URL(request.url).origin;
  const catalogo = await fetch(`${origen}/datos/catalogo.json`).then((r) => r.json());
  const precios = new Map(catalogo.productos.map((p) => [p.slug, p]));

  let avisos = 0;
  let rearmadas = 0;
  for (const a of results) {
    const p = precios.get(a.producto);
    // Un producto que hoy no esta en el catalogo no se toca ni se borra: las tiendas
    // quitan y devuelven referencias continuamente, y borrar la alerta a la primera
    // pasada en que no aparece es perderla para siempre por un mal dia de la tienda.
    if (!p || p.precio_eur == null) continue;

    if (p.precio_eur > a.objetivo) {
      // Ha vuelto a subir: la alerta se rearma y volvera a avisar la proxima bajada.
      if (a.avisado) {
        await env.DB.prepare('UPDATE alertas SET avisado = NULL WHERE usuario = ? AND producto = ?')
          .bind(a.usuario, a.producto).run();
        rearmadas++;
      }
      continue;
    }
    if (a.avisado) continue;   // ya avisado y sigue barato: no se repite

    // ponytail: los correos salen de uno en uno. Con las alertas que puede haber aqui son
    // unas pocas peticiones cada dos dias; si algun dia son cientos, el escalon es el
    // envio por lotes de Resend (/emails/batch), que acepta 100 en una peticion.
    const euros = (n) => n.toFixed(2).replace('.', ',');
    await enviarCorreo(env, a.email, `Ha bajado de precio: ${p.marca} ${p.nombre}`,
      `${p.marca} ${p.nombre} esta a ${euros(p.precio_eur)} EUR, por debajo de los `
      + `${euros(a.objetivo)} EUR que pediste.\n\n`
      + `${origen}/producto/${a.producto}\n\n`
      + `El precio es el de la ultima recogida; el bueno es siempre el de la tienda.\n`
      + `Para dejar de recibir este aviso, quitalo desde la ficha del producto.`);
    await env.DB.prepare(
      "UPDATE alertas SET avisado = datetime('now') WHERE usuario = ? AND producto = ?")
      .bind(a.usuario, a.producto).run();
    avisos++;
  }
  return json({ alertas: results.length, avisos, rearmadas });
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
  await enviarCorreo(env, correo, 'Recuperar tu contraseña en FitnessSupplementWiki',
    `Para poner una contraseña nueva, entra aquí:

${enlace}

El enlace caduca en una hora y solo sirve una vez.
Si no has pedido nada, ignora este correo: tu cuenta sigue como estaba.`);
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
export async function enviarCorreo(env, para, asunto, texto) {
  if (!env.RESEND_KEY || !env.CORREO_DESDE) {
    console.log(`[correo] Sin RESEND_KEY configurada. Para ${para} — ${asunto}
${texto}`);
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
      subject: asunto,
      text: texto,
    }),
  });
  // Un fallo del proveedor no se le cuenta a quien lo pidio: en el caso de la contrasena
  // la respuesta ya es siempre la misma, y decir "no se pudo enviar" volveria a delatar
  // que ese correo existe.
  if (!r.ok) console.log(`[correo] Resend ha fallado (${r.status}): ${await r.text()}`);
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
  // Votar es un clic y se hacen varios seguidos leyendo una ficha: el tope esta para
  // frenar un robot, no a quien lee.
  util: [120, 60],
  preguntas: [10, 60],    // escribir una pregunta o una respuesta
  pregunta: [20, 60],     // borrar la propia
  alerta: [30, 60],
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
