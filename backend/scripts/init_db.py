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