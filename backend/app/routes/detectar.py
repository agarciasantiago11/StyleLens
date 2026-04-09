from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Prenda
from app.schemas import DetectarResponse, PrendaResponse

router = APIRouter()


@router.post("/detectar", response_model=DetectarResponse)
async def detectar_prendas(
    imagen: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Mock: devuelve las primeras 3 prendas de la BD
    # En S3 esto se reemplaza por YOLOv8 + FashionCLIP
    prendas = db.query(Prenda).limit(3).all()

    return DetectarResponse(
        prendas_detectadas=[PrendaResponse.model_validate(p) for p in prendas],
        total=len(prendas)
    )
