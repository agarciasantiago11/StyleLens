from pydantic import BaseModel
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime


class PrendaResponse(BaseModel):
    id: UUID | str
    nombre: str
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    color: Optional[str] = None
    marca: Optional[str] = None
    precio: Optional[float] = None
    precio_actual: Optional[float] = None
    tienda: Optional[str] = None
    imagen_url: Optional[str] = None
    link: Optional[str] = None
    fuente_precio: Optional[str] = None

    model_config = {"from_attributes": True}


class DeteccionCreadaInfo(BaseModel):
    id: UUID
    clase: Optional[str] = None
    confianza: Optional[float] = None

    model_config = {"from_attributes": True}


class DetectarResponse(BaseModel):
    captura_id: UUID
    prendas_detectadas: list[PrendaResponse]
    total: int
    desde_cache: bool = False
    detecciones_creadas: list[DeteccionCreadaInfo] = []


class BBoxResponse(BaseModel):
    x: float
    y: float
    w: float
    h: float


class PrendaDetectadaBoxResponse(BaseModel):
    id: UUID | str
    clase: str
    confianza: float
    bbox: BBoxResponse


class DetectarCajasResponse(BaseModel):
    prendas_detectadas: list[PrendaDetectadaBoxResponse]
    total: int
    captura_id: Optional[UUID] = None


class BuscarResponse(BaseModel):
    prendas: list[PrendaResponse]
    total: int
    desde_cache: bool


class FavoritoResponse(BaseModel):
    prenda_id: UUID | str
    prenda: PrendaResponse
    created_at: datetime

    model_config = {"from_attributes": True}


class UserMeResponse(BaseModel):
    id: UUID | str | int
    email: str
    nombre_completo: str | None = None
    role_id: int | None = None
    role_priority: int = 0

    model_config = {"from_attributes": True}


class AccessRequestBody(BaseModel):
    email: str
    message: Literal["register request", "change password"]


class OTPRequestBody(BaseModel):
    email: str


class ChangePasswordBody(BaseModel):
    email: str
    new_password: str


class VerifyOTPBody(BaseModel):
    email: str
    otp: str
    message: str


class UserBasicResponse(BaseModel):
    id: UUID | str
    email: str
    nombre_completo: str | None = None

    model_config = {"from_attributes": True}


class VerifyOTPResponse(BaseModel):
    user: UserBasicResponse
    token: str


class CapturaResumenResponse(BaseModel):
    id: UUID
    imagen_original_url: Optional[str] = None
    fecha: datetime
    total_detecciones: int

    model_config = {"from_attributes": True}


class DeteccionDetalleResponse(BaseModel):
    id: UUID
    clase: Optional[str] = None
    confianza: Optional[float] = None
    bbox: Optional[BBoxResponse] = None
    recorte_url: Optional[str] = None
    total_resultados: int

    model_config = {"from_attributes": True}


class CapturaDetalleResponse(BaseModel):
    id: UUID
    imagen_original_url: Optional[str] = None
    fecha: datetime
    detecciones: list[DeteccionDetalleResponse]

    model_config = {"from_attributes": True}


class ResultadoDetalleResponse(BaseModel):
    rank: Optional[int] = None
    similitud_score: Optional[float] = None
    fuente: Optional[str] = None
    prenda: PrendaResponse

    model_config = {"from_attributes": True}


class RoleResponse(BaseModel):
    id: int
    nombre: str
    prioridad: int

    model_config = {"from_attributes": True}


class UserListItem(BaseModel):
    id: UUID | str
    email: str
    nombre_completo: str | None = None
    role_id: int | None = None
    role_nombre: str | None = None
    role_prioridad: int = 0
    is_active: bool = True

    model_config = {"from_attributes": True}
