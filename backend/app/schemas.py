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


<<<<<<< HEAD
class FavoritoResponse(BaseModel):
    id: int
    prenda_id: int
    prenda: PrendaResponse
    created_at: datetime
=======
class UserMeResponse(BaseModel):
    id: UUID | str | int
    email: str
    nombre_completo: str | None = None
    role_id: int | None = None
    role_priority: int = 0
>>>>>>> DEV-61-s4-front-formulario-de-login-y-gestion-de-sesion

    model_config = {"from_attributes": True}
