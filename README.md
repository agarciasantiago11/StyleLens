# StyleLens — Backend

StyleLens es una aplicación móvil desarrollada con React Native que permite al usuario fotografiar cualquier prenda de ropa y obtener información sobre su marca, modelo, precio y dónde comprarla. El sistema utiliza inteligencia artificial propia (YOLOv8 para detección y FashionCLIP para análisis de los parámetros visuales de las prendas de la imagen) combinada con búsqueda en base de datos por similitud vectorial. Cuando la similitud con un registro existente supera el umbral mínimo de % de similitud, el resultado se devuelve directamente desde la base de datos. En caso contrario, se realiza una consulta enriquecida a SerpAPI (Google Lens) para obtener resultados reales de tiendas. Este enfoque híbrido minimiza las llamadas a servicios externos y hace que la base de datos aprenda y crezca con el uso.

---

# Estructura del repositorio

El proyecto está dividido en tres repositorios independientes:

StyleLens/
├── StyleLens-backend/      ← este repositorio (API Python/FastAPI)
├── StyleLens-frontend/     ← app móvil React Native + Expo
└── StyleLens-database/     ← schema SQL, migraciones y scripts
