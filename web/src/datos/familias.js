// En que estante esta cada categoria. Es lo unico de la navegacion que no sale del
// dataset y no puede salir: "whey y caseina son proteinas" es una decision editorial,
// no un dato de la tienda. Treinta enlaces en una lista plana no se leen; en cuatro
// estantes de siete, si.
//
// ponytail: una lista de slugs, sin campo nuevo en el scraper ni taxonomia. Una
// categoria que no este aqui no desaparece: cae en "Otros" y se ve enseguida que falta.
export const FAMILIAS = [
  { nombre: 'Proteinas', slugs: ['proteina-whey', 'proteina-aislada', 'proteina-vegana',
                                 'caseina', 'ganador-peso', 'eaa', 'bcaa'] },
  { nombre: 'Rendimiento', slugs: ['creatina', 'preentreno', 'cafeina', 'beta-alanina',
                                   'citrulina', 'carbohidratos', 'carnitina', 'glutamina'] },
  { nombre: 'Vitaminas y minerales', slugs: ['multivitaminico', 'vitamina-d', 'vitamina-c',
                                             'vitamina-b12', 'magnesio', 'zinc', 'hierro', 'zma'] },
  { nombre: 'Salud y descanso', slugs: ['omega3', 'colageno', 'glucosamina', 'curcuma',
                                        'probioticos', 'ashwagandha', 'melatonina'] },
];

// Reparte las categorias del dataset por estante conservando el orden de FAMILIAS.
// `filtro` sirve para el menu de guias, que solo lista las categorias con evidencia escrita.
export function porFamilia(categorias, filtro = () => true, lang = 'es') {
  const cats = categorias.filter(filtro);
  const colocadas = new Set(FAMILIAS.flatMap((f) => f.slugs));
  // Dentro del estante manda el alfabeto: FAMILIAS decide en que balda va cada una,
  // no en que puesto. Asi el orden no depende de como se escribio la lista.
  // El alfabeto es el del idioma en el que se lee: en ingles "Creatine" va delante de
  // "Caffeine"? no, pero "Whey protein" cae en otro sitio que "Proteina whey", y un menu
  // ordenado por el alfabeto espanol dentro de una pagina en ingles se lee desordenado.
  const alfabetico = (a, b) => a.nombre.localeCompare(b.nombre, lang);
  const grupos = FAMILIAS.map((f) => ({
    nombre: f.nombre,
    cats: f.slugs.map((s) => cats.find((c) => c.slug === s)).filter(Boolean).sort(alfabetico),
  }));
  const sueltas = cats.filter((c) => !colocadas.has(c.slug)).sort(alfabetico);
  if (sueltas.length) grupos.push({ nombre: 'Otros', cats: sueltas });
  return grupos.filter((g) => g.cats.length);
}
