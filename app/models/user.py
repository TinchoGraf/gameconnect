"""
Modelo de Usuario.

Representa una persona registrada en GameConnect. Tiene datos generales
(username, email, region) y campos calculados de reputación que se
actualizan a partir de las reviews que recibe.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from app.models.game_profile import GameProfile
    from app.models.search import Search
    from app.models.participation import Participation
    from app.models.review import Review
    from app.models.friendship import Friendship
    from app.models.block import Block


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    region: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    reputation_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    reviews_received_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reviewer_trust_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # ----- Relaciones existentes -----
    game_profiles: Mapped[list["GameProfile"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    created_searches: Mapped[list["Search"]] = relationship(
        back_populates="creator", cascade="all, delete-orphan"
    )
    participations: Mapped[list["Participation"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    reviews_authored: Mapped[list["Review"]] = relationship(
        back_populates="author",
        foreign_keys="Review.author_id",
        cascade="all, delete-orphan",
    )
    reviews_received: Mapped[list["Review"]] = relationship(
        back_populates="reviewed_user",
        foreign_keys="Review.reviewed_user_id",
        cascade="all, delete-orphan",
    )

    # ----- Relaciones de amistad -----
    # Solicitudes que YO mandé a otros
    sent_requests: Mapped[list["Friendship"]] = relationship(
        "Friendship",
        foreign_keys="Friendship.requester_id",
        back_populates="requester",
        cascade="all, delete-orphan",
    )
    # Solicitudes que OTROS me mandaron a mí
    received_requests: Mapped[list["Friendship"]] = relationship(
        "Friendship",
        foreign_keys="Friendship.addressee_id",
        back_populates="addressee",
        cascade="all, delete-orphan",
    )

    # ----- Relaciones de bloqueo -----
    # Usuarios que YO bloqueé
    blocks_sent: Mapped[list["Block"]] = relationship(
        "Block",
        foreign_keys="Block.blocker_id",
        back_populates="blocker",
        cascade="all, delete-orphan",
    )
    # Usuarios que ME bloquearon a mí
    blocks_received: Mapped[list["Block"]] = relationship(
        "Block",
        foreign_keys="Block.blocked_id",
        back_populates="blocked",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r}>"