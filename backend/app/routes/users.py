from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Usuario, Role
from app.auth_utils import verify_password  # Usaremos bcrypt para el nuevo usuario
import bcrypt

router = APIRouter(prefix="/api/user", tags=["Users Management"])

# 1. POST /api/user/ — Crear usuario
@router.post("/")
def create_user(nombre_completo: str, email: str, password_inicial: str, role_id: int, db: Session = Depends(get_db)):
    existe = db.query(Usuario).filter(Usuario.email == email).first()
    if existe:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    hashed_pw = bcrypt.hashpw(password_inicial.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    nuevo_usuario = Usuario(
        nombre_completo=nombre_completo,
        email=email,
        password_hash=hashed_pw,
        role_id=role_id, # Usamos el ID del rol
        is_active=True
    )
    db.add(nuevo_usuario)
    db.commit()
    return {"message": "Usuario creado con éxito"}

# 2. GET /api/user/list — Listar usuarios activos
@router.get("/list")
def list_active_users(db: Session = Depends(get_db)):
    return db.query(Usuario).filter(Usuario.is_active == True).all()

# 3. GET /api/user/roles — Listar roles disponibles desde la BD
@router.get("/roles")
def get_roles(db: Session = Depends(get_db)):
    return db.query(Role).all()

# 4. PUT /api/user/{user_id}/role — Cambiar rol
@router.put("/{user_id}/role")
def update_user_role(user_id: str, nuevo_role_id: int, db: Session = Depends(get_db)):
    # Nota: user_id es str porque en tu modelo es UUID
    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.role_id = nuevo_role_id
    db.commit()
    return {"message": "Rol actualizado correctamente"}

# 5. DELETE /api/user/{user_id} — Borrado lógico
@router.delete("/{user_id}")
def soft_delete_user(user_id: str, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.is_active = False 
    db.commit()
    return {"message": "Usuario desactivado correctamente"}