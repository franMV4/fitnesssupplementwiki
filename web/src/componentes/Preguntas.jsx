import { useEffect, useState } from 'react';
import { pedir } from './api.js';

// Preguntas y respuestas de la ficha. Lo que alguien quiere saber antes de comprar y no
// esta en la tabla nutricional: si se apelmaza, si el sabor tapa, si el bote trae cuchara.
//
// Va debajo de las opiniones y no encima: una opinion la escribe quien ya lo ha comprado,
// y una pregunta la deja quien todavia no. Lo primero que tiene que ver el que llega es
// lo que dice quien ya lo tiene.
//
// Un solo nivel de respuesta, como en el servidor: se contesta a una pregunta, no a una
// respuesta. Un hilo de hilos pide sangrados, plegados y moderar discusiones, y esto es
// un tablon de dudas sobre un bote.

export default function Preguntas({ producto }) {
  const [datos, setDatos] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [texto, setTexto] = useState('');
  const [respondiendo, setRespondiendo] = useState(null);   // id de la pregunta abierta
  const [respuesta, setRespuesta] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetch(`/api/preguntas?producto=${encodeURIComponent(producto)}`)
      .then((r) => r.json()).then(setDatos)
      .catch(() => setDatos({ preguntas: [], total: 0 }));
    fetch('/api/yo').then((r) => r.json()).then((d) => setUsuario(d.usuario)).catch(() => {});
  }, [producto]);

  // Un solo envio para las dos cosas: una respuesta es una pregunta con padre, aqui y en
  // la base de datos.
  const enviar = async (e, padre = null) => {
    e.preventDefault();
    const cuerpo = padre == null ? texto : respuesta;
    if (cuerpo.trim().length < 5) return setError('Escribelo con un poco mas de detalle.');
    setError(''); setEnviando(true);
    try {
      setDatos(await pedir('/api/preguntas', { producto, texto: cuerpo, padre }));
      if (padre == null) setTexto('');
      else { setRespuesta(''); setRespondiendo(null); }
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setEnviando(false);
    }
  };

  const borrar = async (id) => {
    setError('');
    try {
      setDatos(await pedir('/api/pregunta', { id }));
    } catch (fallo) {
      setError(fallo.message);
    }
  };

  if (!datos) return <p className="sutil">Cargando preguntas…</p>;

  const vuelta = typeof location === 'undefined' ? '/' : location.pathname;

  return (
    <div className="preguntas">
      {usuario ? (
        <form className="form-pregunta" onSubmit={(e) => enviar(e)}>
          <div className="campo linea">
            <span>Tu pregunta sobre este producto</span>
            <textarea rows="2" maxLength="700" value={texto}
                      placeholder="Se apelmaza? Trae cuchara dosificadora?"
                      onChange={(e) => setTexto(e.target.value)}></textarea>
          </div>
          <p>
            <button className="boton primario" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Preguntar'}
            </button>
          </p>
        </form>
      ) : (
        <p className="accion-resena">
          <a className="boton" href={`/entrar?volver=${encodeURIComponent(vuelta)}`}>
            Entrar para preguntar <span className="flecha">→</span>
          </a>
        </p>
      )}

      {error && <p className="fallo-form">{error}</p>}

      {datos.preguntas.length === 0 ? (
        <p className="sutil">
          Nadie ha preguntado nada todavia sobre este producto. Si echas algo en falta en
          la ficha, preguntalo: lo que contesten los demas se queda aqui para el siguiente.
        </p>
      ) : (
        <ul className="lista-preguntas">
          {datos.preguntas.map((p) => (
            <li className="pregunta" key={p.id}>
              <p className="cabecera-resena">
                <a className="quien-resena" href={`/lector?id=${p.lector}`}>{p.nombre}</a>
                {p.mia && <span className="marca-mia">tu pregunta</span>}
                <time className="mono sutil" dateTime={p.creado.replace(' ', 'T')}>{p.creado.slice(0, 10)}</time>
              </p>
              <p className="texto-pregunta">{p.texto}</p>

              {p.respuestas.length > 0 && (
                <ul className="lista-respuestas">
                  {p.respuestas.map((r) => (
                    <li className="respuesta" key={r.id}>
                      <p className="cabecera-resena">
                        <a className="quien-resena" href={`/lector?id=${r.lector}`}>{r.nombre}</a>
                        {r.mia && <span className="marca-mia">tu respuesta</span>}
                        <time className="mono sutil" dateTime={r.creado.replace(' ', 'T')}>{r.creado.slice(0, 10)}</time>
                      </p>
                      <p className="texto-pregunta">{r.texto}</p>
                      {r.mia && (
                        <button type="button" className="enlace-accion peligro"
                                onClick={() => borrar(r.id)}>borrar</button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <p className="pie-resena">
                {usuario && (respondiendo === p.id
                  ? <button type="button" className="enlace-accion"
                            onClick={() => setRespondiendo(null)}>cancelar</button>
                  : <button type="button" className="enlace-accion"
                            onClick={() => { setRespondiendo(p.id); setRespuesta(''); }}>responder</button>)}
                {p.mia && (
                  <button type="button" className="enlace-accion peligro"
                          onClick={() => borrar(p.id)}>borrar</button>
                )}
              </p>

              {respondiendo === p.id && (
                <form className="form-pregunta" onSubmit={(e) => enviar(e, p.id)}>
                  <div className="campo linea">
                    <span>Tu respuesta</span>
                    <textarea rows="2" maxLength="700" value={respuesta} autoFocus
                              onChange={(e) => setRespuesta(e.target.value)}></textarea>
                  </div>
                  <p>
                    <button className="boton" disabled={enviando}>
                      {enviando ? 'Enviando…' : 'Responder'}
                    </button>
                  </p>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
