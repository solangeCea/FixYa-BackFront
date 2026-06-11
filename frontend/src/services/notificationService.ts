import API_URL from "./api";
import { getToken } from "./token";

function getAuthHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface Notificacion {
  id_notificacion: number;
  usuario_rut: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  fecha_creacion: string;
}

export async function getNotifications(): Promise<Notificacion[]> {
  const token = getToken();

  if (!token) return [];

  const response = await fetch(`${API_URL}/notificaciones/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Error al obtener notificaciones");
  }

  return response.json();
}

export async function markNotificationRead(idNotificacion: number) {
  const response = await fetch(
    `${API_URL}/notificaciones/${idNotificacion}/leer`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Error al marcar notificacion");
  }

  return response.json();
}

export async function markAllNotificationsRead() {
  const response = await fetch(`${API_URL}/notificaciones/leer-todas`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Error al marcar notificaciones");
  }

  return response.json();
}
