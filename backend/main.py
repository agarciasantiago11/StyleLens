from fastapi import FastAPI
from app.routes import detectar
from app.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="StyleLens API", version="1.0")

app.include_router(detectar.router, tags=["Detección"])


@app.get("/")
def health_check():
    return {"status": "ok"}