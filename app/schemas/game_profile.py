"""
Schemas Pydantic para el recurso GameProfile.

Un GameProfile representa los datos específicos de un usuario para un juego:
qué roles juega, en qué servidor, con qué rango, su nombre in-game y
su nivel de experiencia en ese juego.

Las validaciones que dependen del juego (que un rol exista en ese juego,
que un servidor sea válido) se hacen en el router porque necesitan acceso
a la BD. Las validaciones puramente estructurales van acá.
"""

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# Valores válidos para el nivel de experiencia
VALID_EXPERIENCE_LEVELS = ["Novato", "Casual", "Veterano", "Pro"]


class GameProfileCreate(BaseModel):
    """Datos para crear un perfil de juego."""

    game_slug: str = Field(
        ...,
        description="Slug del juego (ej: 'league-of-legends').",
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
        description="Servidor donde juega.",
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
    experience_level: str = Field(
        ...,
        description=f"Nivel de experiencia. Uno de: {VALID_EXPERIENCE_LEVELS}",
    )

    @field_validator("experience_level")
    @classmethod
    def experience_level_must_be_valid(cls, v: str) -> str:
        if v not in VALID_EXPERIENCE_LEVELS:
            raise ValueError(
                f"Nivel de experiencia inválido: '{v}'. "
                f"Debe ser uno de: {VALID_EXPERIENCE_LEVELS}"
            )
        return v

    @model_validator(mode="after")
    def main_role_must_be_in_roles(self):
        if self.main_role not in self.roles:
            raise ValueError(
                f"main_role '{self.main_role}' debe estar incluido en roles: {self.roles}"
            )
        return self


class GameProfileUpdate(BaseModel):
    """
    Datos para actualizar un perfil existente.
    Todos los campos son opcionales: el usuario solo manda lo que quiere cambiar.
    """

    roles: list[str] | None = Field(None, min_length=1)
    main_role: str | None = None
    server: str | None = None
    rank: str | None = Field(None, max_length=50)
    in_game_name: str | None = Field(None, max_length=100)
    experience_level: str | None = None

    @field_validator("experience_level")
    @classmethod
    def experience_level_must_be_valid(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_EXPERIENCE_LEVELS:
            raise ValueError(
                f"Nivel de experiencia inválido: '{v}'. "
                f"Debe ser uno de: {VALID_EXPERIENCE_LEVELS}"
            )
        return v

    @model_validator(mode="after")
    def main_role_consistency(self):
        if self.main_role is not None and self.roles is not None:
            if self.main_role not in self.roles:
                raise ValueError(
                    f"main_role '{self.main_role}' debe estar incluido en roles: {self.roles}"
                )
        return self


class GameProfileGameInfo(BaseModel):
    """Info resumida del juego, embebida en GameProfileOut."""

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
    experience_level: str | None

    model_config = ConfigDict(from_attributes=True)