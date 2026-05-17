import logging
import os
import time
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Usuario, Role
from app.schemas import UserMeResponse, OTPRequestBody, AccessRequestBody, VerifyOTPBody
from app.auth_utils import verify_password, create_access_token, hash_token
from app.services.email_service import send_otp_email, send_access_request_email
from app.models import AccessRequest
from datetime import datetime, timedelta, timezone

router = APIRouter()
logger = logging.getLogger(__name__)


# Cuando la API está detrás de proxy/CDN/Nginx, request.client.host es la IP del
# proxy y todos los usuarios comparten la misma cubeta de rate limit. Si confías
# en X-Forwarded-For (porque tu proxy lo setea correctamente), activa esta env var.
_TRUST_FORWARDED_FOR = os.getenv("TRUST_FORWARDED_FOR", "false").lower() in {"1", "true", "yes"}


def _client_ip(request: Request) -> str:
    if _TRUST_FORWARDED_FOR:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            # Primer IP del header es el cliente original; el resto son proxies intermedios.
            return xff.split(",")[0].strip()
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
    return request.client.host if request.client else "unknown"


class _RateLimiter:
    """Rate limiter en memoria por IP. No persistente entre reinicios y no apto
    para multi-worker (cada worker tiene su propio dict). Para producción real,
    sustituir por Redis."""

    def __init__(self, max_calls: int, period_seconds: int):
        self.max_calls = max_calls
        self.period = period_seconds
        self._log: dict[str, list[float]] = defaultdict(list)

    def check(self, request: Request) -> None:
        ip = _client_ip(request)
        now = time.time()
        window_start = now - self.period

        self._log[ip] = [t for t in self._log[ip] if t > window_start]

        if len(self._log[ip]) >= self.max_calls:
            raise HTTPException(status_code=429, detail="Demasiadas peticiones, inténtalo más tarde")

        self._log[ip].append(now)


_otp_request_limiter = _RateLimiter(max_calls=5, period_seconds=60)
_otp_verify_limiter = _RateLimiter(max_calls=10, period_seconds=60)
_access_request_limiter = _RateLimiter(max_calls=3, period_seconds=60)


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

    token = create_access_token(str(usuario.id))
    # Guardamos el hash, no el token en claro: si la BD se compromete no se filtran sesiones activas.
    usuario.token = hash_token(token)
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
    usuario = db.query(Usuario).filter(Usuario.token == hash_token(token)).first()

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
    usuario = db.query(Usuario).filter(Usuario.token == hash_token(token)).first()

    if usuario:
        usuario.token = None
        usuario.token_expiration = None
        db.commit()

    return {"message": "Sesión cerrada correctamente"}


def _purge_pending_access_requests(db: Session, email: str, message: str) -> None:
    """Elimina solicitudes 'pending' anteriores del mismo email/message para evitar
    acumulación. Conserva las verified/accepted/rejected como histórico."""
    db.query(AccessRequest).filter(
        AccessRequest.email == email,
        AccessRequest.message == message,
        AccessRequest.status == "pending",
    ).delete(synchronize_session=False)


# Tope de solicitudes por email+message en la última hora. Evita que un atacante
# use un email ajeno como destinatario de spam aunque rote IPs.
_MAX_OTP_REQUESTS_PER_EMAIL_PER_HOUR = 3


def _email_request_limit_exceeded(db: Session, email: str, message: str) -> bool:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
    count = (
        db.query(AccessRequest)
        .filter(
            AccessRequest.email == email,
            AccessRequest.message == message,
            AccessRequest.created_at >= cutoff,
        )
        .count()
    )
    return count >= _MAX_OTP_REQUESTS_PER_EMAIL_PER_HOUR


def _emit_otp_for_email(
    db: Session,
    email: str,
    message: str,
    response_message: str,
) -> dict:
    """Crea AccessRequest + OTP + envía email. Si el envío falla, revierte
    el OTP y devuelve 500 (estado consistente)."""
    _purge_pending_access_requests(db, email, message)

    access_request = AccessRequest(email=email, message=message, status="pending")
    db.add(access_request)
    otp = access_request.generate_otp()
    db.commit()

    try:
        send_otp_email(email, otp)
    except Exception as e:
        access_request.otp_hash = None
        access_request.otp_expiration = None
        db.commit()
        raise HTTPException(status_code=500, detail=f"Error al enviar el email: {e}")

    return {"message": response_message}


@router.post("/request-register-otp")
def request_register_otp(body: OTPRequestBody, request: Request, db: Session = Depends(get_db)):
    _otp_request_limiter.check(request)

    # Mensaje genérico siempre: no leak de si el email existe o no.
    generic_response = {"message": "Si el email es válido, recibirás un código OTP de registro"}

    # 1. Si el email ya está registrado y activo, NO emitimos OTP. Las cuentas
    #    eliminadas (is_active=False) sí pueden re-registrarse.
    if db.query(Usuario).filter(Usuario.email == body.email, Usuario.is_active == True).first():
        return generic_response

    # 2. Rate-limit por email: aunque rote IPs, no más de N OTPs/hora al mismo destino.
    if _email_request_limit_exceeded(db, body.email, "register request"):
        return generic_response

    return _emit_otp_for_email(db, body.email, "register request", generic_response["message"])


@router.post("/request-passwordset-otp")
def request_passwordset_otp(body: OTPRequestBody, request: Request, db: Session = Depends(get_db)):
    _otp_request_limiter.check(request)

    generic_response = {"message": "Si el email es válido, recibirás un código OTP para reestablecer contraseña"}

    # 1. Sólo emitimos OTP si el email existe en usuarios. Para emails que no
    #    están registrados respondemos lo mismo (no enumeración) pero sin enviar nada.
    if not db.query(Usuario).filter(Usuario.email == body.email).first():
        return generic_response

    # 2. Rate-limit por email.
    if _email_request_limit_exceeded(db, body.email, "change password"):
        return generic_response

    return _emit_otp_for_email(db, body.email, "change password", generic_response["message"])


@router.post("/verify-otp")
def verify_otp(
    body: VerifyOTPBody,
    request: Request,
    db: Session = Depends(get_db),
):
    _otp_verify_limiter.check(request)

    if body.message not in {"register request", "change password", "reset 2fa"}:
        raise HTTPException(status_code=400, detail="Tipo de verificación OTP no válido")

    access_request = (
        db.query(AccessRequest)
        .filter(
            AccessRequest.email == body.email,
            AccessRequest.message == body.message,
            AccessRequest.status == "pending",
        )
        .order_by(AccessRequest.created_at.desc())
        .first()
    )

    if not access_request:
        raise HTTPException(status_code=404, detail="No hay OTP pendiente para este email")

    if not access_request.verify_otp(body.otp):
        db.commit()
        raise HTTPException(status_code=400, detail="OTP inválido o expirado")

    access_request.status = "verified"
    db.commit()

    return {
        "status": access_request.status,
        "message": access_request.message,
        "detail": "OTP verificado correctamente",
    }


@router.post("/request-access", deprecated=True)
def request_access(body: AccessRequestBody, request: Request, db: Session = Depends(get_db)):
    _access_request_limiter.check(request)

    access_request = AccessRequest(
        email=body.email,
        message=body.message,
    )
    db.add(access_request)
    db.commit()

    try:
        send_access_request_email(body.email, body.message)
    except Exception as e:
        # La solicitud queda guardada en BD aunque falle el email al admin
        logger.warning("No se pudo notificar al admin: %s", e)

    return {"message": "Solicitud enviada correctamente. El administrador se pondrá en contacto contigo."}
