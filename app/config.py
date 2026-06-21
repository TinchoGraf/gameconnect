"""
Configuración central de la aplicación.

Lee las variables de entorno desde .env (en local) o desde variables de
entorno del sistema (en producción, ej. Render). Usa Pydantic Settings
para validación y autocompletado.

Seguridad: si ENVIRONMENT == "production", exigimos que SECRET_KEY sea
seteada explícitamente. Esto previene que un deploy quede vulnerable
por olvidar setear el secret.
"""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Base de datos
    # En local: SQLite por defecto
    # En producción: Render inyecta una DATABASE_URL apuntando a PostgreSQL
    DATABASE_URL: str = "sqlite:///./gameconnect.db"

    # Seguridad (JWT)
    # En producción, esto DEBE ser seteado como variable de entorno
    SECRET_KEY: str = "cambiame-en-desarrollo-solamente"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Entorno: "development" | "production"
    ENVIRONMENT: str = "development"

    # CORS: orígenes permitidos para hacer requests al backend.
    # En local solo necesitamos localhost:5173 (Vite).
    # En producción agregamos el dominio de Vercel.
    # Formato: "url1,url2,url3" (separadas por coma, sin espacios)
    CORS_ORIGINS: str = "http://localhost:5173"

    # Email (reporte de bugs): se manda por Gmail SMTP.
    # SMTP_USER es la cuenta de Gmail que envía, SMTP_PASSWORD es una
    # "Contraseña de aplicación" (no la contraseña normal de la cuenta) —
    # se genera en https://myaccount.google.com/apppasswords (requiere 2FA).
    # Si SMTP_PASSWORD queda vacío (default en desarrollo), no se intenta
    # mandar el mail: el reporte se guarda igual y se loguea en consola.
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    BUG_REPORT_TO_EMAIL: str = "tinchografdev@gmail.com"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_required_in_production(cls, v, info):
        """
        Si el entorno es producción, no permitimos que la SECRET_KEY
        sea el valor por defecto. Esto evita deployments inseguros.
        """
        environment = info.data.get("ENVIRONMENT", "development")
        if environment == "production" and v == "cambiame-en-desarrollo-solamente":
            raise ValueError(
                "SECRET_KEY no puede tener el valor por defecto en producción. "
                "Generá uno único y seteálo como variable de entorno."
            )
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        """Convierte CORS_ORIGINS de string CSV a lista."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


# Instancia única que vamos a importar en toda la app
settings = Settings()