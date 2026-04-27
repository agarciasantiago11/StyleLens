from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class PrendaResponse(BaseModel):
    id: UUID | str | int
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


class BBoxResponse(BaseModel):
    x: float
    y: float
    w: float
    h: float


class PrendaDetectadaBoxResponse(BaseModel):
    id: int
    clase: str
    confianza: float
    bbox: BBoxResponse


class DetectarCajasResponse(BaseModel):
    prendas_detectadas: list[PrendaDetectadaBoxResponse]
    total: int


class BuscarResponse(BaseModel):
    prendas: list[PrendaResponse]
    total: int
    desde_cache: bool


class FavoritoResponse(BaseModel):
    id: int
    prenda_id: int
    prenda: PrendaResponse
    created_at: datetime

    model_config = {"from_attributes": True}
