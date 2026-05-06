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

INSERT INTO public.roles (nombre, prioridad) VALUES
    ('Admin',           100),
    ('Project Manager',  50),
    ('User',             10)
ON CONFLICT (nombre) DO NOTHING;

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
--      · prenda_id  → FK a prendas.id (PK compartida, patrón JTI)
--      · embedding  → vector(512) para búsqueda semántica exclusiva
--                     de esa categoría (sin escanear toda la tabla base)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prendas_superiores (
    prenda_id UUID PRIMARY KEY REFERENCES public.prendas(id) ON DELETE CASCADE,
    embedding vector(512)
);

CREATE TABLE IF NOT EXISTS public.prendas_inferiores (
    prenda_id UUID PRIMARY KEY REFERENCES public.prendas(id) ON DELETE CASCADE,
    embedding vector(512)
);

CREATE TABLE IF NOT EXISTS public.cuerpo_entero (
    prenda_id UUID PRIMARY KEY REFERENCES public.prendas(id) ON DELETE CASCADE,
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
    fecha_guardado TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (usuario_id, prenda_id)
);
