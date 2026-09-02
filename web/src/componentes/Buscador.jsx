import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { NIVEL, UNIDAD, eur, puntos } from '../datos/util.js';

// Buscador de la portada. Es lo unico que un lector puede TOCAR nada mas entrar, asi
// que va encima del pliegue y responde con la primera tecla util (dos caracteres).
//
// El indice no viaja en el HTML: se pide a /datos/busqueda.json la primera vez que
// alguien enfoca el campo. Quien no busca no descarga nada, y quien busca lo tiene
// antes de terminar de escribir la segunda letra.
const MAX = 8;
// Cuantas comparativas caben arriba. Eran DOS, y con dos "proteina" no podia funcionar:
// hay tres categorias que empiezan por esa palabra (whey concentrado, aislada y vegana)
// y el corte se llevaba justo la mayor, la de whey, con sus 223 productos. Ahora ademas
// se ordenan por lo bien que encajan y por tamano, no por el orden del dataset.
const MAX_CAT = 4;
const CAMPOS = /^(INPUT|TEXTAREA|SELECT)$/;

// "Proteina" tiene que encontrar "proteína" y al reves: el dataset viene de seis
// tiendas y ninguna acentua igual.
const plano = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Lo que se busca son PALABRAS sueltas, no la cadena entera. Antes "proteina whey" tenia
// que aparecer literal y en ese orden, asi que no encontraba "Whey Protein Isolate de
// proteina de suero": seis tiendas distintas no ordenan el titulo igual.
const palabras = (s) => plano(s).split(/\s+/).filter(Boolean);

// Como de bien encaja un texto con lo escrito, mirando la palabra que peor entra:
//   0  el texto EMPIEZA por ella      ("proteina" en "Proteina whey")
//   1  empieza una palabra suya       ("whey"     en "Proteina whey")
//   2  cae dentro de una palabra      ("teina"    en "Proteina")
//   -1 falta alguna, y entonces no es un resultado
// Con esto, lo que empieza por lo que escribes sale antes que lo que solo lo contiene,
// que es el orden en el que lo busca cualquiera.
const SEPARA = /[\s(\-,.:/]/;
const encaje = (texto, terminos) => {
  const t = plano(texto);
  let peor = 0;
  for (const w of terminos) {
    const i = t.indexOf(w);
    if (i < 0) return -1;
    peor = Math.max(peor, i === 0 ? 0 : SEPARA.test(t[i - 1]) ? 1 : 2);
  }
  return peor;
};

// El mejor de varios campos (nombre y termino de busqueda de la categoria), o -1.
const mejor = (...encajes) => {
  const buenos = encajes.filter((n) => n >= 0);
  return buenos.length ? Math.min(...buenos) : -1;
};

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
    const terminos = palabras(texto);
    // Las categorias primero: si escribes "creatina" lo que quieres es la tabla de las
    // 40, no la fila 1 de las 40. Se ordenan por encaje y, a igualdad, por tamano: entre
    // tres proteinas que empiezan igual, la util es la que compara mas productos.
    const cats = categorias
      .map((c) => {
        const rango = mejor(encaje(c.nombre, terminos), encaje(c.termino, terminos));
        return rango < 0 ? null : { tipo: 'cat', ...c, rango };
      })
      .filter(Boolean)
      .sort((a, b) => a.rango - b.rango || b.productos - a.productos)
      .slice(0, MAX_CAT);
    // Los productos: primero por su nombre (con marca), y si no, por el de su categoria.
    // Casar solo por categoria vale menos que casar por nombre, y por eso va detras.
    const prods = (indice ?? [])
      .map((p) => {
        const porNombre = encaje(p.n, terminos);
        const rango = porNombre >= 0 ? porNombre
          : encaje(p.c, terminos) >= 0 ? 3
          : -1;
        return rango < 0 ? null : { tipo: 'prod', ...p, rango };
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
                {/* El chip escribe el `termino` de busqueda, no el nombre completo: con
                    "Proteina whey (concentrado)" dentro del campo, el parentesis es una
                    palabra mas que buscar y ningun producto la lleva, asi que el chip
                    devolvia la categoria sola. Con "proteina whey" salen las dos cosas. */}
                {categorias.slice(0, 6).map((c) => (
                  <button type="button" className="chip" key={c.slug}
                          onClick={() => { setQ(c.termino ?? c.nombre); campo.current?.focus(); }}>
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
            // Un rotulo cada vez que cambia el tipo. Sin el, una comparativa de 223
            // productos y una fila suelta se leian como la misma clase de cosa, y son
            // dos respuestas distintas: "la tabla entera" y "este bote".
            const titulo = r.tipo !== resultados[i - 1]?.tipo && (
              <p className="grupo-resultados" key={`g-${r.tipo}`} aria-hidden="true">
                {r.tipo === 'cat' ? 'Comparativas' : 'Productos'}
              </p>
            );
            if (r.tipo === 'cat') {
              return (
                <Fragment key={`c-${r.slug}`}>
                  {titulo}
                  <a className={`resultado categoria${activo ? ' activo' : ''}`} href={`/${r.slug}`}
                     role="option" aria-selected={activo}
                     onMouseEnter={() => setSel(i)}>
                    <span className="linea1">{r.nombre}</span>
                    <span className="linea2">Ver la comparativa completa</span>
                    <span className="cola">{r.productos} productos</span>
                  </a>
                </Fragment>
              );
            }
            const n = NIVEL[r.v];
            return (
              <Fragment key={r.s}>
              {titulo}
              <a className={`resultado${activo ? ' activo' : ''}`} href={`/producto/${r.s}`}
                 role="option" aria-selected={activo}
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
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
