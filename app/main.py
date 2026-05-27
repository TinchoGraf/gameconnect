"""
Punto de entrada de la aplicación FastAPI.

Acá creamos la instancia de FastAPI y registramos los routers de cada recurso.
Las rutas reales viven en app/routers/ — esto solo las arma.

En la Fase 1 solo tenemos un endpoint de health check y uno para listar juegos.
A medida que avancemos vamos a importar más routers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import games

app = FastAPI(
    title="GameConnect API",
    description="API para conectar jugadores de videojuegos según afinidades, servidores y estilo de juego.",
    version="0.1.0",
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
        "version": "0.1.0",
        "docs": "/docs",
    }


# Registramos los routers
app.include_router(games.router)
