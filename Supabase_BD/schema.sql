-- 1. EXTENSIÓN VECTORIAL (pgvector)
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;
 
-- ============================================================
-- 2. ROLES (DEV-58)
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
-- 3. USUARIOS (DEV-58)
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
-- 4. PRENDAS (tabla base)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prendas (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre        TEXT NOT NULL,
    marca         TEXT,
    precio_actual DECIMAL(10, 2),
    imagen_url    TEXT,
    fuente_precio TEXT
);
 
-- ============================================================
-- 5. FAVORITOS Y BÚSQUEDAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.favoritos (
    usuario_id     UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    prenda_id      UUID REFERENCES public.prendas(id)  ON DELETE CASCADE,
    fecha_guardado TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (usuario_id, prenda_id)
);
 
CREATE TABLE IF NOT EXISTS public.busquedas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    foto_usuario_url TEXT,
    fecha           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
 
CREATE TABLE IF NOT EXISTS public.resultados_busqueda (
    busqueda_id     UUID REFERENCES public.busquedas(id) ON DELETE CASCADE,
    prenda_id       UUID REFERENCES public.prendas(id)   ON DELETE CASCADE,
    similitud_score FLOAT,
    PRIMARY KEY (busqueda_id, prenda_id)
);
 
-- ============================================================
-- 6. ESPECIALIZACIONES DE PRENDAS (con embedding vector(512))
-- ============================================================
CREATE TABLE IF NOT EXISTS public.camisetas (
    prenda_id       UUID PRIMARY KEY REFERENCES public.prendas(id) ON DELETE CASCADE,
    embedding       extensions.vector(512),
    color           TEXT,
    material        TEXT
);
 
CREATE TABLE IF NOT EXISTS public.pantalones (
    prenda_id       UUID PRIMARY KEY REFERENCES public.prendas(id) ON DELETE CASCADE,
    embedding       extensions.vector(512),
    color           TEXT,
    corte           TEXT
);
 
CREATE TABLE IF NOT EXISTS public.calzado (
    prenda_id       UUID PRIMARY KEY REFERENCES public.prendas(id) ON DELETE CASCADE,
    embedding       extensions.vector(512),
    tipo_suela      TEXT,
    color           TEXT
);
 
CREATE TABLE IF NOT EXISTS public.otros (
    prenda_id       UUID PRIMARY KEY REFERENCES public.prendas(id) ON DELETE CASCADE,
    embedding       extensions.vector(512),
    color           TEXT,
    material        TEXT
);