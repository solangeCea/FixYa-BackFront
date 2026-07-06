import API_URL from "./api";
import { getToken } from "./token";

export type DiaSemana =
  | "LUNES"
  | "MARTES"
  | "MIERCOLES"
  | "JUEVES"
  | "VIERNES"
  | "SABADO"
  | "DOMINGO";

export interface SolicitudDisponibilidad {
  dia: DiaSemana;
  hora_inicio: string;
  hora_fin: string;
}

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
  tipo_inmueble?: string | null;
  detalle_inmueble?: string | null;
  piso?: string | null;
  numero_departamento?: string | null;
  tiene_conserjeria?: boolean | null;
  requiere_autorizacion?: boolean | null;
  horario_disponible?: string | null;
  condiciones_acceso?: string | null;
  instrucciones_acceso?: string | null;
  persona_contacto?: string | null;
  telefono_contacto?: string | null;
  estacionamiento_disponible?: boolean | null;
  tiene_mascotas?: boolean | null;
  disponibilidad_horaria?: SolicitudDisponibilidad[];
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
  tipo_inmueble?: string | null;
  detalle_inmueble?: string | null;
  piso?: string | null;
  numero_departamento?: string | null;
  tiene_conserjeria?: boolean | null;
  requiere_autorizacion?: boolean | null;
  horario_disponible?: string | null;
  condiciones_acceso?: string | null;
  instrucciones_acceso?: string | null;
  persona_contacto?: string | null;
  telefono_contacto?: string | null;
  estacionamiento_disponible?: boolean | null;
  tiene_mascotas?: boolean | null;
  disponibilidad_horaria?: SolicitudDisponibilidad[];
}

export interface SolicitudReporteCreate {
  motivo: string;
  comentario?: string | null;
  descripcion_otro?: string | null;
}

export interface SolicitudReporte {
  id_reporte: number;
  solicitud_id_solicitud: number;
  tecnico_usuario_rut: string;
  motivo: string;
  comentario?: string | null;
  estado_reporte: string;
  fecha_reporte: string;
  fecha_revision?: string | null;
  admin_rut_resuelve?: string | null;
  observacion_admin?: string | null;
  solicitud_titulo?: string | null;
  solicitud_estado?: string | null;
  solicitud_activa?: boolean | null;
  cliente_usuario_rut?: string | null;
}

export interface ResolverSolicitudReporte {
  estado_reporte: string;
  observacion_admin?: string | null;
  solicitud_activa?: boolean | null;
}

function getAuthHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function uploadSolicitudFoto(
  file: File
): Promise<{ archivo_url: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append("archivo", file);

  const response = await fetch(`${API_URL}/solicitudes/foto`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Error al subir la imagen");
  }

  return response.json();
}

async function getErrorMessage(response: Response, fallback: string) {
  const messagesByStatus: Record<number, string> = {
    401: "Tu sesion expiro o no es valida. Inicia sesion nuevamente.",
    403: "No tienes permisos para realizar esta accion.",
    404: "No encontramos la solicitud o el recurso solicitado.",
    409: "La solicitud cambio de estado o la accion ya fue realizada.",
    422: "Revisa los datos ingresados antes de continuar.",
    500: "Ocurrio un error interno. Intenta nuevamente en unos minutos.",
  };

  try {
    const data = await response.json();
    const detail = data?.detail;

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => item?.msg)
        .filter((message): message is string => Boolean(message));

      if (messages.length > 0) return messages.join(" ");
    }
  } catch {
    // Keep the local fallback when the API does not return JSON.
  }

  return messagesByStatus[response.status] || fallback;
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
    throw new Error(
      await getErrorMessage(response, "Error al crear la solicitud")
    );
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
    throw new Error(
      await getErrorMessage(response, "Error al obtener solicitudes del cliente")
    );
  }

  return response.json();
}

export async function getSolicitudes(): Promise<Solicitud[]> {
  const response = await fetch(`${API_URL}/solicitudes/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Error al obtener solicitudes")
    );
  }

  return response.json();
}

export async function getSolicitudesDisponiblesTecnico(): Promise<Solicitud[]> {
  const response = await fetch(`${API_URL}/solicitudes/tecnico/disponibles`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Error al obtener solicitudes disponibles")
    );
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
    throw new Error(
      await getErrorMessage(response, "Error al obtener solicitudes del tecnico")
    );
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
    throw new Error(
      await getErrorMessage(response, "Error al asignar tecnico")
    );
  }

  return response.json();
}

export async function descartarSolicitud(idSolicitud: number) {
  const response = await fetch(
    `${API_URL}/solicitudes/${idSolicitud}/descartar`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Error al descartar la solicitud")
    );
  }

  return response.json();
}

export async function reportarSolicitud(
  idSolicitud: number,
  data: SolicitudReporteCreate
): Promise<SolicitudReporte> {
  const response = await fetch(
    `${API_URL}/solicitudes/${idSolicitud}/reportar`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Error al reportar la solicitud")
    );
  }

  return response.json();
}

export async function getReportesSolicitudes(): Promise<SolicitudReporte[]> {
  const response = await fetch(`${API_URL}/solicitudes/reportes`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Error al obtener reportes")
    );
  }

  return response.json();
}

export async function resolverReporteSolicitud(
  idReporte: number,
  data: ResolverSolicitudReporte
): Promise<SolicitudReporte> {
  const response = await fetch(
    `${API_URL}/solicitudes/reportes/${idReporte}/resolver`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Error al resolver el reporte")
    );
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
    throw new Error(
      await getErrorMessage(response, "Error al iniciar solicitud")
    );
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
    throw new Error(
      await getErrorMessage(response, "Error al finalizar solicitud")
    );
  }

  return response.json();
}
