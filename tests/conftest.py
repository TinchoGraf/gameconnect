"""
Fixtures compartidas de pytest.

Configura una base de datos SQLite temporal (en memoria) para cada test,
para que los tests sean rápidos, aislados y no toquen la BD real.

Cómo funciona:
- Antes de cada test: creamos las tablas en una BD limpia.
- Después de cada test: destruimos todo.
- Sobreescribimos la dependencia get_db de la app para usar esta BD temporal.

Esto es un patrón estándar en proyectos FastAPI. Vale la pena entenderlo:
si los tests comparten estado, los bugs se vuelven aleatorios y dolorosos.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# Importamos todos los modelos para que Base.metadata los conozca al crear tablas.
from app import models  # noqa: F401


# BD SQLite en memoria, compartida entre conexiones del mismo test.
# StaticPool + check_same_thread=False son necesarios para SQLite + tests.
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    """Crea una BD limpia para el test y la destruye al terminar."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    """
    TestClient con la dependencia get_db sobreescrita para usar la BD de test.
    Cualquier endpoint que use get_db, dentro de un test, va a usar db_session.
    """

    def override_get_db():
        try:
            yield db_session
        finally:
            pass  # No cerramos acá: lo hace el fixture db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# --------------------------------------------------------------------------
# Helpers reutilizables
# --------------------------------------------------------------------------

# Datos de un usuario válido para reutilizar en muchos tests
VALID_USER_PAYLOAD = {
    "username": "testplayer",
    "email": "test@gameconnect.dev",
    "password": "SuperSafe1",
}


@pytest.fixture
def registered_user(client):
    """Registra un usuario válido y devuelve su payload + respuesta."""
    response = client.post("/auth/register", json=VALID_USER_PAYLOAD)
    assert response.status_code == 201, response.text
    return {
        "credentials": VALID_USER_PAYLOAD,
        "data": response.json(),
    }


@pytest.fixture
def auth_token(client, registered_user):
    """Hace login con el usuario registrado y devuelve el token JWT."""
    response = client.post(
        "/auth/login",
        data={
            "username": registered_user["credentials"]["username"],
            "password": registered_user["credentials"]["password"],
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    """Headers listos para incluir en requests autenticados."""
    return {"Authorization": f"Bearer {auth_token}"}
