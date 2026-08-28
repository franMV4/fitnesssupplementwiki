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
});
