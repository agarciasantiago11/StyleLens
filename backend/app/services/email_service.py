import os
import smtplib
import socket
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape
from typing import Iterable

from app.config import ADMIN_EMAIL, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_TIMEOUT, SMTP_USE_SSL, SMTP_USER

_FROM_NAME = "Stylens"


def _must_use_ssl() -> bool:
    # Permite forzar por env y además soporta la convención típica de SMTP por puerto.
    return SMTP_USE_SSL or SMTP_PORT == 465


def _smtp_targets() -> list[str]:
    """Devuelve hostname + posibles IPv4 para sortear problemas de ruteo/IPv6."""
    targets = [SMTP_HOST]
    try:
        infos = socket.getaddrinfo(SMTP_HOST, SMTP_PORT, socket.AF_INET, socket.SOCK_STREAM)
        for info in infos:
            ip = info[4][0]
            if ip not in targets:
                targets.append(ip)
    except OSError:
        # Si no se puede resolver IPv4, mantenemos al menos el hostname original.
        pass
    return targets


def _send(
    to: str,
    subject: str,
    html: str,
    text: str,
    attachments: Iterable[tuple[str, bytes, str | None]] | None = None,
) -> None:
    if not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError("SMTP_USER y SMTP_PASSWORD deben estar configurados en las variables de entorno")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{_FROM_NAME} <{SMTP_USER}>"
    msg["To"] = to

    msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    if attachments:
        outer = MIMEMultipart("mixed")
        outer["Subject"] = msg["Subject"]
        outer["From"] = msg["From"]
        outer["To"] = msg["To"]
        outer.attach(msg)
        for filename, data, content_type in attachments:
            if data:
                part = MIMEApplication(data)
                part.add_header("Content-Disposition", "attachment", filename=filename)
                outer.attach(part)
        msg = outer

    try:
        last_error: Exception | None = None
        for target in _smtp_targets():
            try:
                if _must_use_ssl():
                    with smtplib.SMTP_SSL(target, SMTP_PORT, timeout=SMTP_TIMEOUT) as server:
                        server.ehlo()
                        server.login(SMTP_USER, SMTP_PASSWORD)
                        server.sendmail(SMTP_USER, [to], msg.as_string())
                else:
                    with smtplib.SMTP(target, SMTP_PORT, timeout=SMTP_TIMEOUT) as server:
                        server.ehlo()
                        server.starttls()
                        server.ehlo()
                        server.login(SMTP_USER, SMTP_PASSWORD)
                        server.sendmail(SMTP_USER, [to], msg.as_string())
                return
            except (socket.timeout, TimeoutError, OSError, smtplib.SMTPException) as e:
                last_error = e

        # Si llegamos aquí, fallaron todos los targets (host + IPv4s).
        if last_error:
            raise last_error
    except (socket.timeout, TimeoutError) as e:
        mode = "SSL" if _must_use_ssl() else "STARTTLS"
        raise RuntimeError(
            f"Timeout SMTP conectando a {SMTP_HOST}:{SMTP_PORT} ({mode}). "
            "Revisa host/puerto/modo TLS y reglas de red del proveedor."
        ) from e
    except OSError as e:
        raise RuntimeError(
            f"Error de red SMTP en {SMTP_HOST}:{SMTP_PORT}: {e}"
        ) from e
    except smtplib.SMTPException as e:
        raise RuntimeError(f"Error enviando email via SMTP: {e}") from e


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
        attachments=attachments,
    )
