-- ============================================================
-- STYLELENS — SCHEMA
-- Herencia de tabla unida (JTI): la tabla 'prendas' almacena
-- los campos comunes; cada categoría tiene su propia subtabla
-- con el vector embedding para búsqueda semántica independiente.
-- ============================================================

-- 1. EXTENSIÓN VECTORIAL (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 2. ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
    id        SERIAL PRIMARY KEY,
    nombre    TEXT    NOT NULL UNIQUE,
    prioridad INTEGER NOT NULL
);


-- ============================================================
-- 3. USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email            TEXT UNIQUE NOT NULL,
    password_hash    TEXT NOT NULL,
    fecha_registro   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nombre_completo  TEXT,
    role_id          INTEGER REFERENCES public.roles(id),
    is_active        BOOLEAN DEFAULT TRUE,
    token            TEXT,
    token_expiration TIMESTAMP WITH TIME ZONE,
    otp_hash         TEXT,
    otp_expiration   TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- 4. PRENDAS — tabla base (campos comunes)
--    El embedding vectorial reside en cada subtabla JTI para
--    que la búsqueda opere solo sobre la categoría detectada.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prendas (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre        TEXT NOT NULL,
    categoria     TEXT,          -- prendas_superiores | prendas_inferiores | cuerpo_entero
    subcategoria  TEXT,          -- camisetas | chaquetas_y_abrigos | pantalones | shorts | faldas | vestidos
    color         TEXT,
    marca         TEXT,
    precio        DOUBLE PRECISION,
    precio_actual DECIMAL(10, 2),
    tienda        TEXT,
    imagen_url    TEXT,
    link          TEXT,
    imagen_hash   TEXT,
    cloudinary_url TEXT,
    fuente_precio TEXT
);

CREATE INDEX IF NOT EXISTS ix_prendas_imagen_hash ON public.prendas (imagen_hash);
CREATE INDEX IF NOT EXISTS ix_prendas_categoria   ON public.prendas (categoria);

-- ============================================================
-- 5. SUBTABLAS JTI (una por categoría YOLO)
--    Cada tabla tiene:
--      · id        → FK a prendas.id (PK compartida, patrón JTI)
--      · embedding → vector(512) para búsqueda semántica exclusiva
--                    de esa categoría (sin escanear toda la tabla base)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prendas_superiores (
    id UUID PRIMARY KEY REFERENCES public.prendas(id) ON DELETE CASCADE,
    embedding vector(512)
);

CREATE TABLE IF NOT EXISTS public.prendas_inferiores (
    id UUID PRIMARY KEY REFERENCES public.prendas(id) ON DELETE CASCADE,
    embedding vector(512)
);

CREATE TABLE IF NOT EXISTS public.cuerpo_entero (
    id UUID PRIMARY KEY REFERENCES public.prendas(id) ON DELETE CASCADE,
    embedding vector(512)
);

-- Índices HNSW para búsqueda vectorial por similitud de coseno en O(log n).
-- Sin estos, cada búsqueda haría un escaneo secuencial de todos los embeddings.
CREATE INDEX IF NOT EXISTS idx_superiores_embedding
    ON public.prendas_superiores USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_inferiores_embedding
    ON public.prendas_inferiores USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_cuerpo_entero_embedding
    ON public.cuerpo_entero USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- 6. FAVORITOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.favoritos (
    usuario_id     UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    prenda_id      UUID REFERENCES public.prendas(id)  ON DELETE CASCADE,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (usuario_id, prenda_id)
);
-- ============================================================
-- 7. BÚSQUEDAS
--    Representa cada vez que un usuario sube una foto.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.busquedas (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id           UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    imagen_original_url  TEXT,                                        -- URL en Cloudinary de la foto original
    imagen_hash_original TEXT,                                        -- SHA256 de la imagen original (caché)
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_busquedas_usuario_id           ON public.busquedas (usuario_id);
CREATE INDEX IF NOT EXISTS ix_busquedas_imagen_hash_original ON public.busquedas (imagen_hash_original);

-- ============================================================
-- 8. DETECCIONES
--    Cada prenda detectada por YOLO dentro de una búsqueda.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.detecciones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    busqueda_id UUID NOT NULL REFERENCES public.busquedas(id) ON DELETE CASCADE,
    clase       TEXT,                   -- etiqueta YOLO de la prenda detectada (ej. "trousers")
    confianza   FLOAT,                  -- puntuación de confianza del modelo (0.0 – 1.0)
    bbox_x      FLOAT,                  -- coordenada X del centro del bounding box (normalizada 0-1)
    bbox_y      FLOAT,                  -- coordenada Y del centro del bounding box (normalizada 0-1)
    bbox_w      FLOAT,                  -- ancho del bounding box (normalizado 0-1)
    bbox_h      FLOAT,                  -- alto del bounding box (normalizado 0-1)
    recorte_url TEXT,                   -- URL en Cloudinary del recorte de la prenda detectada
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_detecciones_busqueda_id ON public.detecciones (busqueda_id);

-- ============================================================
-- 9. RESULTADOS
--    Productos encontrados para cada detección (M:1 con prendas).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.resultados (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deteccion_id     UUID NOT NULL REFERENCES public.detecciones(id) ON DELETE CASCADE,
    prenda_id        UUID NOT NULL REFERENCES public.prendas(id)     ON DELETE CASCADE,
    rank             INTEGER,    -- posición del resultado dentro de la detección (1 = más relevante)
    similitud_score  FLOAT,      -- puntuación de similitud vectorial con la prenda detectada (0.0 – 1.0)
    fuente           TEXT,       -- origen del resultado: "cache", "serpapi" o "vectorial"
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_resultados_deteccion_id ON public.resultados (deteccion_id);
CREATE INDEX IF NOT EXISTS ix_resultados_prenda_id    ON public.resultados (prenda_id);