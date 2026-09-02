import { useEffect, useState } from 'react';
import { pedir, destino } from './api.js';

// Recuperar la contrasena. Un componente y no dos porque son los dos pasos del mismo
// tramite y comparten pantalla, estilos y manejo de errores: sin `?t=` se pide el
// enlace, con `?t=` se escribe la clave nueva.
//
// El token se lee del navegador y no de props: la pagina se genera en build y alli la
// URL todavia no tiene query.

export default function Recuperar() {
  const [token, setToken] = useState(null);   // null = aun sin leer la URL
  const [vuelta, setVuelta] = useState('/');
  const [error, setError] = useState('');
  const [pedido, setPedido] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [verClave, setVerClave] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(location.search).get('t') ?? '');
    setVuelta(destino('/'));
  }, []);

  const pedirEnlace = async (e) => {
    e.preventDefault();
    setError(''); setEnviando(true);
    try {
      await pedir('/api/olvide', { email: new FormData(e.target).get('email') });
      setPedido(true);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setEnviando(false);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.target));
    if (datos.clave !== datos.clave2) return setError('Las dos contraseñas no coinciden.');
    setError(''); setEnviando(true);
    try {
      await pedir('/api/restablecer', { token, clave: datos.clave });
      location.href = vuelta;
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setEnviando(false);
    }
  };

  if (token === null) {
    return (
      <div className="acceso acceso-espera" aria-busy="true">
        <p className="sutil">Un momento…</p>
      </div>
    );
  }

  // Paso 2: se llego desde el correo.
  if (token) {
    return (
      <div className="acceso">
        <div className="acceso-cuerpo">
          <p className="sutil">Escribe la contraseña nueva. Al guardarla entrarás directamente.</p>
          <form onSubmit={guardar}>
            <label className="campo ancho">
              <span>Contraseña nueva</span>
              <span className="campo-clave">
                <input name="clave" type={verClave ? 'text' : 'password'} required minLength="8"
                       autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
                <button type="button" className="ver-clave" onClick={() => setVerClave(!verClave)}
                        aria-pressed={verClave}>{verClave ? 'Ocultar' : 'Ver'}</button>
              </span>
            </label>
            <label className="campo ancho">
              <span>Repite la contraseña</span>
              <span className="campo-clave">
                <input name="clave2" type={verClave ? 'text' : 'password'} required minLength="8"
                       autoComplete="new-password" placeholder="La misma otra vez" />
              </span>
            </label>

            {error && <p className="fallo-form" role="alert">{error}</p>}

            <p className="acciones-acceso">
              <button className="boton primario" disabled={enviando}>
                {enviando ? 'Un momento…' : 'Guardar y entrar'}
                {!enviando && <span className="flecha">→</span>}
              </button>
              <a className="enlace-accion" href="/recuperar">Pedir otro enlace</a>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Paso 1: pedir el enlace. El mensaje de despues es el mismo exista o no la cuenta,
  // igual que la respuesta de la API: si aqui dijese "ese correo no esta registrado",
  // el formulario seria un comprobador de cuentas ajenas.
  if (pedido) {
    return (
      <div className="acceso">
        <div className="acceso-cuerpo">
          <p className="antetitulo">Mira tu correo</p>
          <p>Si esa dirección tiene una cuenta con contraseña, acabas de recibir un enlace para
             cambiarla. Caduca en una hora.</p>
          <p className="sutil">¿No llega? Mira en spam, o vuelve a pedirlo. Si creaste la cuenta
             con Google no hay contraseña que recuperar: entra con el botón de Google.</p>
          <p className="acciones-acceso">
            <a className="boton primario" href={`/entrar?volver=${encodeURIComponent(vuelta)}`}>
              Volver a entrar <span className="flecha">→</span>
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="acceso">
      <div className="acceso-cuerpo">
        <p className="sutil">Escribe el correo con el que te registraste y te mandamos un enlace
           para poner una contraseña nueva.</p>
        <form onSubmit={pedirEnlace}>
          <label className="campo ancho">
            <span>Correo electrónico</span>
            <input name="email" type="email" required autoComplete="email"
                   placeholder="nombre@correo.com" />
          </label>

          {error && <p className="fallo-form" role="alert">{error}</p>}

          <p className="acciones-acceso">
            <button className="boton primario" disabled={enviando}>
              {enviando ? 'Un momento…' : 'Enviar enlace'}
              {!enviando && <span className="flecha">→</span>}
            </button>
            <a className="enlace-accion" href={`/entrar?volver=${encodeURIComponent(vuelta)}`}>
              Volver a entrar
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
