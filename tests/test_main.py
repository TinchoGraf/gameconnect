"""
Tests básicos del endpoint raíz y de juegos.

Se corren con: pytest

Estos tests son simples a propósito: queremos confirmar que la API levanta
y responde. A medida que agreguemos features, vamos a sumar más tests.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """El endpoint raíz debe responder con status 200 y la info básica."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "GameConnect API"
    assert data["status"] == "ok"


def test_list_games_endpoint_exists():
    """El endpoint de listar juegos debe existir y devolver una lista."""
    response = client.get("/games")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
