"""
Schemas Pydantic para reportes de bugs.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BugReportCreate(BaseModel):
    """Datos del formulario de reporte de bug."""

    location: str = Field(..., min_length=3, max_length=150, description="Dónde de la app pasó el bug.")
    what_before: str = Field(..., min_length=3, max_length=1000)
    what_after: str = Field(..., min_length=3, max_length=1000)
    description: str = Field(..., min_length=3, max_length=1000)


class BugReportOut(BaseModel):
    id: int
    location: str
    what_before: str
    what_after: str
    description: str
    reporter_username: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
