import bcrypt
import hashlib
import os
import secrets
from dotenv import load_dotenv

# Carga .env defensivamente: este módulo se importa desde múltiples puntos
# (auth_deps, auth route, scripts) y no podemos asumir que database.py ya corrió.
load_dotenv()

# SECRET_KEY ya no firma tokens (los tokens son opacos), pero la mantenemos
# obligatoria por si en el futuro se firma cualquier otro payload sensible.
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY no está configurada. Define la variable de entorno SECRET_KEY "
        "en backend/.env (mínimo 32 caracteres aleatorios)."
    )

ACCESS_TOKEN_EXPIRE_HOURS = 1


def hash_token(token: str) -> str:
    """SHA256 del bearer token. Lo guardamos hasheado en BD para que un dump
    de la tabla `usuarios` no filtre sesiones activas."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception as e:
        print(f"Error en validación: {e}")
        return False


def create_access_token(user_id: str) -> str:
    """Genera un token bearer opaco de 256 bits, criptográficamente aleatorio.
    El user_id se ignora a propósito: el token no se autodescribe — la
    asociación token→usuario vive solo en BD (Usuario.token = hash_token(t))."""
    return secrets.token_urlsafe(32)
