"""
Envío de mails por Gmail SMTP.

No usamos ningún paquete externo: smtplib y email vienen en la librería
estándar de Python. Si SMTP_PASSWORD no está configurado (típico en
desarrollo local), no intentamos conectar — solo logueamos el contenido
que se hubiera mandado, para no exigir credenciales reales para probar
el flujo.
"""

import logging
import smtplib
from email.mime.text import MIMEText

from app.config import settings
from app.models.bug_report import BugReport

logger = logging.getLogger("gameconnect.email")


def _build_bug_report_email(report: BugReport) -> MIMEText:
    reporter = report.reporter_username or "Anónimo"
    body = (
        f"Nuevo reporte de bug en GameConnect\n\n"
        f"Reportado por: {reporter}\n"
        f"Fecha: {report.created_at}\n\n"
        f"Dónde pasó: {report.location}\n\n"
        f"Qué hizo antes: {report.what_before}\n\n"
        f"Qué pasó después: {report.what_after}\n\n"
        f"Descripción: {report.description}\n"
    )
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = f"🐛 Reporte de bug — {report.location}"
    msg["From"] = settings.SMTP_USER or settings.BUG_REPORT_TO_EMAIL
    msg["To"] = settings.BUG_REPORT_TO_EMAIL
    return msg


def send_bug_report_email(report: BugReport) -> None:
    """
    Manda el mail de aviso. Pensada para correr en un BackgroundTask:
    nunca lanza una excepción hacia arriba (un fallo de SMTP no debe
    afectar la respuesta HTTP, el reporte ya quedó guardado en la BD).
    """
    msg = _build_bug_report_email(report)

    if not settings.SMTP_PASSWORD:
        logger.warning(
            "SMTP_PASSWORD no configurado: se simula el envío del reporte #%s.\n%s",
            report.id, msg.get_payload(),
        )
        return

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
    except Exception:
        logger.exception("No pudimos mandar el mail del reporte de bug #%s", report.id)
