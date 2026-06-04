"""
Schemas Pydantic para el recurso GameProfile.

Un GameProfile representa los datos específicos de un usuario para un juego:
qué roles juega, en qué servidor, con qué rango, su nombre in-game.

Las validaciones que dependen del juego (que un rol exista en ese juego,
que un servidor sea válido) se hacen en el router porque necesitan acceso
a la BD. Las validaciones puramente estructurales (que main_role esté en
roles, que la lista no esté vacía) van acá en el schema.
"""

from pydantic import BaseModel, ConfigDict, Field, model_validator


# --------------------------------------------------------------------------
# Entradas
# --------------------------------------------------------------------------

class GameProfileCreate(BaseModel):
    """Datos para crear un perfil de juego."""

    game_slug: str = Field(
        ...,
        description="Slug del juego (ej: 'league-of-legends'). Debe ser uno de los juegos soportados.",
    )
    roles: list[str] = Field(
        ...,
        min_length=1,
        description="Roles que juega el usuario en este juego. Mínimo 1.",
    )
    main_role: str = Field(
        ...,
        description="Rol principal. Debe estar incluido en 'roles'.",
    )
    server: str = Field(
        ...,
        description="Servidor donde juega. Debe ser uno de los servidores válidos del juego.",
    )
    rank: str | None = Field(
        None,
        max_length=50,
        description="Rango actual (texto libre). Ej: 'Diamante II', 'Faceit 10'.",
    )
    in_game_name: str | None = Field(
        None,
        max_length=100,
        description="Nombre o tag del usuario dentro del juego.",
    )

    @model_validator(mode="after")
    def main_role_must_be_in_roles(self):
        """El main_role tiene que estar dentro de la lista de roles que juega."""
        if self.main_role not in self.roles:
            raise ValueError(
                f"main_role '{self.main_role}' debe estar incluido en roles: {self.roles}"
            )
        return self


class GameProfileUpdate(BaseModel):
    """
    Datos para actualizar un perfil existente.
    Todos los campos son opcionales: el usuario solo manda lo que quiere cambiar.

    Nota: game_slug no se puede cambiar. Si querés otro juego, creás otro perfil.
    """

    roles: list[str] | None = Field(None, min_length=1)
    main_role: str | None = None
    server: str | None = None
    rank: str | None = Field(None, max_length=50)
    in_game_name: str | None = Field(None, max_length=100)

    @model_validator(mode="after")
    def main_role_consistency(self):
        """
        Si actualizan main_role y roles al mismo tiempo, validar coherencia.
        Si actualizan solo uno de los dos, la validación final se hace en el router
        (necesita el valor actual del perfil para comparar).
        """
        if self.main_role is not None and self.roles is not None:
            if self.main_role not in self.roles:
                raise ValueError(
                    f"main_role '{self.main_role}' debe estar incluido en roles: {self.roles}"
                )
        return self


# --------------------------------------------------------------------------
# Salidas
# --------------------------------------------------------------------------

class GameProfileGameInfo(BaseModel):
    """Info resumida del juego, embebida en GameProfileOut.

    Permite que el frontend muestre directamente el nombre y slug del juego
    sin tener que hacer otra request.
    """

    id: int
    name: str
    slug: str

    model_config = ConfigDict(from_attributes=True)


class GameProfileOut(BaseModel):
    """Perfil de juego devuelto al cliente."""

    id: int
    user_id: int
    game: GameProfileGameInfo
    roles: list[str]
    main_role: str | None
    server: str
    rank: str | None
    in_game_name: str | None

    model_config = ConfigDict(from_attributes=True)
