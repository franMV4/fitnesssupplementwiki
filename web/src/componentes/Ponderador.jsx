import { useEffect, useMemo, useState } from 'react';
import { NIVEL, TIENDAS, UNIDAD, eur, puntos } from '../datos/util.js';
import { EVENTO, OFICIAL } from './ControlPeso.jsx';

// La tabla de lideres de la portada, con el peso del score en manos del lector: el mando
// va plegado bajo el buscador (ControlPeso.jsx) y manda su peso por un evento.
//
// La formula es la misma que la del build (scoring/motor.py): mitad precio relativo al
// mas barato de la categoria, mitad calidad verificable. Si alguien no se cree el 50/50,
// lo mueve y ve el ranking rehacerse. Es la mejor defensa de una metodologia: ensenarla
// funcionando en vez de jurar que es neutral.
//
// Solo viajan al navegador los candidatos que pueden ganar con ALGUN peso (la frontera
// de Pareto precio/calidad de cada categoria, calculada en index.astro): unas cuarenta
// filas en lugar de 426.
const puntua = (c, suelo, w) => (w / 100) * 100 * (suelo / c.p) + (1 - w / 100) * c.cal;

export default function Ponderador({ filas = [] }) {
  const [w, setW] = useState(OFICIAL);

  useEffect(() => {
    const oido = (e) => setW(e.detail);
    document.addEventListener(EVENTO, oido);
    return () => document.removeEventListener(EVENTO, oido);
  }, []);

  const lideres = useMemo(() => filas.map((f) => {
    const con = (peso) => f.candidatos.reduce(
      (mejor, c) => (puntua(c, f.suelo, peso) > puntua(mejor, f.suelo, peso) ? c : mejor),
      f.candidatos[0]);
    const p = con(w);
    return { ...f, p, score: puntua(p, f.suelo, w), cambia: p.s !== con(OFICIAL).s };
  }), [filas, w]);

  const cambian = lideres.filter((f) => f.cambia).length;

  return (
    <div className="ponderador">
      {/* En el peso oficial no se dice nada: que la web pesa mitad y mitad ya lo cuentan
          la portada, la metodologia y cada ficha, y repetirlo aqui era una linea mas de
          ruido encima de la tabla. Esta frase solo aparece cuando el lector MUEVE el
          mando, que es cuando dice algo que no sabia. */}
      {w !== OFICIAL && (
        <p className="contador" aria-live="polite">
          {cambian === 0
            ? <>Con <b>{w} % precio</b> no cambia ni un lider: los de aqui lo son por las dos mitades.</>
            : <>Con <b>{w} % precio</b>, <b>{cambian}</b> de {filas.length} categorias cambian de lider.</>}
        </p>
      )}

      <div className="tabla-marco">
        <div className="tabla-scroll">
          <table className="apilable">
            <caption>Producto con mejor score de cada categoria</caption>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Tienda</th>
                <th className="num">Precio unidad</th>
                <th>Verificacion</th>
                <th className="num">Score</th>
              </tr>
            </thead>
            {/* Un <tbody> por categoria, no uno para toda la tabla: cada categoria son
                DOS filas (el lider y su horquilla de precios) y agruparlas es lo que
                permite subrayarlas juntas y separar una categoria de la siguiente. */}
            {lideres.map((f) => {
              const n = NIVEL[f.p.v];
              const unidad = UNIDAD[f.unidad] ?? f.unidad;
              return (
                <tbody key={f.slug} className="grupo-cat">
                  {/* El nombre de la categoria no es una celda mas: es el rotulo de la
                      ficha entera. A todo el ancho y en la condensada de titular, que
                      es lo unico que se lee de un vistazo bajando por treinta. */}
                  <tr className="cabecera-cat">
                    <td className="principal" colSpan={5}>
                      <a href={`/${f.slug}`}>
                        <i aria-hidden="true" />
                        {f.nombre}
                        <span className="flecha" aria-hidden="true">&rarr;</span>
                      </a>
                      {f.cambia && <span className="marca-cambio">cambia de lider</span>}
                    </td>
                  </tr>

                  <tr className={f.cambia ? 'cambiada' : undefined}>
                    <td data-et="Producto">
                      {/* La foto la sirve la CDN de la tienda; aqui no se aloja ninguna.
                          Perezosa: son treinta imagenes en una tabla que ni siquiera esta
                          en la primera pantalla. */}
                      <div className="con-miniatura">
                        {f.p.img && (
                          <img className="miniatura" src={f.p.img} alt="" aria-hidden="true"
                               referrerPolicy="no-referrer"
                               loading="lazy" decoding="async" width="55" height="55" />
                        )}
                        <a href={`/producto/${f.p.s}`} className="celda-producto">
                          {/* En Amazon la marca no viene en ningun campo y el scraper la deja
                              en "Desconocida". Es lo honesto en la BD, pero pintarla delante
                              del nombre llena la columna de una palabra que no es un dato.
                              La tabla de categoria ya lo hacia asi; esta no, y se notaba. */}
                          <span className="enlace-producto">
                            {f.p.marca !== 'Desconocida' && <span className="marca">{f.p.marca} </span>}
                            {f.p.nombre}
                          </span>
                        </a>
                      </div>
                    </td>
                    <td data-et="Tienda">{TIENDAS[f.p.tienda] ?? f.p.tienda}</td>
                    <td className="num" data-et="Precio">
                      {eur(f.p.p, unidad === 'kg' ? 2 : 3)}<span className="sutil">/{unidad}</span>
                    </td>
                    <td data-et="Verificacion">
                      <span className={`nivel ${n.clase}`}>
                        <span className="puntos">
                          {puntos(f.p.v).map((on, i) => <i key={i} className={on ? 'on' : ''} />)}
                        </span>
                        {n.etiqueta}
                      </span>
                    </td>
                    <td className="num" data-et="Score">
                      <span className="cifra">{f.score.toFixed(0)}</span>
                      <span className="barra mini"><span style={{ width: `${f.score}%` }} /></span>
                    </td>
                  </tr>

                  {/* La segunda fila es la categoria entera, no este producto: cuantos
                      hay, en cuantas tiendas y de que a que precio. Es la ficha que
                      antes vivia en una lista aparte con las mismas 30 categorias. */}
                  <tr className="detalle-cat">
                    <td colSpan={5}>
                      <p className="meta-cat">
                        <b>{f.productos}</b> productos
                        {' · '}<b>{f.tiendas}</b> {f.tiendas === 1 ? 'tienda' : 'tiendas'}
                        {f.nivel4 > 0 && <>{' · '}<b>{f.nivel4}</b> de nivel 4</>}
                      </p>
                      {f.min != null && f.max != null && (
                        <div className="horquilla">
                          <div className="regla" aria-hidden="true">
                            <span className="tramo" />
                            <span className="marca-mediana" style={{ left: `${f.posMediana}%` }} />
                            {f.posLider != null && (
                              <span className="marca-lider" style={{ left: `${f.posLider}%` }} />
                            )}
                          </div>
                          <p className="pies">
                            <span><b>{eur(f.min, f.dec)}</b>/{unidad}</span>
                            <span className="sutil">mediana {eur(f.mediana, f.dec)}</span>
                            <span><b>{eur(f.max, f.dec)}</b>/{unidad}</span>
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              );
            })}
          </table>
        </div>
      </div>
    </div>
  );
}
