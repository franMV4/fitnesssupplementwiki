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
