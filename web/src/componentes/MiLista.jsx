import { useEffect, useState } from 'react';
import { TIENDAS, aEnlace, comoSeLee, conDosis, costeMes, deEnlace, duracionDias, eur }
  from '../datos/util.js';
import { guardarMiLista, irAEntrar, leerMiLista, pedir, quienSoy } from './api.js';

// Mi lista: lo que toma el lector, con su dosis, lo que le dura cada envase y lo que le
// cuesta el mes entero. Ademas, dos cosas que solo tienen sentido aqui: la lista que
// alguien te ha pasado por un enlace, y los avisos de precio que tengas puestos.
//
// Es la unica pagina de la web que suma. Todo lo demas compara productos entre si; aqui
// el numero que importa es el de abajo del todo, y es el que hace volver: "estoy en 47
// EUR al mes" es un dato que nadie tiene apuntado en ningun sitio.
//
// La lista vive en el servidor, en la cuenta del lector (una fila de `listas` en D1), y
// los datos se piden a /datos/<categoria>.json: ni una copia mas del catalogo.

const DOSIS = [0.5, 1, 1.5, 2, 3];
// Los campos del catalogo publico no se llaman igual que los del dataset del build, y las
// dos funciones de cuentas hablan el idioma del dataset.
const como = (p) => ({ servicios_por_envase: p.servicios_por_envase,
                       precio_eur: p.precio_envase_eur });

export default function MiLista() {
  const [lista, setLista] = useState([]);
  const [datos, setDatos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [compartida, setCompartida] = useState([]);
  const [copiado, setCopiado] = useState(false);
  const [alertas, setAlertas] = useState([]);
  const [usuario, setUsuario] = useState(undefined);   // undefined = aun preguntando
  const [error, setError] = useState('');

  useEffect(() => { (async () => {
    const u = await quienSoy();
    setUsuario(u);
    if (!u) return;
    const guardada = await leerMiLista().catch(() => []);
    // Lo que llega por el enlace de otra persona no se guarda solo: se ensena arriba y se
    // anade si el lector quiere. Una lista que se sobreescribe sola al abrir un enlace es
    // una lista que alguien pierde.
    const llega = deEnlace(new URLSearchParams(location.search).get('l'))
      .filter((e) => !guardada.some((m) => m.s === e.s));
    setLista(guardada);
    setCompartida(llega);

    const categorias = [...new Set([...guardada, ...llega].map((e) => e.c))].filter(Boolean);
    Promise.all(categorias.map((c) =>
      fetch(`/datos/${c}.json`).then((r) => r.json()).then((d) => [c, d]).catch(() => null)))
      .then((pares) => {
        setDatos(Object.fromEntries(pares.filter(Boolean)));
        setCargando(false);
      });

    // Los avisos de precio SI viven en el servidor (hace falta un correo al que escribir).
    // Sin sesion la API devuelve una lista vacia, asi que aqui no hay nada que preguntar.
    fetch('/api/alertas').then((r) => r.json()).then((d) => setAlertas(d.alertas ?? []))
      .catch(() => {});
  })(); }, []);

  const guardar = async (nueva) => {
    const antes = lista;
    setLista(nueva); setError('');
    try {
      await guardarMiLista(nueva);
    } catch (fallo) {
      setLista(antes); setError(fallo.message);
    }
  };
  const quitar = (slug) => guardar(lista.filter((e) => e.s !== slug));
  const vaciar = () => guardar([]);

  const anadirCompartida = () => { guardar([...lista, ...compartida]); setCompartida([]); };

  const copiar = async () => {
    const enlace = `${location.origin}${location.pathname}?l=${encodeURIComponent(aEnlace(lista))}`;
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
    } catch {
      // Sin permiso de portapapeles (o sin https) queda el camino de siempre: la barra de
      // direcciones con el enlace ya puesto, para copiarlo a mano.
      location.search = `?l=${encodeURIComponent(aEnlace(lista))}`;
    }
  };

  const quitarAlerta = async (producto) => {
    await pedir('/api/alerta', { producto, borrar: true }).catch(() => {});
    setAlertas(alertas.filter((a) => a.producto !== producto));
  };

  if (usuario === null) {
    return (
      <p className="vacio">
        Mi lista va guardada en tu cuenta, asi que hay que entrar para verla.{' '}
        <button type="button" className="boton primario" onClick={irAEntrar}>Entrar</button>
      </p>
    );
  }
  if (cargando) return <p className="sutil">Cargando tu lista…</p>;

  const banner = compartida.length > 0 && (
    <p className="nota">
      <strong>Alguien te ha pasado una lista de {compartida.length} productos.</strong>{' '}
      No se ha guardado nada todavia: se anaden a la tuya solo si lo dices tu.
      <button type="button" className="enlace-accion" onClick={anadirCompartida}>
        anadirlos a mi lista
      </button>
      <button type="button" className="enlace-accion" onClick={() => setCompartida([])}>
        no, gracias
      </button>
    </p>
  );

  if (lista.length === 0) {
    return (
      <>
        {banner}
        <p className="vacio">
          Todavia no has guardado nada. En cualquier tabla de categoria, el boton
          <b> &#9825; mi lista</b> de cada fila lo trae aqui; en la ficha de un producto esta al
          lado del precio, junto a la dosis que tomas. Se guarda en tu cuenta.
        </p>
      </>
    );
  }

  // Cada entrada guardada con su ficha del catalogo al lado. La ficha puede faltar: la
  // tienda deja de venderlo y a la manana siguiente ya no esta en el ranking.
  const filas = lista.map((e) => ({
    ...e,
    d: e.d > 0 ? e.d : 1,
    ficha: datos[e.c]?.productos?.find((p) => p.slug === e.s) ?? null,
  }));
  const vivas = filas.filter((f) => f.ficha);
  // El total solo suma lo que se puede calcular, y debajo se dice cuantos se han quedado
  // fuera: un total que se come en silencio los productos sin servicios declarados es un
  // total que miente hacia abajo.
  const calculables = vivas.filter((f) => costeMes(como(f.ficha), f.d) != null);
  const total = calculables.reduce((s, f) => s + costeMes(como(f.ficha), f.d), 0);
  const sinCuenta = vivas.length - calculables.length;

  return (
    <>
      {banner}
      {error && <p className="fallo-form">{error}</p>}

      <p className="contador">
        <b>{lista.length}</b> {lista.length === 1 ? 'producto' : 'productos'} en tu lista
        <button type="button" className="chip" onClick={vaciar}>vaciar</button>
        <button type="button" className="chip" onClick={copiar}>
          {copiado ? 'enlace copiado' : 'copiar enlace'}
        </button>
      </p>

      <div className="tabla-marco">
        <div className="tabla-scroll">
          <table className="apilable mi-lista-tabla">
            <caption>Lo que tomas, con tu dosis</caption>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Al dia</th>
                <th className="num">Envase</th>
                <th className="num">Dura</th>
                <th className="num">Al mes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const dias = f.ficha && duracionDias(como(f.ficha), f.d);
                const mes = f.ficha && costeMes(como(f.ficha), f.d);
                return (
                  <tr key={f.s}>
                    <td className="principal">
                      <a href={`/producto/${f.s}/`}>{f.ficha ? f.ficha.nombre : comoSeLee(f.s)}</a>
                      {f.ficha
                        ? <span className="sutil"> · {TIENDAS[f.ficha.tienda] ?? f.ficha.tienda}</span>
                        : <span className="sutil"> · ya no esta en el ranking</span>}
                    </td>
                    <td data-et="Al dia">
                      {/* aria-label y no un <label> con texto escondido: la columna ya
                          se llama "Al dia" en la cabecera, y en movil el rotulo lo pone
                          el data-et de la celda. */}
                      <select value={f.d} aria-label="Servicios al dia"
                              onChange={(e) => guardar(conDosis(lista, f.s, Number(e.target.value)))}>
                        {DOSIS.map((d) => (
                          <option key={d} value={d}>{String(d).replace('.', ',')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="num" data-et="Envase">
                      {f.ficha ? eur(f.ficha.precio_envase_eur) : '—'}
                    </td>
                    <td className="num" data-et="Dura">
                      {dias != null ? `${Math.round(dias)} dias` : '—'}
                    </td>
                    <td className="num" data-et="Al mes">{mes != null ? eur(mes) : '—'}</td>
                    <td>
                      <button type="button" className="enlace-accion peligro"
                              onClick={() => quitar(f.s)}>quitar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="total-lista">
        <span className="rotulo-total">Tu gasto al mes</span>
        <b>{eur(total)}</b>
        <span className="sutil">
          {calculables.length} {calculables.length === 1 ? 'producto' : 'productos'} con la
          dosis que has puesto
          {sinCuenta > 0 && ` · ${sinCuenta} sin sumar: su tienda no declara los servicios por envase`}
        </span>
      </p>

      {alertas.length > 0 && (
        <section className="avisos-puestos">
          <h2>Tus avisos de precio</h2>
          <ul>
            {alertas.map((a) => (
              <li key={a.producto}>
                <a href={`/producto/${a.producto}/`}>{comoSeLee(a.producto)}</a>
                <span className="sutil"> · te avisamos si baja de {eur(a.objetivo)}</span>
                <button type="button" className="enlace-accion peligro"
                        onClick={() => quitarAlerta(a.producto)}>quitar</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
