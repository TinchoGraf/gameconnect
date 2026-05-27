"""
Importamos todos los modelos acá para que Alembic los detecte
automáticamente al generar migraciones.

Sin esto, Alembic no "vería" los modelos y no crearía las tablas.
"""

from app.models.user import User
from app.models.game import Game
from app.models.game_profile import GameProfile
from app.models.search import Search
from app.models.participation import Participation
from app.models.review import Review

__all__ = ["User", "Game", "GameProfile", "Search", "Participation", "Review"]
