from fastapi import FastAPI
from app.routes import detectar

app = FastAPI(title="StyleLens API", version="1.0")

app.include_router(detectar.router, prefix="/api/v1", tags=["detectar"])


@app.get("/")
def health_check():
    return {"status": "ok", "service": "StyleLens API"}
