from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth_deps import get_current_user
from app.database import get_db
from app.models import Busqueda, Deteccion, Resultado, Usuario
from app.schemas import (
    BBoxResponse,
    CapturaDetalleResponse,
    CapturaResumenResponse,
    DeteccionDetalleResponse,
    PrendaResponse,
    ResultadoDetalleResponse,
)

router = APIRouter()


@router.get("/capturas", response_model=list[CapturaResumenResponse])
def listar_capturas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    capturas = (
        db.query(Busqueda)
        .filter(Busqueda.usuario_id == current_user.id)
        .order_by(Busqueda.created_at.desc())
        .all()
    )

    return [
        CapturaResumenResponse(
            id=c.id,
            imagen_original_url=c.imagen_original_url,
            fecha=c.created_at,
            total_detecciones=len(c.detecciones),
        )
        for c in capturas
    ]


@router.get("/capturas/{captura_id}", response_model=CapturaDetalleResponse)
def detalle_captura(
    captura_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    captura = db.query(Busqueda).filter(
        Busqueda.id == captura_id,
        Busqueda.usuario_id == current_user.id,
    ).first()
    if not captura:
        raise HTTPException(status_code=404, detail="Captura no encontrada")

    detecciones = []
    for det in captura.detecciones:
        bbox = None
        if det.bbox_x is not None:
            bbox = BBoxResponse(x=det.bbox_x, y=det.bbox_y, w=det.bbox_w, h=det.bbox_h)

        detecciones.append(DeteccionDetalleResponse(
            id=det.id,
            clase=det.clase,
            confianza=det.confianza,
            bbox=bbox,
            recorte_url=det.recorte_url,
            total_resultados=len(det.resultados),
        ))

    return CapturaDetalleResponse(
        id=captura.id,
        imagen_original_url=captura.imagen_original_url,
        fecha=captura.created_at,
        detecciones=detecciones,
    )


@router.get("/detecciones/{deteccion_id}/resultados", response_model=list[ResultadoDetalleResponse])
def resultados_deteccion(
    deteccion_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    deteccion = (
        db.query(Deteccion)
        .join(Busqueda, Busqueda.id == Deteccion.busqueda_id)
        .filter(
            Deteccion.id == deteccion_id,
            Busqueda.usuario_id == current_user.id,
        )
        .first()
    )
    if not deteccion:
        raise HTTPException(status_code=404, detail="Detección no encontrada")

    resultados = (
        db.query(Resultado)
        .filter(Resultado.deteccion_id == deteccion_id)
        .order_by(Resultado.rank)
        .all()
    )

    return [
        ResultadoDetalleResponse(
            rank=r.rank,
            similitud_score=r.similitud_score,
            fuente=r.fuente,
            prenda=PrendaResponse.model_validate(r.prenda),
        )
        for r in resultados
    ]


@router.get("/capturas/{captura_id}/resultados")
def captura_con_resultados(
    captura_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    captura = db.query(Busqueda).filter(
        Busqueda.id == captura_id,
        Busqueda.usuario_id == current_user.id,
    ).first()
    if not captura:
        raise HTTPException(status_code=404, detail="Captura no encontrada")

    detecciones_out = []
    for det in captura.detecciones:
        bbox = None
        if det.bbox_x is not None:
            bbox = {"x": det.bbox_x, "y": det.bbox_y, "w": det.bbox_w, "h": det.bbox_h}

        resultados = (
            db.query(Resultado)
            .filter(Resultado.deteccion_id == det.id)
            .order_by(Resultado.rank)
            .all()
        )

        detecciones_out.append({
            "id": str(det.id),
            "clase": det.clase,
            "confianza": det.confianza,
            "bbox": bbox,
            "recorte_url": det.recorte_url,
            "resultados": [
                {
                    "rank": r.rank,
                    "similitud_score": r.similitud_score,
                    "fuente": r.fuente,
                    "prenda": PrendaResponse.model_validate(r.prenda).model_dump(),
                }
                for r in resultados
            ],
        })

    return {
        "id": str(captura.id),
        "imagen_original_url": captura.imagen_original_url,
        "fecha": captura.created_at,
        "detecciones": detecciones_out,
    }
