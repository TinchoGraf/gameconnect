"""Fixtures compartidas de pytest."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

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
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


VALID_USER_PAYLOAD = {
    "username": "testplayer",
    "email": "test@gameconnect.dev",
    "password": "SuperSafe1",
}

SECOND_USER_PAYLOAD = {
    "username": "secondplayer",
    "email": "second@gameconnect.dev",
    "password": "SuperSafe1",
}


@pytest.fixture
def registered_user(client):
    response = client.post("/auth/register", json=VALID_USER_PAYLOAD)
    assert response.status_code == 201, response.text
    return {"credentials": VALID_USER_PAYLOAD, "data": response.json()}


@pytest.fixture
def auth_token(client, registered_user):
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
    return {"Authorization": f"Bearer {auth_token}"}


# Helper para registrar/loguear un segundo usuario para tests multi-usuario
@pytest.fixture
def second_user_headers(client):
    """Registra y loguea un segundo usuario distinto. Devuelve headers de auth."""
    client.post("/auth/register", json=SECOND_USER_PAYLOAD)
    resp = client.post(
        "/auth/login",
        data={
            "username": SECOND_USER_PAYLOAD["username"],
            "password": SECOND_USER_PAYLOAD["password"],
        },
    )
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest.fixture
def loaded_games(db_session):
    """Carga juegos para los tests."""
    games_data = [
        {
            "name": "League of Legends",
            "slug": "league-of-legends",
            "description": "MOBA 5v5",
            "roles": ["Top", "Jungla", "Mid", "ADC", "Support"],
            "servers": ["LAS", "LAN", "NA", "EUW", "KR"],
            "game_modes": ["chill", "tryhard", "ranked-solo"],
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


# Helper: usuario con perfil de LoL listo para crear/unirse a búsquedas
@pytest.fixture
def user_with_lol_profile(client, auth_headers, loaded_games):
    """Usuario autenticado con perfil de LoL ya creado en LAS."""
    client.post(
        "/users/me/game-profiles",
        json={
            "game_slug": "league-of-legends",
            "roles": ["Mid", "Top", "Jungla"],
            "main_role": "Mid",
            "server": "LAS",
            "rank": "Diamante",
        },
        headers=auth_headers,
    )
    return auth_headers


@pytest.fixture
def second_user_with_lol_profile(client, second_user_headers, loaded_games):
    """Segundo usuario autenticado con perfil de LoL en LAS."""
    client.post(
        "/users/me/game-profiles",
        json={
            "game_slug": "league-of-legends",
            "roles": ["Jungla", "Support"],
            "main_role": "Jungla",
            "server": "LAS",
            "rank": "Platino",
        },
        headers=second_user_headers,
    )
    return second_user_headers
