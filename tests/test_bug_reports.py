"""
Tests del endpoint de reporte de bugs.

Cubrimos:
- Reporte logueado: queda guardado el reporter_username
- Reporte anónimo (sin token): se guarda igual, con reporter_username null
- Validación de campos requeridos
- El endpoint no falla aunque no haya RESEND_API_KEY configurada
  (rama "simulado" de desarrollo en app/core/email.py)
"""

import pytest


def _base_payload():
    return {
        "location": "Creando una búsqueda",
        "what_before": "Elegí el juego League of Legends",
        "what_after": "Apreté crear búsqueda y no pasó nada",
        "description": "El botón se queda cargando para siempre",
    }


class TestCreateBugReport:
    def test_create_logged_in(self, client, auth_headers, loaded_games):
        response = client.post(
            "/bug-reports", json=_base_payload(), headers=auth_headers
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["reporter_username"] == "testplayer"
        assert data["location"] == "Creando una búsqueda"

    def test_create_anonymous(self, client, loaded_games):
        """Sin header de auth, el reporte se guarda igual, sin reporter."""
        response = client.post("/bug-reports", json=_base_payload())
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["reporter_username"] is None

    def test_create_with_invalid_token_does_not_fail(self, client, loaded_games):
        """Un token roto no debe tirar 401 en este endpoint: se trata como anónimo."""
        response = client.post(
            "/bug-reports",
            json=_base_payload(),
            headers={"Authorization": "Bearer token-invalido"},
        )
        assert response.status_code == 201
        assert response.json()["reporter_username"] is None

    def test_missing_field(self, client, loaded_games):
        payload = _base_payload()
        del payload["description"]
        response = client.post("/bug-reports", json=payload)
        assert response.status_code == 422

    def test_field_too_short(self, client, loaded_games):
        payload = _base_payload()
        payload["location"] = "a"
        response = client.post("/bug-reports", json=payload)
        assert response.status_code == 422

    def test_does_not_require_resend_configured(self, client, loaded_games):
        """
        En los tests no hay RESEND_API_KEY seteada (igual que en desarrollo
        local sin configurar nada): el endpoint debe responder 201 igual,
        la rama de email simplemente loguea en vez de llamar a la API.
        """
        response = client.post("/bug-reports", json=_base_payload())
        assert response.status_code == 201
