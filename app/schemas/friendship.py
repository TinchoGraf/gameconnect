"""
Schemas para el sistema de amigos y bloqueos.
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserMini(BaseModel):
    """Info mínima de un usuario para mostrar en listas de amigos."""
    id: int
    username: str
    reputation_score: float

    model_config = ConfigDict(from_attributes=True)


class FriendshipOut(BaseModel):
    """Solicitud de amistad devuelta al cliente."""
    id: int
    requester: UserMini
    addressee: UserMini
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FriendOut(BaseModel):
    """
    Un amigo en la lista de amigos.
    Muestra el 'otro' usuario (no el que hizo la consulta).
    """
    friendship_id: int
    user: UserMini
    since: datetime

    model_config = ConfigDict(from_attributes=True)