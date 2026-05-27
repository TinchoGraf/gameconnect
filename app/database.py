"""
Configuración de la base de datos con SQLAlchemy 2.0.

Acá definimos:
- El "engine" (motor que se conecta a la BD)
- La "session" (cada operación de BD usa una sesión)
- La "Base" de la que heredan todos nuestros modelos
- get_db(): dependencia que FastAPI inyecta en los endpoints
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


# El argumento check_same_thread solo aplica a SQLite (es una particularidad
# que tiene SQLite con múltiples threads). En Postgres se ignora.
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    # echo=True imprime todas las queries SQL en consola. Útil para aprender.
    echo=settings.ENVIRONMENT == "development",
)

# SessionLocal es una "fábrica" de sesiones. Cada vez que la llamamos
# (SessionLocal()) nos devuelve una nueva sesión de BD.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Clase base de la que heredan todos nuestros modelos (User, Game, etc.)"""

    pass


def get_db():
    """
    Dependencia de FastAPI: provee una sesión de BD al endpoint
    y se asegura de cerrarla al terminar, incluso si hay un error.

    Uso en un endpoint:
        @app.get("/users")
        def list_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
