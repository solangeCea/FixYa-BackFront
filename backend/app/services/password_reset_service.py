import hashlib
import os
import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.usuario import Usuario
from app.models.password_reset import PasswordResetToken
from app.security import hash_password
from app.services.email_service import enviar_email

TOKEN_TTL_MINUTOS = 60


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def solicitar_reset(db: Session, correo: str) -> None:
    """Genera un token de recuperación y envía el enlace por correo.

    Por seguridad no revela si el correo existe: si no hay usuario, no hace nada.
    """
    usuario = db.query(Usuario).filter(
        func.lower(Usuario.correo) == correo.strip().lower()
    ).first()

    if not usuario or not usuario.estado_usuario:
        return

    # Invalida cualquier token previo sin usar del mismo usuario.
    db.query(PasswordResetToken).filter(
        PasswordResetToken.usuario_rut == usuario.rut,
        PasswordResetToken.usado == False,  # noqa: E712
    ).update({"usado": True}, synchronize_session=False)

    token = secrets.token_urlsafe(32)
    registro = PasswordResetToken(
        usuario_rut=usuario.rut,
        token_hash=_hash_token(token),
        expira_en=datetime.utcnow() + timedelta(minutes=TOKEN_TTL_MINUTOS),
        usado=False,
    )
    db.add(registro)
    db.commit()

    frontend = os.getenv("FRONTEND_URL", "http://localhost:5173")
    enlace = f"{frontend}/restablecer?token={token}"

    asunto = "Recuperación de contraseña · FixYa"
    texto = (
        f"Hola {usuario.nombre_completo},\n\n"
        "Recibimos una solicitud para restablecer tu contraseña en FixYa.\n"
        f"Abre este enlace para crear una nueva contraseña (válido por {TOKEN_TTL_MINUTOS} minutos):\n\n"
        f"{enlace}\n\n"
        "Si no solicitaste este cambio, ignora este correo.\n"
    )
    html = (
        f"<p>Hola {usuario.nombre_completo},</p>"
        "<p>Recibimos una solicitud para restablecer tu contraseña en FixYa.</p>"
        f"<p><a href=\"{enlace}\">Crear una nueva contraseña</a> "
        f"(válido por {TOKEN_TTL_MINUTOS} minutos).</p>"
        "<p>Si no solicitaste este cambio, ignora este correo.</p>"
    )

    enviar_email(usuario.correo, asunto, texto, html)


def restablecer(db: Session, token: str, contrasena_nueva: str) -> None:
    registro = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == _hash_token(token)
    ).first()

    if not registro or registro.usado or registro.expira_en < datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="El enlace de recuperación es inválido o expiró. Solicita uno nuevo.",
        )

    usuario = db.query(Usuario).filter(
        Usuario.rut == registro.usuario_rut
    ).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario.contrasena = hash_password(contrasena_nueva)
    registro.usado = True
    db.commit()
