from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario, Role, AccessRequest
from app.auth_deps import get_admin_user
from app.schemas import ChangePasswordBody
import bcrypt
from pydantic import BaseModel

router = APIRouter(prefix="/api/user", tags=["Users Management"])


class RegisterUserBody(BaseModel):
    nombre_usuario: str
    email: str
    password: str


@router.post("/")
def create_user(
    nombre_completo: str,
    email: str,
    password_inicial: str,
    role_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_admin_user),
):
    if db.query(Usuario).filter(Usuario.email == email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    hashed_pw = bcrypt.hashpw(password_inicial.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    db.add(Usuario(
        nombre_completo=nombre_completo,
        email=email,
        password_hash=hashed_pw,
        role_id=role_id,
        is_active=True,
    ))
    db.commit()
    return {"message": "Usuario creado con éxito"}


@router.post("/register")
def register_user(
    body: RegisterUserBody,
    db: Session = Depends(get_db),
):
    if db.query(Usuario).filter(Usuario.email == body.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    access_request = (
        db.query(AccessRequest)
        .filter(
            AccessRequest.email == body.email,
            AccessRequest.message == "register request",
            AccessRequest.status == "verified",
        )
        .order_by(AccessRequest.created_at.desc())
        .first()
    )
    if not access_request:
        raise HTTPException(status_code=400, detail="OTP no verificado o solicitud expirada")

    user_role = db.query(Role).filter(Role.id == 3).first()
    if not user_role:
        raise HTTPException(status_code=500, detail="No existe el rol user (id=3)")

    hashed_pw = bcrypt.hashpw(body.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    db.add(Usuario(
        nombre_completo=body.nombre_usuario,
        email=body.email,
        password_hash=hashed_pw,
        role_id=3,
        is_active=True,
    ))
    access_request.status = "accepted"
    db.commit()

    return {"message": "Usuario registrado con éxito"}


@router.get("/list")
def list_active_users(
    db: Session = Depends(get_db),
 #   _: Usuario = Depends(get_admin_user),
):
    return db.query(Usuario).filter(Usuario.is_active == True).all()


@router.get("/roles")
def get_roles(
    db: Session = Depends(get_db),
 #   _: Usuario = Depends(get_admin_user),
):
    return db.query(Role).all()


@router.put("/{user_id}/role")
def update_user_role(
    user_id: str,
    nuevo_role_id: int,
    db: Session = Depends(get_db),
 #   _: Usuario = Depends(get_admin_user),
):
    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.role_id = nuevo_role_id
    db.commit()
    return {"message": "Rol actualizado correctamente"}


@router.delete("/{user_id}")
def soft_delete_user(
    user_id: str,
    db: Session = Depends(get_db),
#    _: Usuario = Depends(get_admin_user),
):
    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.is_active = False
    db.commit()
    return {"message": "Usuario desactivado correctamente"}

@router.put("/cambio-contrasena")
def cambio_contrasena(body: ChangePasswordBody, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == body.email).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    access_request = (
        db.query(AccessRequest)
        .filter(
            AccessRequest.email == body.email,
            AccessRequest.message == "change password",
            AccessRequest.status == "verified",
        )
        .order_by(AccessRequest.created_at.desc())
        .first()
    )
    if not access_request:
        raise HTTPException(status_code=400, detail="OTP no verificado o solicitud expirada")

    hashed_pw = bcrypt.hashpw(body.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    usuario.password_hash = hashed_pw
    access_request.status = "accepted"
    access_request.otp_hash = None
    access_request.otp_expiration = None
    db.commit()

    return {"message": "Contraseña actualizada correctamente"}

