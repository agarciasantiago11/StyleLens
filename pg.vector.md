# Investigación Técnica: Integración de pgvector para Búsqueda Visual

Este documento detalla la investigación y fundamentación técnica sobre el uso de la extensión `pgvector` en PostgreSQL (Supabase) para el sistema de categorización y búsqueda semántica de prendas de ropa.

## 1. Introducción a las Bases de Datos Vectoriales
En un sistema de búsqueda tradicional, los datos se consultan mediante coincidencias exactas (ej. buscar la palabra "Camiseta"). Sin embargo, en un proyecto de búsqueda visual, necesitamos que la base de datos comprenda el **contenido** de una imagen.

`pgvector` transforma nuestra base de datos relacional en una **base de datos vectorial**, capaz de almacenar y operar con representaciones matemáticas de imágenes.

## 2. Funcionamiento Interno: El Concepto de Embedding
El proceso comienza con la conversión de las imágenes en **embeddings**. Un embedding es una representación numérica (un vector de $N$ dimensiones) que captura las características visuales de una prenda (color, forma, textura, tipo de cuello).

- **Espacio Latente:** Las imágenes se posicionan en un mapa multidimensional. 
- **Semántica Visual:** Aquellas prendas que visualmente se parecen entre sí, se ubican en coordenadas cercanas dentro de este espacio.


## 3. Métrica de Comparación: Similitud de Coseno
Para determinar qué prendas del catálogo son similares a la búsqueda del usuario, el motor de la base de datos no busca "palabras", sino que calcula la **proximidad geométrica** entre vectores. 

La métrica utilizada es la **Similitud de Coseno** (`<=>`). Matemáticamente, esta operación mide el coseno del ángulo entre el vector de consulta ($A$) y los vectores almacenados ($B$):

$$\text{similitud} = \cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$

- Un ángulo de **0°** (coseno = 1) indica que las imágenes son idénticas.
- Esto permite encontrar "pantalones de lino azul" basándose en su firma numérica, incluso si las etiquetas de texto son diferentes.


## 4. Optimización con Índices HNSW
Realizar una comparación contra millones de registros en cada búsqueda sería ineficiente. Para garantizar una