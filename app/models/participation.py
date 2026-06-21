"""
Modelo de Participación.

Tabla intermedia que registra qué usuarios se unieron a qué búsqueda,
con qué rol, y si confirmaron que la partida terminó.

La doble confirmación (creator_confirmed + participant_confirmed) es clave
para el sistema anti-troll: las reviews solo se habilitan cuando AMBAS
partes confirman que efectivamente jugaron.
"""

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.search import Search


class ParticipationStatus(str, Enum):
    """Estados de la participación de un usuario en una búsqueda."""

    PENDING = "pending"      # Solicitó unirse, esperando aprobación del creador
    ACCEPTED = "accepted"    # Aceptado, parte del equipo
    REJECTED = "rejected"    # Rechazado por el creador, o invitación rechazada
    LEFT = "left"            # Se salió antes de que termine
    INVITED = "invited"      # El creador lo invitó, esperando que el invitado responda


class Participation(Base):
    __tablename__ = "participations"

    # Un usuario solo puede tener una participación por búsqueda
    __table_args__ = (
        UniqueConstraint("search_id", "user_id", name="uq_search_user"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    search_id: Mapped[int] = mapped_column(
        ForeignKey("searches.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Rol elegido por este usuario dentro de la búsqueda
    # Debe ser uno de los roles necesarios o un rol válido del juego
    role: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Estado de la participación
    status: Mapped[str] = mapped_column(
        String(20), default=ParticipationStatus.PENDING.value, nullable=False
    )

    # Doble confirmación de que la partida ocurrió.
    # Las reviews solo se desbloquean cuando ambos campos están en True.
    creator_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    participant_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ----- Relaciones -----
    search: Mapped["Search"] = relationship(back_populates="participations")
    user: Mapped["User"] = relationship(back_populates="participations")

    @property
    def both_confirmed(self) -> bool:
        """Indica si ambas partes confirmaron la partida. Habilita reviews."""
        return self.creator_confirmed and self.participant_confirmed

    def __repr__(self) -> str:
        return f"<Participation search_id={self.search_id} user_id={self.user_id}>"
