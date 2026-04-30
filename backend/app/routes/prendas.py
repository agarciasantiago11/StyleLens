from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Prenda
from app.schemas import PrendaResponse

router = APIRouter()


@router.get("/prendas/{prenda_id}", response_model=PrendaResponse)
def obtener_prenda(prenda_id: UUID, db: Session = Depends(get_db)):
    prenda = db.query(Prenda).filter(Prenda.id == prenda_id).first()
    if not prenda:
        raise HTTPException(status_code=404, detail="Prenda no encontrada")
    return prenda
