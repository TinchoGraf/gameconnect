"""
Endpoint para reportar bugs desde la app.

Público (logueado o no): si hay un usuario logueado, queda registrado
en el reporte. Siempre se guarda en la BD primero; el mail de aviso se
manda en un BackgroundTask para no bloquear la respuesta ni perder el
reporte si el envío de mail falla.
"""

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_optional
from app.core.email import send_bug_report_email
from app.database import get_db
from app.models.bug_report import BugReport
from app.models.user import User
from app.schemas.bug_report import BugReportCreate, BugReportOut

router = APIRouter(prefix="/bug-reports", tags=["bug-reports"])


@router.post(
    "",
    response_model=BugReportOut,
    status_code=status.HTTP_201_CREATED,
    summary="Reportar un bug",
)
def create_bug_report(
    data: BugReportCreate,
    background_tasks: BackgroundTasks,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    report = BugReport(
        location=data.location,
        what_before=data.what_before,
        what_after=data.what_after,
        description=data.description,
        reporter_username=current_user.username if current_user else None,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    background_tasks.add_task(send_bug_report_email, report)

    return report
