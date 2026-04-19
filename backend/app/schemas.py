from pydantic import BaseModel
from typing import Optional


class PrendaResponse(BaseModel):
    id: int
    nombre: str
    categoria: str
    color: Optional[str] = None
    marca: Optional[str] = None
    precio: Optional[float] = None
    tienda: Optional[str] = None
    imagen_url: Optional[str] = None

    model_config = {"from_attributes": True}


class DetectarResponse(BaseModel):
    prendas_detectadas: list[PrendaResponse]
    total: int
