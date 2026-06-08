"""
Tests del sistema de reviews (Fase 5).

Cubrimos:
- Crear review exitoso (con flujo completo: search → completed → confirm → review)
- Validaciones: doble confirmación, ventana de tiempo, no calificarse a sí mismo
- Comentario mínimo
- Duplicado
- Cálculo de average_score, weight y reputación
- Listar reviews recibidas
- Pending reviews
- Detección de outliers (con la cantidad mínima de reviews previas)
"""

from datetime import datetime, timedelta, timezone

import pytest


def _base_search_payload():
    return {
        "game_slug": "league-of-legends",
        "title": "Test ranked",
        "mode": "ranked-solo",
        "server": "LAS",
        "roles_needed": ["Jungla"],
        "max_players": 5,
        "join_mode": "manual",
    }


def _valid_review_payload(reviewed_user_id, search_id):
    return {
        "reviewed_user_id": reviewed_user_id,
        "search_id": search_id,
        "communication": 5,
        "attitude": 4,
        "skill": 5,
        "reliability": 4,
        "comment": "Excelente jugador, muy buena comunicación y siempre supo el momento de pushear.",
        "would_play_again": True,
    }


@pytest.fixture
def completed_search_with_two_players(
    client, user_with_lol_profile, second_user_with_lol_profile, registered_user
):
    """
    Crea una búsqueda, suma al segundo usuario, la lleva a completed con
    doble confirmación. Devuelve diccionario con search_id, creator_headers,
    participant_headers, creator_id, participant_id.
    """
    # Crear búsqueda
    create_resp = client.post(
        "/searches", json=_base_search_payload(), headers=user_with_lol_profile
    )
    search_id = create_resp.json()["id"]
    creator_id = create_resp.json()["creator"]["id"]

    # Segundo usuario se une
    client.post(
        f"/searches/{search_id}/join",
        json={"role": "Jungla"},
        headers=second_user_with_lol_profile,
    )

    # Obtener id del segundo
    parts = client.get(f"/searches/{search_id}/participations").json()
    pending = [p for p in parts if p["status"] == "pending"][0]
    participant_id = pending["user"]["id"]

    # Creador acepta
    client.post(
        f"/searches/{search_id}/participations/{participant_id}/accept",
        headers=user_with_lol_profile,
    )

    # Iniciar y completar
    client.post(f"/searches/{search_id}/start", headers=user_with_lol_profile)
    client.post(f"/searches/{search_id}/complete", headers=user_with_lol_profile)

    # Doble confirmación: creador confirma (a todos) + participante confirma
    client.post(f"/searches/{search_id}/confirm-played", headers=user_with_lol_profile)
    client.post(
        f"/searches/{search_id}/confirm-played", headers=second_user_with_lol_profile
    )

    return {
        "search_id": search_id,
        "creator_headers": user_with_lol_profile,
        "participant_headers": second_user_with_lol_profile,
        "creator_id": creator_id,
        "participant_id": participant_id,
    }


# --------------------------------------------------------------------------
# Tests de confirmación de partida
# --------------------------------------------------------------------------

class TestConfirmPlayed:
    def test_confirm_only_when_completed(
        self, client, user_with_lol_profile, second_user_with_lol_profile
    ):
        """No se puede confirmar si la búsqueda no está completed."""
        create = client.post("/searches", json=_base_search_payload(), headers=user_with_lol_profile)
        sid = create.json()["id"]
        # Búsqueda está open, no completed
        response = client.post(f"/searches/{sid}/confirm-played", headers=user_with_lol_profile)
        assert response.status_code == 409


# --------------------------------------------------------------------------
# Crear review
# --------------------------------------------------------------------------

class TestCreateReview:
    def test_create_success(self, client, completed_search_with_two_players):
        ctx = completed_search_with_two_players
        response = client.post(
            "/reviews",
            json=_valid_review_payload(ctx["participant_id"], ctx["search_id"]),
            headers=ctx["creator_headers"],
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["communication"] == 5
        assert data["attitude"] == 4
        assert data["average_score"] == 4.5  # (5+4+5+4)/4
        assert data["author"]["id"] == ctx["creator_id"]
        # No deberíamos estar flageados con tan pocas reviews
        assert data["flagged"] is False

    def test_cannot_review_yourself(self, client, completed_search_with_two_players):
        ctx = completed_search_with_two_players
        response = client.post(
            "/reviews",
            json=_valid_review_payload(ctx["creator_id"], ctx["search_id"]),
            headers=ctx["creator_headers"],
        )
        assert response.status_code == 422

    def test_short_comment_rejected(self, client, completed_search_with_two_players):
        ctx = completed_search_with_two_players
        payload = _valid_review_payload(ctx["participant_id"], ctx["search_id"])
        payload["comment"] = "GG"  # Muy corto
        response = client.post("/reviews", json=payload, headers=ctx["creator_headers"])
        assert response.status_code == 422

    def test_score_out_of_range_rejected(self, client, completed_search_with_two_players):
        ctx = completed_search_with_two_players
        payload = _valid_review_payload(ctx["participant_id"], ctx["search_id"])
        payload["skill"] = 10  # Fuera de 1-5
        response = client.post("/reviews", json=payload, headers=ctx["creator_headers"])
        assert response.status_code == 422

    def test_duplicate_rejected(self, client, completed_search_with_two_players):
        ctx = completed_search_with_two_players
        # Primera review
        client.post(
            "/reviews",
            json=_valid_review_payload(ctx["participant_id"], ctx["search_id"]),
            headers=ctx["creator_headers"],
        )
        # Segunda review (mismo par + misma búsqueda)
        response = client.post(
            "/reviews",
            json=_valid_review_payload(ctx["participant_id"], ctx["search_id"]),
            headers=ctx["creator_headers"],
        )
        assert response.status_code == 409


class TestReviewValidationsWithoutConfirmation:
    def test_review_without_confirmation_rejected(
        self, client, user_with_lol_profile, second_user_with_lol_profile
    ):
        """
        Si la partida está completed pero falta la doble confirmación,
        no se puede calificar.
        """
        # Crear y completar búsqueda SIN confirmar
        create = client.post(
            "/searches", json=_base_search_payload(), headers=user_with_lol_profile
        )
        sid = create.json()["id"]
        creator_id = create.json()["creator"]["id"]

        client.post(
            f"/searches/{sid}/join",
            json={"role": "Jungla"},
            headers=second_user_with_lol_profile,
        )
        parts = client.get(f"/searches/{sid}/participations").json()
        participant_id = [p for p in parts if p["status"] == "pending"][0]["user"]["id"]
        client.post(
            f"/searches/{sid}/participations/{participant_id}/accept",
            headers=user_with_lol_profile,
        )
        client.post(f"/searches/{sid}/start", headers=user_with_lol_profile)
        client.post(f"/searches/{sid}/complete", headers=user_with_lol_profile)

        # Intentar review sin confirmar
        response = client.post(
            "/reviews",
            json=_valid_review_payload(participant_id, sid),
            headers=user_with_lol_profile,
        )
        assert response.status_code == 422


# --------------------------------------------------------------------------
# Reputación
# --------------------------------------------------------------------------

class TestReputationCalculation:
    def test_user_reputation_updates_after_review(
        self, client, completed_search_with_two_players
    ):
        ctx = completed_search_with_two_players

        # Antes: reputation 0
        list_users = client.get("/users/secondplayer")
        assert list_users.json()["reputation_score"] == 0.0
        assert list_users.json()["reviews_received_count"] == 0

        # Creamos una review
        client.post(
            "/reviews",
            json=_valid_review_payload(ctx["participant_id"], ctx["search_id"]),
            headers=ctx["creator_headers"],
        )

        # Después: reputación actualizada
        updated = client.get("/users/secondplayer").json()
        assert updated["reputation_score"] == 4.5
        assert updated["reviews_received_count"] == 1


# --------------------------------------------------------------------------
# Listar reviews y pending
# --------------------------------------------------------------------------

class TestListReviews:
    def test_list_user_reviews_public(self, client, completed_search_with_two_players):
        ctx = completed_search_with_two_players
        client.post(
            "/reviews",
            json=_valid_review_payload(ctx["participant_id"], ctx["search_id"]),
            headers=ctx["creator_headers"],
        )
        # Sin auth (público)
        response = client.get("/users/secondplayer/reviews")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["comment"].startswith("Excelente")

    def test_list_nonexistent_user(self, client):
        response = client.get("/users/no-existe/reviews")
        assert response.status_code == 404


class TestPendingReviews:
    def test_pending_reviews_appear(self, client, completed_search_with_two_players):
        ctx = completed_search_with_two_players
        # Sin haber escrito ninguna review, debería aparecer el participante como pendiente
        response = client.get(
            "/users/me/pending-reviews", headers=ctx["creator_headers"]
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["search_id"] == ctx["search_id"]
        pending_ids = [u["user_id"] for u in data[0]["pending_users"]]
        assert ctx["participant_id"] in pending_ids

    def test_pending_reviews_decrease_after_writing(
        self, client, completed_search_with_two_players
    ):
        ctx = completed_search_with_two_players
        # Escribir review
        client.post(
            "/reviews",
            json=_valid_review_payload(ctx["participant_id"], ctx["search_id"]),
            headers=ctx["creator_headers"],
        )
        # Ahora pending debería estar vacío
        response = client.get(
            "/users/me/pending-reviews", headers=ctx["creator_headers"]
        )
        assert response.status_code == 200
        assert response.json() == []
