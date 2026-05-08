-- ==========================================================
-- SEED SCRIPT - STYLELENS
-- Datos de prueba coherentes con el schema actual.
-- UUIDs fijos para que las relaciones sean trazables.
-- Orden respetando claves foráneas.
-- ==========================================================

-- 1. LIMPIEZA (orden inverso a la creación para respetar FKs)
TRUNCATE public.resultados,
         public.detecciones,
         public.busquedas,
         public.favoritos,
         public.prendas_superiores,
         public.prendas_inferiores,
         public.cuerpo_entero,
         public.prendas,
         public.usuarios
CASCADE;
-- roles no se trunca: ya están insertados en schema.sql

-- ==========================================================
-- 2. USUARIOS DE PRUEBA
-- ==========================================================
-- Contraseñas: admin → admin123 | usuario → user123
INSERT INTO public.usuarios (id, email, password_hash, nombre_completo, role_id, is_active) VALUES
('a0000000-0000-0000-0000-000000000001',
 'admin@stylelens.com',
 '$2b$12$ZSaMLVcvPwrmCgQnoGyesO8lBL2u2NAjWlX6bpUfgE8OeygBwSGKS',
 'Admin StyleLens',
 (SELECT id FROM public.roles WHERE nombre = 'Admin'),
 TRUE),
('a0000000-0000-0000-0000-000000000002',
 'usuario@stylelens.com',
 '$2b$12$8KKYIVV1ECcmhO1RrCDr3ul2wdACzSXXeiV0HZOjZDrSnwh.HaDIW',
 'Usuario Test',
 (SELECT id FROM public.roles WHERE nombre = 'User'),
 TRUE);

-- ==========================================================
-- 3. PRENDAS BASE (campos comunes)
-- ==========================================================
INSERT INTO public.prendas (id, nombre, categoria, subcategoria, color, marca, precio, precio_actual, tienda, imagen_url, link, fuente_precio) VALUES
-- Prendas superiores
('b0000000-0000-0000-0000-000000000001', 'Camiseta Oversize Blanca',  'prendas_superiores', 'camisetas',          'blanco', 'Zara',          19.95,  19.95, 'Zara Web',      'https://example.com/zara-tee.jpg',       'https://zara.com/camiseta',        'Zara Web'),
('b0000000-0000-0000-0000-000000000002', 'Camiseta Logo Champion',    'prendas_superiores', 'camisetas',          'gris',   'Champion',      25.00,  25.00, 'JD Sports',     'https://example.com/champion-tee.jpg',   'https://jdsports.com/champion',    'JD Sports'),
('b0000000-0000-0000-0000-000000000003', 'Sudadera Gazelle Hoodie',   'prendas_superiores', 'camisetas',          'negro',  'Adidas',        70.00,  65.00, 'Zalando',       'https://example.com/adidas-hoodie.jpg',  'https://zalando.com/adidas-hoodie','Zalando'),
('b0000000-0000-0000-0000-000000000004', 'Chaqueta Denim',            'prendas_superiores', 'chaquetas_y_abrigos','azul',   'Pull&Bear',     35.99,  35.99, 'Pull&Bear',     'https://example.com/pull-denim.jpg',     'https://pullandbear.com/denim',    'Pull&Bear'),
('b0000000-0000-0000-0000-000000000005', 'Jersey Cashmere Beige',     'prendas_superiores', 'camisetas',          'beige',  'Massimo Dutti', 89.00,  89.00, 'Massimo Dutti', 'https://example.com/md-jersey.jpg',      'https://massimodutti.com/jersey',  'Massimo Dutti'),
-- Prendas inferiores
('b0000000-0000-0000-0000-000000000006', 'Vaquero 501 Original',      'prendas_inferiores', 'pantalones',         'azul',   'Levis',        110.00, 110.00, 'Amazon',        'https://example.com/levis-501.jpg',      'https://amazon.com/levis-501',     'Amazon'),
('b0000000-0000-0000-0000-000000000007', 'Pantalón Cargo Caqui',      'prendas_inferiores', 'pantalones',         'caqui',  'H&M',           29.99,  29.99, 'H&M App',       'https://example.com/hm-cargo.jpg',       'https://hm.com/cargo',             'H&M App'),
('b0000000-0000-0000-0000-000000000008', 'Pantalón Jogger Gris',      'prendas_inferiores', 'pantalones',         'gris',   'Nike',          55.00,  49.99, 'Nike Store',    'https://example.com/nike-jogger.jpg',    'https://nike.com/jogger',          'Nike Store'),
('b0000000-0000-0000-0000-000000000009', 'Vaquero Slim Azul',         'prendas_inferiores', 'pantalones',         'azul',   'Jack & Jones',  45.00,  45.00, 'Jack & Jones',  'https://example.com/jj-slim.jpg',        'https://jackjones.com/slim',       'Jack & Jones'),
('b0000000-0000-0000-0000-000000000010', 'Vaquero Wide Leg',          'prendas_inferiores', 'pantalones',         'azul',   'Zara',          39.95,  39.95, 'Zara Web',      'https://example.com/zara-wide.jpg',      'https://zara.com/wide-leg',        'Zara Web'),
-- Cuerpo entero
('b0000000-0000-0000-0000-000000000011', 'Vestido Lino Blanco',       'cuerpo_entero',      'vestidos',           'blanco', 'Mango',         49.99,  49.99, 'Mango Store',   'https://example.com/mango-vestido.jpg',  'https://mango.com/vestido',        'Mango Store'),
('b0000000-0000-0000-0000-000000000012', 'Vestido Midi Floral',       'cuerpo_entero',      'vestidos',           'floral', 'Zara',          45.95,  39.95, 'Zara Web',      'https://example.com/zara-vestido.jpg',   'https://zara.com/vestido-midi',    'Zara Web');

-- ==========================================================
-- 4. SUBTABLAS JTI — embeddings de prueba (valores fijos)
-- ==========================================================
INSERT INTO public.prendas_superiores (id, embedding) VALUES
('b0000000-0000-0000-0000-000000000001', array_fill(0.1, ARRAY[512])::vector),
('b0000000-0000-0000-0000-000000000002', array_fill(0.1, ARRAY[512])::vector),
('b0000000-0000-0000-0000-000000000003', array_fill(0.1, ARRAY[512])::vector),
('b0000000-0000-0000-0000-000000000004', array_fill(0.1, ARRAY[512])::vector),
('b0000000-0000-0000-0000-000000000005', array_fill(0.1, ARRAY[512])::vector);

INSERT INTO public.prendas_inferiores (id, embedding) VALUES
('b0000000-0000-0000-0000-000000000006', array_fill(0.2, ARRAY[512])::vector),
('b0000000-0000-0000-0000-000000000007', array_fill(0.2, ARRAY[512])::vector),
('b0000000-0000-0000-0000-000000000008', array_fill(0.2, ARRAY[512])::vector),
('b0000000-0000-0000-0000-000000000009', array_fill(0.2, ARRAY[512])::vector),
('b0000000-0000-0000-0000-000000000010', array_fill(0.2, ARRAY[512])::vector);

INSERT INTO public.cuerpo_entero (id, embedding) VALUES
('b0000000-0000-0000-0000-000000000011', array_fill(0.3, ARRAY[512])::vector),
('b0000000-0000-0000-0000-000000000012', array_fill(0.3, ARRAY[512])::vector);

-- ==========================================================
-- 5. FAVORITOS
-- ==========================================================
INSERT INTO public.favoritos (usuario_id, prenda_id) VALUES
('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001'),
('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006');

-- ==========================================================
-- 6. BÚSQUEDA DE PRUEBA
--    Una foto subida por el usuario de prueba.
-- ==========================================================
INSERT INTO public.busquedas (id, usuario_id, imagen_original_url, imagen_hash_original) VALUES
('c0000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000002',
 'https://res.cloudinary.com/stylelens/image/upload/v1/busquedas/foto_prueba.jpg',
 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1');

-- ==========================================================
-- 7. DETECCIONES DE PRUEBA
--    Dos prendas detectadas por YOLO en la misma foto.
-- ==========================================================
INSERT INTO public.detecciones (id, busqueda_id, clase, confianza, bbox_x, bbox_y, bbox_w, bbox_h, recorte_url) VALUES
('d0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000001',
 'long_sleeved_shirt', 0.92,
 0.50, 0.30, 0.40, 0.35,
 'https://res.cloudinary.com/stylelens/image/upload/v1/recortes/recorte_superior.jpg'),
('d0000000-0000-0000-0000-000000000002',
 'c0000000-0000-0000-0000-000000000001',
 'trousers', 0.87,
 0.50, 0.65, 0.35, 0.40,
 'https://res.cloudinary.com/stylelens/image/upload/v1/recortes/recorte_inferior.jpg');

-- ==========================================================
-- 8. RESULTADOS DE PRUEBA
--    Tres productos por cada detección, ordenados por rank.
-- ==========================================================
INSERT INTO public.resultados (deteccion_id, prenda_id, rank, similitud_score, fuente) VALUES
-- Resultados de la detección de prenda superior
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 1, 0.95, 'serpapi'),
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 2, 0.88, 'serpapi'),
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 3, 0.81, 'serpapi'),
-- Resultados de la detección de prenda inferior
('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', 1, 0.93, 'serpapi'),
('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000007', 2, 0.85, 'serpapi'),
('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000009', 3, 0.79, 'serpapi');

-- ==========================================================
-- QUERIES DE VERIFICACIÓN (comentadas, para lanzar manualmente)
-- ==========================================================

-- PRUEBA 1: Búsquedas del usuario con sus detecciones
/*
SELECT b.id AS busqueda_id, b.imagen_original_url, b.created_at,
       d.clase, d.confianza, d.recorte_url
FROM public.busquedas b
JOIN public.detecciones d ON d.busqueda_id = b.id
WHERE b.usuario_id = 'a0000000-0000-0000-0000-000000000002'
ORDER BY b.created_at DESC, d.clase;
*/

-- PRUEBA 2: Resultados de una detección concreta
/*
SELECT d.clase, r.rank, r.similitud_score, r.fuente,
       p.nombre, p.marca, p.precio_actual, p.tienda
FROM public.detecciones d
JOIN public.resultados r ON r.deteccion_id = d.id
JOIN public.prendas p    ON p.id = r.prenda_id
WHERE d.id = 'd0000000-0000-0000-0000-000000000001'
ORDER BY r.rank;
*/

-- PRUEBA 3: Similitud vectorial sobre prendas superiores
/*
SELECT p.nombre, p.marca,
       (1 - (ps.embedding <=> array_fill(0.1, ARRAY[512])::vector)) AS similitud
FROM public.prendas_superiores ps
JOIN public.prendas p ON p.id = ps.id
ORDER BY similitud DESC
LIMIT 5;
*/