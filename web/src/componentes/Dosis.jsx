import { useEffect, useState } from 'react';
import { alternarEnLista, conDosis, costeMes, duracionDias, enLista, eur } from '../datos/util.js';
import { guardarMiLista, irAEntrar, leerMiLista, quienSoy } from './api.js';

// La calculadora de la ficha: "yo tomo esto al dia" -> cuanto dura el envase, cuanto sale
// al mes y cuando toca volver a comprarlo.
//
// La ficha ya da los dos numeros a un servicio al dia, que es el supuesto de la casa y el
// que hace comparables 2.665 productos. Este es el otro: el de quien toma dos scoops, o
// medio. Es la pregunta que de verdad se hace el que esta a punto de comprar, y sale
// entera de datos que ya estan en la pagina: ni una peticion mas.
//
// El mismo componente guarda el producto en mi lista, y no por juntar dos cosas: la dosis
// que se escribe aqui es EL dato que necesita /mis-suplementos para sumar el gasto del
// mes. Separarlos serian dos islas y un sitio donde volver a escribir la dosis.

const FECHA = { day: 'numeric', month: 'long' };
// Medio servicio es lo minimo que declara alguien de verdad ("medio scoop"); de ahi para
// abajo el numero deja de significar nada y el envase pasa a durar dos anos.
const DOSIS = [0.5, 1, 1.5, 2, 3];

export default function Dosis({ slug, categoria, servicios, precio }) {
  const [lista, setLista] = useState(null);     // null = todavia no se sabe
  const [usuario, setUsuario] = useState(null);
  const [porDia, setPorDia] = useState(1);
  const [error, setError] = useState('');

  // La lista vive en el servidor y es de cada cuenta: no puede venir pintada del build.
  // Sin sesion la calculadora funciona igual; lo que pide entrar es guardar.
  useEffect(() => {
    quienSoy().then(async (u) => {
      setUsuario(u);
      const guardada = u ? await leerMiLista().catch(() => []) : [];
      setLista(guardada);
      const mio = guardada.find((e) => e.s === slug);
      if (mio?.d > 0) setPorDia(mio.d);
    });
  }, [slug]);

  if (lista === null) return null;

  const guardar = async (nueva) => {
    const antes = lista;
    setLista(nueva); setError('');
    try {
      await guardarMiLista(nueva);
    } catch (fallo) {
      setLista(antes); setError(fallo.message);
    }
  };

  const dentro = enLista(lista, slug);
  const p = { servicios_por_envase: servicios, precio_eur: precio };
  const dias = duracionDias(p, porDia);
  const mes = costeMes(p, porDia);

  const cambiaDosis = (d) => {
    setPorDia(d);
    // Si ya esta guardado, la dosis nueva se guarda con el: lo contrario es que mi lista
    // sume el gasto con un numero que el lector acaba de corregir en pantalla.
    if (dentro) guardar(conDosis(lista, slug, d));
  };

  const alternar = () => (usuario
    ? guardar(alternarEnLista(lista, { s: slug, c: categoria, d: porDia }))
    : irAEntrar());

  return (
    <div className="calculadora">
      <p className="rotulo-calc">Con tu dosis</p>

      <div className="mando-dosis">
        {/* El mismo mando de chips pegados que los filtros de la tabla: es el control que
            ya conoce quien ha llegado hasta aqui. */}
        <div className="grupo-chips" role="group" aria-label="Servicios que tomas al dia">
          {DOSIS.map((d) => (
            <button type="button" key={d} className="chip" aria-pressed={d === porDia}
                    onClick={() => cambiaDosis(d)}>
              {String(d).replace('.', ',')}
            </button>
          ))}
        </div>
        <span className="sutil">servicios al dia</span>
      </div>

      {dias == null ? (
        <p className="sutil">
          Esta tienda no publica cuantos servicios trae el envase, asi que aqui no se puede
          calcular ni cuanto dura ni lo que sale al mes. Es el mismo motivo por el que la
          ficha tampoco los da: preferimos no ensenar un numero inventado.
        </p>
      ) : (
        <p className="cuentas-dosis">
          <span><b>{Math.round(dias)}</b> dias dura el envase</span>
          <span><b>{eur(mes)}</b> al mes</span>
          <span className="sutil">
            se te acaba hacia el{' '}
            {new Date(Date.now() + dias * 86400000).toLocaleDateString('es-ES', FECHA)}
          </span>
        </p>
      )}

      <p>
        <button type="button" className={`boton ${dentro ? '' : 'primario'}`} onClick={alternar}>
          {!usuario ? 'Entrar para guardar en mi lista' : dentro ? 'Quitar de mi lista' : 'Guardar en mi lista'}
        </button>
        {dentro && <a className="enlace-accion" href="/mis-suplementos/">ver mi lista →</a>}
      </p>
      {error && <p className="fallo-form">{error}</p>}
      <p className="sutil">
        Mi lista se guarda en tu cuenta: la tienes igual en el movil y en el ordenador.
      </p>
    </div>
  );
}
