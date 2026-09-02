// Prueba de lo unico de la API que no se ve fallar a simple vista: las claves y la
// firma de la sesion. Si el hash o el HMAC se rompen, la web sigue pintando igual y
// entra cualquiera. El resto (guardar una resena, subir una foto) se ve en pantalla.
//
//   cd web && node --test
//
// Sin framework: node --test y node:assert vienen con node. Usa el mismo WebCrypto
// global que el runtime de Cloudflare, asi que prueba el codigo tal cual se despliega.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const api = await import('./functions/api/[[ruta]].js');
const env = { SECRETO: 'secreto-de-prueba' };

const conCookie = (v) => new Request('https://x/api/yo', { headers: { cookie: `s=${v}` } });

test('la clave correcta entra y la equivocada no', async () => {
  const guardado = await api.hashClave('correcto caballo bateria');
  assert.ok(await api.claveOk('correcto caballo bateria', guardado));
  assert.ok(!await api.claveOk('correcto caballo bateri', guardado));
});

test('la misma clave da hashes distintos: la sal es aleatoria', async () => {
  assert.notEqual(await api.hashClave('igual'), await api.hashClave('igual'));
});

test('la cookie firmada identifica al usuario', async () => {
  const dato = `7.${Date.now() + 60000}`;
  const firma = await api.firmar(env.SECRETO, dato);
  assert.equal(await api.sesion(conCookie(`${dato}.${firma}`), env), 7);
});

test('una cookie con el id cambiado a mano no vale', async () => {
  const dato = `7.${Date.now() + 60000}`;
  const firma = await api.firmar(env.SECRETO, dato);
  const suplantada = `1.${dato.split('.')[1]}.${firma}`;
  assert.equal(await api.sesion(conCookie(suplantada), env), null);
});

test('una cookie caducada no vale aunque la firma sea buena', async () => {
  const dato = `7.${Date.now() - 1000}`;
  const firma = await api.firmar(env.SECRETO, dato);
  assert.equal(await api.sesion(conCookie(`${dato}.${firma}`), env), null);
});

test('sin cookie no hay sesion', async () => {
  assert.equal(await api.sesion(new Request('https://x/api/yo'), env), null);
});

test('volver solo acepta rutas de esta web', () => {
  assert.equal(api.seguro('/producto/x'), '/producto/x');
  // Un redirector abierto convierte el login en una herramienta de phishing.
  assert.equal(api.seguro('https://otra.com'), '/');
  assert.equal(api.seguro('//otra.com'), '/');
  assert.equal(api.seguro(null), '/');
});

test('el cuerpo del id_token se lee con acentos y sin relleno', () => {
  const cuerpo = Buffer.from(JSON.stringify({ email: 'a@b.c', given_name: 'Jesús' }), 'utf8')
    .toString('base64url');
  assert.equal(api.jwtCuerpo(`x.${cuerpo}.y`).given_name, 'Jesús');
  assert.equal(api.jwtCuerpo('basura'), null);
});

// --- Recuperar la contrasena ---
// El enlace no se guarda en ninguna tabla: vale porque esta firmado con el hash de la
// clave de ese momento. Si esa cuenta se rompe, cualquiera entra en cualquier cuenta
// escribiendo un id en la URL, asi que aqui se comprueba entera.

test('el enlace de recuperar solo vale para su usuario y su clave', async () => {
  const guardado = await api.hashClave('la de antes');
  const caduca = Date.now() + 3600000;
  const bueno = await api.tokenClave(env.SECRETO, 5, guardado, caduca);
  assert.equal(bueno, await api.tokenClave(env.SECRETO, 5, guardado, caduca));

  // Cambiar el id a mano no cuela: la firma se calculo sobre el 5.
  const otroUsuario = await api.tokenClave(env.SECRETO, 9, guardado, caduca);
  assert.notEqual(bueno.split('.')[2], otroUsuario.split('.')[2]);

  // Y en cuanto la clave cambia, el enlace anterior deja de firmar igual: usarlo dos
  // veces, o usar uno viejo despues de cambiarla, ya no vale.
  const nueva = await api.hashClave('la de despues');
  assert.notEqual(bueno.split('.')[2],
    (await api.tokenClave(env.SECRETO, 5, nueva, caduca)).split('.')[2]);
});

test('sin RESEND_KEY no se llama a nadie, y con ella el correo va bien montado', async () => {
  const original = globalThis.fetch;
  let cuerpo = null;
  globalThis.fetch = async (_u, o) => { cuerpo = JSON.parse(o.body); return { ok: true }; };
  try {
    await api.enviarCorreo({ SECRETO: 'x' }, 'quien@sea.com', 'https://x/recuperar?t=1');
    assert.equal(cuerpo, null, 'sin clave de Resend no se envia nada');

    await api.enviarCorreo(
      { RESEND_KEY: 're_x', CORREO_DESDE: 'Web <no-reply@fitnesssupplementwiki.com>' },
      'quien@sea.com', 'https://x/recuperar?t=1');
    assert.equal(cuerpo.to, 'quien@sea.com');
    // El buzon del que sale no existe: quien conteste tiene que acabar en el de contacto.
    assert.equal(cuerpo.reply_to, 'franmunozvillanova@gmail.com');
    assert.ok(cuerpo.text.includes('https://x/recuperar?t=1'));
  } finally {
    globalThis.fetch = original;
  }
});

// pedir() vive en el navegador, pero lo unico que hay que probar de el es justo lo que no
// se ve: que un servidor mudo acaba en un mensaje y no en un boton girando para siempre.
test('pedir() se rinde si el servidor no contesta', async () => {
  const { pedir } = await import('./src/componentes/api.js');
  const original = globalThis.fetch;
  // Un servidor que acepta y calla: la promesa solo termina cuando aborta el propio fetch.
  globalThis.fetch = (_u, o) => new Promise((_, rechaza) => {
    o.signal.addEventListener('abort', () => rechaza(o.signal.reason));
  });
  try {
    await assert.rejects(() => pedir('/api/entrar', { email: 'a@b.c' }, 50),
      /El servidor no contesta/);
  } finally {
    globalThis.fetch = original;
  }
});

// --- Panel de administracion ---------------------------------------------------
// Quien entra en /admin sale del secreto ADMINS y de nada mas. Es la unica linea que
// separa "corregir el catalogo" de "cualquiera con cuenta corrige el catalogo", y si
// falla no se ve: la pantalla se pinta igual.
test('solo los correos de ADMINS son administradores', () => {
  const lista = 'jefa@ejemplo.com, otro@ejemplo.com';
  assert.ok(api.esAdmin(lista, 'jefa@ejemplo.com'));
  assert.ok(api.esAdmin(lista, 'JEFA@Ejemplo.com'));      // el correo no distingue cajas
  assert.ok(api.esAdmin('  jefa@ejemplo.com  ', 'jefa@ejemplo.com'));
  assert.ok(!api.esAdmin(lista, 'jefa@ejemplo.com.evil.com'));
  assert.ok(!api.esAdmin(lista, 'colada@ejemplo.com'));
  // Sin el secreto puesto no hay administradores: es el unico valor por defecto que
  // no abre el panel entero por olvidarse de configurar algo.
  assert.ok(!api.esAdmin(undefined, 'jefa@ejemplo.com'));
  assert.ok(!api.esAdmin('', 'jefa@ejemplo.com'));
  // Y una cuenta sin correo tampoco cuela contra una lista vacia.
  assert.ok(!api.esAdmin('', ''));
  assert.ok(!api.esAdmin(lista, ''));
});

// --- Limite de peticiones ------------------------------------------------------
// Si esto deja de contar, la web sigue funcionando igual de bien para quien la usa y se
// queda abierta de par en par para quien prueba contrasenas. No se ve fallar: por eso
// se prueba.
//
// D1 de mentira: guarda el contador en un Map y devuelve lo que devolveria el
// ON CONFLICT ... RETURNING n de verdad.
const d1Falsa = () => {
  const filas = new Map();
  const borrados = [];
  return {
    filas,
    borrados,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              const k = args.join('|');
              filas.set(k, (filas.get(k) ?? 0) + 1);
              return { n: filas.get(k) };
            },
            async run() { borrados.push({ sql, args }); },
          };
        },
      };
    },
  };
};

test('el limite deja pasar hasta el tope y corta despues', async () => {
  const db = d1Falsa();
  const sinAzar = () => 1;                       // nunca toca limpiar
  // entrar: 20 intentos por ventana de 15 minutos.
  const intento = () => api.dentroDelLimite(db, '203.0.113.7', 'entrar', 0, sinAzar);
  for (let i = 1; i <= 20; i++) assert.ok(await intento(), `el intento ${i} tenia que pasar`);
  assert.ok(!await intento(), 'el 21 tenia que cortarse');

  // Otra IP no hereda el castigo de la primera.
  assert.ok(await api.dentroDelLimite(db, '203.0.113.8', 'entrar', 0, sinAzar));
  // Y la ventana siguiente empieza de cero: 15 minutos despues.
  assert.ok(await api.dentroDelLimite(db, '203.0.113.7', 'entrar', 15 * 60000, sinAzar));
});

test('el limite no se aplica donde no debe', async () => {
  const db = d1Falsa();
  // Una ruta sin tope configurado (salir, yo) no se cuenta.
  for (let i = 0; i < 50; i++) {
    assert.ok(await api.dentroDelLimite(db, '203.0.113.7', 'salir', 0, () => 1));
  }
  // Sin IP tampoco: en el servidor de desarrollo no llega la cabecera de Cloudflare, y
  // contar todo bajo la misma clave vacia dejaria sin login a la maquina entera.
  for (let i = 0; i < 50; i++) {
    assert.ok(await api.dentroDelLimite(db, null, 'entrar', 0, () => 1));
  }
  assert.equal(db.filas.size, 0);
});

test('un fallo de la base de datos deja pasar, no cierra la puerta', async () => {
  const rota = { prepare() { throw new Error('D1 caida'); } };
  // Fallar cerrado convertiria un mal minuto de D1 en "nadie puede entrar en la web".
  assert.ok(await api.dentroDelLimite(rota, '203.0.113.7', 'entrar'));
});

test('los tramos viejos se barren de vez en cuando', async () => {
  const db = d1Falsa();
  await api.dentroDelLimite(db, '203.0.113.7', 'entrar', 0, () => 0);   // siempre limpia
  assert.equal(db.borrados.length, 1);
  assert.match(db.borrados[0].sql, /DELETE FROM intentos/);
  // Barre lo de hace mas de un dia, no el tramo en curso.
  assert.ok(db.borrados[0].args[0] < api.tramo(1, 0));
});
