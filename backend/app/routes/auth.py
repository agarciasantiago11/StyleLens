from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Usuario
from app.auth_utils import verify_password, generate_token
from datetime import datetime, timedelta

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # 1. Buscar al usuario
    usuario = db.query(Usuario).filter(Usuario.email == request.email).first()
    
    # --- BLOQUE DE DEBUG ---
    if not usuario:
        print(f"DEBUG: El email '{request.email}' NO existe en la base de datos.")
    else:
        print(f"DEBUG: Usuario encontrado. Comparando contraseñas...")
        # Esto nos dirá si verify_password devuelve True o False
        es_valida = verify_password(request.password, usuario.password_hash)
        print(f"DEBUG: ¿La contraseña coincide?: {es_valida}")
    # -----------------------

    # 2. Validar
    # Volvemos a la lógica normal, pero ahora sabrás qué falló mirando la terminal
    if not usuario or not verify_password(request.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # 3. Crear sesión
    token = generate_token()
    usuario.token = token
    usuario.token_expiration = datetime.utcnow() + timedelta(hours=1)
    
    db.commit() 
    
    return {"access_token": token, "token_type": "bearer"}