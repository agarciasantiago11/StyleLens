import os

# SMTP (Hostinger)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.hostinger.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER", "")      # ej: noreply@tudominio.com
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_TIMEOUT = int(os.getenv("SMTP_TIMEOUT", "20"))
# Si SMTP_USE_SSL=true, usa conexión SSL implícita (normalmente puerto 465).
# Si no se define, se infiere por puerto (465 => SSL, resto => STARTTLS).
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "").strip().lower() in {"1", "true", "yes"}

# Email del administrador que recibe notificaciones
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")
