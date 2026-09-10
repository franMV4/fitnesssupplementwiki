import { abs } from '../sitio.js';

// Los rastreadores de IA se permiten uno a uno y a proposito. Bloquearlos (que es lo
// que hace medio internet ahora mismo) es renunciar a salir en las respuestas de
// ChatGPT, Perplexity, Gemini y los resumenes de Google, que es justo el trafico que
// esta web quiere. Aqui no hay contenido que proteger: hay precios que queremos que
// se citen, con la fuente puesta.
const BOTS_IA = [
  'GPTBot',            // entrenamiento y busqueda de OpenAI
  'OAI-SearchBot',     // ChatGPT Search
  'ChatGPT-User',      // navegacion en directo desde una conversacion
  'ClaudeBot',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',   // Gemini y los AI Overviews
  'Applebot-Extended',
  'Bingbot',
  'CCBot',             // Common Crawl: de aqui salen los corpus de casi todos
  'meta-externalagent',
  'Amazonbot',
  'DuckAssistBot',
];

export function GET() {
  const cuerpo = [
    'User-agent: *',
    'Allow: /',
    // El panel no tiene nada que indexar (sin sesion de admin no ensena un dato) y sale
    // aqui para que no gaste presupuesto de rastreo ni aparezca en una busqueda.
    'Disallow: /admin',
    // Los formularios de sesion. Ya llevan noindex, pero un React de la ficha escribe
    // `/entrar/?volver=<ruta>` en cada una de las 4.113: Googlebot renderiza el JS, las
    // descubre y se gasta el presupuesto en 4.113 copias de la MISMA pantalla de acceso.
    // La pagina pelada se deja rastreable para que su noindex se siga leyendo; lo que se
    // corta es la multiplicacion por parametro.
    'Disallow: /*?volver=',
    // La API devuelve JSON para el navegador, no paginas. Nada que indexar.
    'Disallow: /api/',
    '',
    ...BOTS_IA.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
    `Sitemap: ${abs('/sitemap.xml')}`,
    '',
  ].join('\n');
  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
