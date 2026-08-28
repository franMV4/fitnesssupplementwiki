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
export function porFamilia(categorias, filtro = () => true) {
  const cats = categorias.filter(filtro);
  const colocadas = new Set(FAMILIAS.flatMap((f) => f.slugs));
  const grupos = FAMILIAS.map((f) => ({
    nombre: f.nombre,
    cats: f.slugs.map((s) => cats.find((c) => c.slug === s)).filter(Boolean),
  }));
  const sueltas = cats.filter((c) => !colocadas.has(c.slug));
  if (sueltas.length) grupos.push({ nombre: 'Otros', cats: sueltas });
  return grupos.filter((g) => g.cats.length);
}
