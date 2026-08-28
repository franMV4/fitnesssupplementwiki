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
    '',
    ...BOTS_IA.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
    `Sitemap: ${abs('/sitemap.xml')}`,
    '',
  ].join('\n');
  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
