"""
Dependencias compartidas de FastAPI.

Las "dependencias" son funciones que FastAPI ejecuta antes del endpoint
y cuyo resultado se inyecta como argumento. Acá vive get_current_user,
que se usa en cualquier endpoint que requiera autenticación.

Uso típico:
    @router.get("/me")
    def me(current_user: User = Depends(get_current_user)):
        return current_user
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.user import User


# OAuth2PasswordBearer le dice a FastAPI:
# 1. Para autenticarse, esperá un header "Authorization: Bearer <token>"
# 2. El endpoint para obtener el token es /auth/login
# Esto es lo que hace que /docs muestre el botón "Authorize" automáticamente.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Extrae al usuario actual desde el token JWT.

    Pasos:
    1. FastAPI ya extrajo el token del header gracias a oauth2_scheme
    2. Lo decodificamos y verificamos
    3. Sacamos el user_id del payload (sub)
    4. Buscamos el usuario en la BD
    5. Si algo falla, devolvemos 401

    Si el endpoint llega a ejecutarse, el User devuelto es 100% válido.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o token expirado",
        # Este header le dice al cliente que tiene que mandar Bearer token
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise credentials_exception

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        # El token es válido pero el usuario fue borrado de la BD.
        raise credentials_exception

    return user
