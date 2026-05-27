"""
Modelo de Review.

Una review es una calificación que un usuario (author) le da a otro
(reviewed_user) después de jugar juntos en una búsqueda confirmada.

Diseño anti-troll:
1. Solo se puede crear una review por par (autor, evaluado, búsqueda).
   No podés calificar a la misma persona 10 veces por la misma partida.
2. Múltiples categorías estructuradas (no solo una estrellita global).
   Forza a pensar en aspectos concretos en vez de "fue un troll".
3. Comentario libre con mínimo de caracteres (validado en schema).
4. La review está atada a una participación específica: si esa participación
   no tiene ambas confirmaciones, la review no se puede crear.
5. El peso de la review depende del reviewer_trust_score del autor.
   Un usuario con muchas reviews negativas pesa menos.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Review(Base):
    __tablename__ = "reviews"

    # Un autor no puede crear más de una review sobre el mismo usuario
    # en la misma búsqueda (anti spam de reviews)
    __table_args__ = (
        UniqueConstraint(
            "author_id", "reviewed_user_id", "search_id", name="uq_review_unique"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Quién escribe la review
    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # A quién se le hace la review
    reviewed_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # En qué búsqueda jugaron juntos (necesario para validar que efectivamente
    # compartieron una partida confirmada)
    search_id: Mapped[int] = mapped_column(
        ForeignKey("searches.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # ----- Categorías de evaluación (1 a 5 cada una) -----
    # Forzamos a calificar varias dimensiones en vez de una estrellita global.
    # Esto hace las reviews más útiles y más difíciles de "trolear".

    # Qué tan bueno fue comunicando (mic, callouts, info clara)
    communication: Mapped[int] = mapped_column(Integer, nullable=False)

    # Actitud general (positivo / negativo / tóxico)
    attitude: Mapped[int] = mapped_column(Integer, nullable=False)

    # Habilidad / nivel de juego percibido
    skill: Mapped[int] = mapped_column(Integer, nullable=False)

    # Confiabilidad (¿se quedó hasta el final? ¿estuvo a tiempo? ¿afk?)
    reliability: Mapped[int] = mapped_column(Integer, nullable=False)

    # Score promedio calculado a partir de las 4 categorías (cache)
    average_score: Mapped[float] = mapped_column(Float, nullable=False)

    # Peso aplicado al impacto de esta review en la reputación del evaluado.
    # Se calcula al crear la review en función del reviewer_trust_score del autor.
    # Snapshot: si el autor pierde confianza después, la review ya hecha no cambia.
    weight: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    # Comentario obligatorio (mínimo de caracteres validado en schema)
    # Forzar a explicar reduce reviews impulsivas y troleos rápidos.
    comment: Mapped[str] = mapped_column(String(1000), nullable=False)

    # ¿Recomendarías volver a jugar con este usuario?
    would_play_again: Mapped[bool] = mapped_column(Boolean, nullable=False)

    # ¿Fue marcada como sospechosa? (por ejemplo, review muy negativa cuando
    # el evaluado tiene historial muy positivo). Para revisión manual o
    # exclusión del cálculo de reputación.
    flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ----- Relaciones -----
    # Notar el foreign_keys explícito: como hay dos FKs a users (author y reviewed),
    # SQLAlchemy necesita que le digamos cuál usar en cada relación.
    author: Mapped["User"] = relationship(
        back_populates="reviews_authored", foreign_keys=[author_id]
    )
    reviewed_user: Mapped["User"] = relationship(
        back_populates="reviews_received", foreign_keys=[reviewed_user_id]
    )

    def __repr__(self) -> str:
        return (
            f"<Review id={self.id} author={self.author_id} "
            f"reviewed={self.reviewed_user_id} score={self.average_score}>"
        )
