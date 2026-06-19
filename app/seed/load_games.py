"""
Script de seed: carga los juegos iniciales en la base de datos.

Se ejecuta con:
    python -m app.seed.load_games

Es idempotente: si los juegos ya existen, los actualiza en vez de duplicarlos.

Los game_modes están ordenados de más competitivo a más casual.

IMPORTANTE: Este script asume que las tablas YA EXISTEN.
    alembic upgrade head
"""

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.game import Game


GAMES_DATA = [
    {
        "name": "League of Legends",
        "slug": "league-of-legends",
        "description": "MOBA 5v5 de Riot Games",
        "roles": ["Top", "Jungla", "Mid", "ADC", "Support"],
        "servers": ["LAS", "LAN", "NA", "BR", "EUW", "EUNE", "KR", "JP", "OCE", "TR", "RU"],
        "game_modes": [
            "Ranked Solo/Duo",
            "Ranked Flex",
            "Tryhard (Normal)",
            "Normal",
            "ARAM",
            "Chill",
        ],
    },
    {
        "name": "Counter Strike 2",
        "slug": "counter-strike-2",
        "description": "FPS táctico 5v5 de Valve",
        "roles": ["Entry Fragger", "AWPer", "IGL", "Support", "Lurker", "Rifler"],
        "servers": ["SA", "NA-East", "NA-West", "EU-West", "EU-East", "Asia", "Oceania"],
        "game_modes": [
            "Premier",
            "Competitivo",
            "Wingman",
            "Chill",
            "Casual",
        ],
    },
    {
        "name": "Dead by Daylight",
        "slug": "dead-by-daylight",
        "description": "Asimétrico 4v1 de Behaviour Interactive",
        "roles": ["Killer", "Survivor"],
        "servers": ["Americas", "Europe", "Asia"],
        "game_modes": [
            "Ranked",
            "Tryhard",
            "Tome Grind",
            "Custom",
            "Chill",
        ],
    },
    {
        "name": "Rocket League",
        "slug": "rocket-league",
        "description": "Fútbol con autos de Psyonix",
        "roles": ["Striker", "Midfielder", "Goalkeeper", "Flex"],
        "servers": ["SAM", "USE", "USW", "EU", "ASIA", "OCE", "ME"],
        "game_modes": [
            "Ranked 3v3",
            "Ranked 2v2",
            "Ranked 1v1",
            "Tournament",
            "Casual",
            "Chill",
        ],
    },
    {
        "name": "Valorant",
        "slug": "valorant",
        "description": "FPS táctico 5v5 de Riot Games",
        "roles": ["Duelist", "Sentinel", "Initiator", "Controller"],
        "servers": ["LATAM", "NA", "BR", "EU", "KR", "JP"],
        "game_modes": [
            "Competitive",
            "Unranked",
            "Spike Rush",
            "Deathmatch",
        ],
    },
    {
        "name": "Warzone",
        "slug": "warzone",
        "description": "Battle Royale de Activision",
        "roles": ["Sniper", "Slayer", "IGL", "Flex"],
        "servers": ["NA", "EU", "LATAM", "Asia", "OCE"],
        "game_modes": [
            "BR Squads",
            "BR Trios",
            "BR Duos",
            "BR Solos",
            "Resurgence",
        ],
    },
    {
        "name": "Fortnite",
        "slug": "fortnite",
        "description": "Battle Royale de Epic Games",
        "roles": ["Builder Pro", "Editor", "Box Fighter", "Box Defender", "IGL", "Flex"],
        "servers": ["NA-East", "NA-West", "EU", "BR", "ME", "OCE", "Asia"],
        "game_modes": [
            "Ranked",
            "Battle Royale",
            "Zero Build",
            "Squads",
            "Trios",
            "Duos",
        ],
    },
    {
        "name": "FIFA",
        "slug": "fifa",
        "description": "Fútbol online de EA Sports — modos cooperativos",
        "roles": ["Delantero", "Mediocampista", "Defensor", "Arquero", "Cualquiera"],
        "servers": ["NA", "EU", "LATAM", "Asia"],
        "game_modes": [
            "Pro Clubs",
            "FUT Champions Co-op",
        ],
    },
    {
        "name": "GTA V Online",
        "slug": "gta-v-online",
        "description": "Mundo abierto online de Rockstar Games",
        "roles": [
            "Asaltante",
            "Conductor / Piloto",
            "Sigiloso / Hacker",
            "Rolero",
            "Negocios (CEO/MC)",
            "Cualquiera / Flex",
        ],
        "servers": ["NA", "EU", "LATAM", "OCE"],
        "game_modes": [
            "Rol (FiveM)",
            "Heists",
            "Negocios",
            "Trabajos Contrato",
            "Survival",
            "Carreras Públicas",
            "Modo Libre",
            "Custom - Carreras",
            "Custom - Derby",
            "Custom - Caza",
            "Custom - Captura",
            "Custom - Versus",
        ],
    },
]


def seed_games(db: Session) -> None:
    """Carga o actualiza los juegos iniciales."""
    for data in GAMES_DATA:
        existing = db.query(Game).filter(Game.slug == data["slug"]).first()
        if existing:
            existing.name = data["name"]
            existing.description = data["description"]
            existing.roles = data["roles"]
            existing.servers = data["servers"]
            existing.game_modes = data["game_modes"]
            print(f"  ↻ Actualizado: {data['name']}")
        else:
            game = Game(**data)
            db.add(game)
            print(f"  ✓ Creado: {data['name']}")

    db.commit()


def main() -> None:
    print("Cargando juegos iniciales en la base de datos...\n")
    db = SessionLocal()
    try:
        seed_games(db)
        print("\n✅ Seed completado.")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()