"""
Endpoints del sistema de reviews.

Para crear una review:
- Ambos usuarios deben haber estado en la misma búsqueda
- Esa búsqueda debe estar 'completed'
- Ambos deben haber confirmado que jugaron (doble confirmación)
- El review debe estar dentro de la ventana de 7 días post-completed
- No podés calificarte a vos mismo
- No podés calificar dos veces a la misma persona por la misma partida
- El comentario debe tener al menos 30 caracteres (validado en schema)

Al crear, el servidor calcula automáticamente:
- average_score (promedio de las 4 categorías)
- weight (peso de esta review según el trust del autor)
- flagged (si la review es outlier respecto al historial del evaluado)

Y recalcula la reputación del evaluado y el trust del autor.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user
from app.core.reputation import (
    calculate_average_score,
    calculate_weight,
    recalculate_reviewer_trust,
    recalculate_user_reputation,
    should_flag_as_outlier,
)
from app.database import get_db
from app.models.participation import Participation, ParticipationStatus
from app.models.review import Review
from app.models.search import Search, SearchStatus
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut

router = APIRouter(tags=["reviews"])


# Ventana de tiempo para escribir review después de completada la partida
REVIEW_WINDOW_DAYS = 7


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def _validate_can_review(
    db: Session,
    author: User,
    reviewed_user_id: int,
    search_id: int,
) -> tuple[Search, User]:
    """
    Valida todas las condiciones para que author pueda calificar a reviewed_user_id
    en search_id. Devuelve (search, reviewed_user) si todo está OK, o lanza HTTPException.
    """
    # 1. No te podés calificar a vos mismo
    if author.id == reviewed_user_id:
        raise HTTPException(422, "No podés calificarte a vos mismo.")

    # 2. La búsqueda debe existir y estar completed
    search = db.query(Search).filter(Search.id == search_id).first()
    if not search:
        raise HTTPException(404, f"No existe la búsqueda con id {search_id}.")
    if search.status != SearchStatus.COMPLETED.value:
        raise HTTPException(
            422,
            f"Solo se pueden calificar partidas completadas (estado actual: '{search.status}').",
        )

    # 3. El reviewed_user debe existir
    reviewed_user = db.query(User).filter(User.id == reviewed_user_id).first()
    if not reviewed_user:
        raise HTTPException(404, f"No existe el usuario con id {reviewed_user_id}.")

    # 4. Ventana de tiempo
    if search.completed_at is None:
        raise HTTPException(500, "La búsqueda completada no tiene fecha de finalización.")

    completed_at = search.completed_at
    if completed_at.tzinfo is None:
        # SQLite a veces devuelve datetimes naive; los normalizamos a UTC
        completed_at = completed_at.replace(tzinfo=timezone.utc)

    deadline = completed_at + timedelta(days=REVIEW_WINDOW_DAYS)
    if datetime.now(timezone.utc) > deadline:
        raise HTTPException(
            422,
            f"Pasaron más de {REVIEW_WINDOW_DAYS} días desde que terminó la partida. "
            f"Ya no se pueden agregar reviews.",
        )

    # 5. Ambos deben haber estado en la búsqueda como aceptados Y ambos deben
    # haber tenido la doble confirmación de partida.
    my_participation = (
        db.query(Participation)
        .filter(
            Participation.search_id == search_id,
            Participation.user_id == author.id,
            Participation.status == ParticipationStatus.ACCEPTED.value,
        )
        .first()
    )
    other_participation = (
        db.query(Participation)
        .filter(
            Participation.search_id == search_id,
            Participation.user_id == reviewed_user_id,
            Participation.status == ParticipationStatus.ACCEPTED.value,
        )
        .first()
    )
    if not my_participation or not other_participation:
        raise HTTPException(
            403,
            "Solo podés calificar a alguien con quien jugaste efectivamente en esta búsqueda.",
        )

    # Ambas confirmaciones (la del autor y la del evaluado) en sus respectivas participaciones
    if not (my_participation.creator_confirmed and my_participation.participant_confirmed):
        raise HTTPException(
            422,
            "Tu participación todavía no tiene la doble confirmación. "
            "Esperá que el creador y vos confirmen que jugaron.",
        )
    if not (other_participation.creator_confirmed and other_participation.participant_confirmed):
        raise HTTPException(
            422,
            "La participación del otro usuario todavía no tiene la doble confirmación.",
        )

    # 6. No haber ya calificado a esta persona en esta búsqueda
    existing = (
        db.query(Review)
        .filter(
            Review.author_id == author.id,
            Review.reviewed_user_id == reviewed_user_id,
            Review.search_id == search_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(409, "Ya escribiste una review para este usuario en esta búsqueda.")

    return search, reviewed_user


# --------------------------------------------------------------------------
# Endpoints de reviews
# --------------------------------------------------------------------------

@router.post(
    "/reviews",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una review sobre otro usuario",
)
def create_review(
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Crea una review. Aplica todas las validaciones anti-troll, calcula peso
    y outlier automáticamente, y recalcula la reputación del evaluado y el
    trust del autor.
    """
    search, reviewed_user = _validate_can_review(
        db, current_user, data.reviewed_user_id, data.search_id
    )

    # Calcular score y detectar outlier
    avg = calculate_average_score(
        data.communication, data.attitude, data.skill, data.reliability
    )
    is_flagged = should_flag_as_outlier(db, reviewed_user.id, avg)
    weight = calculate_weight(current_user.reviewer_trust_score, is_flagged)

    review = Review(
        author_id=current_user.id,
        reviewed_user_id=reviewed_user.id,
        search_id=data.search_id,
        communication=data.communication,
        attitude=data.attitude,
        skill=data.skill,
        reliability=data.reliability,
        average_score=avg,
        weight=weight,
        comment=data.comment,
        would_play_again=data.would_play_again,
        flagged=is_flagged,
    )
    db.add(review)
    db.flush()  # Para que la review aparezca en los queries de recálculo

    # Recalcular reputación del evaluado y trust del autor
    recalculate_user_reputation(db, reviewed_user)
    recalculate_reviewer_trust(db, current_user)

    db.commit()
    db.refresh(review)

    # Cargar el author para que ReviewOut lo pueda serializar
    db.refresh(review, attribute_names=["author"])
    return review


@router.get(
    "/reviews/{review_id}",
    response_model=ReviewOut,
    summary="Detalle de una review",
)
def get_review(review_id: int, db: Session = Depends(get_db)):
    review = (
        db.query(Review)
        .options(joinedload(Review.author))
        .filter(Review.id == review_id)
        .first()
    )
    if not review:
        raise HTTPException(404, f"No existe la review con id {review_id}.")
    return review


@router.get(
    "/users/{username}/reviews",
    response_model=list[ReviewOut],
    summary="Reviews recibidas por un usuario",
)
def list_user_reviews(username: str, db: Session = Depends(get_db)):
    """
    Devuelve todas las reviews que un usuario recibió. Públicas.
    Las flagged también aparecen (no las escondemos), pero tienen peso menor
    en el cálculo de reputación.
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(404, f"No existe el usuario '{username}'.")

    reviews = (
        db.query(Review)
        .options(joinedload(Review.author))
        .filter(Review.reviewed_user_id == user.id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return reviews


@router.get(
    "/users/me/pending-reviews",
    summary="Mis reviews pendientes (partidas confirmadas sin calificar todavía)",
)
def list_my_pending_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Devuelve las partidas completadas y doble-confirmadas donde todavía
    podés escribir reviews (dentro de los 7 días).

    Para cada búsqueda, lista los otros participantes a los que no calificaste todavía.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=REVIEW_WINDOW_DAYS)

    # Mis participaciones aceptadas con doble confirmación, en búsquedas completadas y dentro del plazo
    my_participations = (
        db.query(Participation)
        .join(Search, Participation.search_id == Search.id)
        .filter(
            Participation.user_id == current_user.id,
            Participation.status == ParticipationStatus.ACCEPTED.value,
            Participation.creator_confirmed == True,  # noqa: E712
            Participation.participant_confirmed == True,  # noqa: E712
            Search.status == SearchStatus.COMPLETED.value,
            Search.completed_at >= cutoff,
        )
        .all()
    )

    result = []
    for my_p in my_participations:
        search = db.query(Search).filter(Search.id == my_p.search_id).first()
        if not search:
            continue

        # Otros participantes con doble confirmación en esta búsqueda
        others = (
            db.query(Participation)
            .options(joinedload(Participation.user))
            .filter(
                Participation.search_id == search.id,
                Participation.user_id != current_user.id,
                Participation.status == ParticipationStatus.ACCEPTED.value,
                Participation.creator_confirmed == True,  # noqa: E712
                Participation.participant_confirmed == True,  # noqa: E712
            )
            .all()
        )

        # Filtramos los que ya calificamos
        already_reviewed_ids = {
            r.reviewed_user_id
            for r in db.query(Review)
            .filter(Review.author_id == current_user.id, Review.search_id == search.id)
            .all()
        }
        pending = [
            {"user_id": p.user.id, "username": p.user.username}
            for p in others
            if p.user.id not in already_reviewed_ids
        ]

        if pending:
            result.append(
                {
                    "search_id": search.id,
                    "search_title": search.title,
                    "game_slug": search.game.slug if search.game else None,
                    "completed_at": search.completed_at,
                    "pending_users": pending,
                }
            )

    return result
