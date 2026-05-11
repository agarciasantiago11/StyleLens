"""
Crea (o actualiza) los usuarios de prueba con contraseñas reales hasheadas.
Ejecutar desde la carpeta backend/:
    python scripts/create_test_users.py
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from dotenv import load_dotenv
load_dotenv(BASE_DIR / ".env")

import bcrypt
from sqlalchemy.orm import Session
from app.database import engine
from app.models import Usuario, Role

USUARIOS = [
    {
        "id": "a0000000-0000-0000-0000-000000000001",
        "email": "admin@stylelens.com",
        "password": "Admin1234",
        "nombre_completo": "Admin StyleLens",
        "role_nombre": "Admin",
    },
    {
        "id": "a0000000-0000-0000-0000-000000000002",
        "email": "usuario@stylelens.com",
        "password": "User1234",
        "nombre_completo": "Usuario Test",
        "role_nombre": "User",
    },
]


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def main():
    with Session(engine) as db:
        roles = {r.nombre: r for r in db.query(Role).all()}

        for u in USUARIOS:
            role = roles.get(u["role_nombre"])
            if not role:
                print(f"  [ERROR] Rol '{u['role_nombre']}' no encontrado. Ejecuta primero init_bd.py")
                continue

            existing = db.query(Usuario).filter(Usuario.email == u["email"]).first()
            hashed = hash_password(u["password"])

            if existing:
                existing.password_hash = hashed
                existing.nombre_completo = u["nombre_completo"]
                existing.role_id = role.id
                existing.is_active = True
                print(f"  [OK] Actualizado: {u['email']}  |  contraseña: {u['password']}")
            else:
                db.add(Usuario(
                    id=u["id"],
                    email=u["email"],
                    password_hash=hashed,
                    nombre_completo=u["nombre_completo"],
                    role_id=role.id,
                    is_active=True,
                ))
                print(f"  [OK] Creado:     {u['email']}  |  contraseña: {u['password']}")

        db.commit()

    print("\nUsuarios listos para pruebas:")
    print("  admin@stylelens.com   →  Admin1234   (Admin)")
    print("  usuario@stylelens.com →  User1234    (User)")


if __name__ == "__main__":
    main()
