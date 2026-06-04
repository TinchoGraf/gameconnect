"""
Endpoints de autenticación: registro y login.

- POST /auth/register → crea un nuevo usuario
- POST /auth/login → verifica credenciales y devuelve un token JWT

Notar que /auth/login usa OAuth2PasswordRequestForm en lugar de JSON.
Esto es porque el estándar OAuth2 espera campos x-www-form-urlencoded.
La ventaja: el botón "Authorize" de /docs funciona out of the box.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserPrivateOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserPrivateOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo usuario",
)
def register(data: UserCreate, db: Session = Depends(get_db)):
    """
    Crea una nueva cuenta de usuario.

    Validaciones:
    - El username debe ser único en la BD
    - El email debe ser único en la BD
    - El password debe cumplir las reglas de complejidad (validado por el schema)
    """
    # Verificar que el username no esté en uso
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ese username ya está en uso.",
        )

    # Verificar que el email no esté en uso
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ese email ya está registrado.",
        )

    # Crear el usuario con el password hasheado.
    # IMPORTANTE: el password en texto plano se descarta acá. Nunca llega a la BD.
    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post(
    "/login",
    response_model=Token,
    summary="Iniciar sesión y obtener un token JWT",
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Verifica las credenciales del usuario y devuelve un token JWT.

    El campo "username" del formulario corresponde a nuestro User.username.
    El token tiene una expiración configurable en .env (default 60 min).

    IMPORTANTE: el mensaje de error es el mismo si el username no existe
    o si el password es incorrecto. Esto evita que un atacante use el
    endpoint para enumerar usuarios válidos.
    """
    user = db.query(User).filter(User.username == form_data.username).first()

    # Mismo error para "no existe" y "password mal": seguridad por opacidad mínima.
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username o password incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(subject=user.id)
    return Token(access_token=token)
