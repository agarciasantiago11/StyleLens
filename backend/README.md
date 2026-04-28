# StyleLens — Backend

StyleLens es una aplicación móvil desarrollada con React Native que permite al usuario fotografiar cualquier prenda de ropa y obtener información sobre su marca, modelo, precio y dónde comprarla. El sistema utiliza inteligencia artificial propia (YOLOv8 para detección y FashionCLIP para análisis de los parámetros visuales de las prendas de la imagen) combinada con búsqueda en base de datos por similitud vectorial. Cuando la similitud con un registro existente supera el umbral mínimo de % de similitud, el resultado se devuelve directamente desde la base de datos. En caso contrario, se realiza una consulta enriquecida a SerpAPI (Google Lens) para obtener resultados reales de tiendas. Este enfoque híbrido minimiza las llamadas a servicios externos y hace que la base de datos aprenda y crezca con el uso.

---

# Estructura del repositorio

El proyecto está dividido en tres repositorios independientes:

```
GitHub/
├── StyleLens-backend/      ← este repositorio (API Python/FastAPI)
├── StyleLens-frontend/     ← app móvil React Native + Expo
└── StyleLens-database/     ← schema SQL, migraciones y scripts
```

# Estructura del backend

```
StyleLens-backend/
│
├── main.py                  ← punto de entrada
├── requirements.txt         ← dependencias
├── .env                     ← variables de entorno (API keys)
├── .env.example             ← plantilla de variables de entorno
│
└── app/
    ├── __init__.py
    ├── database.py          ← conexión PostgreSQL con SQLAlchemy
    ├── models.py            ← tablas de la BD como clases Python
    ├── schemas.py           ← modelos de request/response (Pydantic)
    │
    ├── routes/
    │   ├── __init__.py
    │   ├── detectar.py      ← endpoint POST /detectar
    │   ├── buscar.py        ← endpoint POST /buscar
    │   └── favoritos.py     ← endpoint /favoritos
    │
    └── services/
        ├── __init__.py
        ├── yolo_service.py       ← lógica YOLOv8
        ├── clip_service.py       ← lógica FashionCLIP
        ├── serpapi_service.py    ← lógica SerpAPI
        └── cloudinary_service.py ← subida de imágenes
```

---

# Puesta en marcha

## Requisitos previos
- Python 3.10+
- PostgreSQL con la extensión [pgvector](https://github.com/pgvector/pgvector) instalada
- Cuenta en [Cloudinary](https://cloudinary.com/) y [SerpAPI](https://serpapi.com/)

## 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd StyleLens-backend
```

## 2. Crear y activar entorno virtual

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

## 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

## 4. Configurar variables de entorno

Copia el archivo de ejemplo y rellena tus credenciales:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```
DATABASE_URL=postgresql://usuario:contraseña@localhost/styleLens
SERPAPI_KEY=tu_clave_de_serpapi
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

## 5. Preparar la base de datos

Activa la extensión pgvector en PostgreSQL (requiere coordinación con StyleLens-database):

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Las tablas se crean automáticamente al arrancar la API.

## 6. Arrancar la API

```bash
 uvicorn main:app --host 0.0.0.0 --port 8000 --reload   
```

La API estará disponible en `http://localhost:8000`.
Documentación interactiva en `http://localhost:8000/docs`.
