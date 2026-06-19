"""
Modelo de bloqueo entre usuarios.

Un bloqueo es UNILATERAL: A bloquea a B sin que B lo sepa.
Efectos del bloqueo:
- B no puede mandar solicitud de amistad a A
- A no puede mandar solicitud a B (no tendría sentido)
- Si eran amigos, la amistad se cancela automáticamente al bloquear

No hay estado: o hay bloqueo o no lo hay.
Desbloquear = borrar la fila.
"""

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Block(Base):
    __tablename__ = "blocks"

    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="uq_block_pair"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    blocker_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    blocked_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    blocker: Mapped["User"] = relationship(
        "User", foreign_keys=[blocker_id], back_populates="blocks_sent"
    )
    blocked: Mapped["User"] = relationship(
        "User", foreign_keys=[blocked_id], back_populates="blocks_received"
    )

    def __repr__(self) -> str:
        return f"<Block {self.blocker_id}→{self.blocked_id}>"