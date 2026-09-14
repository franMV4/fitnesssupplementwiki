import { GRUPOS, urlset, xml } from './sitemap.xml.js';

export const getStaticPaths = () => Object.keys(GRUPOS).map((grupo) => ({ params: { grupo } }));

export const GET = ({ params }) => xml(urlset(GRUPOS[params.grupo]()));
