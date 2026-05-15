# StyleLens — Documentación del Proyecto TFG

---

## ¿Qué es StyleLens?

StyleLens es una aplicación móvil que permite a los usuarios **fotografiar una prenda de ropa** y encontrar automáticamente dónde comprarla online. El usuario sube una foto, la app detecta las prendas que aparecen, y devuelve resultados de tiendas reales con precio y enlace directo de compra.

**Ejemplo de uso:** Ves a alguien por la calle con una camiseta que te gusta, la fotografías, abres StyleLens, subes la foto y la app te dice dónde comprar esa camiseta (o una similar) y a qué precio.

---

## Stack Tecnológico

### Frontend
- **React Native + Expo** — app móvil multiplataforma (iOS, Android y Web)
- **Expo Router** — navegación entre pantallas basada en ficheros
- **Zustand** — gestión del estado de autenticación
- **Axios** — cliente HTTP para llamar a la API
- **AsyncStorage** — almacenamiento local en el dispositivo

### Backend
- **FastAPI (Python)** — servidor API REST
- **PostgreSQL** — base de datos relacional
- **SQLAlchemy** — ORM para interactuar con la base de datos
- **pgvector** — extensión de PostgreSQL para búsqueda vectorial semántica
- **Cloudinary** — almacenamiento y CDN de imágenes en la nube
- **SerpAPI (Google Lens)** — búsqueda inversa de imágenes para encontrar productos
- **YOLO (Ultralytics)** — modelo de IA para detectar prendas en imágenes
- **bcrypt** — cifrado de contraseñas
- **SMTP** — envío de correos electrónicos (OTP)

---

## Arquitectura General

```
┌─────────────────────┐         HTTPS          ┌──────────────────────┐
│   APP MÓVIL         │ ──────────────────────▶ │   BACKEND FastAPI    │
│   React Native      │ ◀────────────────────── │   Python             │
│   Expo              │                         └──────────┬───────────┘
└─────────────────────┘                                    │
                                                ┌──────────▼───────────┐
                                                │   PostgreSQL         │
                                                │   + pgvector         │
                                                └──────────────────────┘
                                                           │
                                              ┌────────────┼────────────┐
                                              ▼            ▼            ▼
                                         Cloudinary    SerpAPI       YOLO
                                         (imágenes)  (búsqueda)  (detección)
```

---

## Flujo Principal — Detección de Prendas

Este es el proceso completo que ocurre cuando un usuario sube una foto:

### 1. El usuario selecciona una imagen
- Desde la cámara o la galería del móvil
- La imagen se muestra en pantalla como previsualización

### 2. El frontend envía la imagen al backend
- Llamada: `POST /api/v1/detectar-cajas`
- Se calcula un **hash SHA256** de la imagen para usar como clave de caché

### 3. El backend detecta las prendas con YOLO
- **Si la imagen ya fue procesada antes (caché):** se reutilizan los resultados anteriores directamente, sin volver a llamar a YOLO ni a SerpAPI → ahorro de tiempo y dinero
- **Si es nueva:**
  1. Se sube la imagen original a **Cloudinary** (CDN)
  2. Se ejecuta el modelo **YOLO** sobre la imagen
  3. YOLO devuelve los **bounding boxes** (cajas delimitadoras) de cada prenda detectada con su clase (camiseta, pantalón, vestido...) y confianza
  4. Se guarda cada detección en la base de datos

### 4. El frontend muestra las cajas sobre la imagen
- El usuario ve rectángulos dibujados sobre las prendas detectadas
- Puede pulsar en una caja específica para buscar esa prenda concreta

### 5. El usuario pulsa una caja → búsqueda de producto
- Llamada: `POST /api/v1/detectar-prenda`
- El backend recorta la zona de la prenda de la imagen original
- Sube el recorte a **Cloudinary**
- Llama a **SerpAPI (Google Lens)** con la URL de Cloudinary → Google Lens busca visualmente el producto en tiendas online
- Se filtran resultados (se eliminan redes sociales, Wikipedia, etc.) y se priorizan tiendas
- Se guardan los resultados en la base de datos
- Si el usuario tiene un **rango de precio** configurado, se filtra por ese rango

### 6. El frontend muestra los resultados
- Grid de productos con imagen, nombre, precio y tienda
- El usuario puede pulsar en un producto para abrirlo en el navegador
- Puede guardar productos en **Favoritos**

---

## Base de Datos — Tablas y Relaciones

```
usuarios ──────────────────────────────────────────────────┐
    │                                                       │
    │ 1:N                                                   │ 1:N
    ▼                                                       ▼
busquedas (cada foto subida)                          favoritos (prendas guardadas)
    │                                                       │
    │ 1:N                                                   │ N:1
    ▼                                                       ▼
detecciones (cada prenda detectada en esa foto)       prendas (productos encontrados)
    │                                                       ▲
    │ 1:N                                                   │ N:1
    ▼                                                       │
resultados ────────────────────────────────────────────────┘
```

### Descripción de cada tabla

| Tabla | Para qué sirve |
|-------|---------------|
| **usuarios** | Cuentas de usuario (email, contraseña cifrada, rol, token de sesión) |
| **roles** | Tipos de usuario (user, admin) con jerarquía de permisos por prioridad |
| **busquedas** | Registro de cada foto subida (URL en Cloudinary, hash SHA256, fecha) |
| **detecciones** | Cada prenda detectada dentro de una búsqueda (clase YOLO, confianza, coordenadas del bounding box) |
| **resultados** | Productos encontrados para cada detección (rank, puntuación de similitud, fuente) |
| **prendas** | Productos de tiendas online (nombre, precio, tienda, URL imagen, link compra) |
| **prendas_superiores** | Subtabla de prendas: camisetas, chaquetas (con embedding vectorial) |
| **prendas_inferiores** | Subtabla de prendas: pantalones, shorts, faldas (con embedding vectorial) |
| **cuerpo_entero** | Subtabla de prendas: vestidos, monos (con embedding vectorial) |
| **favoritos** | Relación usuario-prenda (prendas guardadas por el usuario) |
| **requests** | Solicitudes OTP para registro, cambio de contraseña y reset de 2FA |

---

## Pantallas de la Aplicación

### Pantallas principales (barra de navegación inferior)

| Pantalla | Descripción |
|----------|-------------|
| **Inicio (index)** | Pantalla principal de detección: subir foto, ver cajas, ver resultados |
| **Capturas** | Historial de todas las fotos subidas por el usuario con sus resultados |
| **Favoritos** | Grid de productos guardados como favoritos |
| **Configuración** | Ajustes de la app: tema, rango de precios, eliminar historial, caché |
| **Panel Admin** | Solo visible para admins: gestión de usuarios y roles |

### Pantallas de autenticación

| Pantalla | Descripción |
|----------|-------------|
| **Sign-In** | Inicio de sesión con email y contraseña |
| **Registro** | Registro en dos pasos: email → verificación OTP → crear cuenta |
| **Reset Password** | Recuperación de contraseña en tres pasos con OTP |

### Pantallas auxiliares

| Pantalla | Descripción |
|----------|-------------|
| **Soporte** | FAQ y formulario de soporte |
| **Contacto** | Información de contacto y formulario |
| **Acerca de** | Información sobre la app y el equipo |

---

## Sistema de Autenticación

StyleLens usa autenticación basada en **tokens Bearer** (no JWT).

### Registro
1. El usuario introduce su email
2. El backend envía un **código OTP de 6 dígitos** por email (válido 10 minutos)
3. El usuario introduce el OTP → se verifica
4. El usuario introduce nombre de usuario y contraseña → se crea la cuenta

### Login
1. Email + contraseña → el backend verifica con **bcrypt**
2. El backend genera un **token aleatorio de 256 bits**
3. Guarda el **hash SHA256** del token en la base de datos (seguridad: si alguien roba la BD, no tiene los tokens activos)
4. Devuelve el token en texto plano al frontend
5. El frontend guarda el token en AsyncStorage y lo envía en cada petición: `Authorization: Bearer <token>`
6. El token expira en **1 hora**

### Seguridad adicional
- Contraseñas cifradas con **bcrypt**
- Rate limiting en endpoints sensibles (máx. 5 intentos/minuto por IP)
- Tokens de sesión hasheados en BD
- Verificación en tiempo constante de OTPs (previene timing attacks)

---

## API REST — Endpoints Principales

### Autenticación (`/api/v1/auth`)
| Método | Ruta | Qué hace |
|--------|------|----------|
| POST | `/login` | Inicia sesión, devuelve token |
| GET | `/me` | Obtiene el perfil del usuario actual |
| POST | `/logout` | Cierra sesión (invalida token) |
| POST | `/request-register-otp` | Solicita OTP para registro |
| POST | `/verify-otp` | Verifica el OTP recibido por email |

### Detección (`/api/v1`)
| Método | Ruta | Qué hace |
|--------|------|----------|
| POST | `/detectar-cajas` | Sube foto y devuelve bounding boxes de prendas detectadas |
| POST | `/detectar-prenda` | Busca productos para una prenda específica (bbox concreta) |

### Historial (`/api/v1`)
| Método | Ruta | Qué hace |
|--------|------|----------|
| GET | `/capturas` | Lista todas las búsquedas del usuario |
| GET | `/capturas/{id}` | Detalle de una búsqueda con sus detecciones |
| DELETE | `/historial` | Elimina todo el historial y favoritos del usuario |

### Favoritos (`/api/v1`)
| Método | Ruta | Qué hace |
|--------|------|----------|
| GET | `/favoritos` | Lista los favoritos del usuario |
| POST | `/favoritos/{prenda_id}` | Añade una prenda a favoritos |
| DELETE | `/favoritos/{prenda_id}` | Elimina una prenda de favoritos |

### Usuarios (`/api/user`) — solo admins
| Método | Ruta | Qué hace |
|--------|------|----------|
| GET | `/list` | Lista todos los usuarios activos |
| PUT | `/{id}/role` | Cambia el rol de un usuario |
| DELETE | `/{id}` | Desactiva una cuenta de usuario |
| POST | `/{id}/reset-2fa` | Fuerza el re-login del usuario (reset de sesión) |

---

## Servicios Externos

### Cloudinary
- **Para qué:** Almacenamiento de imágenes en la nube con CDN global
- **Cómo se usa:** Se suben las fotos originales y los recortes de prendas; se obtiene una URL pública HTTPS que se puede pasar a SerpAPI
- **Variable de entorno:** `CLOUDINARY_URL`

### SerpAPI (Google Lens)
- **Para qué:** Búsqueda inversa de imágenes → dado un recorte de prenda, devuelve productos similares de tiendas online
- **Cómo se usa:** Se le pasa la URL de Cloudinary, devuelve hasta 5 resultados filtrados y ordenados por relevancia comercial
- **Filtros aplicados:** Se eliminan redes sociales (Instagram, TikTok, Pinterest...), Wikipedia, AliExpress, eBay; se priorizan resultados con precio
- **Variable de entorno:** `SERPAPI_KEY`

### YOLO (Ultralytics)
- **Para qué:** Detección de objetos — identifica qué prendas hay en la imagen y dónde están
- **Modelo usado:** DeepFashion2 YOLOv8s-seg (entrenado específicamente en ropa)
- **Clases detectadas:** camiseta manga corta/larga, chaleco, top, chaqueta manga corta/larga, shorts, pantalón, falda, vestido manga corta/larga, vestido chaleco, vestido top
- **Umbral de confianza:** 0.3 (detecta si está al menos 30% seguro)

---

## Sistema de Caché

Para evitar llamadas repetidas a SerpAPI (que cuesta dinero) y a YOLO, el sistema implementa una caché basada en hash:

1. Cuando se sube una imagen, se calcula su **SHA256**
2. Si ese hash ya existe en `busquedas` → se clonan las detecciones anteriores (sin llamar a YOLO ni Cloudinary)
3. Para cada recorte de prenda, se calcula otro hash (SHA256 de imagen + coordenadas bbox)
4. Si ese hash existe en `prendas` → se reutilizan los productos ya encontrados (sin llamar a SerpAPI)

**Resultado:** La segunda vez que alguien busca la misma imagen, los resultados aparecen instantáneamente.

---

## Sistema de Roles y Permisos

| Rol | Prioridad | Permisos |
|-----|-----------|----------|
| user | Baja | Usar la app normalmente (detectar, favoritos, historial) |
| admin | Alta (≥50) | Todo lo anterior + gestión de usuarios, cambio de roles, reset de 2FA |
| superadmin | Máxima (100) | Todo lo anterior + puede gestionar admins |

Los permisos funcionan por **jerarquía numérica**: un admin no puede dar un rol de mayor prioridad que el suyo propio.

---

## Variables de Entorno Necesarias

| Variable | Para qué |
|----------|----------|
| `DATABASE_URL` | Conexión a PostgreSQL |
| `SERPAPI_KEY` | Clave de la API de SerpAPI (Google Lens) |
| `CLOUDINARY_URL` | Credenciales de Cloudinary |
| `SECRET_KEY` | Clave secreta para generación de tokens |
| `SMTP_HOST` | Servidor de email (ej: smtp.gmail.com) |
| `SMTP_PORT` | Puerto SMTP (ej: 587) |
| `SMTP_USER` | Email desde el que se envían los OTPs |
| `SMTP_PASSWORD` | Contraseña del email |
| `ADMIN_EMAIL` | Email que recibe notificaciones de nuevas solicitudes |

---

## Estructura de Carpetas del Proyecto

```
StyleLens/
├── frontend/
│   └── FrontStylens/
│       ├── app/
│       │   ├── (tabs)/              ← Pantallas con barra de navegación
│       │   │   ├── index.tsx        ← Pantalla principal (detección)
│       │   │   ├── capturas.tsx     ← Historial de búsquedas
│       │   │   ├── favoritos.tsx    ← Productos guardados
│       │   │   ├── configuracion.tsx← Ajustes
│       │   │   └── admin-panel.tsx  ← Gestión de usuarios (solo admins)
│       │   ├── sign-in.tsx          ← Login
│       │   ├── registro.tsx         ← Registro con OTP
│       │   └── reset-password.tsx   ← Recuperación de contraseña
│       ├── api/
│       │   ├── client.ts            ← Cliente Axios con interceptores de token
│       │   └── detection.ts         ← Funciones de llamada a la API de detección
│       ├── store/
│       │   └── authStore.ts         ← Estado global de autenticación (Zustand)
│       └── contexts/
│           └── app-theme.tsx        ← Temas de color de la app
│
├── backend/
│   ├── main.py                      ← Punto de entrada FastAPI, CORS, rutas
│   └── app/
│       ├── models.py                ← Modelos SQLAlchemy (tablas de BD)
│       ├── schemas.py               ← Modelos Pydantic (validación de datos)
│       ├── database.py              ← Conexión a PostgreSQL
│       ├── auth_deps.py             ← Dependencia get_current_user
│       ├── auth_utils.py            ← Funciones de hash de token y contraseña
│       ├── routes/
│       │   ├── auth.py              ← Login, logout, OTP, registro
│       │   ├── detectar.py          ← YOLO + SerpAPI (endpoint principal)
│       │   ├── capturas.py          ← Historial de búsquedas
│       │   ├── favoritos.py         ← Gestión de favoritos
│       │   ├── users.py             ← Gestión de usuarios (admin)
│       │   ├── prendas.py           ← Consulta de productos
│       │   └── buscar.py            ← Búsqueda (deprecado)
│       └── services/
│           ├── yolo_service.py      ← Detección con modelo YOLO
│           ├── cloudinary_service.py← Subida de imágenes a Cloudinary
│           ├── serpapi_service.py   ← Búsqueda inversa con Google Lens
│           └── email_service.py     ← Envío de emails OTP
│
└── Supabase_BD/
    └── schema.sql                   ← Script SQL para crear todas las tablas
```

---

## Resumen para la reunión con el tutor

**StyleLens es una app de moda basada en visión artificial** que resuelve el problema de "¿dónde compro esto que veo?". 

El flujo es: **foto → IA detecta prendas → búsqueda visual en Google → resultados de tiendas**.

Las tecnologías clave son:
- **YOLO**: IA de detección de objetos, localiza las prendas en la imagen
- **SerpAPI/Google Lens**: hace la búsqueda visual inversa para encontrar productos similares en tiendas
- **Cloudinary**: almacena las imágenes y sirve las URLs necesarias para Google Lens
- **pgvector**: infraestructura preparada para búsqueda semántica por embeddings (funcionalidad futura)
- **React Native + FastAPI**: app móvil + API REST

El proyecto implementa autenticación segura con OTP por email, sistema de roles para administración, caché de búsquedas para optimizar costes, y filtrado de resultados por precio.
