"""
Modelo de solicitud de amistad entre usuarios.

Una Friendship representa una solicitud que A le manda a B.
Estados posibles:
- pending: A mandó solicitud, B no respondió
- accepted: B aceptó → son amigos
- rejected: B rechazó → A puede volver a intentar

El bloqueo es una relación SEPARADA (ver Block). Esto permite que:
- Rechazar = "ahora no", puede reintentar
- Bloquear = "nunca más", hasta que B desbloquee

Constraint: no puede haber dos filas con el mismo par (requester, addressee).
Si A le manda solicitud a B y B la rechaza, la fila se actualiza (no se crea otra).
"""

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Friendship(Base):
    __tablename__ = "friendships"

    __table_args__ = (
        UniqueConstraint("requester_id", "addressee_id", name="uq_friendship_pair"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Quien mandó la solicitud
    requester_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Quien la recibió
    addressee_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Estado: pending → accepted o rejected
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relaciones
    requester: Mapped["User"] = relationship(
        "User", foreign_keys=[requester_id], back_populates="sent_requests"
    )
    addressee: Mapped["User"] = relationship(
        "User", foreign_keys=[addressee_id], back_populates="received_requests"
    )

    def __repr__(self) -> str:
        return f"<Friendship {self.requester_id}→{self.addressee_id} [{self.status}]>"