"""
Tests del catálogo de juegos y del seed.

Verifican que:
- El endpoint GET /games devuelve todos los juegos esperados
- Cada juego tiene la estructura correcta (roles, servers, modos)
- Los juegos nuevos (Sesión E) están presentes
"""

import pytest


EXPECTED_GAMES = [
    "league-of-legends",
    "counter-strike-2",
    "dead-by-daylight",
    "rocket-league",
    "valorant",
    "warzone",
    "fortnite",
    "fifa",
    "gta-v-online",
]


class TestGamesCatalog:

    def test_get_games_returns_all(self, client, loaded_games):
        """El endpoint devuelve los 9 juegos esperados."""
        response = client.get("/games")
        assert response.status_code == 200
        data = response.json()
        slugs = [g["slug"] for g in data]
        for expected_slug in EXPECTED_GAMES:
            assert expected_slug in slugs, f"Falta el juego: {expected_slug}"

    def test_each_game_has_required_fields(self, client, loaded_games):
        """Cada juego tiene nombre, slug, roles, servers y modos."""
        response = client.get("/games")
        data = response.json()
        for game in data:
            assert game["name"], f"Juego sin nombre: {game}"
            assert game["slug"], f"Juego sin slug: {game}"
            assert isinstance(game["roles"], list), f"Roles no es lista: {game['slug']}"
            assert isinstance(game["servers"], list), f"Servers no es lista: {game['slug']}"
            assert isinstance(game["game_modes"], list), f"Modos no es lista: {game['slug']}"

    def test_new_games_have_roles(self, client, loaded_games):
        """Los 5 juegos nuevos tienen al menos un rol configurado."""
        new_slugs = ["valorant", "warzone", "fortnite", "fifa", "gta-v-online"]
        response = client.get("/games")
        data = response.json()
        games_by_slug = {g["slug"]: g for g in data}
        for slug in new_slugs:
            assert slug in games_by_slug, f"Juego no encontrado: {slug}"
            assert len(games_by_slug[slug]["roles"]) > 0, f"Sin roles: {slug}"

    def test_new_games_have_modes(self, client, loaded_games):
        """Los 5 juegos nuevos tienen al menos un modo de juego."""
        new_slugs = ["valorant", "warzone", "fortnite", "fifa", "gta-v-online"]
        response = client.get("/games")
        data = response.json()
        games_by_slug = {g["slug"]: g for g in data}
        for slug in new_slugs:
            assert len(games_by_slug[slug]["game_modes"]) > 0, f"Sin modos: {slug}"

    def test_valorant_roles(self, client, loaded_games):
        """Valorant tiene exactamente los 4 roles de agente decididos."""
        response = client.get("/games")
        data = response.json()
        valorant = next(g for g in data if g["slug"] == "valorant")
        assert set(valorant["roles"]) == {
            "Duelist", "Sentinel", "Initiator", "Controller"
        }

    def test_gta_has_custom_modes(self, client, loaded_games):
        """GTA V Online tiene los modos Custom aplanados."""
        response = client.get("/games")
        data = response.json()
        gta = next(g for g in data if g["slug"] == "gta-v-online")
        custom_modes = [m for m in gta["game_modes"] if m.startswith("Custom")]
        assert len(custom_modes) >= 4, "GTA debería tener al menos 4 modos Custom"

    def test_fifa_no_solo_modes(self, client, loaded_games):
        """FIFA solo tiene modos cooperativos, no 1v1."""
        response = client.get("/games")
        data = response.json()
        fifa = next(g for g in data if g["slug"] == "fifa")
        modes_lower = [m.lower() for m in fifa["game_modes"]]
        assert "1v1" not in modes_lower, "FIFA no debería tener modo 1v1"
        assert not any("solo" in m for m in modes_lower), "FIFA no debería tener modo solo"