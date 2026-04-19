import hashlib
from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Prenda
from app.schemas import BuscarResponse, PrendaResponse

router = APIRouter()


@router.post("/buscar", response_model=BuscarResponse)
async def buscar_prenda(
    imagen: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Busca una prenda por imagen usando caché local (BD).
    Si no existe el hash, indica al cliente que use /detectar.
    """
    imagen_bytes = await imagen.read()
    imagen_hash = hashlib.sha256(imagen_bytes).hexdigest()

    prendas = db.query(Prenda).filter(Prenda.imagen_hash == imagen_hash).all()

    return BuscarResponse(
        prendas=[PrendaResponse.model_validate(p) for p in prendas],
        total=len(prendas),
        desde_cache=len(prendas) > 0,
    )
