import { useEffect, useState } from 'react';
import { eur } from '../datos/util.js';
import { pedir } from './api.js';

// "Avisame si baja de 25 EUR". Lo unico de esta web que sale a buscar al lector: el resto
// espera a que vuelva.
//
// Necesita cuenta, y esta es la unica funcion que la necesita de verdad: sin un correo no
// hay a donde mandar el aviso. Por eso el boton de entrar sale aqui explicando para que,
// y no como un muro delante de un formulario.
//
// El precio sugerido es un 10 % por debajo del de hoy: casi nadie sabe de memoria a que
// precio le compensaria, y una casilla vacia es una decision mas que tomar. Se puede
// cambiar, claro.

export default function Alerta({ producto, precio }) {
  const [mia, setMia] = useState(null);        // null = todavia no se sabe
  const [usuario, setUsuario] = useState(null);
  const [objetivo, setObjetivo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetch('/api/yo').then((r) => r.json()).then((d) => setUsuario(d.usuario)).catch(() => {});
    fetch('/api/alertas').then((r) => r.json())
      .then((d) => setMia(d.alertas.find((a) => a.producto === producto) ?? false))
      .catch(() => setMia(false));
  }, [producto]);

  useEffect(() => {
    if (objetivo === '') {
      setObjetivo(mia ? String(mia.objetivo) : precio ? (precio * 0.9).toFixed(2) : '');
    }
  }, [mia, precio]);

  if (mia === null || !precio) return null;

  const guardar = async (e) => {
    e.preventDefault();
    setError(''); setEnviando(true);
    try {
      const d = await pedir('/api/alerta', { producto, objetivo: Number(objetivo.replace(',', '.')) });
      setMia(d.alerta);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setEnviando(false);
    }
  };

  const quitar = async () => {
    setError(''); setEnviando(true);
    try {
      await pedir('/api/alerta', { producto, borrar: true });
      setMia(false);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setEnviando(false);
    }
  };

  const vuelta = typeof location === 'undefined' ? '/' : location.pathname;

  return (
    <div className="aviso-precio">
      <p className="rotulo-calc">Aviso de precio</p>

      {!usuario ? (
        <p className="sutil">
          Hoy cuesta {eur(precio)}. Si entras con tu cuenta, te escribimos cuando baje del
          precio que tu digas.{' '}
          <a className="enlace-accion" href={`/entrar?volver=${encodeURIComponent(vuelta)}`}>entrar →</a>
        </p>
      ) : mia ? (
        <>
          <p className="cuentas-dosis">
            <span>Te avisamos si baja de <b>{eur(mia.objetivo)}</b></span>
            <span className="sutil">
              {mia.avisado
                ? `ya te avisamos el ${mia.avisado.slice(0, 10)}; volveremos a hacerlo si sube y baja otra vez`
                : `hoy esta a ${eur(precio)}`}
            </span>
          </p>
          <p>
            <button type="button" className="boton" disabled={enviando} onClick={quitar}>
              Quitar el aviso
            </button>
          </p>
        </>
      ) : (
        <form onSubmit={guardar}>
          <label className="campo">
            <span>Avisame si baja de</span>
            {/* step="0.01" porque esto es un precio y el sugerido lleva dos decimales.
                Con el step a 0,5 que habia aqui, 12,60 era "invalido" para el navegador:
                bloqueaba el envio sin decir por que y el boton no hacia nada. */}
            <input type="number" min="0.5" step="0.01" inputMode="decimal" value={objetivo}
                   onChange={(e) => setObjetivo(e.target.value)} />
          </label>
          <p>
            <button className="boton" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Avisarme por correo'}
            </button>
          </p>
        </form>
      )}

      {error && <p className="fallo-form">{error}</p>}
    </div>
  );
}
