-- MIGRACIÓN PARA TAREA DEV-58: MODELO DE ROLES Y USUARIOS
-- 1. Crear tabla de roles
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    prioridad INTEGER NOT NULL
);

-- 2. Insertar roles base
INSERT INTO public.roles (nombre, prioridad) VALUES 
('Admin', 100), 
('Project Manager', 50), 
('User', 10)
ON CONFLICT (nombre) DO NOTHING;

-- 3. Actualizar tabla usuarios con campos de la tarea
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS nombre_completo TEXT,
ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES public.roles(id),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS token TEXT,
ADD COLUMN IF NOT EXISTS token_expiration TIMESTAMP WITH TIME ZONE;