import bcrypt
import secrets

# 1. Verificar si la contraseña coincide con el hash de la BD
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Forzamos que el hash sea bytes y la contraseña también
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        print(f"Error en validación: {e}")
        return False

# 2. Generar el Token de 64 caracteres (requisito de la tarea)
def generate_token() -> str:
    # Genera 32 bytes aleatorios y los convierte a hex (64 caracteres)
    return secrets.token_hex(32)