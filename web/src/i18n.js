// El motor de idiomas. Tres cosas y ninguna mas: en que idiomas esta la web, como se
// arma la URL de cada uno, y como se saca un texto traducido.
//
// Decisiones que explican por que esto cabe en un fichero:
//
//   1. El espanol NO lleva prefijo. La web lleva publicada meses con /creatina/ y
//      /guia/creatina/ indexadas; mover el espanol a /es/ tiraria las 4.818 URLs a una
//      redireccion y habria que reconstruir el indice entero. Ingles y frances cuelgan
//      de /en/ y /fr/, que es lo que recomienda Google para subcarpetas por idioma.
//
//   2. Los slugs NO se traducen. /en/guia/creatina/ y no /en/guide/creatine/.
//      ponytail: sin tabla de slugs por idioma, el alternate de cada pagina es el mismo
//      camino con otro prefijo y el selector de idioma es un reemplazo de prefijo.
//      Techo conocido: un slug en espanol posiciona peor en ingles. Si alguna vez toca,
//      la salida es un mapa {camino_es: {en, fr}} aqui mismo y `ruta()` mirandolo; el
//      resto del sitio no se entera porque ya pasa por `ruta()`.
//
//   3. Si falta una traduccion, sale el espanol. No un `undefined`, no la clave cruda.
//      Asi se puede traducir por partes sin que la web se rompa por el camino, que es
//      la unica manera de traducir 380 KB de prosa sin un big bang.

import { TEXTOS } from './datos/textos.js';

export const POR_DEFECTO = 'es';
export const IDIOMAS = ['es', 'en', 'fr'];

/** Lo que va en <html lang> y en `inLanguage` del JSON-LD. */
export const LANG = { es: 'es-ES', en: 'en', fr: 'fr' };
/** Lo que va en og:locale. Facebook y compania quieren el guion bajo y el pais. */
export const OG_LOCALE = { es: 'es_ES', en: 'en_US', fr: 'fr_FR' };
/** El idioma escrito en su propio idioma: asi se rotula un selector de idioma. */
// ponytail: los unicos literales con tilde del codigo. Este rotulo se pinta tambien en
// /en/ y /fr/, donde el restaurador de tildes no entra, asi que no hay otro sitio.
export const NOMBRE_IDIOMA = { es: 'Español', en: 'English', fr: 'Français' };
/** Para Intl: separadores de miles y formato de numero. */
export const INTL = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR' };

/** El prefijo de URL de un idioma: '' para el espanol, '/en' y '/fr' para los otros. */
export const prefijo = (lang) => (lang === POR_DEFECTO ? '' : `/${lang}`);

/**
 * La URL de un camino en un idioma. El camino se escribe SIEMPRE en su forma espanola
 * ('/guia/creatina/') y esto le pone el prefijo que toque.
 */
export const ruta = (lang, camino = '/') => {
  const limpio = camino.startsWith('/') ? camino : `/${camino}`;
  // La barra final no es cosmetica (ver sitio.js). '/en' + '/' seria '/en/' y eso esta
  // bien, pero '/en' + '' daria '/en' sin barra y Cloudflare responderia un 308.
  return `${prefijo(lang)}${limpio}` || '/';
};

/**
 * Lo que devuelve `getStaticPaths` para multiplicar una pagina por los tres idiomas.
 * El parametro se llama `idioma` y es un rest param `[...idioma]`, que es lo unico de
 * Astro que casa con cero segmentos: asi el espanol sigue viviendo en la raiz.
 *
 * `extra` permite componer con las paginas que ya tenian su propio getStaticPaths:
 *   getStaticPaths = () => porIdioma(datos.categorias.map((c) => ({
 *     params: { categoria: c.slug }, props: { cat: c },
 *   })));
 */
export function porIdioma(paginas = [{ params: {}, props: {} }]) {
  return IDIOMAS.flatMap((lang) =>
    paginas.map(({ params = {}, props = {} }) => ({
      params: { ...params, idioma: lang === POR_DEFECTO ? undefined : lang },
      props: { ...props, lang },
    })));
}

/** El idioma de una ruta ya construida. Lo usan el sitemap y las pruebas. */
export const idiomaDe = (camino) => {
  const trozo = camino.replace(/^\//, '').split('/')[0];
  return IDIOMAS.includes(trozo) && trozo !== POR_DEFECTO ? trozo : POR_DEFECTO;
};

/** Quita el prefijo de idioma de una ruta: '/en/guia/creatina/' -> '/guia/creatina/'. */
export const sinPrefijo = (camino) => {
  const lang = idiomaDe(camino);
  return lang === POR_DEFECTO ? camino : camino.slice(lang.length + 1) || '/';
};

/**
 * El traductor de una pagina. Se pide una vez arriba del .astro y se usa abajo:
 *
 *   const t = textos(lang);
 *   <h1>{t('portada.h1')}</h1>
 *   <p>{t('portada.otras', restoCategorias.length)}</p>
 *
 * Una entrada de TEXTOS es un objeto {es, en, fr}. El valor es una cadena, o una
 * funcion cuando el texto lleva un numero o un nombre dentro. Que las tres versiones
 * vivan juntas es deliberado: asi se ve de un vistazo cual falta, sin comparar ficheros.
 */
export function textos(lang = POR_DEFECTO) {
  return function t(clave, ...args) {
    const entrada = TEXTOS[clave];
    if (!entrada) {
      // Una clave que no existe es un error de programacion, no de traduccion: se ve.
      if (import.meta.env?.DEV) console.warn(`[i18n] clave sin texto: ${clave}`);
      return clave;
    }
    const valor = entrada[lang] ?? entrada[POR_DEFECTO];
    return typeof valor === 'function' ? valor(...args) : valor;
  };
}

/** Un numero con los separadores del idioma: 4.818 en es/fr, 4,818 en en. */
export const num = (lang, n) => Number(n).toLocaleString(INTL[lang] ?? INTL.es);

const MESES = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
       'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
       'September', 'October', 'November', 'December'],
  fr: ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout',
       'septembre', 'octobre', 'novembre', 'decembre'],
};

/**
 * La fecha larga de cada idioma. A mano y no con Intl porque el resto del copy va sin
 * tildes a proposito (ver tildes.js) y `toLocaleDateString` mete "fevrier" con acento
 * en frances y "septiembre" bien, pero tambien coma y orden que no siempre es el que
 * se quiere. Tres plantillas se leen mejor que tres opciones de Intl.
 */
export const fechaLargaEn = (lang, iso) => {
  const [a, m, d] = String(iso).split('-');
  const dia = Number(d);
  const mes = (MESES[lang] ?? MESES.es)[Number(m) - 1];
  if (lang === 'en') return `${mes} ${dia}, ${a}`;
  if (lang === 'fr') return `${dia === 1 ? '1er' : dia} ${mes} ${a}`;
  return `${dia} de ${mes} de ${a}`;
};

/* --- Los textos que se le pasan a una isla de React ---------------------------------
   Astro serializa las props de una isla a JSON, asi que a React solo pueden viajar
   CADENAS: nada de funciones ni del diccionario entero (30 KB de textos.js en el bundle
   del navegador para quince frases). Cada isla recibe su paquete ya traducido, y los
   huecos que se rellenan en caliente van como marcadores (%n, %w, %t) que la isla
   sustituye con `replace`.

   Viven aqui y no en cada .astro porque el buscador se pinta en DOS sitios (la cabecera
   de todas las paginas y la portada) y dos copias del mismo paquete se desincronizan. */

export const txtBuscador = (lang) => {
  const t = textos(lang);
  return {
    aria: t('buscador.aria', '%n'),
    hueco: t('buscador.hueco'),
    empieza: t('buscador.empieza'),
    indexados: t('buscador.indexados', '%n'),
    cargando: t('buscador.cargando'),
    nada: t('buscador.nada'),
    nadaCola: t('buscador.nada_cola'),
    grupoCat: t('buscador.grupo_cat'),
    grupoProd: t('buscador.grupo_prod'),
    verComparativa: t('buscador.ver_comparativa'),
  };
};

export const txtPeso = (lang) => {
  const t = textos(lang);
  return {
    titulo: t('peso.titulo'),
    pistaOficial: t('peso.pista_oficial'),
    pista: t('peso.pista', '%w', '%c'),
    explicacion: t('peso.explicacion'),
    calidad: t('peso.calidad'),
    precio: t('peso.precio'),
    mando: t('peso.mando'),
    soloPrecio: t('peso.solo_precio'),
    mitad: t('peso.mitad'),
    soloCalidad: t('peso.solo_calidad'),
  };
};

export const txtPonderador = (lang) => {
  const t = textos(lang);
  return {
    sinCambio: t('ponderador.sin_cambio', '%w'),
    cambian: t('ponderador.cambian', '%w', '%n', '%t'),
    caption: t('ponderador.caption'),
    producto: t('tabla.col.producto'),
    tienda: t('tabla.tienda'),
    precio: t('peso.precio'),
    precioUnidad: t('ponderador.precio_unidad'),
    verificacion: t('tabla.col.verificacion'),
    score: t('tabla.col.score'),
    cambia: t('ponderador.cambia'),
    productos: t('buscador.grupo_prod').toLowerCase(),
    tienda1: t('comun.tiendas', 1).replace(/^\d+\s*/, ''),
    tiendaN: t('comun.tiendas', 2).replace(/^\d+\s*/, ''),
    nivel4: t('ponderador.nivel4'),
    mediana: t('ponderador.mediana'),
  };
};
