"""
Migra la tabla public.prendas para que sea compatible con el backend actual.

Uso:
  cd backend
  python scripts/migrate_prendas_schema.py
"""

import os
import sys

from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine


SQL_STATEMENTS = [
    "CREATE EXTENSION IF NOT EXISTS vector",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS categoria TEXT",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS subcategoria TEXT",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS color TEXT",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS precio DOUBLE PRECISION",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS precio_actual DECIMAL(10, 2)",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS tienda TEXT",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS link TEXT",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS imagen_hash TEXT",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS cloudinary_url TEXT",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS embedding vector(512)",
    "ALTER TABLE public.prendas ADD COLUMN IF NOT EXISTS fuente_precio TEXT",
    "CREATE INDEX IF NOT EXISTS ix_prendas_imagen_hash ON public.prendas (imagen_hash)",
    # Migracion de datos de columnas legacy si existen.
    """
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'prendas'
          AND column_name = 'precio_actual'
      ) THEN
        UPDATE public.prendas
        SET precio = COALESCE(precio, precio_actual::DOUBLE PRECISION)
        WHERE precio IS NULL;
      END IF;
    END $$;
    """,
    """
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'prendas'
          AND column_name = 'fuente_precio'
      ) THEN
        UPDATE public.prendas
        SET tienda = COALESCE(tienda, fuente_precio)
        WHERE tienda IS NULL;
      END IF;
    END $$;
    """,
]


def run_migration() -> None:
    with engine.begin() as connection:
        for statement in SQL_STATEMENTS:
            connection.execute(text(statement))

    print("Migracion completada: tabla prendas alineada.")


if __name__ == "__main__":
    run_migration()
