-- Reversión de la promoción a TIMESTAMPTZ aplicada el 2026-05-09 durante la
-- auditoría. Devuelve las 8 columnas a TIMESTAMP WITHOUT TIME ZONE.
--
-- La conversión `AT TIME ZONE 'UTC'` reinterpreta los valores TIMESTAMPTZ
-- existentes como UTC y los almacena descartando la información de zona,
-- conservando la representación numérica original.
--
-- Cómo aplicar (revisar antes de ejecutar):
--   psql "$DATABASE_URL" -f scripts/revert_tz.sql
-- O en Supabase SQL Editor: pegar el contenido y Run.

BEGIN;

ALTER TABLE public.usuarios
    ALTER COLUMN fecha_registro
    TYPE TIMESTAMP USING fecha_registro AT TIME ZONE 'UTC';

ALTER TABLE public.usuarios
    ALTER COLUMN token_expiration
    TYPE TIMESTAMP USING token_expiration AT TIME ZONE 'UTC';

ALTER TABLE public.busquedas
    ALTER COLUMN created_at
    TYPE TIMESTAMP USING created_at AT TIME ZONE 'UTC';

ALTER TABLE public.detecciones
    ALTER COLUMN created_at
    TYPE TIMESTAMP USING created_at AT TIME ZONE 'UTC';

ALTER TABLE public.resultados
    ALTER COLUMN created_at
    TYPE TIMESTAMP USING created_at AT TIME ZONE 'UTC';

ALTER TABLE public.favoritos
    ALTER COLUMN created_at
    TYPE TIMESTAMP USING created_at AT TIME ZONE 'UTC';

ALTER TABLE public.requests
    ALTER COLUMN created_at
    TYPE TIMESTAMP USING created_at AT TIME ZONE 'UTC';

ALTER TABLE public.requests
    ALTER COLUMN otp_expiration
    TYPE TIMESTAMP USING otp_expiration AT TIME ZONE 'UTC';

COMMIT;
