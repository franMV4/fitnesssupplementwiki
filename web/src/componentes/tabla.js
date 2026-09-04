// Los filtros, el orden y la seleccion de la tabla de categoria, sobre las filas que ya
// vienen pintadas del build (TablaProductos.astro).
//
// Lo que este fichero NO hace, a proposito: no pinta filas, no guarda una copia de los
// productos y no tiene estado propio mas alla de cinco variables. El catalogo ya esta en
// el DOM; volver a serializarlo para que un framework lo repinte igual costaba 218 KB de
// HTML y 184 KB de runtime en /proteina-whey.
//
// El filtrado y los ordenes siguen siendo los de datos/util.js, con sus tests
// (`node tabla.test.mjs`): aqui solo se arma el objeto que espera `filtrar()` leyendo los
// `data-` de cada <tr>. Si un dia cambia una regla de filtrado, se cambia alli y esto no
// se entera, que es justo lo que se queria.

import { ORDENES, TOPE_SELECCION, alternarEnLista, enLista, filtrar, guardarMiLista,
         guardarSeleccion, leerMiLista, leerSeleccion } from '../datos/util.js';

// `filtrar` compara `${marca} ${nombre}`, y en el HTML las dos ya vienen juntas y en
// minusculas en data-busca: la marca va vacia para no meter un espacio de mas.
const producto = (tr) => ({
  tr,
  marca: '',
  nombre: tr.dataset.busca,
  slug: tr.dataset.slug,
  categoria: tr.dataset.cat,
  tienda: tr.dataset.tienda,
  nivel_verificacion: Number(tr.dataset.nivel),
  certificaciones: tr.dataset.sellos ? tr.dataset.sellos.split(' ').map((t) => ({ tipo: t })) : [],
  // La nota de los lectores no viene del build: la trae /api/valoraciones y se rellena
  // aqui cuando llega. Hasta entonces es null, que es lo que la deja al final del orden.
  lectores: null,
  precio_referencia: tr.dataset.ref === '' ? null : Number(tr.dataset.ref),
  precio_eur: tr.dataset.precio === '' ? null : Number(tr.dataset.precio),
  score_final: tr.dataset.score === '' ? null : Number(tr.dataset.score),
});

export function montarTabla(raiz) {
  const tabla = raiz.querySelector('table');
  const cuerpo = tabla.querySelector('tbody');
  const productos = [...cuerpo.rows].map(producto);
  const TOPE = Number(raiz.dataset.tope);
  const total = Number(raiz.dataset.total);

  const q = (sel) => raiz.querySelector(sel);
  const campos = {
    busqueda: q('input[name="busqueda"]'),
    tienda: q('select[name="tienda"]'),
    precioMax: q('input[name="precioMax"]'),
    orden: q('select[name="orden"]'),
  };
  const verMas = q('.ver-mas');
  const arriba = q('.volver-arriba');
  const vacio = q('.vacio');
  const pie = q('.pie-tabla');
  const limpiar = q('[data-limpiar]');
  const barra = q('.barra-comparar');

  let nivelMin = 1;
  let sello = '';
  // "Ver todas" se pega al filtro puesto, no a la sesion: al cambiar un filtro la tabla
  // vuelve a recortarse. Si no, un filtro que deja 300 filas las suelta todas de golpe.
  let todo = false;
  let elegidos = leerSeleccion();
  let mios = leerMiLista();

  const estado = () => ({
    busqueda: campos.busqueda.value,
    tienda: campos.tienda.value,
    precioMax: campos.precioMax.value,
    orden: campos.orden.value,
    nivelMin,
    sello,
  });

  function pinta() {
    const f = estado();
    const visibles = filtrar(productos, f);
    const dentro = new Set(visibles.map((p) => p.tr));

    // Las filtradas se van al final en vez de quedarse escondidas entre medias: la regla
    // que recorta la tabla es `tr:nth-child(n+26)`, y cuenta posiciones del DOM, no filas
    // a la vista. Con las descartadas intercaladas recortaria por donde no toca.
    cuerpo.append(...visibles.map((p) => p.tr),
                  ...productos.filter((p) => !dentro.has(p.tr)).map((p) => p.tr));

    const refs = visibles.map((p) => p.precio_referencia).filter((n) => n != null);
    // El precio mas bajo de lo que se ve AHORA: es el unico que se tine, porque ordenando
    // por score la primera fila no tiene por que ser la mas barata.
    const min = refs.length ? Math.min(...refs) : null;

    for (const p of productos) p.tr.hidden = !dentro.has(p.tr);
    visibles.forEach((p, i) => {
      const puesto = p.tr.querySelector('.puesto');
      puesto.textContent = String(i + 1).padStart(2, '0');
      puesto.classList.toggle('top', i === 0);
      p.tr.querySelector('.referencia')
        .classList.toggle('destacado', p.precio_referencia != null && p.precio_referencia === min);
    });

    tabla.classList.toggle('recortada', !todo && visibles.length > TOPE);
    tabla.querySelector('caption').textContent =
      `Productos ordenados por ${ORDENES[f.orden].etiqueta.toLowerCase()}`;
    for (const boton of raiz.querySelectorAll('.orden')) {
      const activo = boton.dataset.orden === f.orden;
      boton.classList.toggle('activo', activo);
      boton.closest('th').setAttribute('aria-sort', activo ? 'ascending' : 'none');
    }

    verMas.hidden = todo || visibles.length <= TOPE;
    verMas.querySelector('[data-restantes]').textContent = visibles.length - TOPE;
    arriba.hidden = !todo || visibles.length <= TOPE;
    vacio.hidden = visibles.length > 0;
    pie.hidden = visibles.length === 0;
    pie.innerHTML = visibles.length === total
      ? `<b>${total}</b> productos en esta tabla`
      : `<b>${visibles.length}</b> de ${total} productos con los filtros puestos`;

    const filtrando = f.busqueda || f.tienda || f.precioMax || nivelMin > 1 || sello;
    if (limpiar) limpiar.hidden = !filtrando;
  }

  function pintaSeleccion() {
    for (const p of productos) {
      const dentro = elegidos.some((e) => e.s === p.slug);
      const boton = p.tr.querySelector('.marcar:not(.mi-lista)');
      boton.setAttribute('aria-pressed', String(dentro));
      boton.textContent = dentro ? 'en tu comparativa' : '+ comparar';

      const guardado = enLista(mios, p.slug);
      const suyo = p.tr.querySelector('.mi-lista');
      suyo.setAttribute('aria-pressed', String(guardado));
      suyo.textContent = guardado ? 'en tu lista' : '+ mi lista';
    }
    barra.hidden = elegidos.length === 0;
    barra.querySelector('[data-cuenta]').textContent = elegidos.length;
    barra.querySelector('[data-etiqueta]').textContent =
      (elegidos.length === 1 ? 'producto guardado' : 'productos guardados')
      + (elegidos.length >= TOPE_SELECCION ? ` (el tope son ${TOPE_SELECCION})` : '');
  }

  const recuenta = () => { todo = false; pinta(); };
  campos.busqueda.addEventListener('input', recuenta);
  for (const c of [campos.tienda, campos.precioMax, campos.orden]) {
    c.addEventListener('change', recuenta);
  }

  raiz.addEventListener('click', (e) => {
    const boton = e.target.closest('button');
    if (!boton || !raiz.contains(boton)) return;

    if (boton.dataset.orden) { campos.orden.value = boton.dataset.orden; recuenta(); return; }

    if (boton.dataset.nivel) {
      // `.chip` no sobra: cada <tr> lleva tambien un data-nivel (el del producto), y sin
      // acotar, esto le ponia aria-pressed a las 223 filas de la tabla.
      nivelMin = Number(boton.dataset.nivel);
      for (const b of raiz.querySelectorAll('.chip[data-nivel]')) {
        b.setAttribute('aria-pressed', String(Number(b.dataset.nivel) === nivelMin));
      }
      recuenta();
      return;
    }

    if (boton.dataset.sello) {
      sello = sello === boton.dataset.sello ? '' : boton.dataset.sello;
      for (const b of raiz.querySelectorAll('.chip[data-sello]')) {
        b.setAttribute('aria-pressed', String(b.dataset.sello === sello));
      }
      recuenta();
      return;
    }

    if (limpiar && limpiar.contains(boton)) {
      campos.busqueda.value = '';
      campos.tienda.value = '';
      campos.precioMax.value = '';
      nivelMin = 1;
      sello = '';
      for (const b of raiz.querySelectorAll('.chip[data-nivel]')) {
        b.setAttribute('aria-pressed', String(Number(b.dataset.nivel) === 1));
      }
      for (const b of raiz.querySelectorAll('.chip[data-sello]')) b.setAttribute('aria-pressed', 'false');
      recuenta();
      return;
    }

    if (boton === verMas) { todo = true; pinta(); return; }

    // Antes que `.marcar`: el boton de mi lista lleva las dos clases (comparte estilo)
    // y sin este orden caeria en el guardado de la comparativa.
    if (boton.classList.contains('mi-lista')) {
      const fila = boton.closest('tr');
      const p = productos.find((o) => o.tr === fila);
      mios = alternarEnLista(mios, { s: p.slug, c: p.categoria });
      guardarMiLista(mios);
      pintaSeleccion();
      return;
    }

    if (boton.classList.contains('marcar')) {
      const fila = boton.closest('tr');
      const p = productos.find((o) => o.tr === fila);
      const fuera = elegidos.filter((e) => e.s !== p.slug);
      elegidos = fuera.length < elegidos.length
        ? fuera
        : [...elegidos, { s: p.slug, c: p.categoria }].slice(-TOPE_SELECCION);
      guardarSeleccion(elegidos);
      pintaSeleccion();
    }
  });

  // La seleccion vive en localStorage y por eso no puede venir pintada del build: el HTML
  // es el mismo para todo el mundo. Se aplica en cuanto carga el script.
  pintaSeleccion();

  // La nota que le ponen los lectores DE ESTA WEB, que hasta ahora solo se veia dentro de
  // la ficha. Una peticion por pagina para las 200 filas, cacheada cinco minutos en el
  // borde, y si falla la tabla se queda exactamente como estaba: es un dato de mas, no
  // uno del que dependa nada.
  fetch('/api/valoraciones')
    .then((r) => (r.ok ? r.json() : {}))
    .then((notas) => {
      const conNota = productos.filter((p) => notas[p.slug]);
      if (conNota.length === 0) return;
      for (const p of conNota) {
        const [media, cuantas] = notas[p.slug];
        p.lectores = media;
        const marca = document.createElement('span');
        marca.className = 'opinion lectores';
        marca.title = `${cuantas} ${cuantas === 1 ? 'opinion' : 'opiniones'} de lectores de esta web`;
        marca.textContent = ` · ${media.toFixed(1).replace('.', ',')}★ ${cuantas} aqui`;
        // Delante de los botones de guardar, que son lo ultimo de la celda del nombre.
        p.tr.querySelector('.celda-producto').insertBefore(marca, p.tr.querySelector('.marcar'));
      }
      // El orden solo aparece cuando hay con que ordenar (ver ORDENES.lectores).
      campos.orden.add(new Option(ORDENES.lectores.etiqueta, 'lectores'));
    })
    .catch(() => {});
}
