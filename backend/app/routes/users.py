from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario, Role
from app.auth_deps import get_admin_user
import bcrypt

router = APIRouter(prefix="/api/user", tags=["Users Management"])


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
