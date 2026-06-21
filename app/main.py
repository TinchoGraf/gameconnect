"""
Punto de entrada de la aplicación FastAPI.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, bug_reports, friends, game_profiles, games, reviews, searches, users

app = FastAPI(
    title="GameConnect API",
    description="API para conectar jugadores de videojuegos según afinidades, servidores y estilo de juego.",
    version="0.5.0",
)

# CORS: en desarrollo permitimos cualquier origen para no entorpecer el flujo.
# En producción leemos la lista desde settings.cors_origins_list (parseada
# desde CORS_ORIGINS, una variable de entorno con URLs separadas por coma).
# Esto nos deja agregar el dominio de Vercel sin tocar código.
if settings.ENVIRONMENT == "development":
    allowed_origins = ["*"]
else:
    allowed_origins = settings.cors_origins_list

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
    }


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(game_profiles.router)
app.include_router(searches.router)
app.include_router(reviews.router)
app.include_router(games.router)
app.include_router(friends.router)
app.include_router(bug_reports.router)