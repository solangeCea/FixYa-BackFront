"""Envío de correo por SMTP con degradación elegante.

Si hay configuración SMTP (SMTP_HOST, SMTP_USER, SMTP_PASSWORD), envía el correo.
Si no, registra el contenido en el log del backend para poder probar el flujo sin
un servidor de correo. Nunca lanza excepción hacia el llamador.
"""

import os
import smtplib
import ssl
from email.message import EmailMessage


def enviar_email(destinatario: str, asunto: str, cuerpo_texto: str, cuerpo_html: str | None = None) -> bool:
    host = os.getenv("SMTP_HOST")
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    remitente = os.getenv("SMTP_FROM") or user
    port = int(os.getenv("SMTP_PORT", "587"))

    if not host or not user or not password:
        # Sin SMTP configurado: se registra el contenido para pruebas.
        print(
            "[email] SMTP no configurado; no se envía correo real.\n"
            f"[email] Para: {destinatario}\n[email] Asunto: {asunto}\n"
            f"[email] Cuerpo:\n{cuerpo_texto}"
        )
        return False

    mensaje = EmailMessage()
    mensaje["Subject"] = asunto
    mensaje["From"] = remitente
    mensaje["To"] = destinatario
    mensaje.set_content(cuerpo_texto)
    if cuerpo_html:
        mensaje.add_alternative(cuerpo_html, subtype="html")

    try:
        contexto = ssl.create_default_context()
        with smtplib.SMTP(host, port, timeout=15) as servidor:
            servidor.starttls(context=contexto)
            servidor.login(user, password)
            servidor.send_message(mensaje)
        print(f"[email] Correo enviado a {destinatario} (asunto: {asunto})")
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[email] Error enviando correo a {destinatario}: {exc}")
        return False
