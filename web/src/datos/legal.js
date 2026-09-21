// El aviso legal, en los tres idiomas.
//
// Vive en su propio fichero y no en textos.js por una razon practica: son veinte parrafos
// largos, y metidos en el diccionario general tapaban las 200 claves cortas del resto de
// la web. Aqui estan juntos y se leen como lo que son, un documento.
//
// LO QUE NO CAMBIA AL TRADUCIR: la ley aplicable. Esta web la publica un titular espanol
// desde Espana, asi que el aviso se rige por la Ley 34/2002 (LSSI-CE) y el Reglamento (UE)
// 2016/679 (RGPD) lo mire quien lo mire, y la autoridad de control es la Agencia Espanola
// de Proteccion de Datos. La version inglesa y la francesa dicen exactamente lo mismo que
// la espanola: son la misma obligacion escrita en otro idioma, no otra obligacion. Por eso
// los nombres de las normas y del organismo van en su forma original, con la traduccion al
// lado entre parentesis: lo que identifica una ley es su nombre, no su traduccion.

export const LEGAL = {
  titulo: {
    es: 'Aviso legal, privacidad y afiliacion',
    en: 'Legal notice, privacy and affiliate links',
    fr: 'Mentions légales, confidentialité et affiliation',
  },
  descripcion: {
    es: 'Titular del sitio, tratamiento de datos, uso de cookies, relacion con las tiendas y '
      + 'limites de la informacion publicada en FitnessSupplementWiki.',
    en: 'Site owner, data processing, use of cookies, relationship with the stores and the '
      + 'limits of the information published on FitnessSupplementWiki.',
    fr: 'Titulaire du site, traitement des données, usage des cookies, relation avec les '
      + 'boutiques et limites de l’information publiée sur FitnessSupplementWiki.',
  },
  miga: { es: 'Legal', en: 'Legal', fr: 'Mentions légales' },
  antetitulo: {
    es: 'Condiciones de uso', en: 'Terms of use', fr: 'Conditions d’utilisation',
  },
  h1: {
    es: 'Aviso legal y privacidad', en: 'Legal notice and privacy',
    fr: 'Mentions légales et confidentialité',
  },
  entradilla: {
    es: (sitio) => `Quien esta detras de ${sitio}, que hace esta web con tus datos (nada) y `
                 + 'que relacion tiene con las tiendas que compara.',
    en: (sitio) => `Who is behind ${sitio}, what this site does with your data (nothing) and `
                 + 'what relationship it has with the stores it compares.',
    fr: (sitio) => `Qui est derrière ${sitio}, ce que ce site fait de vos données (rien) et `
                 + 'quelle relation il entretient avec les boutiques qu’il compare.',
  },

  // --- 1. Titular ---
  h2_titular: {
    es: 'Titular del sitio', en: 'Site owner', fr: 'Titulaire du site',
  },
  titular_intro: {
    es: 'En cumplimiento del articulo 10 de la Ley 34/2002 de servicios de la sociedad de la '
      + 'informacion y de comercio electronico:',
    en: 'In compliance with article 10 of Spanish Law 34/2002 on information society services '
      + 'and electronic commerce (Ley 34/2002, LSSI-CE):',
    fr: 'En application de l’article 10 de la loi espagnole 34/2002 sur les services de la '
      + 'société de l’information et le commerce électronique (Ley 34/2002, LSSI-CE) :',
  },
  li_titular: { es: 'Titular:', en: 'Owner:', fr: 'Titulaire :' },
  li_correo: { es: 'Correo de contacto:', en: 'Contact email:', fr: 'Courriel de contact :' },
  li_web: { es: 'Sitio web:', en: 'Website:', fr: 'Site web :' },
  li_actividad: { es: 'Actividad:', en: 'Activity:', fr: 'Activité :' },
  actividad: {
    es: ' publicacion de comparativas de precios y certificaciones de suplementos '
      + 'alimenticios a la venta en tiendas de terceros. Esta web no vende ni distribuye '
      + 'ningun producto.',
    en: ' publishing price and certification comparisons of food supplements sold in '
      + 'third-party stores. This site neither sells nor distributes any product.',
    fr: ' publication de comparatifs de prix et de certifications de compléments '
      + 'alimentaires vendus dans des boutiques tierces. Ce site ne vend ni ne distribue '
      + 'aucun produit.',
  },

  // --- 2. Proteccion de datos ---
  h2_privacidad: {
    es: 'Proteccion de datos', en: 'Data protection', fr: 'Protection des données',
  },
  privacidad_p1a: { es: 'Navegar por esta web ', en: 'Browsing this site ', fr: 'Naviguer sur ce site ' },
  privacidad_negrita: {
    es: 'no requiere dar ningun dato', en: 'requires no data at all',
    fr: 'ne demande aucune donnée',
  },
  privacidad_p1b: {
    es: ': las paginas son estaticas, no hay perfilado, no hay publicidad personalizada y no '
      + 'se vende ni se cede nada a nadie. Solo se guardan datos personales en dos casos, y '
      + 'en los dos los das tu a proposito:',
    en: ': the pages are static, there is no profiling, no personalised advertising, and '
      + 'nothing is sold or shared with anyone. Personal data is only stored in two cases, '
      + 'and in both of them you give it on purpose:',
    fr: ' : les pages sont statiques, il n’y a ni profilage, ni publicité personnalisée, et '
      + 'rien n’est vendu ni cédé à qui que ce soit. Des données personnelles ne sont '
      + 'conservées que dans deux cas, et dans les deux vous les donnez volontairement :',
  },
  li_cuenta_t: {
    es: 'Si creas una cuenta', en: 'If you create an account', fr: 'Si vous créez un compte',
  },
  li_cuenta: {
    es: ' para escribir resenas: se guarda tu nombre, tu correo y tu contrasena (esta ultima '
      + 'cifrada con PBKDF2, nunca en claro), mas las resenas y las fotos que publiques. '
      + 'Sirven para eso y para nada mas: no se ceden ni se usan para mandarte publicidad. El '
      + 'unico correo que puedes recibir es el enlace para cambiar tu contrasena, y solo si '
      + 'lo pides tu; lo envia Resend, que actua como encargado del tratamiento y no lo usa '
      + 'para otra cosa.',
    en: ' in order to write reviews: your name, your email and your password are stored (the '
      + 'last one hashed with PBKDF2, never in the clear), plus the reviews and photos you '
      + 'publish. They serve that and nothing else: they are not shared and not used to send '
      + 'you advertising. The only email you can receive is the link to change your password, '
      + 'and only if you ask for it; it is sent by Resend, which acts as a data processor and '
      + 'does not use it for anything else.',
    fr: ' pour écrire des avis : votre nom, votre courriel et votre mot de passe sont '
      + 'conservés (ce dernier chiffré avec PBKDF2, jamais en clair), ainsi que les avis et '
      + 'les photos que vous publiez. Ils servent à cela et à rien d’autre : ils ne sont ni '
      + 'cédés ni utilisés pour vous envoyer de la publicité. Le seul courriel que vous '
      + 'pouvez recevoir est le lien pour changer votre mot de passe, et seulement si vous le '
      + 'demandez ; il est envoyé par Resend, qui agit comme sous-traitant et ne l’utilise '
      + 'pour rien d’autre.',
  },
  li_correo_t: {
    es: 'Si escribes al correo de contacto', en: 'If you write to the contact address',
    fr: 'Si vous écrivez à l’adresse de contact',
  },
  li_correo_c: {
    es: ': tu mensaje y tu direccion se usan unicamente para responderte y se conservan '
      + 'mientras dure esa conversacion.',
    en: ': your message and your address are used only to reply to you and are kept for as '
      + 'long as that conversation lasts.',
    fr: ' : votre message et votre adresse servent uniquement à vous répondre et sont '
      + 'conservés le temps de cette conversation.',
  },
  privacidad_derechos: {
    es: 'Tienes derecho de acceso, rectificacion, supresion, oposicion, limitacion y '
      + 'portabilidad conforme al Reglamento (UE) 2016/679, y a reclamar ante la Agencia '
      + 'Espanola de Proteccion de Datos. Para ejercerlos, incluido el borrado de tu cuenta, '
      + 'tus resenas y tus fotos, escribe al correo de contacto que aparece arriba.',
    en: 'You have the right of access, rectification, erasure, objection, restriction and '
      + 'portability under Regulation (EU) 2016/679 (GDPR), and to lodge a complaint with the '
      + 'Agencia Espanola de Proteccion de Datos (the Spanish data protection authority). To '
      + 'exercise them, including deleting your account, your reviews and your photos, write '
      + 'to the contact address above.',
    fr: 'Vous disposez d’un droit d’accès, de rectification, d’effacement, d’opposition, de '
      + 'limitation et de portabilité conformément au règlement (UE) 2016/679 (RGPD), ainsi '
      + 'que du droit de réclamer auprès de l’Agencia Espanola de Proteccion de Datos '
      + '(l’autorité espagnole de protection des données). Pour les exercer, y compris la '
      + 'suppression de votre compte, de vos avis et de vos photos, écrivez à l’adresse de '
      + 'contact ci-dessus.',
  },
  privacidad_servidor: {
    es: 'El servidor que sirve estas paginas (Cloudflare Pages) registra peticiones y '
      + 'direcciones IP de forma agregada para funcionar y protegerse de abusos, como '
      + 'cualquier servidor web. Ese tratamiento es responsabilidad del proveedor de '
      + 'alojamiento.',
    en: 'The server that serves these pages (Cloudflare Pages) logs requests and IP addresses '
      + 'in aggregate in order to work and to protect itself from abuse, like any web server. '
      + 'That processing is the hosting provider’s responsibility.',
    fr: 'Le serveur qui sert ces pages (Cloudflare Pages) enregistre les requêtes et les '
      + 'adresses IP de façon agrégée pour fonctionner et se protéger des abus, comme tout '
      + 'serveur web. Ce traitement relève de la responsabilité de l’hébergeur.',
  },

  // --- 3. Cookies ---
  h2_cookies: { es: 'Cookies', en: 'Cookies', fr: 'Cookies' },
  cookies_negrita: {
    es: 'Esta web no instala ninguna cookie de seguimiento ni de publicidad',
    en: 'This site installs no tracking or advertising cookie whatsoever',
    fr: 'Ce site n’installe aucun cookie de suivi ni de publicité',
  },
  cookies_p1: {
    es: ', y por eso no veras un banner de consentimiento: lo unico que usa esta exento de '
      + 'pedirlo. Lo que hay es esto, y nada mas:',
    en: ', which is why you will not see a consent banner: the only thing it uses is exempt '
      + 'from asking. What there is, is this, and nothing else:',
    fr: ', et c’est pourquoi vous ne verrez pas de bandeau de consentement : la seule chose '
      + 'qu’il utilise en est dispensée. Voici ce qu’il y a, et rien de plus :',
  },
  li_sesion_t: {
    es: 'Una cookie de sesion', en: 'One session cookie', fr: 'Un cookie de session',
  },
  li_sesion: {
    es: ', solo si entras en tu cuenta. Sirve para mantenerte identificado y caduca a los 30 '
      + 'dias; al salir de la cuenta se borra. Es tecnicamente necesaria, asi que la ley no '
      + 'exige consentimiento previo.',
    en: ', only if you sign in to your account. It keeps you signed in and expires after 30 '
      + 'days; it is deleted when you sign out. It is technically necessary, so the law does '
      + 'not require prior consent.',
    fr: ', uniquement si vous vous connectez à votre compte. Il sert à vous maintenir '
      + 'identifié et expire au bout de 30 jours ; il est supprimé à la déconnexion. Il est '
      + 'techniquement nécessaire, la loi n’exige donc pas de consentement préalable.',
  },
  li_local_t: {
    es: 'Almacenamiento local del navegador', en: 'Browser local storage',
    fr: 'Stockage local du navigateur',
  },
  li_local_a: {
    es: ' para dos comodidades: si prefieres el tema claro u oscuro, y la lista de productos '
      + 'que guardas en ',
    en: ' for two conveniences: whether you prefer the light or dark theme, and the list of '
      + 'products you save in ',
    fr: ' pour deux commodités : si vous préférez le thème clair ou sombre, et la liste de '
      + 'produits que vous enregistrez dans ',
  },
  li_local_enlace: {
    es: 'tu comparativa', en: 'your comparison', fr: 'votre comparatif',
  },
  li_local_b: {
    es: '. Las dos cosas se quedan en tu navegador, no viajan a ningun servidor y no '
      + 'identifican a nadie. Se borran vaciando los datos del sitio en tu navegador.',
    en: '. Both stay in your browser, never travel to any server and identify nobody. They '
      + 'are deleted by clearing the site data in your browser.',
    fr: '. Les deux restent dans votre navigateur, ne partent vers aucun serveur et '
      + 'n’identifient personne. Ils s’effacent en vidant les données du site dans votre '
      + 'navigateur.',
  },
  // El idioma elegido tambien se guarda: se anadio con la version en tres idiomas y un
  // aviso de cookies que no menciona lo que guarda deja de ser exacto.
  li_idioma: {
    es: ' El idioma que eliges en la cabecera se guarda igual, para no volver a mandarte al '
      + 'idioma de tu navegador en la pagina siguiente.',
    en: ' The language you pick in the header is stored the same way, so you are not sent '
      + 'back to your browser’s language on the next page.',
    fr: ' La langue que vous choisissez dans l’en-tête est enregistrée de la même façon, pour '
      + 'ne pas vous renvoyer vers la langue de votre navigateur à la page suivante.',
  },
  analitica_si: {
    es: 'La medicion de visitas se hace con una analitica sin cookies que no identifica a '
      + 'nadie. Ademas se cuentan los clics en algunos botones (abrir una ficha, comparar, '
      + 'ir a la tienda) como totales por dia, sin IP, cuenta ni cookie.',
    en: 'Visit measurement is done with cookieless analytics that identify nobody. Clicks on '
      + 'some buttons (opening a product, compare, going to the store) are also counted as '
      + 'daily totals, with no IP, account or cookie.',
    fr: 'La mesure d’audience est faite avec un outil sans cookies qui n’identifie personne. '
      + 'Les clics sur certains boutons (ouvrir une fiche, comparer, aller à la boutique) sont '
      + 'aussi comptés en totaux par jour, sans IP, compte ni cookie.',
  },
  analitica_no: {
    es: 'Ahora mismo no hay ninguna herramienta de medicion de visitas instalada.',
    en: 'Right now there is no visit measurement tool installed.',
    fr: 'Pour l’instant, aucun outil de mesure d’audience n’est installé.',
  },
  cookies_cola: {
    es: ' Las imagenes de los productos las sirven las tiendas desde sus propios servidores, '
      + 'asi que tu navegador se conecta a ellos al cargar una ficha. Las tipografias se '
      + 'sirven desde este mismo dominio precisamente para no enviar tu IP a terceros.',
    en: ' Product images are served by the stores from their own servers, so your browser '
      + 'connects to them when a product page loads. The fonts are served from this same '
      + 'domain precisely so your IP is not sent to third parties.',
    fr: ' Les images des produits sont servies par les boutiques depuis leurs propres '
      + 'serveurs, votre navigateur s’y connecte donc au chargement d’une fiche. Les polices '
      + 'sont servies depuis ce même domaine précisément pour ne pas envoyer votre IP à des '
      + 'tiers.',
  },

  // --- 4. Afiliacion ---
  h2_afiliacion: {
    es: 'Afiliacion y relacion con las tiendas',
    en: 'Affiliate links and relationship with the stores',
    fr: 'Affiliation et relation avec les boutiques',
  },
  afil_con_a: {
    es: 'Algunos enlaces a tienda son enlaces de afiliado: si compras a traves de ellos, esta '
      + 'web puede recibir una comision ',
    en: 'Some store links are affiliate links: if you buy through them, this site may receive '
      + 'a commission ',
    fr: 'Certains liens vers les boutiques sont des liens affiliés : si vous achetez par leur '
      + 'intermédiaire, ce site peut recevoir une commission ',
  },
  afil_con_negrita: {
    es: 'sin coste adicional para ti', en: 'at no extra cost to you',
    fr: 'sans surcoût pour vous',
  },
  afil_con_b: {
    es: '. Esos enlaces van marcados como tales en cada pagina donde aparecen.',
    en: '. Those links are marked as such on every page where they appear.',
    fr: '. Ces liens sont signalés comme tels sur chaque page où ils apparaissent.',
  },
  afil_sin_negrita: {
    es: 'Ahora mismo esta web no incluye ningun enlace de afiliado',
    en: 'Right now this site includes no affiliate link at all',
    fr: 'Pour l’instant, ce site ne contient aucun lien affilié',
  },
  afil_sin: {
    es: ' y no recibe comision de ninguna tienda. Si en el futuro los incluye, apareceran '
      + 'marcados como tales en cada pagina donde salgan y este aviso lo dira. Lo que sigue '
      + 'es la regla que se aplica desde el primer dia.',
    en: ' and receives no commission from any store. If it ever includes them, they will '
      + 'appear marked as such on every page where they show up and this notice will say so. '
      + 'What follows is the rule that has applied from day one.',
    fr: ' et ne reçoit aucune commission d’aucune boutique. S’il en contient un jour, ils '
      + 'apparaîtront signalés comme tels sur chaque page où ils figurent et cet avis le '
      + 'dira. Ce qui suit est la règle appliquée depuis le premier jour.',
  },
  afil_regla_negrita: {
    es: 'La afiliacion no influye en el orden ni en la puntuacion.',
    en: 'Affiliation influences neither the ranking nor the score.',
    fr: 'L’affiliation n’influence ni le classement ni la note.',
  },
  afil_regla: {
    es: ' El score se calcula antes de aplicar ningun enlace de afiliado y sin leer el '
      + 'fichero que los contiene; hay una prueba automatica que falla si el ranking cambia '
      + 'al aplicarlos, y los productos sin programa de afiliado aparecen exactamente igual. '
      + 'El detalle esta en la ',
    en: ' The score is computed before any affiliate link is applied and without reading the '
      + 'file that holds them; there is an automated test that fails if the ranking changes '
      + 'once they are applied, and products with no affiliate programme appear exactly the '
      + 'same. The detail is in the ',
    fr: ' Le score est calculé avant d’appliquer le moindre lien affilié et sans lire le '
      + 'fichier qui les contient ; un test automatique échoue si le classement change une '
      + 'fois qu’ils sont appliqués, et les produits sans programme d’affiliation '
      + 'apparaissent exactement pareil. Le détail est dans la ',
  },
  afil_relacion: {
    es: (n) => `Esta web no tiene relacion comercial, societaria ni de patrocinio con las `
             + `${n} tiendas comparadas mas alla, en su caso, de su programa publico de `
             + 'afiliacion. Las marcas y los nombres de producto pertenecen a sus titulares y '
             + 'se citan a efectos identificativos.',
    en: (n) => `This site has no commercial, corporate or sponsorship relationship with the `
             + `${n} stores compared beyond, where applicable, their public affiliate `
             + 'programme. Trademarks and product names belong to their owners and are cited '
             + 'for identification purposes.',
    fr: (n) => `Ce site n’a aucune relation commerciale, capitalistique ou de parrainage avec `
             + `les ${n} boutiques comparées, au-delà, le cas échéant, de leur programme `
             + 'public d’affiliation. Les marques et les noms de produits appartiennent à '
             + 'leurs titulaires et sont cités à des fins d’identification.',
  },

  // --- 5. Sobre la informacion ---
  h2_informacion: {
    es: 'Sobre la informacion publicada', en: 'About the information published',
    fr: 'À propos de l’information publiée',
  },
  info_a: {
    es: 'Los precios se recogen automaticamente de las webs de las tiendas y se publican con '
      + 'la fecha de recogida (los de esta version son del ',
    en: 'Prices are collected automatically from the stores’ websites and published with the '
      + 'collection date (the ones in this version are from ',
    fr: 'Les prix sont relevés automatiquement sur les sites des boutiques et publiés avec la '
      + 'date de relevé (ceux de cette version datent du ',
  },
  info_b: {
    es: '). Pueden haber cambiado desde entonces: ',
    en: '). They may have changed since: ',
    fr: '). Ils ont pu changer depuis : ',
  },
  info_negrita: {
    es: 'el precio valido siempre es el de la tienda',
    en: 'the valid price is always the store’s',
    fr: 'le prix valable est toujours celui de la boutique',
  },
  info_c: {
    es: ' en el momento de la compra. Se pone el maximo cuidado en que los datos sean '
      + 'correctos, pero no se garantiza que esten libres de errores; si ves uno, escribe al '
      + 'correo de contacto y se corrige.',
    en: ' at the moment of purchase. Every care is taken to make the data correct, but it is '
      + 'not guaranteed to be free of errors; if you spot one, write to the contact address '
      + 'and it gets fixed.',
    fr: ' au moment de l’achat. Le plus grand soin est apporté à l’exactitude des données, '
      + 'mais elles ne sont pas garanties exemptes d’erreurs ; si vous en voyez une, écrivez '
      + 'à l’adresse de contact et elle sera corrigée.',
  },
  info_medico_negrita: {
    es: 'Esto no es consejo medico ni nutricional.',
    en: 'This is not medical or nutritional advice.',
    fr: 'Ceci n’est ni un conseil médical ni un conseil nutritionnel.',
  },
  info_medico: {
    es: ' Esta web informa de hechos verificables sobre productos (precio, formato, '
      + 'certificaciones declaradas y su nivel de comprobacion) y cita evidencia cientifica ',
    en: ' This site reports verifiable facts about products (price, pack size, claimed '
      + 'certifications and how far they have been checked) and cites scientific evidence ',
    fr: ' Ce site rapporte des faits vérifiables sur les produits (prix, format, '
      + 'certifications déclarées et niveau de vérification) et cite des preuves '
      + 'scientifiques ',
  },
  info_por_ingrediente: {
    es: 'por ingrediente', en: 'per ingredient', fr: 'par ingrédient',
  },
  info_medico_cola: {
    es: ', con su dosis y su fuente. En ningun caso se afirma que un producto concreto '
      + 'produzca ningun efecto sobre la salud. Los suplementos alimenticios no sustituyen a '
      + 'una dieta equilibrada. Consulta a un profesional sanitario antes de tomar cualquier '
      + 'suplemento, especialmente si estas embarazada, en periodo de lactancia, en '
      + 'tratamiento medico o tienes alguna patologia.',
    en: ', with its dose and its source. It is never claimed that a specific product produces '
      + 'any health effect. Food supplements are not a substitute for a balanced diet. '
      + 'Consult a healthcare professional before taking any supplement, especially if you '
      + 'are pregnant, breastfeeding, under medical treatment or have any condition.',
    fr: ', avec leur dose et leur source. Il n’est en aucun cas affirmé qu’un produit précis '
      + 'produise un effet sur la santé. Les compléments alimentaires ne remplacent pas une '
      + 'alimentation équilibrée. Consultez un professionnel de santé avant de prendre tout '
      + 'complément, en particulier si vous êtes enceinte, si vous allaitez, si vous suivez '
      + 'un traitement médical ou si vous avez une pathologie.',
  },

  // --- 6. Propiedad intelectual ---
  h2_propiedad: {
    es: 'Propiedad intelectual y reutilizacion',
    en: 'Intellectual property and reuse',
    fr: 'Propriété intellectuelle et réutilisation',
  },
  propiedad_p1: {
    es: 'Los textos y la metodologia de esta web son obra propia y no se licencian: no se '
      + 'pueden copiar y republicar como si fueran de otro. Las imagenes de producto '
      + 'pertenecen a las tiendas y se sirven desde sus servidores.',
    en: 'The texts and the methodology of this site are original work and are not licensed: '
      + 'they cannot be copied and republished as if they were someone else’s. Product images '
      + 'belong to the stores and are served from their servers.',
    fr: 'Les textes et la méthodologie de ce site sont une œuvre propre et ne sont pas sous '
      + 'licence : ils ne peuvent pas être copiés et republiés comme s’ils appartenaient à un '
      + 'autre. Les images de produits appartiennent aux boutiques et sont servies depuis '
      + 'leurs serveurs.',
  },
  datos_negrita: {
    es: 'Los datos, en cambio, son libres.', en: 'The data, however, is free.',
    fr: 'Les données, en revanche, sont libres.',
  },
  datos_a: {
    es: ' Los ficheros abiertos de cada comparativa (',
    en: ' The open files of each comparison (',
    fr: ' Les fichiers ouverts de chaque comparatif (',
  },
  datos_hermanos: {
    es: (n) => ` y sus ${n} hermanos, mas el `,
    en: (n) => ` and its ${n} siblings, plus the `,
    fr: (n) => ` et ses ${n} frères, plus le `,
  },
  datos_catalogo: {
    es: 'catalogo completo', en: 'full catalogue', fr: 'catalogue complet',
  },
  datos_b: {
    es: ') se publican bajo licencia ', en: ') are published under the ',
    fr: ') sont publiés sous licence ',
  },
  datos_licencia: {
    es: 'Creative Commons Reconocimiento 4.0 (CC BY 4.0)',
    en: 'Creative Commons Attribution 4.0 (CC BY 4.0)',
    fr: 'Creative Commons Attribution 4.0 (CC BY 4.0)',
  },
  datos_c: {
    es: ': se pueden descargar, analizar, republicar y usar en un trabajo comercial, con una '
      + 'sola condicion, citar de donde salen y de que dia son los precios. Por ejemplo:',
    en: ' licence: they can be downloaded, analysed, republished and used in commercial work, '
      + 'on one condition only — saying where they come from and which day the prices are '
      + 'from. For example:',
    fr: ' : ils peuvent être téléchargés, analysés, republiés et utilisés dans un travail '
      + 'commercial, à une seule condition, citer d’où ils viennent et de quel jour datent '
      + 'les prix. Par exemple :',
  },
  datos_cita: {
    es: (f) => `Datos de FitnessSupplementWiki (fitnesssupplementwiki.com), recogidos el `,
    en: (f) => 'Data from FitnessSupplementWiki (fitnesssupplementwiki.com), collected on ',
    fr: (f) => 'Données de FitnessSupplementWiki (fitnesssupplementwiki.com), relevées le ',
  },
  datos_cola: {
    es: 'La licencia cubre los ficheros de datos: precios, formatos, sellos declarados, '
      + 'niveles de verificacion y puntuaciones. No cubre ni los articulos ni las guias de '
      + 'evidencia, que son el parrafo de arriba.',
    en: 'The licence covers the data files: prices, pack sizes, claimed certifications, '
      + 'verification levels and scores. It covers neither the articles nor the evidence '
      + 'guides, which are the paragraph above.',
    fr: 'La licence couvre les fichiers de données : prix, formats, labels déclarés, niveaux '
      + 'de vérification et notes. Elle ne couvre ni les articles ni les guides de preuves, '
      + 'qui relèvent du paragraphe ci-dessus.',
  },

  // --- 7. Legislacion ---
  h2_legislacion: {
    es: 'Legislacion aplicable', en: 'Applicable law', fr: 'Droit applicable',
  },
  legislacion: {
    es: 'Estas condiciones se rigen por la legislacion espanola. Para cualquier controversia '
      + 'seran competentes los juzgados y tribunales del domicilio del titular, salvo que la '
      + 'normativa de consumo aplicable determine otro fuero.',
    en: 'These terms are governed by Spanish law. For any dispute, the courts of the owner’s '
      + 'place of residence shall have jurisdiction, unless the applicable consumer '
      + 'legislation determines another venue.',
    fr: 'Ces conditions sont régies par le droit espagnol. Pour tout litige, les tribunaux du '
      + 'domicile du titulaire sont compétents, sauf si la réglementation applicable en '
      + 'matière de consommation en désigne un autre.',
  },
  titular_pendiente: {
    es: '[pendiente: nombre o razon social del titular]',
    en: '[pending: name or company name of the owner]',
    fr: '[en attente : nom ou raison sociale du titulaire]',
  },
};

/** Un texto del aviso legal en el idioma que toque, con el espanol de respaldo. */
export const legal = (lang) => (clave, ...args) => {
  const entrada = LEGAL[clave];
  const valor = entrada?.[lang] ?? entrada?.es ?? clave;
  return typeof valor === 'function' ? valor(...args) : valor;
};

// Autocomprobacion: node src/datos/legal.js
// Un aviso legal a medio traducir es peor que uno sin traducir: media pagina en ingles y
// media en espanol no la entiende nadie y no cumple en ninguno de los dos idiomas.
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('legal.js')) {
  const faltan = Object.entries(LEGAL)
    .filter(([, v]) => !v.es || !v.en || !v.fr)
    .map(([k]) => k);
  if (faltan.length) throw new Error(`entradas incompletas: ${faltan.join(', ')}`);
  const t = legal('fr');
  if (!t('h1').includes('Mentions')) throw new Error('legal(fr) no devuelve frances');
  if (legal('pt')('h1') !== LEGAL.h1.es) throw new Error('sin respaldo al espanol');
  console.log(`legal.js OK (${Object.keys(LEGAL).length} entradas x 3 idiomas)`);
}
