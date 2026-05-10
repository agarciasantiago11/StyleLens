from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario, Role, AccessRequest
from app.auth_deps import get_current_user
from app.schemas import ChangePasswordBody, UserListItem, RoleResponse
from app.services.email_service import send_otp_email
import bcrypt
from pydantic import BaseModel

router = APIRouter(prefix="/api/user", tags=["Users Management"])


class RegisterUserBody(BaseModel):
    nombre_usuario: str
    email: str
    password: str


def _get_role_or_403(user: Usuario, db: Session, min_priority: int) -> Role:
    role = db.query(Role).filter(Role.id == user.role_id).first()
    if not role or role.prioridad < min_priority:
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
    return role


@router.get("/list", response_model=list[UserListItem])
def list_active_users(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    _get_role_or_403(current_user, db, 50)
    roles_map = {r.id: r for r in db.query(Role).all()}
    users = db.query(Usuario).filter(Usuario.is_active == True).all()
    result = []
    for u in users:
        role = roles_map.get(u.role_id)
        result.append(UserListItem(
            id=u.id,
            email=u.email,
            nombre_completo=u.nombre_completo,
            role_id=u.role_id,
            role_nombre=role.nombre if role else None,
            role_prioridad=role.prioridad if role else 0,
            is_active=u.is_active,
        ))
    return result


@router.get("/roles", response_model=list[RoleResponse])
def get_roles(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    current_role = _get_role_or_403(current_user, db, 10)
    all_roles = db.query(Role).all()
    return [r for r in all_roles if r.prioridad <= current_role.prioridad]


@router.post("/")
def create_user(
    nombre_completo: str,
    email: str,
    password_inicial: str,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    current_role = _get_role_or_403(current_user, db, 10)
    target_role = db.query(Role).filter(Role.id == role_id).first()
    if not target_role:
        raise HTTPException(status_code=400, detail="Rol no encontrado")
    if target_role.prioridad > current_role.prioridad:
        raise HTTPException(status_code=403, detail="No puedes crear usuarios con un rol superior al tuyo")
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


@router.put("/{user_id}/role")
def update_user_role(
    user_id: str,
    nuevo_role_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    current_role = _get_role_or_403(current_user, db, 50)

    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if str(usuario.id) == str(current_user.id):
        raise HTTPException(status_code=403, detail="No puedes modificar tu propio rol")

    target_role = db.query(Role).filter(Role.id == nuevo_role_id).first()
    if not target_role:
        raise HTTPException(status_code=400, detail="Rol no encontrado")

    if current_role.prioridad < 100:
        user_current_role = db.query(Role).filter(Role.id == usuario.role_id).first()
        if user_current_role and user_current_role.prioridad >= current_role.prioridad:
            raise HTTPException(status_code=403, detail="No puedes modificar usuarios con un rol igual o superior al tuyo")
        if target_role.prioridad > current_role.prioridad:
            raise HTTPException(status_code=403, detail="No puedes asignar un rol superior al tuyo")

    usuario.role_id = nuevo_role_id
    db.commit()
    return {"message": "Rol actualizado correctamente"}


@router.delete("/{user_id}")
def soft_delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    current_role = _get_role_or_403(current_user, db, 50)

    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if str(usuario.id) == str(current_user.id):
        raise HTTPException(status_code=403, detail="No puedes eliminar tu propia cuenta")

    if current_role.prioridad < 100:
        user_role = db.query(Role).filter(Role.id == usuario.role_id).first()
        if user_role and user_role.prioridad >= current_role.prioridad:
            raise HTTPException(status_code=403, detail="No puedes eliminar usuarios con un rol igual o superior al tuyo")

    usuario.is_active = False
    db.commit()
    return {"message": "Usuario desactivado correctamente"}


@router.post("/{user_id}/request-reset-2fa")
def request_reset_2fa(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    current_role = _get_role_or_403(current_user, db, 50)

    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if current_role.prioridad < 100:
        user_role = db.query(Role).filter(Role.id == usuario.role_id).first()
        if user_role and user_role.prioridad >= current_role.prioridad:
            raise HTTPException(status_code=403, detail="No puedes iniciar un reset de 2FA para usuarios con un rol igual o superior al tuyo")

    access_request = AccessRequest(
        email=usuario.email,
        message="reset 2fa",
        status="pending",
    )
    db.add(access_request)
    otp = access_request.generate_otp()
    db.commit()

    try:
        send_otp_email(usuario.email, otp)
    except Exception as e:
        access_request.otp_hash = None
        access_request.otp_expiration = None
        db.commit()
        raise HTTPException(status_code=500, detail=f"Error al enviar el email: {e}")

    return {"message": "OTP de reset de 2FA enviado al usuario"}


@router.post("/{user_id}/reset-2fa")
def reset_2fa(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    current_role = _get_role_or_403(current_user, db, 50)

    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if current_role.prioridad < 100:
        user_role = db.query(Role).filter(Role.id == usuario.role_id).first()
        if user_role and user_role.prioridad >= current_role.prioridad:
            raise HTTPException(status_code=403, detail="No puedes resetear el 2FA de usuarios con un rol igual o superior al tuyo")

    # Registro histórico del reset — no se toca ningún registro anterior
    db.add(AccessRequest(
        email=usuario.email,
        message="reset 2fa",
        status="accepted",
    ))

    # Forzar re-login limpiando el token de sesión
    usuario.token = None
    usuario.token_expiration = None
    db.commit()
    return {"message": "2FA reseteado correctamente. El usuario deberá volver a autenticarse."}


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
