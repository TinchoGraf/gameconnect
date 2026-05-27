"""
Endpoints relacionados a juegos.

En la Fase 1 solo necesitamos listar los juegos disponibles y consultar
el detalle de uno (con sus roles, servidores y modos).
Esto es lo que el frontend va a usar para llenar los dropdowns al crear
perfiles y búsquedas.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.game import Game
from app.schemas.game import GameOut

router = APIRouter(prefix="/games", tags=["games"])


@router.get("", response_model=list[GameOut])
def list_games(db: Session = Depends(get_db)):
    """Devuelve todos los juegos soportados por la plataforma."""
    return db.query(Game).order_by(Game.name).all()


@router.get("/{slug}", response_model=GameOut)
def get_game(slug: str, db: Session = Depends(get_db)):
    """Devuelve el detalle de un juego por su slug (ej: 'league-of-legends')."""
    game = db.query(Game).filter(Game.slug == slug).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el juego con slug '{slug}'",
        )
    return game
