import hashlib
import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Prenda
from app.schemas import DetectarResponse, PrendaResponse
from app.services import cloudinary_service, serpapi_service, yolo_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/detectar", response_model=DetectarResponse)
async def detectar_prendas(
    imagen: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    imagen_bytes = await imagen.read()

    # 1. Calcular hash para caché (sobre la imagen original)
    imagen_hash = hashlib.sha256(imagen_bytes).hexdigest()

    # 2. Comprobar caché en BD
    en_cache = db.query(Prenda).filter(Prenda.imagen_hash == imagen_hash).all()
    if en_cache:
        return DetectarResponse(
            prendas_detectadas=[PrendaResponse.model_validate(p) for p in en_cache],
            total=len(en_cache),
            desde_cache=True,
        )

    # 3. Detectar prendas con YOLO y obtener recortes individuales
    try:
        recortes = yolo_service.detectar_y_recortar(imagen_bytes)
    except Exception as e:
        logger.warning("Fallo en deteccion YOLO, se usa fallback de imagen completa: %s", str(e))
        recortes = []

    # Si YOLO no detecta nada, usar la imagen completa como fallback
    if not recortes:
        recortes = [{"bytes": imagen_bytes, "clase": "unknown", "confianza": 1.0}]

    # 4. Para cada recorte: subir a Cloudinary → llamar SerpAPI → guardar en BD
    prendas_guardadas = []

    for recorte in recortes:
        recorte_bytes = recorte["bytes"]
        clase = recorte["clase"]

        # Subir recorte a Cloudinary
        try:
            nombre_cloud = f"{imagen_hash[:16]}_{clase}"
            cloudinary_url = cloudinary_service.subir_imagen(recorte_bytes, nombre=nombre_cloud)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")

        # Buscar en SerpAPI con el recorte
        try:
            resultados = serpapi_service.buscar_por_imagen(cloudinary_url)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Error al consultar SerpAPI: {str(e)}")

        # Guardar resultados en BD asociados al hash original
        for r in resultados:
            prenda = Prenda(
                nombre=r["nombre"],
                categoria=clase,           # clase detectada por YOLO
                tienda=r["tienda"],
                precio=r["precio"],
                imagen_url=r["imagen_url"],
                link=r["link"],
                imagen_hash=imagen_hash,
                cloudinary_url=cloudinary_url,
            )
            db.add(prenda)
            prendas_guardadas.append(prenda)

    if not prendas_guardadas:
        return DetectarResponse(prendas_detectadas=[], total=0, desde_cache=False)

    db.commit()
    for p in prendas_guardadas:
        db.refresh(p)

    return DetectarResponse(
        prendas_detectadas=[PrendaResponse.model_validate(p) for p in prendas_guardadas],
        total=len(prendas_guardadas),
        desde_cache=False,
    )
