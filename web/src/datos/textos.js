// Los textos de la interfaz en los tres idiomas. Una clave, tres versiones juntas.
//
// POR QUE JUNTAS Y NO EN TRES FICHEROS: con es.js / en.js / fr.js, una clave que se
// traduce en dos y se olvida en el tercero no se ve hasta que sale publicada. Aqui la
// linea de al lado es la que falta.
//
// REGLAS:
//   1. El espanol va SIN TILDES, como el resto del codigo del proyecto: las pone
//      tildes.js sobre el HTML construido. El ingles y el frances van CON sus acentos
//      escritos, y por eso astro.config.mjs no pasa el restaurador por /en/ ni /fr/:
//      alli "version" y "tension" son palabras del idioma, no espanol mal escrito.
//   2. Un texto con un numero o un nombre dentro es una funcion, no una cadena con
//      marcadores. `(n) => \`${n} products\`` se lee y no hay que documentar %s.
//   3. El plural se resuelve dentro de la funcion, en cada idioma. El frances pone
//      plural desde 2 igual que el espanol; el ingles tambien. No hace falta Intl.
//   4. Nada de texto que salga del dataset (nombres de producto, marcas, tiendas): eso
//      viene de las tiendas espanolas y no se traduce. Lo que se traduce es el marco.

import { auFr, deFr } from '../frances.js';

export const TEXTOS = {
  // ---------------------------------------------------------------- identidad del sitio
  'sitio.lema': {
    es: 'Precio por kilo y certificacion comprobada',
    en: 'Price per kilo and verified certification',
    fr: 'Prix au kilo et certification vérifiée',
  },
  'sitio.descripcion': {
    es: 'Comparativa de suplementos deportivos en Espana por precio por kilo (o por '
      + 'capsula) y por el nivel de verificacion de sus certificaciones, con el desglose '
      + 'de cada nota.',
    en: 'Sports supplement comparison for the Spanish market by price per kilo (or per '
      + 'capsule) and by how verifiable each certification is, with a line-by-line '
      + 'breakdown of every score.',
    fr: 'Comparatif de compléments sportifs sur le marché espagnol par prix au kilo (ou '
      + 'à la gélule) et par le niveau de vérification des certifications, avec le détail '
      + 'ligne par ligne de chaque note.',
  },
  'sitio.autor.rol': {
    es: 'Desarrollador y responsable del metodo de comparacion',
    en: 'Developer and owner of the comparison method',
    fr: 'Développeur et responsable de la méthode de comparaison',
  },
  'sitio.autor.hace': {
    es: 'Escribe el scraper, el motor de puntuacion y las comprobaciones de sellos.',
    en: 'Writes the scraper, the scoring engine and the certification checks.',
    fr: 'Écrit le scraper, le moteur de notation et les vérifications de labels.',
  },
  'sitio.autor.no_hace': {
    es: 'El autor no es profesional sanitario y esta web no da consejo medico ni '
      + 'nutricional.',
    en: 'The author is not a healthcare professional and this site does not give medical '
      + 'or nutritional advice.',
    fr: "L'auteur n'est pas un professionnel de santé et ce site ne donne aucun conseil "
      + 'médical ni nutritionnel.',
  },

  // ------------------------------------------------------------------------- familias
  // Los estantes del menu (datos/familias.js). Son decision editorial, no dataset.
  'familia.Proteinas': { es: 'Proteinas', en: 'Protein', fr: 'Protéines' },
  'familia.Rendimiento': { es: 'Rendimiento', en: 'Performance', fr: 'Performance' },
  'familia.Vitaminas y minerales': {
    es: 'Vitaminas y minerales', en: 'Vitamins and minerals', fr: 'Vitamines et minéraux',
  },
  'familia.Salud y descanso': {
    es: 'Salud y descanso', en: 'Health and recovery', fr: 'Santé et récupération',
  },
  'familia.Otros': { es: 'Otros', en: 'Other', fr: 'Autres' },

  // -------------------------------------------------------------------------- cabecera
  'chrome.saltar': {
    es: 'Saltar al contenido', en: 'Skip to content', fr: 'Aller au contenu',
  },
  'chrome.abrir_menu': { es: 'Abrir el menu', en: 'Open the menu', fr: 'Ouvrir le menu' },
  'chrome.menu': { es: 'Menu', en: 'Menu', fr: 'Menu' },
  'chrome.secciones': { es: 'Secciones', en: 'Sections', fr: 'Sections' },
  'chrome.buscar': {
    es: 'Buscar un producto o una categoria',
    en: 'Search for a product or a category',
    fr: 'Chercher un produit ou une catégorie',
  },
  'chrome.categorias': { es: 'Categorias', en: 'Categories', fr: 'Catégories' },
  'chrome.guias': { es: 'Guias', en: 'Guides', fr: 'Guides' },
  'chrome.ver_categorias': {
    es: 'Ver todas las categorias', en: 'See every category', fr: 'Voir toutes les catégories',
  },
  'chrome.ver_guias': {
    es: 'Ver todas las guias y categorias',
    en: 'See every guide and category',
    fr: 'Voir tous les guides et catégories',
  },
  'chrome.por_evidencia': { es: 'Por evidencia', en: 'By evidence', fr: 'Par niveau de preuve' },
  'chrome.por_objetivo': { es: 'Por objetivo', en: 'By goal', fr: 'Par objectif' },
  'chrome.por_tienda': { es: 'Por tienda', en: 'By store', fr: 'Par boutique' },
  'chrome.que_funciona': {
    es: 'Que suplementos funcionan',
    en: 'Which supplements actually work',
    fr: 'Quels compléments fonctionnent vraiment',
  },
  'chrome.tienda_barata': {
    es: 'Que tienda es mas barata',
    en: 'Which store is cheapest',
    fr: 'Quelle boutique est la moins chère',
  },
  'chrome.metodologia': { es: 'Metodologia', en: 'Methodology', fr: 'Méthodologie' },
  'chrome.quienes_somos': { es: 'Quienes somos', en: 'About us', fr: 'Qui sommes-nous' },
  'chrome.mi_lista': { es: 'Mi lista', en: 'My list', fr: 'Ma liste' },
  'chrome.mi_lista_larga': {
    es: 'Mi lista de suplementos guardados',
    en: 'My saved supplements list',
    fr: 'Ma liste de compléments enregistrés',
  },
  'chrome.comparar': { es: 'Comparar', en: 'Compare', fr: 'Comparer' },
  'chrome.admin': {
    es: 'Panel de administracion', en: 'Admin panel', fr: "Panneau d'administration",
  },
  'chrome.tema': {
    es: 'Cambiar entre tema claro y oscuro',
    en: 'Switch between light and dark theme',
    fr: 'Basculer entre thème clair et sombre',
  },
  'chrome.tema_corto': { es: 'Cambiar de tema', en: 'Switch theme', fr: 'Changer de thème' },
  'chrome.entrar': { es: 'Entrar', en: 'Sign in', fr: 'Se connecter' },
  'chrome.entrar_larga': {
    es: 'Entrar en tu cuenta', en: 'Sign in to your account', fr: 'Accéder à votre compte',
  },
  'chrome.tu_cuenta': {
    es: (n) => `Tu cuenta: ${n}`,
    en: (n) => `Your account: ${n}`,
    fr: (n) => `Votre compte : ${n}`,
  },
  'chrome.idioma': { es: 'Idioma', en: 'Language', fr: 'Langue' },
  'chrome.elegir_idioma': {
    es: 'Elegir idioma', en: 'Choose language', fr: 'Choisir la langue',
  },

  // El aviso que sale cuando el robot de precios lleva mas de diez dias parado.
  'chrome.caducado.titulo': {
    es: (d) => `Estos precios tienen ${d} dias.`,
    en: (d) => `These prices are ${d} days old.`,
    fr: (d) => `Ces prix datent de ${d} jours.`,
  },
  'chrome.caducado.cuerpo': {
    es: (f) => `La recogida automatica no se ha ejecutado desde el ${f}: sirven para `
             + 'comparar entre productos, pero el precio bueno es el de la tienda.',
    en: (f) => `The automatic collection has not run since ${f}: they are still good for `
             + 'comparing products against each other, but the price that counts is the '
             + "store's.",
    fr: (f) => `La collecte automatique n'a pas tourné depuis le ${f} : ils servent à `
             + 'comparer les produits entre eux, mais le prix qui compte est celui de la '
             + 'boutique.',
  },

  // ------------------------------------------------------------------------------- pie
  'pie.sitio.texto': {
    es: (n) => `${n} suplementos comparados por `,
    en: (n) => `${n} supplements compared by `,
    fr: (n) => `${n} compléments comparés au `,
  },
  'pie.sitio.negrita': {
    es: 'precio por kilo o por capsula',
    en: 'price per kilo or per capsule',
    fr: 'prix au kilo ou à la gélule',
  },
  'pie.sitio.cola': {
    es: ' y por lo comprobable que es su certificacion. Ni estrellas, ni opiniones, ni '
      + 'comisiones que muevan el orden.',
    en: ' and by how verifiable their certification is. No stars, no reviews, no '
      + 'commissions moving the ranking.',
    fr: " et selon le caractère vérifiable de leur certification. Ni étoiles, ni avis, ni "
      + 'commissions qui déplacent le classement.',
  },
  'pie.categorias.texto': {
    es: (n) => `Las ${n} categorias comparadas por precio real, cada una con su tabla `
             + 'ordenable y su ganador.',
    en: (n) => `All ${n} categories compared on real price, each with its own sortable `
             + 'table and its winner.',
    fr: (n) => `Les ${n} catégories comparées au prix réel, chacune avec son tableau `
             + 'triable et son gagnant.',
  },
  'pie.guias.texto': {
    es: 'Para que sirve cada suplemento, con la dosis y la fuente al lado. Sin precios '
      + 'dentro: eso esta en la categoria.',
    en: 'What each supplement is for, with the dose and the source next to it. No prices '
      + 'inside: those live in the category.',
    fr: 'À quoi sert chaque complément, avec la dose et la source à côté. Sans prix '
      + 'dedans : ils sont dans la catégorie.',
  },
  'pie.transparencia': { es: 'Transparencia', en: 'Transparency', fr: 'Transparence' },
  'pie.marcas': { es: 'Precios por marca', en: 'Prices by brand', fr: 'Prix par marque' },
  'pie.niveles': {
    es: 'Niveles de verificacion', en: 'Verification levels', fr: 'Niveaux de vérification',
  },
  'pie.formula': {
    es: 'La formula del score', en: 'The score formula', fr: 'La formule du score',
  },
  'pie.afiliacion': { es: 'Afiliacion', en: 'Affiliate links', fr: 'Affiliation' },
  'pie.llms': {
    es: 'Resumen para modelos de IA',
    en: 'Summary for AI models',
    fr: 'Résumé pour les modèles IA',
  },
  'pie.legal': {
    es: 'Aviso legal y privacidad', en: 'Legal notice and privacy', fr: 'Mentions légales et confidentialité',
  },
  'pie.contacto': { es: 'Contacto', en: 'Contact', fr: 'Contact' },
  'pie.colofon.recogida': {
    es: (f, p, c) => `Recogida de precios del ${f} · ${p} productos · ${c} categorias`,
    en: (f, p, c) => `Prices collected on ${f} · ${p} products · ${c} categories`,
    fr: (f, p, c) => `Prix relevés le ${f} · ${p} produits · ${c} catégories`,
  },
  'pie.colofon.autor': {
    es: 'Datos recogidos y metodo mantenido por',
    en: 'Data collected and method maintained by',
    fr: 'Données collectées et méthode maintenue par',
  },
  'pie.colofon.precios': {
    es: 'Precios recogidos automaticamente de las tiendas. Pueden variar; el precio bueno '
      + 'siempre es el de la tienda.',
    en: 'Prices collected automatically from the stores. They can change; the price that '
      + "counts is always the store's.",
    fr: 'Prix relevés automatiquement chez les boutiques. Ils peuvent changer ; le prix '
      + 'qui compte est toujours celui de la boutique.',
  },
  'pie.colofon.aviso': {
    es: 'Esta web informa de hechos verificables sobre productos e ingredientes. No da '
      + 'consejo medico ni nutricional. Ningun efecto se atribuye a un producto: la '
      + 'evidencia se cita por ingrediente en ',
    en: 'This site reports verifiable facts about products and ingredients. It does not '
      + 'give medical or nutritional advice. No effect is ever attributed to a product: '
      + 'evidence is cited per ingredient in ',
    fr: 'Ce site rapporte des faits vérifiables sur les produits et les ingrédients. Il ne '
      + 'donne aucun conseil médical ni nutritionnel. Aucun effet n\'est attribué à un '
      + 'produit : les preuves sont citées par ingrédient dans ',
  },
  'pie.colofon.aviso_enlace': {
    es: 'la metodologia', en: 'the methodology', fr: 'la méthodologie',
  },

  // --------------------------------------------------------------------------- comunes
  'comun.inicio': { es: 'Inicio', en: 'Home', fr: 'Accueil' },
  'comun.productos': {
    es: (n) => `${n} productos`, en: (n) => `${n} products`, fr: (n) => `${n} produits`,
  },
  'comun.prod_corto': { es: 'prod.', en: 'prod.', fr: 'prod.' },
  'comun.tiendas': {
    es: (n) => `${n} ${n === 1 ? 'tienda' : 'tiendas'}`,
    en: (n) => `${n} ${n === 1 ? 'store' : 'stores'}`,
    fr: (n) => `${n} ${n === 1 ? 'boutique' : 'boutiques'}`,
  },
  'comun.desde': { es: 'desde', en: 'from', fr: 'à partir de' },
  'comun.capsula': { es: 'capsula', en: 'capsule', fr: 'gélule' },
  'comun.leer_metodologia': {
    es: 'Leer la metodologia', en: 'Read the methodology', fr: 'Lire la méthodologie',
  },

  // ---------------------------------------------------------------- objetivos (/para/)
  // El nombre corto de cada objetivo. El articulo entero vive en datos/eficacia.js.
  'objetivo.ganar-masa-muscular.nombre': {
    es: 'Ganar masa muscular', en: 'Build muscle', fr: 'Prendre du muscle',
  },
  'objetivo.perder-grasa.nombre': {
    es: 'Perder grasa', en: 'Lose fat', fr: 'Perdre du gras',
  },
  'objetivo.rendimiento.nombre': {
    es: 'Rendimiento y fuerza', en: 'Performance and strength', fr: 'Performance et force',
  },
  'objetivo.articulaciones.nombre': {
    es: 'Articulaciones', en: 'Joints', fr: 'Articulations',
  },
  'objetivo.descanso-y-estres.nombre': {
    es: 'Descanso y estres', en: 'Sleep and stress', fr: 'Sommeil et stress',
  },
  'objetivo.salud-general.nombre': {
    es: 'Salud general', en: 'General health', fr: 'Santé générale',
  },

  // ------------------------------------------------------------------------ componentes
  // Aviso de afiliacion. Es texto legal: dice lo mismo en los tres idiomas o no sirve.
  'aviso.resumen': {
    es: 'Algunos enlaces son de afiliado — no cambian el orden',
    en: 'Some links are affiliate links — they do not change the ranking',
    fr: "Certains liens sont affiliés — ils ne changent pas le classement",
  },
  'aviso.detalle': {
    es: 'Algunos enlaces a tienda son de afiliado: si compras, esta web puede llevarse '
      + 'una comision, sin coste extra para ti. No cambia nada del ranking: el score se '
      + 'calcula antes y sin mirar esos enlaces, y los productos sin programa de afiliado '
      + 'aparecen exactamente igual. ',
    en: 'Some store links are affiliate links: if you buy through them, this site may earn '
      + 'a commission at no extra cost to you. It changes nothing in the ranking: the score '
      + 'is computed beforehand and without reading those links, and products with no '
      + 'affiliate programme appear exactly the same. ',
    fr: "Certains liens vers les boutiques sont affiliés : si vous achetez, ce site peut "
      + 'toucher une commission, sans surcoût pour vous. Cela ne change rien au classement : '
      + 'le score est calculé avant et sans regarder ces liens, et les produits sans '
      + "programme d'affiliation apparaissent exactement pareil. ",
  },
  'aviso.enlace': {
    es: 'Como se calcula', en: 'How it is calculated', fr: 'Comment il est calculé',
  },

  // Las tres cifras que resumen una tabla.
  'cifras.productos': {
    es: 'productos comparados', en: 'products compared', fr: 'produits comparés',
  },
  'cifras.por_unidad': {
    es: (u) => `por ${u}`, en: (u) => `per ${u}`, fr: (u) => `${auFr(u)}`,
  },
  'cifras.nivel4': {
    es: 'con nivel 4 verificado',
    en: 'at verified level 4',
    fr: 'au niveau 4 vérifié',
  },
  'cifras.a': { es: 'a', en: 'to', fr: 'à' },
  'cifras.de': { es: 'de', en: 'from', fr: 'de' },

  // Preguntas frecuentes.
  'faq.titulo': {
    es: 'Preguntas frecuentes', en: 'Frequently asked questions', fr: 'Questions fréquentes',
  },
  'faq.apunte': {
    es: 'Respondidas con los datos de esta pagina',
    en: 'Answered with the data on this page',
    fr: 'Répondues avec les données de cette page',
  },

  // La regla de precios de una categoria.
  'regla.desde': { es: 'desde', en: 'from', fr: 'à partir de' },
  'regla.hasta': { es: 'hasta', en: 'up to', fr: "jusqu'à" },
  'regla.mediana': { es: 'mediana', en: 'median', fr: 'médiane' },

  // Los tres atajos de arriba de la tabla.
  'destacado.calidad_precio': {
    es: 'Mejor calidad-precio', en: 'Best value for money', fr: 'Meilleur rapport qualité-prix',
  },
  'destacado.barato': {
    es: (u) => `Mas barato por ${u}`,
    en: (u) => `Cheapest per ${u}`,
    fr: (u) => `Le moins cher ${auFr(u)}`,
  },
  'destacado.certificado': {
    es: 'Mejor certificado', en: 'Best certified', fr: 'Le mieux certifié',
  },
  'destacado.razon.calidad_precio': {
    es: (n, u) => `Score ${n} de 100: la nota mas alta con la mitad del peso en el precio `
                + `por ${u}.`,
    en: (n, u) => `Score ${n} out of 100: the highest mark with half the weight on price `
                + `per ${u}.`,
    fr: (n, u) => `Score ${n} sur 100 : la meilleure note avec la moitié du poids sur le `
                + `prix ${auFr(u)}.`,
  },
  'destacado.razon.barato': {
    es: (v, u) => `Nadie de esta tabla baja de ${v} por ${u}. Barato no es bueno: mira su `
                + 'nivel de verificacion.',
    en: (v, u) => `Nothing in this table goes below ${v} per ${u}. Cheap is not the same as `
                + 'good: check its verification level.',
    fr: (v, u) => `Personne dans ce tableau ne descend sous ${v} ${auFr(u)}. Pas cher ne veut `
                + 'pas dire bon : regardez son niveau de vérification.',
  },
  'destacado.razon.certificado': {
    es: 'Nivel 4: el sello lo respalda un tercero, no la marca. Es el que mejor puntua de '
      + 'los verificados.',
    en: 'Level 4: the certification is backed by a third party, not by the brand. It is the '
      + 'highest scoring of the verified ones.',
    fr: "Niveau 4 : le label est garanti par un tiers, pas par la marque. C'est le mieux "
      + 'noté parmi les vérifiés.',
  },
  'destacado.y': { es: 'y', en: 'and', fr: 'et' },
  'destacado.en_tienda': { es: 'En', en: 'At', fr: 'Chez' },
  'destacado.ver_desglose': {
    es: 'ver el desglose de su nota',
    en: 'see how its score breaks down',
    fr: 'voir le détail de sa note',
  },

  // ------------------------------------------------------------- la tabla de categoria
  'tabla.filtrar': { es: 'Filtrar y ordenar', en: 'Filter and sort', fr: 'Filtrer et trier' },
  'tabla.buscar': { es: 'Buscar', en: 'Search', fr: 'Chercher' },
  'tabla.buscar_hueco': {
    es: 'Buscar marca o producto', en: 'Search brand or product',
    fr: 'Chercher une marque ou un produit',
  },
  'tabla.tienda': { es: 'Tienda', en: 'Store', fr: 'Boutique' },
  'tabla.todas_tiendas': {
    es: 'Todas las tiendas', en: 'All stores', fr: 'Toutes les boutiques',
  },
  'tabla.maximo': { es: (u) => `Maximo ${u}`, en: (u) => `Max ${u}`, fr: (u) => `Max ${u}` },
  'tabla.ordenar_por': { es: 'Ordenar por', en: 'Sort by', fr: 'Trier par' },
  'tabla.limpiar': { es: 'limpiar filtros', en: 'clear filters', fr: 'effacer les filtres' },
  'tabla.quitar_filtros': {
    es: 'Quitar los filtros', en: 'Clear the filters', fr: 'Enlever les filtres',
  },
  'tabla.verificacion_minima': {
    es: 'Verificacion minima', en: 'Minimum verification', fr: 'Vérification minimale',
  },
  'tabla.nivel.todos': { es: 'Todos', en: 'All', fr: 'Tous' },
  'tabla.nivel.2': { es: '2+ declarado', en: '2+ claimed', fr: '2+ déclaré' },
  'tabla.nivel.3': { es: '3+ analisis', en: '3+ lab report', fr: '3+ analyse' },
  'tabla.nivel.4': { es: '4 verificado', en: '4 verified', fr: '4 vérifié' },
  'tabla.solo_sello': {
    es: (s) => `Solo ${s}`, en: (s) => `${s} only`, fr: (s) => `${s} uniquement`,
  },
  'tabla.caption': {
    es: (o) => `Productos ordenados por ${o}`,
    en: (o) => `Products sorted by ${o}`,
    fr: (o) => `Produits triés par ${o}`,
  },
  'tabla.col.producto': { es: 'Producto', en: 'Product', fr: 'Produit' },
  'tabla.col.envase': { es: 'Envase', en: 'Pack', fr: 'Emballage' },
  'tabla.col.verificacion': { es: 'Verificacion', en: 'Verification', fr: 'Vérification' },
  'tabla.col.score': { es: 'Score', en: 'Score', fr: 'Score' },
  'tabla.sabores': {
    es: (n) => `${n} sabores`, en: (n) => `${n} flavours`, fr: (n) => `${n} parfums`,
  },
  'tabla.opiniones_tienda': {
    es: (n) => `${n} opiniones en la tienda`,
    en: (n) => `${n} reviews at the store`,
    fr: (n) => `${n} avis en boutique`,
  },
  'tabla.activo_titulo': {
    es: 'Activo por cada 100 g, segun la tabla de la ficha',
    en: 'Active ingredient per 100 g, from the nutrition table on the product page',
    fr: "Actif pour 100 g, d'après le tableau de la fiche produit",
  },
  'tabla.activo': {
    es: (n) => `${n} % activo`, en: (n) => `${n} % active`, fr: (n) => `${n} % actif`,
  },
  'tabla.requisitos_titulo': {
    es: 'Requisitos de la categoria que cumple, de los comprobables',
    en: 'Category requirements it meets, out of the checkable ones',
    fr: 'Exigences de la catégorie remplies, parmi celles vérifiables',
  },
  'tabla.requisitos': {
    es: (a, b) => `${a}/${b} requisitos`,
    en: (a, b) => `${a}/${b} requirements`,
    fr: (a, b) => `${a}/${b} exigences`,
  },
  'tabla.infradosis': {
    es: 'infradosificado', en: 'underdosed', fr: 'sous-dosé',
  },
  'tabla.comparar': { es: 'comparar', en: 'compare', fr: 'comparer' },
  'tabla.en_comparativa': {
    es: 'en tu comparativa', en: 'in your comparison', fr: 'dans votre comparatif',
  },
  'tabla.mi_lista': { es: 'mi lista', en: 'my list', fr: 'ma liste' },
  'tabla.en_mi_lista': { es: 'en tu lista', en: 'in your list', fr: 'dans votre liste' },
  'tabla.ver_mas': {
    es: 'Ver los', en: 'See the', fr: 'Voir les',
  },
  'tabla.ver_mas_cola': {
    es: 'productos restantes', en: 'remaining products', fr: 'produits restants',
  },
  'tabla.volver_arriba': {
    es: 'Volver arriba', en: 'Back to top', fr: 'Retour en haut',
  },
  'tabla.vacio_titulo': {
    es: 'Ningun producto pasa ese corte',
    en: 'No product makes that cut',
    fr: 'Aucun produit ne passe ce filtre',
  },
  'tabla.vacio_pie': {
    es: (n) => `De los ${n} de esta tabla, ninguno cumple a la vez todos los filtros que `
             + 'hay puestos.',
    en: (n) => `Out of the ${n} in this table, none meets every filter that is currently `
             + 'set at the same time.',
    fr: (n) => `Sur les ${n} de ce tableau, aucun ne remplit à la fois tous les filtres `
             + 'en place.',
  },
  'tabla.pie': {
    es: (n) => `productos en esta tabla`,
    en: (n) => `products in this table`,
    fr: (n) => `produits dans ce tableau`,
  },
  'tabla.pie_filtrado': {
    es: (v, n) => `de ${n} productos con los filtros puestos`,
    en: (v, n) => `of ${n} products with the filters applied`,
    fr: (v, n) => `sur ${n} produits avec les filtres appliqués`,
  },
  'tabla.guardados': {
    es: (n) => (n === 1 ? 'producto guardado' : 'productos guardados'),
    en: (n) => (n === 1 ? 'product saved' : 'products saved'),
    fr: (n) => (n === 1 ? 'produit enregistré' : 'produits enregistrés'),
  },
  'tabla.tope': {
    es: (n) => ` (el tope son ${n})`,
    en: (n) => ` (the cap is ${n})`,
    fr: (n) => ` (le maximum est ${n})`,
  },
  'tabla.ver_comparativa': {
    es: 'Ver la comparativa', en: 'See the comparison', fr: 'Voir le comparatif',
  },
  'tabla.opiniones_lectores': {
    es: (n) => `${n} ${n === 1 ? 'opinion' : 'opiniones'} de lectores de esta web`,
    en: (n) => `${n} ${n === 1 ? 'review' : 'reviews'} from readers of this site`,
    fr: (n) => `${n} ${n === 1 ? 'avis' : 'avis'} de lecteurs de ce site`,
  },
  'tabla.aqui': { es: 'aqui', en: 'here', fr: 'ici' },

  // ------------------------------------------------------------- islas de la portada
  // Lo que pinta React en el navegador NO importa este diccionario: se lo pasa la pagina
  // ya traducido en una prop `txt`. Son 30 frases; el fichero entero son 30 KB, y meterlo
  // en el bundle para eso seria pagar el diccionario completo en cada visita.
  'peso.titulo': {
    es: 'Ordena la tabla con tu criterio',
    en: 'Sort the table by your own criteria',
    fr: 'Triez le tableau selon vos critères',
  },
  'peso.pista_oficial': {
    es: 'ahora: mitad precio, mitad calidad',
    en: 'now: half price, half quality',
    fr: 'actuellement : moitié prix, moitié qualité',
  },
  'peso.pista': {
    es: (w, c) => `ahora: ${w} % precio, ${c} % calidad`,
    en: (w, c) => `now: ${w} % price, ${c} % quality`,
    fr: (w, c) => `actuellement : ${w} % prix, ${c} % qualité`,
  },
  'peso.explicacion': {
    es: 'El orden de la tabla de abajo sale de una nota de 0 a 100. Aqui repartes a tu '
      + 'gusto las dos partes que discute todo el mundo: el precio frente al mas barato de '
      + 'su categoria y la calidad verificable. La nota de los compradores en la tienda no '
      + 'entra en este mando, que es la parte pequena del score y no la que se discute. '
      + 'Muevelo y mira que aguanta.',
    en: 'The order of the table below comes from a score out of 100. Here you split, as you '
      + 'see fit, the two parts everybody argues about: price against the cheapest in its '
      + "category, and verifiable quality. The buyers' rating at the store is not in this "
      + 'control: it is the small part of the score and not the one under discussion. Move '
      + 'it and see what holds up.',
    fr: "L'ordre du tableau ci-dessous vient d'une note sur 100. Ici vous répartissez à "
      + "votre guise les deux parties dont tout le monde débat : le prix face au moins cher "
      + 'de sa catégorie et la qualité vérifiable. La note des acheteurs en boutique '
      + "n'entre pas dans cette commande : c'est la petite part du score et pas celle qui "
      + 'fait débat. Déplacez-la et voyez ce qui tient.',
  },
  'peso.calidad': { es: 'Calidad', en: 'Quality', fr: 'Qualité' },
  'peso.precio': { es: 'Precio', en: 'Price', fr: 'Prix' },
  'peso.mando': {
    es: 'Peso del precio frente a la calidad verificable',
    en: 'Weight of price against verifiable quality',
    fr: 'Poids du prix face à la qualité vérifiable',
  },
  'peso.solo_precio': { es: 'Solo el precio', en: 'Price only', fr: 'Le prix seul' },
  'peso.mitad': { es: 'Mitad y mitad', en: 'Half and half', fr: 'Moitié-moitié' },
  'peso.solo_calidad': { es: 'Solo la calidad', en: 'Quality only', fr: 'La qualité seule' },

  'ponderador.sin_cambio': {
    es: (w) => `Con ${w} % precio no cambia ni un lider: los de aqui lo son por las dos `
             + 'mitades.',
    en: (w) => `At ${w} % price not a single leader changes: the ones here lead on both `
             + 'halves.',
    fr: (w) => `À ${w} % prix, aucun leader ne change : ceux d'ici le sont sur les deux `
             + 'moitiés.',
  },
  'ponderador.cambian': {
    es: (w, n, total) => `Con ${w} % precio, ${n} de ${total} categorias cambian de lider.`,
    en: (w, n, total) => `At ${w} % price, ${n} of ${total} categories change leader.`,
    fr: (w, n, total) => `À ${w} % prix, ${n} catégories sur ${total} changent de leader.`,
  },
  'ponderador.caption': {
    es: 'Producto con mejor score de cada categoria',
    en: 'Highest scoring product in each category',
    fr: 'Produit le mieux noté de chaque catégorie',
  },
  'ponderador.precio_unidad': {
    es: 'Precio unidad', en: 'Unit price', fr: 'Prix unitaire',
  },
  'ponderador.cambia': {
    es: 'cambia de lider', en: 'leader changes', fr: 'change de leader',
  },
  // El numero lo pinta la tabla en negrita aparte, asi que aqui solo va la cola.
  'ponderador.nivel4': { es: 'de nivel 4', en: 'at level 4', fr: 'de niveau 4' },
  'ponderador.mediana': { es: 'mediana', en: 'median', fr: 'médiane' },

  // --------------------------------------------------------------------- el buscador
  'buscador.aria': {
    es: (n) => `Buscar entre ${n} productos y sus comparativas`,
    en: (n) => `Search ${n} products and their comparisons`,
    fr: (n) => `Chercher parmi ${n} produits et leurs comparatifs`,
  },
  'buscador.hueco': {
    es: 'Busca una marca, un producto o un suplemento',
    en: 'Search a brand, a product or a supplement',
    fr: 'Cherchez une marque, un produit ou un complément',
  },
  'buscador.empieza': { es: 'Empieza por aqui', en: 'Start here', fr: 'Commencez ici' },
  'buscador.indexados': {
    es: (n) => `${n} productos indexados. Escribe dos letras.`,
    en: (n) => `${n} products indexed. Type two letters.`,
    fr: (n) => `${n} produits indexés. Tapez deux lettres.`,
  },
  'buscador.cargando': {
    es: 'Cargando el indice...', en: 'Loading the index...', fr: "Chargement de l'index...",
  },
  'buscador.nada': {
    es: 'Nada con', en: 'Nothing for', fr: 'Rien pour',
  },
  'buscador.nada_cola': {
    es: 'Puede que esa marca no la venda ninguna de las tiendas que se rastrean.',
    en: 'That brand may not be sold by any of the stores being tracked.',
    fr: "Cette marque n'est peut-être vendue par aucune des boutiques suivies.",
  },
  'buscador.grupo_cat': { es: 'Comparativas', en: 'Comparisons', fr: 'Comparatifs' },
  'buscador.grupo_prod': { es: 'Productos', en: 'Products', fr: 'Produits' },
  'buscador.ver_comparativa': {
    es: 'Ver la comparativa completa',
    en: 'See the full comparison',
    fr: 'Voir le comparatif complet',
  },

  // ------------------------------------------------------------------------- portada
  'portada.titulo': {
    es: (a, n) => `Comparador de precios de suplementos ${a}: ${n} productos`,
    en: (a, n) => `Supplement price comparison ${a}: ${n} products`,
    fr: (a, n) => `Comparateur de prix de compléments ${a} : ${n} produits`,
  },
  'portada.descripcion': {
    es: (n, tiendas, cats, fecha) =>
      `Compara el precio real por kilo de ${n} suplementos en ${tiendas} tiendas espanolas `
      + `(HSN, Myprotein, Prozis...): proteina, creatina y ${cats} categorias mas, con `
      + `certificacion. Precios del ${fecha}.`,
    en: (n, tiendas, cats, fecha) =>
      `Compare the real price per kilo of ${n} supplements across ${tiendas} Spanish stores `
      + `(HSN, Myprotein, Prozis...): protein, creatine and ${cats} more categories, with `
      + `certification. Prices from ${fecha}.`,
    fr: (n, tiendas, cats, fecha) =>
      `Comparez le prix réel au kilo de ${n} compléments dans ${tiendas} boutiques `
      + `espagnoles (HSN, Myprotein, Prozis...) : protéines, créatine et ${cats} autres `
      + `catégories, avec certification. Prix du ${fecha}.`,
  },
  'portada.lema': {
    es: 'Lo que cuesta de verdad, y quien responde de lo que vende',
    en: 'What it really costs, and who stands behind what they sell',
    fr: "Ce que ça coûte vraiment, et qui répond de ce qu'il vend",
  },
  'portada.h1': {
    es: 'Comparador de suplementos deportivos: precio por kilo y certificacion verificada',
    en: 'Sports supplement comparison: price per kilo and verified certification',
    fr: 'Comparateur de compléments sportifs : prix au kilo et certification vérifiée',
  },
  'portada.respuesta_corta': {
    es: 'La respuesta corta.', en: 'The short answer.', fr: 'La réponse courte.',
  },
  'portada.respuesta': {
    es: (n, tiendas, cats, fecha) =>
      `Compara ${n} suplementos de ${tiendas} tiendas espanolas en ${cats} categorias por `
      + 'precio por kilo (o por capsula) y por lo comprobable que es su certificacion, del '
      + '1 al 4. El orden lo manda una nota de 0 a 100, mitad precio y mitad calidad '
      + `verificable, que no mira los enlaces de afiliado. Precios del ${fecha}.`,
    en: (n, tiendas, cats, fecha) =>
      `Compares ${n} supplements from ${tiendas} Spanish stores across ${cats} categories `
      + 'by price per kilo (or per capsule) and by how verifiable their certification is, '
      + 'from 1 to 4. The ranking is set by a score out of 100, half price and half '
      + `verifiable quality, which never looks at affiliate links. Prices from ${fecha}.`,
    fr: (n, tiendas, cats, fecha) =>
      `Compare ${n} compléments de ${tiendas} boutiques espagnoles dans ${cats} catégories `
      + 'par prix au kilo (ou à la gélule) et selon le caractère vérifiable de leur '
      + 'certification, de 1 à 4. Le classement est décidé par une note sur 100, moitié '
      + 'prix et moitié qualité vérifiable, qui ne regarde jamais les liens affiliés. '
      + `Prix du ${fecha}.`,
  },
  'portada.h2_destacadas': {
    es: (n) => `Lo mejor de las ${n} categorias mas surtidas`,
    en: (n) => `The best of the ${n} best-stocked categories`,
    fr: (n) => `Le meilleur des ${n} catégories les mieux fournies`,
  },
  'portada.apunte_destacadas': {
    es: (n) => `Las otras ${n}, en el indice de abajo`,
    en: (n) => `The other ${n} are in the index below`,
    fr: (n) => `Les ${n} autres sont dans l'index plus bas`,
  },
  'portada.nota_orden': {
    es: 'El orden lo manda el score.',
    en: 'The score sets the ranking.',
    fr: 'Le score décide du classement.',
  },
  'portada.nota_orden_cuerpo': {
    es: 'Ni la afiliacion ni ningun acuerdo comercial mueven un producto de sitio; hay una '
      + 'prueba automatica que lo comprueba en cada actualizacion de datos.',
    en: 'Neither affiliation nor any commercial deal moves a product from its place; there '
      + 'is an automated test that checks it on every data update.',
    fr: "Ni l'affiliation ni aucun accord commercial ne déplace un produit ; un test "
      + 'automatique le vérifie à chaque mise à jour des données.',
  },
  'portada.nota_sellos': {
    es: (n) => ` ${n} ${n === 1 ? 'producto lleva sello' : 'productos llevan sello'} de esta `
             + 'web, y un sello certifica un criterio editorial publico, nunca un efecto '
             + 'sobre tu cuerpo. ',
    en: (n) => ` ${n} ${n === 1 ? 'product carries a badge' : 'products carry a badge'} from `
             + 'this site, and a badge certifies a published editorial criterion, never an '
             + 'effect on your body. ',
    fr: (n) => ` ${n} ${n === 1 ? 'produit porte un label' : 'produits portent un label'} de `
             + 'ce site, et un label certifie un critère éditorial public, jamais un effet '
             + 'sur votre corps. ',
  },
  'portada.criterio_sellos': {
    es: 'Criterio de los sellos', en: 'Badge criteria', fr: 'Critère des labels',
  },
  'portada.h2_otras': {
    es: (n) => `Las otras ${n} categorias`,
    en: (n) => `The other ${n} categories`,
    fr: (n) => `Les ${n} autres catégories`,
  },
  'portada.apunte_otras': {
    es: 'Mismo metodo, misma tabla', en: 'Same method, same table',
    fr: 'Même méthode, même tableau',
  },
  'portada.h2_comparativas': {
    es: 'Comparativas mas buscadas', en: 'Most searched comparisons',
    fr: 'Comparatifs les plus recherchés',
  },
  'portada.apunte_comparativas': {
    es: 'La tabla ya filtrada para una compra concreta',
    en: 'The table already filtered for one specific purchase',
    fr: 'Le tableau déjà filtré pour un achat précis',
  },
  'portada.h2_marcas': { es: 'Precios por marca', en: 'Prices by brand', fr: 'Prix par marque' },
  'portada.todas_marcas': {
    es: (n) => `Las ${n} marcas`, en: (n) => `All ${n} brands`, fr: (n) => `Les ${n} marques`,
  },
  'portada.h2_puntuacion': {
    es: 'Como se lee la puntuacion', en: 'How to read the score',
    fr: 'Comment lire la note',
  },
  'portada.apunte_puntuacion': {
    es: 'Tres numeros, ninguna estrella', en: 'Three numbers, no stars',
    fr: 'Trois chiffres, aucune étoile',
  },
  'portada.bloque1.h3': {
    es: 'Euros por kilo o por capsula', en: 'Euros per kilo or per capsule',
    fr: 'Euros au kilo ou à la gélule',
  },
  'portada.bloque1.p': {
    es: 'Cada categoria se compara en la unidad en la que se vende: por kilo los polvos, '
      + 'por capsula las perlas y los comprimidos. Nunca se mezclan las dos en la misma '
      + 'tabla, y el precio es el que paga hoy el comprador, no el tachado.',
    en: 'Every category is compared in the unit it is sold in: powders by the kilo, '
      + 'softgels and tablets by the capsule. The two are never mixed in the same table, '
      + 'and the price is the one a buyer pays today, not the crossed-out one.',
    fr: 'Chaque catégorie est comparée dans son unité de vente : les poudres au kilo, les '
      + 'capsules et comprimés à la gélule. Les deux ne sont jamais mélangées dans le même '
      + "tableau, et le prix est celui que paie l'acheteur aujourd'hui, pas le prix barré.",
  },
  'portada.bloque2.h3': {
    es: 'Nivel de verificacion', en: 'Verification level', fr: 'Niveau de vérification',
  },
  'portada.bloque2.p': {
    es: 'Del 1 al 4. Solo el 4 significa comprobado contra la fuente que emite el sello.',
    en: 'From 1 to 4. Only 4 means checked against the body that issues the certification.',
    fr: "De 1 à 4. Seul le 4 signifie vérifié auprès de l'organisme qui délivre le label.",
  },
  'portada.bloque3.h3': {
    es: 'Score de 0 a 100', en: 'Score from 0 to 100', fr: 'Score de 0 à 100',
  },
  'portada.bloque3.p': {
    es: 'Mitad precio frente al mas barato de su categoria, mitad calidad. Cada producto '
      + 'lleva su desglose linea a linea: puedes ver exactamente por que puntua lo que puntua.',
    en: 'Half price against the cheapest in its category, half quality. Every product carries '
      + 'its breakdown line by line: you can see exactly why it scores what it scores.',
    fr: 'Moitié prix face au moins cher de sa catégorie, moitié qualité. Chaque produit porte '
      + 'son détail ligne par ligne : vous voyez exactement pourquoi il obtient cette note.',
  },
  'portada.faq_titulo': {
    es: 'Preguntas sobre este comparador',
    en: 'Questions about this comparison tool',
    fr: 'Questions sur ce comparateur',
  },
  'portada.faq1.p': {
    es: '¿Como se decide que suplemento es mejor en esta web?',
    en: 'How does this site decide which supplement is better?',
    fr: 'Comment ce site décide-t-il quel complément est le meilleur ?',
  },
  'portada.faq1.r': {
    es: (coste, calidad) => `Con una nota de 0 a 100: ${coste} % precio frente al mas barato `
      + `de su categoria y ${calidad} % calidad verificable (nivel de certificacion, forma `
      + 'quimica del activo y, donde la tienda publica las dosis, si la formula llega a la '
      + 'dosis efectiva). Cada producto ensena su desglose linea a linea.',
    en: (coste, calidad) => `With a score out of 100: ${coste} % price against the cheapest `
      + `in its category and ${calidad} % verifiable quality (certification level, chemical `
      + 'form of the active ingredient and, where the store publishes doses, whether the '
      + 'formula reaches the effective dose). Every product shows its breakdown line by line.',
    fr: (coste, calidad) => `Avec une note sur 100 : ${coste} % le prix face au moins cher de `
      + `sa catégorie et ${calidad} % la qualité vérifiable (niveau de certification, forme `
      + "chimique de l'actif et, quand la boutique publie les doses, si la formule atteint la "
      + 'dose efficace). Chaque produit montre son détail ligne par ligne.',
  },
  'portada.faq2.p': {
    es: '¿Por que se compara por precio por kilo y no por envase?',
    en: 'Why compare by price per kilo and not per pack?',
    fr: 'Pourquoi comparer au prix au kilo et pas par emballage ?',
  },
  'portada.faq2.r': {
    es: 'Porque dos botes al mismo precio pueden costar el doble uno que otro segun lo que '
      + 'traigan dentro. Cada categoria se compara en la unidad en la que se vende: por kilo '
      + 'los polvos, por capsula las perlas y los comprimidos, y las dos unidades nunca se '
      + 'mezclan en la misma tabla.',
    en: 'Because two tubs at the same price can cost twice as much as each other depending on '
      + 'what is inside. Every category is compared in the unit it is sold in: powders by the '
      + 'kilo, softgels and tablets by the capsule, and the two units are never mixed in the '
      + 'same table.',
    fr: 'Parce que deux pots au même prix peuvent coûter le double l’un de l’autre selon ce '
      + "qu'ils contiennent. Chaque catégorie est comparée dans son unité de vente : les "
      + 'poudres au kilo, les capsules et comprimés à la gélule, et les deux unités ne sont '
      + 'jamais mélangées dans le même tableau.',
  },
  'portada.faq3.p': {
    es: '¿Los enlaces de afiliado cambian el orden de los productos?',
    en: 'Do affiliate links change the order of the products?',
    fr: "Les liens affiliés changent-ils l'ordre des produits ?",
  },
  'portada.faq3.r': {
    es: 'No. El score se calcula antes y sin leer el fichero de afiliados, y hay una prueba '
      + 'automatica que falla si el ranking cambia al aplicarlos. Los productos sin programa '
      + 'de afiliado aparecen exactamente igual.',
    en: 'No. The score is computed beforehand and without reading the affiliate file, and '
      + 'there is an automated test that fails if the ranking changes once they are applied. '
      + 'Products with no affiliate programme appear exactly the same.',
    fr: "Non. Le score est calculé avant et sans lire le fichier d'affiliation, et un test "
      + 'automatique échoue si le classement change une fois les liens appliqués. Les produits '
      + "sans programme d'affiliation apparaissent exactement pareil.",
  },
  'portada.faq4.p': {
    es: '¿Cada cuanto se actualizan los precios?',
    en: 'How often are the prices updated?',
    fr: 'À quelle fréquence les prix sont-ils mis à jour ?',
  },
  'portada.faq4.r': {
    es: (fecha) => 'Se vuelven a recoger de las tiendas en cada actualizacion; los de esta '
      + `version son del ${fecha}. El precio bueno siempre es el de la tienda: aqui sirve para `
      + 'comparar, no para pagar.',
    en: (fecha) => 'They are collected again from the stores on every update; the ones in this '
      + `version are from ${fecha}. The price that counts is always the store's: here it is `
      + 'for comparing, not for paying.',
    fr: (fecha) => 'Ils sont relevés de nouveau chez les boutiques à chaque mise à jour ; ceux '
      + `de cette version datent du ${fecha}. Le prix qui compte est toujours celui de la `
      + 'boutique : ici il sert à comparer, pas à payer.',
  },
  'portada.faq5.p': {
    es: '¿Que significa el nivel de verificacion 4?',
    en: 'What does verification level 4 mean?',
    fr: 'Que signifie le niveau de vérification 4 ?',
  },
  'portada.faq5.r': {
    es: 'Que el sello lo respalda alguien que no es la marca: o se ha comprobado en la fuente '
      + 'que lo emite (codigo QS de Creapure, lote en Informed Sport), o el producto lleva en '
      + 'el nombre una marca que exige un tercero detras, como Creapure o IFOS. Un sello suelto '
      + 'en la etiqueta se queda en el nivel 2.',
    en: 'That the certification is backed by someone who is not the brand: either it has been '
      + 'checked with the body that issues it (Creapure QS code, batch in Informed Sport), or '
      + 'the product carries in its name a trademark that requires a third party behind it, '
      + 'such as Creapure or IFOS. A loose logo on the label stays at level 2.',
    fr: "Que le label est garanti par quelqu'un qui n'est pas la marque : soit il a été vérifié "
      + "auprès de l'organisme qui le délivre (code QS Creapure, lot dans Informed Sport), soit "
      + 'le produit porte dans son nom une marque qui exige un tiers derrière, comme Creapure ou '
      + "IFOS. Un logo isolé sur l'étiquette reste au niveau 2.",
  },
  'portada.schema.pagina': {
    es: 'Comparador de suplementos deportivos: precio por kilo y certificacion',
    en: 'Sports supplement comparison: price per kilo and certification',
    fr: 'Comparateur de compléments sportifs : prix au kilo et certification',
  },
  'portada.schema.lista': {
    es: 'Comparativas de suplementos', en: 'Supplement comparisons',
    fr: 'Comparatifs de compléments',
  },
  'portada.schema.dataset': {
    es: 'Precios y certificaciones de suplementos deportivos en Espana',
    en: 'Prices and certifications of sports supplements in Spain',
    fr: 'Prix et certifications de compléments sportifs en Espagne',
  },
  'portada.schema.dataset_desc': {
    es: (n, tiendas, cats) => `${n} productos de ${tiendas} tiendas espanolas en ${cats} `
      + 'categorias, con el precio por unidad de venta (kilo o capsula) y el nivel de '
      + 'verificacion de sus certificaciones, del 1 al 4.',
    en: (n, tiendas, cats) => `${n} products from ${tiendas} Spanish stores across ${cats} `
      + 'categories, with the price per unit of sale (kilo or capsule) and the verification '
      + 'level of their certifications, from 1 to 4.',
    fr: (n, tiendas, cats) => `${n} produits de ${tiendas} boutiques espagnoles dans ${cats} `
      + 'catégories, avec le prix par unité de vente (kilo ou gélule) et le niveau de '
      + 'vérification de leurs certifications, de 1 à 4.',
  },
  'portada.schema.catalogo': {
    es: 'Catalogo completo', en: 'Full catalogue', fr: 'Catalogue complet',
  },
  'portada.schema.variables': {
    es: ['Precio del envase en euros', 'Precio por kilo', 'Precio por capsula',
         'Nivel de verificacion de la certificacion (1 a 4)',
         'Score de 0 a 100 (50 % precio, 50 % calidad verificable)'],
    en: ['Pack price in euros', 'Price per kilo', 'Price per capsule',
         'Certification verification level (1 to 4)',
         'Score from 0 to 100 (50 % price, 50 % verifiable quality)'],
    fr: ["Prix de l'emballage en euros", 'Prix au kilo', 'Prix à la gélule',
         'Niveau de vérification de la certification (1 à 4)',
         'Score de 0 à 100 (50 % prix, 50 % qualité vérifiable)'],
  },
  'portada.comparativa_vs': {
    es: (a, b, cat) => `${a} o ${b} en ${cat}`,
    en: (a, b, cat) => `${a} or ${b} for ${cat}`,
    fr: (a, b, cat) => `${a} ou ${b} en ${cat}`,
  },

  // --------------------------------------------------------------- indice (/guias/)
  'guias.titulo': {
    es: 'Todas las categorias y guias de suplementos',
    en: 'Every supplement category and guide',
    fr: 'Toutes les catégories et tous les guides de compléments',
  },
  'guias.descripcion': {
    es: (cats, n) => `El indice completo: ${cats} categorias comparadas por precio real y `
                   + `${n} guias de para que sirve cada suplemento, con dosis y fuentes.`,
    en: (cats, n) => `The full index: ${cats} categories compared on real price and ${n} `
                   + 'guides on what each supplement is for, with doses and sources.',
    fr: (cats, n) => `L'index complet : ${cats} catégories comparées au prix réel et ${n} `
                   + 'guides sur ce à quoi sert chaque complément, avec doses et sources.',
  },
  'guias.antetitulo': { es: 'Indice del sitio', en: 'Site index', fr: 'Index du site' },
  'guias.h1': {
    es: 'Categorias y guias', en: 'Categories and guides', fr: 'Catégories et guides',
  },
  'guias.entradilla_1': {
    es: 'Dos maneras de entrar. La ', en: 'Two ways in. The ', fr: 'Deux façons d’entrer. La ',
  },
  'guias.entradilla_cat': { es: 'categoria', en: 'category', fr: 'catégorie' },
  'guias.entradilla_2': {
    es: ' responde que comprar: su tabla ordenada por precio por kilo o por capsula. La ',
    en: ' answers what to buy: its table sorted by price per kilo or per capsule. The ',
    fr: ' répond à quoi acheter : son tableau trié par prix au kilo ou à la gélule. Le ',
  },
  'guias.entradilla_guia': { es: 'guia', en: 'guide', fr: 'guide' },
  'guias.entradilla_3': {
    es: ' responde si te hace falta: que hace el ingrediente, cuanto y con que fuente detras.',
    en: ' answers whether you need it: what the ingredient does, how much, and with what '
      + 'source behind it.',
    fr: " répond si vous en avez besoin : ce que fait l'ingrédient, combien, et avec quelle "
      + 'source derrière.',
  },
  'guias.h2_antes': {
    es: 'Antes de elegir categoria', en: 'Before choosing a category',
    fr: 'Avant de choisir une catégorie',
  },
  'guias.sutil_antes': {
    es: 'Las dos entradas de abajo dan por hecho que ya sabes que suplemento quieres. Estas '
      + 'tres contestan lo de antes: si hace falta, para que objetivo y en que tienda.',
    en: 'The two entries below assume you already know which supplement you want. These three '
      + 'answer what comes before: whether you need it, for which goal, and at which store.',
    fr: 'Les deux entrées ci-dessous supposent que vous savez déjà quel complément vous '
      + "voulez. Ces trois répondent à ce qui vient avant : s'il en faut, pour quel objectif "
      + 'et dans quelle boutique.',
  },
  'guias.por_evidencia': { es: 'por evidencia', en: 'by evidence', fr: 'par niveau de preuve' },
  'guias.por_objetivo': { es: 'por objetivo', en: 'by goal', fr: 'par objectif' },
  'guias.ranking': { es: 'ranking', en: 'ranking', fr: 'classement' },
  'guias.h2_categorias': { es: 'Categorias', en: 'Categories', fr: 'Catégories' },
  'guias.sutil_categorias': {
    es: (cats, n) => `${cats} categorias, ${n} productos comparados. Al lado de cada una, `
                   + 'cuantos productos tiene y en que unidad se compara.',
    en: (cats, n) => `${cats} categories, ${n} products compared. Next to each one, how many `
                   + 'products it holds and the unit it is compared in.',
    fr: (cats, n) => `${cats} catégories, ${n} produits comparés. À côté de chacune, combien `
                   + 'de produits elle contient et dans quelle unité elle est comparée.',
  },
  'guias.h2_guias': {
    es: 'Guias: para que sirve cada uno',
    en: 'Guides: what each one is for',
    fr: 'Guides : à quoi sert chacun',
  },
  'guias.sutil_guias': {
    es: (n) => `${n} guias. Ni un precio dentro: lo que cambia cada semana esta en la `
             + 'categoria, y aqui solo hay lo que sigue siendo verdad dentro de un ano.',
    en: (n) => `${n} guides. Not a single price inside: what changes every week lives in the `
             + 'category, and here there is only what will still be true in a year.',
    fr: (n) => `${n} guides. Pas un seul prix dedans : ce qui change chaque semaine est dans `
             + 'la catégorie, et ici il n’y a que ce qui sera encore vrai dans un an.',
  },
  'guias.schema': {
    es: 'Categorias y guias', en: 'Categories and guides', fr: 'Catégories et guides',
  },

  // ------------------------------------------------- copy generado (datos/seo.js)
  // Las respuestas del FAQ de una categoria. Ninguna afirma nada que no salga de un
  // numero del dataset, en los tres idiomas igual: si el dato falta, la pregunta no se
  // escribe. Ver el cabecero de datos/seo.js.
  'seo.faq.mejor': {
    es: (nombre, tienda, score, precio, razones, reparto) =>
      `${nombre} de ${tienda}, con ${score} puntos sobre 100 a ${precio}`
      + (razones ? `. Puntua asi porque ${razones}` : '')
      + `. La nota es ${reparto}, y ningun acuerdo comercial mueve el orden.`,
    en: (nombre, tienda, score, precio, razones, reparto) =>
      `${nombre} from ${tienda}, with ${score} points out of 100 at ${precio}`
      + (razones ? `. It scores like that because ${razones}` : '')
      + `. The mark is ${reparto}, and no commercial deal moves the ranking.`,
    fr: (nombre, tienda, score, precio, razones, reparto) =>
      `${nombre} chez ${tienda}, avec ${score} points sur 100 à ${precio}`
      + (razones ? `. Il obtient cette note parce que ${razones}` : '')
      + `. La note est ${reparto}, et aucun accord commercial ne déplace le classement.`,
  },
  'seo.faq.barato': {
    es: (nombre, tienda, precio, formato, envase, nivel) =>
      `${nombre} de ${tienda}, a ${precio} (envase de ${formato} por ${envase}). Tiene `
      + `nivel ${nivel} de verificacion sobre 4. Barato no es lo mismo que bien puntuado: `
      + 'el precio es la mitad de la nota y la otra mitad es lo comprobable que sea su '
      + 'certificacion.',
    en: (nombre, tienda, precio, formato, envase, nivel) =>
      `${nombre} from ${tienda}, at ${precio} (${formato} pack for ${envase}). It sits at `
      + `verification level ${nivel} out of 4. Cheap is not the same as well scored: price `
      + 'is half the mark and the other half is how verifiable its certification is.',
    fr: (nombre, tienda, precio, formato, envase, nivel) =>
      `${nombre} chez ${tienda}, à ${precio} (emballage de ${formato} pour ${envase}). Il `
      + `est au nive${auFr(nivel)} de vérification sur 4. Pas cher ne veut pas dire bien noté : `
      + 'le prix est la moitié de la note et l’autre moitié, le caractère vérifiable de sa '
      + 'certification.',
  },
  'seo.faq.precio': {
    es: (min, max, tiendas, mediana, unidad) =>
      `Entre ${min} y ${max} en las ${tiendas} tiendas comparadas, con una mediana de `
      + `${mediana}. Es el precio por ${unidad}, no el del envase: dos botes al mismo precio `
      + 'pueden costar el doble uno que otro segun lo que traigan dentro.',
    en: (min, max, tiendas, mediana, unidad) =>
      `Between ${min} and ${max} across the ${tiendas} stores compared, with a median of `
      + `${mediana}. That is the price per ${unidad}, not per pack: two tubs at the same `
      + 'price can cost twice as much as each other depending on what is inside.',
    fr: (min, max, tiendas, mediana, unidad) =>
      `Entre ${min} et ${max} dans les ${tiendas} boutiques comparées, avec une médiane de `
      + `${mediana}. C’est le prix ${auFr(unidad)}, pas celui de l’emballage : deux pots au même `
      + 'prix peuvent coûter le double l’un de l’autre selon ce qu’ils contiennent.',
  },
  'seo.faq.certificacion': {
    es: (n, nivel4, nivel3, otros) =>
      `De los ${n} productos comparados, ${nivel4} llegan al nivel 4 (el sello lo respalda `
      + 'un tercero: o lo hemos comprobado en la fuente que lo emite, o el producto lleva en '
      + 'el nombre una marca que exige un tercero detras, como Creapure o IFOS) y '
      + `${nivel3} al nivel 3 (analisis publicado por la propia marca). Los ${otros} `
      + 'restantes se quedan en un sello declarado en la ficha o en ninguno. Solo el nivel 4 '
      + 'esta comprobado contra quien emite el sello.',
    en: (n, nivel4, nivel3, otros) =>
      `Of the ${n} products compared, ${nivel4} reach level 4 (the certification is backed by `
      + 'a third party: either we checked it with the body that issues it, or the product '
      + 'carries in its name a trademark that requires a third party behind it, such as '
      + `Creapure or IFOS) and ${nivel3} reach level 3 (a lab report published by the brand `
      + `itself). The remaining ${otros} stop at a certification claimed on the product page, `
      + 'or none at all. Only level 4 is checked against whoever issues the certification.',
    fr: (n, nivel4, nivel3, otros) =>
      `Sur les ${n} produits comparés, ${nivel4} atteignent le niveau 4 (le label est garanti `
      + 'par un tiers : soit nous l’avons vérifié auprès de l’organisme qui le délivre, soit '
      + 'le produit porte dans son nom une marque qui exige un tiers derrière, comme Creapure '
      + `ou IFOS) et ${nivel3} le niveau 3 (analyse publiée par la marque elle-même). Les `
      + `${otros} restants en sont à un label déclaré sur la fiche, ou à aucun. Seul le niveau `
      + '4 est vérifié auprès de celui qui délivre le label.',
  },
  'seo.faq.dosis': {
    es: (termino, rango, nivel, fuente) =>
      `La dosis de referencia que usa esta web para ${termino} es ${rango} al dia, con `
      + `evidencia ${nivel}` + (fuente ? `. Fuente: ${fuente}` : '')
      + '. Es la dosis del ingrediente en el estudio citado, no una recomendacion para ti ni '
      + 'una afirmacion sobre ningun producto de la tabla.',
    en: (termino, rango, nivel, fuente) =>
      `The reference dose this site uses for ${termino} is ${rango} a day, with ${nivel} `
      + 'evidence' + (fuente ? `. Source: ${fuente}` : '')
      + '. That is the dose of the ingredient in the study cited, not a recommendation for '
      + 'you nor a claim about any product in the table.',
    fr: (termino, rango, nivel, fuente) =>
      `La dose de référence utilisée par ce site pour ${termino} est ${rango} par jour, avec `
      + `un niveau de preuve ${nivel}` + (fuente ? `. Source : ${fuente}` : '')
      + '. C’est la dose de l’ingrédient dans l’étude citée, pas une recommandation pour vous '
      + 'ni une affirmation sur un produit du tableau.',
  },
  // El nivel de evidencia de una dosis de referencia, tal y como lo escribe el JSON.
  'seo.evidencia.alta': { es: 'alta', en: 'strong', fr: 'élevé' },
  'seo.evidencia.media': { es: 'media', en: 'moderate', fr: 'modéré' },
  'seo.evidencia.baja': { es: 'baja', en: 'weak', fr: 'faible' },

  'seo.formato.capsulas': {
    es: (n) => `${n} capsulas`, en: (n) => `${n} capsules`, fr: (n) => `${n} gélules`,
  },
  'seo.formato.sin_declarar': {
    es: 'formato no declarado', en: 'pack size not stated', fr: 'format non déclaré',
  },

  // --- Titulo, H1 y descripcion de una categoria ---
  // `titula` prueba los sufijos de mas informativo a mas corto y se queda con el primero
  // que entra en el tope de caracteres, asi que el orden de esta lista importa.
  'seo.cat.titulo_base': {
    es: (termino, anio) => `Mejor ${termino} ${anio}`,
    en: (termino, anio) => `Best ${termino} ${anio}`,
    // En frances "meilleur" concuerda con el genero de la palabra ("meilleure creatine",
    // "meilleur collagene") y el genero de 50 terminos no se adivina. Se esquiva poniendo
    // el termino delante, que ademas es como titula una comparativa la prensa francesa.
    fr: (termino, anio) => `${termino.charAt(0).toUpperCase()}${termino.slice(1)} ${anio}`,
  },
  'seo.cat.sufijos': {
    es: [': cuál comprar por precio y certificación', ': precio y certificación',
         ': comparativa de precios'],
    en: [': which to buy on price and certification', ': price and certification',
         ': price comparison'],
    fr: [' : lequel acheter selon le prix et la certification',
         ' : prix et certification', ' : comparatif de prix'],
  },
  'seo.cat.sufijo_desde': {
    es: (desde, n) => `: desde ${desde}, ${n} comparados`,
    en: (desde, n) => `: from ${desde}, ${n} compared`,
    fr: (desde, n) => ` : dès ${desde}, ${n} comparés`,
  },
  'seo.cat.sufijo_desde_corto': {
    es: (desde) => `: desde ${desde}`,
    en: (desde) => `: from ${desde}`,
    fr: (desde) => ` : dès ${desde}`,
  },
  'seo.cat.h1': {
    es: (mejor, anio) => `${mejor} de ${anio}`,
    en: (mejor, anio) => `${mejor} of ${anio}`,
    fr: (mejor, anio) => `${mejor} ${anio}`,
  },
  'seo.cat.descripcion': {
    es: (termino, desde, n, tiendas) => `${termino} desde ${desde}: ${n} productos de `
      + `${tiendas} tiendas comparados por precio real y certificación.`,
    en: (termino, desde, n, tiendas) => `${termino} from ${desde}: ${n} products from `
      + `${tiendas} stores compared on real price and certification.`,
    fr: (termino, desde, n, tiendas) => `${termino} dès ${desde} : ${n} produits de `
      + `${tiendas} boutiques comparés au prix réel et à la certification.`,
  },
  'seo.cat.descripcion_lider': {
    es: (nombre, score) => ` Mejor valorado: ${nombre} (${score}/100).`,
    en: (nombre, score) => ` Top rated: ${nombre} (${score}/100).`,
    fr: (nombre, score) => ` Mieux noté : ${nombre} (${score}/100).`,
  },
  'seo.cat.descripcion_fecha': {
    es: (f) => ` Precios del ${f}.`, en: (f) => ` Prices from ${f}.`,
    fr: (f) => ` Prix du ${f}.`,
  },

  // ------------------------------------------------------- pagina de categoria (/creatina/)
  'cat.datos_del': { es: 'datos del', en: 'data from', fr: 'données du' },
  'cat.pase_guia': {
    es: (x) => `Que hace ${x}, en que dosis y con que evidencia`,
    en: (x) => `What ${x} does, at what dose and on what evidence`,
    fr: (x) => `Ce que fait ${x}, à quelle dose et sur quelles preuves`,
  },
  'cat.sin_dosis.titulo': {
    es: 'De la formula de esta categoria no se afirma nada.',
    en: 'Nothing is claimed about the formula in this category.',
    fr: 'Rien n’est affirmé sur la formule de cette catégorie.',
  },
  'cat.sin_dosis.cuerpo': {
    es: (u) => 'Ninguna de estas tiendas publica cuanto activo lleva cada dosis, asi que el '
             + `score sale del precio por ${u} y del nivel de verificacion, y nadie aparece `
             + 'aqui como bien o mal dosificado: no tenemos el dato y no nos lo inventamos.',
    en: (u) => 'None of these stores publishes how much active ingredient each dose carries, '
             + `so the score comes from the price per ${u} and the verification level, and `
             + 'nobody appears here as well or badly dosed: we do not have the data and we do '
             + 'not make it up.',
    fr: (u) => 'Aucune de ces boutiques ne publie la quantité d’actif par dose, donc le score '
             + `vient du prix ${auFr(u)} et du niveau de vérification, et personne n’apparaît ici `
             + 'comme bien ou mal dosé : nous n’avons pas la donnée et nous ne l’inventons pas.',
  },
  'cat.h2_tabla': {
    es: 'Comparativa completa', en: 'Full comparison', fr: 'Comparatif complet',
  },
  'cat.nota.titulo': {
    es: 'Que estas mirando.', en: 'What you are looking at.', fr: 'Ce que vous regardez.',
  },
  'cat.nota.cuerpo': {
    es: (u) => `El score es mitad precio por ${u} frente al mas barato de la categoria y `
             + 'mitad calidad: nivel de verificacion, forma quimica del activo y, donde la '
             + 'tienda publica las dosis, si la formula llega a la dosis efectiva. Cada '
             + 'producto explica su nota linea a linea en su ficha. ',
    en: (u) => `The score is half price per ${u} against the cheapest in the category and `
             + 'half quality: verification level, chemical form of the active ingredient and, '
             + 'where the store publishes doses, whether the formula reaches the effective '
             + 'dose. Every product explains its mark line by line on its own page. ',
    fr: (u) => `Le score est pour moitié le prix ${auFr(u)} face au moins cher de la catégorie et `
             + 'pour moitié la qualité : niveau de vérification, forme chimique de l’actif et, '
             + 'quand la boutique publie les doses, si la formule atteint la dose efficace. '
             + 'Chaque produit explique sa note ligne par ligne sur sa fiche. ',
  },
  'cat.nota.enlace': {
    es: 'Como se calcula', en: 'How it is calculated', fr: 'Comment elle est calculée',
  },
  // Notas al margen de la cabecera de categoria (F4.3 de PLAN-ESTETICA). Son el pie de
  // imprenta de la pagina: de cuando son los precios, de donde salen y como se puntua.
  'cat.margen.recogida': {
    es: 'Precios recogidos el', en: 'Prices collected on', fr: 'Prix relevés le',
  },
  'cat.margen.fuente': {
    es: (n) => `${n} tiendas espanolas`,
    en: (n) => `${n} Spanish stores`,
    fr: (n) => `${n} boutiques espagnoles`,
  },
  'cat.margen.metodo': {
    es: 'Como se puntua', en: 'How it is scored', fr: 'Comment on note',
  },
  'cat.margen.json': {
    es: 'Datos en crudo', en: 'Raw data', fr: 'Données brutes',
  },
  // Pie del marcador de un duelo de tiendas (F4.4). Dice sobre cuantas categorias se
  // juega y cuantas quedan en tablas, que es lo que hace que el resultado se pueda leer.
  'tvs.marcador_pie': {
    es: (n, e) => e > 0
      ? `en ${n} categorias que venden las dos · ${e} en tablas`
      : `en ${n} categorias que venden las dos`,
    en: (n, e) => e > 0
      ? `across ${n} categories both of them sell · ${e} tied`
      : `across ${n} categories both of them sell`,
    fr: (n, e) => e > 0
      ? `sur ${n} categories vendues par les deux · ${e} a egalite`
      : `sur ${n} categories vendues par les deux`,
  },
  'cat.faq_titulo': {
    es: (x) => `Preguntas sobre ${x}`,
    en: (x) => `Questions about ${x}`,
    fr: (x) => `Questions sur ${x}`,
  },
  'cat.cola.titulo': {
    es: (x) => `Preguntas mas concretas sobre ${x}`,
    en: (x) => `More specific questions about ${x}`,
    fr: (x) => `Questions plus précises sur ${x}`,
  },
  'cat.cola.cuenta': {
    es: (n) => `${n} comparativas — la misma tabla, filtrada`,
    en: (n) => `${n} comparisons — the same table, filtered`,
    fr: (n) => `${n} comparatifs — le même tableau, filtré`,
  },
  'cat.otras.titulo': {
    es: 'Otras comparativas', en: 'Other comparisons', fr: 'Autres comparatifs',
  },
  'cat.otras.cuenta': {
    es: (n) => `${n} categorias — mismo metodo`,
    en: (n) => `${n} categories — same method`,
    fr: (n) => `${n} catégories — même méthode`,
  },
  'cat.crudo.titulo': {
    es: 'Los datos, en crudo.', en: 'The raw data.', fr: 'Les données brutes.',
  },
  'cat.crudo.cuerpo_1': {
    es: 'Este ranking tambien esta en ', en: 'This ranking is also available as ',
    fr: 'Ce classement est aussi disponible en ',
  },
  'cat.crudo.cuerpo_2': {
    es: ', con la fecha de recogida y el enlace a cada ficha. Se puede citar y reutilizar '
      + 'diciendo de donde sale y de que dia son los precios.',
    en: ', with the collection date and a link to each product page. It can be cited and '
      + 'reused as long as you say where it comes from and which day the prices are from.',
    fr: ', avec la date de relevé et le lien vers chaque fiche. Il peut être cité et réutilisé '
      + 'à condition de dire d’où il vient et de quel jour datent les prix.',
  },
  'cat.schema.agregado': {
    es: (n) => `${n} en las tiendas comparadas`,
    en: (n) => `${n} across the stores compared`,
    fr: (n) => `${n} dans les boutiques comparées`,
  },
  'cat.schema.lista': {
    es: (n, u) => `${n}: ranking por precio por ${u} y certificacion`,
    en: (n, u) => `${n}: ranked by price per ${u} and certification`,
    fr: (n, u) => `${n} : classement par prix ${auFr(u)} et certification`,
  },

  // ------------------------------------------------------------ perfil de lector
  'lector.titulo': {
    es: 'Opiniones de un lector', en: "A reader's reviews", fr: "Les avis d'un lecteur",
  },
  'lector.descripcion': {
    es: 'Todas las opiniones que ha escrito un lector en FitnessSupplementWiki, con su nota media.',
    en: 'Every review a reader has written on FitnessSupplementWiki, with their average rating.',
    fr: 'Tous les avis écrits par un lecteur sur FitnessSupplementWiki, avec sa note moyenne.',
  },
  'lector.miga': { es: 'Lector', en: 'Reader', fr: 'Lecteur' },
  'lector.nota.titulo': {
    es: 'Las opiniones de los lectores no cuentan en el score.',
    en: "Readers' reviews do not count towards the score.",
    fr: 'Les avis des lecteurs ne comptent pas dans le score.',
  },
  'lector.nota.cuerpo': {
    es: 'La nota que ordena las tablas la calcula esta web con la composicion, la '
      + 'certificacion y el precio; esto es lo que cuenta quien lo ha comprado. ',
    en: 'The mark that sorts the tables is computed by this site from composition, '
      + 'certification and price; this is what the people who bought it have to say. ',
    fr: 'La note qui trie les tableaux est calculée par ce site à partir de la composition, '
      + 'de la certification et du prix ; ceci est ce que raconte celui qui l’a acheté. ',
  },
  'comun.como_score': {
    es: 'Como se calcula el score', en: 'How the score is calculated',
    fr: 'Comment le score est calculé',
  },

  // ------------------------------------------------------------- tu comparativa
  'comparar.titulo': {
    es: 'Tu comparativa de suplementos', en: 'Your supplement comparison',
    fr: 'Votre comparatif de compléments',
  },
  'comparar.descripcion': {
    es: 'Los productos que has guardado, enfrentados por precio por unidad, coste al mes, '
      + 'certificacion y score.',
    en: 'The products you saved, set against each other by unit price, monthly cost, '
      + 'certification and score.',
    fr: 'Les produits que vous avez enregistrés, confrontés par prix unitaire, coût mensuel, '
      + 'certification et score.',
  },
  'comparar.miga': { es: 'Tu comparativa', en: 'Your comparison', fr: 'Votre comparatif' },
  'comparar.antetitulo': {
    es: 'Lo que estas mirando', en: 'What you are looking at', fr: 'Ce que vous regardez',
  },
  'comparar.h1': { es: 'Tu comparativa', en: 'Your comparison', fr: 'Votre comparatif' },
  'comparar.entradilla': {
    es: 'Los productos que has ido guardando desde las tablas, uno al lado del otro. Hace '
      + 'falta entrar con tu cuenta para usarla.',
    en: 'The products you have been saving from the tables, side by side. You need to sign '
      + 'in to your account to use it.',
    fr: 'Les produits que vous avez enregistrés depuis les tableaux, côte à côte. Il faut se '
      + 'connecter à votre compte pour l’utiliser.',
  },
  'comparar.nota.titulo': {
    es: 'Cada categoria, en su unidad.', en: 'Every category in its own unit.',
    fr: 'Chaque catégorie dans son unité.',
  },
  'comparar.nota.cuerpo': {
    es: 'Los polvos se comparan por kilo y las capsulas por capsula, y las dos no se mezclan '
      + 'nunca en la misma tabla: por eso los productos salen agrupados por categoria y no '
      + 'todos juntos. ',
    en: 'Powders are compared by the kilo and capsules by the capsule, and the two are never '
      + 'mixed in the same table: that is why the products come grouped by category and not '
      + 'all together. ',
    fr: 'Les poudres sont comparées au kilo et les gélules à la gélule, et les deux ne sont '
      + 'jamais mélangées dans le même tableau : c’est pour cela que les produits sont '
      + 'regroupés par catégorie et pas tous ensemble. ',
  },

  // ----------------------------------------------------------------- mi lista
  'milista.titulo': {
    es: 'Mi lista de suplementos: dosis, duracion y gasto al mes',
    en: 'My supplements list: dose, how long it lasts and monthly spend',
    fr: 'Ma liste de compléments : dose, durée et dépense mensuelle',
  },
  'milista.descripcion': {
    es: 'Los suplementos que tomas, con tu dosis: cuanto dura cada envase, cuanto cuesta al '
      + 'mes y cuando toca volver a comprar.',
    en: 'The supplements you take, at your dose: how long each pack lasts, what it costs per '
      + 'month and when it is time to buy again.',
    fr: 'Les compléments que vous prenez, à votre dose : combien de temps dure chaque '
      + 'emballage, ce qu’il coûte par mois et quand il faut racheter.',
  },
  'milista.antetitulo': { es: 'Lo que tomas', en: 'What you take', fr: 'Ce que vous prenez' },
  'milista.entradilla': {
    es: 'Los suplementos que has ido guardando, cada uno con la dosis que tomas tu: lo que '
      + 'dura el envase, lo que sale al mes y lo que suman todos juntos. La lista se guarda '
      + 'en tu cuenta, asi que la tienes igual en el movil y en el ordenador.',
    en: 'The supplements you have been saving, each at your own dose: how long the pack '
      + 'lasts, what it comes to per month and what they all add up to. The list is saved to '
      + 'your account, so it is the same on your phone and on your computer.',
    fr: 'Les compléments que vous avez enregistrés, chacun à votre dose : combien de temps '
      + 'dure l’emballage, ce que cela fait par mois et ce que tout cela totalise. La liste '
      + 'est enregistrée dans votre compte, donc elle est identique sur le téléphone et sur '
      + 'l’ordinateur.',
  },
  'milista.nota.titulo': {
    es: 'El mes se calcula a 30 dias y con el precio de la ultima recogida.',
    en: 'The month is worked out at 30 days and at the price from the last collection.',
    fr: 'Le mois est calculé sur 30 jours et au prix du dernier relevé.',
  },
  'milista.nota.cuerpo': {
    es: 'Ni el precio de la tienda ni tu dosis son fijos: esto sirve para saber en que orden '
      + 'de magnitud esta tu gasto, no para cuadrar una factura. ',
    en: 'Neither the store price nor your dose is fixed: this tells you the order of '
      + 'magnitude of your spend, not how to balance an invoice. ',
    fr: 'Ni le prix de la boutique ni votre dose ne sont figés : ceci sert à savoir dans quel '
      + 'ordre de grandeur se situe votre dépense, pas à équilibrer une facture. ',
  },
  'milista.nota.enlace': {
    es: 'Como se calculan los precios', en: 'How the prices are calculated',
    fr: 'Comment les prix sont calculés',
  },

  // -------------------------------------------------------- indice de marcas
  'marcas.titulo': {
    es: (anio, n) => `Marcas de suplementos ${anio}: ${n} marcas con precios comparados`,
    en: (anio, n) => `Supplement brands ${anio}: ${n} brands with compared prices`,
    fr: (anio, n) => `Marques de compléments ${anio} : ${n} marques aux prix comparés`,
  },
  'marcas.descripcion': {
    es: (n, fecha) => `Precios de ${n} marcas de suplementos (HSN, Myprotein, Prozis, Optimum `
      + 'Nutrition...) comparados por precio por kilo y certificacion en tiendas espanolas. '
      + `Datos del ${fecha}.`,
    en: (n, fecha) => `Prices of ${n} supplement brands (HSN, Myprotein, Prozis, Optimum `
      + 'Nutrition...) compared by price per kilo and certification across Spanish stores. '
      + `Data from ${fecha}.`,
    fr: (n, fecha) => `Prix de ${n} marques de compléments (HSN, Myprotein, Prozis, Optimum `
      + 'Nutrition...) comparés par prix au kilo et certification dans les boutiques '
      + `espagnoles. Données du ${fecha}.`,
  },
  'marcas.miga': { es: 'Marcas', en: 'Brands', fr: 'Marques' },
  'marcas.h1': {
    es: (n) => `Marcas de suplementos: precios de ${n} marcas comparados`,
    en: (n) => `Supplement brands: prices from ${n} brands compared`,
    fr: (n) => `Marques de compléments : prix de ${n} marques comparés`,
  },
  'marcas.respuesta': {
    es: (fecha) => 'Cada marca tiene su pagina con todos sus productos, categoria a categoria '
      + `y del mas barato por unidad al mas caro, con la tienda que lo vende. Precios del ${fecha}.`,
    en: (fecha) => 'Every brand has its own page with all of its products, category by '
      + 'category and from the cheapest per unit to the dearest, with the store that sells '
      + `it. Prices from ${fecha}.`,
    fr: (fecha) => 'Chaque marque a sa page avec tous ses produits, catégorie par catégorie et '
      + 'du moins cher par unité au plus cher, avec la boutique qui le vend. Prix du '
      + `${fecha}.`,
  },
  'marcas.schema': {
    es: 'Marcas de suplementos comparadas', en: 'Supplement brands compared',
    fr: 'Marques de compléments comparées',
  },

  // ------------------------------------------------------------------ quienes somos
  'quienes.titulo': {
    es: 'Quienes somos: quien compara y verifica estos datos',
    en: 'About us: who compares and verifies this data',
    fr: 'Qui sommes-nous : qui compare et vérifie ces données',
  },
  'quienes.descripcion': {
    es: (sitio, tiendas) => `Quien esta detras de ${sitio}, como se recogen los precios de `
      + `${tiendas} tiendas, quien comprueba las certificaciones y que no hace esta web: ni `
      + 'consejo medico ni recomendaciones personalizadas.',
    en: (sitio, tiendas) => `Who is behind ${sitio}, how prices are collected from ${tiendas} `
      + 'stores, who checks the certifications, and what this site does not do: no medical '
      + 'advice and no personalised recommendations.',
    fr: (sitio, tiendas) => `Qui est derrière ${sitio}, comment les prix sont relevés dans `
      + `${tiendas} boutiques, qui vérifie les certifications, et ce que ce site ne fait pas : `
      + 'ni conseil médical ni recommandations personnalisées.',
  },
  'quienes.antetitulo': {
    es: 'Quien responde de estos datos', en: 'Who answers for this data',
    fr: 'Qui répond de ces données',
  },
  'quienes.entradilla': {
    es: 'Una comparativa de suplementos sin nombre detras no la deberia creer nadie, ni un '
      + 'lector ni un buscador. Aqui esta el nombre, lo que hace y —igual de importante— lo '
      + 'que no hace.',
    en: 'Nobody should believe a supplement comparison with no name behind it, neither a '
      + 'reader nor a search engine. Here is the name, what it does and —just as important— '
      + 'what it does not do.',
    fr: 'Personne ne devrait croire un comparatif de compléments sans nom derrière, ni un '
      + 'lecteur ni un moteur de recherche. Voici le nom, ce qu’il fait et —tout aussi '
      + 'important— ce qu’il ne fait pas.',
  },
  'quienes.h2_quien': { es: 'Quien', en: 'Who', fr: 'Qui' },
  'quienes.quien_p1': {
    es: ' Escribe tambien todos los textos que se ven aqui, salvo los que genera el propio '
      + 'programa a partir de los datos.',
    en: ' They also write every text you see here, except the ones the program itself '
      + 'generates from the data.',
    fr: ' Il écrit aussi tous les textes visibles ici, sauf ceux que le programme lui-même '
      + 'génère à partir des données.',
  },
  'quienes.contacto': {
    es: 'Contacto directo, sin formulario: ', en: 'Direct contact, no form: ',
    fr: 'Contact direct, sans formulaire : ',
  },
  'quienes.contacto_cola': {
    es: '. Si un precio esta mal, si un sello esta mal clasificado o si un producto no '
      + 'deberia estar en una categoria, ese correo es el sitio. Las correcciones entran en '
      + 'la siguiente actualizacion de datos y no hace falta pedir permiso a nadie.',
    en: '. If a price is wrong, if a certification is misclassified, or if a product should '
      + 'not be in a category, that address is the place. Corrections go into the next data '
      + 'update and nobody needs to ask permission.',
    fr: '. Si un prix est faux, si un label est mal classé ou si un produit ne devrait pas '
      + 'être dans une catégorie, cette adresse est le bon endroit. Les corrections entrent '
      + 'dans la mise à jour suivante et personne n’a besoin de demander la permission.',
  },
  'quienes.h2_no_es': {
    es: 'Que no es esta web', en: 'What this site is not', fr: 'Ce que ce site n’est pas',
  },
  'quienes.no_es_nota': {
    es: ' No hay aqui ninguna recomendacion personalizada, ni una pauta, ni una dosis para '
      + 'ti. Si tomas medicacion, estas embarazada, tienes una patologia renal o hepatica, o '
      + 'simplemente dudas, la pregunta es para tu medico o tu dietista-nutricionista, no '
      + 'para una tabla de precios.',
    en: ' There is no personalised recommendation here, no protocol, no dose for you. If you '
      + 'take medication, are pregnant, have kidney or liver disease, or simply have doubts, '
      + 'the question is for your doctor or your dietitian, not for a price table.',
    fr: ' Il n’y a ici aucune recommandation personnalisée, ni protocole, ni dose pour vous. '
      + 'Si vous prenez un traitement, si vous êtes enceinte, si vous avez une maladie rénale '
      + 'ou hépatique, ou si vous avez simplement un doute, la question est pour votre médecin '
      + 'ou votre diététicien, pas pour un tableau de prix.',
  },
  'quienes.no_es_p1': {
    es: 'Lo que si se publica son ', en: 'What is published here are ',
    fr: 'Ce qui est publié ici, ce sont ',
  },
  'quienes.no_es_hechos': {
    es: 'hechos comprobables', en: 'verifiable facts', fr: 'des faits vérifiables',
  },
  'quienes.no_es_p2': {
    es: ': lo que cuesta un kilo, lo que declara la ficha de la tienda, y si ese sello se ha '
      + 'podido comprobar contra quien lo emite. Ningun efecto se atribuye a un producto: la '
      + 'evidencia se cita siempre por ',
    en: ': what a kilo costs, what the store page claims, and whether that certification '
      + 'could be checked against whoever issues it. No effect is ever attributed to a '
      + 'product: evidence is always cited per ',
    fr: ' : ce que coûte un kilo, ce que déclare la fiche de la boutique, et si ce label a pu '
      + 'être vérifié auprès de celui qui le délivre. Aucun effet n’est attribué à un '
      + 'produit : les preuves sont toujours citées par ',
  },
  'quienes.ingrediente': { es: 'ingrediente', en: 'ingredient', fr: 'ingrédient' },
  'quienes.no_es_p3': {
    es: ', con su dosis y su DOI, en ', en: ', with its dose and its DOI, in ',
    fr: ', avec leur dose et leur DOI, dans ',
  },
  'quienes.la_metodologia': {
    es: 'la metodologia', en: 'the methodology', fr: 'la méthodologie',
  },
  'quienes.y_en': { es: ' y en ', en: ' and in ', fr: ' et dans ' },
  'quienes.las_guias': {
    es: 'las guias de evidencia', en: 'the evidence guides', fr: 'les guides de preuves',
  },
  'quienes.h2_como': {
    es: 'Como se hace, para poder discutirlo',
    en: 'How it is done, so you can argue with it',
    fr: 'Comment c’est fait, pour pouvoir en discuter',
  },
  'quienes.como_p1': {
    es: (n, tiendas, cats) => 'La experiencia que se puede alegar aqui no es clinica, es de '
      + `datos, y esa si esta a la vista: ${n} productos de ${tiendas} tiendas espanolas en `
      + `${cats} categorias, recogidos automaticamente y vueltos a recoger en cada `
      + 'actualizacion. La ultima fue el ',
    en: (n, tiendas, cats) => 'The expertise that can be claimed here is not clinical, it is '
      + `about data, and that one is in plain sight: ${n} products from ${tiendas} Spanish `
      + `stores across ${cats} categories, collected automatically and collected again on `
      + 'every update. The last one was on ',
    fr: (n, tiendas, cats) => 'L’expertise qu’on peut revendiquer ici n’est pas clinique, elle '
      + `porte sur les données, et celle-là est visible : ${n} produits de ${tiendas} `
      + `boutiques espagnoles dans ${cats} catégories, relevés automatiquement et relevés à `
      + 'nouveau à chaque mise à jour. La dernière date du ',
  },
  'quienes.li_precio_t': { es: 'precio', en: 'price', fr: 'prix' },
  'quienes.li_precio': {
    es: ' se lee de la ficha de la tienda y se normaliza a la unidad en la que se vende esa '
      + 'categoria: euros por kilo los polvos, euros por capsula las perlas. Nunca se mezclan '
      + 'las dos unidades en una tabla.',
    en: ' is read from the store page and normalised to the unit that category is sold in: '
      + 'euros per kilo for powders, euros per capsule for softgels. The two units are never '
      + 'mixed in one table.',
    fr: ' est lu sur la fiche de la boutique et normalisé à l’unité de vente de la catégorie : '
      + 'euros au kilo pour les poudres, euros à la gélule pour les capsules. Les deux unités '
      + 'ne sont jamais mélangées dans un tableau.',
  },
  'quienes.li_cert_t': { es: 'certificacion', en: 'certification', fr: 'certification' },
  'quienes.li_cert': {
    es: ' se clasifica en cuatro niveles, y el nivel 4 exige que el sello lo respalde alguien '
      + 'que no sea la marca: o se ha comprobado el codigo en la fuente que lo emite, o el '
      + 'nombre lleva una marca que exige contrato con un tercero, como Creapure o IFOS.',
    en: ' is classified into four levels, and level 4 requires the certification to be backed '
      + 'by someone other than the brand: either the code was checked with the body that '
      + 'issues it, or the name carries a trademark that requires a contract with a third '
      + 'party, such as Creapure or IFOS.',
    fr: ' est classée en quatre niveaux, et le niveau 4 exige que le label soit garanti par '
      + 'quelqu’un d’autre que la marque : soit le code a été vérifié auprès de l’organisme qui '
      + 'le délivre, soit le nom porte une marque qui exige un contrat avec un tiers, comme '
      + 'Creapure ou IFOS.',
  },
  'quienes.li_score_t': { es: 'score', en: 'score', fr: 'score' },
  'quienes.li_score': {
    es: ' es mitad precio por unidad y mitad calidad verificable, y cada producto ensena su '
      + 'desglose linea a linea en su ficha. Si un numero no se puede explicar, no sale.',
    en: ' is half unit price and half verifiable quality, and every product shows its '
      + 'breakdown line by line on its own page. If a number cannot be explained, it does not '
      + 'get published.',
    fr: ' est pour moitié le prix unitaire et pour moitié la qualité vérifiable, et chaque '
      + 'produit montre son détail ligne par ligne sur sa fiche. Si un chiffre ne peut pas '
      + 'être expliqué, il ne sort pas.',
  },
  'quienes.li_afiliado_t': {
    es: 'enlaces de afiliado', en: 'affiliate links', fr: 'liens affiliés',
  },
  'quienes.li_afiliado': {
    es: ' no entran en el calculo, y hay una prueba automatica que falla si el orden cambia '
      + 'al aplicarlos.',
    en: ' do not enter the calculation, and there is an automated test that fails if the '
      + 'order changes once they are applied.',
    fr: ' n’entrent pas dans le calcul, et un test automatique échoue si l’ordre change une '
      + 'fois qu’ils sont appliqués.',
  },
  'quienes.como_p2_1': { es: 'Todo eso esta escrito con detalle en ', en: 'All of that is written out in detail in ', fr: 'Tout cela est écrit en détail dans ' },
  'quienes.como_p2_2': {
    es: ', que es el documento que hay que leer para llevarle la contraria a esta web con '
      + 'argumentos. Los datos de cada categoria se publican tambien ',
    en: ', which is the document to read if you want to argue against this site with '
      + 'arguments. The data for each category is also published ',
    fr: ', le document à lire pour contredire ce site avec des arguments. Les données de '
      + 'chaque catégorie sont aussi publiées ',
  },
  'quienes.en_json': { es: 'en JSON', en: 'as JSON', fr: 'en JSON' },
  'quienes.como_p2_3': {
    es: ', para que cualquiera pueda rehacer las cuentas por su cuenta.',
    en: ', so anyone can redo the maths for themselves.',
    fr: ', pour que chacun puisse refaire les calculs de son côté.',
  },
  'quienes.h2_dinero': {
    es: 'De donde sale el dinero', en: 'Where the money comes from',
    fr: 'D’où vient l’argent',
  },
  'quienes.dinero_con': {
    es: 'Algunos enlaces a tienda son de afiliado: si compras, esta web puede llevarse una '
      + 'comision, sin coste extra para ti. El score se calcula antes y sin mirar esos enlaces.',
    en: 'Some store links are affiliate links: if you buy, this site may earn a commission at '
      + 'no extra cost to you. The score is computed beforehand and without looking at those '
      + 'links.',
    fr: 'Certains liens vers les boutiques sont affiliés : si vous achetez, ce site peut '
      + 'toucher une commission, sans surcoût pour vous. Le score est calculé avant et sans '
      + 'regarder ces liens.',
  },
  'quienes.dinero_sin': {
    es: 'Hoy no hay ningun programa de afiliado activo: ningun enlace de esta web genera '
      + 'comision. Si algun dia lo hay, se avisara en cada pagina donde haya enlaces a tienda '
      + 'y el criterio no cambiara, porque el score se calcula sin mirarlos.',
    en: 'There is no affiliate programme active today: no link on this site earns a '
      + 'commission. If there ever is one, it will be flagged on every page with store links '
      + 'and the criterion will not change, because the score is computed without looking at '
      + 'them.',
    fr: 'Aucun programme d’affiliation n’est actif aujourd’hui : aucun lien de ce site ne '
      + 'génère de commission. S’il y en a un jour, ce sera signalé sur chaque page avec des '
      + 'liens vers les boutiques et le critère ne changera pas, car le score est calculé sans '
      + 'les regarder.',
  },
  'quienes.dinero_enlace': {
    es: 'Como funciona la afiliacion aqui', en: 'How affiliation works here',
    fr: 'Comment fonctionne l’affiliation ici',
  },
  'quienes.aviso_legal': { es: 'Aviso legal', en: 'Legal notice', fr: 'Mentions légales' },
  'quienes.dinero_p2': {
    es: 'Ninguna marca ni tienda paga por aparecer, por subir puestos ni por llevarse un '
      + 'sello. No se aceptan productos gratis a cambio de resenas, entre otras cosas porque '
      + 'aqui no se resena ningun producto: se compara lo que cuesta y lo que se puede '
      + 'comprobar.',
    en: 'No brand or store pays to appear, to move up the ranking or to get a badge. No free '
      + 'products are accepted in exchange for reviews, among other reasons because no '
      + 'product is reviewed here: what is compared is what it costs and what can be checked.',
    fr: 'Aucune marque ni boutique ne paie pour apparaître, pour monter dans le classement ou '
      + 'pour obtenir un label. Aucun produit gratuit n’est accepté en échange d’un avis, '
      + 'entre autres parce qu’aucun produit n’est testé ici : on compare ce que ça coûte et ce '
      + 'qui peut être vérifié.',
  },
  'quienes.volver': {
    es: 'Leer la metodologia completa', en: 'Read the full methodology',
    fr: 'Lire la méthodologie complète',
  },
  'quienes.schema': {
    es: (sitio) => `Quien esta detras de ${sitio}`,
    en: (sitio) => `Who is behind ${sitio}`,
    fr: (sitio) => `Qui est derrière ${sitio}`,
  },

  // ------------------------------------------------------------ guia (/guia/creatina/)
  'guia.miga': { es: 'Guia', en: 'Guide', fr: 'Guide' },
  'guia.no_producto': {
    es: ' Ninguna cifra de esta pagina se atribuye a un producto concreto: el efecto es del '
      + 'ingrediente y cada numero lleva su fuente al lado.',
    en: ' No figure on this page is attributed to a specific product: the effect belongs to '
      + 'the ingredient and every number carries its source next to it.',
    fr: ' Aucun chiffre de cette page n’est attribué à un produit précis : l’effet est celui '
      + 'de l’ingrédient et chaque nombre porte sa source à côté.',
  },
  'guia.revisado': { es: 'Revisado', en: 'Reviewed', fr: 'Relu' },
  'guia.idx_efectos': { es: 'Que hace y cuanto', en: 'What it does and how much', fr: 'Ce qu’il fait et combien' },
  'guia.idx_protocolo': { es: 'Como se toma', en: 'How to take it', fr: 'Comment le prendre' },
  'guia.idx_situaciones': { es: 'Cuando tiene sentido', en: 'When it makes sense', fr: 'Quand c’est utile' },
  'guia.idx_fuentes': { es: 'Fuentes', en: 'Sources', fr: 'Sources' },
  'guia.efectos_p': {
    es: 'Cada fila es un efecto medido, con la cifra que da el estudio y el numero de la '
      + 'fuente. Donde la evidencia no da una cifra, la columna lo dice en vez de inventarse '
      + 'un porcentaje.',
    en: 'Each row is a measured effect, with the figure the study gives and the source number. '
      + 'Where the evidence gives no figure, the column says so instead of making up a '
      + 'percentage.',
    fr: 'Chaque ligne est un effet mesuré, avec le chiffre donné par l’étude et le numéro de '
      + 'la source. Là où les preuves ne donnent pas de chiffre, la colonne le dit au lieu '
      + 'd’inventer un pourcentage.',
  },
  'guia.caption': {
    es: (x) => `Efectos de ${x} con su fuente`, en: (x) => `Effects of ${x} with their source`,
    fr: (x) => `Effets ${deFr(x)} avec leur source`,
  },
  'guia.col_efecto': { es: 'Efecto', en: 'Effect', fr: 'Effet' },
  'guia.col_cuanto': { es: 'Cuanto', en: 'How much', fr: 'Combien' },
  'guia.col_detalle': { es: 'Detalle', en: 'Detail', fr: 'Détail' },
  'guia.fuente_n': { es: (n) => `Fuente ${n}`, en: (n) => `Source ${n}`, fr: (n) => `Source ${n}` },
  'guia.dosis': { es: 'Dosis.', en: 'Dose.', fr: 'Dose.' },
  'guia.cuando': { es: 'Cuando.', en: 'When.', fr: 'Quand.' },
  'guia.tarda': {
    es: 'Cuanto tarda en notarse.', en: 'How long before you notice it.',
    fr: 'Combien de temps avant de le remarquer.',
  },
  'guia.detalles': {
    es: 'Detalles que cambian el resultado', en: 'Details that change the result',
    fr: 'Détails qui changent le résultat',
  },
  'guia.h2_situaciones': {
    es: 'Cuando tiene sentido y cuando no', en: 'When it makes sense and when it does not',
    fr: 'Quand c’est utile et quand ça ne l’est pas',
  },
  'guia.compensa': { es: 'Compensa si', en: 'Worth it if', fr: 'Utile si' },
  'guia.no_compensa': { es: 'No compensa si', en: 'Not worth it if', fr: 'Inutile si' },
  'guia.fuentes_p': {
    es: 'Todas las cifras de arriba salen de aqui. Son posicionamientos de sociedades '
      + 'cientificas, metaanalisis y revisiones con revision por pares: si una afirmacion no '
      + 'se puede colgar de una de estas lineas, no esta en la pagina.',
    en: 'Every figure above comes from here. They are position stands from scientific '
      + 'societies, meta-analyses and peer-reviewed reviews: if a claim cannot hang from one '
      + 'of these lines, it is not on the page. References are cited in their original form.',
    fr: 'Tous les chiffres ci-dessus viennent d’ici. Ce sont des prises de position de sociétés '
      + 'savantes, des méta-analyses et des revues relues par des pairs : si une affirmation ne '
      + 'peut pas se rattacher à l’une de ces lignes, elle n’est pas sur la page. Les '
      + 'références sont citées dans leur forme originale.',
  },
  'guia.no_medico_t': {
    es: 'Esto no es consejo medico.', en: 'This is not medical advice.',
    fr: 'Ceci n’est pas un conseil médical.',
  },
  'guia.no_medico': {
    es: ' Es lo que dicen unos estudios sobre un ingrediente, no una pauta para ti. Con una '
      + 'enfermedad de por medio, medicacion o embarazo, la decision es de un profesional '
      + 'sanitario que te conozca.',
    en: ' It is what some studies say about an ingredient, not a protocol for you. With an '
      + 'illness, medication or pregnancy involved, the decision belongs to a healthcare '
      + 'professional who knows you.',
    fr: ' C’est ce que disent des études sur un ingrédient, pas un protocole pour vous. En cas '
      + 'de maladie, de traitement ou de grossesse, la décision revient à un professionnel de '
      + 'santé qui vous connaît.',
  },
  'guia.h2_comprar': { es: 'Y ahora, cual comprar', en: 'And now, which to buy', fr: 'Et maintenant, lequel acheter' },
  'guia.apunte_comprar': {
    es: 'Los precios, aparte de la evidencia', en: 'Prices, kept apart from the evidence',
    fr: 'Les prix, à part des preuves',
  },
  'guia.comprar_p': {
    es: (x, n, tiendas) => `Esta pagina explica que hace ${x} y no menciona ni una marca a `
      + `proposito. La comparativa es la otra mitad: ${n} productos de ${tiendas}`,
    en: (x, n, tiendas) => `This page explains what ${x} does and deliberately names no brand. `
      + `The comparison is the other half: ${n} products from ${tiendas}`,
    fr: (x, n, tiendas) => `Cette page explique ce que fait ${x} et ne cite volontairement aucune `
      + `marque. Le comparatif est l’autre moitié : ${n} produits de ${tiendas}`,
  },
  'guia.comprar_desde': {
    es: (p, u) => ` desde ${p} por ${u}`, en: (p, u) => ` from ${p} per ${u}`,
    fr: (p, u) => ` dès ${p} ${auFr(u)}`,
  },
  'guia.comprar_cola': {
    es: ', ordenados por precio y por lo comprobable que es su certificacion.',
    en: ', sorted by price and by how verifiable their certification is.',
    fr: ', triés par prix et selon le caractère vérifiable de leur certification.',
  },
  'guia.ver_comparativa': {
    es: (x) => `Ver la comparativa de ${x}`, en: (x) => `See the ${x} comparison`,
    fr: (x) => `Voir le comparatif : ${x}`,
  },
  'guia.h2_otras': { es: 'Otras guias', en: 'Other guides', fr: 'Autres guides' },
  'guia.apunte_otras': {
    es: 'Que hace cada suplemento, con sus fuentes', en: 'What each supplement does, with its sources',
    fr: 'Ce que fait chaque complément, avec ses sources',
  },

  // ------------------------------------------------------------------ /tiendas/
  'tiendas.titulo': {
    es: (n) => `Que tienda de suplementos es mas barata: ${n} comparadas`,
    en: (n) => `Which supplement store is cheapest: ${n} compared`,
    fr: (n) => `Quelle boutique de compléments est la moins chère : ${n} comparées`,
  },
  'tiendas.descripcion': {
    es: (n, f) => `Las ${n} tiendas de suplementos comparadas con el mismo criterio: cuanto se `
      + 'separa la mediana de cada una de la del mercado en cada categoria, con productos y '
      + `verificacion. Datos del ${f}.`,
    en: (n, f) => `All ${n} supplement stores compared on the same criterion: how far each `
      + 'one’s median sits from the market median in every category, with products and '
      + `verification. Data from ${f}.`,
    fr: (n, f) => `Les ${n} boutiques de compléments comparées selon le même critère : l’écart `
      + 'entre la médiane de chacune et celle du marché dans chaque catégorie, avec produits '
      + `et vérification. Données du ${f}.`,
  },
  'tiendas.miga': { es: 'Tiendas', en: 'Stores', fr: 'Boutiques' },
  'tiendas.antetitulo': { es: 'Cara a cara de tiendas', en: 'Stores head to head', fr: 'Boutiques face à face' },
  'tiendas.h1': {
    es: 'Que tienda de suplementos sale mas barata', en: 'Which supplement store works out cheapest',
    fr: 'Quelle boutique de compléments revient la moins chère',
  },
  'tiendas.respuesta': {
    es: (b, n, ib, prods, cats, c, ic) => `${b} es la mas barata de las ${n} comparadas: en una `
      + `categoria tipica esta un ${ib} % por debajo de la mediana del mercado, con ${prods} `
      + `productos en ${cats} categorias medibles. La mas cara es ${c}, un ${ic} % por encima. `
      + 'Ninguna gana en todo: la tabla dice en cuantas categorias esta cada una por debajo y '
      + 'por encima.',
    en: (b, n, ib, prods, cats, c, ic) => `${b} is the cheapest of the ${n} compared: in a `
      + `typical category it sits ${ib} % below the market median, with ${prods} products in `
      + `${cats} measurable categories. The dearest is ${c}, ${ic} % above. None wins at `
      + 'everything: the table shows in how many categories each is below and above.',
    fr: (b, n, ib, prods, cats, c, ic) => `${b} est la moins chère des ${n} comparées : dans une `
      + `catégorie typique elle se situe ${ib} % sous la médiane du marché, avec ${prods} `
      + `produits dans ${cats} catégories mesurables. La plus chère est ${c}, ${ic} % au-dessus. `
      + 'Aucune ne gagne partout : le tableau indique dans combien de catégories chacune est '
      + 'en dessous et au-dessus.',
  },
  'tiendas.entradilla': {
    es: 'Los catalogos no se pueden sumar: una tienda vende kilos de proteina y otra capsulas '
      + 'de omega 3. Lo que si se puede comparar es la posicion de cada una dentro de cada '
      + 'categoria, en porcentaje sobre la mediana del mercado. El indice de esta tabla es la '
      + 'mediana de esas posiciones, y por eso se puede leer de arriba abajo.',
    en: 'Catalogues cannot be added up: one store sells kilos of protein and another omega 3 '
      + 'capsules. What can be compared is where each one sits within each category, as a '
      + 'percentage of the market median. The index in this table is the median of those '
      + 'positions, which is why it can be read from top to bottom.',
    fr: 'On ne peut pas additionner des catalogues : une boutique vend des kilos de protéine et '
      + 'une autre des gélules d’oméga 3. Ce qu’on peut comparer, c’est la position de chacune '
      + 'dans chaque catégorie, en pourcentage de la médiane du marché. L’indice de ce tableau '
      + 'est la médiane de ces positions, c’est pourquoi il se lit de haut en bas.',
  },
  'tiendas.h2_tabla': {
    es: (n) => `Las ${n} tiendas, de la mas barata a la mas cara`,
    en: (n) => `The ${n} stores, from cheapest to dearest`,
    fr: (n) => `Les ${n} boutiques, de la moins chère à la plus chère`,
  },
  'tiendas.apunte_tabla': {
    es: 'Indice: distancia a la mediana del mercado', en: 'Index: distance from the market median',
    fr: 'Indice : écart à la médiane du marché',
  },
  'tiendas.caption': {
    es: (f) => `Tiendas de suplementos comparadas por indice de precio, con los precios del ${f}`,
    en: (f) => `Supplement stores compared by price index, with prices from ${f}`,
    fr: (f) => `Boutiques de compléments comparées par indice de prix, avec les prix du ${f}`,
  },
  'tiendas.col_indice': { es: 'Indice', en: 'Index', fr: 'Indice' },
  'tiendas.col_categorias': { es: 'Categorias', en: 'Categories', fr: 'Catégories' },
  'tiendas.col_productos': { es: 'Productos', en: 'Products', fr: 'Produits' },
  'tiendas.col_analisis': { es: 'Con analisis', en: 'With lab report', fr: 'Avec analyse' },
  'tiendas.solo_marca': {
    es: 'Vende solo su propia marca.', en: 'Sells only its own brand.',
    fr: 'Ne vend que sa propre marque.',
  },
  'tiendas.marcas': {
    es: (n) => `Reparte su catalogo entre ${n} marcas.`, en: (n) => `Spreads its catalogue across ${n} brands.`,
    fr: (n) => `Répartit son catalogue entre ${n} marques.`,
  },
  'tiendas.aditivos': {
    es: (n) => ` ${n} % de sus fichas declaran aditivos.`, en: (n) => ` ${n} % of its product pages declare additives.`,
    fr: (n) => ` ${n} % de ses fiches déclarent des additifs.`,
  },
  'tiendas.debajo': { es: 'por debajo del mercado', en: 'below the market', fr: 'sous le marché' },
  'tiendas.encima': { es: 'por encima del mercado', en: 'above the market', fr: 'au-dessus du marché' },
  'tiendas.clavada': { es: 'clavada al mercado', en: 'right on the market', fr: 'pile au niveau du marché' },
  'tiendas.baratas_caras': {
    es: (b, c) => `${b} baratas · ${c} caras`, en: (b, c) => `${b} cheaper · ${c} dearer`,
    fr: (b, c) => `${b} moins chères · ${c} plus chères`,
  },
  'tiendas.en_nivel4': { es: (n) => `${n} en nivel 4`, en: (n) => `${n} at level 4`, fr: (n) => `${n} au niveau 4` },
  'tiendas.nota_t': {
    es: 'El indice no es un descuento.', en: 'The index is not a discount.',
    fr: 'L’indice n’est pas une remise.',
  },
  'tiendas.nota': {
    es: ' Dice donde esta la mediana de esa tienda dentro de cada categoria, no lo que vas a '
      + 'pagar por un producto concreto: una tienda cara en conjunto puede tener el bote mas '
      + 'barato de una categoria, y pasa a menudo. Para comprar mandan las tablas de '
      + 'categoria; esta pagina es para elegir por donde empezar a mirar.',
    en: ' It says where that store’s median sits within each category, not what you will pay '
      + 'for a specific product: a store that is dear overall can have the cheapest tub in a '
      + 'category, and that happens often. For buying, the category tables rule; this page is '
      + 'for choosing where to start looking.',
    fr: ' Il indique où se situe la médiane de cette boutique dans chaque catégorie, pas ce que '
      + 'vous paierez pour un produit précis : une boutique chère dans l’ensemble peut avoir le '
      + 'pot le moins cher d’une catégorie, et cela arrive souvent. Pour acheter, ce sont les '
      + 'tableaux de catégorie qui comptent ; cette page sert à choisir où commencer à chercher.',
  },
  'tiendas.fuera': {
    es: (l) => ` Quedan fuera ${l}: tienen productos en muy pocas categorias y su mediana no se `
      + 'puede comparar con nada.',
    en: (l) => ` Left out: ${l}. They have products in too few categories and their median cannot `
      + 'be compared with anything.',
    fr: (l) => ` Restent en dehors : ${l}. Elles ont des produits dans trop peu de catégories et `
      + 'leur médiane ne peut être comparée à rien.',
  },
  'tiendas.h2_versus': {
    es: (n) => `Cara a cara: ${n} comparaciones`, en: (n) => `Head to head: ${n} comparisons`,
    fr: (n) => `Face à face : ${n} comparaisons`,
  },
  'tiendas.apunte_versus': {
    es: 'Dos tiendas, categoria a categoria', en: 'Two stores, category by category',
    fr: 'Deux boutiques, catégorie par catégorie',
  },
  'tiendas.o': { es: 'o', en: 'or', fr: 'ou' },
  'tiendas.n_categorias': {
    es: (n) => `${n} categorias`, en: (n) => `${n} categories`, fr: (n) => `${n} catégories`,
  },
  'tiendas.faq_titulo': {
    es: 'Preguntas sobre las tiendas', en: 'Questions about the stores', fr: 'Questions sur les boutiques',
  },
  'tiendas.faq1.p': {
    es: '¿Que tienda de suplementos es mas barata?', en: 'Which supplement store is cheapest?',
    fr: 'Quelle boutique de compléments est la moins chère ?',
  },
  'tiendas.faq1.r': {
    es: (b, ib, cats, c, ic) => `${b}: en una categoria tipica su mediana esta un ${ib} % por `
      + `debajo de la del mercado, midiendo ${cats} categorias en las que tiene al menos tres `
      + `productos. Al otro lado esta ${c}, un ${ic} % por encima. Barato no es lo mismo que `
      + 'bueno: la tabla ensena tambien cuantos productos publican analisis en cada tienda.',
    en: (b, ib, cats, c, ic) => `${b}: in a typical category its median sits ${ib} % below the `
      + `market’s, measured over ${cats} categories where it has at least three products. At `
      + `the other end is ${c}, ${ic} % above. Cheap is not the same as good: the table also `
      + 'shows how many products publish a lab report at each store.',
    fr: (b, ib, cats, c, ic) => `${b} : dans une catégorie typique, sa médiane est ${ib} % sous `
      + `celle du marché, mesurée sur ${cats} catégories où elle a au moins trois produits. À `
      + `l’autre bout, ${c}, ${ic} % au-dessus. Pas cher ne veut pas dire bon : le tableau montre `
      + 'aussi combien de produits publient une analyse dans chaque boutique.',
  },
  'tiendas.faq1.r_sin': {
    es: 'Depende de la categoria; la tabla lo dice categoria por categoria.',
    en: 'It depends on the category; the table says so category by category.',
    fr: 'Cela dépend de la catégorie ; le tableau le dit catégorie par catégorie.',
  },
  'tiendas.faq2.p': {
    es: '¿Como se calcula el indice de precio?', en: 'How is the price index calculated?',
    fr: 'Comment l’indice de prix est-il calculé ?',
  },
  'tiendas.faq2.r': {
    es: 'En cada categoria se compara la mediana de la tienda con la mediana de todo el '
      + 'mercado comparado aqui, en la unidad de esa categoria (euros por kilo o por capsula). '
      + 'Eso da un porcentaje sin unidad, y el indice es la mediana de esos porcentajes. Solo '
      + 'cuentan las categorias donde la tienda tiene tres productos o mas, para que una oferta '
      + 'suelta no mueva el indice de una tienda entera.',
    en: 'In each category the store’s median is compared with the median of the whole market '
      + 'compared here, in that category’s unit (euros per kilo or per capsule). That gives a '
      + 'unitless percentage, and the index is the median of those percentages. Only categories '
      + 'where the store has three or more products count, so that a single deal cannot move a '
      + 'whole store’s index.',
    fr: 'Dans chaque catégorie, la médiane de la boutique est comparée à la médiane de tout le '
      + 'marché comparé ici, dans l’unité de la catégorie (euros au kilo ou à la gélule). Cela '
      + 'donne un pourcentage sans unité, et l’indice est la médiane de ces pourcentages. Seules '
      + 'comptent les catégories où la boutique a trois produits ou plus, pour qu’une offre '
      + 'isolée ne déplace pas l’indice d’une boutique entière.',
  },
  'tiendas.faq3.p': {
    es: '¿Por que no se suman los precios de cada tienda?', en: 'Why not add up each store’s prices?',
    fr: 'Pourquoi ne pas additionner les prix de chaque boutique ?',
  },
  'tiendas.faq3.r': {
    es: 'Porque un catalogo no es una cesta: son kilos de polvo y capsulas, y sumarlos da un '
      + 'numero que no significa nada. Ademas, una tienda que solo vende creatina pareceria '
      + 'barata al lado de una que vende de todo. El indice compara cada categoria con la suya, '
      + 'que es la unica manera de que la comparacion sea justa entre catalogos distintos.',
    en: 'Because a catalogue is not a basket: it is kilos of powder and capsules, and adding '
      + 'them gives a number that means nothing. Besides, a store that only sells creatine '
      + 'would look cheap next to one that sells everything. The index compares each category '
      + 'with its own, which is the only way the comparison is fair across different catalogues.',
    fr: 'Parce qu’un catalogue n’est pas un panier : ce sont des kilos de poudre et des gélules, '
      + 'et les additionner donne un nombre qui ne veut rien dire. De plus, une boutique qui ne '
      + 'vend que de la créatine paraîtrait bon marché à côté d’une qui vend de tout. L’indice '
      + 'compare chaque catégorie à la sienne, seule façon d’être juste entre catalogues différents.',
  },

  // --------------------------------------------------- /suplementos-que-funcionan/
  'funciona.titulo': {
    es: (n) => `Que suplementos funcionan de verdad: los ${n} con evidencia alta`,
    en: (n) => `Which supplements actually work: the ${n} with strong evidence`,
    fr: (n) => `Quels compléments fonctionnent vraiment : les ${n} aux preuves solides`,
  },
  'funciona.descripcion': {
    es: (t, a, m, b) => `Los ${t} suplementos mas vendidos por nivel de evidencia: ${a} alta, `
      + `${m} media y ${b} baja. Cada uno con su efecto medido, su fuente y lo que cuesta al mes `
      + 'a la dosis de los estudios.',
    en: (t, a, m, b) => `The ${t} best-selling supplements by evidence level: ${a} strong, ${m} `
      + `moderate and ${b} weak. Each with its measured effect, its source and what it costs `
      + 'per month at the dose used in the studies.',
    fr: (t, a, m, b) => `Les ${t} compléments les plus vendus par niveau de preuve : ${a} solides, `
      + `${m} moyennes et ${b} faibles. Chacun avec son effet mesuré, sa source et son coût `
      + 'mensuel à la dose des études.',
  },
  'funciona.miga': { es: 'Que funciona', en: 'What works', fr: 'Ce qui marche' },
  'funciona.antetitulo_ev': { es: 'Evidencia revisada el', en: 'Evidence reviewed on', fr: 'Preuves relues le' },
  'funciona.antetitulo_pr': { es: 'precios del', en: 'prices from', fr: 'prix du' },
  'funciona.h1': {
    es: 'Que suplementos funcionan de verdad', en: 'Which supplements actually work',
    fr: 'Quels compléments fonctionnent vraiment',
  },
  'funciona.respuesta': {
    es: (t, a, m, b) => `De los ${t} suplementos que compara esta web, ${a} tienen evidencia `
      + `alta, ${m} evidencia media y ${b} evidencia baja. Los que mas evidencia tienen son `
      + 'ademas los mas baratos',
    en: (t, a, m, b) => `Of the ${t} supplements this site compares, ${a} have strong evidence, `
      + `${m} moderate evidence and ${b} weak evidence. The ones with the most evidence are `
      + 'also the cheapest',
    fr: (t, a, m, b) => `Sur les ${t} compléments comparés par ce site, ${a} ont des preuves `
      + `solides, ${m} des preuves moyennes et ${b} des preuves faibles. Ceux qui ont le plus de `
      + 'preuves sont aussi les moins chers',
  },
  'funciona.respuesta_barato': {
    es: (x, p) => `: ${x} sale por ${p} al mes a la dosis de los estudios`,
    en: (x, p) => `: ${x} comes to ${p} a month at the dose used in the studies`,
    fr: (x, p) => ` : ${x} revient à ${p} par mois à la dose des études`,
  },
  'funciona.respuesta_cola': {
    es: '. Lo caro casi siempre esta en la mitad de abajo de esta pagina.',
    en: '. The expensive stuff is almost always in the bottom half of this page.',
    fr: '. Le cher se trouve presque toujours dans la moitié basse de cette page.',
  },
  'funciona.entradilla': {
    es: 'No hay un top 10 numerado, y es a proposito: la creatina y la cafeina hacen cosas '
      + 'distintas y no existe una escala que las ordene entre si. Lo que si se puede ordenar '
      + 'es cuanta evidencia tiene cada una y cuanto cuesta la dosis que usaron los estudios. '
      + 'El efecto es siempre del ingrediente, nunca de una marca.',
    en: 'There is no numbered top 10, on purpose: creatine and caffeine do different things and '
      + 'there is no scale that ranks them against each other. What can be ranked is how much '
      + 'evidence each has and what the dose used in the studies costs. The effect always '
      + 'belongs to the ingredient, never to a brand.',
    fr: 'Il n’y a pas de top 10 numéroté, et c’est voulu : la créatine et la caféine font des '
      + 'choses différentes et aucune échelle ne les classe l’une par rapport à l’autre. Ce qu’on '
      + 'peut classer, c’est la quantité de preuves de chacune et le coût de la dose utilisée '
      + 'dans les études. L’effet est toujours celui de l’ingrédient, jamais d’une marque.',
  },
  'funciona.h2_nivel': {
    es: (e, n) => `${e}: ${n} suplementos`, en: (e, n) => `${e}: ${n} supplements`,
    fr: (e, n) => `${e} : ${n} compléments`,
  },
  'funciona.apunte_nivel': {
    es: 'Del mas barato al mas caro por mes', en: 'From cheapest to dearest per month',
    fr: 'Du moins cher au plus cher par mois',
  },
  'funciona.caption': {
    es: (e) => `Suplementos con ${e}, su efecto medido y su coste al mes`,
    en: (e) => `Supplements with ${e}, their measured effect and their monthly cost`,
    fr: (e) => `Compléments avec ${e}, leur effet mesuré et leur coût mensuel`,
  },
  'funciona.col_suplemento': { es: 'Suplemento', en: 'Supplement', fr: 'Complément' },
  'funciona.col_medido': { es: 'Lo que se ha medido', en: 'What has been measured', fr: 'Ce qui a été mesuré' },
  'funciona.col_mes': { es: 'Al mes', en: 'Per month', fr: 'Par mois' },
  'funciona.con_de': {
    es: (p, t) => `con ${p} de ${t}`, en: (p, t) => `with ${p} from ${t}`, fr: (p, t) => `avec ${p} chez ${t}`,
  },
  'funciona.sin_dosis': { es: 'sin dosis publicada', en: 'no published dose', fr: 'pas de dose publiée' },
  'funciona.nota_t': {
    es: 'El coste al mes supone una dosis efectiva al dia.',
    en: 'The monthly cost assumes one effective dose a day.',
    fr: 'Le coût mensuel suppose une dose efficace par jour.',
  },
  'funciona.nota': {
    es: ' Sale de multiplicar por 30 el precio de una dosis del producto mas barato que llega a '
      + 'la dosis con evidencia, y no de un plan de suplementacion: quien tome dos veces al dia '
      + 'paga el doble, y hay categorias (carbohidratos, cafeina) que no se toman a diario. '
      + 'Donde pone "sin dosis publicada" es que ninguna ficha de esa categoria declara cuanto '
      + 'activo lleva un servicio, asi que la cuenta no se puede hacer sin inventarla.',
    en: ' It comes from multiplying by 30 the price of one dose of the cheapest product that '
      + 'reaches the evidence-backed dose, not from a supplementation plan: someone taking it '
      + 'twice a day pays double, and some categories (carbohydrates, caffeine) are not taken '
      + 'daily. Where it says "no published dose", no product page in that category declares '
      + 'how much active ingredient a serving carries, so the sum cannot be done without '
      + 'making it up.',
    fr: ' Il vient de la multiplication par 30 du prix d’une dose du produit le moins cher qui '
      + 'atteint la dose étayée par les preuves, pas d’un plan de supplémentation : qui en prend '
      + 'deux fois par jour paie le double, et certaines catégories (glucides, caféine) ne se '
      + 'prennent pas tous les jours. Là où il est écrit « pas de dose publiée », aucune fiche '
      + 'de la catégorie ne déclare la quantité d’actif par portion, donc le calcul ne peut pas '
      + 'se faire sans l’inventer.',
  },
  'funciona.h2_objetivo': {
    es: 'Y para lo tuyo, ¿cual?', en: 'And for your goal, which one?', fr: 'Et pour votre objectif, lequel ?',
  },
  'funciona.apunte_objetivo': {
    es: 'La misma lista, ordenada por objetivo', en: 'The same list, sorted by goal',
    fr: 'La même liste, triée par objectif',
  },
  'funciona.n_suplementos': {
    es: (n) => `${n} suplementos`, en: (n) => `${n} supplements`, fr: (n) => `${n} compléments`,
  },
  'funciona.donde_barato': {
    es: 'Donde sale mas barato', en: 'Where it works out cheapest', fr: 'Où c’est le moins cher',
  },
  'funciona.tiendas': { es: 'tiendas', en: 'stores', fr: 'boutiques' },
  'funciona.faq_titulo': {
    es: 'Preguntas sobre que suplementos funcionan', en: 'Questions about which supplements work',
    fr: 'Questions sur les compléments qui fonctionnent',
  },
  'funciona.faq1.p': {
    es: '¿Que suplementos funcionan de verdad?', en: 'Which supplements actually work?',
    fr: 'Quels compléments fonctionnent vraiment ?',
  },
  'funciona.faq1.r': {
    es: (a, lista, m, b) => `Los ${a} que en esta lista salen con evidencia alta: ${lista}. `
      + '"Funciona" no quiere decir que hagan mucho: quiere decir que el efecto se ha medido '
      + `varias veces y se repite. Otros ${m} tienen evidencia media y ${b} tienen evidencia `
      + 'baja, que es la manera educada de decir que se venden mejor de lo que rinden.',
    en: (a, lista, m, b) => `The ${a} that appear in this list with strong evidence: ${lista}. `
      + '"Works" does not mean they do a lot: it means the effect has been measured several '
      + `times and holds up. Another ${m} have moderate evidence and ${b} have weak evidence, `
      + 'which is the polite way of saying they sell better than they perform.',
    fr: (a, lista, m, b) => `Les ${a} qui figurent dans cette liste avec des preuves solides : `
      + `${lista}. « Fonctionne » ne veut pas dire qu’ils font beaucoup : cela veut dire que `
      + `l’effet a été mesuré plusieurs fois et se répète. ${m} autres ont des preuves moyennes `
      + `et ${b} des preuves faibles, ce qui est la façon polie de dire qu’ils se vendent mieux `
      + 'qu’ils ne rendent.',
  },
  'funciona.faq2.p': {
    es: '¿Cuanto cuesta al mes tomar los que funcionan?',
    en: 'How much does it cost per month to take the ones that work?',
    fr: 'Combien coûte par mois la prise de ceux qui fonctionnent ?',
  },
  'funciona.faq2.r': {
    es: (x, p) => 'Menos de lo que parece, porque los que mas evidencia tienen son los mas '
      + `baratos. ${x} sale por ${p} al mes a la dosis de los estudios, con el producto mas `
      + 'barato que llega a esa dosis. La cuenta es siempre la misma: precio de una dosis '
      + 'efectiva por 30 dias, a una toma diaria.',
    en: (x, p) => 'Less than it seems, because the ones with the most evidence are the cheapest. '
      + `${x} comes to ${p} a month at the dose used in the studies, with the cheapest product `
      + 'that reaches that dose. The sum is always the same: price of one effective dose times '
      + '30 days, at one serving a day.',
    fr: (x, p) => 'Moins qu’on ne le croit, car ceux qui ont le plus de preuves sont les moins '
      + `chers. ${x} revient à ${p} par mois à la dose des études, avec le produit le moins cher `
      + 'qui atteint cette dose. Le calcul est toujours le même : prix d’une dose efficace fois '
      + '30 jours, à une prise par jour.',
  },
  'funciona.faq2.r_sin': {
    es: 'Depende de la dosis de cada uno; la columna del mes lo dice categoria por categoria.',
    en: 'It depends on each person’s dose; the monthly column says so category by category.',
    fr: 'Cela dépend de la dose de chacun ; la colonne mensuelle le dit catégorie par catégorie.',
  },
  'funciona.faq3.p': {
    es: '¿De donde sale el nivel de evidencia?', en: 'Where does the evidence level come from?',
    fr: 'D’où vient le niveau de preuve ?',
  },
  'funciona.faq3.r': {
    es: (rev, pr) => 'De las fuentes citadas en cada guia: posicionamientos de la ISSN, '
      + 'revisiones y metaanalisis, con su DOI. No lo decide esta web producto a producto, '
      + 'porque el efecto es del ingrediente y no de la marca. El texto de evidencia se reviso '
      + `por ultima vez el ${rev}; los precios son del ${pr}.`,
    en: (rev, pr) => 'From the sources cited in each guide: ISSN position stands, reviews and '
      + 'meta-analyses, with their DOI. This site does not decide it product by product, '
      + 'because the effect belongs to the ingredient and not to the brand. The evidence text '
      + `was last reviewed on ${rev}; prices are from ${pr}.`,
    fr: (rev, pr) => 'Des sources citées dans chaque guide : prises de position de l’ISSN, revues '
      + 'et méta-analyses, avec leur DOI. Ce site ne le décide pas produit par produit, car '
      + 'l’effet est celui de l’ingrédient et non de la marque. Le texte sur les preuves a été '
      + `relu pour la dernière fois le ${rev} ; les prix datent du ${pr}.`,
  },
  'funciona.faq4.p': {
    es: '¿Y los que tienen evidencia baja no sirven para nada?',
    en: 'And are the ones with weak evidence useless?',
    fr: 'Et ceux aux preuves faibles ne servent-ils à rien ?',
  },
  'funciona.faq4.r': {
    es: (b, lista) => 'Sirven para menos de lo que dice su etiqueta, que no es lo mismo. Los '
      + `${b} de la ultima seccion no tienen un efecto que se sostenga en personas que ya comen `
      + `suficiente: ${lista}. Cada uno tiene su guia con las fuentes y con el caso concreto en `
      + 'el que si tienen sentido.',
    en: (b, lista) => 'They do less than their label says, which is not the same thing. The '
      + `${b} in the last section have no effect that holds up in people who already eat `
      + `enough: ${lista}. Each has its own guide with the sources and the specific case in `
      + 'which they do make sense.',
    fr: (b, lista) => 'Ils servent à moins que ce que dit leur étiquette, ce qui n’est pas pareil. '
      + `Les ${b} de la dernière section n’ont pas d’effet qui tienne chez des personnes qui `
      + `mangent déjà suffisamment : ${lista}. Chacun a son guide avec les sources et le cas `
      + 'précis où ils ont du sens.',
  },

  // ------------------------------------------------ /mejores/ y /comparativa/ (paginas)
  'land.seleccion': { es: 'seleccion', en: 'selection', fr: 'sélection' },
  'land.antetitulo_sel': {
    es: (x) => `Seleccion dentro de ${x}`, en: (x) => `Selection within ${x}`,
    fr: (x) => `Sélection dans ${x}`,
  },
  'land.tres': { es: 'Los tres que destacan', en: 'The three that stand out', fr: 'Les trois qui se distinguent' },
  'land.completa': { es: 'La seleccion completa', en: 'The full selection', fr: 'La sélection complète' },
  'land.filtro_t': {
    es: 'Esto es un filtro, no otro ranking.', en: 'This is a filter, not another ranking.',
    fr: 'Ceci est un filtre, pas un autre classement.',
  },
  'land.filtro_a': {
    es: ' El score que ordena esta tabla es exactamente el mismo de ',
    en: ' The score that sorts this table is exactly the same as in ',
    fr: ' Le score qui trie ce tableau est exactement le même que dans ',
  },
  'land.filtro_enlace': {
    es: (x) => `la comparativa completa de ${x}`, en: (x) => `the full ${x} comparison`,
    fr: (x) => `le comparatif complet : ${x}`,
  },
  'land.filtro_b': {
    es: ': aqui solo se han quitado los productos que no cumplen el criterio de arriba. ',
    en: ': the only thing removed here is the products that do not meet the criterion above. ',
    fr: ' : on a seulement retiré ici les produits qui ne remplissent pas le critère ci-dessus. ',
  },
  'land.faq_sel': {
    es: (x) => `Preguntas sobre esta seleccion de ${x}`, en: (x) => `Questions about this ${x} selection`,
    fr: (x) => `Questions sur cette sélection : ${x}`,
  },
  'land.otras_formas': {
    es: (x) => `Otras formas de mirar ${x}`, en: (x) => `Other ways to look at ${x}`,
    fr: (x) => `D’autres façons de regarder : ${x}`,
  },
  'land.mismo_dataset': {
    es: 'Mismo dataset, otra pregunta', en: 'Same dataset, another question',
    fr: 'Même jeu de données, autre question',
  },
  'land.cara_a_cara': { es: 'Cara a cara', en: 'Head to head', fr: 'Face à face' },
  'land.vs_entradilla': {
    es: (u) => `Las dos tiendas medidas con el mismo criterio: precio por ${u} y nivel de `
      + 'verificacion de la certificacion. No hay ganador absoluto porque no lo hay: gana una por '
      + 'precio y puede ganar otra por sello, y aqui se ven las dos cosas por separado.',
    en: (u) => `Both stores measured on the same criterion: price per ${u} and certification `
      + 'verification level. There is no overall winner because there isn’t one: one can win on '
      + 'price and the other on certification, and here you see both separately.',
    fr: (u) => `Les deux boutiques mesurées selon le même critère : prix ${auFr(u)} et niveau de `
      + 'vérification de la certification. Il n’y a pas de gagnant absolu parce qu’il n’y en a '
      + 'pas : l’une peut gagner sur le prix et l’autre sur le label, et ici on voit les deux '
      + 'séparément.',
  },
  'land.vistazo': {
    es: 'Las dos tiendas de un vistazo', en: 'Both stores at a glance', fr: 'Les deux boutiques en un coup d’œil',
  },
  'land.n_productos_de': {
    es: (n, x) => `${n} productos de ${x}`, en: (n, x) => `${n} ${x} products`,
    fr: (n, x) => `${n} produits ${deFr(x)}`,
  },
  'land.mediana': { es: 'mediana', en: 'median', fr: 'médiane' },
  'land.de_a': {
    es: (a, b, n4, n3) => `De ${a} a ${b}. ${n4} en nivel 4 de verificacion y ${n3} en nivel 3.`,
    en: (a, b, n4, n3) => `From ${a} to ${b}. ${n4} at verification level 4 and ${n3} at level 3.`,
    fr: (a, b, n4, n3) => `De ${a} à ${b}. ${n4} au niveau 4 de vérification et ${n3} au niveau 3.`,
  },
  'land.su_mejor': { es: 'Su mejor nota:', en: 'Its best score:', fr: 'Sa meilleure note :' },
  'land.a_precio': { es: 'a', en: 'at', fr: 'à' },
  'land.frente': {
    es: (a, b) => `${a} frente a ${b}, dato a dato`, en: (a, b) => `${a} against ${b}, figure by figure`,
    fr: (a, b) => `${a} face à ${b}, donnée par donnée`,
  },
  'land.mismos_numeros': {
    es: 'Los mismos numeros para las dos', en: 'The same numbers for both', fr: 'Les mêmes chiffres pour les deux',
  },
  'land.caption_vs': {
    es: (a, b, x, f) => `${a} y ${b} en ${x}, con los precios del ${f}`,
    en: (a, b, x, f) => `${a} and ${b} for ${x}, with prices from ${f}`,
    fr: (a, b, x, f) => `${a} et ${b} en ${x}, avec les prix du ${f}`,
  },
  'land.dato': { es: 'Dato', en: 'Figure', fr: 'Donnée' },
  'land.f_productos': { es: 'Productos comparados', en: 'Products compared', fr: 'Produits comparés' },
  'land.f_mediana': { es: (u) => `Mediana por ${u}`, en: (u) => `Median per ${u}`, fr: (u) => `Médiane ${auFr(u)}` },
  'land.f_barato': { es: (u) => `Mas barato por ${u}`, en: (u) => `Cheapest per ${u}`, fr: (u) => `Moins cher ${auFr(u)}` },
  'land.f_caro': { es: (u) => `Mas caro por ${u}`, en: (u) => `Dearest per ${u}`, fr: (u) => `Plus cher ${auFr(u)}` },
  'land.f_score': { es: 'Mejor score', en: 'Best score', fr: 'Meilleur score' },
  'land.f_n4': {
    es: 'Nivel 4 (sello con un tercero detras)', en: 'Level 4 (certification backed by a third party)',
    fr: 'Niveau 4 (label garanti par un tiers)',
  },
  'land.f_n3': {
    es: 'Nivel 3 (analisis de la propia marca)', en: 'Level 3 (the brand’s own lab report)',
    fr: 'Niveau 3 (analyse de la marque elle-même)',
  },
  'land.de': { es: (a, b) => `${a} de ${b}`, en: (a, b) => `${a} of ${b}`, fr: (a, b) => `${a} sur ${b}` },
  'land.mediana_nota_t': {
    es: 'La mediana no es el precio que vas a pagar.', en: 'The median is not the price you will pay.',
    fr: 'La médiane n’est pas le prix que vous paierez.',
  },
  'land.mediana_nota': {
    es: ' Es el punto medio del catalogo de esa tienda en esta categoria, y sirve para saber si '
      + 'una tienda es cara o barata en conjunto. Para comprar manda la fila concreta de la tabla '
      + 'de abajo.',
    en: ' It is the midpoint of that store’s catalogue in this category, and it tells you whether '
      + 'a store is dear or cheap overall. For buying, the specific row in the table below is what '
      + 'counts.',
    fr: ' C’est le point médian du catalogue de cette boutique dans cette catégorie, et il sert à '
      + 'savoir si une boutique est chère ou bon marché dans l’ensemble. Pour acheter, c’est la '
      + 'ligne précise du tableau ci-dessous qui compte.',
  },
  'land.todos_productos': {
    es: (n) => `Los ${n} productos de las dos tiendas`, en: (n) => `All ${n} products from both stores`,
    fr: (n) => `Les ${n} produits des deux boutiques`,
  },
  'land.filtra': {
    es: 'Filtra por tienda para ver solo una', en: 'Filter by store to see only one',
    fr: 'Filtrez par boutique pour n’en voir qu’une',
  },
  'land.faq_vs': {
    es: (a, b, x) => `Preguntas sobre ${a} y ${b} en ${x}`, en: (a, b, x) => `Questions about ${a} and ${b} for ${x}`,
    fr: (a, b, x) => `Questions sur ${a} et ${b} en ${x}`,
  },
  'land.seguir': {
    es: (x) => `Seguir comparando ${x}`, en: (x) => `Keep comparing ${x}`,
    fr: (x) => `Continuer à comparer : ${x}`,
  },

  // ------------------------------------------------------------------ /marca/<slug>/
  'marca.titulo': {
    es: (m, a, n) => `${m} ${a}: precios de ${n} productos`,
    en: (m, a, n) => `${m} ${a}: prices of ${n} products`,
    fr: (m, a, n) => `${m} ${a} : prix de ${n} produits`,
  },
  'marca.titulo_sufijos': {
    es: [', opinión y comparativa', ' comparados', ''],
    en: [', review and comparison', ' compared', ''],
    fr: [', avis et comparatif', ' comparés', ''],
  },
  'marca.desc_a': {
    es: (m, t) => `${m} en ${t}: `, en: (m, t) => `${m} at ${t}: `, fr: (m, t) => `${m} dans ${t} : `,
  },
  'marca.desc_cat': {
    es: (c, p) => `${c} desde ${p}`, en: (c, p) => `${c} from ${p}`, fr: (c, p) => `${c} dès ${p}`,
  },
  'marca.desc_b': {
    es: (n, f) => `. Precio por kilo, nota y certificación de sus ${n} productos, del ${f}.`,
    en: (n, f) => `. Price per kilo, score and certification of its ${n} products, as of ${f}.`,
    fr: (n, f) => `. Prix au kilo, note et certification de ses ${n} produits, au ${f}.`,
  },
  'marca.resp_1': {
    es: (n, m, c, t) => `Esta web compara ${n} productos de ${m} en ${c} ${c === 1 ? 'categoria' : 'categorias'}, vendidos en ${t}.`,
    en: (n, m, c, t) => `This site compares ${n} ${m} products across ${c} ${c === 1 ? 'category' : 'categories'}, sold at ${t}.`,
    fr: (n, m, c, t) => `Ce site compare ${n} produits ${m} dans ${c} ${c === 1 ? 'catégorie' : 'catégories'}, vendus chez ${t}.`,
  },
  'marca.resp_lider': {
    es: (nom, s, p, t) => `El que mejor puntua es ${nom}, con ${s} sobre 100 a ${p} en ${t}.`,
    en: (nom, s, p, t) => `The highest scoring is ${nom}, with ${s} out of 100 at ${p} from ${t}.`,
    fr: (nom, s, p, t) => `Le mieux noté est ${nom}, avec ${s} sur 100 à ${p} chez ${t}.`,
  },
  'marca.resp_cat': {
    es: (c, u, nom, p) => `En ${c}, el mas barato por ${u} es ${nom}, a ${p}.`,
    en: (c, u, nom, p) => `In ${c}, the cheapest per ${u} is ${nom}, at ${p}.`,
    fr: (c, u, nom, p) => `En ${c}, le moins cher ${auFr(u)} est ${nom}, à ${p}.`,
  },
  'marca.resp_fecha': {
    es: (f) => `Precios recogidos el ${f}.`, en: (f) => `Prices collected on ${f}.`,
    fr: (f) => `Prix relevés le ${f}.`,
  },
  'marca.faq1_p': {
    es: (m) => `¿Cual es el producto de ${m} mas barato?`, en: (m) => `Which is the cheapest ${m} product?`,
    fr: (m) => `Quel est le produit ${m} le moins cher ?`,
  },
  'marca.faq1_cat': {
    es: (c, nom, t, p, f, pu) => `En ${c}, ${nom} de ${t}: ${p} el envase de ${f}, o ${pu}.`,
    en: (c, nom, t, p, f, pu) => `In ${c}, ${nom} from ${t}: ${p} for a ${f} pack, or ${pu}.`,
    fr: (c, nom, t, p, f, pu) => `En ${c}, ${nom} chez ${t} : ${p} l’emballage de ${f}, soit ${pu}.`,
  },
  'marca.faq1_cola': {
    es: ' Se compara por precio por unidad de venta, no por envase: un bote grande puede costar mas y salir mas barato.',
    en: ' The comparison is by price per unit of sale, not per pack: a big tub can cost more and still work out cheaper.',
    fr: ' On compare au prix par unité de vente, pas par emballage : un grand pot peut coûter plus et revenir moins cher.',
  },
  'marca.faq2_p': {
    es: (m) => `¿Que opinion merece ${m}?`, en: (m) => `What do we make of ${m}?`,
    fr: (m) => `Que penser de ${m} ?`,
  },
  'marca.faq2_r': {
    es: (m, nom, s) => 'No hay opiniones pagadas ni estrellas: cada producto lleva una nota de 0 a 100, mitad '
      + `precio frente al mas barato de su categoria y mitad calidad verificable. El mejor de ${m} es ${nom} `
      + `con ${s} puntos, y cada ficha explica su nota linea a linea.`,
    en: (m, nom, s) => 'There are no paid reviews and no stars: every product carries a score out of 100, half '
      + `price against the cheapest in its category and half verifiable quality. The best from ${m} is ${nom} `
      + `with ${s} points, and each product page explains its score line by line.`,
    fr: (m, nom, s) => 'Pas d’avis payés ni d’étoiles : chaque produit porte une note sur 100, moitié prix face au '
      + `moins cher de sa catégorie et moitié qualité vérifiable. Le meilleur de ${m} est ${nom} avec ${s} `
      + 'points, et chaque fiche explique sa note ligne par ligne.',
  },
  'marca.faq3_p': {
    es: (m) => `¿Donde comprar ${m} mas barato?`, en: (m) => `Where to buy ${m} cheapest?`,
    fr: (m) => `Où acheter ${m} au meilleur prix ?`,
  },
  'marca.faq3_una': {
    es: (t, m) => `Entre las tiendas comparadas aqui, solo ${t} vende ${m}.`,
    en: (t, m) => `Among the stores compared here, only ${t} sells ${m}.`,
    fr: (t, m) => `Parmi les boutiques comparées ici, seule ${t} vend ${m}.`,
  },
  'marca.faq3_varias': {
    es: (l) => `Se vende en ${l}. La tabla de cada categoria ordena los productos por precio por unidad con `
      + 'la tienda al lado, asi que la primera fila es la compra mas barata de ese tipo.',
    en: (l) => `It is sold at ${l}. Each category table sorts products by unit price with the store alongside, `
      + 'so the first row is the cheapest buy of that kind.',
    fr: (l) => `Il est vendu chez ${l}. Le tableau de chaque catégorie trie les produits par prix unitaire avec `
      + 'la boutique à côté, la première ligne est donc l’achat le moins cher de ce type.',
  },
  'marca.lista_ld': {
    es: (m) => `Productos de ${m}`, en: (m) => `${m} products`, fr: (m) => `Produits ${m}`,
  },
  'marca.antetitulo': { es: 'Marca', en: 'Brand', fr: 'Marque' },
  'marca.h1': {
    es: (m, n) => `${m}: precios y comparativa de sus ${n} productos`,
    en: (m, n) => `${m}: prices and comparison of its ${n} products`,
    fr: (m, n) => `${m} : prix et comparatif de ses ${n} produits`,
  },
  'marca.h2_cat': {
    es: (c, m) => `${c} de ${m}`, en: (c, m) => `${m} ${c.toLowerCase()}`, fr: (c, m) => `${c} ${m}`,
  },
  'marca.apunte_cat': {
    es: (n, u) => `${n} ${n === 1 ? 'producto' : 'productos'}, del mas barato por ${u} al mas caro`,
    en: (n, u) => `${n} ${n === 1 ? 'product' : 'products'}, from cheapest per ${u} to dearest`,
    fr: (n, u) => `${n} ${n === 1 ? 'produit' : 'produits'}, du moins cher ${auFr(u)} au plus cher`,
  },
  'marca.caption_cat': {
    es: (c, m, u) => `${c} de ${m} por precio por ${u}`, en: (c, m, u) => `${m} ${c.toLowerCase()} by price per ${u}`,
    fr: (c, m, u) => `${c} ${m} par prix ${auFr(u)}`,
  },
  'marca.col_formato': { es: 'Formato', en: 'Pack', fr: 'Format' },
  'marca.col_precio': { es: 'Precio', en: 'Price', fr: 'Prix' },
  'marca.col_nivel': { es: 'Nivel', en: 'Level', fr: 'Niveau' },
  'marca.comparar_con': {
    es: (n, x) => `Comparar con ${n} productos de ${x} de todas las marcas`,
    en: (n, x) => `Compare with ${n} ${x} products from every brand`,
    fr: (n, x) => `Comparer avec ${n} produits ${deFr(x)} de toutes les marques`,
  },
  'marca.faq_titulo': {
    es: (m) => `Preguntas sobre ${m}`, en: (m) => `Questions about ${m}`, fr: (m) => `Questions sur ${m}`,
  },
  'marca.todas': { es: 'Todas las marcas', en: 'All brands', fr: 'Toutes les marques' },

  // ------------------------------------------------------------- /tiendas/<a>-vs-<b>/
  'tvs.h1': {
    es: (a, b, n) => `${a} o ${b}: cual es mas barata en ${n} categorias`,
    en: (a, b, n) => `${a} or ${b}: which is cheaper across ${n} categories`,
    fr: (a, b, n) => `${a} ou ${b} : laquelle est la moins chère sur ${n} catégories`,
  },
  'tvs.titulo': {
    es: (a, b) => `${a} vs ${b}: que tienda de suplementos sale mas barata`,
    en: (a, b) => `${a} vs ${b}: which supplement store is cheaper`,
    fr: (a, b) => `${a} vs ${b} : quelle boutique est la moins chère`,
  },
  'tvs.descripcion': {
    es: (a, b, n, f) => `${a} o ${b}: comparadas en las ${n} categorias que venden las dos, con su mediana, `
      + `su indice de precio y cuantos productos publican analisis. Datos del ${f}.`,
    en: (a, b, n, f) => `${a} or ${b}: both stores compared across the ${n} categories they both sell, with each `
      + `one’s median, its price index and how many products publish a lab report. Data from ${f}.`,
    fr: (a, b, n, f) => `${a} ou ${b} : comparées sur les ${n} catégories communes, avec la médiane et l’indice `
      + `de prix de chacune et le nombre de produits avec analyse. Données du ${f}.`,
  },
  'tvs.debajo': { es: 'por debajo', en: 'below', fr: 'en dessous' },
  'tvs.encima': { es: 'por encima', en: 'above', fr: 'au-dessus' },
  'tvs.resp': {
    es: (n, a, ga, b, gb, emp, mb, im, dm, ot, io, dot) => `De las ${n} categorias que venden las dos, ${a} `
      + `tiene la mediana mas baja en ${ga} y ${b} en ${gb}${emp > 0 ? ` (${emp} empatan)` : ''}. En el conjunto `
      + `del catalogo, ${mb} esta un ${im} % ${dm} de la mediana del mercado y ${ot} un ${io} % ${dot}.`,
    en: (n, a, ga, b, gb, emp, mb, im, dm, ot, io, dot) => `Of the ${n} categories both sell, ${a} has the lower `
      + `median in ${ga} and ${b} in ${gb}${emp > 0 ? ` (${emp} tied)` : ''}. Across the whole catalogue, ${mb} `
      + `sits ${im} % ${dm} the market median and ${ot} ${io} % ${dot}.`,
    fr: (n, a, ga, b, gb, emp, mb, im, dm, ot, io, dot) => `Sur les ${n} catégories que vendent les deux, ${a} a `
      + `la médiane la plus basse dans ${ga} et ${b} dans ${gb}${emp > 0 ? ` (${emp} à égalité)` : ''}. Sur `
      + `l’ensemble du catalogue, ${mb} se situe ${im} % ${dm} de la médiane du marché et ${ot} ${io} % ${dot}.`,
  },
  'tvs.faq1_cola': {
    es: (a, va, b, vb) => ` El precio no lo decide todo: ${a} publica analisis en ${va} productos y ${b} en ${vb}.`,
    en: (a, va, b, vb) => ` Price is not everything: ${a} publishes lab reports on ${va} products and ${b} on ${vb}.`,
    fr: (a, va, b, vb) => ` Le prix ne décide pas tout : ${a} publie des analyses sur ${va} produits et ${b} sur ${vb}.`,
  },
  'tvs.faq1_p': { es: (a, b) => `¿${a} o ${b}?`, en: (a, b) => `${a} or ${b}?`, fr: (a, b) => `${a} ou ${b} ?` },
  'tvs.faq2_p': {
    es: '¿En que categorias gana cada una?', en: 'In which categories does each one win?',
    fr: 'Dans quelles catégories chacune gagne-t-elle ?',
  },
  'tvs.faq2_r': {
    es: (a, la, b, lb, f) => `${a} sale mas barata en ${la}. ${b} sale mas barata en ${lb}. Son medianas de `
      + `cada catalogo en la unidad de cada categoria, con los precios del ${f}.`,
    en: (a, la, b, lb, f) => `${a} is cheaper in ${la}. ${b} is cheaper in ${lb}. These are medians of each `
      + `catalogue in each category’s unit, with prices from ${f}.`,
    fr: (a, la, b, lb, f) => `${a} est moins chère en ${la}. ${b} est moins chère en ${lb}. Ce sont des médianes `
      + `de chaque catalogue dans l’unité de chaque catégorie, avec les prix du ${f}.`,
  },
  'tvs.ninguna': { es: 'ninguna', en: 'none', fr: 'aucune' },
  'tvs.faq3_p': {
    es: '¿Que catalogo es mas grande?', en: 'Which catalogue is bigger?', fr: 'Quel catalogue est le plus grand ?',
  },
  'tvs.faq3_r': {
    es: (a, pa, ca, b, pb, cb, ma, mb) => `${a} tiene ${pa} productos comparados aqui en ${ca} categorias y ${b}, `
      + `${pb} en ${cb}. ${ma === 1 ? `${a} vende solo su marca` : `${a} reparte su catalogo entre ${ma} marcas`} y `
      + `${mb === 1 ? `${b} solo la suya` : `${b} entre ${mb}`}: quien vende marca propia se salta el margen del `
      + 'fabricante, quien revende lo paga y a cambio tiene marcas que la otra no.',
    en: (a, pa, ca, b, pb, cb, ma, mb) => `${a} has ${pa} products compared here across ${ca} categories and ${b} `
      + `${pb} across ${cb}. ${ma === 1 ? `${a} sells only its own brand` : `${a} spreads its catalogue across ${ma} brands`} `
      + `and ${mb === 1 ? `${b} only its own` : `${b} across ${mb}`}: a store selling its own brand skips the `
      + 'manufacturer’s margin, a reseller pays it and in exchange carries brands the other does not.',
    fr: (a, pa, ca, b, pb, cb, ma, mb) => `${a} a ${pa} produits comparés ici dans ${ca} catégories et ${b} ${pb} `
      + `dans ${cb}. ${ma === 1 ? `${a} ne vend que sa marque` : `${a} répartit son catalogue entre ${ma} marques`} et `
      + `${mb === 1 ? `${b} seulement la sienne` : `${b} entre ${mb}`} : qui vend sa propre marque évite la marge du `
      + 'fabricant, qui revend la paie et propose en échange des marques que l’autre n’a pas.',
  },
  'tvs.f_indice': { es: 'Indice de precio', en: 'Price index', fr: 'Indice de prix' },
  'tvs.f_indice_x': {
    es: 'Distancia mediana a la mediana del mercado en las categorias donde tiene tres productos o mas. Negativo es barato.',
    en: 'Median distance from the market median in the categories where it has three products or more. Negative is cheap.',
    fr: 'Écart médian à la médiane du marché dans les catégories où elle a trois produits ou plus. Négatif veut dire bon marché.',
  },
  'tvs.f_cats': { es: 'Categorias comparadas', en: 'Categories compared', fr: 'Catégories comparées' },
  'tvs.f_cats_x': {
    es: 'De todo el sitio, en cuantas tiene catalogo suficiente para medirla.',
    en: 'Across the whole site, in how many it has enough catalogue to be measured.',
    fr: 'Sur tout le site, dans combien elle a assez de catalogue pour être mesurée.',
  },
  'tvs.f_prods_x': {
    es: 'Los que esta web recoge de esa tienda, no su catalogo entero.',
    en: 'The ones this site collects from that store, not its whole catalogue.',
    fr: 'Ceux que ce site relève dans cette boutique, pas tout son catalogue.',
  },
  'tvs.f_marcas': { es: 'Marcas en el catalogo', en: 'Brands in the catalogue', fr: 'Marques au catalogue' },
  'tvs.f_marcas_x': {
    es: 'Una sola marca es marca propia (sin margen de fabricante); muchas es reventa.',
    en: 'A single brand means own brand (no manufacturer margin); many means reselling.',
    fr: 'Une seule marque signifie marque propre (sans marge fabricant) ; plusieurs, de la revente.',
  },
  'tvs.f_analisis_x': {
    es: 'Nivel 3 o 4: analizar un lote cuesta dinero y se repercute en el precio.',
    en: 'Level 3 or 4: testing a batch costs money and is passed on in the price.',
    fr: 'Niveau 3 ou 4 : analyser un lot coûte de l’argent et se répercute sur le prix.',
  },
  'tvs.f_aditivos': {
    es: 'Fichas con aditivos declarados', en: 'Product pages declaring additives', fr: 'Fiches avec additifs déclarés',
  },
  'tvs.f_aditivos_x': {
    es: 'Un aditivo ocupa gramos que no son activo y es mas barato que el activo.',
    en: 'An additive takes up grams that are not active ingredient and is cheaper than it.',
    fr: 'Un additif occupe des grammes qui ne sont pas de l’actif et coûte moins cher que lui.',
  },
  'tvs.f_nota_x': {
    es: (oa, ob) => `Sobre ${oa} y ${ob} opiniones publicadas por las propias tiendas, que son juez y parte.`,
    en: (oa, ob) => `Based on ${oa} and ${ob} reviews published by the stores themselves, which are judge and party.`,
    fr: (oa, ob) => `Sur ${oa} et ${ob} avis publiés par les boutiques elles-mêmes, juges et parties.`,
  },
  'tvs.antetitulo': { es: 'Tienda contra tienda', en: 'Store against store', fr: 'Boutique contre boutique' },
  'tvs.entradilla': {
    es: 'Ninguna tienda es barata en todo. Esta pagina no da un ganador: da la mediana de cada una en cada '
      + 'categoria que comparten, para que se vea donde gana cada cual y por cuanto. Los precios son de la '
      + 'ultima recogida y cambian; el catalogo y la certificacion, mucho menos.',
    en: 'No store is cheap at everything. This page does not name a winner: it gives each one’s median in every '
      + 'category they share, so you can see where each wins and by how much. Prices are from the last '
      + 'collection and change; catalogue and certification change far less.',
    fr: 'Aucune boutique n’est bon marché sur tout. Cette page ne désigne pas de gagnant : elle donne la médiane '
      + 'de chacune dans chaque catégorie commune, pour voir où chacune gagne et de combien. Les prix sont ceux '
      + 'du dernier relevé et changent ; le catalogue et la certification, beaucoup moins.',
  },
  'tvs.h2_cats': { es: 'Categoria a categoria', en: 'Category by category', fr: 'Catégorie par catégorie' },
  'tvs.apunte_cats': {
    es: 'Mediana de cada tienda, en su unidad', en: 'Each store’s median, in its unit',
    fr: 'Médiane de chaque boutique, dans son unité',
  },
  'tvs.caption_cats': {
    es: (a, b, n) => `${a} y ${b} en las ${n} categorias que venden las dos`,
    en: (a, b, n) => `${a} and ${b} across the ${n} categories both sell`,
    fr: (a, b, n) => `${a} et ${b} dans les ${n} catégories qu’elles vendent toutes les deux`,
  },
  'tvs.col_cat': { es: 'Categoria', en: 'Category', fr: 'Catégorie' },
  'tvs.col_dif': { es: 'Diferencia', en: 'Difference', fr: 'Écart' },
  'tvs.n_de': {
    es: (na, a, nb, b) => `${na} productos de ${a} y ${nb} de ${b}.`,
    en: (na, a, nb, b) => `${na} products from ${a} and ${nb} from ${b}.`,
    fr: (na, a, nb, b) => `${na} produits de ${a} et ${nb} de ${b}.`,
  },
  'tvs.ver_cara': {
    es: 'Ver el cara a cara completo', en: 'See the full head to head', fr: 'Voir le face-à-face complet',
  },
  'tvs.vs_mercado': { es: 'vs mercado', en: 'vs market', fr: 'vs marché' },
  'tvs.mas_barata': {
    es: (t) => `mas barata: ${t}`, en: (t) => `cheaper: ${t}`, fr: (t) => `moins chère : ${t}`,
  },
  'tvs.nota_mediana': {
    es: ' Es el punto medio del catalogo de esa tienda en esa categoria: sirve para saber por donde empezar a '
      + 'mirar, no para comprar. Para eso estan las tablas de cada categoria, donde manda la fila concreta.',
    en: ' It is the midpoint of that store’s catalogue in that category: it tells you where to start looking, not '
      + 'what to buy. That is what each category table is for, where the specific row counts.',
    fr: ' C’est le point médian du catalogue de cette boutique dans cette catégorie : il indique où commencer à '
      + 'chercher, pas quoi acheter. Pour cela il y a les tableaux de chaque catégorie, où compte la ligne précise.',
  },
  'tvs.h2_datos': { es: 'Las dos tiendas, dato a dato', en: 'Both stores, figure by figure', fr: 'Les deux boutiques, donnée par donnée' },
  'tvs.apunte_datos': { es: 'Lo que no es el precio de hoy', en: 'What is not today’s price', fr: 'Ce qui n’est pas le prix du jour' },
  'tvs.caption_datos': {
    es: (a, b) => `${a} y ${b}: catalogo, certificacion y aditivos`,
    en: (a, b) => `${a} and ${b}: catalogue, certification and additives`,
    fr: (a, b) => `${a} et ${b} : catalogue, certification et additifs`,
  },
  'tvs.faq_titulo': {
    es: (a, b) => `Preguntas sobre ${a} y ${b}`, en: (a, b) => `Questions about ${a} and ${b}`,
    fr: (a, b) => `Questions sur ${a} et ${b}`,
  },
  'tvs.seguir': { es: 'Seguir comparando', en: 'Keep comparing', fr: 'Continuer à comparer' },
  'tvs.apunte_seguir': {
    es: 'Las mismas tiendas, por categoria', en: 'The same stores, by category', fr: 'Les mêmes boutiques, par catégorie',
  },
  'tvs.todas': {
    es: 'Todas las tiendas, por indice de precio', en: 'All stores, by price index',
    fr: 'Toutes les boutiques, par indice de prix',
  },

  // ---------------------------------------------------------------- /para/<objetivo>/
  'objetivo.ganar-masa-muscular.h1': {
    es: 'Que suplementos sirven para ganar masa muscular',
    en: 'Which supplements help you build muscle',
    fr: 'Quels compléments aident à prendre du muscle',
  },
  'objetivo.ganar-masa-muscular.entrada': {
    es: 'Ninguno de estos construye musculo por su cuenta. Lo que hacen es tapar los dos agujeros por los que se '
      + 'pierde el trabajo del gimnasio: no llegar a la proteina del dia y no poder entrenar tan duro como se podria.',
    en: 'None of these builds muscle on its own. What they do is plug the two holes through which gym work gets '
      + 'lost: not reaching the day’s protein, and not being able to train as hard as you could.',
    fr: 'Aucun d’eux ne construit du muscle tout seul. Ils bouchent les deux trous par lesquels se perd le travail '
      + 'en salle : ne pas atteindre sa protéine du jour, et ne pas pouvoir s’entraîner aussi dur qu’on le pourrait.',
  },
  'objetivo.perder-grasa.h1': {
    es: 'Que suplementos sirven para perder grasa (y cuales no)',
    en: 'Which supplements help you lose fat (and which do not)',
    fr: 'Quels compléments aident à perdre du gras (et lesquels non)',
  },
  'objetivo.perder-grasa.entrada': {
    es: 'Es el objetivo con mas humo por metro cuadrado. Lo que tiene evidencia no quema grasa: sostiene el musculo '
      + 'mientras se come menos y ayuda a entrenar igual de fuerte con menos energia disponible.',
    en: 'It is the goal with the most hot air per square metre. What has evidence does not burn fat: it holds on to '
      + 'muscle while you eat less and helps you train just as hard with less energy available.',
    fr: 'C’est l’objectif avec le plus de poudre aux yeux au mètre carré. Ce qui a des preuves ne brûle pas de gras : '
      + 'cela préserve le muscle quand on mange moins et aide à s’entraîner aussi dur avec moins d’énergie.',
  },
  'objetivo.rendimiento.h1': {
    es: 'Que suplementos mejoran el rendimiento en el entrenamiento',
    en: 'Which supplements improve training performance',
    fr: 'Quels compléments améliorent la performance à l’entraînement',
  },
  'objetivo.rendimiento.entrada': {
    es: 'Los cuatro que aparecen aqui son los que la ISSN da por buenos para rendimiento, cada uno para un tipo de '
      + 'esfuerzo distinto. Fuera de su rango de esfuerzo, no hacen nada.',
    en: 'The four listed here are the ones the ISSN accepts for performance, each for a different kind of effort. '
      + 'Outside their effort range, they do nothing.',
    fr: 'Les quatre présentés ici sont ceux que l’ISSN valide pour la performance, chacun pour un type d’effort '
      + 'différent. Hors de leur plage d’effort, ils ne font rien.',
  },
  'objetivo.articulaciones.h1': {
    es: 'Que suplementos sirven para las articulaciones',
    en: 'Which supplements help your joints',
    fr: 'Quels compléments aident les articulations',
  },
  'objetivo.articulaciones.entrada': {
    es: 'Aqui la evidencia es floja casi entera y conviene decirlo antes que nada: se habla de menos dolor, no de '
      + 'cartilago nuevo, y los efectos tardan meses.',
    en: 'Here the evidence is weak almost across the board, and that is worth saying first: we are talking about '
      + 'less pain, not new cartilage, and effects take months.',
    fr: 'Ici les preuves sont faibles presque partout, et mieux vaut le dire d’emblée : on parle de moins de '
      + 'douleur, pas de nouveau cartilage, et les effets prennent des mois.',
  },
  'objetivo.descanso-y-estres.h1': {
    es: 'Que suplementos ayudan a dormir mejor y con el estres',
    en: 'Which supplements help with sleep and stress',
    fr: 'Quels compléments aident à mieux dormir et contre le stress',
  },
  'objetivo.descanso-y-estres.entrada': {
    es: 'Dormir mal no se arregla con un bote, pero dos de estos tienen efecto medido y barato. El resto de lo que '
      + 'se vende en esta estanteria es un multivitaminico con nombre de noche.',
    en: 'Bad sleep is not fixed with a tub, but two of these have a measured, cheap effect. The rest of what is sold '
      + 'on this shelf is a multivitamin with a night-time name.',
    fr: 'Mal dormir ne se règle pas avec un pot, mais deux de ceux-ci ont un effet mesuré et bon marché. Le reste de '
      + 'ce rayon, c’est une multivitamine avec un nom de nuit.',
  },
  'objetivo.salud-general.h1': {
    es: 'Que suplementos tienen sentido para la salud general',
    en: 'Which supplements make sense for general health',
    fr: 'Quels compléments ont du sens pour la santé générale',
  },
  'objetivo.salud-general.entrada': {
    es: 'Sin deficit no hay efecto: un suplemento aqui solo hace algo si tapa un hueco que la dieta o el sol dejan '
      + 'abierto. Por eso los que tienen sentido son pocos y muy concretos.',
    en: 'No deficiency, no effect: a supplement here only does something if it fills a gap left open by diet or '
      + 'sunlight. That is why the ones that make sense are few and very specific.',
    fr: 'Sans carence, pas d’effet : un complément ne sert ici que s’il comble un manque laissé par l’alimentation '
      + 'ou le soleil. C’est pourquoi ceux qui ont du sens sont peu nombreux et très précis.',
  },
  'para.titulo_sufijos': {
    es: [': evidencia y dosis', ': con fuentes', ''],
    en: [': evidence and doses', ': with sources', ''],
    fr: [' : preuves et doses', ' : avec sources', ''],
  },
  'para.descripcion': {
    es: (n, obj, mes, d) => `${n} suplementos para ${obj} ordenados por evidencia, con su efecto medido, su dosis y `
      + `lo que cuesta al mes${mes ? ` (lo basico, desde ${mes} al mes)` : ''}. Y los ${d} que se venden para esto y no hacen falta.`,
    en: (n, obj, mes, d) => `${n} supplements for ${obj} sorted by evidence, with their measured effect, their dose `
      + `and monthly cost${mes ? ` (the basics, from ${mes} a month)` : ''}. And the ${d} sold for this that you do not need.`,
    fr: (n, obj, mes, d) => `${n} compléments pour ${obj} triés par niveau de preuve, avec leur effet mesuré, leur `
      + `dose et leur coût mensuel${mes ? ` (l’essentiel, dès ${mes} par mois)` : ''}. Et les ${d} vendus pour cela dont on n’a pas besoin.`,
  },
  'para.y': { es: ' y ', en: ' and ', fr: ' et ' },
  'para.faq1_p': {
    es: (o) => `¿Que suplementos tomar para ${o}?`, en: (o) => `Which supplements should you take to ${o}?`,
    fr: (o) => `Quels compléments prendre pour ${o} ?`,
  },
  'para.faq1_r': {
    es: (lista, mes, resto) => `Lo minimo defendible con fuentes son ${lista}`
      + (mes ? `, que a la dosis de los estudios salen por ${mes} al mes comprando el mas barato que llega a esa dosis.` : '.')
      + ` A partir de ahi, esta pagina lista otros ${resto} con evidencia detras, cada uno para un caso concreto.`,
    en: (lista, mes, resto) => `The minimum you can defend with sources is ${lista}`
      + (mes ? `, which at the dose used in the studies comes to ${mes} a month buying the cheapest that reaches that dose.` : '.')
      + ` Beyond that, this page lists another ${resto} with evidence behind them, each for a specific case.`,
    fr: (lista, mes, resto) => `Le minimum défendable avec des sources, c’est ${lista}`
      + (mes ? `, qui à la dose des études revient à ${mes} par mois en achetant le moins cher qui atteint cette dose.` : '.')
      + ` Au-delà, cette page en liste ${resto} autres avec des preuves derrière, chacun pour un cas précis.`,
  },
  'para.faq1_r_sin': {
    es: 'Los de la tabla de arriba, por orden de evidencia. Ninguno sustituye a comer y entrenar: tapan huecos, no hacen el trabajo.',
    en: 'The ones in the table above, in order of evidence. None replaces eating and training: they fill gaps, they do not do the work.',
    fr: 'Ceux du tableau ci-dessus, par ordre de preuve. Aucun ne remplace manger et s’entraîner : ils comblent des manques, ils ne font pas le travail.',
  },
  'para.faq2_p': { es: (l) => `¿Y ${l}?`, en: (l) => `And ${l}?`, fr: (l) => `Et ${l} ?` },
  'para.faq2_r': {
    es: (l, plural, que, o) => `${l} ${plural ? 'tienen' : 'tiene'} evidencia baja para esto: ${que} Se venden `
      + `mucho para ${o} y cada uno tiene su guia con las fuentes, para que la decision no dependa de lo que diga una etiqueta.`,
    en: (l, plural, que, o) => `${l} ${plural ? 'have' : 'has'} weak evidence for this: ${que} They are sold a lot `
      + `for this goal and each has its own guide with the sources, so the decision does not depend on what a label says.`,
    fr: (l, plural, que, o) => `${l} ${plural ? 'ont' : 'a'} des preuves faibles pour cela : ${que} Ils se vendent `
      + `beaucoup pour cet objectif et chacun a son guide avec les sources, pour que la décision ne dépende pas d’une étiquette.`,
  },
  'para.faq3_p': {
    es: '¿De donde salen estos precios?', en: 'Where do these prices come from?', fr: 'D’où viennent ces prix ?',
  },
  'para.faq3_r': {
    es: (n, t, f, rev) => `De los ${n} productos que esta web recoge en ${t} tiendas espanolas, con precios del ${f}. `
      + 'El coste al mes es el de una dosis efectiva al dia durante 30 dias, con el producto mas barato que llega a '
      + `esa dosis. La evidencia se reviso el ${rev}.`,
    en: (n, t, f, rev) => `From the ${n} products this site collects across ${t} Spanish stores, with prices from ${f}. `
      + 'The monthly cost is one effective dose a day for 30 days, with the cheapest product that reaches that dose. '
      + `The evidence was reviewed on ${rev}.`,
    fr: (n, t, f, rev) => `Des ${n} produits que ce site relève dans ${t} boutiques espagnoles, avec les prix du ${f}. `
      + 'Le coût mensuel est celui d’une dose efficace par jour pendant 30 jours, avec le produit le moins cher qui '
      + `atteint cette dose. Les preuves ont été relues le ${rev}.`,
  },
  'para.antetitulo': {
    es: 'Por objetivo · evidencia revisada el', en: 'By goal · evidence reviewed on', fr: 'Par objectif · preuves relues le',
  },
  'para.resp_nucleo': {
    es: (l) => `Lo que se sostiene con fuentes es corto: ${l}`, en: (l) => `What holds up with sources is short: ${l}`,
    fr: (l) => `Ce qui tient avec des sources est court : ${l}`,
  },
  'para.resp_mes': {
    es: (m) => `, unos ${m} al mes a la dosis de los estudios`, en: (m) => `, about ${m} a month at the dose used in the studies`,
    fr: (m) => `, environ ${m} par mois à la dose des études`,
  },
  'para.resp_lista': {
    es: (n, o) => `Esta pagina lista ${n} suplementos con evidencia para ${o}`,
    en: (n, o) => `This page lists ${n} supplements with evidence for this goal`,
    fr: (n, o) => `Cette page liste ${n} compléments avec des preuves pour cet objectif`,
  },
  'para.resp_descarta': {
    es: (d) => `, y ${d} que se venden para esto y no hacen falta`,
    en: (d) => `, and ${d} sold for it that you do not need`,
    fr: (d) => `, et ${d} vendus pour cela dont on n’a pas besoin`,
  },
  'para.basico': { es: 'Lo basico, y lo que cuesta', en: 'The basics, and what they cost', fr: 'L’essentiel, et ce que ça coûte' },
  'para.al_mes': { es: 'al mes', en: 'a month', fr: 'par mois' },
  'para.mas_barato_dosis': {
    es: 'Mas barato a esa dosis:', en: 'Cheapest at that dose:', fr: 'Le moins cher à cette dose :',
  },
  'para.de_tienda': { es: 'de', en: 'from', fr: 'chez' },
  'para.total_t': {
    es: (m) => `${m} al mes en total`, en: (m) => `${m} a month in total`, fr: (m) => `${m} par mois au total`,
  },
  'para.total': {
    es: (l) => `, sumando ${l} a una dosis efectiva al dia con el producto mas barato que llega a esa dosis. No es una `
      + 'recomendacion medica ni un plan: es lo que cuesta hoy, en las tiendas que compara esta web, lo que tiene fuentes detras.',
    en: (l) => `, adding up ${l} at one effective dose a day with the cheapest product that reaches that dose. It is not `
      + 'a medical recommendation or a plan: it is what the evidence-backed options cost today, in the stores this site compares.',
    fr: (l) => `, en additionnant ${l} à une dose efficace par jour avec le produit le moins cher qui atteint cette dose. `
      + 'Ce n’est ni une recommandation médicale ni un plan : c’est ce que coûte aujourd’hui, dans les boutiques comparées, ce qui a des sources.',
  },
  'para.h2_incluye': {
    es: (n) => `Los ${n} que tienen algo detras`, en: (n) => `The ${n} with something behind them`,
    fr: (n) => `Les ${n} qui ont quelque chose derrière`,
  },
  'para.apunte_incluye': {
    es: 'Por nivel de evidencia y coste al mes', en: 'By evidence level and monthly cost',
    fr: 'Par niveau de preuve et coût mensuel',
  },
  'para.caption_incluye': {
    es: (o) => `Suplementos con evidencia para ${o}`, en: (o) => `Supplements with evidence for: ${o}`,
    fr: (o) => `Compléments avec des preuves pour : ${o}`,
  },
  'para.col_evidencia': { es: 'Evidencia', en: 'Evidence', fr: 'Preuves' },
  'para.comparados': {
    es: (n) => `${n} productos comparados`, en: (n) => `${n} products compared`, fr: (n) => `${n} produits comparés`,
  },
  'para.mejor_nota': {
    es: (nom, t) => ` · mejor nota: ${nom} de ${t}`, en: (nom, t) => ` · best score: ${nom} from ${t}`,
    fr: (nom, t) => ` · meilleure note : ${nom} chez ${t}`,
  },
  'para.h2_descarta': {
    es: (n) => `Los ${n} que te van a vender para esto`, en: (n) => `The ${n} they will try to sell you for this`,
    fr: (n) => `Les ${n} qu’on va vous vendre pour cela`,
  },
  'para.apunte_descarta': {
    es: 'Evidencia baja, precio de suplemento', en: 'Weak evidence, supplement price',
    fr: 'Preuves faibles, prix de complément',
  },
  'para.caption_descarta': {
    es: (o) => `Suplementos de evidencia baja que se venden para ${o}`,
    en: (o) => `Weak-evidence supplements sold for: ${o}`,
    fr: (o) => `Compléments aux preuves faibles vendus pour : ${o}`,
  },
  'para.nota_baja_t': {
    es: 'Evidencia baja no es fraude.', en: 'Weak evidence is not fraud.', fr: 'Preuves faibles ne veut pas dire fraude.',
  },
  'para.nota_baja': {
    es: ' Es que el efecto no aparece cuando la dieta ya cubre el hueco, o que los estudios que lo sostienen son '
      + 'pequenos, cortos o pagados por quien vende. Cada guia dice en que caso concreto si tiene sentido, que casi '
      + 'siempre existe y casi nunca es el de la persona que lo compra.',
    en: ' It means the effect does not show up when diet already fills the gap, or that the studies behind it are '
      + 'small, short or paid for by the seller. Each guide says in which specific case it does make sense, which '
      + 'almost always exists and is almost never the case of the person buying it.',
    fr: ' Cela veut dire que l’effet n’apparaît pas quand l’alimentation comble déjà le manque, ou que les études qui '
      + 'le soutiennent sont petites, courtes ou payées par le vendeur. Chaque guide dit dans quel cas précis il a du '
      + 'sens, un cas qui existe presque toujours et n’est presque jamais celui de l’acheteur.',
  },
  'para.faq_titulo': {
    es: (o) => `Preguntas sobre suplementos para ${o}`, en: (o) => `Questions about supplements for: ${o}`,
    fr: (o) => `Questions sur les compléments pour : ${o}`,
  },
  'para.otros': { es: 'Otros objetivos', en: 'Other goals', fr: 'Autres objectifs' },
  'para.apunte_otros': { es: 'La misma lista, otra pregunta', en: 'The same list, another question', fr: 'La même liste, une autre question' },
  'para.todos': { es: 'Todos, por evidencia', en: 'All of them, by evidence', fr: 'Tous, par niveau de preuve' },
  'para.n_guias': { es: (n) => `${n} guias`, en: (n) => `${n} guides`, fr: (n) => `${n} guides` },
};
