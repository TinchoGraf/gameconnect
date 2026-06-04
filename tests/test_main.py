"""
Tests básicos del endpoint raíz y de juegos.

Estos tests usan los fixtures de conftest.py, que proveen una BD limpia
para cada test. Por eso el endpoint /games devuelve una lista vacía:
no hay juegos cargados en una BD recién creada.

Si querés probar que el seed funciona, lo hacés en un test específico
que cargue datos primero (lo vamos a ver en próximas fases).
"""


def test_root_endpoint(client):
    """El endpoint raíz debe responder con status 200 y la info básica."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "GameConnect API"
    assert data["status"] == "ok"


def test_list_games_endpoint_exists(client):
    """El endpoint de juegos debe existir y devolver una lista (vacía sin seed)."""
    response = client.get("/games")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_nonexistent_game_returns_404(client):
    response = client.get("/games/no-existe")
    assert response.status_code == 404