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

# TYPE_CHECKING evita imports circulares. Solo se usan los tipos en
# anotaciones, no en tiempo de ejecución.
if TYPE_CHECKING:
    from app.models.game_profile import GameProfile
    from app.models.search import Search
    from app.models.participation import Participation
    from app.models.review import Review


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Datos de identidad
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Datos de perfil
    # Región general del usuario (no del juego, eso va en GameProfile).
    # Ejemplos: "Argentina", "España", "Chile". Sirve para filtros de zona horaria.
    region: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Reputación calculada (se actualiza desde las reviews que recibe).
    # Score promedio 0-5, número de reviews recibidas, y un score interno
    # de "confiabilidad como reviewer" para ponderar el peso de sus reviews.
    reputation_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    reviews_received_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reviewer_trust_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # ----- Relaciones -----
    # Un usuario puede tener múltiples perfiles de juego (uno por cada juego que juegue)
    game_profiles: Mapped[list["GameProfile"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    # Búsquedas que este usuario creó
    created_searches: Mapped[list["Search"]] = relationship(
        back_populates="creator", cascade="all, delete-orphan"
    )

    # Participaciones en búsquedas (búsquedas a las que se unió)
    participations: Mapped[list["Participation"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    # Reviews que escribió y reviews que recibió (dos relaciones distintas)
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

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r}>"
