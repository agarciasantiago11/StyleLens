<<<<<<< HEAD
import bcrypt
import sys

# Función para cifrar la contraseña (Criterio de aceptación DEV-58)
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def setup_admin():
    print("--- Inicializando Usuario Administrador ---")
    email = "admin@stylelens.com"
    raw_password = "AdminStyle2026!" # Contraseña segura para el TFG
    hashed_pass = hash_password(raw_password)
    
    print(f"Email: {email}")
    print(f"Password Hash: {hashed_pass}")
    print("\n--- COMANDO SQL PARA SUPABASE ---")
    print(f"""
    INSERT INTO public.usuarios (email, password_hash, nombre_completo, role_id, is_active)
    VALUES ('{email}', '{hashed_pass}', 'Admin StyleLens', (SELECT id FROM roles WHERE nombre = 'Admin'), TRUE);
    """)

if __name__ == "__main__":
    setup_admin()
=======
"""
Inicializa la base de datos: crea tablas, siembra roles y crea el admin inicial.

Uso: cd backend && python scripts/init_db.py
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt
from app.database import SessionLocal, engine
from app.models import Base, Role, Usuario

ROLES = [
    {"nombre": "Admin", "prioridad": 100},
    {"nombre": "Project Manager", "prioridad": 50},
    {"nombre": "User", "prioridad": 10},
]

ADMIN_EMAIL = "admin@stylelens.com"
ADMIN_PASSWORD = "AdminStyle2026!"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def init_db():
    print("--- Creando tablas ---")
    Base.metadata.create_all(bind=engine)
    print("Tablas listas.")

    db = SessionLocal()
    try:
        for role_data in ROLES:
            if not db.query(Role).filter(Role.nombre == role_data["nombre"]).first():
                db.add(Role(**role_data))
                print(f"  Rol creado: {role_data['nombre']} (prioridad {role_data['prioridad']})")
        db.commit()

        if not db.query(Usuario).filter(Usuario.email == ADMIN_EMAIL).first():
            admin_role = db.query(Role).filter(Role.nombre == "Admin").first()
            db.add(Usuario(
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                nombre_completo="Admin StyleLens",
                role_id=admin_role.id,
                is_active=True,
            ))
            db.commit()
            print(f"  Admin creado: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        else:
            print("  Admin ya existe, skipping.")

        print("--- Init completado ---")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
>>>>>>> DEV-61-s4-front-formulario-de-login-y-gestion-de-sesion
