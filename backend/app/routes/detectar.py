import hashlib
import logging
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Prenda
from app.schemas import (
    DetectarResponse,
    DetectarCajasResponse,
    PrendaResponse,
)
from app.services import cloudinary_service, serpapi_service, yolo_service

CLASES_YOLO = {
    "short_sleeved_shirt":   {"categoria": "prendas_superiores", "subcategoria": "camisetas"},
    "long_sleeved_shirt":    {"categoria": "prendas_superiores", "subcategoria": "camisetas"},
    "vest":                  {"categoria": "prendas_superiores", "subcategoria": "camisetas"},
    "sling":                 {"categoria": "prendas_superiores", "subcategoria": "camisetas"},
    "short_sleeved_outwear": {"categoria": "prendas_superiores", "subcategoria": "chaquetas_y_abrigos"},
    "long_sleeved_outwear":  {"categoria": "prendas_superiores", "subcategoria": "chaquetas_y_abrigos"},
    "shorts":                {"categoria": "prendas_inferiores", "subcategoria": "shorts"},
    "trousers":              {"categoria": "prendas_inferiores", "subcategoria": "pantalones"},
    "skirt":                 {"categoria": "prendas_inferiores", "subcategoria": "faldas"},
    "short_sleeved_dress":   {"categoria": "cuerpo_entero",      "subcategoria": "vestidos"},
    "long_sleeved_dress":    {"categoria": "cuerpo_entero",      "subcategoria": "vestidos"},
    "vest_dress":            {"categoria": "cuerpo_entero",      "subcategoria": "vestidos"},
    "sling_dress":           {"categoria": "cuerpo_entero",      "subcategoria": "vestidos"},
}

_FALLBACK = {"categoria": "otros", "subcategoria": "otros"}


def _map_clase(clase: str) -> tuple[str, str]:
    if not clase:
        return "otros", "otros"
    info = CLASES_YOLO.get(clase.strip().lower(), _FALLBACK)
    return info["categoria"], info["subcategoria"]


router = APIRouter()
logger = logging.getLogger(__name__)


def _guardar_resultados_en_bd(
    db: Session,
    imagen_hash: str,
    clase: str,
    recorte_bytes: bytes,
) -> list[Prenda]:
    try:
        nombre_cloud = f"{imagen_hash[:16]}_{clase}"
        cloudinary_url = cloudinary_service.subir_imagen(recorte_bytes, nombre=nombre_cloud)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")

    try:
        resultados = serpapi_service.buscar_por_imagen(cloudinary_url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al consultar SerpAPI: {str(e)}")

    categoria, subcategoria = _map_clase(clase)

    prendas_guardadas: list[Prenda] = []
    for r in resultados:
        prenda = Prenda(
            nombre=r["nombre"],
            categoria=categoria,
            subcategoria=subcategoria,
            tienda=r["tienda"],
            precio=r["precio"],
            imagen_url=r["imagen_url"],
            link=r["link"],
            imagen_hash=imagen_hash,
            cloudinary_url=cloudinary_url,
        )
        db.add(prenda)
        prendas_guardadas.append(prenda)

    return prendas_guardadas


def _build_detectar_response(prendas: list[Prenda], desde_cache: bool) -> DetectarResponse:
    if not prendas:
        return DetectarResponse(prendas_detectadas=[], total=0, desde_cache=desde_cache)

    return DetectarResponse(
        prendas_detectadas=[PrendaResponse.model_validate(p) for p in prendas],
        total=len(prendas),
        desde_cache=desde_cache,
    )


@router.post("/detectar-cajas", response_model=DetectarCajasResponse)
async def detectar_cajas(
    imagen: UploadFile = File(...),
):
    imagen_bytes = await imagen.read()

    try:
        cajas = yolo_service.detectar_cajas(imagen_bytes)
    except Exception as e:
        logger.warning("Fallo en deteccion YOLO para cajas, se usa fallback: %s", str(e))
        cajas = []

    if not cajas:
        cajas = [
            {
                "id": 0,
                "clase": "unknown",
                "confianza": 1.0,
                "bbox": {"x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0},
            }
        ]

    return DetectarCajasResponse(prendas_detectadas=cajas, total=len(cajas))


@router.post("/detectar", response_model=DetectarResponse)
async def detectar_prendas(
    imagen: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    imagen_bytes = await imagen.read()

    imagen_hash = hashlib.sha256(imagen_bytes).hexdigest()

    en_cache = db.query(Prenda).filter(Prenda.imagen_hash == imagen_hash).all()
    if en_cache:
        return DetectarResponse(
            prendas_detectadas=[PrendaResponse.model_validate(p) for p in en_cache],
            total=len(en_cache),
            desde_cache=True,
        )

    try:
        recortes = yolo_service.detectar_y_recortar(imagen_bytes)
    except Exception as e:
        logger.warning("Fallo en deteccion YOLO, se usa fallback de imagen completa: %s", str(e))
        recortes = []

    if not recortes:
        recortes = [{"bytes": imagen_bytes, "clase": "unknown", "confianza": 1.0}]

    prendas_guardadas = []
    for recorte in recortes:
        prendas_guardadas.extend(
            _guardar_resultados_en_bd(db, imagen_hash, recorte["clase"], recorte["bytes"])
        )

    if not prendas_guardadas:
        return _build_detectar_response([], desde_cache=False)

    db.commit()
    for p in prendas_guardadas:
        db.refresh(p)

    return _build_detectar_response(prendas_guardadas, desde_cache=False)


@router.post("/detectar-prenda", response_model=DetectarResponse)
async def detectar_prenda_individual(
    imagen: UploadFile = File(...),
    clase: str = Form("unknown"),
    x: float = Form(...),
    y: float = Form(...),
    w: float = Form(...),
    h: float = Form(...),
    db: Session = Depends(get_db),
):
    imagen_bytes = await imagen.read()

    if w <= 0 or h <= 0:
        raise HTTPException(status_code=422, detail="Las dimensiones de la bbox deben ser mayores a 0")

    selector = f"{clase}|{x:.6f}|{y:.6f}|{w:.6f}|{h:.6f}".encode("utf-8")
    imagen_hash = hashlib.sha256(imagen_bytes + selector).hexdigest()

    en_cache = db.query(Prenda).filter(Prenda.imagen_hash == imagen_hash).all()
    if en_cache:
        return _build_detectar_response(en_cache, desde_cache=True)

    try:
        recorte_bytes = yolo_service.recortar_por_bbox_normalizada(imagen_bytes, x=x, y=y, w=w, h=h)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al recortar la prenda: {str(e)}")

    prendas_guardadas = _guardar_resultados_en_bd(db, imagen_hash, clase, recorte_bytes)
    if not prendas_guardadas:
        return _build_detectar_response([], desde_cache=False)

    db.commit()
    for p in prendas_guardadas:
        db.refresh(p)

    return _build_detectar_response(prendas_guardadas, desde_cache=False)