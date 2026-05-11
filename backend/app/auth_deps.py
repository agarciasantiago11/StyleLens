from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.models import Usuario, Role
from app.auth_utils import hash_token

bearer_scheme = HTTPBearer()


def _is_token_expired(token_expiration: datetime | None) -> bool:
    if not token_expiration:
        return True

    exp = token_expiration
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)

    return exp < datetime.now(timezone.utc)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    token_hash = hash_token(credentials.credentials)
    usuario = db.query(Usuario).filter(Usuario.token == token_hash).first()

    if not usuario or _is_token_expired(usuario.token_expiration):
        if usuario:
            usuario.token = None
            usuario.token_expiration = None
            db.commit()
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    return usuario


def get_admin_user(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Usuario:
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    if not role or role.prioridad < 100:
        raise HTTPException(status_code=403, detail="Se requieren permisos de administrador")
    return current_user
