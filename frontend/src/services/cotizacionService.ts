import API_URL from "./api";
import { getToken } from "./token";

function getAuthHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface Cotizacion {
  id_cotizacion: number;
  solicitud_id_solicitud: number;
  tecnico_usuario_rut: string;
  monto_estimado: string;
  mensaje_cotizacion?: string | null;
  fecha_cotizacion?: string | null;
  fecha_vigencia: string;
  fecha_aceptacion?: string | null;
  estado_cotizacion: string;
  motivo_anulacion?: string | null;
  archivo_pdf_url?: string | null;
}

export interface CotizacionCreate {
  solicitud_id_solicitud: number;
  tecnico_usuario_rut: string;
  monto_estimado: number;
  mensaje_cotizacion: string;
  fecha_vigencia: string;
}

export async function createCotizacion(
  data: CotizacionCreate
): Promise<Cotizacion> {
  const response = await fetch(`${API_URL}/cotizaciones/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Error al crear cotizacion");
  }

  return response.json();
}

export async function getCotizacionesSolicitud(
  idSolicitud: number
): Promise<Cotizacion[]> {
  const response = await fetch(
    `${API_URL}/cotizaciones/solicitud/${idSolicitud}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Error al obtener cotizaciones");
  }

  return response.json();
}

export async function acceptCotizacion(idCotizacion: number) {
  const response = await fetch(
    `${API_URL}/cotizaciones/${idCotizacion}/aceptar`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Error al aceptar cotizacion");
  }

  return response.json();
}

export async function rejectCotizacion(idCotizacion: number) {
  const response = await fetch(
    `${API_URL}/cotizaciones/${idCotizacion}/rechazar`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Error al rechazar cotizacion");
  }

  return response.json();
}
