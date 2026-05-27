"""
Configuración central de la aplicación.

Lee las variables de entorno desde .env y las expone como un objeto tipado.
Usar Pydantic Settings nos da validación automática y autocompletado en el IDE.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Base de datos
    DATABASE_URL: str = "sqlite:///./gameconnect.db"

    # Seguridad (JWT)
    SECRET_KEY: str = "cambiame"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Entorno
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


# Instancia única que vamos a importar en toda la app
settings = Settings()
