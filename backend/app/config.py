import os

# SMTP (Hostinger)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.hostinger.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")      # ej: noreply@tudominio.com
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

# Email del administrador que recibe notificaciones
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")
