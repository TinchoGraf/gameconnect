"""
Modelo de Juego.

Catálogo de videojuegos soportados por la plataforma. Los roles y servidores
disponibles los guardamos como JSON para que cada juego pueda tener su propia
lista sin necesidad de tablas adicionales.

Esta es una decisión consciente: como los roles y servidores son datos
relativamente estáticos y específicos por juego, JSON nos da flexibilidad
sin el overhead de tablas relacionales adicionales. Si en el futuro
necesitáramos consultar "todos los juegos que tienen rol 'jungla'", podríamos
migrar a tablas separadas — pero ese caso no aplica hoy.
"""

from typing import TYPE_CHECKING

from sqlalchemy import JSON, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.game_profile import GameProfile
    from app.models.search import Search


class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Nombre legible: "League of Legends"
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    # Identificador URL-friendly: "league-of-legends"
    # Lo usamos en endpoints tipo /games/league-of-legends/searches
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)

    # Descripción corta opcional
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Lista de roles disponibles en el juego.
    # Ejemplo para LoL: ["Top", "Jungla", "Mid", "ADC", "Support"]
    # Para juegos sin roles definidos podría ser una lista vacía.
    roles: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    # Lista de servidores/regiones del juego.
    # Ejemplo para LoL: ["LAS", "LAN", "NA", "EUW", "EUNE", "KR", "BR"]
    servers: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    # Modos de juego disponibles para crear búsquedas.
    # Más adelante podríamos hacer una tabla separada, pero por ahora alcanza.
    # Ejemplo: ["chill", "tryhard", "ranked", "normal"]
    game_modes: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    # ----- Relaciones -----
    profiles: Mapped[list["GameProfile"]] = relationship(
        back_populates="game", cascade="all, delete-orphan"
    )
    searches: Mapped[list["Search"]] = relationship(
        back_populates="game", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Game id={self.id} slug={self.slug!r}>"
