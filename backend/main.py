import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.routes import detectar, auth, buscar, prendas, users, favoritos, capturas, soporte
from app.database import engine, Base

logger = logging.getLogger(__name__)

# Crea las tablas nuevas si no existen todavía
Base.metadata.create_all(bind=engine)
app = FastAPI(title="StyleLens API", version="1.0")

# Origenes permitidos por CORS. En producción: definir CORS_ALLOWED_ORIGINS
# como lista separada por comas (sin espacios sobrantes). Las apps móviles
# nativas no pasan por CORS, así que esta lista solo afecta al cliente web.
_DEV_ORIGINS = [
    "http://localhost:8081",
    "http://localhost:19006",
    "http://localhost:3000",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:19006",
]
_env_origins = os.getenv("CORS_ALLOWED_ORIGINS")
allowed_origins = (
    [o.strip() for o in _env_origins.split(",") if o.strip()]
    if _env_origins
    else _DEV_ORIGINS
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(detectar.router, prefix="/api/v1", tags=["detectar"])
app.include_router(buscar.router, prefix="/api/v1", tags=["buscar"])
app.include_router(prendas.router, prefix="/api/v1", tags=["prendas"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(users.router)
app.include_router(favoritos.router, prefix="/api/v1", tags=["favoritos"])
app.include_router(capturas.router, prefix="/api/v1", tags=["capturas"])
app.include_router(soporte.router)


@app.get("/")
def health_check():
    """Liveness + DB readiness. Devuelve 503 si la BD no está disponible para
    que un orquestador (k8s, Docker healthcheck) pueda detectar caídas reales."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        logger.warning("DB healthcheck failed: %s", e)
        db_ok = False

    payload = {
        "status": "ok" if db_ok else "degraded",
        "service": "StyleLens API",
        "db": "ok" if db_ok else "unreachable",
    }
    if db_ok:
        return payload

    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=503, content=payload)
