from pydantic import BaseModel
from typing import Optional


class PrendaResponse(BaseModel):
    id: int
    nombre: str
    categoria: Optional[str] = None
    color: Optional[str] = None
    marca: Optional[str] = None
    precio: Optional[float] = None
    tienda: Optional[str] = None
    imagen_url: Optional[str] = None
    link: Optional[str] = None

    model_config = {"from_attributes": True}


class DetectarResponse(BaseModel):
    prendas_detectadas: list[PrendaResponse]
    total: int
    desde_cache: bool = False


class BuscarResponse(BaseModel):
    prendas: list[PrendaResponse]
    total: int
    desde_cache: bool
