def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_list_games_endpoint_exists(client):
    response = client.get("/games")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_nonexistent_game_returns_404(client):
    response = client.get("/games/no-existe")
    assert response.status_code == 404
