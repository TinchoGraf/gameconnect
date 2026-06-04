"""
Punto de entrada de la aplicación FastAPI.

Acá creamos la instancia de FastAPI y registramos los routers de cada recurso.
Las rutas reales viven en app/routers/ — esto solo las arma.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, game_profiles, games, users

app = FastAPI(
    title="GameConnect API",
    description="API para conectar jugadores de videojuegos según afinidades, servidores y estilo de juego.",
    version="0.3.0",
)

# CORS: permite que un frontend en otro dominio (ej. localhost:5173)
# pueda llamar a esta API. En producción se restringe a los dominios reales.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENVIRONMENT == "development" else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["meta"])
def root():
    """Health check básico para confirmar que la API está viva."""
    return {
        "service": "GameConnect API",
        "status": "ok",
        "version": "0.3.0",
        "docs": "/docs",
    }


# Registramos los routers (orden por convención: auth primero, luego recursos)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(game_profiles.router)
app.include_router(games.router)
