import { useEffect, useState } from 'react';
import { TIENDAS, UNIDAD, eur, guardarSeleccion, leerSeleccion } from '../datos/util.js';
import { irAEntrar, quienSoy } from './api.js';

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

// Los textos de la isla van aqui y no en textos.js: importar el diccionario entero
// mandaria al navegador los tres idiomas de toda la web para pintar veinte frases.
const T = {
  es: { tienda: 'Tienda', envase: 'Envase', precioPor: (u) => `Precio por ${u}`,
        alMes: 'Al mes (1 servicio/dia)', formato: 'Formato', capsulas: 'capsulas',
        verif: 'Verificacion', nivel: 'Nivel', comprar: 'Comprar', verTienda: 'ver en la tienda →',
        conCuenta: 'Comparar productos es para lectores con cuenta.', entrar: 'Entrar',
        cargando: 'Cargando tu comparativa…',
        vacio: ['Todavia no has guardado ningun producto. En cualquier tabla de categoria, el boton', ' + comparar', ' de cada fila lo trae aqui.'],
        guardados: (n) => (n === 1 ? 'producto guardado' : 'productos guardados'), vaciar: 'vaciar',
        yaNo: 'Los productos que guardaste ya no estan en el ranking: puede que la tienda haya dejado de venderlos.',
        vaciarLista: 'vaciar la lista', quitar: 'quitar',
        caption: (c) => `Tu comparativa de ${c.toLowerCase()}`,
        pie: (u, c, f) => `El precio por ${u} es el que ordena la tabla de ${c.toLowerCase()}; el resto son datos de la ficha. Precios recogidos el ${f}.` },
  en: { tienda: 'Store', envase: 'Pack', precioPor: (u) => `Price per ${u}`,
        alMes: 'Per month (1 serving/day)', formato: 'Size', capsulas: 'capsules',
        verif: 'Verification', nivel: 'Level', comprar: 'Buy', verTienda: 'see in store →',
        conCuenta: 'Comparing products is for readers with an account.', entrar: 'Sign in',
        cargando: 'Loading your comparison…',
        vacio: ['You have not saved any products yet. In any category table, the', ' + compare', ' button on each row brings it here.'],
        guardados: (n) => (n === 1 ? 'product saved' : 'products saved'), vaciar: 'clear',
        yaNo: 'The products you saved are no longer in the ranking: the store may have stopped selling them.',
        vaciarLista: 'clear the list', quitar: 'remove',
        caption: (c) => `Your ${c.toLowerCase()} comparison`,
        pie: (u, c, f) => `Price per ${u} is what orders the ${c.toLowerCase()} table; the rest is product data. Prices collected on ${f}.` },
  fr: { tienda: 'Boutique', envase: 'Contenant', precioPor: (u) => `Prix par ${u}`,
        alMes: 'Par mois (1 portion/jour)', formato: 'Format', capsulas: 'gélules',
        verif: 'Vérification', nivel: 'Niveau', comprar: 'Acheter', verTienda: 'voir en boutique →',
        conCuenta: 'Comparer des produits est réservé aux lecteurs avec un compte.', entrar: 'Se connecter',
        cargando: 'Chargement de votre comparatif…',
        vacio: ['Vous n’avez encore enregistré aucun produit. Dans n’importe quel tableau de catégorie, le bouton', ' + comparer', ' de chaque ligne l’ajoute ici.'],
        guardados: (n) => (n === 1 ? 'produit enregistré' : 'produits enregistrés'), vaciar: 'vider',
        yaNo: 'Les produits enregistrés ne sont plus dans le classement : la boutique a peut-être cessé de les vendre.',
        vaciarLista: 'vider la liste', quitar: 'retirer',
        caption: (c) => `Votre comparatif : ${c.toLowerCase()}`,
        pie: (u, c, f) => `Le prix par ${u} est ce qui ordonne le tableau ${c.toLowerCase()} ; le reste vient de la fiche. Prix relevés le ${f}.` },
};

const filas = (t, lang) => [
  { et: t.tienda, v: (p) => TIENDAS[p.tienda] ?? p.tienda },
  { et: t.envase, v: (p) => eur(p.precio_envase_eur, 2, lang) },
  { et: t.precioPor, v: (p, u) => eur(p.precio_por_unidad_eur, u === 'kg' ? 2 : 3, lang),
    destacar: (p) => p.precio_por_unidad_eur },
  { et: t.alMes, v: (p) => (costeMes(p) != null ? eur(costeMes(p), 2, lang) : '—') },
  { et: t.formato, v: (p) => (p.formato_gramos ? `${p.formato_gramos} g`
                              : p.unidades ? `${p.unidades} ${t.capsulas}` : '—') },
  { et: t.verif, v: (p) => `${t.nivel} ${p.nivel_verificacion}` },
  { et: 'Score', v: (p) => (p.score != null ? p.score.toFixed(0) : '—') },
];

export default function Comparador({ lang = 'es', nombres = {} }) {
  const t = T[lang] ?? T.es;
  const FILAS = filas(t, lang);
  const [elegidos, setElegidos] = useState([]);
  const [datos, setDatos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState(undefined);   // undefined = aun preguntando

  useEffect(() => { quienSoy().then(setUsuario); }, []);

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

  if (usuario === null) {
    return (
      <p className="vacio">
        {t.conCuenta}{' '}
        <button type="button" className="boton primario" onClick={irAEntrar}>{t.entrar}</button>
      </p>
    );
  }
  if (cargando || usuario === undefined) return <p className="sutil">{t.cargando}</p>;

  if (elegidos.length === 0) {
    return (
      <p className="vacio">
        {t.vacio[0]}<b>{t.vacio[1]}</b>{t.vacio[2]}
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
        <b>{elegidos.length}</b> {t.guardados(elegidos.length)}
        <button type="button" className="chip" onClick={vaciar}>{t.vaciar}</button>
      </p>

      {vivos.length === 0 && (
        <p className="vacio">
          {t.yaNo} <button type="button" className="chip" onClick={vaciar}>{t.vaciarLista}</button>
        </p>
      )}

      {vivos.map(([cat, productos]) => {
        const unidad = UNIDAD[lang]?.[datos[cat].unidad_precio] ?? 'kg';
        const nombre = nombres[cat] ?? datos[cat].categoria;
        // El mejor de cada fila que se pueda comparar con un numero: se marca, porque una
        // tabla de cuatro columnas sin nada marcado obliga a leerla entera.
        const mejorPrecio = Math.min(...productos.map((p) => p.precio_por_unidad_eur ?? Infinity));
        return (
          <section className="bloque-comparativa" key={cat}>
            <h2>{nombre}</h2>
            <div className="tabla-marco">
              <div className="tabla-scroll">
                <table className="comparativa">
                  <caption>{t.caption(nombre)}</caption>
                  <thead>
                    <tr>
                      <th />
                      {productos.map((p) => (
                        <th key={p.slug}>
                          <a href={`/producto/${p.slug}/`}>{p.nombre}</a>
                          <button type="button" className="chip" onClick={() => quitar(p.slug)}>
                            {t.quitar}
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
                      <th scope="row">{t.comprar}</th>
                      {productos.map((p) => (
                        <td key={p.slug}>
                          <a className="enlace-accion" href={p.url_tienda}
                             rel="nofollow noopener" target="_blank">{t.verTienda}</a>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="sutil">
              {t.pie(unidad, nombre, datos[cat].recogido)}
            </p>
          </section>
        );
      })}
    </>
  );
}
