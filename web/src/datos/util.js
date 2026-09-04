// Helpers compartidos por las paginas .astro y la isla React.

import datos from './dataset.json' with { type: 'json' };

/** Como se reparte el score, en prosa y desde la config que de verdad puntua.
 *
 * Seis paginas mencionan el reparto en su texto. Escrito a mano en cada una, el dia que
 * cambian los pesos cinco se quedan mintiendo; escrito aqui, cambian las seis solas.
 */
export const reparto = (unidad) => {
  const c = datos.config;
  const pct = (n) => `${Math.round(n * 100)} %`;
  return `${pct(c.peso_coste)} precio${unidad ? ` por ${unidad}` : ''} frente al mas ` +
    `barato de la categoria, ${pct(c.peso_calidad)} calidad verificable (certificacion, ` +
    `pureza y aditivos), ${pct(c.peso_requisitos)} los requisitos de la categoria y ` +
    `${pct(c.peso_valoracion)} la nota de los compradores en la tienda`;
};

export const NIVEL = {
  4: { etiqueta: 'Verificado', clase: 'n4' },
  3: { etiqueta: 'Analisis de marca', clase: 'n3' },
  2: { etiqueta: 'Declarado', clase: 'n2' },
  1: { etiqueta: 'Sin certificar', clase: 'n1' },
};

// Los cuatro puntos del indicador de nivel: [true, true, false, false] para el 2.
export const puntos = (n) => [1, 2, 3, 4].map((i) => i <= n);

export const eur = (n, dec = 2) =>
  n == null ? '—' : n.toFixed(dec).replace('.', ',') + ' €';

// El precio con el que se compara y se puntua. La unidad la manda la categoria (polvo
// por kilo, perlas por capsula) y viaja siempre pegada al numero: "0,07 €" no dice nada
// si no sabes si es por kilo o por capsula.
export const UNIDAD = { kg: 'kg', capsula: 'capsula' };

export const precioReferencia = (p) =>
  p.precio_referencia == null
    ? { valor: '—', unidad: '' }
    : { valor: eur(p.precio_referencia, p.unidad_precio === 'kg' ? 2 : 3),
        unidad: UNIDAD[p.unidad_precio] ?? p.unidad_precio };

export const nombreIngrediente = (s) =>
  s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

// Cuanto dura el envase y cuanto sale al mes, A UN SERVICIO AL DIA. El supuesto va
// escrito al lado del numero siempre: la dosis que toma cada persona no la decide esta
// web, y "0,41 EUR al mes" sin decir a que ritmo es un numero inventado.
// Solo sale cuando la tienda declara los servicios por envase (hoy, 6 de cada 10).
//
// `porDia` son los servicios que toma quien lo pregunta, y por defecto es uno: los dos
// numeros de la ficha (los de siempre) son el caso `porDia = 1`. La calculadora de la
// ficha y mi lista pasan la dosis de verdad, que es lo unico que convierte "0,41 EUR al
// mes" en el numero de esa persona.
export const duracionDias = (p, porDia = 1) =>
  (p.servicios_por_envase && porDia > 0 ? p.servicios_por_envase / porDia : null);
export const costeMes = (p, porDia = 1) =>
  (p.servicios_por_envase && porDia > 0
    ? (p.precio_eur / p.servicios_por_envase) * 30 * porDia : null);

// Lo unico que pinta la tabla de categoria. El producto entero lleva ademas el desglose
// del score, los ingredientes con sus fuentes citadas y la serie de precios: 600 KB en
// /proteina-whey que ademas viajan DOS veces, una en el HTML ya pintado y otra en las
// props de la isla de React, que es lo que el navegador tiene que volver a parsear para
// hidratar. La tabla no mira ninguno de esos campos; la ficha, que si los usa, los tiene.
// Los nombres no cambian: la isla recibe productos con menos campos, no otra cosa.
export const paraTabla = (p) => ({
  id: p.id, slug: p.slug, marca: p.marca, nombre: p.nombre, tienda: p.tienda,
  url: p.url, url_afiliado: p.url_afiliado, imagen: p.imagen,
  precio_eur: p.precio_eur, precio_referencia: p.precio_referencia,
  unidad_precio: p.unidad_precio, score_final: p.score_final,
  nivel_verificacion: p.nivel_verificacion, flag_infradosaje: p.flag_infradosaje,
  sabores: p.sabores, sellos: p.sellos, categoria: p.categoria,
  servicios_por_envase: p.servicios_por_envase,
  // La nota de la tienda y la pureza real SI las pinta la tabla, en la celda del nombre.
  valoracion: p.valoracion, n_valoraciones: p.n_valoraciones, pureza_real: p.pureza_real,
  // Solo el recuento: la tabla pinta "3/4 requisitos" y el detalle vive en la ficha.
  requisitos_cumple: p.requisitos?.filter((r) => r.cumple).length,
  requisitos_total: p.requisitos?.length,
  // De la certificacion solo se lee el tipo (los chips "solo Creapure" / "solo IFOS").
  certificaciones: p.certificaciones?.map((c) => ({ tipo: c.tipo })),
});

export const TIENDAS = {
  hsn: 'HSN', myprotein: 'Myprotein', nutritienda: 'Nutritienda',
  lifepro: 'Life Pro', prozis: 'Prozis', masmusculo: 'MASmusculo',
  amazon: 'Amazon', zumub: 'Zumub', iogenix: 'iO.GENIX', demo: 'Demo',
  // Sin nombre aqui, una tienda sale con su clave interna ("tiendaculturista") en la
  // columna Tienda de las 30 tablas y dentro del titulo de sus fichas.
  bulevip: 'Bulevip', dosfarma: 'DosFarma', promofarma: 'PromoFarma',
  tiendaculturista: 'Tienda Culturista', usafitness: 'USA Fitness',
  vitobest: 'VitOBest', quamtrax: 'Quamtrax', sotya: 'Sotya',
  crown: 'Crown Sport Nutrition', hollandbarrett: 'Holland & Barrett',
  '226ers': '226ERS',
};

// --- Las tres listas que guarda el navegador ------------------------------------
// Lo que estas comparando, lo que tomas y lo que acabas de mirar. Viven en el navegador
// de quien las hace y en ningun sitio mas: son slugs, no hace falta cuenta, ni servidor,
// ni cookie que consentir. Sobreviven al cierre del navegador, que es justo lo que
// convierte "mi lista" en algo a lo que se vuelve y no en un carrito que se borra al
// cambiar de pagina.
//
// Las tres pasan por el mismo par de funciones. Tres pares copiados serian tres sitios
// donde arreglar el mismo try/catch del modo privado el dia que falle.
export const CLAVE_SELECCION = 'comparar';
export const CLAVE_LISTA = 'mi-lista';
export const CLAVE_VISTOS = 'vistos';
export const TOPE_SELECCION = 4;
// Mi lista no se pinta como tabla de columnas, asi que su tope no lo manda el ancho de
// la pantalla: esta solo para que un localStorage lleno no acabe rompiendo la pagina.
export const TOPE_LISTA = 50;
export const TOPE_VISTOS = 8;

export const leerLista = (clave, tope) => {
  try {
    const guardado = JSON.parse(localStorage.getItem(clave) ?? '[]');
    // `e && e.s`: lo que hay guardado puede ser de una version anterior de la web, y una
    // entrada sin slug revienta al pintarla mucho mas tarde y muy lejos de aqui.
    return Array.isArray(guardado) ? guardado.filter((e) => e && e.s).slice(0, tope) : [];
  } catch {
    return [];        // modo privado, almacenamiento lleno o JSON de otra version
  }
};

export const guardarLista = (clave, lista) => {
  try {
    localStorage.setItem(clave, JSON.stringify(lista));
  } catch { /* si el navegador no deja guardar, la lista dura lo que la pestana */ }
};

export const leerSeleccion = () => leerLista(CLAVE_SELECCION, TOPE_SELECCION);
export const guardarSeleccion = (lista) => guardarLista(CLAVE_SELECCION, lista);

// Un producto de mi lista es {s: slug, c: categoria, d: servicios al dia}. La dosis va
// en la lista y no en el producto porque es de quien lo toma, no del bote: el mismo
// envase dura dos meses o veinte dias segun quien lo abra.
export const leerMiLista = () => leerLista(CLAVE_LISTA, TOPE_LISTA);
export const guardarMiLista = (lista) => guardarLista(CLAVE_LISTA, lista);

export const enLista = (lista, slug) => lista.some((e) => e.s === slug);
export const alternarEnLista = (lista, item) => (enLista(lista, item.s)
  ? lista.filter((e) => e.s !== item.s)
  : [...lista, item].slice(-TOPE_LISTA));
export const conDosis = (lista, slug, d) => lista.map((e) => (e.s === slug ? { ...e, d } : e));

// --- Compartir la lista ---------------------------------------------------------
// La lista entera cabe en la direccion: "slug~categoria~dosis", separados por comas. Se
// comparte copiando un enlace y no guardando nada en ningun servidor, que es lo unico
// coherente con una lista que hasta ahora no ha salido del navegador.
//
// Sin comprimir ni codificar en base64 a proposito: asi el enlace se puede leer, y quien
// lo recibe ve lo que le estan mandando antes de abrirlo.
export const aEnlace = (lista) => lista.map((e) => `${e.s}~${e.c}~${e.d ?? 1}`).join(',');

export const deEnlace = (texto) => String(texto ?? '').split(',')
  .map((t) => t.split('~'))
  // Lo que llega por la barra de direcciones lo escribe cualquiera: sin slug o sin
  // categoria no hay nada que pedir, y esa entrada se cae aqui y no tres pantallas mas
  // alla.
  .filter(([s, c]) => s && c)
  .map(([s, c, d]) => ({ s, c, d: Number(d) > 0 ? Number(d) : 1 }))
  .slice(0, TOPE_LISTA);

// El nombre bonito de un producto vive en el dataset del build, no en D1. Donde solo hay
// slug (el perfil de un lector, los avisos de precio), esto es lo que se pinta: se lee, y
// el enlace lleva a la ficha, que si lo dice bien.
// ponytail: el escalon, si algun dia molesta, es un /datos/nombres.json con solo slug y
// nombre; hoy serian 190 KB para dos pantallas que casi nadie abre.
export const comoSeLee = (slug) => String(slug).replace(/-/g, ' ');

// Vistos recientemente: el ultimo delante y sin repetidos. Guarda el nombre dentro
// porque el unico sitio donde se pinta es una franja al pie de la ficha, y pedir el
// catalogo entero para poner ocho nombres seria pedir 2 MB por 200 caracteres.
export const apuntarVisto = (visto) => {
  const lista = [visto, ...leerLista(CLAVE_VISTOS, TOPE_VISTOS + 1).filter((e) => e.s !== visto.s)]
    .slice(0, TOPE_VISTOS);
  guardarLista(CLAVE_VISTOS, lista);
  return lista;
};

// --- El filtrado de la tabla ----------------------------------------------------
// Vive aqui y no dentro del componente por una razon concreta: dentro de un useMemo no
// se puede probar sin montar React y un DOM. Aqui son cinco filtros combinables y tres
// ordenes que se comprueban con node:test en dos milisegundos, y son justo la clase de
// logica que se rompe en silencio (un filtro que deja de filtrar no da error: da una
// tabla que parece bien y miente).
export const ORDENES = {
  score: { etiqueta: 'Score (recomendado)',
           cmp: (a, b) => (b.score_final ?? -1) - (a.score_final ?? -1) },
  kg: { etiqueta: 'Precio por kilo o capsula',
        cmp: (a, b) => (a.precio_referencia ?? 1e9) - (b.precio_referencia ?? 1e9) },
  precio: { etiqueta: 'Precio del envase', cmp: (a, b) => a.precio_eur - b.precio_eur },
  // La nota que le ponen los lectores de esta web (no la de la tienda). `tarde` significa
  // que este orden NO se pinta en el desplegable durante el build: las resenas viven en
  // D1 y las tablas son HTML estatico, asi que en el build no se sabe si esta categoria
  // tiene alguna. Lo anade tabla.js cuando /api/valoraciones contesta que si. Una opcion
  // que deja la tabla igual es peor que no tener la opcion.
  lectores: { etiqueta: 'Nota de los lectores', tarde: true,
              cmp: (a, b) => (b.lectores ?? -1) - (a.lectores ?? -1) },
};

export const tieneSello = (p, tipo) => p.certificaciones?.some((c) => c.tipo === tipo);

export const filtrar = (productos, { busqueda = '', tienda = '', nivelMin = 1,
                                     precioMax = '', sello = '', orden = 'score' } = {}) => {
  // El tope es por unidad de venta (EUR/kg o EUR/capsula), no por envase: quien busca
  // "proteina a menos de 20 EUR/kg" no busca botes de menos de 20 EUR, y filtrar por el
  // precio del envase le deja fuera justo los formatos grandes, que son los baratos.
  const tope = precioMax === '' ? Infinity : Number(precioMax);
  const q = busqueda.trim().toLowerCase();
  return productos
    .filter((p) => (!q || `${p.marca} ${p.nombre}`.toLowerCase().includes(q)))
    .filter((p) => (!tienda || p.tienda === tienda))
    .filter((p) => p.nivel_verificacion >= nivelMin)
    .filter((p) => (!sello || tieneSello(p, sello)))
    .filter((p) => (p.precio_referencia ?? Infinity) <= tope)
    .sort(ORDENES[orden].cmp);
};
