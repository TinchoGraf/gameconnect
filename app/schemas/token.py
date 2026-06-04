"""
Schema del token JWT.

Cuando un usuario hace login exitoso, devolvemos un Token.
El formato sigue el estándar OAuth2: { access_token, token_type }.
Esto permite que herramientas como Swagger UI lo usen automáticamente.
"""

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
