"""
Módulo de seguridad.

Centraliza todas las operaciones criptográficas de la app:
- Hashing y verificación de passwords (bcrypt)
- Creación y verificación de tokens JWT

Tenerlo en un solo lugar facilita auditar la seguridad y cambiar
implementaciones después sin tocar el resto del código.
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings


# Contexto de hashing.
# bcrypt es el estándar para passwords: lento a propósito (resiste fuerza bruta)
# y maneja el "salt" internamente (cada password tiene un salt único).
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --------------------------------------------------------------------------
# Passwords
# --------------------------------------------------------------------------

def hash_password(plain_password: str) -> str:
    """Convierte un password en texto plano en su hash bcrypt seguro."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compara un password en texto plano contra su hash.
    Devuelve True si coinciden. Resistente a timing attacks por diseño.
    """
    return pwd_context.verify(plain_password, hashed_password)


# --------------------------------------------------------------------------
# Tokens JWT
# --------------------------------------------------------------------------

def create_access_token(subject: str | int, expires_minutes: int | None = None) -> str:
    """
    Crea un token JWT firmado.

    El "subject" (sub) es el identificador del usuario. Usamos el user_id
    porque no cambia (los usuarios pueden cambiar username/email,
    pero el id es inmutable).

    El token contiene:
    - sub: id del usuario
    - exp: timestamp de expiración

    Está firmado con SECRET_KEY usando el algoritmo HS256.
    Cualquier modificación al payload rompe la firma y el token queda inválido.
    """
    expire_delta = timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    expire_at = datetime.now(timezone.utc) + expire_delta

    payload = {
        "sub": str(subject),  # JWT estándar pide que sub sea string
        "exp": expire_at,
    }

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    Decodifica y verifica un token JWT.
    Devuelve el payload si es válido, None si no.

    Verifica:
    - La firma (que coincida con SECRET_KEY)
    - La expiración (que no haya vencido)
    - El algoritmo (que sea el esperado, para evitar ataques de tipo "none")
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        # Cualquier error de firma, expiración o formato cae acá
        return None
