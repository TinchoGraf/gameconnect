"""
Script de seed: carga los juegos iniciales en la base de datos.

Se ejecuta con:
    python -m app.seed.load_games

Es idempotente: si los juegos ya existen, los actualiza en vez de duplicarlos.
Esto permite correrlo varias veces sin problema (por ejemplo, después de
agregar un nuevo rol a un juego existente).
"""

from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app.models.game import Game


GAMES_DATA = [
    {
        "name": "League of Legends",
        "slug": "league-of-legends",
        "description": "MOBA 5v5 de Riot Games",
        "roles": ["Top", "Jungla", "Mid", "ADC", "Support"],
        "servers": ["LAS", "LAN", "NA", "BR", "EUW", "EUNE", "KR", "JP", "OCE", "TR", "RU"],
        "game_modes": ["chill", "tryhard", "ranked-solo", "ranked-flex", "normal", "aram"],
    },
    {
        "name": "Counter Strike 2",
        "slug": "counter-strike-2",
        "description": "FPS táctico 5v5 de Valve",
        "roles": ["Entry Fragger", "AWPer", "IGL", "Support", "Lurker", "Rifler"],
        "servers": ["SA", "NA-East", "NA-West", "EU-West", "EU-East", "Asia", "Oceania"],
        "game_modes": ["chill", "tryhard", "competitive", "premier", "wingman", "casual"],
    },
    {
        "name": "Dead by Daylight",
        "slug": "dead-by-daylight",
        "description": "Asimétrico 4v1 de Behaviour Interactive",
        "roles": ["Killer", "Survivor"],
        "servers": ["Americas", "Europe", "Asia"],
        "game_modes": ["chill", "tryhard", "ranked", "custom", "tome-grind"],
    },
    {
        "name": "Rocket League",
        "slug": "rocket-league",
        "description": "Fútbol con autos de Psyonix",
        "roles": ["Striker", "Midfielder", "Goalkeeper", "Flex"],
        "servers": ["SAM", "USE", "USW", "EU", "ASIA", "OCE", "ME"],
        "game_modes": ["chill", "tryhard", "ranked-2v2", "ranked-3v3", "ranked-1v1", "casual", "tournament"],
    },
]


def seed_games(db: Session) -> None:
    """Carga o actualiza los juegos iniciales."""
    for data in GAMES_DATA:
        # Buscamos si ya existe por slug (único)
        existing = db.query(Game).filter(Game.slug == data["slug"]).first()

        if existing:
            # Actualizamos los campos por si cambiaron
            existing.name = data["name"]
            existing.description = data["description"]
            existing.roles = data["roles"]
            existing.servers = data["servers"]
            existing.game_modes = data["game_modes"]
            print(f"  ↻ Actualizado: {data['name']}")
        else:
            # Lo creamos de cero
            game = Game(**data)
            db.add(game)
            print(f"  ✓ Creado: {data['name']}")

    db.commit()


def main() -> None:
    print("Cargando juegos iniciales en la base de datos...\n")

    # Importamos los modelos para que SQLAlchemy los registre
    from app import models  # noqa: F401
    from app.database import Base

    # Aseguramos que las tablas existan (útil si no se corrió alembic todavía)
    Base.metadata.create_all(bind=engine)

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
