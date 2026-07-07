from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_usuario
from app.schemas.chat_schema import (
    ChatResponse,
    MensajeChatCreate,
    MensajeChatResponse,
)
from app.services import chat_service

router = APIRouter(prefix="/chats", tags=["Chat"])


@router.get("/solicitud/{id_solicitud}", response_model=ChatResponse)
def obtener_chat_de_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_usuario),
):
    return chat_service.obtener_chat_por_solicitud(db, id_solicitud, usuario.rut)


@router.get("/{id_chat}/mensajes", response_model=List[MensajeChatResponse])
def listar_mensajes_chat(
    id_chat: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_usuario),
):
    return chat_service.listar_mensajes(db, id_chat, usuario.rut)


@router.post("/{id_chat}/mensajes", response_model=MensajeChatResponse)
def enviar_mensaje_chat(
    id_chat: int,
    data: MensajeChatCreate,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_usuario),
):
    return chat_service.enviar_mensaje(db, id_chat, usuario.rut, data.contenido)
