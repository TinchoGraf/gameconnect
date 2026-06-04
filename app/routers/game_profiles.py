"""
Endpoints de perfiles de juego (GameProfile).

Cada usuario puede tener un GameProfile por cada juego que juegue.
El perfil contiene los datos del jugador dentro de ese juego: roles,
servidor, rango, gamertag.

Las URLs usan el game_slug en vez del game_id porque es más legible:
    /users/me/game-profiles/league-of-legends
es más claro que
    /users/me/game-profiles/1

VALIDACIÓN DINÁMICA:
Las reglas de qué roles y servidores son válidos dependen del juego.
Por eso usamos un helper _validate_against_game que trae el juego desde
la BD y valida que los roles enviados estén en game.roles y el server
en game.servers. Esto es lo que se llama "validación a nivel de aplicación"
(vs validación a nivel de schema). La hacemos en el router porque
necesita acceso a la BD.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.game import Game
from app.models.game_profile import GameProfile
from app.models.user import User
from app.schemas.game_profile import (
    GameProfileCreate,
    GameProfileOut,
    GameProfileUpdate,
)

router = APIRouter(tags=["game-profiles"])


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def _get_game_by_slug_or_404(db: Session, slug: str) -> Game:
    """Trae el juego por slug o lanza 404. Reutilizable."""
    game = db.query(Game).filter(Game.slug == slug).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el juego con slug '{slug}'.",
        )
    return game


def _validate_against_game(
    game: Game,
    roles: list[str] | None = None,
    server: str | None = None,
) -> None:
    """
    Valida que los roles y server enviados sean válidos para este juego.
    Lanza 422 con mensaje explicativo si algo no cuadra.
    """
    if roles is not None:
        invalid = [r for r in roles if r not in game.roles]
        if invalid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"Roles inválidos para {game.name}: {invalid}. "
                    f"Roles permitidos: {game.roles}"
                ),
            )

    if server is not None and server not in game.servers:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Server inválido para {game.name}: '{server}'. "
                f"Servers permitidos: {game.servers}"
            ),
        )


def _get_my_profile_or_404(
    db: Session, user_id: int, game_slug: str
) -> GameProfile:
    """Trae el perfil del usuario para un juego, o 404."""
    game = _get_game_by_slug_or_404(db, game_slug)
    profile = (
        db.query(GameProfile)
        .options(joinedload(GameProfile.game))
        .filter(GameProfile.user_id == user_id, GameProfile.game_id == game.id)
        .first()
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No tenés un perfil para '{game_slug}'.",
        )
    return profile


# --------------------------------------------------------------------------
# Endpoints del usuario actual (/users/me/game-profiles)
# --------------------------------------------------------------------------

@router.post(
    "/users/me/game-profiles",
    response_model=GameProfileOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un perfil de juego propio",
)
def create_my_game_profile(
    data: GameProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Crea un perfil del usuario actual para un juego específico.

    Validaciones:
    - El juego (game_slug) debe existir.
    - Los roles enviados deben ser válidos para ese juego (Game.roles).
    - El servidor debe ser válido para ese juego (Game.servers).
    - El main_role debe estar incluido en la lista de roles (validado por el schema).
    - El usuario no puede tener ya un perfil para este juego.
    """
    game = _get_game_by_slug_or_404(db, data.game_slug)
    _validate_against_game(game, roles=data.roles, server=data.server)

    # Verificar duplicado (un perfil por usuario por juego).
    # Aunque la BD tiene un UniqueConstraint, conviene chequearlo acá para
    # dar un mensaje de error claro en lugar de un error genérico de SQL.
    existing = (
        db.query(GameProfile)
        .filter(
            GameProfile.user_id == current_user.id,
            GameProfile.game_id == game.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya tenés un perfil para '{game.name}'. Usá PUT para actualizarlo.",
        )

    profile = GameProfile(
        user_id=current_user.id,
        game_id=game.id,
        roles=data.roles,
        main_role=data.main_role,
        server=data.server,
        rank=data.rank,
        in_game_name=data.in_game_name,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    # Cargar la relación game para que el response_model funcione
    db.refresh(profile, attribute_names=["game"])

    return profile


@router.get(
    "/users/me/game-profiles",
    response_model=list[GameProfileOut],
    summary="Listar mis perfiles de juego",
)
def list_my_game_profiles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Devuelve todos los perfiles del usuario actual."""
    profiles = (
        db.query(GameProfile)
        .options(joinedload(GameProfile.game))
        .filter(GameProfile.user_id == current_user.id)
        .all()
    )
    return profiles


@router.get(
    "/users/me/game-profiles/{game_slug}",
    response_model=GameProfileOut,
    summary="Detalle de mi perfil para un juego",
)
def get_my_game_profile(
    game_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_my_profile_or_404(db, current_user.id, game_slug)


@router.put(
    "/users/me/game-profiles/{game_slug}",
    response_model=GameProfileOut,
    summary="Actualizar mi perfil para un juego",
)
def update_my_game_profile(
    game_slug: str,
    data: GameProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Actualiza el perfil del usuario para un juego.
    Solo modifica los campos que vengan en el body (campos no enviados
    se dejan como están).
    """
    profile = _get_my_profile_or_404(db, current_user.id, game_slug)

    # Validar contra el juego solo lo que llega en el body
    _validate_against_game(profile.game, roles=data.roles, server=data.server)

    # Si solo viene uno entre roles y main_role, validar contra el valor actual.
    # (El schema ya validó el caso en que vienen los dos.)
    new_roles = data.roles if data.roles is not None else profile.roles
    new_main_role = data.main_role if data.main_role is not None else profile.main_role

    if new_main_role is not None and new_main_role not in new_roles:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"main_role '{new_main_role}' debe estar incluido en roles {new_roles}."
            ),
        )

    # Aplicar cambios (solo los enviados)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.delete(
    "/users/me/game-profiles/{game_slug}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar mi perfil para un juego",
)
def delete_my_game_profile(
    game_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _get_my_profile_or_404(db, current_user.id, game_slug)
    db.delete(profile)
    db.commit()
    # 204 No Content: no devolvemos body


# --------------------------------------------------------------------------
# Endpoints públicos (/users/{username}/game-profiles)
# --------------------------------------------------------------------------

@router.get(
    "/users/{username}/game-profiles",
    response_model=list[GameProfileOut],
    summary="Listar perfiles públicos de un usuario",
)
def list_user_game_profiles(username: str, db: Session = Depends(get_db)):
    """Devuelve los perfiles públicos de cualquier usuario por su username."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el usuario '{username}'.",
        )

    profiles = (
        db.query(GameProfile)
        .options(joinedload(GameProfile.game))
        .filter(GameProfile.user_id == user.id)
        .all()
    )
    return profiles
