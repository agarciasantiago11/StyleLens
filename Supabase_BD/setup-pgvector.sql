-- Tarea DEV-11: Integración inicial de pgvector
-- Este script activa la extensión y verifica el motor de búsqueda vectorial

-- 1. Activación de la extensión en el esquema actual
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Creación de tabla de prueba para validación de búsqueda semántica
CREATE TABLE test_operatividad (
    id serial PRIMARY KEY,
    nombre_prenda text,
    embedding vector(3) -- Vector de prueba de 3 dimensiones
);

-- 3. Inserción de datos (Representación numérica de ropa)
INSERT INTO test_operatividad (nombre_prenda, embedding) VALUES 
('Camiseta Roja', '[0.9, 0.1, 0.1]'),
('Pantalón Azul', '[0.1, 0.2, 0.9]');

-- 4. Verificación de búsqueda por Distancia de Coseno
-- Si devuelve la 'Camiseta Roja', el motor vectorial está OK
SELECT nombre_prenda 
FROM test_operatividad 
ORDER BY embedding <=> '[0.8, 0.2, 0.1]' 
LIMIT 1;