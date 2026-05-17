from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.auth_deps import get_current_user
from app.database import get_db
from app.models import Busqueda, Deteccion, Favorito, Resultado, Usuario
from app.schemas import (
    BBoxResponse,
    CapturaDetalleResponse,
    CapturaResumenResponse,
    DeteccionDetalleResponse,
    PrendaResponse,
    ResultadoDetalleResponse,
)

router = APIRouter()


@router.delete("/historial", status_code=204)
def eliminar_historial(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    busqueda_ids = [r for (r,) in db.query(Busqueda.id).filter(Busqueda.usuario_id == current_user.id).all()]
    if busqueda_ids:
        deteccion_ids = [r for (r,) in db.query(Deteccion.id).filter(Deteccion.busqueda_id.in_(busqueda_ids)).all()]
        if deteccion_ids:
            db.query(Resultado).filter(Resultado.deteccion_id.in_(deteccion_ids)).delete(synchronize_session=False)
        db.query(Deteccion).filter(Deteccion.busqueda_id.in_(busqueda_ids)).delete(synchronize_session=False)
    db.query(Favorito).filter(Favorito.usuario_id == current_user.id).delete(synchronize_session=False)
    db.query(Busqueda).filter(Busqueda.usuario_id == current_user.id).delete(synchronize_session=False)
    db.commit()


def _rank_or_last(r: Resultado) -> int:
    """Pone los Resultado sin rank al final del ordenamiento."""
    return r.rank if r.rank is not None else 9999


@router.get("/capturas", response_model=list[CapturaResumenResponse])
def listar_capturas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    # Subquery con COUNT por busqueda_id evita cargar todas las Detecciones
    # solo para hacer len(). 1 query total en lugar de 1+N.
    totales_subq = (
        select(
            Deteccion.busqueda_id.label("busqueda_id"),
            func.count(Deteccion.id).label("total"),
        )
        .group_by(Deteccion.busqueda_id)
        .subquery()
    )

    rows = (
        db.query(Busqueda, totales_subq.c.total)
        .outerjoin(totales_subq, totales_subq.c.busqueda_id == Busqueda.id)
        .filter(Busqueda.usuario_id == current_user.id)
        .order_by(Busqueda.created_at.desc())
        .all()
    )

    return [
        CapturaResumenResponse(
            id=b.id,
            imagen_original_url=b.imagen_original_url,
            fecha=b.created_at,
            total_detecciones=int(total or 0),
        )
        for b, total in rows
    ]


@router.get("/capturas/{captura_id}", response_model=CapturaDetalleResponse)
def detalle_captura(
    captura_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    # selectinload(Busqueda.detecciones) → 2 queries (busqueda + detecciones IN ...).
    captura = (
        db.query(Busqueda)
        .options(selectinload(Busqueda.detecciones))
        .filter(
            Busqueda.id == captura_id,
            Busqueda.usuario_id == current_user.id,
        )
        .first()
    )
    if not captura:
        raise HTTPException(status_code=404, detail="Captura no encontrada")

    # Conteo de resultados por detección en una sola query agregada.
    deteccion_ids = [d.id for d in captura.detecciones]
    if deteccion_ids:
        conteos_rows = (
            db.query(Resultado.deteccion_id, func.count(Resultado.id))
            .filter(Resultado.deteccion_id.in_(deteccion_ids))
            .group_by(Resultado.deteccion_id)
            .all()
        )
        conteos = {det_id: total for det_id, total in conteos_rows}
    else:
        conteos = {}

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
            total_resultados=int(conteos.get(det.id, 0)),
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
    # Verifica ownership con un único JOIN.
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

    # joinedload(Resultado.prenda) trae la Prenda en la misma query (LEFT OUTER JOIN).
    resultados = (
        db.query(Resultado)
        .options(joinedload(Resultado.prenda))
        .filter(Resultado.deteccion_id == deteccion_id)
        .order_by(Resultado.rank.asc().nullslast())
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
        if r.prenda is not None
    ]


@router.get("/capturas/{captura_id}/resultados", deprecated=True)
def captura_con_resultados(
    captura_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    # Pirámide eager: busqueda → detecciones → resultados → prendas. ~3-4 queries totales
    # en lugar de N×M lazy loads.
    captura = (
        db.query(Busqueda)
        .options(
            selectinload(Busqueda.detecciones)
            .selectinload(Deteccion.resultados)
            .joinedload(Resultado.prenda)
        )
        .filter(
            Busqueda.id == captura_id,
            Busqueda.usuario_id == current_user.id,
        )
        .first()
    )
    if not captura:
        raise HTTPException(status_code=404, detail="Captura no encontrada")

    detecciones_out = []
    for det in captura.detecciones:
        bbox = None
        if det.bbox_x is not None:
            bbox = {"x": det.bbox_x, "y": det.bbox_y, "w": det.bbox_w, "h": det.bbox_h}

        resultados_ord = sorted(det.resultados, key=_rank_or_last)

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
                for r in resultados_ord
                if r.prenda is not None
            ],
        })

    return {
        "id": str(captura.id),
        "imagen_original_url": captura.imagen_original_url,
        "fecha": captura.created_at,
        "detecciones": detecciones_out,
    }
