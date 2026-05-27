"""
Modelo de Perfil de Juego.

Tabla intermedia que conecta un Usuario con un Juego, guardando los datos
específicos de ese usuario en ese juego: qué roles juega, en qué servidor,
en qué rango está.

Esto permite que el mismo usuario tenga:
- En LoL: roles [Mid, Top], servidor LAS, rango Diamante
- En CS2: roles [AWPer], servidor SA, rango Supreme
Sin mezclar datos entre juegos.

Constraint importante: un usuario solo puede tener UN perfil por juego
(no tendría sentido tener dos perfiles del mismo juego).
"""

from typing import TYPE_CHECKING

from sqlalchemy import JSON, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.game import Game


class GameProfile(Base):
    __tablename__ = "game_profiles"

    # Constraint: un usuario no puede tener dos perfiles del mismo juego
    __table_args__ = (
        UniqueConstraint("user_id", "game_id", name="uq_user_game"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    game_id: Mapped[int] = mapped_column(
        ForeignKey("games.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Roles que juega este usuario en este juego.
    # Validamos contra Game.roles en la capa de schemas/lógica.
    # Ejemplo para un main mid que también juega top: ["Mid", "Top"]
    roles: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    # Servidor en el que juega. Debe ser uno de los Game.servers válidos.
    server: Mapped[str] = mapped_column(String(20), nullable=False)

    # Rango o nivel del jugador. Texto libre porque cada juego tiene su sistema.
    # Ejemplos: "Diamante II", "Faceit 10", "Iridiscente", "Gran Champion"
    rank: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Nombre/ID de invocador o gamertag dentro de ese juego.
    # Ejemplo: "Faker#KR1" en LoL, "STEAM_0:1:..." en CS, etc.
    in_game_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # ----- Relaciones -----
    user: Mapped["User"] = relationship(back_populates="game_profiles")
    game: Mapped["Game"] = relationship(back_populates="profiles")

    def __repr__(self) -> str:
        return f"<GameProfile user_id={self.user_id} game_id={self.game_id}>"
