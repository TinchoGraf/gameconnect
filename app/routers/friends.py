"""
Endpoints del sistema de amigos y bloqueos.

Flujo de amistad:
  POST /friends/requests/{username}     → mandar solicitud
  POST /friends/requests/{username}/accept  → aceptar solicitud recibida
  POST /friends/requests/{username}/reject  → rechazar solicitud recibida
  DELETE /friends/requests/{username}   → cancelar solicitud enviada
  GET /friends                          → listar mis amigos
  GET /friends/requests/received        → solicitudes que recibí (pending)
  GET /friends/requests/sent            → solicitudes que mandé (pending)
  DELETE /friends/{username}            → eliminar amigo

Flujo de bloqueos:
  POST /friends/blocks/{username}       → bloquear usuario
  DELETE /friends/blocks/{username}     → desbloquear usuario
  GET /friends/blocks                   → ver a quién bloqueé
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.block import Block
from app.models.friendship import Friendship
from app.models.user import User
from app.schemas.friendship import FriendOut, FriendshipOut, UserMini

router = APIRouter(prefix="/friends", tags=["friends"])


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def _get_user_by_username_or_404(db: Session, username: str) -> User:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el usuario '{username}'.",
        )
    return user


def _get_friendship(db: Session, user_a_id: int, user_b_id: int) -> Friendship | None:
    """Busca la fila de amistad entre dos usuarios en cualquier dirección."""
    return (
        db.query(Friendship)
        .options(joinedload(Friendship.requester), joinedload(Friendship.addressee))
        .filter(
            (
                (Friendship.requester_id == user_a_id) &
                (Friendship.addressee_id == user_b_id)
            ) | (
                (Friendship.requester_id == user_b_id) &
                (Friendship.addressee_id == user_a_id)
            )
        )
        .first()
    )


def _is_blocked(db: Session, blocker_id: int, blocked_id: int) -> bool:
    """Verifica si blocker_id bloqueó a blocked_id."""
    return db.query(Block).filter(
        Block.blocker_id == blocker_id,
        Block.blocked_id == blocked_id,
    ).first() is not None


# --------------------------------------------------------------------------
# Solicitudes de amistad
# --------------------------------------------------------------------------

@router.post(
    "/requests/{username}",
    response_model=FriendshipOut,
    status_code=status.HTTP_201_CREATED,
    summary="Mandar solicitud de amistad",
)
def send_friend_request(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = _get_user_by_username_or_404(db, username)

    if target.id == current_user.id:
        raise HTTPException(400, "No podés mandarte una solicitud a vos mismo.")

    # Verificar bloqueos en ambas direcciones
    if _is_blocked(db, current_user.id, target.id):
        raise HTTPException(400, "No podés mandar solicitud a alguien que bloqueaste.")
    if _is_blocked(db, target.id, current_user.id):
        raise HTTPException(400, "No podés mandar solicitud a esta persona.")

    # Verificar si ya existe una solicitud entre ellos
    existing = _get_friendship(db, current_user.id, target.id)
    if existing:
        if existing.status == "accepted":
            raise HTTPException(400, "Ya son amigos.")
        if existing.status == "pending":
            if existing.requester_id == current_user.id:
                raise HTTPException(400, "Ya tenés una solicitud pendiente con esta persona.")
            else:
                raise HTTPException(400, "Esta persona ya te mandó una solicitud. Aceptala desde tus solicitudes recibidas.")
        if existing.status == "rejected":
            # Si fue rechazada antes, permitir reintento actualizando la fila
            existing.status = "pending"
            existing.requester_id = current_user.id
            existing.addressee_id = target.id
            db.commit()
            db.refresh(existing)
            return existing

    friendship = Friendship(
        requester_id=current_user.id,
        addressee_id=target.id,
        status="pending",
    )
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    db.refresh(friendship, attribute_names=["requester", "addressee"])
    return friendship


@router.post(
    "/requests/{username}/accept",
    response_model=FriendshipOut,
    summary="Aceptar solicitud de amistad",
)
def accept_friend_request(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    requester = _get_user_by_username_or_404(db, username)
    friendship = _get_friendship(db, current_user.id, requester.id)

    if not friendship or friendship.status != "pending":
        raise HTTPException(404, "No existe una solicitud pendiente de este usuario.")
    if friendship.addressee_id != current_user.id:
        raise HTTPException(400, "Solo el destinatario puede aceptar la solicitud.")

    friendship.status = "accepted"
    db.commit()
    db.refresh(friendship)
    db.refresh(friendship, attribute_names=["requester", "addressee"])
    return friendship


@router.post(
    "/requests/{username}/reject",
    response_model=FriendshipOut,
    summary="Rechazar solicitud de amistad",
)
def reject_friend_request(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    requester = _get_user_by_username_or_404(db, username)
    friendship = _get_friendship(db, current_user.id, requester.id)

    if not friendship or friendship.status != "pending":
        raise HTTPException(404, "No existe una solicitud pendiente de este usuario.")
    if friendship.addressee_id != current_user.id:
        raise HTTPException(400, "Solo el destinatario puede rechazar la solicitud.")

    friendship.status = "rejected"
    db.commit()
    db.refresh(friendship)
    db.refresh(friendship, attribute_names=["requester", "addressee"])
    return friendship


@router.delete(
    "/requests/{username}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancelar solicitud enviada",
)
def cancel_friend_request(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = _get_user_by_username_or_404(db, username)
    friendship = _get_friendship(db, current_user.id, target.id)

    if not friendship or friendship.status != "pending":
        raise HTTPException(404, "No existe una solicitud pendiente para cancelar.")
    if friendship.requester_id != current_user.id:
        raise HTTPException(400, "Solo quien mandó la solicitud puede cancelarla.")

    db.delete(friendship)
    db.commit()


@router.get(
    "/requests/received",
    response_model=list[FriendshipOut],
    summary="Solicitudes de amistad recibidas (pendientes)",
)
def list_received_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Friendship)
        .options(joinedload(Friendship.requester), joinedload(Friendship.addressee))
        .filter(
            Friendship.addressee_id == current_user.id,
            Friendship.status == "pending",
        )
        .order_by(Friendship.created_at.desc())
        .all()
    )


@router.get(
    "/requests/sent",
    response_model=list[FriendshipOut],
    summary="Solicitudes de amistad enviadas (pendientes)",
)
def list_sent_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Friendship)
        .options(joinedload(Friendship.requester), joinedload(Friendship.addressee))
        .filter(
            Friendship.requester_id == current_user.id,
            Friendship.status == "pending",
        )
        .order_by(Friendship.created_at.desc())
        .all()
    )


# --------------------------------------------------------------------------
# Lista de amigos
# --------------------------------------------------------------------------

@router.get(
    "",
    response_model=list[FriendshipOut],
    summary="Listar mis amigos",
)
def list_friends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Devuelve todas las amistades aceptadas del usuario actual."""
    return (
        db.query(Friendship)
        .options(joinedload(Friendship.requester), joinedload(Friendship.addressee))
        .filter(
            (
                (Friendship.requester_id == current_user.id) |
                (Friendship.addressee_id == current_user.id)
            ),
            Friendship.status == "accepted",
        )
        .order_by(Friendship.updated_at.desc())
        .all()
    )


@router.delete(
    "/{username}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar amigo",
)
def remove_friend(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = _get_user_by_username_or_404(db, username)
    friendship = _get_friendship(db, current_user.id, target.id)

    if not friendship or friendship.status != "accepted":
        raise HTTPException(404, "No son amigos.")

    db.delete(friendship)
    db.commit()


# --------------------------------------------------------------------------
# Bloqueos
# --------------------------------------------------------------------------

@router.post(
    "/blocks/{username}",
    status_code=status.HTTP_201_CREATED,
    summary="Bloquear usuario",
)
def block_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = _get_user_by_username_or_404(db, username)

    if target.id == current_user.id:
        raise HTTPException(400, "No podés bloquearte a vos mismo.")

    if _is_blocked(db, current_user.id, target.id):
        raise HTTPException(400, "Ya bloqueaste a este usuario.")

    # Si eran amigos, eliminar la amistad automáticamente
    friendship = _get_friendship(db, current_user.id, target.id)
    if friendship:
        db.delete(friendship)

    block = Block(blocker_id=current_user.id, blocked_id=target.id)
    db.add(block)
    db.commit()
    return {"detail": f"Bloqueaste a {username}."}


@router.delete(
    "/blocks/{username}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desbloquear usuario",
)
def unblock_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = _get_user_by_username_or_404(db, username)
    block = db.query(Block).filter(
        Block.blocker_id == current_user.id,
        Block.blocked_id == target.id,
    ).first()

    if not block:
        raise HTTPException(404, "No bloqueaste a este usuario.")

    db.delete(block)
    db.commit()


@router.get(
    "/blocks",
    summary="Ver usuarios bloqueados",
)
def list_blocked_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    blocks = (
        db.query(Block)
        .options(joinedload(Block.blocked))
        .filter(Block.blocker_id == current_user.id)
        .all()
    )
    return [
        {"user_id": b.blocked_id, "username": b.blocked.username}
        for b in blocks
    ]