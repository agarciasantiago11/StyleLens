import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
DOTENV_PATH = BASE_DIR / ".env"
SCHEMA_PATH = BASE_DIR.parent / "Supabase_BD" / "schema.sql"

load_dotenv(DOTENV_PATH)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "No se encontró DATABASE_URL. Crea un archivo .env en backend/ con tu cadena de conexión de Supabase."
    )

if not SCHEMA_PATH.exists():
    raise FileNotFoundError(f"No se encontró el archivo de esquema: {SCHEMA_PATH}")


def load_schema() -> str:
    with SCHEMA_PATH.open("r", encoding="utf-8") as fp:
        return fp.read()


def run_schema(sql: str) -> None:
    engine = create_engine(DATABASE_URL)
    try:
        with engine.begin() as connection:
            connection.exec_driver_sql(sql)
    except SQLAlchemyError as exc:
        raise RuntimeError(f"Error al ejecutar el esquema SQL: {exc}") from exc


def main() -> None:
    print("Inicializando la base de datos desde Supabase_BD/schema.sql")
    schema_sql = load_schema()
    run_schema(schema_sql)
    print("Base de datos inicializada correctamente.")
    print("Asegúrate de que DATABASE_URL en backend/.env apunte a tu instancia de Supabase.")


if __name__ == "__main__":
    main()
