from fastapi import FastAPI
from app.routes import detectar, auth  # Esto está bien
from app.database import engine, Base  # Esto está bien
from app.routes import auth, users

# Esto crea las tablas nuevas si no existen todavía
Base.metadata.create_all(bind=engine)
app = FastAPI(title="StyleLens API", version="1.0")

app.include_router(detectar.router, prefix="/api/v1", tags=["detectar"])
# TU RUTA DE LOGIN (Tarea DEV-59)
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(users.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "StyleLens API"}
