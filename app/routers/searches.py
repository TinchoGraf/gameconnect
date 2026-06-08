"""
Endpoints del sistema de búsquedas (LFG - Looking For Group).

Una Search es alguien que quiere armar equipo para jugar. Otros usuarios
pueden unirse, y cuando termine la partida se habilitan las reviews.

Reglas de negocio clave:
- Para unirse, el usuario debe tener GameProfile en ese juego (Fase 3)
- El server del perfil debe coincidir con el de la búsqueda
- Si la búsqueda es join_mode=auto, entrar es directo si hay cupo
- Si es join_mode=manual, queda en estado 'pending' hasta que el creador apruebe
- Solo el creador puede editar, cancelar, aceptar/rechazar, o cambiar el estado
- El creador es automáticamente un participante 'accepted' al crear la búsqueda
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.game import Game
from app.models.game_profile import GameProfile
from app.models.participation import Participation, ParticipationStatus
from app.models.search import JoinMode, Search, SearchStatus
from app.models.user import User
from app.schemas.participation import JoinRequest, ParticipationOut
from app.schemas.search import SearchCreate, SearchOut, SearchUpdate

router = APIRouter(prefix="/searches", tags=["searches"])


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def _get_game_by_slug_or_404(db: Session, slug: str) -> Game:
    game = db.query(Game).filter(Game.slug == slug).first()
    if not game:
        raise HTTPException(404, f"No existe el juego con slug '{slug}'.")
    return game


def _get_search_or_404(db: Session, search_id: int) -> Search:
    """Trae la búsqueda con relaciones cargadas, o 404."""
    search = (
        db.query(Search)
        .options(joinedload(Search.creator), joinedload(Search.game))
        .filter(Search.id == search_id)
        .first()
    )
    if not search:
        raise HTTPException(404, f"No existe la búsqueda con id {search_id}.")
    return search


def _count_accepted(db: Session, search_id: int) -> int:
    """Cuenta cuántos participantes aceptados tiene una búsqueda."""
    return (
        db.query(Participation)
        .filter(
            Participation.search_id == search_id,
            Participation.status == ParticipationStatus.ACCEPTED.value,
        )
        .count()
    )


def _to_search_out(db: Session, search: Search) -> SearchOut:
    """Convierte un Search a SearchOut incluyendo el conteo de aceptados."""
    data = SearchOut.model_validate(search)
    data.accepted_count = _count_accepted(db, search.id)
    return data


def _require_creator(search: Search, user: User) -> None:
    """Lanza 403 si el usuario no es el creador de la búsqueda."""
    if search.creator_id != user.id:
        raise HTTPException(
            403, "Solo el creador de la búsqueda puede hacer esto."
        )


def _validate_against_game(
    game: Game,
    mode: str | None = None,
    server: str | None = None,
    roles: list[str] | None = None,
) -> None:
    """Validación dinámica contra el juego (mismo patrón que en game-profiles)."""
    if mode is not None and mode not in game.game_modes:
        raise HTTPException(
            422,
            f"Modo '{mode}' no válido para {game.name}. "
            f"Modos permitidos: {game.game_modes}",
        )
    if server is not None and server not in game.servers:
        raise HTTPException(
            422,
            f"Server '{server}' no válido para {game.name}. "
            f"Servers permitidos: {game.servers}",
        )
    if roles:
        invalid = [r for r in roles if r not in game.roles]
        if invalid:
            raise HTTPException(
                422,
                f"Roles inválidos para {game.name}: {invalid}. "
                f"Roles permitidos: {game.roles}",
            )


# --------------------------------------------------------------------------
# CRUD de búsquedas
# --------------------------------------------------------------------------

@router.post(
    "",
    response_model=SearchOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una búsqueda",
)
def create_search(
    data: SearchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Crea una búsqueda. El creador se agrega automáticamente como participante
    aceptado, contando en max_players.
    """
    game = _get_game_by_slug_or_404(db, data.game_slug)
    _validate_against_game(
        game, mode=data.mode, server=data.server, roles=data.roles_needed
    )

    # El creador debe tener perfil en este juego (regla de negocio)
    creator_profile = (
        db.query(GameProfile)
        .filter(
            GameProfile.user_id == current_user.id,
            GameProfile.game_id == game.id,
        )
        .first()
    )
    if not creator_profile:
        raise HTTPException(
            422,
            f"Necesitás un perfil de {game.name} antes de crear una búsqueda. "
            f"Crealo en POST /users/me/game-profiles.",
        )

    # El server del perfil debe coincidir con el de la búsqueda
    if creator_profile.server != data.server:
        raise HTTPException(
            422,
            f"Tu perfil de {game.name} juega en '{creator_profile.server}', "
            f"pero la búsqueda es en '{data.server}'. No podés crear una "
            f"búsqueda en un servidor distinto al de tu perfil.",
        )

    search = Search(
        creator_id=current_user.id,
        game_id=game.id,
        title=data.title,
        description=data.description,
        mode=data.mode,
        server=data.server,
        roles_needed=data.roles_needed,
        max_players=data.max_players,
        min_rank=data.min_rank,
        join_mode=data.join_mode.value,
    )
    db.add(search)
    db.flush()  # Para tener el search.id sin commit todavía

    # El creador es participante aceptado automáticamente
    creator_participation = Participation(
        search_id=search.id,
        user_id=current_user.id,
        role=creator_profile.main_role,
        status=ParticipationStatus.ACCEPTED.value,
    )
    db.add(creator_participation)

    db.commit()
    db.refresh(search)
    return _to_search_out(db, search)


@router.get(
    "",
    response_model=list[SearchOut],
    summary="Listar búsquedas con filtros opcionales",
)
def list_searches(
    game_slug: str | None = None,
    server: str | None = None,
    mode: str | None = None,
    status_filter: str | None = None,
    db: Session = Depends(get_db),
):
    """
    Lista búsquedas. Por defecto muestra solo las que están 'open'.

    Filtros opcionales:
    - game_slug: solo búsquedas de ese juego
    - server: solo de ese servidor
    - mode: solo de ese modo (chill, tryhard, etc.)
    - status_filter: estado específico (open, full, in_progress, etc.)
    """
    query = db.query(Search).options(
        joinedload(Search.creator), joinedload(Search.game)
    )

    if game_slug:
        game = _get_game_by_slug_or_404(db, game_slug)
        query = query.filter(Search.game_id == game.id)
    if server:
        query = query.filter(Search.server == server)
    if mode:
        query = query.filter(Search.mode == mode)

    # Por defecto solo búsquedas abiertas
    target_status = status_filter or SearchStatus.OPEN.value
    query = query.filter(Search.status == target_status)

    searches = query.order_by(Search.created_at.desc()).all()
    return [_to_search_out(db, s) for s in searches]


@router.get(
    "/{search_id}",
    response_model=SearchOut,
    summary="Detalle de una búsqueda",
)
def get_search(search_id: int, db: Session = Depends(get_db)):
    search = _get_search_or_404(db, search_id)
    return _to_search_out(db, search)


@router.put(
    "/{search_id}",
    response_model=SearchOut,
    summary="Editar mi búsqueda (solo el creador)",
)
def update_search(
    search_id: int,
    data: SearchUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    search = _get_search_or_404(db, search_id)
    _require_creator(search, current_user)

    if search.status not in (SearchStatus.OPEN.value, SearchStatus.FULL.value):
        raise HTTPException(
            409,
            f"No se puede editar una búsqueda en estado '{search.status}'.",
        )

    # Validar nuevos roles_needed contra el juego si se envían
    if data.roles_needed is not None:
        _validate_against_game(search.game, roles=data.roles_needed)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(search, field, value)

    db.commit()
    db.refresh(search)
    return _to_search_out(db, search)


@router.delete(
    "/{search_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancelar mi búsqueda (solo el creador)",
)
def cancel_search(
    search_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Marca la búsqueda como 'cancelled'. No la borra de la BD para mantener
    el historial (útil para reviews si llegaron a jugar antes de cancelar).
    """
    search = _get_search_or_404(db, search_id)
    _require_creator(search, current_user)

    if search.status in (SearchStatus.COMPLETED.value, SearchStatus.CANCELLED.value):
        raise HTTPException(409, f"La búsqueda ya está en estado '{search.status}'.")

    search.status = SearchStatus.CANCELLED.value
    db.commit()


# --------------------------------------------------------------------------
# Participación: unirse, salirse
# --------------------------------------------------------------------------

@router.post(
    "/{search_id}/join",
    response_model=ParticipationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Unirse a una búsqueda",
)
def join_search(
    search_id: int,
    data: JoinRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Solicita unirse a una búsqueda.

    Reglas:
    - La búsqueda debe estar 'open'
    - El usuario no puede ser el creador (ya es participante automáticamente)
    - El usuario no puede ya estar participando (en cualquier estado activo)
    - Debe tener GameProfile en el juego de la búsqueda
    - El server de su perfil debe coincidir con el de la búsqueda
    - Si especifica un rol, debe estar entre los que juega en su perfil

    Comportamiento según join_mode:
    - manual: la participación queda en 'pending', el creador aprueba/rechaza
    - auto: la participación queda en 'accepted' directamente si hay cupo
    """
    search = _get_search_or_404(db, search_id)

    if search.status != SearchStatus.OPEN.value:
        raise HTTPException(
            409, f"La búsqueda no está abierta (estado: '{search.status}')."
        )

    if search.creator_id == current_user.id:
        raise HTTPException(409, "Ya sos parte de esta búsqueda como creador.")

    # ¿Ya está participando?
    existing = (
        db.query(Participation)
        .filter(
            Participation.search_id == search_id,
            Participation.user_id == current_user.id,
        )
        .first()
    )
    if existing and existing.status in (
        ParticipationStatus.PENDING.value,
        ParticipationStatus.ACCEPTED.value,
    ):
        raise HTTPException(
            409,
            f"Ya tenés una participación en esta búsqueda con estado '{existing.status}'.",
        )

    # Validar perfil del usuario en el juego
    profile = (
        db.query(GameProfile)
        .filter(
            GameProfile.user_id == current_user.id,
            GameProfile.game_id == search.game_id,
        )
        .first()
    )
    if not profile:
        raise HTTPException(
            422,
            f"Necesitás un perfil de {search.game.name} para unirte. "
            f"Crealo en POST /users/me/game-profiles.",
        )

    # Validar server
    if profile.server != search.server:
        raise HTTPException(
            422,
            f"Tu perfil juega en '{profile.server}' pero la búsqueda es en "
            f"'{search.server}'. No podés unirte por diferencia de servidor.",
        )

    # Si el usuario especifica un rol, validar que esté en su perfil
    if data.role is not None and data.role not in profile.roles:
        raise HTTPException(
            422,
            f"No jugás el rol '{data.role}' en tu perfil. "
            f"Tus roles: {profile.roles}",
        )

    # Decidir estado inicial según join_mode
    accepted_count = _count_accepted(db, search.id)
    if search.join_mode == JoinMode.AUTO.value:
        if accepted_count >= search.max_players:
            raise HTTPException(409, "La búsqueda ya está llena.")
        new_status = ParticipationStatus.ACCEPTED.value
    else:
        new_status = ParticipationStatus.PENDING.value

    # Si ya existe pero está rejected/left, actualizamos en vez de crear nuevo
    if existing:
        existing.status = new_status
        existing.role = data.role or profile.main_role
        participation = existing
    else:
        participation = Participation(
            search_id=search.id,
            user_id=current_user.id,
            role=data.role or profile.main_role,
            status=new_status,
        )
        db.add(participation)

    # Si quedamos full por auto-aceptar, actualizar el estado de la búsqueda
    if new_status == ParticipationStatus.ACCEPTED.value:
        if accepted_count + 1 >= search.max_players:
            search.status = SearchStatus.FULL.value

    db.commit()
    db.refresh(participation)
    return participation


@router.post(
    "/{search_id}/leave",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Salirse de una búsqueda",
)
def leave_search(
    search_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    search = _get_search_or_404(db, search_id)

    if search.creator_id == current_user.id:
        raise HTTPException(
            409, "El creador no puede salirse. Si querés deshacerla, cancelala."
        )

    participation = (
        db.query(Participation)
        .filter(
            Participation.search_id == search_id,
            Participation.user_id == current_user.id,
        )
        .first()
    )
    if not participation or participation.status not in (
        ParticipationStatus.PENDING.value,
        ParticipationStatus.ACCEPTED.value,
    ):
        raise HTTPException(404, "No estás participando en esta búsqueda.")

    was_accepted = participation.status == ParticipationStatus.ACCEPTED.value
    participation.status = ParticipationStatus.LEFT.value

    # Si la búsqueda estaba 'full' y se va alguien aceptado, vuelve a 'open'
    if was_accepted and search.status == SearchStatus.FULL.value:
        search.status = SearchStatus.OPEN.value

    db.commit()


# --------------------------------------------------------------------------
# Aceptar / rechazar postulantes (solo creador)
# --------------------------------------------------------------------------

@router.post(
    "/{search_id}/participations/{user_id}/accept",
    response_model=ParticipationOut,
    summary="Aceptar a un postulante (solo creador)",
)
def accept_participation(
    search_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    search = _get_search_or_404(db, search_id)
    _require_creator(search, current_user)

    participation = (
        db.query(Participation)
        .filter(
            Participation.search_id == search_id,
            Participation.user_id == user_id,
        )
        .first()
    )
    if not participation:
        raise HTTPException(404, "Esa participación no existe.")
    if participation.status != ParticipationStatus.PENDING.value:
        raise HTTPException(
            409,
            f"Solo se pueden aceptar participaciones pendientes "
            f"(actual: '{participation.status}').",
        )

    # Verificar cupo
    accepted = _count_accepted(db, search.id)
    if accepted >= search.max_players:
        raise HTTPException(409, "Ya está completa la búsqueda.")

    participation.status = ParticipationStatus.ACCEPTED.value

    # Actualizar status de la búsqueda si quedó full
    if accepted + 1 >= search.max_players:
        search.status = SearchStatus.FULL.value

    db.commit()
    db.refresh(participation)
    return participation


@router.post(
    "/{search_id}/participations/{user_id}/reject",
    response_model=ParticipationOut,
    summary="Rechazar a un postulante (solo creador)",
)
def reject_participation(
    search_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    search = _get_search_or_404(db, search_id)
    _require_creator(search, current_user)

    participation = (
        db.query(Participation)
        .filter(
            Participation.search_id == search_id,
            Participation.user_id == user_id,
        )
        .first()
    )
    if not participation:
        raise HTTPException(404, "Esa participación no existe.")
    if participation.status != ParticipationStatus.PENDING.value:
        raise HTTPException(
            409, "Solo se pueden rechazar participaciones pendientes."
        )

    participation.status = ParticipationStatus.REJECTED.value
    db.commit()
    db.refresh(participation)
    return participation


# --------------------------------------------------------------------------
# Ver participaciones de una búsqueda
# --------------------------------------------------------------------------

@router.get(
    "/{search_id}/participations",
    response_model=list[ParticipationOut],
    summary="Listar participantes de una búsqueda",
)
def list_participations(search_id: int, db: Session = Depends(get_db)):
    # Verificar que existe la búsqueda
    _get_search_or_404(db, search_id)

    participations = (
        db.query(Participation)
        .options(joinedload(Participation.user))
        .filter(Participation.search_id == search_id)
        .order_by(Participation.joined_at)
        .all()
    )
    return participations


# --------------------------------------------------------------------------
# Cambios de estado de la búsqueda
# --------------------------------------------------------------------------

@router.post(
    "/{search_id}/start",
    response_model=SearchOut,
    summary="Marcar la búsqueda como 'en juego' (solo creador)",
)
def start_search(
    search_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    search = _get_search_or_404(db, search_id)
    _require_creator(search, current_user)

    if search.status not in (SearchStatus.OPEN.value, SearchStatus.FULL.value):
        raise HTTPException(
            409,
            f"Solo se puede iniciar una búsqueda 'open' o 'full' "
            f"(actual: '{search.status}').",
        )

    search.status = SearchStatus.IN_PROGRESS.value
    db.commit()
    db.refresh(search)
    return _to_search_out(db, search)


@router.post(
    "/{search_id}/complete",
    response_model=SearchOut,
    summary="Marcar como completada (habilita reviews en Fase 5)",
)
def complete_search(
    search_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    search = _get_search_or_404(db, search_id)
    _require_creator(search, current_user)

    if search.status != SearchStatus.IN_PROGRESS.value:
        raise HTTPException(
            409,
            f"Solo se puede completar una búsqueda 'in_progress' "
            f"(actual: '{search.status}').",
        )

    search.status = SearchStatus.COMPLETED.value
    search.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(search)
    return _to_search_out(db, search)
