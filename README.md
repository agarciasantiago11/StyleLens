# StyleLens

StyleLens es una aplicación móvil que permite fotografiar cualquier prenda de ropa y obtener información sobre su marca, modelo, precio y dónde comprarla. Combina detección de objetos con IA (YOLOv8), análisis de características visuales (FashionCLIP) y búsqueda vectorial por similitud. Cuando la similitud con un registro existente supera el umbral configurado, el resultado se devuelve directamente desde la base de datos; si no, se lanza una consulta enriquecida a SerpAPI (Google Lens). Este enfoque híbrido minimiza las llamadas a servicios externos y hace que la base de datos crezca con el uso.

---

## Arquitectura general

```
┌─────────────────────────────────────────────────────┐
│                  App móvil (React Native + Expo)    │
│  expo-router · zustand · axios · expo-image-picker  │
└────────────────────────┬────────────────────────────┘
                         │ HTTP REST (JSON)
                         ▼
┌─────────────────────────────────────────────────────┐
│              API (Python · FastAPI)                 │
│                                                     │
│  POST /api/v1/detectar  ─→  YOLOv8                 │
│                              └─→ recorte por prenda │
│                                                     │
│  POST /api/v1/buscar    ─→  FashionCLIP (embed.)   │
│                              └─→ búsqueda vectorial │
│                                    ↓ (sin match)    │
│                              SerpAPI / Google Lens  │
│                                                     │
│  /api/v1/auth           ─→  JWT + OTP por email    │
│  /api/v1/favoritos      ─→  CRUD favoritos          │
│  /api/v1/capturas       ─→  historial de búsquedas  │
│  /api/v1/prendas        ─→  catálogo de prendas     │
│  /api/v1/users          ─→  gestión de usuarios     │
└──────────┬──────────────────────────┬───────────────┘
           │ SQLAlchemy (ORM)         │ HTTP
           ▼                         ▼
┌──────────────────┐       ┌──────────────────────┐
│  PostgreSQL      │       │  Servicios externos   │
│  + pgvector      │       │  · Cloudinary (imgs)  │
│                  │       │  · SerpAPI            │
│  prendas         │       │  · SMTP (OTP email)   │
│  prendas_sup.    │       └──────────────────────┘
│  prendas_inf.    │
│  cuerpo_entero   │
│  usuarios        │
│  roles           │
│  busquedas       │
│  detecciones     │
│  resultados      │
│  favoritos       │
│  requests (OTP)  │
└──────────────────┘
```

### Flujo de una búsqueda

1. El usuario hace una foto desde la app.
2. La app envía la imagen a `POST /api/v1/detectar` → YOLOv8 detecta las prendas y devuelve recortes con su bounding box.
3. Cada recorte se envía a `POST /api/v1/buscar` → FashionCLIP genera un embedding vectorial de 512 dimensiones.
4. Se busca en la tabla correspondiente (superiores / inferiores / cuerpo entero) por similitud coseno con `pgvector`.
5. Si la similitud supera el umbral, se devuelve el resultado de BD (**cache vectorial**). Si no, se consulta SerpAPI, se guarda el resultado en BD y se devuelve al cliente.
6. Los resultados se muestran en la app con precio, tienda y enlace de compra.

### Modelo de datos (tablas clave)

| Tabla | Descripción |
|---|---|
| `prendas` | Tabla base (JTI). Campos comunes: nombre, categoría, color, marca, precio, URLs. |
| `prendas_superiores` | Hereda `prendas`. Añade `embedding vector(512)`. |
| `prendas_inferiores` | Hereda `prendas`. Añade `embedding vector(512)`. |
| `cuerpo_entero` | Hereda `prendas`. Añade `embedding vector(512)`. |
| `usuarios` | Autenticación propia con JWT. Incluye rol y estado activo. |
| `roles` | Sistema de roles (admin, project manager, usuario). |
| `busquedas` | Registro de cada sesión de búsqueda de un usuario. |
| `detecciones` | Cada prenda detectada por YOLO dentro de una búsqueda. |
| `resultados` | Prendas devueltas por búsqueda vectorial o SerpAPI para cada detección. |
| `favoritos` | Relación M:N entre usuarios y prendas. |
| `requests` | Solicitudes de acceso y tokens OTP para registro/cambio de contraseña. |

### Pantallas de la app

| Pantalla | Ruta |
|---|---|
| Inicio (cámara / búsqueda) | `(tabs)/index.tsx` |
| Historial de capturas | `(tabs)/capturas.tsx` |
| Favoritos | `(tabs)/favoritos.tsx` |
| Configuración | `(tabs)/configuracion.tsx` |
| Panel de administración | `(tabs)/admin-panel.tsx` |
| Soporte | `(tabs)/soporte.tsx` |
| Contacto | `(tabs)/contacto.tsx` |
| Acerca de | `(tabs)/acerca.tsx` |
| Sign in | `sign-in.tsx` |
| Registro | `registro.tsx` |
| Reset de contraseña | `reset-password.tsx` |

---

## Estructura del repositorio

```
StyleLens/
│
├── README.md                    ← este archivo
│
├── backend/                     ← API Python · FastAPI
│   ├── main.py                  ← punto de entrada, routers, CORS, healthcheck
│   ├── requirements.txt
│   ├── .env                     ← credenciales (no commitear)
│   │
│   └── app/
│       ├── config.py            ← configuración centralizada
│       ├── database.py          ← conexión PostgreSQL (SQLAlchemy)
│       ├── models.py            ← tablas ORM (JTI para prendas)
│       ├── schemas.py           ← modelos Pydantic (request/response)
│       ├── auth_deps.py         ← dependencias de autenticación JWT
│       ├── auth_utils.py        ← hashing, tokens
│       ├── upload_utils.py      ← utilidades de subida de imágenes
│       │
│       ├── routes/
│       │   ├── auth.py          ← /api/v1/auth  (login, registro, OTP)
│       │   ├── detectar.py      ← /api/v1/detectar
│       │   ├── buscar.py        ← /api/v1/buscar
│       │   ├── prendas.py       ← /api/v1/prendas
│       │   ├── favoritos.py     ← /api/v1/favoritos
│       │   ├── capturas.py      ← /api/v1/capturas
│       │   ├── users.py         ← gestión de usuarios
│       │   └── soporte.py       ← soporte / tickets
│       │
│       └── services/
│           ├── yolo_service.py          ← detección YOLOv8
│           ├── fashionclip_service.py   ← embeddings FashionCLIP
│           ├── serpapi_service.py       ← Google Lens vía SerpAPI
│           ├── cloudinary_service.py    ← subida de imágenes
│           └── email_service.py         ← envío de OTP por email
│
└── frontend/
    └── FrontStylens/            ← App React Native · Expo SDK 54
        ├── package.json
        ├── app.json
        │
        └── app/
            ├── _layout.tsx      ← layout raíz (fonts, splash)
            ├── sign-in.tsx
            ├── registro.tsx
            ├── reset-password.tsx
            └── (tabs)/
                ├── _layout.tsx
                ├── index.tsx        ← pantalla principal
                ├── capturas.tsx
                ├── favoritos.tsx
                ├── configuracion.tsx
                ├── admin-panel.tsx
                ├── soporte.tsx
                ├── contacto.tsx
                └── acerca.tsx
```

---

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Python | 3.10 |
| Node.js | 18 LTS |
| PostgreSQL | 14 (con extensión `pgvector`) |
| Expo CLI | incluido en `npm install` |

Cuentas externas necesarias:
- [Cloudinary](https://cloudinary.com/) — almacenamiento de imágenes
- [SerpAPI](https://serpapi.com/) — resultados de Google Lens
- Servidor SMTP — envío de emails OTP (p. ej. Gmail con contraseña de aplicación)

---

## Puesta en marcha

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd StyleLens
```

---

### 2. Backend

#### 2.1 Crear y activar entorno virtual

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

#### 2.2 Instalar dependencias Python

```bash
pip install -r requirements.txt
```

#### 2.3 Configurar variables de entorno

Crea el archivo `.env` dentro de `backend/` con el siguiente contenido (ajusta los valores):

```env
# Base de datos
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/stylelens

# Seguridad JWT
SECRET_KEY=cambia_esto_por_una_clave_segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Servicios externos
SERPAPI_KEY=tu_clave_de_serpapi
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Email (OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASSWORD=tu_contraseña_de_aplicacion

# Opcionales
CORS_ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
TRUST_FORWARDED_FOR=false
```

#### 2.4 Preparar la base de datos

Conéctate a PostgreSQL y activa la extensión vectorial:

```sql
CREATE DATABASE stylelens;
\c stylelens
CREATE EXTENSION IF NOT EXISTS vector;
```

Las tablas se crean automáticamente al arrancar la API (SQLAlchemy `create_all`).

#### 2.5 Arrancar la API

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- API disponible en: `http://localhost:8000`
- Documentación interactiva (Swagger): `http://localhost:8000/docs`
- Health check: `GET http://localhost:8000/`

---

### 3. Frontend

#### 3.1 Instalar dependencias

```bash
cd frontend/FrontStylens
npm install
```

#### 3.2 Configurar la URL del backend

Localiza el fichero de configuración de la API (normalmente en `constants/` o en el cliente axios) y apunta a la dirección donde corre el backend:

```
# Desarrollo local (dispositivo físico en la misma red)
API_URL=http://<IP-de-tu-máquina>:8000

# Emulador Android
API_URL=http://10.0.2.2:8000

# Simulador iOS / web
API_URL=http://localhost:8000
```

#### 3.3 Iniciar la app

```bash
npx expo start
```

Desde el terminal podrás abrir la app en:

| Plataforma | Comando en el CLI de Expo |
|---|---|
| Android (emulador) | Pulsa `a` |
| iOS (simulador) | Pulsa `i` |
| Web | Pulsa `w` |
| Dispositivo físico | Escanea el QR con **Expo Go** |

---

## Endpoints principales de la API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Health check (BD + servicio) |
| `POST` | `/api/v1/auth/login` | Login → devuelve JWT |
| `POST` | `/api/v1/auth/register-request` | Solicitar acceso (envía OTP) |
| `POST` | `/api/v1/auth/verify-otp` | Verificar OTP y crear cuenta |
| `GET` | `/api/v1/auth/me` | Datos del usuario autenticado |
| `POST` | `/api/v1/detectar` | Detectar prendas en imagen (YOLOv8) |
| `POST` | `/api/v1/buscar` | Buscar prendas similares (FashionCLIP + pgvector) |
| `GET` | `/api/v1/prendas` | Listar prendas del catálogo |
| `GET` | `/api/v1/favoritos` | Listar favoritos del usuario |
| `POST` | `/api/v1/favoritos` | Añadir favorito |
| `DELETE` | `/api/v1/favoritos/{prenda_id}` | Eliminar favorito |
| `GET` | `/api/v1/capturas` | Historial de búsquedas del usuario |

La documentación completa con esquemas de request/response está en `/docs` (Swagger UI).

---

## Stack tecnológico

### Backend
- **FastAPI** — framework HTTP asíncrono
- **SQLAlchemy** — ORM con soporte JTI (Joined Table Inheritance)
- **pgvector** — búsqueda vectorial sobre PostgreSQL
- **YOLOv8 (Ultralytics)** — detección de prendas en imágenes
- **FashionCLIP** — embeddings visuales especializados en moda (512 dim.)
- **SerpAPI** — resultados de Google Lens para prendas sin match
- **Cloudinary** — almacenamiento y CDN de imágenes
- **JWT + OTP** — autenticación y verificación de identidad por email

### Frontend
- **React Native 0.81** + **Expo SDK 54**
- **Expo Router** — navegación basada en sistema de archivos
- **Zustand** — gestión de estado global
- **Axios** — cliente HTTP
- **expo-image-picker** — captura de fotos y selección de galería
- **@gorhom/bottom-sheet** — paneles deslizantes
- **React Native Reanimated** — animaciones fluidas
