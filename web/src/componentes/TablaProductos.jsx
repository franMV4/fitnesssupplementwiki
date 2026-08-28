import { useEffect, useMemo, useState } from 'react';
import { NIVEL, ORDENES, TIENDAS, TOPE_SELECCION, UNIDAD, eur, filtrar, guardarSeleccion,
         leerSeleccion, precioReferencia, puntos, tieneSello } from '../datos/util.js';

// Unica isla React del sitio: busqueda, filtros y orden de la tabla de categoria.
// El orden por defecto es el score. Los enlaces de afiliado no pintan nada aqui.
// El filtrado y los ordenes viven en datos/util.js: ahi se pueden probar sin navegador.

// Cuantas filas se ven antes de pedirlas. Con 223 productos la pagina medía 40.000 px
// y nadie llega a la fila 200 por scroll: llega filtrando. Las demas filas se pintan
// igual y solo las tapa el CSS, asi que siguen en el HTML para quien las lea entero
// (buscadores y modelos incluidos); "ver todas" solo quita la clase.
const TOPE = 25;

const NIVELES_CHIP = [
  { v: 1, texto: 'Todos' },
  { v: 2, texto: '2+ declarado' },
  { v: 3, texto: '3+ analisis' },
  { v: 4, texto: '4 verificado' },
];

// Sellos que existen en el dataset y que valen nivel 4 porque los respalda un tercero.
// El chip solo aparece si esta tabla tiene alguno: un filtro que siempre deja la tabla
// vacia es peor que no tener filtro.
const SELLOS_CHIP = [
  { tipo: 'creapure', texto: 'Solo Creapure' },
  { tipo: 'ifos', texto: 'Solo IFOS' },
];

// Encabezado que ordena al pincharlo. El desplegable "Ordenar por" sigue estando (es el
// unico que se ve en movil, donde la tabla se apila y no hay cabecera), asi que los dos
// mandan sobre el mismo estado y no pueden contradecirse.
function Ordenable({ clave, className, orden, set, children }) {
  const activo = orden === clave;
  return (
    <th className={className} aria-sort={activo ? 'ascending' : 'none'}>
      <button type="button" className={`orden ${activo ? 'activo' : ''}`} onClick={() => set(clave)}>
        {children}
      </button>
    </th>
  );
}

function Puntos({ nivel }) {
  return <span className="puntos">{puntos(nivel).map((on, i) => <i key={i} className={on ? 'on' : ''} />)}</span>;
}

export default function TablaProductos({ productos }) {
  const [busqueda, setBusqueda] = useState('');
  const [tienda, setTienda] = useState('');
  const [nivelMin, setNivelMin] = useState(1);
  const [precioMax, setPrecioMax] = useState('');
  const [sello, setSello] = useState('');
  const [orden, setOrden] = useState('score');
  const [todo, setTodo] = useState(false);
  // La seleccion se lee DESPUES de montar, nunca al construir el estado: esta tabla se
  // pinta tambien en el servidor, donde no hay localStorage, y leerla arriba daria un
  // HTML distinto del que React espera al hidratar.
  const [elegidos, setElegidos] = useState([]);
  useEffect(() => setElegidos(leerSeleccion()), []);

  const alternar = (p) => {
    const fuera = elegidos.filter((e) => e.s !== p.slug);
    const lista = fuera.length < elegidos.length
      ? fuera
      : [...elegidos, { s: p.slug, c: p.categoria }].slice(-TOPE_SELECCION);
    setElegidos(lista);
    guardarSeleccion(lista);
  };

  const tiendas = useMemo(
    () => [...new Set(productos.map((p) => p.tienda))].sort(), [productos]);

  // Sellos de calidad de verdad (Creapure, IFOS) son nivel 4 y solo existen en unas pocas
  // categorias (creatina, omega 3). En proteinas o preentrenos, como mucho hay "analisis de
  // marca" (nivel 3), que no es un sello: la columna de verificacion es ruido y la ocultamos
  // entera (con su filtro) cuando ningun producto de la tabla llega al nivel de sello.
  const hayVerificacion = useMemo(
    () => productos.some((p) => p.nivel_verificacion >= 4), [productos]);

  // Una categoria en capsulas (omega 3, multivitaminicos) no tiene precio por kilo, y
  // poner "€/kg" encima de un precio por capsula es enseñar un numero mintiendo sobre
  // que numero es.
  const unidadPrecio = useMemo(
    () => `€/${UNIDAD[productos.find((p) => p.unidad_precio)?.unidad_precio] ?? 'kg'}`,
    [productos]);

  // Los sellos presentes en ESTA tabla. En proteinas no hay ninguno y los chips no salen.
  const sellosVisibles = useMemo(
    () => SELLOS_CHIP.filter((s) => productos.some((p) => tieneSello(p, s.tipo))),
    [productos]);

  const visibles = useMemo(
    () => filtrar(productos, { busqueda, tienda, nivelMin, precioMax, sello, orden }),
    [productos, busqueda, tienda, nivelMin, precioMax, sello, orden]);

  // El precio mas bajo de lo que se ve ahora mismo: es el unico que se tine de rojo,
  // porque ordenando por score la primera fila no tiene por que ser la mas barata.
  const minPrecio = useMemo(() => {
    const ps = visibles.map((p) => p.precio_referencia).filter((n) => n != null);
    return ps.length ? Math.min(...ps) : null;
  }, [visibles]);

  const filtrando = busqueda || tienda || nivelMin > 1 || precioMax || sello;
  const limpiar = () => {
    setBusqueda(''); setTienda(''); setNivelMin(1); setPrecioMax(''); setSello('');
  };

  return (
    <>
      <div className="barra-filtros">
        <label className="campo ancho">
          <span>Buscar</span>
          <input type="search" value={busqueda} placeholder="marca o producto"
                 onChange={(e) => setBusqueda(e.target.value)} />
        </label>
        <label className="campo">
          <span>Tienda</span>
          <select value={tienda} onChange={(e) => setTienda(e.target.value)}>
            <option value="">Todas</option>
            {tiendas.map((t) => <option key={t} value={t}>{TIENDAS[t] ?? t}</option>)}
          </select>
        </label>
        <label className="campo">
          <span>Maximo {unidadPrecio}</span>
          <input type="number" min="0" step="1" value={precioMax} placeholder="sin limite"
                 onChange={(e) => setPrecioMax(e.target.value)} />
        </label>
        <label className="campo">
          <span>Ordenar por</span>
          <select value={orden} onChange={(e) => setOrden(e.target.value)}>
            {Object.entries(ORDENES).map(([k, v]) => <option key={k} value={k}>{v.etiqueta}</option>)}
          </select>
        </label>
        {filtrando && (
          <div className="campo linea">
            <span>&nbsp;</span>
            <div className="grupo-chips">
              <button type="button" className="chip" onClick={limpiar}>limpiar filtros</button>
            </div>
          </div>
        )}
        {hayVerificacion && (
          <div className="campo linea">
            <span>Verificacion minima</span>
            <div className="grupo-chips">
              {NIVELES_CHIP.map((n) => (
                <button key={n.v} type="button" className="chip" aria-pressed={nivelMin === n.v}
                        onClick={() => setNivelMin(n.v)}>{n.texto}</button>
              ))}
              {sellosVisibles.map((s) => (
                <button key={s.tipo} type="button" className="chip" aria-pressed={sello === s.tipo}
                        onClick={() => setSello(sello === s.tipo ? '' : s.tipo)}>{s.texto}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="tabla-marco">
        <div className="tabla-scroll">
          <table className={`apilable fichas ${!todo && visibles.length > TOPE ? 'recortada' : ''}`}>
            <caption>Productos ordenados por {ORDENES[orden].etiqueta.toLowerCase()}</caption>
            <thead>
              <tr>
                <th className="rango">#</th>
                <th>Producto</th>
                <th>Tienda</th>
                <Ordenable clave="precio" className="num" orden={orden} set={setOrden}>Envase</Ordenable>
                <Ordenable clave="kg" className="num" orden={orden} set={setOrden}>{unidadPrecio}</Ordenable>
                {hayVerificacion && <th>Verificacion</th>}
                <Ordenable clave="score" className="num" orden={orden} set={setOrden}>Score</Ordenable>
              </tr>
            </thead>
            <tbody>
              {visibles.map((p, i) => {
                const n = NIVEL[p.nivel_verificacion];
                const esMinimo = p.precio_referencia != null && p.precio_referencia === minPrecio;
                return (
                  <tr key={p.id}>
                    <td className={`puesto ${i === 0 ? 'top' : ''}`}>
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td className={`principal ${p.flag_infradosaje ? 'alarma' : ''}`}>
                      {/* Sabores, sellos y avisos van dentro de la columna del nombre: fuera
                          del flex empezaban linea nueva y caian debajo de la foto. */}
                      <div className="con-miniatura">
                        {/* La foto la sirve la CDN de la tienda; aqui no se aloja ninguna.
                            loading/decoding perezosos: son 45 imagenes en una sola tabla. */}
                        {p.imagen && (
                          <img className="miniatura" src={p.imagen} alt="" aria-hidden="true"
                               referrerPolicy="no-referrer"
                               loading="lazy" decoding="async" width="55" height="55" />
                        )}
                        <div className="celda-producto">
                          <a href={`/producto/${p.slug}`}>
                            {/* En Amazon la marca no viene en ningun campo y el scraper la
                                deja en "Desconocida": es lo honesto en la BD, pero pintarla
                                delante de cada nombre llena la columna de una palabra que no
                                es un dato. Sin marca, manda el nombre. */}
                            <span className="enlace-producto">
                              {p.marca !== 'Desconocida' && <span className="marca">{p.marca}</span>}
                              {p.marca !== 'Desconocida' ? ' ' : ''}{p.nombre}
                            </span>
                          </a>
                          {p.sabores > 1 && <span className="sutil"> · {p.sabores} sabores</span>}
                          {p.sellos?.map((s) => (
                            <span key={s.id} className="sello" title={s.criterio}>{s.texto}</span>
                          ))}
                          {p.flag_infradosaje && <div className="infradosis">infradosificado</div>}
                          {/* Guardar para comparar. Va dentro de la celda del nombre y no
                              en una columna nueva: una columna mas estrecha la tabla en
                              movil por una funcion que no usa todo el mundo. */}
                          <button type="button" className="marcar"
                                  aria-pressed={elegidos.some((e) => e.s === p.slug)}
                                  onClick={() => alternar(p)}>
                            {elegidos.some((e) => e.s === p.slug) ? 'en tu comparativa' : '+ comparar'}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td data-et="Tienda">
                      <a href={p.url_afiliado ?? p.url}
                         rel={p.url_afiliado ? 'sponsored nofollow noopener' : 'nofollow noopener'}
                         target="_blank">{TIENDAS[p.tienda] ?? p.tienda}</a>
                    </td>
                    <td className="num" data-et="Envase">{eur(p.precio_eur)}</td>
                    <td className={`num referencia ${esMinimo ? 'destacado' : ''}`} data-et={unidadPrecio}>
                      {precioReferencia(p).valor}
                      {precioReferencia(p).unidad && (
                        <span className="sutil"> /{precioReferencia(p).unidad}</span>
                      )}
                    </td>
                    {hayVerificacion && (
                      <td data-et="Verificacion">
                        <span className={`nivel ${n.clase}`}><Puntos nivel={p.nivel_verificacion} /> {n.etiqueta}</span>
                      </td>
                    )}
                    <td className="num puntuacion" data-et="Score">
                      <span className="cifra">{p.score_final?.toFixed(0) ?? '—'}</span>
                      <span className="barra mini">
                        <span style={{ width: `${p.score_final ?? 0}%` }} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!todo && visibles.length > TOPE && (
          <button type="button" className="boton ver-mas" onClick={() => setTodo(true)}>
            Ver los {visibles.length - TOPE} productos restantes <span className="flecha">↓</span>
          </button>
        )}
        {todo && visibles.length > TOPE && (
          <a className="volver-arriba" href="#contenido">↑ Volver arriba</a>
        )}
        {visibles.length === 0 && <p className="vacio">Ningun producto cumple esos filtros.</p>}
      </div>

      {/* El recuento va DEBAJO, como el pie de una tabla impresa: arriba repetia la
          cifra que ya da el bloque de cifras de la cabecera, y decia dos veces lo
          mismo con dos tipografias distintas. Aqui cierra lo que se acaba de leer. */}
      {visibles.length > 0 && (
        <p className="pie-tabla" aria-live="polite">
          {visibles.length === productos.length
            ? <><b>{productos.length}</b> productos en esta tabla</>
            : <><b>{visibles.length}</b> de {productos.length} productos con los filtros puestos</>}
        </p>
      )}

      {elegidos.length > 0 && (
        <div className="barra-comparar">
          <span>
            <b>{elegidos.length}</b> {elegidos.length === 1 ? 'producto guardado' : 'productos guardados'}
            {elegidos.length >= TOPE_SELECCION && <span className="sutil"> (el tope son {TOPE_SELECCION})</span>}
          </span>
          <a className="boton primario" href="/comparar">Ver la comparativa →</a>
        </div>
      )}
    </>
  );
}
