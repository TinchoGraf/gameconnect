"""
Endpoints relacionados a usuarios.

- GET /users/me → datos del usuario logueado (requiere token)
- GET /users/{username} → perfil público de cualquier usuario

En las próximas fases vamos a agregar:
- Actualizar perfil propio
- Listar / buscar usuarios
- Agregar/quitar perfiles de juego
"""

from fastapi import APIRouter, Depends, HTTPException, status
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
    """
    Devuelve el perfil completo del usuario autenticado.

    Incluye datos privados (email) que no se exponen en endpoints públicos.
    Para acceder, hay que enviar el header:
        Authorization: Bearer <token>
    """
    return current_user


@router.get(
    "/{username}",
    response_model=UserOut,
    summary="Ver el perfil público de un usuario",
)
def read_user_by_username(username: str, db: Session = Depends(get_db)):
    """
    Devuelve el perfil público de un usuario por su username.

    No requiere autenticación (los perfiles son públicos).
    Solo expone información pública (sin email).
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el usuario '{username}'",
        )
    return user
