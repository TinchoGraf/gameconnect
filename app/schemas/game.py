"""
Schemas Pydantic para el recurso Game.

Los schemas definen cómo se ven los datos que entran y salen de la API.
Son distintos de los modelos SQLAlchemy: los modelos representan la BD,
los schemas representan el contrato de la API. Esta separación es clave
para mantener flexibilidad.

GameOut es lo que devolvemos al frontend cuando consulta los juegos.
"""

from pydantic import BaseModel, ConfigDict


class GameOut(BaseModel):
    """Datos que devolvemos al cliente al consultar un juego."""

    id: int
    name: str
    slug: str
    description: str | None
    roles: list[str]
    servers: list[str]
    game_modes: list[str]

    # Permite que Pydantic lea atributos de objetos SQLAlchemy directamente
    # (sin esto tendríamos que convertir manualmente cada campo).
    model_config = ConfigDict(from_attributes=True)
