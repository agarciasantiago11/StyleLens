from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Favorito, Prenda, Usuario
from app.schemas import FavoritoResponse
from app.auth_deps import get_current_user

router = APIRouter()


@router.get("/favoritos", response_model=list[FavoritoResponse])
def get_favoritos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return db.query(Favorito).filter(Favorito.usuario_id == current_user.id).all()


@router.post("/favoritos/{prenda_id}", response_model=FavoritoResponse, status_code=201)
def add_favorito(
    prenda_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    prenda = db.query(Prenda).filter(Prenda.id == prenda_id).first()
    if not prenda:
        raise HTTPException(status_code=404, detail="Prenda no encontrada")

    ya_existe = db.query(Favorito).filter(
        Favorito.usuario_id == current_user.id,
        Favorito.prenda_id == prenda_id,
    ).first()
    if ya_existe:
        raise HTTPException(status_code=400, detail="Ya está en favoritos")

    favorito = Favorito(usuario_id=current_user.id, prenda_id=prenda_id)
    db.add(favorito)
    db.commit()
    db.refresh(favorito)
    return favorito


@router.delete("/favoritos/{prenda_id}", status_code=204)
def remove_favorito(
    prenda_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    favorito = db.query(Favorito).filter(
        Favorito.usuario_id == current_user.id,
        Favorito.prenda_id == prenda_id,
    ).first()
    if not favorito:
        raise HTTPException(status_code=404, detail="Favorito no encontrado")
    db.delete(favorito)
    db.commit()
