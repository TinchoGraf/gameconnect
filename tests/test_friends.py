"""
Tests del sistema de amigos y bloqueos (Sesión C).

Cubrimos:
- Mandar solicitud, aceptar, rechazar, cancelar
- Casos borde: auto-solicitud, bloqueado, ya amigos, duplicado
- Bloquear y desbloquear
- Bloqueo cancela amistad existente
- Reintento después de rechazo
"""

import pytest


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def _register_and_login(client, username, email):
    """Registra un usuario y devuelve sus headers de auth."""
    client.post("/auth/register", json={
        "username": username,
        "email": email,
        "password": "SuperSafe1",
    })
    resp = client.post("/auth/login", data={
        "username": username,
        "password": "SuperSafe1",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_a(client, loaded_games):
    return _register_and_login(client, "userA", "a@test.com")


@pytest.fixture
def user_b(client, loaded_games):
    return _register_and_login(client, "userB", "b@test.com")


@pytest.fixture
def user_c(client, loaded_games):
    return _register_and_login(client, "userC", "c@test.com")


# --------------------------------------------------------------------------
# Tests de solicitudes
# --------------------------------------------------------------------------

class TestFriendRequests:

    def test_send_request_success(self, client, user_a, user_b):
        """A puede mandar solicitud a B."""
        response = client.post("/friends/requests/userB", headers=user_a)
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "pending"
        assert data["requester"]["username"] == "userA"
        assert data["addressee"]["username"] == "userB"

    def test_cannot_send_to_self(self, client, user_a):
        """No podés mandarte solicitud a vos mismo."""
        response = client.post("/friends/requests/userA", headers=user_a)
        assert response.status_code == 400

    def test_cannot_send_to_nonexistent_user(self, client, user_a):
        response = client.post("/friends/requests/noexiste", headers=user_a)
        assert response.status_code == 404

    def test_cannot_send_duplicate_pending(self, client, user_a, user_b):
        """No podés mandar dos solicitudes pendientes al mismo usuario."""
        client.post("/friends/requests/userB", headers=user_a)
        response = client.post("/friends/requests/userB", headers=user_a)
        assert response.status_code == 400

    def test_cannot_send_if_already_friends(self, client, user_a, user_b):
        """Si ya son amigos, no podés mandar otra solicitud."""
        client.post("/friends/requests/userB", headers=user_a)
        client.post("/friends/requests/userA/accept", headers=user_b)
        response = client.post("/friends/requests/userB", headers=user_a)
        assert response.status_code == 400

    def test_requires_auth(self, client, loaded_games):
        response = client.post("/friends/requests/userA")
        assert response.status_code == 401


class TestAcceptReject:

    def test_accept_request(self, client, user_a, user_b):
        """B acepta la solicitud de A → status accepted."""
        client.post("/friends/requests/userB", headers=user_a)
        response = client.post("/friends/requests/userA/accept", headers=user_b)
        assert response.status_code == 200
        assert response.json()["status"] == "accepted"

    def test_reject_request(self, client, user_a, user_b):
        """B rechaza la solicitud de A → status rejected."""
        client.post("/friends/requests/userB", headers=user_a)
        response = client.post("/friends/requests/userA/reject", headers=user_b)
        assert response.status_code == 200
        assert response.json()["status"] == "rejected"

    def test_only_addressee_can_accept(self, client, user_a, user_b, user_c):
        """C no puede aceptar la solicitud que A le mandó a B."""
        client.post("/friends/requests/userB", headers=user_a)
        response = client.post("/friends/requests/userA/accept", headers=user_c)
        assert response.status_code == 404

    def test_cannot_accept_nonexistent_request(self, client, user_a, user_b):
        """No se puede aceptar si no hay solicitud."""
        response = client.post("/friends/requests/userA/accept", headers=user_b)
        assert response.status_code == 404

    def test_retry_after_rejection(self, client, user_a, user_b):
        """Después de un rechazo, A puede volver a intentar."""
        client.post("/friends/requests/userB", headers=user_a)
        client.post("/friends/requests/userA/reject", headers=user_b)
        response = client.post("/friends/requests/userB", headers=user_a)
        assert response.status_code == 201
        assert response.json()["status"] == "pending"


class TestCancelRequest:

    def test_cancel_sent_request(self, client, user_a, user_b):
        """A puede cancelar la solicitud que mandó antes de que B responda."""
        client.post("/friends/requests/userB", headers=user_a)
        response = client.delete("/friends/requests/userB", headers=user_a)
        assert response.status_code == 204

    def test_only_requester_can_cancel(self, client, user_a, user_b):
        """B no puede cancelar la solicitud que A le mandó."""
        client.post("/friends/requests/userB", headers=user_a)
        response = client.delete("/friends/requests/userA", headers=user_b)
        assert response.status_code == 400

    def test_cannot_cancel_nonexistent(self, client, user_a, user_b):
        response = client.delete("/friends/requests/userB", headers=user_a)
        assert response.status_code == 404


# --------------------------------------------------------------------------
# Tests de lista de amigos
# --------------------------------------------------------------------------

class TestFriendsList:

    def test_list_friends_empty(self, client, user_a):
        response = client.get("/friends", headers=user_a)
        assert response.status_code == 200
        assert response.json() == []

    def test_list_friends_after_accept(self, client, user_a, user_b):
        """Después de aceptar, ambos se ven como amigos."""
        client.post("/friends/requests/userB", headers=user_a)
        client.post("/friends/requests/userA/accept", headers=user_b)

        resp_a = client.get("/friends", headers=user_a)
        resp_b = client.get("/friends", headers=user_b)

        assert len(resp_a.json()) == 1
        assert len(resp_b.json()) == 1

    def test_remove_friend(self, client, user_a, user_b):
        """Después de eliminar amigo, ya no aparece en la lista."""
        client.post("/friends/requests/userB", headers=user_a)
        client.post("/friends/requests/userA/accept", headers=user_b)
        client.delete("/friends/userB", headers=user_a)

        response = client.get("/friends", headers=user_a)
        assert response.json() == []

    def test_list_received_requests(self, client, user_a, user_b):
        """B ve la solicitud de A en sus solicitudes recibidas."""
        client.post("/friends/requests/userB", headers=user_a)
        response = client.get("/friends/requests/received", headers=user_b)
        assert len(response.json()) == 1
        assert response.json()[0]["requester"]["username"] == "userA"

    def test_list_sent_requests(self, client, user_a, user_b):
        """A ve su solicitud en las enviadas."""
        client.post("/friends/requests/userB", headers=user_a)
        response = client.get("/friends/requests/sent", headers=user_a)
        assert len(response.json()) == 1
        assert response.json()[0]["addressee"]["username"] == "userB"


# --------------------------------------------------------------------------
# Tests de bloqueos
# --------------------------------------------------------------------------

class TestBlocks:

    def test_block_user(self, client, user_a, user_b):
        """A bloquea a B."""
        response = client.post("/friends/blocks/userB", headers=user_a)
        assert response.status_code == 201

    def test_cannot_block_self(self, client, user_a):
        response = client.post("/friends/blocks/userA", headers=user_a)
        assert response.status_code == 400

    def test_cannot_send_request_to_blocked(self, client, user_a, user_b):
        """Si A bloqueó a B, A no puede mandar solicitud a B."""
        client.post("/friends/blocks/userB", headers=user_a)
        response = client.post("/friends/requests/userB", headers=user_a)
        assert response.status_code == 400

    def test_cannot_send_request_if_blocked_by_target(self, client, user_a, user_b):
        """Si B bloqueó a A, A no puede mandar solicitud a B."""
        client.post("/friends/blocks/userA", headers=user_b)
        response = client.post("/friends/requests/userB", headers=user_a)
        assert response.status_code == 400

    def test_block_removes_existing_friendship(self, client, user_a, user_b):
        """Si eran amigos y A bloquea a B, la amistad se elimina."""
        client.post("/friends/requests/userB", headers=user_a)
        client.post("/friends/requests/userA/accept", headers=user_b)
        client.post("/friends/blocks/userB", headers=user_a)

        friends = client.get("/friends", headers=user_a)
        assert friends.json() == []

    def test_unblock_user(self, client, user_a, user_b):
        """A puede desbloquear a B."""
        client.post("/friends/blocks/userB", headers=user_a)
        response = client.delete("/friends/blocks/userB", headers=user_a)
        assert response.status_code == 204

    def test_cannot_unblock_not_blocked(self, client, user_a, user_b):
        response = client.delete("/friends/blocks/userB", headers=user_a)
        assert response.status_code == 404

    def test_list_blocked_users(self, client, user_a, user_b, user_c):
        """A ve a quién bloqueó."""
        client.post("/friends/blocks/userB", headers=user_a)
        client.post("/friends/blocks/userC", headers=user_a)
        response = client.get("/friends/blocks", headers=user_a)
        assert len(response.json()) == 2