"""
Punto de entrada de la aplicación FastAPI.

Acá creamos la instancia de FastAPI y registramos los routers de cada recurso.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, game_profiles, games, searches, users

app = FastAPI(
    title="GameConnect API",
    description="API para conectar jugadores de videojuegos según afinidades, servidores y estilo de juego.",
    version="0.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENVIRONMENT == "development" else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["meta"])
def root():
    return {
        "service": "GameConnect API",
        "status": "ok",
        "version": "0.4.0",
        "docs": "/docs",
    }


# Registramos los routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(game_profiles.router)
app.include_router(searches.router)
app.include_router(games.router)
