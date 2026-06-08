"""
Schemas Pydantic para Participation.

Una Participation representa la unión de un usuario a una búsqueda.
Tiene un estado (pending/accepted/rejected/left) y campos para confirmar
que la partida ocurrió (para habilitar reviews en la Fase 5).
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class ParticipationStatusEnum(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    LEFT = "left"


# --------------------------------------------------------------------------
# Entradas
# --------------------------------------------------------------------------

class JoinRequest(BaseModel):
    """Datos al unirse a una búsqueda."""

    role: str | None = Field(
        None,
        description="Rol que el usuario quiere jugar. Debe estar en su GameProfile.",
    )


# --------------------------------------------------------------------------
# Salidas
# --------------------------------------------------------------------------

class ParticipationUserInfo(BaseModel):
    id: int
    username: str
    reputation_score: float

    model_config = ConfigDict(from_attributes=True)


class ParticipationOut(BaseModel):
    id: int
    search_id: int
    user: ParticipationUserInfo
    role: str | None
    status: str
    creator_confirmed: bool
    participant_confirmed: bool
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)
