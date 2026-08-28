import { useEffect, useState } from 'react';

// Entrar y registrarse. Un solo componente para los tres sitios donde hace falta:
// /entrar, /registro y el hueco de la ficha de producto cuando el lector aun no tiene
// cuenta. Tres formularios iguales mantenidos por separado acaban siendo tres
// formularios distintos.
//
// - En las paginas sueltas lleva `volver`: al entrar, se vuelve a donde se estaba.
// - Dentro de la ficha lleva `onListo`: no se navega a ningun sitio, se avisa a quien
//   lo monto para que recargue las resenas sin recargar la pagina.
//
// El campo se sigue llamando `clave` porque asi se llama la columna de D1 y asi lo
// espera la API. Lo que lee el lector es "contrasena": el nombre del dato y la palabra
// de la pantalla no tienen por que ser el mismo.

const GOOGLE = (
  <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
    <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.3-.2-1.9H9v3.5h4.8a4.1 4.1 0 0 1-1.8 2.7v2.3h3c1.7-1.6 2.7-4 2.7-6.6z" />
    <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-3-2.3c-.8.6-1.9.9-3 .9-2.3 0-4.3-1.6-5-3.7H.9v2.4A9 9 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M4 10.7a5.4 5.4 0 0 1 0-3.4V4.9H.9a9 9 0 0 0 0 8.2l3.1-2.4z" />
    <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 4.9L4 7.3C4.7 5.2 6.7 3.6 9 3.6z" />
  </svg>
);

export default function Acceso({ modo: inicial = 'entrar', volver = null, onListo = null }) {
  const [modo, setModo] = useState(inicial);
  const [estado, setEstado] = useState(null);     // { usuario, google }
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verClave, setVerClave] = useState(false);

  useEffect(() => {
    fetch('/api/yo').then((r) => r.json()).then(setEstado)
      .catch(() => setEstado({ usuario: null, google: false }));
  }, []);

  const enviar = async (e) => {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.target));
    // El repetido no viaja a ningun sitio: se guarda una contrasena, no dos, y
    // compararlas aqui es todo lo que ese campo tiene que hacer.
    const repetida = datos.clave2;
    delete datos.clave2;
    if (modo === 'registro' && datos.clave !== repetida) {
      return setError('Las dos contraseñas no coinciden.');
    }
    setError(''); setEnviando(true);
    const r = await fetch(`/api/${modo}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const d = await r.json();
    setEnviando(false);
    if (!r.ok) return setError(d.error);
    if (onListo) return onListo(d.usuario);
    location.href = volver || '/';
  };

  const salir = async () => {
    await fetch('/api/salir', { method: 'POST' });
    setEstado({ ...estado, usuario: null });
  };

  // Derecho de supresion (RGPD art. 17). Va aqui, a un clic de la sesion abierta, y no
  // en una direccion de correo a la que escribir: borrar tiene que costar lo mismo que
  // registrarse. El confirm() del navegador basta; una ventana propia para preguntar
  // "seguro?" es una pantalla mas que mantener y dice exactamente lo mismo.
  const borrarme = async () => {
    if (!confirm('Se borra tu cuenta, tus resenas y tus fotos. No se puede deshacer.')) return;
    const r = await fetch('/api/borrarme', { method: 'POST' });
    if (r.ok) setEstado({ ...estado, usuario: null });
    else setError('No se ha podido borrar la cuenta. Prueba otra vez.');
  };

  if (!estado) {
    return (
      <div className="acceso acceso-espera" aria-busy="true">
        <p className="sutil">Un momento…</p>
      </div>
    );
  }

  // Ya dentro. Solo pasa en /entrar y /registro: en la ficha, quien tiene cuenta ve el
  // formulario de la resena y no llega aqui.
  if (estado.usuario) {
    return (
      <div className="acceso acceso-dentro">
        <p className="antetitulo">Sesion abierta</p>
        <p className="nombre-dentro">{estado.usuario.nombre}</p>
        <p className="acciones-acceso">
          <a className="boton primario" href={volver || '/'}>Volver <span className="flecha">→</span></a>
          <button type="button" className="enlace-accion" onClick={salir}>Salir de la cuenta</button>
        </p>
        <p className="letra-pequena">
          <button type="button" className="enlace-accion peligro" onClick={borrarme}>
            Borrar mi cuenta y mis resenas
          </button>
          {' '}Se borra todo: el correo, las resenas y las fotos. Es inmediato y no se
          puede deshacer.
        </p>
        {/* Si el borrado falla hay que decirlo AQUI: el aviso de error del formulario
            esta en la otra rama del componente y esta pantalla no lo pinta. */}
        {error && <p className="fallo-form" role="alert">{error}</p>}
      </div>
    );
  }

  const registrando = modo === 'registro';
  const cambiar = (a) => { setModo(a); setError(''); setVerClave(false); };

  return (
    <div className="acceso">
      {/* Dos pestanas pegadas compartiendo filete, como el grupo de chips de la tabla:
          un mando de imprenta, no dos botones sueltos. Sustituyen al "no tengo cuenta"
          del final, que obligaba a leerse el formulario entero para descubrir que se
          estaba en el equivocado. */}
      <div className="mando-acceso" role="group" aria-label="Entrar o crear cuenta">
        <button type="button" onClick={() => cambiar('entrar')} aria-pressed={!registrando}>Entrar</button>
        <button type="button" onClick={() => cambiar('registro')} aria-pressed={registrando}>Crear cuenta</button>
      </div>

      <div className="acceso-cuerpo">
        {/* Un enlace y no un boton con fetch: OAuth es una navegacion, el navegador
            tiene que salir de esta web e ir a la de Google. Sin credenciales el boton
            sale igual, apagado y diciendo por que: cuando desaparecia entero no habia
            forma de distinguir "no existe" de "esta sin configurar". */}
        {estado.google ? (
          <a className="boton-google" href={`/api/google?volver=${encodeURIComponent(volver || '/')}`}>
            {GOOGLE}{registrando ? 'Crear cuenta con Google' : 'Continuar con Google'}
          </a>
        ) : (
          <>
            <button type="button" className="boton-google" disabled>
              {GOOGLE}Continuar con Google
            </button>
            <p className="sutil nota-google">Pendiente de configurar en este servidor. Entra con tu correo.</p>
          </>
        )}
        <p className="separador-o"><span>o con tu correo</span></p>

        <form onSubmit={enviar}>
          {registrando && (
            <label className="campo ancho">
              <span>Nombre público</span>
              <input name="nombre" required minLength="2" maxLength="40" autoComplete="nickname"
                     placeholder="El que verán los demás" />
            </label>
          )}
          <label className="campo ancho">
            <span>Correo electrónico</span>
            <input name="email" type="email" required autoComplete="email" placeholder="nombre@correo.com" />
          </label>
          <label className="campo ancho">
            <span>Contraseña</span>
            <span className="campo-clave">
              <input name="clave" type={verClave ? 'text' : 'password'} required minLength="8"
                     autoComplete={registrando ? 'new-password' : 'current-password'}
                     placeholder={registrando ? 'Mínimo 8 caracteres' : undefined} />
              {/* Un solo pulsador para los dos campos: se escriben a la vez y se
                  comprueban a la vez. */}
              <button type="button" className="ver-clave" onClick={() => setVerClave(!verClave)}
                      aria-pressed={verClave}>{verClave ? 'Ocultar' : 'Ver'}</button>
            </span>
          </label>
          {registrando && (
            <label className="campo ancho">
              <span>Repite la contraseña</span>
              <span className="campo-clave">
                <input name="clave2" type={verClave ? 'text' : 'password'} required minLength="8"
                       autoComplete="new-password" placeholder="La misma otra vez" />
              </span>
            </label>
          )}

          {error && <p className="fallo-form" role="alert">{error}</p>}

          <p className="acciones-acceso">
            <button className="boton primario" disabled={enviando}>
              {enviando ? 'Un momento…' : registrando ? 'Crear cuenta' : 'Entrar'}
              {!enviando && <span className="flecha">→</span>}
            </button>
          </p>
          {registrando && (
            <p className="sutil letra-pequena">
              Solo se publica tu nombre, nunca el correo. La contraseña se guarda cifrada y nadie,
              tampoco quien lleva esta web, puede leerla.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
