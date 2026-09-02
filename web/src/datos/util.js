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
export const duracionDias = (p) => p.servicios_por_envase || null;
export const costeMes = (p) =>
  (p.servicios_por_envase ? (p.precio_eur / p.servicios_por_envase) * 30 : null);

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

// --- La seleccion para comparar -------------------------------------------------
// Vive en el navegador de quien la hace y en ningun sitio mas: son cuatro slugs, no hace
// falta cuenta, ni servidor, ni cookie que consentir. Sobrevive al cierre del navegador,
// que es justo lo que la convierte en "lo que estoy mirando esta semana" y no en un
// carrito que se borra al cambiar de pagina.
export const CLAVE_SELECCION = 'comparar';
export const TOPE_SELECCION = 4;

export const leerSeleccion = () => {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_SELECCION) ?? '[]');
    return Array.isArray(guardado) ? guardado.slice(0, TOPE_SELECCION) : [];
  } catch {
    return [];        // modo privado, almacenamiento lleno o JSON de otra version
  }
};

export const guardarSeleccion = (lista) => {
  try {
    localStorage.setItem(CLAVE_SELECCION, JSON.stringify(lista));
  } catch { /* si el navegador no deja guardar, la seleccion dura lo que la pestana */ }
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
