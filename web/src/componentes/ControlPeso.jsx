import { useEffect, useState } from 'react';

// El mando del score, plegado bajo el buscador. Antes iba abierto encima de la tabla y
// era lo primero que veia alguien que solo queria una tabla ordenada; aqui no estorba y
// quien tenga la curiosidad lo abre.
//
// Vive separado de la tabla (Ponderador.jsx) porque estan en dos sitios de la pagina.
// Se hablan con un evento del documento en vez de con una libreria de estado: dos islas,
// un `CustomEvent` y ninguna dependencia nueva.
export const OFICIAL = 50;
export const EVENTO = 'peso-score';

const PRESETS = [
  { v: 100, texto: 'Solo el precio' },
  { v: OFICIAL, texto: 'Mitad y mitad' },
  { v: 0, texto: 'Solo la calidad' },
];

export default function ControlPeso() {
  const [w, setW] = useState(OFICIAL);

  useEffect(() => {
    document.dispatchEvent(new CustomEvent(EVENTO, { detail: w }));
  }, [w]);

  return (
    <details className="desplegable-peso">
      <summary>
        <span className="titulo-desplegable">Ordena la tabla con tu criterio</span>
        <span className="pista-desplegable">
          {w === OFICIAL ? 'ahora: mitad precio, mitad calidad' : `ahora: ${w} % precio, ${100 - w} % calidad`}
        </span>
      </summary>

      <div className="panel-peso">
        <p className="sutil">
          El orden de la tabla de abajo sale de una nota de 0 a 100: mitad precio frente al
          mas barato de su categoria, mitad calidad verificable. Es la misma formula que
          ordena todas las tablas del sitio. Muevela y mira que aguanta.
        </p>

        <label className="mando">
          <span className="extremo">Calidad<br /><b>{100 - w} %</b></span>
          <input type="range" min="0" max="100" step="5" value={w}
                 aria-label="Peso del precio frente a la calidad verificable"
                 onInput={(e) => setW(Number(e.target.value))}
                 onChange={(e) => setW(Number(e.target.value))} />
          <span className="extremo der">Precio<br /><b>{w} %</b></span>
        </label>

        <div className="grupo-chips">
          {PRESETS.map((p) => (
            <button type="button" key={p.v} className="chip" aria-pressed={w === p.v}
                    onClick={() => setW(p.v)}>{p.texto}</button>
          ))}
        </div>
      </div>
    </details>
  );
}
