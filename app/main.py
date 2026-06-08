"""
Punto de entrada de la aplicación FastAPI.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, game_profiles, games, reviews, searches, users

app = FastAPI(
    title="GameConnect API",
    description="API para conectar jugadores de videojuegos según afinidades, servidores y estilo de juego.",
    version="0.5.0",
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
        "version": "0.5.0",
        "docs": "/docs",
    }


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(game_profiles.router)
app.include_router(searches.router)
app.include_router(reviews.router)
app.include_router(games.router)
