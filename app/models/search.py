"""
Modelo de Búsqueda (Search).

Representa una búsqueda activa: un usuario que quiere armar un equipo para
jugar a un juego, con ciertas características (modo, servidor, roles necesarios).

Estados posibles:
- "open": acepta participantes
- "full": ya tiene la cantidad necesaria
- "in_progress": están jugando
- "completed": terminaron (acá se habilitan las reviews)
- "cancelled": el creador la canceló

Modos de unión:
- "manual": el creador acepta/rechaza cada postulante uno por uno
- "auto": si hay cupo y el server coincide, el usuario entra directamente
"""

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.game import Game
    from app.models.participation import Participation


class SearchStatus(str, Enum):
    """Estados posibles de una búsqueda."""

    OPEN = "open"
    FULL = "full"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class JoinMode(str, Enum):
    """Cómo se gestionan las uniones a esta búsqueda."""

    MANUAL = "manual"  # El creador acepta/rechaza cada postulante
    AUTO = "auto"      # Auto-aceptar si hay cupo


class Search(Base):
    __tablename__ = "searches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    creator_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    game_id: Mapped[int] = mapped_column(
        ForeignKey("games.id", ondelete="CASCADE"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Modo de juego: debe ser uno de Game.game_modes (validado en el router)
    mode: Mapped[str] = mapped_column(String(50), nullable=False)

    # Servidor donde se va a jugar (uno de Game.servers)
    server: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    # Roles que se están buscando.
    # Ejemplo para LoL: ["Jungla", "Support"]
    # Vacío significa que cualquier rol está bien.
    roles_needed: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    # Cantidad máxima de jugadores (incluyendo al creador)
    max_players: Mapped[int] = mapped_column(Integer, nullable=False)

    # Rango mínimo o preferido (texto libre, opcional)
    min_rank: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Estado actual de la búsqueda
    status: Mapped[str] = mapped_column(
        String(20), default=SearchStatus.OPEN.value, nullable=False, index=True
    )

    # Modo de unión (manual o auto)
    join_mode: Mapped[str] = mapped_column(
        String(20), default=JoinMode.MANUAL.value, nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ----- Relaciones -----
    creator: Mapped["User"] = relationship(back_populates="created_searches")
    game: Mapped["Game"] = relationship(back_populates="searches")
    participations: Mapped[list["Participation"]] = relationship(
        back_populates="search", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Search id={self.id} title={self.title!r} status={self.status}>"
