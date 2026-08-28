import { useEffect, useMemo, useRef, useState } from 'react';
import { NIVEL, UNIDAD, eur, puntos } from '../datos/util.js';

// Buscador de la portada. Es lo unico que un lector puede TOCAR nada mas entrar, asi
// que va encima del pliegue y responde con la primera tecla util (dos caracteres).
//
// El indice no viaja en el HTML: se pide a /datos/busqueda.json la primera vez que
// alguien enfoca el campo. Quien no busca no descarga nada, y quien busca lo tiene
// antes de terminar de escribir la segunda letra.
const MAX = 7;
const CAMPOS = /^(INPUT|TEXTAREA|SELECT)$/;

// "Proteina" tiene que encontrar "proteína" y al reves: el dataset viene de seis
// tiendas y ninguna acentua igual.
const plano = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function Buscador({ categorias = [], total = 0 }) {
  const [q, setQ] = useState('');
  const [indice, setIndice] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [sel, setSel] = useState(0);
  const caja = useRef(null);
  const campo = useRef(null);
  const pedido = useRef(false);

  const cargar = () => {
    if (pedido.current) return;
    pedido.current = true;
    fetch('/datos/busqueda.json')
      .then((r) => r.json())
      .then((d) => setIndice(d.productos))
      .catch(() => setIndice([]));
  };

  useEffect(() => {
    // "/" enfoca el campo desde cualquier parte de la portada, como en la documentacion
    // que consulta esta misma gente. Nunca mientras se escribe en otro campo.
    const tecla = (e) => {
      if (e.key === '/' && !CAMPOS.test(document.activeElement?.tagName ?? '')) {
        e.preventDefault();
        campo.current?.focus();
      }
    };
    const fuera = (e) => { if (!caja.current?.contains(e.target)) setAbierto(false); };
    document.addEventListener('keydown', tecla);
    document.addEventListener('pointerdown', fuera);
    return () => {
      document.removeEventListener('keydown', tecla);
      document.removeEventListener('pointerdown', fuera);
    };
  }, []);

  // Si el campo queda en la mitad de abajo, la lamina de resultados se sale de la
  // pantalla y hay que hacer scroll a ciegas. Al abrirse, sube el campo arriba del
  // todo (con su scroll-margin, que lo deja bajo la cabecera pegada).
  useEffect(() => {
    if (!abierto || !caja.current) return;
    if (caja.current.getBoundingClientRect().bottom > window.innerHeight * 0.45) {
      caja.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, [abierto]);

  const texto = plano(q.trim());

  const resultados = useMemo(() => {
    if (texto.length < 2) return [];
    // Las categorias primero: si escribes "creatina" lo que quieres es la tabla de las
    // 40, no la fila 1 de las 40.
    const cats = categorias
      .filter((c) => plano(c.nombre).includes(texto) || plano(c.termino).includes(texto))
      .slice(0, 2)
      .map((c) => ({ tipo: 'cat', ...c }));
    const prods = (indice ?? [])
      .map((p) => {
        const i = plano(p.n).indexOf(texto);
        const enCat = plano(p.c).includes(texto);
        if (i < 0 && !enCat) return null;
        return { tipo: 'prod', ...p, rango: i === 0 ? 0 : i > 0 ? 1 : 2 };
      })
      .filter(Boolean)
      .sort((a, b) => a.rango - b.rango || (b.q ?? -1) - (a.q ?? -1))
      .slice(0, MAX);
    return [...cats, ...prods];
  }, [texto, indice, categorias]);

  useEffect(() => { setSel(0); }, [texto]);

  const destino = (r) => (r.tipo === 'cat' ? `/${r.slug}` : `/producto/${r.s}`);
  const ir = (r) => { if (r) window.location.href = destino(r); };

  const teclado = (e) => {
    if (e.key === 'Escape') { setAbierto(false); campo.current?.blur(); return; }
    if (!resultados.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => (s + 1) % resultados.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => (s - 1 + resultados.length) % resultados.length); }
    else if (e.key === 'Enter') { e.preventDefault(); ir(resultados[sel]); }
  };

  const buscando = texto.length >= 2;
  const esperando = buscando && indice === null;

  return (
    <div className="buscador" ref={caja}>
      <div className="buscador-campo">
        <svg className="lupa" viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12.8 12.8 17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          ref={campo}
          type="search"
          value={q}
          role="combobox"
          aria-expanded={abierto && buscando}
          aria-controls="resultados-buscador"
          aria-autocomplete="list"
          aria-label={`Buscar entre ${total} productos y sus comparativas`}
          placeholder="Busca una marca, un producto o un suplemento"
          autoComplete="off"
          spellCheck="false"
          enterKeyHint="go"
          onFocus={() => { cargar(); setAbierto(true); }}
          onInput={(e) => { cargar(); setQ(e.target.value); setAbierto(true); }}
          onKeyDown={teclado}
        />
        <kbd className="atajo" aria-hidden="true">/</kbd>
      </div>

      {abierto && (
        <div className="buscador-lamina" id="resultados-buscador" role="listbox">
          {!buscando && (
            <div className="buscador-pista">
              <p className="rotulo">Empieza por aqui</p>
              <div className="grupo-chips">
                {categorias.slice(0, 6).map((c) => (
                  <button type="button" className="chip" key={c.slug}
                          onClick={() => { setQ(c.nombre); campo.current?.focus(); }}>
                    {c.nombre}
                  </button>
                ))}
              </div>
              <p className="sutil">{total} productos indexados. Escribe dos letras.</p>
            </div>
          )}

          {esperando && <p className="buscador-vacio">Cargando el indice...</p>}

          {buscando && !esperando && resultados.length === 0 && (
            <p className="buscador-vacio">
              Nada con <b>{q.trim()}</b>. Puede que esa marca no la venda ninguna de las
              tiendas que se rastrean.
            </p>
          )}

          {resultados.map((r, i) => {
            const activo = i === sel;
            if (r.tipo === 'cat') {
              return (
                <a className={`resultado categoria${activo ? ' activo' : ''}`} href={`/${r.slug}`}
                   key={`c-${r.slug}`} role="option" aria-selected={activo}
                   onMouseEnter={() => setSel(i)}>
                  <span className="linea1">Ver la tabla de {r.nombre.toLowerCase()}</span>
                  <span className="cola">{r.productos} productos</span>
                </a>
              );
            }
            const n = NIVEL[r.v];
            return (
              <a className={`resultado${activo ? ' activo' : ''}`} href={`/producto/${r.s}`}
                 key={r.s} role="option" aria-selected={activo}
                 onMouseEnter={() => setSel(i)}>
                <span className="linea1">{r.n}</span>
                <span className="linea2">
                  <span>{r.c}</span>
                  <span className={`nivel ${n.clase}`}>
                    <span className="puntos">{puntos(r.v).map((on, j) => <i key={j} className={on ? 'on' : ''} />)}</span>
                    {n.etiqueta}
                  </span>
                </span>
                <span className="cola">
                  {r.p == null ? '—' : `${eur(r.p, r.u === 'kg' ? 2 : 3)}/${UNIDAD[r.u] ?? r.u}`}
                  <b>{r.q == null ? '' : `${r.q.toFixed(0)}`}</b>
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
