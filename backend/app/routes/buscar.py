import hashlib
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Prenda
from app.schemas import BuscarResponse, PrendaResponse
from app.services import cloudinary_service, serpapi_service
from app.upload_utils import read_imagen_subida

router = APIRouter()


@router.post(
    "/buscar",
    response_model=BuscarResponse,
    deprecated=True,
    description="DEPRECATED: Usa POST /detectar-prenda con captura_id opcional.",
)
async def buscar_prenda(
    imagen: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    imagen_bytes = await read_imagen_subida(imagen)
    imagen_hash = hashlib.sha256(imagen_bytes).hexdigest()

    # 1. Buscar en caché
    prendas = db.query(Prenda).filter(Prenda.imagen_hash == imagen_hash).all()
    if prendas:
        return BuscarResponse(
            prendas=[PrendaResponse.model_validate(p) for p in prendas],
            total=len(prendas),
            desde_cache=True,
        )

    # 2. Si no hay caché → subir a Cloudinary
    try:
        cloudinary_url = cloudinary_service.subir_imagen(
            imagen_bytes, nombre=imagen_hash[:16]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")

    # 3. Buscar en SerpAPI
    try:
        resultados = serpapi_service.buscar_por_imagen(cloudinary_url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al consultar SerpAPI: {str(e)}")

    # 4. Guardar resultados en BD
    prendas_guardadas = []
    for r in resultados:
        prenda = Prenda(
            nombre=r["nombre"],
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
        return BuscarResponse(prendas=[], total=0, desde_cache=False)

    db.commit()
    for p in prendas_guardadas:
        db.refresh(p)

    return BuscarResponse(
        prendas=[PrendaResponse.model_validate(p) for p in prendas_guardadas],
        total=len(prendas_guardadas),
        desde_cache=False,
    )