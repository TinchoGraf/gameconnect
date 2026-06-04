"""
Schemas Pydantic para el recurso User.

Separamos en varios schemas según el caso:
- UserCreate: lo que recibimos al registrar (incluye password en texto plano)
- UserLogin: lo que recibimos al loguear
- UserOut: lo que devolvemos al cliente (NUNCA incluye password ni hash)

Esto evita el clásico bug de filtrar el password_hash en una respuesta.
Si un campo no está en UserOut, no se devuelve. Punto.
"""

from datetime import datetime
import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# Reglas de validación del password (las decidiste en la fase anterior).
# Las centralizamos para que sea fácil cambiarlas en un solo lugar.
MIN_PASSWORD_LENGTH = 8
PASSWORD_HELP_TEXT = (
    "Mínimo 8 caracteres, al menos una mayúscula y al menos un número."
)


def _validate_password_complexity(password: str) -> str:
    """
    Valida que el password cumpla las reglas de complejidad.
    Se llama desde los schemas que reciben passwords.
    """
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(
            f"El password debe tener al menos {MIN_PASSWORD_LENGTH} caracteres."
        )
    if not re.search(r"[A-Z]", password):
        raise ValueError("El password debe incluir al menos una mayúscula.")
    if not re.search(r"\d", password):
        raise ValueError("El password debe incluir al menos un número.")
    return password


# --------------------------------------------------------------------------
# Entradas (lo que recibe la API)
# --------------------------------------------------------------------------

class UserCreate(BaseModel):
    """Datos enviados por el cliente al registrarse."""

    username: str = Field(
        ...,
        min_length=3,
        max_length=30,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Solo letras, números, guiones y guiones bajos. 3-30 chars.",
    )
    email: EmailStr  # Pydantic valida formato de email automáticamente
    password: str = Field(..., description=PASSWORD_HELP_TEXT)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return _validate_password_complexity(v)


class UserLogin(BaseModel):
    """Datos enviados por el cliente al hacer login."""

    username: str
    password: str


# --------------------------------------------------------------------------
# Salidas (lo que devuelve la API)
# --------------------------------------------------------------------------

class UserOut(BaseModel):
    """
    Representación pública de un usuario.
    Lo que cualquier persona puede ver.
    NUNCA incluye email, password_hash, ni datos sensibles.
    """

    id: int
    username: str
    region: str | None
    bio: str | None
    avatar_url: str | None
    reputation_score: float
    reviews_received_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPrivateOut(UserOut):
    """
    Representación privada (solo el propio usuario la puede ver).
    Incluye email y otros datos que no son públicos.
    """

    email: EmailStr
