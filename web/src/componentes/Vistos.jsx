import { useEffect, useState } from 'react';
import { apuntarVisto } from '../datos/util.js';

// Los ultimos productos que ha mirado el lector, al pie de la ficha. Existe para lo mismo
// que existe el enlace de volver a la categoria: una ficha es un callejon sin salida, y
// esta es la unica forma de volver a "aquel bote de hace tres paginas" sin acordarse de
// como se llamaba.
//
// Se apunta y se lee en el navegador, sin servidor: donde ha estado alguien no es un dato
// que esta web necesite tener.

export default function Vistos({ slug, nombre }) {
  const [vistos, setVistos] = useState([]);

  // Apuntar el actual y pintar los demas es el mismo paso: `apuntarVisto` devuelve la
  // lista ya con este delante, y de ahi se quita el que se esta leyendo.
  useEffect(() => {
    setVistos(apuntarVisto({ s: slug, n: nombre }).filter((v) => v.s !== slug));
  }, [slug]);

  if (vistos.length === 0) return null;

  return (
    <nav className="vistos" aria-label="Productos que has visto antes">
      <p className="rotulo-vistos">Antes has mirado</p>
      <ul>
        {vistos.map((v) => (
          <li key={v.s}><a href={`/producto/${v.s}`}>{v.n}</a></li>
        ))}
      </ul>
    </nav>
  );
}
