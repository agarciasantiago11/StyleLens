-- 1. Habilitamos la extensión de vectores para la IA
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;

-- 2. Tabla de Usuarios
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Prendas (Base)
CREATE TABLE public.prendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    marca TEXT,
    precio_actual DECIMAL(10, 2),
    imagen_url TEXT,
    fuente_precio TEXT
);

-- 4. Relaciones (Favoritos y Búsquedas)
CREATE TABLE public.favoritos (
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    prenda_id UUID REFERENCES public.prendas(id) ON DELETE CASCADE,
    fecha_guardado TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (usuario_id, prenda_id)
);

CREATE TABLE public.busquedas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    foto_usuario_url TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.resultados_busqueda (
    busqueda_id UUID REFERENCES public.busquedas(id) ON DELETE CASCADE,
    prenda_id UUID REFERENCES public.prendas(id) ON DELETE CASCADE,
    similitud_score FLOAT,
    PRIMARY KEY (busqueda_id, prenda_id)
);

-- 5. Especializaciones (Camisetas, Pantalones, Calzado)
CREATE TABLE public.camisetas (
    prenda_id UUID PRIMARY KEY REFERENCES public.prendas(id) ON DELETE CASCADE,
    embedding_vector extensions.vector(512), 
    color TEXT,
    material TEXT
);

CREATE TABLE public.pantalones (
    prenda_id UUID PRIMARY KEY REFERENCES public.prendas(id) ON DELETE CASCADE,
    embedding_vector extensions.vector(512),
    color TEXT,
    corte TEXT
);

CREATE TABLE public.calzado (
    prenda_id UUID PRIMARY KEY REFERENCES public.prendas(id) ON DELETE CASCADE,
    embedding_vector extensions.vector(512),
    tipo_suela TEXT,
    color TEXT
);