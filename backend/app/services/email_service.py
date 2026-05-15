import smtplib
from html import escape
from typing import Iterable
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, ADMIN_EMAIL


def _smtp_connection():
    if not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError("SMTP no configurado: define SMTP_USER y SMTP_PASSWORD en .env")
    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
    server.ehlo()
    server.starttls()
    server.ehlo()
    server.login(SMTP_USER, SMTP_PASSWORD)
    return server


def send_otp_email(to_email: str, otp: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Tu código de verificación - StyleLens"
    msg["From"] = SMTP_USER
    msg["To"] = to_email

    plain = (
        f"Tu código de verificación de StyleLens es: {otp}\n\n"
        "Expira en 10 minutos. No lo compartas con nadie."
    )
    html = f"""
    <html><body>
      <h2>StyleLens — Verificación</h2>
      <p>Tu código OTP es:</p>
      <h1 style="letter-spacing:6px;">{otp}</h1>
      <p>Expira en <strong>10 minutos</strong>. No lo compartas con nadie.</p>
    </body></html>
    """
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    with _smtp_connection() as server:
        server.sendmail(SMTP_USER, to_email, msg.as_string())


def send_access_request_email(email: str, message: str) -> None:
    if not ADMIN_EMAIL:
        raise RuntimeError("ADMIN_EMAIL no configurado en .env")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Nueva solicitud - {message}"
    msg["From"] = SMTP_USER
    msg["To"] = ADMIN_EMAIL

    plain = (
                f"Nueva solicitud en StyleLens:\n\n"
        f"Email: {email}\n"
                f"Tipo: {message}"
    )
    html = f"""
    <html><body>
            <h2>StyleLens — Nueva solicitud</h2>
      <table>
        <tr><td><strong>Email:</strong></td><td>{email}</td></tr>
                <tr><td><strong>Tipo:</strong></td><td>{message}</td></tr>
      </table>
    </body></html>
    """
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    with _smtp_connection() as server:
        server.sendmail(SMTP_USER, ADMIN_EMAIL, msg.as_string())


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

    msg = MIMEMultipart("mixed")
    msg["Subject"] = f"[{safe_issue_type}]: {safe_title}"
    msg["From"] = SMTP_USER
    msg["To"] = ADMIN_EMAIL

    plain = (
        "Nuevo reporte de soporte en StyleLens\n\n"
        f"Reportado por: {reporter_email}\n"
        f"Tipo: {safe_issue_type}\n"
        f"Título: {safe_title}\n\n"
        "Descripción:\n"
        f"{safe_description}\n"
    )
    html = f"""
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
    """

    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(plain, "plain"))
    alt.attach(MIMEText(html, "html"))
    msg.attach(alt)

    for filename, file_bytes, content_type in attachments or []:
        cleaned_name = (filename or "adjunto").replace("\n", "_").replace("\r", "_")
        part = MIMEApplication(file_bytes, Name=cleaned_name)
        part["Content-Disposition"] = f'attachment; filename="{cleaned_name}"'
        if content_type:
            part.replace_header("Content-Type", content_type)
        msg.attach(part)

    with _smtp_connection() as server:
        server.sendmail(SMTP_USER, ADMIN_EMAIL, msg.as_string())
