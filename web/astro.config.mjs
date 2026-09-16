import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { SITIO } from './src/sitio.js';
import { restaurarTildesHTML } from './src/tildes.js';
import { IDIOMAS, POR_DEFECTO } from './src/i18n.js';

// Las carpetas de los otros idiomas. El restaurador de tildes NO entra aqui: en /en/
// "version" y "tension" son palabras inglesas, y en /fr/ lo son francesas. Pasarles el
// mapa del espanol las convertiria en "versión" y "tensión" dentro de una frase en otro
// idioma, que es peor que no acentuar nada. El ingles y el frances se escriben ya con sus
// acentos puestos en src/datos/textos.js, asi que no necesitan este paso.
const OTROS_IDIOMAS = IDIOMAS.filter((l) => l !== POR_DEFECTO);

// Ultimo paso del build: pasar el restaurador de tildes por cada .html ya generado.
// Se hace aqui, sobre el HTML final, y no en las plantillas, porque el texto sin tilde
// viene de quince ficheros y, sobre todo, de los nombres que ponen las tiendas en el
// dataset (4.800 fichas). Ver web/src/tildes.js. Corre despues del render de Astro, asi
// que tambien acentua lo que hoy escribe el motor de scoring en el desglose.
const restaurarTildes = () => ({
  name: 'restaurar-tildes',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const raiz = fileURLToPath(dir);
      let n = 0;
      const recorre = async (d, raizDelSitio = false) => {
        for (const e of await readdir(d, { withFileTypes: true })) {
          const ruta = `${d}/${e.name}`;
          if (raizDelSitio && e.isDirectory() && OTROS_IDIOMAS.includes(e.name)) continue;
          if (e.isDirectory()) await recorre(ruta);
          else if (e.name.endsWith('.html')) {
            const html = await readFile(ruta, 'utf-8');
            const conTildes = restaurarTildesHTML(html);
            if (conTildes !== html) { await writeFile(ruta, conTildes); n++; }
          }
        }
      };
      await recorre(raiz, true);
      logger.info(`tildes restauradas en ${n} paginas`);
    },
  },
});

// Sitio estatico: todo se genera en build desde src/datos/dataset.json.
// React solo se hidrata en la tabla de categoria (filtros y orden).
// El dominio no se escribe aqui: sale de src/sitio.js, el mismo que usan el sitemap,
// el robots.txt y el JSON-LD. Un dominio escrito en dos sitios acaba siendo dos.
export default defineConfig({
  integrations: [react(), restaurarTildes()],
  site: SITIO.url,
  // El dev server de Astro no ejecuta functions/: sin esto, en local /api/entrar
  // devolvia la pagina 404 de Astro y el formulario se quedaba esperando un JSON que
  // nunca llegaba. La API la sirve wrangler al lado ("npm run api", puerto 8788).
  vite: { server: { proxy: { '/api': 'http://127.0.0.1:8788' } } },
});
