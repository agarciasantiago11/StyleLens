from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from pgvector.sqlalchemy import Vector
from sqlalchemy import select
from app.database import get_db
from app.models import Prenda
from app.schemas import DetectarResponse, PrendaResponse
from app.services.detector import detectar_y_embeddings

router = APIRouter()


@router.post("/detectar", response_model=DetectarResponse)
async def detectar_prendas(
    imagen: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    imagen_bytes = await imagen.read()

    detecciones = detectar_y_embeddings(imagen_bytes)

    if not detecciones:
        raise HTTPException(status_code=422, detail="No se detectaron prendas en la imagen.")

    # Para cada detección buscamos la prenda más similar en BD por coseno
    resultados = []
    vistos = set()

    for det in detecciones:
        embedding = det["embedding"]

        prenda = db.scalars(
            select(Prenda)
            .order_by(Prenda.embedding.cosine_distance(embedding))
            .limit(1)
        ).first()

        if prenda and prenda.id not in vistos:
            vistos.add(prenda.id)
            resultados.append(PrendaResponse.model_validate(prenda))

    return DetectarResponse(
        prendas_detectadas=resultados,
        total=len(resultados)
    )
