"""
Schemas Pydantic para Search.

Igual que en GameProfile, la validación dinámica contra el juego
(que el modo, server y roles sean válidos) se hace en el router.
Acá solo validamos estructura y reglas independientes del juego.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class JoinModeEnum(str, Enum):
    MANUAL = "manual"
    AUTO = "auto"


class SearchStatusEnum(str, Enum):
    OPEN = "open"
    FULL = "full"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# --------------------------------------------------------------------------
# Entradas
# --------------------------------------------------------------------------

class SearchCreate(BaseModel):
    """Datos para crear una búsqueda."""

    game_slug: str = Field(..., description="Slug del juego (ej: 'league-of-legends')")
    title: str = Field(..., min_length=3, max_length=150)
    description: str | None = Field(None, max_length=1000)
    mode: str = Field(..., description="Modo de juego. Debe estar en Game.game_modes.")
    server: str = Field(..., description="Servidor. Debe estar en Game.servers.")
    roles_needed: list[str] = Field(
        default_factory=list,
        description="Roles buscados. Vacío significa cualquier rol.",
    )
    max_players: int = Field(
        ..., ge=2, le=10, description="Cantidad máxima de jugadores incluyendo al creador (2-10)."
    )
    min_rank: str | None = Field(None, max_length=50)
    join_mode: JoinModeEnum = Field(
        JoinModeEnum.MANUAL,
        description="manual: el creador aprueba cada postulante. auto: entra solo si hay cupo.",
    )


class SearchUpdate(BaseModel):
    """Actualización parcial. Solo los campos que se envían se modifican."""

    title: str | None = Field(None, min_length=3, max_length=150)
    description: str | None = Field(None, max_length=1000)
    roles_needed: list[str] | None = None
    min_rank: str | None = Field(None, max_length=50)
    # game, server, mode, max_players y join_mode no se pueden cambiar
    # después de crear (porque podría romper participaciones existentes)


# --------------------------------------------------------------------------
# Salidas
# --------------------------------------------------------------------------

class SearchCreatorInfo(BaseModel):
    id: int
    username: str
    reputation_score: float

    model_config = ConfigDict(from_attributes=True)


class SearchGameInfo(BaseModel):
    id: int
    name: str
    slug: str

    model_config = ConfigDict(from_attributes=True)


class SearchOut(BaseModel):
    id: int
    creator: SearchCreatorInfo
    game: SearchGameInfo
    title: str
    description: str | None
    mode: str
    server: str
    roles_needed: list[str]
    max_players: int
    min_rank: str | None
    status: str
    join_mode: str
    created_at: datetime
    completed_at: datetime | None
    # Cantidad de participantes aceptados (calculado en el router)
    accepted_count: int = 0

    model_config = ConfigDict(from_attributes=True)
