import { useEffect, useState } from 'react';

// Resenas de lectores en la ficha de producto. Es la unica parte de la web que escribe
// en una base de datos: el resto es HTML generado en build. Todo pasa por /api/*, que
// vive en functions/api/[[ruta]].js.
//
// La media de lectores NO se publica como aggregateRating en el JSON-LD de la ficha:
// esa pagina es estatica y se genera cada noche, asi que el marcado diria una nota de
// hace horas. Lo que Google lee sigue siendo la resena editorial; esto es para el que
// lee, no para el buscador.

const MAX_LADO = 1400;
const ESTRELLAS = [1, 2, 3, 4, 5];

const estrellas = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);

// El movil saca fotos de 8 MB y el limite del servidor son 2. Redimensionar en el
// navegador convierte "tu foto es demasiado grande" en una subida que simplemente
// funciona. Si el navegador no puede, se manda el original y decide el servidor.
async function encoger(archivo) {
  try {
    const img = await createImageBitmap(archivo);
    const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
    const lienzo = new OffscreenCanvas(Math.round(img.width * escala), Math.round(img.height * escala));
    lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
    return await lienzo.convertToBlob({ type: 'image/jpeg', quality: 0.82 });
  } catch {
    return archivo;
  }
}

export default function Resenas({ producto }) {
  const [datos, setDatos] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [nota, setNota] = useState(0);
  const [texto, setTexto] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const recargar = () => fetch(`/api/resenas?producto=${encodeURIComponent(producto)}`)
    .then((r) => r.json()).then(setDatos)
    .catch(() => setDatos({ resenas: [], total: 0, media: null }));

  useEffect(() => {
    recargar();
    fetch('/api/yo').then((r) => r.json()).then((d) => setUsuario(d.usuario)).catch(() => {});
  }, [producto]);

  // Al entrar, la resena propia (si ya existe) rellena el formulario: la segunda vez
  // se corrige la que hay, no se escribe una nueva que el servidor iba a rechazar.
  const mia = datos?.resenas?.find((r) => r.mia);
  useEffect(() => {
    if (mia && !nota) { setNota(mia.puntuacion); setTexto(mia.texto); }
  }, [mia]);

  const salir = async () => {
    await fetch('/api/salir', { method: 'POST' });
    setUsuario(null); setNota(0); setTexto(''); setArchivo(null);
    recargar();
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!nota) return setError('Elige cuantas estrellas le das.');
    setError(''); setEnviando(true);
    const f = new FormData();
    f.set('producto', producto);
    f.set('puntuacion', String(nota));
    f.set('texto', texto);
    if (archivo) f.set('foto', await encoger(archivo), 'foto.jpg');
    const r = await fetch('/api/resenas', { method: 'POST', body: f });
    const d = await r.json();
    setEnviando(false);
    if (!r.ok) return setError(d.error);
    setDatos(d); setArchivo(null);
  };

  if (!datos) return <p className="sutil">Cargando opiniones…</p>;

  const vuelta = typeof location === 'undefined' ? '/' : location.pathname;

  return (
    <div className="resenas">
      <p className="media-lectores">
        {datos.total === 0
          ? <span className="sutil">Todavia no hay opiniones de lectores. La primera puede ser la tuya.</span>
          : <>
              <b className="num-media">{datos.media.toFixed(1).replace('.', ',')}</b>
              <span className="de5">/5</span>
              <span className="astros" aria-hidden="true">{estrellas(Math.round(datos.media))}</span>
              <span className="sutil">{datos.total} {datos.total === 1 ? 'opinion' : 'opiniones'} de lectores</span>
            </>}
      </p>

      {usuario ? (
        <form className="form-resena" onSubmit={enviar}>
          <p className="quien">
            Escribes como <b>{usuario.nombre}</b>.
            <button type="button" className="enlace-accion" onClick={salir}>Salir</button>
          </p>

          <div className="campo">
            <span id={`et-${producto}`}>Tu puntuacion</span>
            <div className="mando-estrellas" role="group" aria-labelledby={`et-${producto}`}>
              {ESTRELLAS.map((n) => (
                <button type="button" key={n} className={`astro ${n <= nota ? 'on' : ''}`}
                        aria-label={`${n} de 5`} aria-pressed={n === nota}
                        onClick={() => setNota(n)}>★</button>
              ))}
            </div>
          </div>

          <div className="campo linea">
            <span>Tu resena (opcional)</span>
            <textarea rows="4" maxLength="1500" value={texto}
                      placeholder="Sabor, disolucion, si repetirias…"
                      onChange={(e) => setTexto(e.target.value)}></textarea>
          </div>

          <div className="campo linea">
            <span>Foto del producto (opcional)</span>
            <input type="file" accept="image/*" onChange={(e) => setArchivo(e.target.files[0] ?? null)} />
          </div>

          {error && <p className="fallo-form">{error}</p>}
          <p>
            <button className="boton primario" disabled={enviando}>
              {enviando ? 'Enviando…' : mia ? 'Actualizar mi resena' : 'Publicar resena'}
            </button>
          </p>
        </form>
      ) : (
        // Un enlace a /entrar, no el formulario montado aqui: el acceso vive en su
        // pagina y no en las 2.665 fichas. `volver` trae de vuelta a esta misma ficha.
        <p className="accion-resena">
          <a className="boton primario" href={`/entrar?volver=${encodeURIComponent(vuelta)}`}>
            Entrar <span className="flecha">→</span>
          </a>
        </p>
      )}

      <ul className="lista-resenas">
        {datos.resenas.map((r) => (
          <li className="resena" key={r.id}>
            <p className="cabecera-resena">
              <span className="astros" title={`${r.puntuacion} de 5`}>{estrellas(r.puntuacion)}</span>
              <b>{r.nombre}</b>
              {r.mia && <span className="marca-mia">tu resena</span>}
              <time className="mono sutil" dateTime={r.creado.replace(' ', 'T')}>{r.creado.slice(0, 10)}</time>
            </p>
            {r.texto && <p className="texto-resena">{r.texto}</p>}
            {r.foto && (
              <a href={`/api/foto/${r.foto}`} target="_blank" rel="noopener">
                <img className="foto-resena" src={`/api/foto/${r.foto}`} alt={`Foto de ${r.nombre}`} loading="lazy" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
