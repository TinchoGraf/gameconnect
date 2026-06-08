"""
Schemas Pydantic para Review.

Las reviews tienen 4 categorías obligatorias (1-5 cada una) + comentario
con mínimo de caracteres + flag de "volverías a jugar".

El average_score y el weight los calcula el servidor, no el cliente, por eso
no están en el schema de entrada. El cliente solo manda las notas crudas.
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


# Mínimo de caracteres para el comentario (anti-troll: forzar a explicar)
MIN_COMMENT_LENGTH = 30


# --------------------------------------------------------------------------
# Entradas
# --------------------------------------------------------------------------

class ReviewCreate(BaseModel):
    """Datos para crear una review."""

    reviewed_user_id: int = Field(..., description="Id del usuario que estoy calificando.")
    search_id: int = Field(..., description="Id de la búsqueda donde jugamos juntos.")

    # Notas por categoría (1-5)
    communication: int = Field(..., ge=1, le=5, description="Comunicación durante la partida.")
    attitude: int = Field(..., ge=1, le=5, description="Actitud y respeto.")
    skill: int = Field(..., ge=1, le=5, description="Nivel de juego percibido.")
    reliability: int = Field(..., ge=1, le=5, description="Confiabilidad (no afk, puntual, etc.)")

    # Texto y recomendación
    comment: str = Field(
        ...,
        min_length=MIN_COMMENT_LENGTH,
        max_length=1000,
        description=f"Comentario obligatorio. Mínimo {MIN_COMMENT_LENGTH} caracteres.",
    )
    would_play_again: bool = Field(..., description="¿Volverías a jugar con esta persona?")


# --------------------------------------------------------------------------
# Salidas
# --------------------------------------------------------------------------

class ReviewAuthorInfo(BaseModel):
    id: int
    username: str
    reviewer_trust_score: float

    model_config = ConfigDict(from_attributes=True)


class ReviewOut(BaseModel):
    id: int
    author: ReviewAuthorInfo
    reviewed_user_id: int
    search_id: int

    communication: int
    attitude: int
    skill: int
    reliability: int
    average_score: float
    weight: float

    comment: str
    would_play_again: bool
    flagged: bool

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PendingReviewOut(BaseModel):
    """Una partida confirmada donde todavía no escribiste review."""

    search_id: int
    search_title: str
    game_slug: str
    completed_at: datetime | None
    # Usuarios pendientes de review en esa partida
    pending_users: list["PendingReviewUser"]


class PendingReviewUser(BaseModel):
    user_id: int
    username: str

    model_config = ConfigDict(from_attributes=True)


# Resolución del forward reference
PendingReviewOut.model_rebuild()
