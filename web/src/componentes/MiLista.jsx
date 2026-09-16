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

const T = {
  es: { conCuenta: 'Mi lista va guardada en tu cuenta, asi que hay que entrar para verla.', entrar: 'Entrar',
        cargando: 'Cargando tu lista…', teHan: (n) => `Alguien te ha pasado una lista de ${n} productos.`,
        nadaAun: 'No se ha guardado nada todavia: se anaden a la tuya solo si lo dices tu.',
        anadir: 'anadirlos a mi lista', noGracias: 'no, gracias',
        vacio: ['Todavia no has guardado nada. En cualquier tabla de categoria, el boton', ' ♡ mi lista', ' de cada fila lo trae aqui; en la ficha de un producto esta al lado del precio, junto a la dosis que tomas. Se guarda en tu cuenta.'],
        enLista: (n) => (n === 1 ? 'producto en tu lista' : 'productos en tu lista'), vaciar: 'vaciar',
        copiado: 'enlace copiado', copiar: 'copiar enlace', caption: 'Lo que tomas, con tu dosis',
        producto: 'Producto', alDia: 'Al dia', envase: 'Envase', dura: 'Dura', alMes: 'Al mes',
        yaNo: 'ya no esta en el ranking', servicios: 'Servicios al dia', dias: 'dias', quitar: 'quitar',
        gastoMes: 'Tu gasto al mes', conDosis: (n) => `${n} ${n === 1 ? 'producto' : 'productos'} con la dosis que has puesto`,
        sinSumar: (n) => ` · ${n} sin sumar: su tienda no declara los servicios por envase`,
        avisos: 'Tus avisos de precio', baja: (p) => ` · te avisamos si baja de ${p}` },
  en: { conCuenta: 'My list is saved to your account, so you need to sign in to see it.', entrar: 'Sign in',
        cargando: 'Loading your list…', teHan: (n) => `Someone has shared a list of ${n} products with you.`,
        nadaAun: 'Nothing has been saved yet: they are only added to yours if you say so.',
        anadir: 'add them to my list', noGracias: 'no, thanks',
        vacio: ['You have not saved anything yet. In any category table, the', ' ♡ my list', ' button on each row brings it here; on a product page it sits next to the price, with the dose you take. It is saved to your account.'],
        enLista: (n) => (n === 1 ? 'product in your list' : 'products in your list'), vaciar: 'clear',
        copiado: 'link copied', copiar: 'copy link', caption: 'What you take, with your dose',
        producto: 'Product', alDia: 'Per day', envase: 'Pack', dura: 'Lasts', alMes: 'Per month',
        yaNo: 'no longer in the ranking', servicios: 'Servings per day', dias: 'days', quitar: 'remove',
        gastoMes: 'Your monthly spend', conDosis: (n) => `${n} ${n === 1 ? 'product' : 'products'} with the dose you set`,
        sinSumar: (n) => ` · ${n} not counted: their store does not state servings per pack`,
        avisos: 'Your price alerts', baja: (p) => ` · we will let you know if it drops below ${p}` },
  fr: { conCuenta: 'Ma liste est enregistrée dans votre compte : connectez-vous pour la voir.', entrar: 'Se connecter',
        cargando: 'Chargement de votre liste…', teHan: (n) => `Quelqu’un vous a transmis une liste de ${n} produits.`,
        nadaAun: 'Rien n’a encore été enregistré : ils ne s’ajoutent à la vôtre que si vous le décidez.',
        anadir: 'les ajouter à ma liste', noGracias: 'non, merci',
        vacio: ['Vous n’avez encore rien enregistré. Dans n’importe quel tableau de catégorie, le bouton', ' ♡ ma liste', ' de chaque ligne l’ajoute ici ; sur la fiche d’un produit, il se trouve à côté du prix, avec la dose que vous prenez. C’est enregistré dans votre compte.'],
        enLista: (n) => (n === 1 ? 'produit dans votre liste' : 'produits dans votre liste'), vaciar: 'vider',
        copiado: 'lien copié', copiar: 'copier le lien', caption: 'Ce que vous prenez, avec votre dose',
        producto: 'Produit', alDia: 'Par jour', envase: 'Contenant', dura: 'Dure', alMes: 'Par mois',
        yaNo: 'n’est plus dans le classement', servicios: 'Portions par jour', dias: 'jours', quitar: 'retirer',
        gastoMes: 'Votre dépense mensuelle', conDosis: (n) => `${n} ${n === 1 ? 'produit' : 'produits'} avec la dose indiquée`,
        sinSumar: (n) => ` · ${n} non comptés : leur boutique n’indique pas les portions par contenant`,
        avisos: 'Vos alertes de prix', baja: (p) => ` · nous vous prévenons s’il passe sous ${p}` },
};

export default function MiLista({ lang = 'es' }) {
  const t = T[lang] ?? T.es;
  const e2 = (n) => eur(n, 2, lang);
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
        {t.conCuenta}{' '}
        <button type="button" className="boton primario" onClick={irAEntrar}>{t.entrar}</button>
      </p>
    );
  }
  if (cargando) return <p className="sutil">{t.cargando}</p>;

  const banner = compartida.length > 0 && (
    <p className="nota">
      <strong>{t.teHan(compartida.length)}</strong>{' '}
      {t.nadaAun}
      <button type="button" className="enlace-accion" onClick={anadirCompartida}>
        {t.anadir}
      </button>
      <button type="button" className="enlace-accion" onClick={() => setCompartida([])}>
        {t.noGracias}
      </button>
    </p>
  );

  if (lista.length === 0) {
    return (
      <>
        {banner}
        <p className="vacio">
          {t.vacio[0]}<b>{t.vacio[1]}</b>{t.vacio[2]}
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
        <b>{lista.length}</b> {t.enLista(lista.length)}
        <button type="button" className="chip" onClick={vaciar}>{t.vaciar}</button>
        <button type="button" className="chip" onClick={copiar}>
          {copiado ? t.copiado : t.copiar}
        </button>
      </p>

      <div className="tabla-marco">
        <div className="tabla-scroll">
          <table className="apilable mi-lista-tabla">
            <caption>{t.caption}</caption>
            <thead>
              <tr>
                <th>{t.producto}</th>
                <th>{t.alDia}</th>
                <th className="num">{t.envase}</th>
                <th className="num">{t.dura}</th>
                <th className="num">{t.alMes}</th>
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
                        : <span className="sutil"> · {t.yaNo}</span>}
                    </td>
                    <td data-et={t.alDia}>
                      {/* aria-label y no un <label> con texto escondido: la columna ya
                          se llama "Al dia" en la cabecera, y en movil el rotulo lo pone
                          el data-et de la celda. */}
                      <select value={f.d} aria-label={t.servicios}
                              onChange={(e) => guardar(conDosis(lista, f.s, Number(e.target.value)))}>
                        {DOSIS.map((d) => (
                          <option key={d} value={d}>{lang === 'en' ? String(d) : String(d).replace('.', ',')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="num" data-et={t.envase}>
                      {f.ficha ? e2(f.ficha.precio_envase_eur) : '—'}
                    </td>
                    <td className="num" data-et={t.dura}>
                      {dias != null ? `${Math.round(dias)} ${t.dias}` : '—'}
                    </td>
                    <td className="num" data-et={t.alMes}>{mes != null ? e2(mes) : '—'}</td>
                    <td>
                      <button type="button" className="enlace-accion peligro"
                              onClick={() => quitar(f.s)}>{t.quitar}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="total-lista">
        <span className="rotulo-total">{t.gastoMes}</span>
        <b>{e2(total)}</b>
        <span className="sutil">
          {t.conDosis(calculables.length)}
          {sinCuenta > 0 && t.sinSumar(sinCuenta)}
        </span>
      </p>

      {alertas.length > 0 && (
        <section className="avisos-puestos">
          <h2>{t.avisos}</h2>
          <ul>
            {alertas.map((a) => (
              <li key={a.producto}>
                <a href={`/producto/${a.producto}/`}>{comoSeLee(a.producto)}</a>
                <span className="sutil">{t.baja(e2(a.objetivo))}</span>
                <button type="button" className="enlace-accion peligro"
                        onClick={() => quitarAlerta(a.producto)}>{t.quitar}</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
