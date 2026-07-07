import API_URL from "./api";
import { getToken } from "./token";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export interface Chat {
  id_chat: number;
  cotizacion_id_cotizacion: number;
  solicitud_id_solicitud: number;
  cliente_rut: string;
  tecnico_rut: string;
  fecha_creacion?: string | null;
  activo: boolean;
}

export interface MensajeChat {
  id_mensaje: number;
  chat_id_chat: number;
  emisor_rut: string;
  contenido: string;
  fecha_envio?: string | null;
  leido: boolean;
  es_sistema: boolean;
}

// Devuelve el chat de una solicitud, o null si aún no existe (cotización no
// aceptada). Cualquier otro error se propaga.
export async function getChatBySolicitud(
  idSolicitud: number
): Promise<Chat | null> {
  const response = await fetch(`${API_URL}/chats/solicitud/${idSolicitud}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Error al obtener el chat");

  return response.json();
}

export async function getMensajes(idChat: number): Promise<MensajeChat[]> {
  const response = await fetch(`${API_URL}/chats/${idChat}/mensajes`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) throw new Error("Error al obtener los mensajes");

  return response.json();
}

export async function enviarMensaje(
  idChat: number,
  contenido: string
): Promise<MensajeChat> {
  const response = await fetch(`${API_URL}/chats/${idChat}/mensajes`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ contenido }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || "Error al enviar el mensaje");
  }

  return response.json();
}
