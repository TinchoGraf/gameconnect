"""
Fixtures compartidas de pytest.

Configura una base de datos SQLite temporal (en memoria) para cada test,
para que los tests sean rápidos, aislados y no toquen la BD real.
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
from app.models.game import Game


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
    """TestClient con la dependencia get_db sobreescrita para usar la BD de test."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# --------------------------------------------------------------------------
# Datos comunes
# --------------------------------------------------------------------------

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
    """Hace login y devuelve el token JWT."""
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
    """Headers listos para requests autenticados."""
    return {"Authorization": f"Bearer {auth_token}"}


# --------------------------------------------------------------------------
# Fixtures de juegos (para tests de GameProfile)
# --------------------------------------------------------------------------

@pytest.fixture
def loaded_games(db_session):
    """
    Carga los juegos necesarios para los tests de game-profiles.
    Versión reducida del seed real, solo los datos imprescindibles.
    """
    games_data = [
        {
            "name": "League of Legends",
            "slug": "league-of-legends",
            "description": "MOBA 5v5",
            "roles": ["Top", "Jungla", "Mid", "ADC", "Support"],
            "servers": ["LAS", "LAN", "NA", "EUW", "KR"],
            "game_modes": ["chill", "tryhard"],
        },
        {
            "name": "Counter Strike 2",
            "slug": "counter-strike-2",
            "description": "FPS 5v5",
            "roles": ["Entry Fragger", "AWPer", "IGL", "Support", "Lurker"],
            "servers": ["SA", "NA-East", "EU-West"],
            "game_modes": ["chill", "tryhard"],
        },
    ]
    for data in games_data:
        db_session.add(Game(**data))
    db_session.commit()
    return games_data
