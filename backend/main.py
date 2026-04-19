from fastapi import FastAPI
from app.routes import detectar, auth, buscar, prendas
from app.database import engine, Base

# Crea las tablas nuevas si no existen todavía
Base.metadata.create_all(bind=engine)
app = FastAPI(title="StyleLens API", version="1.0")

app.include_router(detectar.router, prefix="/api/v1", tags=["detectar"])
app.include_router(buscar.router, prefix="/api/v1", tags=["buscar"])
app.include_router(prendas.router, prefix="/api/v1", tags=["prendas"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])


@app.get("/")
def health_check():
    return {"status": "ok", "service": "StyleLens API"}
