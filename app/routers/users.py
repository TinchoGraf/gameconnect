"""
Endpoints relacionados a usuarios.

- GET /users/me → datos del usuario logueado (requiere token)
- GET /users/{username} → perfil público de cualquier usuario
- GET /users/search?q=... → búsqueda parcial de usuarios por username
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserPrivateOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/me",
    response_model=UserPrivateOut,
    summary="Obtener el perfil del usuario logueado",
)
def read_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.get(
    "/search",
    response_model=list[UserOut],
    summary="Buscar usuarios por username (parcial)",
)
def search_users(
    q: str = Query(..., min_length=2, description="Texto a buscar en usernames"),
    limit: int = Query(10, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Búsqueda parcial de usuarios por username.
    Requiere autenticación (no queremos que bots enumeren usuarios).
    El usuario actual no aparece en los resultados.
    Mínimo 2 caracteres para evitar resultados masivos.
    """
    users = (
        db.query(User)
        .filter(
            User.username.ilike(f"%{q}%"),
            User.id != current_user.id,
        )
        .limit(limit)
        .all()
    )
    return users


@router.get(
    "/{username}",
    response_model=UserOut,
    summary="Ver el perfil público de un usuario",
)
def read_user_by_username(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el usuario '{username}'",
        )
    return user