"""
Tests de la Fase 2: autenticación.

Cubrimos:
- Registro exitoso
- Validaciones de password
- Username/email duplicados
- Login exitoso
- Login con credenciales incorrectas
- Endpoint /users/me con y sin token
- Token inválido
"""

import pytest


# --------------------------------------------------------------------------
# Tests de registro
# --------------------------------------------------------------------------

class TestRegister:
    def test_register_success(self, client):
        response = client.post(
            "/auth/register",
            json={
                "username": "nuevoplayer",
                "email": "nuevo@gameconnect.dev",
                "password": "ValidPass1",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "nuevoplayer"
        assert data["email"] == "nuevo@gameconnect.dev"
        # El hash del password JAMÁS debe aparecer en la respuesta
        assert "password" not in data
        assert "password_hash" not in data
        # Campos por defecto
        assert data["reputation_score"] == 0.0
        assert data["reviews_received_count"] == 0

    def test_register_duplicate_username(self, client, registered_user):
        """Registrar con un username ya usado devuelve 409."""
        response = client.post(
            "/auth/register",
            json={
                "username": registered_user["credentials"]["username"],
                "email": "otro@gameconnect.dev",
                "password": "ValidPass1",
            },
        )
        assert response.status_code == 409
        assert "username" in response.json()["detail"].lower()

    def test_register_duplicate_email(self, client, registered_user):
        """Registrar con un email ya usado devuelve 409."""
        response = client.post(
            "/auth/register",
            json={
                "username": "otrousername",
                "email": registered_user["credentials"]["email"],
                "password": "ValidPass1",
            },
        )
        assert response.status_code == 409
        assert "email" in response.json()["detail"].lower()

    @pytest.mark.parametrize(
        "password,reason",
        [
            ("Short1", "menos de 8 caracteres"),
            ("alllowercase1", "sin mayúscula"),
            ("NoNumbersHere", "sin número"),
            ("1234567", "demasiado corto y sin mayúscula"),
        ],
    )
    def test_register_weak_password(self, client, password, reason):
        """Passwords débiles son rechazados con 422."""
        response = client.post(
            "/auth/register",
            json={
                "username": "playerweak",
                "email": "weak@gameconnect.dev",
                "password": password,
            },
        )
        assert response.status_code == 422, f"Falló validar: {reason}"

    @pytest.mark.parametrize(
        "username",
        ["ab", "a" * 31, "user name", "user@name", "user.name"],
    )
    def test_register_invalid_username(self, client, username):
        """Usernames con caracteres inválidos o longitudes incorrectas son rechazados."""
        response = client.post(
            "/auth/register",
            json={
                "username": username,
                "email": "ok@gameconnect.dev",
                "password": "ValidPass1",
            },
        )
        assert response.status_code == 422

    def test_register_invalid_email(self, client):
        response = client.post(
            "/auth/register",
            json={
                "username": "validuser",
                "email": "not-an-email",
                "password": "ValidPass1",
            },
        )
        assert response.status_code == 422


# --------------------------------------------------------------------------
# Tests de login
# --------------------------------------------------------------------------

class TestLogin:
    def test_login_success(self, client, registered_user):
        response = client.post(
            "/auth/login",
            data={
                "username": registered_user["credentials"]["username"],
                "password": registered_user["credentials"]["password"],
            },
        )
        assert response.status_code == 200
        body = response.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert len(body["access_token"]) > 0

    def test_login_wrong_password(self, client, registered_user):
        response = client.post(
            "/auth/login",
            data={
                "username": registered_user["credentials"]["username"],
                "password": "WrongPass1",
            },
        )
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        """Mismo mensaje de error que password incorrecto: evita enumerar usuarios."""
        response = client.post(
            "/auth/login",
            data={"username": "nadie", "password": "WhateverPass1"},
        )
        assert response.status_code == 401


# --------------------------------------------------------------------------
# Tests de endpoint protegido /users/me
# --------------------------------------------------------------------------

class TestProtectedEndpoint:
    def test_me_with_valid_token(self, client, registered_user, auth_headers):
        response = client.get("/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == registered_user["credentials"]["username"]
        assert data["email"] == registered_user["credentials"]["email"]

    def test_me_without_token(self, client):
        response = client.get("/users/me")
        assert response.status_code == 401

    def test_me_with_invalid_token(self, client):
        response = client.get(
            "/users/me",
            headers={"Authorization": "Bearer este_token_es_basura"},
        )
        assert response.status_code == 401

    def test_me_with_malformed_header(self, client, auth_token):
        # Falta el "Bearer "
        response = client.get(
            "/users/me",
            headers={"Authorization": auth_token},
        )
        assert response.status_code == 401


# --------------------------------------------------------------------------
# Tests de perfil público
# --------------------------------------------------------------------------

class TestPublicProfile:
    def test_get_user_by_username(self, client, registered_user):
        username = registered_user["credentials"]["username"]
        response = client.get(f"/users/{username}")
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == username
        # El email NO debe aparecer en el perfil público
        assert "email" not in data

    def test_get_nonexistent_user(self, client):
        response = client.get("/users/no-existo")
        assert response.status_code == 404
