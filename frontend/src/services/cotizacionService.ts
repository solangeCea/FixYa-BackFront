import API_URL from "./api";
import { getToken } from "./token";

function getAuthHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function getErrorMessage(response: Response, fallback: string) {
  const messagesByStatus: Record<number, string> = {
    401: "Tu sesion expiro o no es valida. Inicia sesion nuevamente.",
    403: "No tienes permisos para realizar esta accion.",
    404: "No encontramos la cotizacion o solicitud solicitada.",
    409: "La cotizacion o solicitud cambio de estado.",
    422: "Revisa los datos ingresados antes de continuar.",
    500: "Ocurrio un error interno. Intenta nuevamente en unos minutos.",
  };

  try {
    const errorData = await response.json();
    if (typeof errorData?.detail === "string") return errorData.detail;
  } catch {
    // Keep the fallback when the API does not return JSON.
  }

  return messagesByStatus[response.status] || fallback;
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
    throw new Error(
      await getErrorMessage(response, "Error al crear cotizacion")
    );
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
    throw new Error(
      await getErrorMessage(response, "Error al obtener cotizaciones")
    );
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
    throw new Error(
      await getErrorMessage(response, "Error al aceptar cotizacion")
    );
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
    throw new Error(
      await getErrorMessage(response, "Error al rechazar cotizacion")
    );
  }

  return response.json();
}
