// Constantes del sitio. El dominio vive AQUI y solo aqui: de este fichero salen el
// canonical, el sitemap, el robots.txt, el llms.txt, la og:image y todo el JSON-LD.
// Cambiarlo aqui lo cambia en las 440 paginas.
export const SITIO = {
  url: 'https://fitnesssupplementwiki.com',
  nombre: 'FitnessSupplementWiki',
  lema: 'Precio por kilo y certificacion comprobada',
  descripcion:
    'Comparativa de suplementos deportivos en Espana por precio por kilo (o por capsula) ' +
    'y por el nivel de verificacion de sus certificaciones, con el desglose de cada nota.',
  idioma: 'es-ES',
  pais: 'ES',

  // Datos del aviso legal (LSSI-CE art. 10). El contacto tiene que ser real y estar
  // atendido: es lo que mira un programa de afiliados antes de aprobar un alta, y una
  // web sin nadie detras no la posiciona Google ni la cita un modelo.
  contacto: 'franmunozvillanova@gmail.com',
  // Nombre o razon social del responsable. Con tilde y con enye porque es un nombre
  // propio, no codigo. Vacio = /legal lo marca como pendiente a la vista.
  titular: 'Fran Muñoz Villanova',

  // Quien firma. E-E-A-T: una web de suplementos es YMYL para Google, y sin una persona
  // identificable detras no pasa del top 10 por mucho dato que tenga. Lo que va aqui tiene
  // que ser cierto: el rol es el que es (quien construye y mantiene el metodo), no un
  // titulo sanitario. Inventarse un dietista es lo unico que puede tumbar el dominio entero.
  autor: {
    nombre: 'Fran Muñoz Villanova',
    rol: 'Desarrollador y responsable del metodo de comparacion',
    // Lo que si se puede afirmar y se puede comprobar leyendo /metodologia.
    hace: 'Escribe el scraper, el motor de puntuacion y las comprobaciones de sellos.',
    // Lo que no. Va publicado igual de grande que lo anterior.
    no_hace: 'El autor no es profesional sanitario y esta web no da consejo medico ni ' +
             'nutricional.',
  },

  // Cloudflare Web Analytics: sin cookies y sin datos personales, asi que no obliga a
  // banner de consentimiento. Tres valores:
  //   ''     -> no hay medicion, y /legal lo dice con esas palabras.
  //   'auto' -> Cloudflare inyecta el beacon en el borde (Web Analytics > Automatic setup).
  //             Aqui NO se pinta script: pintarlo cargaria el beacon dos veces.
  //   token  -> setup manual; Base.astro pinta el script con ese token.
  // Lo que decide el texto de /legal es que esto no este vacio, no que sea un token.
  analitica: 'auto',
};

// URL absoluta a partir de una ruta ("/creatina" -> "https://.../creatina").
export const abs = (ruta) => new URL(ruta, SITIO.url).href;
