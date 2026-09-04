-- Esquema de D1 para cuentas y resenas de lectores.
-- Se aplica una vez por base (local y produccion), ver PUBLICAR.md paso 9.
--
-- Dos tablas y nada mas: quien escribe y que escribe. La media por producto NO se
-- guarda; sale de un AVG sobre esta misma tabla, que con unos miles de filas cuesta
-- menos que mantener un contador que algun dia se desincroniza.

CREATE TABLE IF NOT EXISTS usuarios (
  id     INTEGER PRIMARY KEY,
  email  TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  -- PBKDF2 en formato "sal:hash", los dos en hexadecimal. Nunca la clave en claro.
  clave  TEXT NOT NULL,
  creado TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resenas (
  id         INTEGER PRIMARY KEY,
  usuario    INTEGER NOT NULL REFERENCES usuarios(id),
  -- El slug del producto, no un id numerico: el dataset se regenera cada dia y los
  -- ids cambian con el; el slug es lo unico estable entre dos scrapes.
  producto   TEXT NOT NULL,
  puntuacion INTEGER NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  texto      TEXT NOT NULL DEFAULT '',
  -- Clave del objeto en R2 (un uuid). NULL si la resena no lleva foto.
  foto       TEXT,
  creado     TEXT NOT NULL DEFAULT (datetime('now')),
  -- Una resena por persona y producto: la segunda sustituye a la primera. Sin esto,
  -- una media de 4,8 la firma una sola persona votando veinte veces.
  UNIQUE (usuario, producto)
);

CREATE INDEX IF NOT EXISTS idx_resenas_producto ON resenas (producto, creado DESC);

-- "Me ha sido util" de cada resena. Una fila por persona y resena, y la clave primaria
-- es justo eso: sin ella, votar veinte veces la misma resena sube veinte puntos.
--
-- ON DELETE CASCADE en los dos lados: borrar una resena desde /admin tiene que llevarse
-- sus votos, y borrar una cuenta los suyos. Sin la cascada, o falla el borrado (las
-- claves foraneas van activadas en D1) o quedan votos apuntando a filas que ya no estan
-- y el recuento sigue contandolos.
--
-- El recuento NO se guarda: sale de un COUNT(*) sobre esta tabla en la misma consulta
-- que lee las resenas, por el mismo motivo por el que la media tampoco se guarda.
CREATE TABLE IF NOT EXISTS votos (
  resena  INTEGER NOT NULL REFERENCES resenas(id) ON DELETE CASCADE,
  usuario INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creado  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (resena, usuario)
);

-- Preguntas y respuestas de la ficha de producto. Una sola tabla para las dos cosas: una
-- respuesta es una pregunta con padre. Dos tablas casi identicas serian dos consultas,
-- dos inserciones y dos sitios donde arreglar el mismo borrado.
--
-- Solo un nivel: se responde a una pregunta, no a una respuesta. Un hilo de hilos
-- necesita sangrados, plegados y moderacion de discusiones, y esto es un tablon de dudas
-- sobre un bote de creatina.
--
-- El producto es el slug, igual que en resenas y por el mismo motivo: los ids del
-- catalogo cambian cada pasada del scraper y el slug no.
CREATE TABLE IF NOT EXISTS preguntas (
  id       INTEGER PRIMARY KEY,
  usuario  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  producto TEXT NOT NULL,
  -- NULL: es una pregunta. Con valor: es la respuesta a esa pregunta, y se va con ella.
  padre    INTEGER REFERENCES preguntas(id) ON DELETE CASCADE,
  texto    TEXT NOT NULL,
  creado   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_preguntas_producto ON preguntas (producto, creado);

-- Avisos de precio: "escribeme si este bote baja de 25 EUR".
--
-- Es lo unico de esta web que sale a buscar al lector en vez de esperarle. El precio NO
-- se guarda aqui: lo mira el repaso (POST /api/alertas/revisar) contra el catalogo
-- publicado, que es el mismo que ve todo el mundo. Una copia de precios en D1 seria una
-- segunda verdad que mantener sincronizada con el scraper.
--
-- `avisado` es la fecha del ultimo correo enviado, y esta para no mandar el mismo aviso
-- cada dos dias mientras el precio siga bajo. Vuelve a NULL en cuanto el precio sube por
-- encima del objetivo: entonces la alerta esta viva otra vez.
CREATE TABLE IF NOT EXISTS alertas (
  usuario  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  producto TEXT NOT NULL,
  objetivo REAL NOT NULL,
  avisado  TEXT,
  creado   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (usuario, producto)
);

-- Ediciones hechas a mano desde /admin. NO es una copia del catalogo: el catalogo sigue
-- viviendo en data/suplementos.sqlite y generandose con el scraper. Aqui solo se guarda
-- LO QUE UNA PERSONA HA CORREGIDO, campo a campo, y el pipeline lo vuelve a aplicar
-- despues de cada pasada del scraper (ediciones.py). Sin esto, el upsert por
-- (tienda, url) machacaria cada correccion manual a la manana siguiente.
--
-- valor es JSON para que un numero siga siendo un numero y NULL siga siendo NULL: una
-- columna TEXT con "3.5" dentro obliga a adivinar el tipo al leerla.
CREATE TABLE IF NOT EXISTS ediciones (
  -- producto | categoria | dosis | config | evidencia | texto
  ambito TEXT NOT NULL,
  -- producto: "tienda|url" (la clave UNIQUE del catalogo, lo unico estable entre
  -- scrapes: el slug se calcula del nombre y cambia en cuanto corriges el nombre).
  -- categoria: la clave interna. dosis/evidencia: el ingrediente. config: "scoring".
  clave  TEXT NOT NULL,
  campo  TEXT NOT NULL,
  valor  TEXT,                        -- JSON del valor nuevo
  motivo TEXT NOT NULL DEFAULT '',
  autor  TEXT NOT NULL DEFAULT '',
  fecha  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (ambito, clave, campo)
);

-- Contador de intentos por IP, para el limite de peticiones. Sin esto, un robot puede
-- probar contrasenas o crear cuentas sin freno: PBKDF2 encarece cada intento (~120 ms),
-- que ya es algo, pero no es un limite.
--
-- La ventana es el minuto en que empieza el tramo (epoch en minutos, redondeado al
-- tamano de la ventana de esa ruta). Guardar el tramo y no la hora exacta es lo que hace
-- que esto sea una fila por IP y tramo en vez de una fila por intento.
--
-- ponytail: ventana fija, no deslizante. El precio conocido es que en el salto de un
-- tramo al siguiente caben dos veces el tope seguidos; para frenar fuerza bruta eso da
-- igual, y una ventana deslizante son N filas por IP en vez de una. El escalon, si algun
-- dia hace falta de verdad, es una regla de rate limiting del WAF de Cloudflare, que
-- corta antes de llegar aqui y no cuesta ni una escritura.
CREATE TABLE IF NOT EXISTS intentos (
  ip      TEXT NOT NULL,
  ruta    TEXT NOT NULL,
  ventana INTEGER NOT NULL,
  n       INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip, ruta, ventana)
);
