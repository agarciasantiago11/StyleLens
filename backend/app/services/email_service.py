import os
from html import escape
from typing import Iterable
import resend

from app.config import ADMIN_EMAIL

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")


def _send(to: str, subject: str, html: str, text: str) -> None:
    if not resend.api_key:
        raise RuntimeError("RESEND_API_KEY no configurado en las variables de entorno")
    resend.Emails.send({
        "from": FROM_EMAIL,
        "to": to,
        "subject": subject,
        "html": html,
        "text": text,
    })


def send_otp_email(to_email: str, otp: str) -> None:
    _send(
        to=to_email,
        subject="Tu código de verificación - StyleLens",
        text=(
            f"Tu código de verificación de StyleLens es: {otp}\n\n"
            "Expira en 10 minutos. No lo compartas con nadie."
        ),
        html=f"""
        <html><body>
          <h2>StyleLens — Verificación</h2>
          <p>Tu código OTP es:</p>
          <h1 style="letter-spacing:6px;">{otp}</h1>
          <p>Expira en <strong>10 minutos</strong>. No lo compartas con nadie.</p>
        </body></html>
        """,
    )


def send_access_request_email(email: str, message: str) -> None:
    if not ADMIN_EMAIL:
        raise RuntimeError("ADMIN_EMAIL no configurado en .env")
    _send(
        to=ADMIN_EMAIL,
        subject=f"Nueva solicitud - {message}",
        text=(
            f"Nueva solicitud en StyleLens:\n\n"
            f"Email: {email}\n"
            f"Tipo: {message}"
        ),
        html=f"""
        <html><body>
          <h2>StyleLens — Nueva solicitud</h2>
          <table>
            <tr><td><strong>Email:</strong></td><td>{escape(email)}</td></tr>
            <tr><td><strong>Tipo:</strong></td><td>{escape(message)}</td></tr>
          </table>
        </body></html>
        """,
    )


def send_support_report_email(
    issue_type: str,
    title: str,
    description: str,
    reporter_email: str,
    attachments: Iterable[tuple[str, bytes, str | None]] | None = None,
) -> None:
    if not ADMIN_EMAIL:
        raise RuntimeError("ADMIN_EMAIL no configurado en .env")

    safe_issue_type = issue_type.strip() or "Sin categoría"
    safe_title = title.strip() or "Sin título"
    safe_description = description.strip() or "(Sin descripción)"

    _send(
        to=ADMIN_EMAIL,
        subject=f"[{safe_issue_type}]: {safe_title}",
        text=(
            "Nuevo reporte de soporte en StyleLens\n\n"
            f"Reportado por: {reporter_email}\n"
            f"Tipo: {safe_issue_type}\n"
            f"Título: {safe_title}\n\n"
            f"Descripción:\n{safe_description}\n"
        ),
        html=f"""
        <html><body>
          <h2>StyleLens — Nuevo reporte de soporte</h2>
          <table>
            <tr><td><strong>Reportado por:</strong></td><td>{escape(reporter_email)}</td></tr>
            <tr><td><strong>Tipo:</strong></td><td>{escape(safe_issue_type)}</td></tr>
            <tr><td><strong>Título:</strong></td><td>{escape(safe_title)}</td></tr>
          </table>
          <p><strong>Descripción:</strong></p>
          <p>{escape(safe_description).replace(chr(10), '<br/>')}</p>
        </body></html>
        """,
    )
