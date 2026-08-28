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
