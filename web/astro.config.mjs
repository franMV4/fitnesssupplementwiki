import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { SITIO } from './src/sitio.js';

// Sitio estatico: todo se genera en build desde src/datos/dataset.json.
// React solo se hidrata en la tabla de categoria (filtros y orden).
// El dominio no se escribe aqui: sale de src/sitio.js, el mismo que usan el sitemap,
// el robots.txt y el JSON-LD. Un dominio escrito en dos sitios acaba siendo dos.
export default defineConfig({
  integrations: [react()],
  site: SITIO.url,
  // El dev server de Astro no ejecuta functions/: sin esto, en local /api/entrar
  // devolvia la pagina 404 de Astro y el formulario se quedaba esperando un JSON que
  // nunca llegaba. La API la sirve wrangler al lado ("npm run api", puerto 8788).
  vite: { server: { proxy: { '/api': 'http://127.0.0.1:8788' } } },
});
