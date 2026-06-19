"""
Tests de la Fase 4: sistema de búsquedas.

Cubrimos:
- Crear búsqueda (con perfil y sin perfil)
- Validación de server, mode y roles contra el juego
- Listar y filtrar búsquedas
- Update y cancel (solo creador)
- Unirse a búsqueda (modos manual y auto)
- Validaciones al unirse (perfil obligatorio, server matching)
- Aceptar/rechazar participantes
- Cambios de estado (start, complete)
"""

import pytest


def _base_search_payload():
    return {
        "game_slug": "league-of-legends",
        "title": "Buscamos jungla y supp para ranked",
        "description": "Solo Diamante o más",
        "mode": "Ranked Solo/Duo",
        "server": "LAS",
        "roles_needed": ["Jungla", "Support"],
        "max_players": 5,
        "join_mode": "manual",
    }


# --------------------------------------------------------------------------
# Crear búsqueda
# --------------------------------------------------------------------------

class TestCreateSearch:
    def test_create_success(self, client, user_with_lol_profile):
        response = client.post(
            "/searches", json=_base_search_payload(), headers=user_with_lol_profile
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["title"] == "Buscamos jungla y supp para ranked"
        assert data["game"]["slug"] == "league-of-legends"
        # El creador cuenta como participante aceptado
        assert data["accepted_count"] == 1

    def test_create_requires_auth(self, client, loaded_games):
        response = client.post("/searches", json=_base_search_payload())
        assert response.status_code == 401

    def test_create_requires_game_profile(self, client, auth_headers, loaded_games):
        """Sin perfil de LoL, no puedo crear búsqueda de LoL."""
        response = client.post(
            "/searches", json=_base_search_payload(), headers=auth_headers
        )
        assert response.status_code == 422
        assert "perfil" in response.json()["detail"].lower()

    def test_create_server_mismatch(self, client, user_with_lol_profile):
        """No puedo crear una búsqueda en NA si mi perfil juega en LAS."""
        payload = _base_search_payload()
        payload["server"] = "NA"
        response = client.post("/searches", json=payload, headers=user_with_lol_profile)
        assert response.status_code == 422
        assert "servidor" in response.json()["detail"].lower()

    def test_create_invalid_mode(self, client, user_with_lol_profile):
        payload = _base_search_payload()
        payload["mode"] = "no-existe"
        response = client.post("/searches", json=payload, headers=user_with_lol_profile)
        assert response.status_code == 422

    def test_create_invalid_role(self, client, user_with_lol_profile):
        payload = _base_search_payload()
        payload["roles_needed"] = ["Tank"]
        response = client.post("/searches", json=payload, headers=user_with_lol_profile)
        assert response.status_code == 422


# --------------------------------------------------------------------------
# Listar / detalle
# --------------------------------------------------------------------------

class TestListAndGet:
    def test_list_empty(self, client, loaded_games):
        response = client.get("/searches")
        assert response.status_code == 200
        assert response.json() == []

    def test_list_shows_open_only_by_default(self, client, user_with_lol_profile):
        client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        response = client.get("/searches")
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_filter_by_game(self, client, user_with_lol_profile):
        client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        response = client.get("/searches?game_slug=league-of-legends")
        assert len(response.json()) == 1
        response = client.get("/searches?game_slug=counter-strike-2")
        assert len(response.json()) == 0

    def test_get_search_detail(self, client, user_with_lol_profile):
        create = client.post(
            "/searches", json=_base_search_payload(), headers=user_with_lol_profile
        )
        search_id = create.json()["id"]
        response = client.get(f"/searches/{search_id}")
        assert response.status_code == 200
        assert response.json()["id"] == search_id

    def test_get_nonexistent(self, client, loaded_games):
        assert client.get("/searches/999").status_code == 404


# --------------------------------------------------------------------------
# Update / cancel
# --------------------------------------------------------------------------

class TestUpdateAndCancel:
    def test_update_by_creator(self, client, user_with_lol_profile):
        create = client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        sid = create.json()["id"]
        response = client.put(
            f"/searches/{sid}",
            json={"title": "Nuevo titulo"},
            headers=user_with_lol_profile,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Nuevo titulo"

    def test_update_by_non_creator_forbidden(
        self, client, user_with_lol_profile, second_user_with_lol_profile
    ):
        create = client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        sid = create.json()["id"]
        response = client.put(
            f"/searches/{sid}",
            json={"title": "Hackeada"},
            headers=second_user_with_lol_profile,
        )
        assert response.status_code == 403

    def test_cancel_search(self, client, user_with_lol_profile):
        create = client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        sid = create.json()["id"]
        response = client.delete(f"/searches/{sid}", headers=user_with_lol_profile)
        assert response.status_code == 204
        # Ya no aparece en la lista de abiertas
        assert len(client.get("/searches").json()) == 0


# --------------------------------------------------------------------------
# Unirse a búsqueda (manual y auto)
# --------------------------------------------------------------------------

class TestJoinSearch:
    def test_join_manual_creates_pending(
        self, client, user_with_lol_profile, second_user_with_lol_profile
    ):
        create = client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        sid = create.json()["id"]
        response = client.post(
            f"/searches/{sid}/join",
            json={"role": "Jungla"},
            headers=second_user_with_lol_profile,
        )
        assert response.status_code == 201
        assert response.json()["status"] == "pending"

    def test_join_auto_creates_accepted(
        self, client, user_with_lol_profile, second_user_with_lol_profile
    ):
        payload = _base_search_payload()
        payload["join_mode"] = "auto"
        create = client.post("/searches", json=payload, headers=user_with_lol_profile)
        sid = create.json()["id"]
        response = client.post(
            f"/searches/{sid}/join",
            json={"role": "Jungla"},
            headers=second_user_with_lol_profile,
        )
        assert response.status_code == 201
        assert response.json()["status"] == "accepted"

    def test_join_without_profile(
        self, client, user_with_lol_profile, second_user_headers, loaded_games
    ):
        """Si el usuario no tiene perfil de LoL, no se puede unir."""
        create = client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        sid = create.json()["id"]
        response = client.post(
            f"/searches/{sid}/join", json={}, headers=second_user_headers
        )
        assert response.status_code == 422
        assert "perfil" in response.json()["detail"].lower()

    def test_join_server_mismatch(
        self, client, user_with_lol_profile, second_user_headers, loaded_games
    ):
        """Segundo usuario tiene perfil en NA pero la búsqueda es en LAS."""
        # Crear el perfil del segundo usuario en NA
        client.post(
            "/users/me/game-profiles",
            json={
                "game_slug": "league-of-legends",
                "roles": ["Mid"],
                "main_role": "Mid",
                "server": "NA",
                "experience_level": "Casual",
            },
            headers=second_user_headers,
        )
        create = client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        sid = create.json()["id"]
        response = client.post(
            f"/searches/{sid}/join", json={}, headers=second_user_headers
        )
        assert response.status_code == 422
        assert "servidor" in response.json()["detail"].lower() or "server" in response.json()["detail"].lower()

    def test_join_creator_forbidden(self, client, user_with_lol_profile):
        create = client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        sid = create.json()["id"]
        response = client.post(f"/searches/{sid}/join", json={}, headers=user_with_lol_profile)
        assert response.status_code == 409

    def test_join_role_not_in_profile(
        self, client, user_with_lol_profile, second_user_with_lol_profile
    ):
        """Segundo usuario juega Jungla/Support pero pide rol Mid."""
        create = client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        sid = create.json()["id"]
        response = client.post(
            f"/searches/{sid}/join",
            json={"role": "Mid"},
            headers=second_user_with_lol_profile,
        )
        assert response.status_code == 422


# --------------------------------------------------------------------------
# Aceptar / rechazar
# --------------------------------------------------------------------------

class TestAcceptReject:
    def test_creator_accepts_pending(
        self, client, user_with_lol_profile, second_user_with_lol_profile, registered_user
    ):
        # Crear búsqueda manual
        create = client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        sid = create.json()["id"]

        # Segundo se une (queda pending)
        client.post(
            f"/searches/{sid}/join",
            json={"role": "Jungla"},
            headers=second_user_with_lol_profile,
        )

        # Obtener id del segundo usuario
        list_resp = client.get(f"/searches/{sid}/participations")
        pending = [p for p in list_resp.json() if p["status"] == "pending"][0]
        second_user_id = pending["user"]["id"]

        # Creador acepta
        response = client.post(
            f"/searches/{sid}/participations/{second_user_id}/accept",
            headers=user_with_lol_profile,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "accepted"

    def test_non_creator_cannot_accept(
        self, client, user_with_lol_profile, second_user_with_lol_profile, registered_user
    ):
        create = client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        sid = create.json()["id"]
        client.post(
            f"/searches/{sid}/join", json={"role": "Jungla"}, headers=second_user_with_lol_profile
        )
        list_resp = client.get(f"/searches/{sid}/participations")
        pending = [p for p in list_resp.json() if p["status"] == "pending"][0]
        second_user_id = pending["user"]["id"]

        # El propio segundo usuario intenta aceptarse a sí mismo
        response = client.post(
            f"/searches/{sid}/participations/{second_user_id}/accept",
            headers=second_user_with_lol_profile,
        )
        assert response.status_code == 403


# --------------------------------------------------------------------------
# Cambios de estado (start, complete)
# --------------------------------------------------------------------------

class TestSearchLifecycle:
    def test_start_search(self, client, user_with_lol_profile):
        create = client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        sid = create.json()["id"]
        response = client.post(f"/searches/{sid}/start", headers=user_with_lol_profile)
        assert response.status_code == 200
        assert response.json()["status"] == "in_progress"

    def test_complete_after_start(self, client, user_with_lol_profile):
        create = client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        sid = create.json()["id"]
        client.post(f"/searches/{sid}/start", headers=user_with_lol_profile)
        response = client.post(f"/searches/{sid}/complete", headers=user_with_lol_profile)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["completed_at"] is not None

    def test_complete_without_start_fails(self, client, user_with_lol_profile):
        create = client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        sid = create.json()["id"]
        response = client.post(f"/searches/{sid}/complete", headers=user_with_lol_profile)
        assert response.status_code == 409


# --------------------------------------------------------------------------
# Tests del endpoint "mis búsquedas"
# --------------------------------------------------------------------------

class TestMySearches:
    def test_empty_when_no_activity(self, client, user_with_lol_profile):
        """Usuario sin búsquedas creadas ni participaciones devuelve listas vacías."""
        response = client.get("/searches/me/listing", headers=user_with_lol_profile)
        assert response.status_code == 200
        data = response.json()
        assert data["created"] == []
        assert data["participating"] == []

    def test_shows_created_searches(self, client, user_with_lol_profile):
        """Las búsquedas que creé aparecen en 'created'."""
        client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        response = client.get("/searches/me/listing", headers=user_with_lol_profile)
        assert response.status_code == 200
        data = response.json()
        assert len(data["created"]) == 1
        assert data["participating"] == []

    def test_shows_participating_searches(
        self, client, user_with_lol_profile, second_user_with_lol_profile
    ):
        """Búsquedas donde me uní (sin ser creador) aparecen en 'participating'."""
        # El usuario 1 crea
        create_resp = client.post(
            "/searches", json=_base_search_payload(), headers=user_with_lol_profile
        )
        sid = create_resp.json()["id"]

        # El usuario 2 se une
        client.post(
            f"/searches/{sid}/join",
            json={"role": "Jungla"},
            headers=second_user_with_lol_profile,
        )

        # Listing del usuario 2: debería ver la búsqueda en participating
        response = client.get(
            "/searches/me/listing", headers=second_user_with_lol_profile
        )
        assert response.status_code == 200
        data = response.json()
        assert data["created"] == []
        assert len(data["participating"]) == 1
        assert data["participating"][0]["id"] == sid

    def test_creator_does_not_see_own_search_in_participating(
        self, client, user_with_lol_profile, second_user_with_lol_profile
    ):
        """Si soy creador, mi búsqueda solo aparece en 'created', no en 'participating'."""
        client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        response = client.get("/searches/me/listing", headers=user_with_lol_profile)
        data = response.json()
        assert len(data["created"]) == 1
        assert data["participating"] == []

    def test_rejected_not_shown_in_participating(
        self, client, user_with_lol_profile, second_user_with_lol_profile
    ):
        """Si me rechazaron, no debería aparecer en 'participating'."""
        create_resp = client.post(
            "/searches", json=_base_search_payload(), headers=user_with_lol_profile
        )
        sid = create_resp.json()["id"]

        # User 2 se une (queda pending)
        client.post(
            f"/searches/{sid}/join",
            json={"role": "Jungla"},
            headers=second_user_with_lol_profile,
        )

        # User 1 rechaza
        parts = client.get(f"/searches/{sid}/participations").json()
        pending = [p for p in parts if p["status"] == "pending"][0]
        user2_id = pending["user"]["id"]
        client.post(
            f"/searches/{sid}/participations/{user2_id}/reject",
            headers=user_with_lol_profile,
        )

        # User 2 ahora no debería ver la búsqueda en participating
        response = client.get(
            "/searches/me/listing", headers=second_user_with_lol_profile
        )
        data = response.json()
        assert data["participating"] == []

    def test_requires_auth(self, client, loaded_games):
        response = client.get("/searches/me/listing")
        assert response.status_code == 401


class TestPlayersNeededLogic:
    """
    Verifica que el frontend puede mandar 'jugadores que faltan'
    y el backend los guarda como max_players = playersNeeded + 1.
    """

    def test_max_players_stored_correctly(self, client, user_with_lol_profile):
        """
        Si el usuario busca 3 jugadores más, max_players en BD debe ser 4.
        """
        payload = {**_base_search_payload(), "max_players": 4}
        response = client.post("/searches", json=payload, headers=user_with_lol_profile)
        assert response.status_code == 201
        data = response.json()
        assert data["max_players"] == 4

    def test_min_players_is_two(self, client, user_with_lol_profile):
        """
        max_players mínimo es 2 (buscar al menos 1 jugador más que vos).
        """
        payload = {**_base_search_payload(), "max_players": 1}
        response = client.post("/searches", json=payload, headers=user_with_lol_profile)
        assert response.status_code == 422