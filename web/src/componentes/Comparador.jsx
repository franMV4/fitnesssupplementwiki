import { useEffect, useState } from 'react';
import { TIENDAS, UNIDAD, eur, guardarSeleccion, leerSeleccion } from '../datos/util.js';

// La comparativa que arma el lector: los productos que ha ido guardando desde las tablas,
// enfrentados fila a fila.
//
// No viaja ningun dato en el HTML de esta pagina: la seleccion vive en el navegador y los
// datos se piden a /datos/<categoria>.json, que ya existia para que otros citen el
// ranking. Asi esta pagina es una mas de las estaticas (no depende del dataset en build)
// y no hay una segunda copia del catalogo que mantener.
//
// Los productos se agrupan por categoria porque las unidades no se mezclan: comparar
// EUR/kg de un polvo con EUR/capsula de unas perlas es la invariante numero cero del
// proyecto, y aqui tampoco se rompe.

const costeMes = (p) => (p.servicios_por_envase
  ? (p.precio_envase_eur / p.servicios_por_envase) * 30 : null);

const FILAS = [
  { et: 'Tienda', v: (p) => TIENDAS[p.tienda] ?? p.tienda },
  { et: 'Envase', v: (p) => eur(p.precio_envase_eur) },
  { et: (u) => `Precio por ${u}`, v: (p, u) => eur(p.precio_por_unidad_eur, u === 'kg' ? 2 : 3),
    destacar: (p) => p.precio_por_unidad_eur },
  { et: 'Al mes (1 servicio/dia)', v: (p) => (costeMes(p) != null ? eur(costeMes(p)) : '—') },
  { et: 'Formato', v: (p) => (p.formato_gramos ? `${p.formato_gramos} g`
                              : p.unidades ? `${p.unidades} capsulas` : '—') },
  { et: 'Verificacion', v: (p) => `Nivel ${p.nivel_verificacion}` },
  { et: 'Score', v: (p) => (p.score != null ? p.score.toFixed(0) : '—') },
];

export default function Comparador() {
  const [elegidos, setElegidos] = useState([]);
  const [datos, setDatos] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const lista = leerSeleccion();
    setElegidos(lista);
    const categorias = [...new Set(lista.map((e) => e.c))];
    Promise.all(categorias.map((c) =>
      fetch(`/datos/${c}.json`).then((r) => r.json()).then((d) => [c, d]).catch(() => null)))
      .then((pares) => {
        setDatos(Object.fromEntries(pares.filter(Boolean)));
        setCargando(false);
      });
  }, []);

  const quitar = (slug) => {
    const lista = elegidos.filter((e) => e.s !== slug);
    setElegidos(lista);
    guardarSeleccion(lista);
  };

  const vaciar = () => { setElegidos([]); guardarSeleccion([]); };

  if (cargando) return <p className="sutil">Cargando tu comparativa…</p>;

  if (elegidos.length === 0) {
    return (
      <p className="vacio">
        Todavia no has guardado ningun producto. En cualquier tabla de categoria, el boton
        <b> + comparar</b> de cada fila lo trae aqui. Se guarda en tu navegador: no hace
        falta cuenta y no sale de tu ordenador.
      </p>
    );
  }

  // {categoria: [productos]}, en el orden en que se guardaron.
  const grupos = {};
  for (const e of elegidos) {
    const ficha = datos[e.c]?.productos?.find((p) => p.slug === e.s);
    if (ficha) (grupos[e.c] ??= []).push(ficha);
  }
  const vivos = Object.entries(grupos);

  return (
    <>
      <p className="contador">
        <b>{elegidos.length}</b> {elegidos.length === 1 ? 'producto' : 'productos'} guardados
        <button type="button" className="chip" onClick={vaciar}>vaciar</button>
      </p>

      {vivos.length === 0 && (
        <p className="vacio">
          Los productos que guardaste ya no estan en el ranking: puede que la tienda haya
          dejado de venderlos. <button type="button" className="chip" onClick={vaciar}>vaciar la lista</button>
        </p>
      )}

      {vivos.map(([cat, productos]) => {
        const unidad = UNIDAD[datos[cat].unidad_precio] ?? 'kg';
        // El mejor de cada fila que se pueda comparar con un numero: se marca, porque una
        // tabla de cuatro columnas sin nada marcado obliga a leerla entera.
        const mejorPrecio = Math.min(...productos.map((p) => p.precio_por_unidad_eur ?? Infinity));
        return (
          <section className="bloque-comparativa" key={cat}>
            <h2>{datos[cat].categoria}</h2>
            <div className="tabla-marco">
              <div className="tabla-scroll">
                <table className="comparativa">
                  <caption>Tu comparativa de {datos[cat].categoria.toLowerCase()}</caption>
                  <thead>
                    <tr>
                      <th />
                      {productos.map((p) => (
                        <th key={p.slug}>
                          <a href={`/producto/${p.slug}`}>{p.nombre}</a>
                          <button type="button" className="chip" onClick={() => quitar(p.slug)}>
                            quitar
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FILAS.map((f) => (
                      <tr key={typeof f.et === 'function' ? f.et(unidad) : f.et}>
                        <th scope="row">{typeof f.et === 'function' ? f.et(unidad) : f.et}</th>
                        {productos.map((p) => (
                          <td key={p.slug}
                              className={f.destacar && f.destacar(p) === mejorPrecio ? 'destacado' : ''}>
                            {f.v(p, unidad)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <th scope="row">Comprar</th>
                      {productos.map((p) => (
                        <td key={p.slug}>
                          <a className="enlace-accion" href={p.url_tienda}
                             rel="nofollow noopener" target="_blank">ver en la tienda →</a>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="sutil">
              El precio por {unidad} es el que ordena la tabla de {datos[cat].categoria.toLowerCase()};
              el resto son datos de la ficha. Precios recogidos el {datos[cat].recogido}.
            </p>
          </section>
        );
      })}
    </>
  );
}
