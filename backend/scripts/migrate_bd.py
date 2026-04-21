import os
import sys
# Añadimos el path para que encuentre el módulo 'app' si es necesario
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine # Ajusta según donde tengas el engine

def migrate():
    print("🚀 Ejecutando migración DEV-66...")
    with engine.connect() as conn:
        try:
            # Añadimos las columnas para OTP
            conn.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS otp_hash TEXT;"))
            conn.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS otp_expiration TIMESTAMPTZ;"))
            conn.commit()
            print("✅ Columnas añadidas correctamente a Supabase.")
        except Exception as e:
            print(f"❌ Error en la migración: {e}")

if __name__ == "__main__":
    migrate()