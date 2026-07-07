import API_URL from "./api";
import { getToken } from "./token";

export interface TimelineEvent {
  id_historial: number;
  fecha_historial: string;
  estado: string;
  motivo: string;
  solicitud_id_solicitud: number;
  usuario_rut: string;
  usuario_nombre: string | null;
  usuario_rol: string | null;
}

export async function getSolicitudTimeline(
  idSolicitud: number
): Promise<TimelineEvent[]> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/historial-solicitudes/solicitud/${idSolicitud}/timeline`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al obtener la línea de tiempo de la solicitud");
  }

  return response.json();
}
