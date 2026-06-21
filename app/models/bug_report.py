"""
Modelo de reporte de bugs.

Cualquiera puede mandar un reporte desde /report-bug, logueado o no.
Se guarda siempre en la base (aunque el mail de aviso falle) para no
perder el reporte por un problema de configuración de SMTP.
"""

from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class BugReport(Base):
    __tablename__ = "bug_reports"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Dónde de la app pasó el bug, en palabras del usuario (no una ruta fija)
    location: Mapped[str] = mapped_column(String(150), nullable=False)

    what_before: Mapped[str] = mapped_column(Text, nullable=False)
    what_after: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Username de quien reportó, si estaba logueado. Null si fue anónimo.
    reporter_username: Mapped[str | None] = mapped_column(String(30), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<BugReport id={self.id} location={self.location!r}>"
