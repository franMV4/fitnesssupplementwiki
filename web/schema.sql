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
