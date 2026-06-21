"""
Envío de mails con la API de Resend (HTTPS).

Probamos primero con Gmail SMTP, pero Render bloquea las conexiones
salientes por los puertos típicos de SMTP (confirmado en producción:
OSError "Network is unreachable" al conectar a smtp.gmail.com:587).
Resend manda por HTTPS, que nunca está bloqueado.

Usamos httpx (ya es dependencia del proyecto, vía requirements.txt) en
vez de instalar el SDK oficial de Resend, para no sumar un paquete nuevo
para un solo request HTTP.

Si RESEND_API_KEY no está configurado (típico en desarrollo local), no
intentamos la llamada — solo logueamos el contenido que se hubiera
mandado, para no exigir credenciales reales para probar el flujo.
"""

import logging

import httpx

from app.config import settings
from app.models.bug_report import BugReport

logger = logging.getLogger("gameconnect.email")

RESEND_API_URL = "https://api.resend.com/emails"


def _build_bug_report_email_body(report: BugReport) -> str:
    reporter = report.reporter_username or "Anónimo"
    return (
        f"Nuevo reporte de bug en GameConnect\n\n"
        f"Reportado por: {reporter}\n"
        f"Fecha: {report.created_at}\n\n"
        f"Dónde pasó: {report.location}\n\n"
        f"Qué hizo antes: {report.what_before}\n\n"
        f"Qué pasó después: {report.what_after}\n\n"
        f"Descripción: {report.description}\n"
    )


def send_bug_report_email(report: BugReport) -> None:
    """
    Manda el mail de aviso. Pensada para correr en un BackgroundTask:
    nunca lanza una excepción hacia arriba (un fallo de Resend no debe
    afectar la respuesta HTTP, el reporte ya quedó guardado en la BD).
    """
    body = _build_bug_report_email_body(report)

    if not settings.RESEND_API_KEY:
        logger.warning(
            "RESEND_API_KEY no configurado: se simula el envío del reporte #%s.\n%s",
            report.id, body,
        )
        return

    try:
        response = httpx.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
            json={
                "from": settings.BUG_REPORT_FROM_EMAIL,
                "to": [settings.BUG_REPORT_TO_EMAIL],
                "subject": f"🐛 Reporte de bug — {report.location}",
                "text": body,
            },
            timeout=10,
        )
        response.raise_for_status()
    except Exception:
        logger.exception("No pudimos mandar el mail del reporte de bug #%s", report.id)
