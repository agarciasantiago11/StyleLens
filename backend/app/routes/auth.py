import time
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Usuario, Role
from app.schemas import UserMeResponse, OTPRequestBody, VerifyOTPBody, VerifyOTPResponse, UserBasicResponse
from app.auth_utils import verify_password, generate_token
from app.services.email_service import send_otp_email
from datetime import datetime, timedelta, timezone

router = APIRouter()


class _RateLimiter:
    """Rate limiter en memoria por IP. No persistente entre reinicios."""

    def __init__(self, max_calls: int, period_seconds: int):
        self.max_calls = max_calls
        self.period = period_seconds
        self._log: dict[str, list[float]] = defaultdict(list)

    def check(self, request: Request) -> None:
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - self.period

        self._log[ip] = [t for t in self._log[ip] if t > window_start]

        if len(self._log[ip]) >= self.max_calls:
            raise HTTPException(status_code=429, detail="Demasiadas peticiones, inténtalo más tarde")

        self._log[ip].append(now)


_otp_request_limiter = _RateLimiter(max_calls=5, period_seconds=60)
_otp_verify_limiter = _RateLimiter(max_calls=10, period_seconds=60)


def _is_token_expired(token_expiration: datetime | None) -> bool:
    if not token_expiration:
        return True

    # Normaliza datetimes naive como UTC para evitar errores aware vs naive.
    exp = token_expiration
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)

    return exp < datetime.now(timezone.utc)


class LoginRequest(BaseModel):
    email: str
    password: str


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


@router.post("/request-otp")
def request_otp(body: OTPRequestBody, request: Request, db: Session = Depends(get_db)):
    _otp_request_limiter.check(request)

    usuario = db.query(Usuario).filter(Usuario.email == body.email).first()

    # Respuesta genérica para no revelar si el email existe (user enumeration)
    if not usuario:
        return {"message": "Si el email está registrado, recibirás un código OTP"}

    otp = usuario.generate_otp()
    db.commit()

    try:
        send_otp_email(usuario.email, otp)
    except Exception as e:
        # Revertir campos OTP si el envío falla para no dejar estado inconsistente
        usuario.otp_hash = None
        usuario.otp_expiration = None
        db.commit()
        raise HTTPException(status_code=500, detail=f"Error al enviar el email: {e}")

    return {"message": "Si el email está registrado, recibirás un código OTP"}


@router.post("/verify-otp", response_model=VerifyOTPResponse)
def verify_otp(body: VerifyOTPBody, request: Request, db: Session = Depends(get_db)):
    _otp_verify_limiter.check(request)

    usuario = db.query(Usuario).filter(Usuario.email == body.email).first()

    if not usuario or not usuario.verify_otp(body.otp):
        raise HTTPException(status_code=400, detail="OTP inválido o expirado")

    token = generate_token()
    usuario.token = token
    usuario.token_expiration = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()

    return VerifyOTPResponse(
        user=UserBasicResponse(
            id=usuario.id,
            email=usuario.email,
            nombre_completo=usuario.nombre_completo,
        ),
        token=token,
    )
