"""
Configuración del entorno de migraciones de Alembic.

Personalizado para usar:
- La DATABASE_URL desde nuestro settings (no la hardcodeada en alembic.ini)
- La metadata de nuestra Base de SQLAlchemy (para autogenerar migraciones)

Esto permite que Alembic conozca nuestros modelos automáticamente y detecte
cambios al ejecutar `alembic revision --autogenerate`.
"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# --- Importamos nuestro proyecto ---
# Importante: importamos primero settings, después Base, y por último todos
# los modelos. Si no importamos los modelos, Alembic no los "ve" y no genera
# migraciones para ellos.
from app.config import settings
from app.database import Base
from app import models  # noqa: F401 — registra todos los modelos en Base.metadata

# Configuración de Alembic estándar
config = context.config

# Sobrescribimos la URL del .ini con la de nuestro .env
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Setup de logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata target: Alembic compara esto contra el estado real de la BD
# para detectar diferencias. Es lo que hace posible el --autogenerate.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Modo offline: genera SQL sin conectarse a la BD.
    Útil para revisar el SQL que se va a ejecutar antes de aplicarlo.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Para SQLite: usar "batch mode" porque SQLite no soporta ALTER TABLE
        # completo y muchas migraciones requieren recrear la tabla.
        render_as_batch=url.startswith("sqlite"),
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Modo online: se conecta a la BD y aplica las migraciones."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # Para SQLite, ver comentario arriba
            render_as_batch=settings.DATABASE_URL.startswith("sqlite"),
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
