<<<<<<< HEAD
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import JWTError
from app.database import get_db
from app.models import Usuario
from app.auth_utils import verify_password, create_access_token, decode_token

router = APIRouter()
security = HTTPBearer()
=======
from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Usuario, Role
from app.schemas import UserMeResponse
from app.auth_utils import verify_password, generate_token
from datetime import datetime, timedelta, timezone

router = APIRouter()


def _is_token_expired(token_expiration: datetime | None) -> bool:
    if not token_expiration:
        return True

    # Normaliza datetimes naive como UTC para evitar errores aware vs naive.
    exp = token_expiration
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)

    return exp < datetime.now(timezone.utc)
>>>>>>> DEV-61-s4-front-formulario-de-login-y-gestion-de-sesion


class LoginRequest(BaseModel):
    email: str
    password: str


<<<<<<< HEAD
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Usuario:
    token = credentials.credentials
    try:
        user_id = decode_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not usuario or not usuario.is_active:
        raise HTTPException(status_code=401, detail="Usuario no encontrado o inactivo")
    return usuario


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == request.email).first()
    if not usuario or not verify_password(request.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = create_access_token(str(usuario.id))
    return {"access_token": token, "token_type": "bearer"}
=======
@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == request.email).first()

    if not usuario or not verify_password(request.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = generate_token()
    usuario.token = token
    usuario.token_expiration = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()

    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserMeResponse)
def me(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    token = authorization.split(" ", 1)[1].strip()
    usuario = db.query(Usuario).filter(Usuario.token == token).first()

    if not usuario or _is_token_expired(usuario.token_expiration):
        if usuario:
            usuario.token = None
            usuario.token_expiration = None
            db.commit()
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    role = db.query(Role).filter(Role.id == usuario.role_id).first()

    return UserMeResponse(
        id=usuario.id,
        email=usuario.email,
        nombre_completo=usuario.nombre_completo,
        role_id=usuario.role_id,
        role_priority=role.prioridad if role else 0,
    )


@router.post("/logout")
def logout(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    token = authorization.split(" ", 1)[1].strip()
    usuario = db.query(Usuario).filter(Usuario.token == token).first()

    if usuario:
        usuario.token = None
        usuario.token_expiration = None
        db.commit()

    return {"message": "Sesión cerrada correctamente"}
>>>>>>> DEV-61-s4-front-formulario-de-login-y-gestion-de-sesion
