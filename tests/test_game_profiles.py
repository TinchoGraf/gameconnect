"""
Tests de la Fase 3: perfiles de juego.

Cubrimos:
- Crear perfil exitoso
- Validaciones contra el juego (roles, server)
- Validación de main_role en roles
- Duplicado (perfil ya existe para ese juego)
- Listar mis perfiles
- Detalle, update, delete
- Perfiles públicos de otro usuario
- Endpoints protegidos
"""

import pytest


# Payload base reutilizable para crear perfiles válidos de LoL
VALID_LOL_PROFILE = {
    "game_slug": "league-of-legends",
    "roles": ["Mid", "Top"],
    "main_role": "Mid",
    "server": "LAS",
    "rank": "Diamante II",
    "in_game_name": "TestPlayer#LAS1",
}


# --------------------------------------------------------------------------
# Tests de creación
# --------------------------------------------------------------------------

class TestCreateGameProfile:
    def test_create_success(self, client, auth_headers, loaded_games):
        response = client.post(
            "/users/me/game-profiles",
            json=VALID_LOL_PROFILE,
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["roles"] == ["Mid", "Top"]
        assert data["main_role"] == "Mid"
        assert data["server"] == "LAS"
        assert data["game"]["slug"] == "league-of-legends"
        assert data["game"]["name"] == "League of Legends"

    def test_create_requires_auth(self, client, loaded_games):
        response = client.post("/users/me/game-profiles", json=VALID_LOL_PROFILE)
        assert response.status_code == 401

    def test_create_invalid_game(self, client, auth_headers, loaded_games):
        payload = {**VALID_LOL_PROFILE, "game_slug": "no-existe"}
        response = client.post(
            "/users/me/game-profiles", json=payload, headers=auth_headers
        )
        assert response.status_code == 404

    def test_create_invalid_role(self, client, auth_headers, loaded_games):
        """Mandar un rol que no existe en LoL debe fallar."""
        payload = {**VALID_LOL_PROFILE, "roles": ["Mid", "Tank"], "main_role": "Mid"}
        response = client.post(
            "/users/me/game-profiles", json=payload, headers=auth_headers
        )
        assert response.status_code == 422
        assert "Tank" in response.json()["detail"]

    def test_create_invalid_server(self, client, auth_headers, loaded_games):
        payload = {**VALID_LOL_PROFILE, "server": "Marte"}
        response = client.post(
            "/users/me/game-profiles", json=payload, headers=auth_headers
        )
        assert response.status_code == 422
        assert "Marte" in response.json()["detail"]

    def test_create_main_role_not_in_roles(self, client, auth_headers, loaded_games):
        """main_role debe estar incluido en la lista de roles."""
        payload = {**VALID_LOL_PROFILE, "main_role": "Support"}
        response = client.post(
            "/users/me/game-profiles", json=payload, headers=auth_headers
        )
        assert response.status_code == 422

    def test_create_empty_roles_list(self, client, auth_headers, loaded_games):
        payload = {**VALID_LOL_PROFILE, "roles": []}
        response = client.post(
            "/users/me/game-profiles", json=payload, headers=auth_headers
        )
        assert response.status_code == 422

    def test_create_duplicate(self, client, auth_headers, loaded_games):
        """Crear dos perfiles del mismo juego para el mismo usuario debe fallar."""
        client.post("/users/me/game-profiles", json=VALID_LOL_PROFILE, headers=auth_headers)
        response = client.post(
            "/users/me/game-profiles", json=VALID_LOL_PROFILE, headers=auth_headers
        )
        assert response.status_code == 409

    def test_create_multiple_games_same_user(self, client, auth_headers, loaded_games):
        """Un usuario sí puede tener perfiles en varios juegos distintos."""
        # LoL
        r1 = client.post("/users/me/game-profiles", json=VALID_LOL_PROFILE, headers=auth_headers)
        assert r1.status_code == 201

        # CS2
        cs_payload = {
            "game_slug": "counter-strike-2",
            "roles": ["AWPer"],
            "main_role": "AWPer",
            "server": "SA",
            "rank": "Faceit 10",
        }
        r2 = client.post("/users/me/game-profiles", json=cs_payload, headers=auth_headers)
        assert r2.status_code == 201


# --------------------------------------------------------------------------
# Tests de listar / detalle
# --------------------------------------------------------------------------

class TestListAndGet:
    def test_list_my_profiles_empty(self, client, auth_headers, loaded_games):
        response = client.get("/users/me/game-profiles", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_list_my_profiles_with_data(self, client, auth_headers, loaded_games):
        client.post("/users/me/game-profiles", json=VALID_LOL_PROFILE, headers=auth_headers)
        response = client.get("/users/me/game-profiles", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["game"]["slug"] == "league-of-legends"

    def test_get_specific_profile(self, client, auth_headers, loaded_games):
        client.post("/users/me/game-profiles", json=VALID_LOL_PROFILE, headers=auth_headers)
        response = client.get(
            "/users/me/game-profiles/league-of-legends", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["main_role"] == "Mid"

    def test_get_nonexistent_profile(self, client, auth_headers, loaded_games):
        response = client.get(
            "/users/me/game-profiles/league-of-legends", headers=auth_headers
        )
        assert response.status_code == 404


# --------------------------------------------------------------------------
# Tests de actualización
# --------------------------------------------------------------------------

class TestUpdateGameProfile:
    def test_update_partial(self, client, auth_headers, loaded_games):
        """PUT solo cambia los campos enviados, deja el resto intacto."""
        client.post("/users/me/game-profiles", json=VALID_LOL_PROFILE, headers=auth_headers)

        response = client.put(
            "/users/me/game-profiles/league-of-legends",
            json={"rank": "Maestro"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["rank"] == "Maestro"
        # Los demás campos no cambiaron
        assert data["main_role"] == "Mid"
        assert data["server"] == "LAS"

    def test_update_roles_and_main_role(self, client, auth_headers, loaded_games):
        client.post("/users/me/game-profiles", json=VALID_LOL_PROFILE, headers=auth_headers)
        response = client.put(
            "/users/me/game-profiles/league-of-legends",
            json={"roles": ["Support", "ADC"], "main_role": "Support"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["main_role"] == "Support"

    def test_update_invalid_role(self, client, auth_headers, loaded_games):
        client.post("/users/me/game-profiles", json=VALID_LOL_PROFILE, headers=auth_headers)
        response = client.put(
            "/users/me/game-profiles/league-of-legends",
            json={"roles": ["FakeRole"], "main_role": "FakeRole"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_update_main_role_not_in_existing_roles(self, client, auth_headers, loaded_games):
        """Cambiar solo main_role a algo que NO está en los roles actuales debe fallar."""
        client.post("/users/me/game-profiles", json=VALID_LOL_PROFILE, headers=auth_headers)
        # roles actuales son ["Mid", "Top"], cambiamos main_role a "ADC" sin tocar roles
        response = client.put(
            "/users/me/game-profiles/league-of-legends",
            json={"main_role": "ADC"},
            headers=auth_headers,
        )
        assert response.status_code == 422


# --------------------------------------------------------------------------
# Tests de borrado
# --------------------------------------------------------------------------

class TestDeleteGameProfile:
    def test_delete_success(self, client, auth_headers, loaded_games):
        client.post("/users/me/game-profiles", json=VALID_LOL_PROFILE, headers=auth_headers)

        response = client.delete(
            "/users/me/game-profiles/league-of-legends", headers=auth_headers
        )
        assert response.status_code == 204

        # Verificar que ya no aparece
        list_response = client.get("/users/me/game-profiles", headers=auth_headers)
        assert list_response.json() == []

    def test_delete_nonexistent(self, client, auth_headers, loaded_games):
        response = client.delete(
            "/users/me/game-profiles/league-of-legends", headers=auth_headers
        )
        assert response.status_code == 404


# --------------------------------------------------------------------------
# Tests de perfil público (de otro usuario)
# --------------------------------------------------------------------------

class TestPublicGameProfiles:
    def test_public_list_no_auth_required(self, client, registered_user, loaded_games):
        """Cualquiera puede ver los perfiles públicos sin estar logueado."""
        username = registered_user["credentials"]["username"]
        response = client.get(f"/users/{username}/game-profiles")
        assert response.status_code == 200
        assert response.json() == []

    def test_public_list_shows_profiles(self, client, registered_user, auth_headers, loaded_games):
        client.post("/users/me/game-profiles", json=VALID_LOL_PROFILE, headers=auth_headers)
        username = registered_user["credentials"]["username"]
        response = client.get(f"/users/{username}/game-profiles")
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_public_list_nonexistent_user(self, client):
        response = client.get("/users/no-existe/game-profiles")
        assert response.status_code == 404
