"""
Inicializa (o actualiza) la base de datos StyleLens:
  1. Habilita la extensión pgvector — debe estar antes de CREATE TABLE.
  2. Elimina tablas legacy que ya no forman parte del modelo.
  3. Crea las tablas a partir de los modelos SQLAlchemy (idempotente):
       prendas, prendas_superiores, prendas_inferiores, cuerpo_entero,
    roles, usuarios, requests, favoritos, busquedas, detecciones, resultados.
  4. Garantiza que las columnas e índices de 'prendas' y 'requests' existen
     tanto en instalaciones nuevas como en bases de datos existentes.

Uso:
  cd backend
  python scripts/init_bd.py
"""
import os
import sys
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")
sys.path.insert(0, str(BASE_DIR))

from app.database import engine
from app import models  # noqa: F401 — registra todos los modelos en Base.metadata

if not os.getenv("DATABASE_URL"):
    raise RuntimeError(
        "No se encontró DATABASE_URL. Crea backend/.env con tu cadena de conexión de Supabase."
    )

# Tablas legacy que ya no forman parte del modelo.
_DROP_LEGACY_TABLES = [
    "DROP TABLE IF EXISTS public.calzado    CASCADE",
    "DROP TABLE IF EXISTS public.camisetas  CASCADE",
    "DROP TABLE IF EXISTS public.pantalones CASCADE",
    "DROP TABLE IF EXISTS public.otros      CASCADE",
  "DROP TABLE IF EXISTS public.access_requests CASCADE",
]

_ENSURE_PRENDAS_COLUMNS = [
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS categoria      TEXT",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS subcategoria   TEXT",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS color          TEXT",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS precio         DOUBLE PRECISION",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS precio_actual  DECIMAL(10, 2)",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS tienda         TEXT",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS link           TEXT",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS imagen_hash    TEXT",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS cloudinary_url TEXT",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS fuente_precio  TEXT",
    "CREATE INDEX IF NOT EXISTS ix_prendas_imagen_hash ON public.prendas (imagen_hash)",
    "CREATE INDEX IF NOT EXISTS ix_prendas_categoria   ON public.prendas (categoria)",
]

_ENSURE_REQUESTS_COLUMNS = [
    "ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS email          TEXT",
    "ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS message        TEXT",
    "ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ",
    "ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS otp_hash       TEXT",
    "ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS otp_expiration TIMESTAMPTZ",
    "ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS status         TEXT",
    "CREATE INDEX IF NOT EXISTS ix_requests_email ON public.requests (email)",
  ]


def main() -> None:
    print("Inicializando la base de datos StyleLens...")
    try:
        # 1. Extensión pgvector — debe estar activa antes de cualquier tabla con vector(512)
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        print("  ✓ Extensión pgvector habilitada")

        # 2. Eliminar tablas legacy
        with engine.begin() as conn:
            for stmt in _DROP_LEGACY_TABLES:
                conn.execute(text(stmt))
        print("  ✓ Tablas legacy eliminadas (calzado, camisetas, pantalones, otros)")

        # 3. Crear tablas definidas en los modelos SQLAlchemy
        models.Base.metadata.create_all(bind=engine)
        print("  ✓ Tablas creadas")

        # 4. Asegurar columnas e índices en prendas (necesario para bases de datos existentes)
        with engine.begin() as conn:
            for stmt in _ENSURE_PRENDAS_COLUMNS:
                conn.execute(text(stmt))
        print("  ✓ Columnas e índices de prendas verificados")

        # 5. Asegurar columnas e índices en requests (OTP vive aquí)
        with engine.begin() as conn:
          for stmt in _ENSURE_REQUESTS_COLUMNS:
            conn.execute(text(stmt))
          conn.execute(
            text(
              "ALTER TABLE public.requests "
              "DROP CONSTRAINT IF EXISTS ck_requests_message_allowed"
            )
          )
          conn.execute(
            text(
              "ALTER TABLE public.requests "
              "ADD CONSTRAINT ck_requests_message_allowed "
              "CHECK (message IN ('register request', 'change password'))"
            )
          )
        print("  ✓ Columnas, índice y constraint de requests verificados")

        # 6. Índices HNSW sobre los embeddings de las subtablas.
        #    Permiten búsqueda vectorial por similitud de coseno en O(log n)
        #    en lugar de escaneo secuencial. Se crean solo si la columna ya existe.
        _HNSW = [
            """
            DO $$ BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'prendas_superiores' AND column_name = 'embedding'
              ) THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_superiores_embedding
                         ON public.prendas_superiores USING hnsw (embedding vector_cosine_ops)';
              END IF;
            END $$
            """,
            """
            DO $$ BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'prendas_inferiores' AND column_name = 'embedding'
              ) THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_inferiores_embedding
                         ON public.prendas_inferiores USING hnsw (embedding vector_cosine_ops)';
              END IF;
            END $$
            """,
            """
            DO $$ BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'cuerpo_entero' AND column_name = 'embedding'
              ) THEN
                EXECUTE 'CREATE INDEX IF NOT EXISTS idx_cuerpo_entero_embedding
                         ON public.cuerpo_entero USING hnsw (embedding vector_cosine_ops)';
              END IF;
            END $$
            """,
        ]
        with engine.begin() as conn:
            for stmt in _HNSW:
                conn.execute(text(stmt))
        print("  ✓ Índices HNSW de embeddings creados")

    except SQLAlchemyError as exc:
        raise RuntimeError(f"Error al inicializar la base de datos: {exc}") from exc

    print("\nBase de datos lista.")
    print("Recuerda que DATABASE_URL en backend/.env debe apuntar a tu instancia de Supabase.")


if __name__ == "__main__":
    main()
