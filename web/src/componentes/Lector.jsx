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

const T = {
  es: { falta: 'Falta el lector en la direccion.', noCarga: 'No se ha podido cargar este lector.',
        cargando: 'Cargando…', desde: (f) => `Lector desde el ${f}`, ninguna: 'Todavia no ha escrito ninguna opinion.',
        escritas: (n) => (n === 1 ? 'opinion escrita' : 'opiniones escritas'), media: (m) => `con una media de ${m} sobre 5.`,
        de5: (n) => `${n} de 5`, foto: 'Foto de la resena',
        utiles: (n) => (n === 1 ? 'persona la ha encontrado util' : 'personas la han encontrado util') },
  en: { falta: 'The reader is missing from the address.', noCarga: 'This reader could not be loaded.',
        cargando: 'Loading…', desde: (f) => `Reader since ${f}`, ninguna: 'Has not written any reviews yet.',
        escritas: (n) => (n === 1 ? 'review written' : 'reviews written'), media: (m) => `with an average of ${m} out of 5.`,
        de5: (n) => `${n} out of 5`, foto: 'Review photo',
        utiles: (n) => (n === 1 ? 'person found it helpful' : 'people found it helpful') },
  fr: { falta: 'Le lecteur manque dans l’adresse.', noCarga: 'Impossible de charger ce lecteur.',
        cargando: 'Chargement…', desde: (f) => `Lecteur depuis le ${f}`, ninguna: 'N’a encore écrit aucun avis.',
        escritas: (n) => (n === 1 ? 'avis écrit' : 'avis écrits'), media: (m) => `avec une moyenne de ${m} sur 5.`,
        de5: (n) => `${n} sur 5`, foto: 'Photo de l’avis',
        utiles: (n) => (n === 1 ? 'personne l’a trouvé utile' : 'personnes l’ont trouvé utile') },
};

export default function Lector({ lang = 'es' }) {
  const t = T[lang] ?? T.es;
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) return setError(t.falta);
    fetch(`/api/lector?id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok || !d) throw new Error(d?.error ?? t.noCarga);
        return d;
      })
      .then(setDatos)
      .catch((fallo) => setError(fallo.message));
  }, []);

  if (error) return <p className="vacio">{error}</p>;
  if (!datos) return <p className="sutil">{t.cargando}</p>;

  return (
    <>
      <section className="cabecera-pagina">
        <p className="antetitulo">{t.desde(datos.lector.desde)}</p>
        <h1>{datos.lector.nombre}</h1>
        <p className="entradilla">
          {datos.total === 0
            ? t.ninguna
            : <>
                {datos.total} {t.escritas(datos.total)},{' '}
                {t.media(lang === 'en' ? datos.media.toFixed(1) : datos.media.toFixed(1).replace('.', ','))}
              </>}
        </p>
      </section>

      <ul className="lista-resenas">
        {datos.resenas.map((r) => (
          <li className="resena" key={r.id}>
            <p className="cabecera-resena">
              <span className="astros" title={t.de5(r.puntuacion)}>{estrellas(r.puntuacion)}</span>
              <a className="quien-resena" href={`/producto/${r.producto}/`}>{comoSeLee(r.producto)}</a>
              <time className="mono sutil" dateTime={r.creado.replace(' ', 'T')}>{r.creado.slice(0, 10)}</time>
            </p>
            {r.texto && <p className="texto-resena">{r.texto}</p>}
            {r.foto && (
              <a href={`/api/foto/${r.foto}`} target="_blank" rel="noopener">
                <img className="foto-resena" src={`/api/foto/${r.foto}`} alt={t.foto} loading="lazy" />
              </a>
            )}
            {r.utiles > 0 && (
              <p className="pie-resena">
                <span className="sutil">
                  {r.utiles} {t.utiles(r.utiles)}
                </span>
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
