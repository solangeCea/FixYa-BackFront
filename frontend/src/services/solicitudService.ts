import API_URL from "./api";
import { getToken } from "./token";

export interface SolicitudCreate {
  usuario_rut: string;
  servicio_id_servicio: number;
  comuna_id_comuna: number;
  titulo_solicitud: string;
  descripcion_problema: string;
  urgencia: string;
  direccion: string;
  tipo_problema: string;
  foto_problema?: string | null;
  ubicacion_problema_referencia: string;
}

export interface Solicitud {
  id_solicitud: number;
  usuario_rut: string;
  servicio_id_servicio: number;
  tecnico_usuario_rut: string | null;
  comuna_id_comuna: number;
  titulo_solicitud: string;
  descripcion_problema: string;
  urgencia: string;
  direccion: string;
  fecha_creacion: string;
  solicitud_activa: boolean;
  estado_trabajo: string;
  tipo_problema: string;
  foto_problema: string | null;
  ubicacion_problema_referencia: string;
  costo_final: string | null;
  fecha_real: string | null;
}

function getAuthHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function createSolicitud(
  data: SolicitudCreate
): Promise<Solicitud> {
  const response = await fetch(`${API_URL}/solicitudes/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Error al crear la solicitud");
  }

  return response.json();
}

export async function getSolicitudesCliente(
  rut: string
): Promise<Solicitud[]> {
  const response = await fetch(`${API_URL}/solicitudes/cliente/${rut}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Error al obtener solicitudes del cliente");
  }

  return response.json();
}

export async function getSolicitudes(): Promise<Solicitud[]> {
  const response = await fetch(`${API_URL}/solicitudes/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Error al obtener solicitudes");
  }

  return response.json();
}

export async function getSolicitudesTecnico(
  rut: string
): Promise<Solicitud[]> {
  const response = await fetch(`${API_URL}/solicitudes/tecnico/${rut}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Error al obtener solicitudes del técnico");
  }

  return response.json();
}

export async function asignarTecnico(
  idSolicitud: number,
  rutTecnico: string
) {
  const response = await fetch(
    `${API_URL}/solicitudes/${idSolicitud}/asignar-tecnico/${rutTecnico}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error asignando técnico:", response.status, errorText);
    throw new Error("Error al asignar técnico");
  }

  return response.json();
}

export async function iniciarSolicitud(idSolicitud: number) {
  const response = await fetch(
    `${API_URL}/solicitudes/${idSolicitud}/iniciar`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Error al iniciar solicitud");
  }

  return response.json();
}

export async function finalizarSolicitud(
  idSolicitud: number,
  costoFinal: number
) {
  const response = await fetch(
    `${API_URL}/solicitudes/${idSolicitud}/finalizar`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        costo_final: costoFinal,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Error al finalizar solicitud");
  }

  return response.json();
}