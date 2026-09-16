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

// `txt` llega ya traducido desde la pagina .astro. Una isla de React no puede llamar a
// textos() sin arrastrar el diccionario entero al bundle del navegador: serian 30 KB
// para las nueve frases de este mando.
export default function ControlPeso({ txt = {} }) {
  const PRESETS = [
    { v: 100, texto: txt.soloPrecio },
    { v: OFICIAL, texto: txt.mitad },
    { v: 0, texto: txt.soloCalidad },
  ];
  const [w, setW] = useState(OFICIAL);

  useEffect(() => {
    document.dispatchEvent(new CustomEvent(EVENTO, { detail: w }));
  }, [w]);

  return (
    <details className="desplegable-peso">
      <summary>
        <span className="titulo-desplegable">{txt.titulo}</span>
        <span className="pista-desplegable">
          {w === OFICIAL ? txt.pistaOficial : txt.pista?.replace('%w', w).replace('%c', 100 - w)}
        </span>
      </summary>

      <div className="panel-peso">
        <p className="sutil">{txt.explicacion}</p>

        <label className="mando">
          <span className="extremo">{txt.calidad}<br /><b>{100 - w} %</b></span>
          <input type="range" min="0" max="100" step="5" value={w}
                 aria-label={txt.mando}
                 onInput={(e) => setW(Number(e.target.value))}
                 onChange={(e) => setW(Number(e.target.value))} />
          <span className="extremo der">{txt.precio}<br /><b>{w} %</b></span>
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
