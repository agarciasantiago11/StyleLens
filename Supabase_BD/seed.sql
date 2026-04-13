-- 1. LIMPIEZA (Opcional, por si quieres empezar de cero)
-- DELETE FROM public.prendas;

-- 2. INSERTAR 20 PRENDAS EN LA TABLA BASE
INSERT INTO public.prendas (id, nombre, marca, precio_actual, imagen_url, fuente_precio) VALUES
(gen_random_uuid(), 'Air Force 1', 'Nike', 119.99, 'https://example.com/nike-af1.jpg', 'Nike Store'),
(gen_random_uuid(), '501 Original Fit', 'Levis', 110.00, 'https://example.com/levis-501.jpg', 'Amazon'),
(gen_random_uuid(), 'Camiseta Oversize', 'Zara', 19.95, 'https://example.com/zara-tee.jpg', 'Zara Web'),
(gen_random_uuid(), 'Stan Smith', 'Adidas', 95.00, 'https://example.com/adidas-stan.jpg', 'Adidas Official'),
(gen_random_uuid(), 'Sudadera Gazelle', 'Adidas', 70.00, 'https://example.com/adidas-hoodie.jpg', 'Zalando'),
(gen_random_uuid(), 'Chaqueta Denim', 'Pull&Bear', 35.99, 'https://example.com/pull-denim.jpg', 'Pull&Bear'),
(gen_random_uuid(), 'Pantalón Cargo', 'H&M', 29.99, 'https://example.com/hm-cargo.jpg', 'H&M App'),
(gen_random_uuid(), 'Jersey Cashmere', 'Massimo Dutti', 89.00, 'https://example.com/md-jersey.jpg', 'Massimo Dutti'),
(gen_random_uuid(), 'Zapatilla Old Skool', 'Vans', 75.00, 'https://example.com/vans-old.jpg', 'Vans Store'),
(gen_random_uuid(), 'Camiseta Logo', 'Champion', 25.00, 'https://example.com/champion-tee.jpg', 'JD Sports'),
(gen_random_uuid(), 'Vaquero Slim', 'Jack & Jones', 45.00, 'https://example.com/jj-slim.jpg', 'Jack & Jones'),
(gen_random_uuid(), 'Zapatilla Chuck 70', 'Converse', 90.00, 'https://example.com/converse-70.jpg', 'Converse Web'),
(gen_random_uuid(), 'Camiseta Rayas', 'Stradivarius', 12.99, 'https://example.com/strad-tee.jpg', 'Stradivarius'),
(gen_random_uuid(), 'Pantalón Jogger', 'Nike', 55.00, 'https://example.com/nike-jogger.jpg', 'Nike Store'),
(gen_random_uuid(), 'Bamba Samba', 'Adidas', 120.00, 'https://example.com/adidas-samba.jpg', 'Foot Locker'),
(gen_random_uuid(), 'Sobrecamisa Pana', 'Bershka', 29.99, 'https://example.com/bershka-pana.jpg', 'Bershka'),
(gen_random_uuid(), 'Vaquero Wide Leg', 'Zara', 39.95, 'https://example.com/zara-wide.jpg', 'Zara Web'),
(gen_random_uuid(), 'Zapatilla New Balance 550', 'New Balance', 150.00, 'https://example.com/nb-550.jpg', 'NB Official'),
(gen_random_uuid(), 'Camiseta Lino', 'Mango', 25.99, 'https://example.com/mango-lino.jpg', 'Mango Store'),
(gen_random_uuid(), 'Pantalón Chino', 'Dockers', 89.00, 'https://example.com/dockers-chino.jpg', 'El Corte Inglés');

-- 3. ASIGNAR CATEGORÍAS (Especialización)
-- Nota: Para simplificar, usaremos subconsultas para encontrar los IDs que acabamos de crear

-- Insertar Camisetas
INSERT INTO public.camisetas (prenda_id, color, material, embedding_vector)
SELECT id, 'Blanco', 'Algodón', array_fill(0.1, ARRAY[512])::vector FROM public.prendas WHERE nombre ILIKE '%Camiseta%';

-- Insertar Pantalones
INSERT INTO public.pantalones (prenda_id, color, corte, embedding_vector)
SELECT id, 'Azul', 'Recto', array_fill(0.2, ARRAY[512])::vector FROM public.prendas WHERE nombre ILIKE '%Pantalón%' OR nombre ILIKE '%Vaquero%';

-- Insertar Calzado
INSERT INTO public.calzado (prenda_id, color, tipo_suela, embedding_vector)
SELECT id, 'Multicolor', 'Goma', array_fill(0.3, ARRAY[512])::vector FROM public.prendas WHERE nombre ILIKE '%Zapatilla%' OR nombre ILIKE '%Stan Smith%' OR nombre ILIKE '%Air Force%';