// Las guias de evidencia en ingles y frances, montadas sobre las espanolas.
//
// QUE SE TRADUCE Y QUE NO. De una guia se traduce lo que es prosa: el titular, el
// resumen, el nombre y el detalle de cada efecto, el protocolo, las dos listas de cuando
// compensa y las preguntas. NO se traducen tres cosas, y no por pereza:
//
//   · Las FUENTES. "Kreider et al., ISSN position stand (2017)" y su DOI son una
//     referencia bibliografica: se cita como la publico su autor o deja de identificar el
//     trabajo. Traducir el titulo de un articulo cientifico lo convierte en algo que no
//     se puede buscar.
//   · Los NUMEROS de las cifras. "+5 a 15 %" pasa a "+5 to 15 %": cambian las palabras y
//     la coma decimal, nunca los digitos. La autocomprobacion de abajo lo exige cifra a
//     cifra: si una guia en ingles dijera otro numero que la espanola, una de las dos
//     mentiria sobre el mismo estudio, y eso tumba el build en vez de publicarse.
//   · El INDICE `f` que une cada efecto con su fuente, por lo mismo.
//
// EL RESPALDO ES POR CAMPO, no por guia. Una guia a medio traducir sale con sus campos
// traducidos en el idioma y el resto en espanol, en vez de caerse entera al espanol. Es
// lo que permite traducir cincuenta guias por tandas sin publicar una web rota por el
// camino, y lo que hace que anadir una guia nueva en espanol no rompa /en/ ni /fr/.

import { EVIDENCIA } from './evidencia.js';
import { EVIDENCIA_EN } from './evidencia-en.js';
import { EVIDENCIA_FR } from './evidencia-fr.js';

const POR_IDIOMA = { en: EVIDENCIA_EN, fr: EVIDENCIA_FR };

// "1,6 g/kg/dia" y "1.6 g/kg/day" tienen los mismos numeros; "1,8 g" no.
// ponytail: separador de miles (10.000 / 10,000 / 10 000) se quita antes de comparar
const numeros = (x) => (String(x).replace(/(\d)[.,\s  ](?=\d{3}(?!\d))/g, '$1').match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(',', '.'));
const mismosNumeros = (a, b) => numeros(a).join('|') === numeros(b).join('|');

/** El nivel de evidencia, con su etiqueta y su explicacion, en los tres idiomas. */
export const NIVELES_EVIDENCIA_I18N = {
  es: {
    alta: { etiqueta: 'Evidencia alta',
            explica: 'Varios metaanalisis o posicionamientos de sociedades cientificas '
                   + 'coinciden en que hay efecto.' },
    media: { etiqueta: 'Evidencia media',
             explica: 'Hay estudios a favor, pero pocos, con muestras pequenas o midiendo '
                    + 'marcadores en vez de resultados.' },
    baja: { etiqueta: 'Evidencia baja',
            explica: 'Las revisiones no encuentran un efecto consistente. Se lista porque se '
                   + 'vende, no porque funcione.' },
  },
  en: {
    alta: { etiqueta: 'Strong evidence',
            explica: 'Several meta-analyses or position stands from scientific societies '
                   + 'agree that there is an effect.' },
    media: { etiqueta: 'Moderate evidence',
             explica: 'There are studies in favour, but few, with small samples or measuring '
                    + 'markers instead of outcomes.' },
    baja: { etiqueta: 'Weak evidence',
            explica: 'Reviews find no consistent effect. It is listed because it sells, not '
                   + 'because it works.' },
  },
  fr: {
    alta: { etiqueta: 'Preuves solides',
            explica: 'Plusieurs méta-analyses ou prises de position de sociétés savantes '
                   + 'concordent : il y a un effet.' },
    media: { etiqueta: 'Preuves moyennes',
             explica: 'Il y a des études favorables, mais peu nombreuses, avec de petits '
                    + 'échantillons ou mesurant des marqueurs plutôt que des résultats.' },
    baja: { etiqueta: 'Preuves faibles',
            explica: 'Les revues ne trouvent pas d’effet constant. Il figure ici parce qu’il '
                   + 'se vend, pas parce qu’il fonctionne.' },
  },
};

/** El nivel de evidencia en el idioma que toque, con el espanol de respaldo. */
export const nivelEvidencia = (nivel, lang = 'es') =>
  NIVELES_EVIDENCIA_I18N[lang]?.[nivel] ?? NIVELES_EVIDENCIA_I18N.es[nivel];

/**
 * La guia de una categoria en el idioma que toque.
 *
 * Devuelve SIEMPRE un objeto con la misma forma que el espanol, asi que la pagina no
 * tiene que saber si esta traducida o no. En espanol devuelve el mismo objeto sin
 * copiarlo: es el camino de las 4.818 paginas del sitio.
 */
export function evidenciaEn(slug, lang = 'es') {
  const base = EVIDENCIA[slug];
  const tr = POR_IDIOMA[lang]?.[slug];
  if (!base || !tr) return base;

  // Los efectos se emparejan POR POSICION con los espanoles. La traduccion aporta el
  // texto (`que`, `detalle` y las palabras de la `cifra`); el indice de la fuente sale
  // siempre del espanol. Que los numeros de la cifra no cambien lo vigila la
  // autocomprobacion (mismosNumeros), no la buena voluntad de quien traduce.
  const efectos = base.efectos.map((e, i) => {
    const cifra = tr.efectos?.[i]?.cifra ?? e.cifra;
    // Se comprueba aqui, en el build, y no solo en la autocomprobacion: una cifra con un
    // numero distinto del espanol no se publica, revienta la pagina.
    if (!mismosNumeros(cifra, e.cifra)) {
      throw new Error(`${lang}/${slug}: la cifra "${cifra}" no coincide con "${e.cifra}"`);
    }
    return {
      ...e,
      que: tr.efectos?.[i]?.que ?? e.que,
      cifra,
      detalle: tr.efectos?.[i]?.detalle ?? e.detalle,
    };
  });

  return {
    ...base,
    h1: tr.h1 ?? base.h1,
    titulo: tr.titulo ?? base.titulo,
    descripcion: tr.descripcion ?? base.descripcion,
    resumen: tr.resumen ?? base.resumen,
    efectos,
    protocolo: {
      ...base.protocolo,
      dosis: tr.protocolo?.dosis ?? base.protocolo.dosis,
      cuando: tr.protocolo?.cuando ?? base.protocolo.cuando,
      tarda: tr.protocolo?.tarda ?? base.protocolo.tarda,
      notas: tr.protocolo?.notas ?? base.protocolo.notas,
    },
    cuando_si: tr.cuando_si ?? base.cuando_si,
    cuando_no: tr.cuando_no ?? base.cuando_no,
    faqs: tr.faqs ?? base.faqs,
    // `nivel` y `fuentes` no se traducen nunca: ver el cabecero.
  };
}

/** Cuantas guias hay escritas en cada idioma. Lo usa la autocomprobacion y el README. */
export const cobertura = () => {
  const total = Object.keys(EVIDENCIA).length;
  return {
    total,
    en: Object.keys(EVIDENCIA_EN).length,
    fr: Object.keys(EVIDENCIA_FR).length,
  };
};

// Autocomprobacion: node src/datos/evidencia-i18n.js
//
// Lo que comprueba es justo lo que se puede romper en silencio al traducir cincuenta
// guias por tandas: que una traduccion apunte a un slug que ya no existe, que tenga mas o
// menos efectos que la espanola (con lo que se descolocaria el emparejamiento por
// posicion), o que una cifra traducida diga un numero distinto del espanol.
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('evidencia-i18n.js')) {
  const assert = (c, m) => { if (!c) throw new Error(m); };

  for (const [lang, mapa] of Object.entries(POR_IDIOMA)) {
    for (const [slug, tr] of Object.entries(mapa)) {
      assert(EVIDENCIA[slug], `${lang}/${slug}: no existe esa guia en espanol`);
      const base = EVIDENCIA[slug];
      if (tr.efectos) {
        assert(tr.efectos.length === base.efectos.length,
          `${lang}/${slug}: ${tr.efectos.length} efectos traducidos frente a `
          + `${base.efectos.length} en espanol; el emparejamiento es por posicion`);
        for (const e of tr.efectos) {
          assert(!('cifra' in e) || mismosNumeros(e.cifra, base.efectos[tr.efectos.indexOf(e)].cifra),
            `${lang}/${slug}: la cifra "${e.cifra}" no tiene los mismos numeros que la espanola`);
          assert(!('f' in e), `${lang}/${slug}: un efecto trae "f"; el indice de la fuente `
            + 'sale del espanol');
        }
      }
      assert(!('fuentes' in tr), `${lang}/${slug}: trae "fuentes"; las citas no se traducen`);
      assert(!('nivel' in tr), `${lang}/${slug}: trae "nivel"; el nivel sale del espanol`);
      if (tr.protocolo?.notas) {
        assert(Array.isArray(tr.protocolo.notas), `${lang}/${slug}: notas no es una lista`);
      }
      if (tr.faqs) {
        for (const f of tr.faqs) {
          assert(f.p && f.r, `${lang}/${slug}: una pregunta esta a medias`);
        }
      }
    }
  }

  // El merge funciona y respeta lo que no se traduce.
  const cre = evidenciaEn('creatina', 'en');
  assert(cre.fuentes === EVIDENCIA.creatina.fuentes, 'las fuentes se copian, no se traducen');
  assert(cre.nivel === EVIDENCIA.creatina.nivel, 'el nivel sale del espanol');
  assert(mismosNumeros(cre.efectos[0].cifra, EVIDENCIA.creatina.efectos[0].cifra), 'la cifra no cambia');
  assert(evidenciaEn('creatina', 'es') === EVIDENCIA.creatina, 'en espanol no se copia');
  assert(nivelEvidencia('alta', 'fr').etiqueta === 'Preuves solides', 'nivel en frances');
  assert(nivelEvidencia('alta', 'pt').etiqueta.startsWith('Evidencia'), 'respaldo al espanol');

  const c = cobertura();
  console.log(`evidencia-i18n.js OK — ${c.en}/${c.total} guias en ingles, `
            + `${c.fr}/${c.total} en frances`);
}
