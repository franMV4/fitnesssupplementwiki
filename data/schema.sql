-- Esquema del comparador. Idempotente: se puede aplicar tantas veces como quieras.
-- ponytail: sin sistema de migraciones. CREATE IF NOT EXISTS basta hasta que haya
-- datos en produccion que no se puedan regenerar con el scraper.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS producto (
  id                    INTEGER PRIMARY KEY,
  marca                 TEXT NOT NULL,
  nombre                TEXT NOT NULL,
  categoria             TEXT NOT NULL,          -- creatina | preentreno | ...
  tienda                TEXT NOT NULL,          -- hsn | prozis | myprotein | ...
  url                   TEXT NOT NULL,
  -- El omega 3 y los multivitaminicos se venden en capsulas, no en gramos: uno de los
  -- dos puede faltar, pero no los dos, o el producto no se puede comparar con nada.
  formato_gramos        REAL CHECK (formato_gramos IS NULL OR formato_gramos > 0),
  unidades              REAL CHECK (unidades IS NULL OR unidades > 0),
  servicios_por_envase  REAL,
  precio_eur            REAL NOT NULL CHECK (precio_eur > 0),
  -- columnas generadas nativas: nunca se pueden desincronizar del precio/formato
  precio_por_kg         REAL GENERATED ALWAYS AS (precio_eur / (formato_gramos / 1000.0)) STORED,
  precio_por_unidad     REAL GENERATED ALWAYS AS (precio_eur / unidades) STORED,
  forma                 TEXT,                   -- monohidrato | hcl | kre_alkalyn | ...
  imagen                TEXT,                   -- URL en la CDN de la tienda; no se descarga
  -- Lo que opinan los compradores EN LA TIENDA que lo vende (aggregateRating de
  -- schema.org), normalizado siempre a 5 aunque la tienda puntue sobre 10.
  valoracion            REAL CHECK (valoracion IS NULL OR valoracion BETWEEN 0 AND 5),
  n_valoraciones        INTEGER CHECK (n_valoraciones IS NULL OR n_valoraciones >= 0),
  -- Fraccion del envase que ES el activo segun la TABLA de esta ficha (0-1). Cuando
  -- existe, manda sobre la pureza tipica de la categoria: es el dato real de ESTE bote.
  pureza_real           REAL CHECK (pureza_real IS NULL OR (pureza_real > 0 AND pureza_real <= 1)),
  -- JSON con los tipos de aditivo declarados en la etiqueta. NULL = la ficha no publica
  -- la lista de ingredientes, que no es lo mismo que publicarla sin aditivos ("[]").
  aditivos              TEXT CHECK (aditivos IS NULL OR json_valid(aditivos)),
  -- La declaracion de ingredientes tal cual la publica la etiqueta. Se guarda el TEXTO y
  -- no solo lo que se dedujo de el, porque los requisitos de cada categoria
  -- (scoring/requisitos.py) se afinan a mano y hay que poder repuntuar sin rescrapear
  -- las 3.000 fichas. Ademas es lo que la ficha ensena al lector.
  lista_ingredientes    TEXT,
  -- La descripcion que la tienda publica de ESTE producto (el `description` de su
  -- schema.org). Es donde vive lo que el nombre no cabe: la forma quimica, el peso
  -- molecular, las UFC, el ratio del extracto. Sin ella, los requisitos que piden un
  -- dato declarado no se pueden juzgar y no cuentan.
  descripcion           TEXT,
  fecha_scrape          TEXT NOT NULL,          -- ISO-8601
  UNIQUE (tienda, url),                         -- clave del upsert idempotente (fase 1)
  -- Algo que medir hace falta: gramos, capsulas o al menos servicios por envase
  -- (Myprotein vende preentrenos que solo declaran "30raciones"). Sin ninguna de las
  -- tres el producto no se puede comparar con nadie.
  CHECK (formato_gramos IS NOT NULL OR unidades IS NOT NULL
         OR servicios_por_envase IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS ingrediente_producto (
  producto_id           INTEGER NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
  ingrediente           TEXT NOT NULL,          -- normalizado: citrulina_malato, beta_alanina...
  dosis_por_servicio_mg REAL,
  PRIMARY KEY (producto_id, ingrediente)
);

CREATE TABLE IF NOT EXISTS certificacion (
  id                    INTEGER PRIMARY KEY,
  producto_id           INTEGER NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
  tipo                  TEXT NOT NULL CHECK (tipo IN (
                          'creapure','informed_sport','informed_choice','ifos',
                          'nsf','analisis_marca','etiqueta')),
  -- 4 = verificado contra fuente oficial (codigo QS, lote Informed Sport, IFOS)
  -- 3 = analisis de laboratorio publicado por la propia marca (parte interesada)
  -- 2 = declarado en ficha/etiqueta, sin verificacion posible
  -- 1 = nada
  nivel_verificacion    INTEGER NOT NULL CHECK (nivel_verificacion BETWEEN 1 AND 4),
  codigo_qs             TEXT,
  url_evidencia         TEXT,
  verificado_fecha      TEXT,
  verificado_por        TEXT CHECK (verificado_por IN ('auto','manual')),
  -- nivel 4 exige prueba contra fuente: codigo QS o url de evidencia. Sin eso, no es nivel 4.
  CHECK (nivel_verificacion < 4 OR codigo_qs IS NOT NULL OR url_evidencia IS NOT NULL),
  CHECK (nivel_verificacion < 3 OR verificado_fecha IS NOT NULL),
  UNIQUE (producto_id, tipo)
);

CREATE TABLE IF NOT EXISTS dosis_referencia (
  ingrediente            TEXT PRIMARY KEY,
  dosis_efectiva_min_mg  REAL NOT NULL,
  dosis_efectiva_max_mg  REAL,
  -- Fraccion del bote que ES el activo (0-1). Un kilo de concentrado de suero no es un
  -- kilo de proteina. NULL = el bote es el activo (creatina, glutamina).
  pureza_tipica          REAL CHECK (pureza_tipica IS NULL OR
                                     (pureza_tipica > 0 AND pureza_tipica <= 1)),
  forma_preferida        TEXT,
  nivel_evidencia        TEXT NOT NULL CHECK (nivel_evidencia IN ('alta','media','baja')),
  fuentes                TEXT NOT NULL CHECK (json_valid(fuentes))  -- JSON: [{"cita":..,"url":..}]
);

CREATE TABLE IF NOT EXISTS score (
  producto_id              INTEGER PRIMARY KEY REFERENCES producto(id) ON DELETE CASCADE,
  score_calidad            REAL NOT NULL,
  coste_por_dosis_efectiva REAL,
  flag_infradosaje         INTEGER NOT NULL DEFAULT 0 CHECK (flag_infradosaje IN (0,1)),
  score_final              REAL NOT NULL,
  -- De los requisitos de su categoria que se le han podido juzgar, cuantos cumple (0-100).
  -- NULL = su ficha no publica lo suficiente para juzgar ninguno; no es un cero.
  score_requisitos         REAL CHECK (score_requisitos IS NULL OR
                                       score_requisitos BETWEEN 0 AND 100),
  -- JSON con cada requisito juzgado y su si/no, para que la ficha los enseñe uno a uno.
  requisitos               TEXT CHECK (requisitos IS NULL OR json_valid(requisitos)),
  desglose                 TEXT CHECK (desglose IS NULL OR json_valid(desglose)),
  fecha_calculo            TEXT NOT NULL
);

-- Un precio por producto y dia. Es el unico dato del proyecto que NO se puede reconstruir
-- despues: ninguna tienda publica lo que costaba algo el mes pasado. De aqui salen la
-- grafica de la ficha, el minimo historico y, el dia que existan, las alertas de bajada.
-- ON DELETE CASCADE a proposito: si el producto desaparece del catalogo su historia se va
-- con el, porque la serie de algo que ya no se puede comprar no le sirve a nadie.
-- ponytail: ~2.700 filas al dia, un millon al ano. SQLite ni se entera; si algun dia
-- molesta, el salto es resumir lo que pase de un ano a una fila por semana.
CREATE TABLE IF NOT EXISTS precio_historico (
  producto_id  INTEGER NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
  fecha        TEXT NOT NULL,                    -- ISO-8601, un solo apunte por dia
  precio_eur   REAL NOT NULL CHECK (precio_eur > 0),
  PRIMARY KEY (producto_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_producto_categoria ON producto(categoria);
