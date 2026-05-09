import hashlib
import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth_deps import get_current_user
from app.database import get_db
from app.models import (
    Busqueda,
    Deteccion,
    Prenda,
    PrendaSuperior,
    PrendaInferior,
    CuerpoEntero,
    Resultado,
    Usuario,
)
from app.schemas import (
    DetectarResponse,
    DetectarCajasResponse,
    DeteccionCreadaInfo,
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

_CATEGORIA_MODEL: dict[str, type[Prenda]] = {
    "prendas_superiores": PrendaSuperior,
    "prendas_inferiores": PrendaInferior,
    "cuerpo_entero":      CuerpoEntero,
}


def _map_clase(clase: str) -> tuple[str, str]:
    if not clase:
        return "otros", "otros"
    info = CLASES_YOLO.get(clase.strip().lower(), _FALLBACK)
    return info["categoria"], info["subcategoria"]


router = APIRouter()
logger = logging.getLogger(__name__)


def _procesar_recorte(
    db: Session,
    busqueda_id: UUID,
    recorte_bytes: bytes,
    clase: str,
    confianza: float,
    bbox_x: float,
    bbox_y: float,
    bbox_w: float,
    bbox_h: float,
    imagen_hash_recorte: str,
    deteccion_existente: Optional[Deteccion] = None,
) -> tuple[Deteccion, list[Prenda], bool]:
    """
    Gestiona un recorte individual: busca caché de Prenda, si no llama a SerpAPI,
    crea Deteccion y Resultado records.
    Retorna (deteccion, prendas, desde_cache).
    """
    categoria, subcategoria = _map_clase(clase)
    modelo = _CATEGORIA_MODEL.get(categoria, Prenda)

    prendas_cache = db.query(Prenda).filter(Prenda.imagen_hash == imagen_hash_recorte).all()
    desde_cache = bool(prendas_cache)

    if prendas_cache:
        recorte_url = prendas_cache[0].cloudinary_url or ""
        prendas = prendas_cache
    else:
        nombre_cloud = f"{imagen_hash_recorte[:16]}_{clase}"
        try:
            recorte_url = cloudinary_service.subir_imagen(recorte_bytes, nombre=nombre_cloud)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")

        try:
            resultados_serp = serpapi_service.buscar_por_imagen(recorte_url)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Error al consultar SerpAPI: {str(e)}")

        prendas = []
        for r in resultados_serp:
            prenda = modelo(
                nombre=r["nombre"],
                categoria=categoria,
                subcategoria=subcategoria,
                tienda=r["tienda"],
                precio=r["precio"],
                imagen_url=r["imagen_url"],
                link=r["link"],
                imagen_hash=imagen_hash_recorte,
                cloudinary_url=recorte_url,
            )
            db.add(prenda)
            prendas.append(prenda)

    if deteccion_existente is not None:
        deteccion = deteccion_existente
        deteccion.clase = clase
        deteccion.confianza = confianza
        deteccion.bbox_x = bbox_x
        deteccion.bbox_y = bbox_y
        deteccion.bbox_w = bbox_w
        deteccion.bbox_h = bbox_h
        deteccion.recorte_url = recorte_url
        db.add(deteccion)
    else:
        deteccion = Deteccion(
            busqueda_id=busqueda_id,
            clase=clase,
            confianza=confianza,
            bbox_x=bbox_x,
            bbox_y=bbox_y,
            bbox_w=bbox_w,
            bbox_h=bbox_h,
            recorte_url=recorte_url,
        )
        db.add(deteccion)

    # Garantiza PKs de deteccion/prendas antes de crear Resultados con FKs directas.
    db.flush()

    for rank, prenda in enumerate(prendas, start=1):
        db.add(Resultado(
            deteccion_id=deteccion.id,
            prenda_id=prenda.id,
            rank=rank,
            fuente="cache" if desde_cache else "serpapi",
        ))

    return deteccion, prendas, desde_cache


@router.post("/detectar-cajas", response_model=DetectarCajasResponse)
async def detectar_cajas(
    imagen: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    imagen_bytes = await imagen.read()
    imagen_hash = hashlib.sha256(imagen_bytes).hexdigest()

    try:
        original_url = cloudinary_service.subir_imagen(
            imagen_bytes, nombre=f"original_{imagen_hash[:16]}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen original: {str(e)}")

    busqueda = Busqueda(
        usuario_id=current_user.id,
        imagen_original_url=original_url,
        imagen_hash_original=imagen_hash,
    )
    db.add(busqueda)
    db.commit()
    db.refresh(busqueda)

    try:
        cajas_detectadas = yolo_service.detectar_cajas(imagen_bytes)
    except Exception as e:
        logger.warning("Fallo en deteccion YOLO para cajas, se usa fallback: %s", str(e))
        cajas_detectadas = []

    if not cajas_detectadas:
        cajas_detectadas = [
            {
                "clase": "unknown",
                "confianza": 1.0,
                "bbox": {"x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0},
            }
        ]

    cajas = []
    for caja in cajas_detectadas:
        bbox = caja.get("bbox") or {"x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0}

        bbox_x = float(bbox.get("x", 0.0))
        bbox_y = float(bbox.get("y", 0.0))
        bbox_w = float(bbox.get("w", 1.0))
        bbox_h = float(bbox.get("h", 1.0))

        recorte_url = None
        try:
            recorte_bytes = yolo_service.recortar_por_bbox_normalizada(
                imagen_bytes,
                x=bbox_x,
                y=bbox_y,
                w=bbox_w,
                h=bbox_h,
            )
            selector = f"{caja.get('clase', 'unknown')}|{bbox_x:.6f}|{bbox_y:.6f}|{bbox_w:.6f}|{bbox_h:.6f}".encode("utf-8")
            recorte_hash = hashlib.sha256(imagen_bytes + selector).hexdigest()
            recorte_url = cloudinary_service.subir_imagen(
                recorte_bytes,
                nombre=f"det_{recorte_hash[:16]}_{caja.get('clase', 'unknown')}",
            )
        except Exception as e:
            logger.warning("No se pudo persistir recorte para deteccion en detectar-cajas: %s", str(e))

        det = Deteccion(
            busqueda_id=busqueda.id,
            clase=caja.get("clase", "unknown"),
            confianza=float(caja.get("confianza", 1.0)),
            bbox_x=bbox_x,
            bbox_y=bbox_y,
            bbox_w=bbox_w,
            bbox_h=bbox_h,
            recorte_url=recorte_url,
        )
        db.add(det)
        db.flush()

        cajas.append(
            {
                "id": str(det.id),
                "clase": det.clase or "unknown",
                "confianza": float(det.confianza or 1.0),
                "bbox": {
                    "x": float(det.bbox_x or 0.0),
                    "y": float(det.bbox_y or 0.0),
                    "w": float(det.bbox_w or 1.0),
                    "h": float(det.bbox_h or 1.0),
                },
            }
        )

    db.commit()
    db.refresh(busqueda)

    return DetectarCajasResponse(
        prendas_detectadas=cajas,
        total=len(cajas),
        captura_id=busqueda.id,
    )


@router.post("/detectar", response_model=DetectarResponse)
async def detectar_prendas(
    imagen: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    imagen_bytes = await imagen.read()
    imagen_hash = hashlib.sha256(imagen_bytes).hexdigest()

    try:
        original_url = cloudinary_service.subir_imagen(
            imagen_bytes, nombre=f"original_{imagen_hash[:16]}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen original: {str(e)}")

    busqueda = Busqueda(
        usuario_id=current_user.id,
        imagen_original_url=original_url,
        imagen_hash_original=imagen_hash,
    )
    db.add(busqueda)

    # Caché nivel 1: misma imagen ya procesada → clonar estructura de detecciones/resultados
    busqueda_anterior = (
        db.query(Busqueda)
        .filter(
            Busqueda.imagen_hash_original == imagen_hash,
            Busqueda.id != busqueda.id,
        )
        .first()
    )

    if busqueda_anterior and busqueda_anterior.detecciones:
        detecciones_creadas = []
        all_prendas = []

        for det_ant in busqueda_anterior.detecciones:
            nueva_det = Deteccion(
                busqueda_id=busqueda.id,
                clase=det_ant.clase,
                confianza=det_ant.confianza,
                bbox_x=det_ant.bbox_x,
                bbox_y=det_ant.bbox_y,
                bbox_w=det_ant.bbox_w,
                bbox_h=det_ant.bbox_h,
                recorte_url=det_ant.recorte_url,
            )
            db.add(nueva_det)

            # Garantiza PK de la deteccion clonada para enlazar Resultados.
            db.flush()

            for res_ant in det_ant.resultados:
                db.add(Resultado(
                    deteccion_id=nueva_det.id,
                    prenda_id=res_ant.prenda_id,
                    rank=res_ant.rank,
                    similitud_score=res_ant.similitud_score,
                    fuente="cache",
                ))
                if res_ant.prenda:
                    all_prendas.append(res_ant.prenda)

            detecciones_creadas.append(nueva_det)

        db.commit()

        return DetectarResponse(
            captura_id=busqueda.id,
            prendas_detectadas=[PrendaResponse.model_validate(p) for p in all_prendas],
            total=len(all_prendas),
            desde_cache=True,
            detecciones_creadas=[
                DeteccionCreadaInfo(id=d.id, clase=d.clase, confianza=d.confianza)
                for d in detecciones_creadas
            ],
        )

    # Sin caché: YOLO + procesar cada recorte
    try:
        recortes = yolo_service.detectar_y_recortar(imagen_bytes)
    except Exception as e:
        logger.warning("Fallo en deteccion YOLO, se usa fallback de imagen completa: %s", str(e))
        recortes = []

    if not recortes:
        recortes = [{
            "bytes": imagen_bytes,
            "clase": "unknown",
            "confianza": 1.0,
            "bbox_x": 0.0, "bbox_y": 0.0, "bbox_w": 1.0, "bbox_h": 1.0,
        }]

    detecciones_creadas = []
    all_prendas = []

    for recorte in recortes:
        clase = recorte["clase"]
        bbox_x = recorte.get("bbox_x", 0.0)
        bbox_y = recorte.get("bbox_y", 0.0)
        bbox_w = recorte.get("bbox_w", 1.0)
        bbox_h = recorte.get("bbox_h", 1.0)

        # Hash único por recorte (compatible con detectar-prenda)
        selector = f"{clase}|{bbox_x:.6f}|{bbox_y:.6f}|{bbox_w:.6f}|{bbox_h:.6f}".encode("utf-8")
        recorte_hash = hashlib.sha256(imagen_bytes + selector).hexdigest()

        deteccion, prendas, _ = _procesar_recorte(
            db=db,
            busqueda_id=busqueda.id,
            recorte_bytes=recorte["bytes"],
            clase=clase,
            confianza=recorte.get("confianza", 1.0),
            bbox_x=bbox_x,
            bbox_y=bbox_y,
            bbox_w=bbox_w,
            bbox_h=bbox_h,
            imagen_hash_recorte=recorte_hash,
        )
        detecciones_creadas.append(deteccion)
        all_prendas.extend(prendas)

    db.commit()
    for p in all_prendas:
        db.refresh(p)

    return DetectarResponse(
        captura_id=busqueda.id,
        prendas_detectadas=[PrendaResponse.model_validate(p) for p in all_prendas],
        total=len(all_prendas),
        desde_cache=False,
        detecciones_creadas=[
            DeteccionCreadaInfo(id=d.id, clase=d.clase, confianza=d.confianza)
            for d in detecciones_creadas
        ],
    )


@router.post("/detectar-prenda", response_model=DetectarResponse)
async def detectar_prenda_individual(
    imagen: UploadFile = File(...),
    clase: str = Form("unknown"),
    x: float = Form(...),
    y: float = Form(...),
    w: float = Form(...),
    h: float = Form(...),
    captura_id: Optional[str] = Form(None),
    deteccion_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    imagen_bytes = await imagen.read()

    if w <= 0 or h <= 0:
        raise HTTPException(status_code=422, detail="Las dimensiones de la bbox deben ser mayores a 0")

    # Obtener o crear Busqueda
    busqueda = None
    if captura_id:
        try:
            captura_uuid = UUID(captura_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="captura_id no es un UUID válido")

        busqueda = db.query(Busqueda).filter(
            Busqueda.id == captura_uuid,
            Busqueda.usuario_id == current_user.id,
        ).first()
        if not busqueda:
            raise HTTPException(status_code=404, detail="Captura no encontrada")

    if not busqueda:
        imagen_hash_orig = hashlib.sha256(imagen_bytes).hexdigest()
        try:
            original_url = cloudinary_service.subir_imagen(
                imagen_bytes, nombre=f"original_{imagen_hash_orig[:16]}"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al subir imagen original: {str(e)}")

        busqueda = Busqueda(
            usuario_id=current_user.id,
            imagen_original_url=original_url,
            imagen_hash_original=imagen_hash_orig,
        )
        db.add(busqueda)

    deteccion_existente: Optional[Deteccion] = None
    if deteccion_id:
        try:
            deteccion_uuid = UUID(deteccion_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="deteccion_id no es un UUID válido")

        deteccion_existente = (
            db.query(Deteccion)
            .join(Busqueda, Busqueda.id == Deteccion.busqueda_id)
            .filter(
                Deteccion.id == deteccion_uuid,
                Busqueda.usuario_id == current_user.id,
            )
            .first()
        )
        if not deteccion_existente:
            raise HTTPException(status_code=404, detail="Detección no encontrada")

        busqueda = deteccion_existente.busqueda
        clase = deteccion_existente.clase or clase
        x = float(deteccion_existente.bbox_x or x)
        y = float(deteccion_existente.bbox_y or y)
        w = float(deteccion_existente.bbox_w or w)
        h = float(deteccion_existente.bbox_h or h)

        if deteccion_existente.resultados:
            prendas_existentes = [r.prenda for r in sorted(deteccion_existente.resultados, key=lambda r: r.rank or 0) if r.prenda]
            return DetectarResponse(
                captura_id=busqueda.id,
                prendas_detectadas=[PrendaResponse.model_validate(p) for p in prendas_existentes],
                total=len(prendas_existentes),
                desde_cache=True,
                detecciones_creadas=[
                    DeteccionCreadaInfo(id=deteccion_existente.id, clase=deteccion_existente.clase, confianza=deteccion_existente.confianza)
                ],
            )

    selector = f"{clase}|{x:.6f}|{y:.6f}|{w:.6f}|{h:.6f}".encode("utf-8")
    imagen_hash = hashlib.sha256(imagen_bytes + selector).hexdigest()

    try:
        recorte_bytes = yolo_service.recortar_por_bbox_normalizada(imagen_bytes, x=x, y=y, w=w, h=h)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al recortar la prenda: {str(e)}")

    deteccion, prendas, desde_cache = _procesar_recorte(
        db=db,
        busqueda_id=busqueda.id,
        recorte_bytes=recorte_bytes,
        clase=clase,
        confianza=1.0,
        bbox_x=x,
        bbox_y=y,
        bbox_w=w,
        bbox_h=h,
        imagen_hash_recorte=imagen_hash,
        deteccion_existente=deteccion_existente,
    )

    db.commit()
    for p in prendas:
        db.refresh(p)

    return DetectarResponse(
        captura_id=busqueda.id,
        prendas_detectadas=[PrendaResponse.model_validate(p) for p in prendas],
        total=len(prendas),
        desde_cache=desde_cache,
        detecciones_creadas=[
            DeteccionCreadaInfo(id=deteccion.id, clase=deteccion.clase, confianza=deteccion.confianza)
        ],
    )
