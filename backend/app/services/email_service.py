import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")


def send_otp_email(to_email: str, otp: str) -> None:
    if not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError("SMTP no configurado: define SMTP_USER y SMTP_PASSWORD en .env")

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

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, to_email, msg.as_string())
