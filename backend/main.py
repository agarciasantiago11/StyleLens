from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import detectar, auth, buscar, prendas, users, favoritos
from app.database import engine, Base

# Crea las tablas nuevas si no existen todavía
Base.metadata.create_all(bind=engine)
app = FastAPI(title="StyleLens API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


@app.get("/")
def health_check():
    return {"status": "ok", "service": "StyleLens API"}
