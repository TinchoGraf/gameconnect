"""
Script de seed: carga los juegos iniciales en la base de datos.

Se ejecuta con:
    python -m app.seed.load_games

Es idempotente: si los juegos ya existen, los actualiza en vez de duplicarlos.

Los game_modes están ordenados de más competitivo a más casual — ese orden
se preserva en el JSON y el frontend lo usa tal cual para el dropdown.

IMPORTANTE: Este script asume que las tablas YA EXISTEN. La creación de tablas
es responsabilidad de Alembic. Antes de correr el seed por primera vez:
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
        # Ordenados: ranked primero, chill al final
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