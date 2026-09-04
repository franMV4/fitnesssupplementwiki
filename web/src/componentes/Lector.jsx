import { useEffect, useState } from 'react';
import { comoSeLee } from '../datos/util.js';

// El perfil publico de quien escribe: su nombre, desde cuando esta y todas sus opiniones.
//
// Existe para el que escribe, no para el que lee: la segunda resena de alguien solo llega
// si la primera fue a algun sitio. Es la pieza mas barata de toda la lista (una consulta y
// una pagina) y la unica que le devuelve algo a quien se ha molestado en escribir.
//
// Una pagina estatica con el id en la query y no /lector/<id>: las paginas de esta web se
// generan en el build, y no se pueden generar 2.000 fichas de lector que todavia no
// existen. Es la misma solucion que /comparar o /mis-suplementos, y por lo mismo va
// noindex.

const estrellas = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);

export default function Lector() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) return setError('Falta el lector en la direccion.');
    fetch(`/api/lector?id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok || !d) throw new Error(d?.error ?? 'No se ha podido cargar este lector.');
        return d;
      })
      .then(setDatos)
      .catch((fallo) => setError(fallo.message));
  }, []);

  if (error) return <p className="vacio">{error}</p>;
  if (!datos) return <p className="sutil">Cargando…</p>;

  return (
    <>
      <section className="cabecera-pagina">
        <p className="antetitulo">Lector desde el {datos.lector.desde}</p>
        <h1>{datos.lector.nombre}</h1>
        <p className="entradilla">
          {datos.total === 0
            ? 'Todavia no ha escrito ninguna opinion.'
            : <>
                {datos.total} {datos.total === 1 ? 'opinion escrita' : 'opiniones escritas'},
                con una media de {datos.media.toFixed(1).replace('.', ',')} sobre 5.
              </>}
        </p>
      </section>

      <ul className="lista-resenas">
        {datos.resenas.map((r) => (
          <li className="resena" key={r.id}>
            <p className="cabecera-resena">
              <span className="astros" title={`${r.puntuacion} de 5`}>{estrellas(r.puntuacion)}</span>
              <a className="quien-resena" href={`/producto/${r.producto}`}>{comoSeLee(r.producto)}</a>
              <time className="mono sutil" dateTime={r.creado.replace(' ', 'T')}>{r.creado.slice(0, 10)}</time>
            </p>
            {r.texto && <p className="texto-resena">{r.texto}</p>}
            {r.foto && (
              <a href={`/api/foto/${r.foto}`} target="_blank" rel="noopener">
                <img className="foto-resena" src={`/api/foto/${r.foto}`} alt="Foto de la resena" loading="lazy" />
              </a>
            )}
            {r.utiles > 0 && (
              <p className="pie-resena">
                <span className="sutil">
                  {r.utiles} {r.utiles === 1 ? 'persona la ha' : 'personas la han'} encontrado util
                </span>
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
