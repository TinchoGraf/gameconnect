"""
Lógica de cálculo de reputación y trust score.

Vive separado del router para mantener este último limpio y facilitar tests.
El router hace HTTP; este módulo hace números.

Conceptos clave:

- reputation_score (del evaluado): promedio PONDERADO de los average_score
  de todas las reviews recibidas. El peso es el `weight` de cada review.

- reviewer_trust_score (del autor): qué tan confiable es el autor como
  reviewer. Empieza en 1.0. Se ajusta según outliers y consistencia.

- flagged (de una review): se marca si la nota se desvía mucho del consenso
  del evaluado. La review sigue contando pero pesa menos.

- weight (de una review): snapshot del trust_score del autor al momento de
  escribir la review. Si después el autor pierde confianza, las reviews ya
  hechas mantienen su peso original (preserva el historial).
"""

from sqlalchemy.orm import Session

from app.models.review import Review
from app.models.user import User


# Umbrales del sistema anti-troll
MIN_REVIEWS_FOR_OUTLIER_CHECK = 5  # Mínimo de reviews previas para detectar outliers
OUTLIER_THRESHOLD = 2.0            # Desviación mínima para marcar como outlier
FLAGGED_REVIEW_WEIGHT_PENALTY = 0.5  # Multiplicador de peso si la review es outlier


# --------------------------------------------------------------------------
# Cálculos
# --------------------------------------------------------------------------

def calculate_average_score(
    communication: int, attitude: int, skill: int, reliability: int
) -> float:
    """Promedio simple de las 4 categorías. Resultado entre 1.0 y 5.0."""
    return round((communication + attitude + skill + reliability) / 4, 2)


def should_flag_as_outlier(
    db: Session, reviewed_user_id: int, new_score: float
) -> bool:
    """
    Determina si una nueva review debe marcarse como outlier.

    Condiciones:
    - El usuario evaluado tiene al menos MIN_REVIEWS_FOR_OUTLIER_CHECK reviews previas
    - La nueva nota se desvía más de OUTLIER_THRESHOLD del promedio actual
    """
    existing_reviews = (
        db.query(Review).filter(Review.reviewed_user_id == reviewed_user_id).all()
    )

    if len(existing_reviews) < MIN_REVIEWS_FOR_OUTLIER_CHECK:
        return False  # Pocos datos, no podemos detectar outliers todavía

    avg_existing = sum(r.average_score for r in existing_reviews) / len(existing_reviews)
    deviation = abs(new_score - avg_existing)

    return deviation > OUTLIER_THRESHOLD


def calculate_weight(reviewer_trust_score: float, is_flagged: bool) -> float:
    """
    Calcula el peso de una review.
    - Base: el trust_score del autor (entre 0 y 1).
    - Si está flagged, se multiplica por la penalidad.
    """
    weight = reviewer_trust_score
    if is_flagged:
        weight *= FLAGGED_REVIEW_WEIGHT_PENALTY
    return round(weight, 2)


def recalculate_user_reputation(db: Session, user: User) -> None:
    """
    Recalcula reputation_score y reviews_received_count del usuario evaluado.

    Es un promedio PONDERADO: cada review aporta según su weight.
    Se llama después de crear, actualizar o borrar una review.
    """
    reviews = db.query(Review).filter(Review.reviewed_user_id == user.id).all()

    if not reviews:
        user.reputation_score = 0.0
        user.reviews_received_count = 0
        return

    total_weighted = sum(r.average_score * r.weight for r in reviews)
    total_weight = sum(r.weight for r in reviews)

    if total_weight == 0:
        # Caso extremo: todas las reviews tienen weight 0 (no debería pasar)
        user.reputation_score = 0.0
    else:
        user.reputation_score = round(total_weighted / total_weight, 2)

    user.reviews_received_count = len(reviews)


def recalculate_reviewer_trust(db: Session, reviewer: User) -> None:
    """
    Recalcula el reviewer_trust_score del autor.

    Lógica simple:
    - Empieza en 1.0
    - Por cada review flageada, baja 0.1 (con piso de 0.3)
    - Por cada 10 reviews no flageadas, sube 0.05 (con techo de 1.0)

    Esta función se llama cada vez que se crea una review del autor o
    cada vez que una review cambia su estado flagged.
    """
    reviews = db.query(Review).filter(Review.author_id == reviewer.id).all()

    if not reviews:
        reviewer.reviewer_trust_score = 1.0
        return

    flagged_count = sum(1 for r in reviews if r.flagged)
    clean_count = len(reviews) - flagged_count

    # Base
    score = 1.0
    # Penalidad por reviews flageadas
    score -= flagged_count * 0.1
    # Bonus por consistencia (cada 10 reviews limpias da +0.05)
    score += (clean_count // 10) * 0.05

    # Limitar entre 0.3 y 1.0
    reviewer.reviewer_trust_score = round(max(0.3, min(1.0, score)), 2)
