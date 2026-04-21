import sys

def setup_admin():
    print("--- Inicializando Usuario Administrador (Modo Passwordless - DEV-66) ---")
    email = "admin@stylelens.com"
    nombre = "Admin StyleLens"
    
    print(f"Email: {email}")
    print(f"Nombre: {nombre}")
    print("Nota: Ya no se genera password_hash (Sistema OTP habilitado)")
    
    print("\n--- COMANDO SQL PARA SUPABASE (Actualizado) ---")
    print(f"""
    -- Insertamos el admin con password_hash como NULL para forzar el uso de OTP
    INSERT INTO public.usuarios (email, password_hash, nombre_completo, role_id, is_active)
    VALUES (
        '{email}', 
        NULL, 
        '{nombre}', 
        (SELECT id FROM roles WHERE nombre = 'Admin'), 
        TRUE
    ) ON CONFLICT (email) DO UPDATE 
    SET password_hash = NULL; -- Si ya existía, le quitamos la contraseña antigua
    """)

if __name__ == "__main__":
    setup_admin()