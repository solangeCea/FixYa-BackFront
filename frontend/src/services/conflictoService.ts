import API_URL from "./api";
import { getToken } from "./token";

function authHeader() {
  return { Authorization: `Bearer ${getToken()}` };
}

function jsonHeaders() {
  return { "Content-Type": "application/json", ...authHeader() };
}

export const TIPOS_CONFLICTO: { value: string; label: string }[] = [
  { value: "TRABAJO_INCOMPLETO", label: "Trabajo incompleto" },
  { value: "TRABAJO_DEFICIENTE", label: "Trabajo deficiente" },
  { value: "NO_SE_PRESENTO", label: "No se presentó" },
  { value: "COBRO_INDEBIDO", label: "Cobro indebido" },
  { value: "DANOS_PROPIEDAD", label: "Daños a la propiedad" },
  { value: "COMPORTAMIENTO_INADECUADO", label: "Comportamiento inadecuado" },
  { value: "MATERIALES_NO_ACORDADOS", label: "Materiales no acordados" },
  { value: "INCUMPLIMIENTO_ACUERDO", label: "Incumplimiento del acuerdo" },
  { value: "OTRO", label: "Otro" },
];

export function tipoConflictoLabel(value: string): string {
  return TIPOS_CONFLICTO.find((t) => t.value === value)?.label ?? value;
}

export interface ConflictoEvidencia {
  id_evidencia: number;
  nombre_archivo: string;
  archivo_url: string;
  fecha_subida: string;
}

export interface Conflicto {
  id_conflicto: number;
  solicitud_id_solicitud: number;
  reportante_rut: string;
  reportante_rol: string;
  tipo: string;
  descripcion: string;
  estado: string;
  fecha_reporte: string;
  fecha_revision: string | null;
  admin_rut_resuelve: string | null;
  observacion_admin: string | null;
  evidencias: ConflictoEvidencia[];
  solicitud_titulo?: string | null;
  solicitud_estado?: string | null;
  reportante_nombre?: string | null;
}

export async function crearConflicto(
  idSolicitud: number,
  tipo: string,
  descripcion: string,
  archivos: File[]
): Promise<Conflicto> {
  const form = new FormData();
  form.append("tipo", tipo);
  form.append("descripcion", descripcion);
  archivos.forEach((archivo) => form.append("archivos", archivo));

  const response = await fetch(`${API_URL}/solicitudes/${idSolicitud}/conflictos`, {
    method: "POST",
    headers: authHeader(), // no Content-Type: el navegador arma el multipart
    body: form,
  });

  if (!response.ok) {
    let detalle = "No pudimos registrar el reporte de conflicto";
    try {
      const data = await response.json();
      if (typeof data.detail === "string") detalle = data.detail;
    } catch {
      /* respuesta sin JSON */
    }
    throw new Error(detalle);
  }

  return response.json();
}

export async function getConflictosSolicitud(
  idSolicitud: number
): Promise<Conflicto[]> {
  const response = await fetch(`${API_URL}/solicitudes/${idSolicitud}/conflictos`, {
    headers: jsonHeaders(),
  });
  if (!response.ok) throw new Error("Error al obtener los conflictos");
  return response.json();
}

export async function getConflictosAdmin(estado?: string): Promise<Conflicto[]> {
  const query = estado ? `?estado=${encodeURIComponent(estado)}` : "";
  const response = await fetch(`${API_URL}/solicitudes/conflictos${query}`, {
    headers: jsonHeaders(),
  });
  if (!response.ok) throw new Error("Error al obtener los conflictos");
  return response.json();
}

export async function resolverConflicto(
  idConflicto: number,
  estado: "CONFIRMADO" | "DESCARTADO",
  observacion_admin?: string
): Promise<Conflicto> {
  const response = await fetch(
    `${API_URL}/solicitudes/conflictos/${idConflicto}/resolver`,
    {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify({ estado, observacion_admin }),
    }
  );
  if (!response.ok) throw new Error("No pudimos resolver el conflicto");
  return response.json();
}

export interface Cancelacion {
  id_cancelacion: number;
  solicitud_id_solicitud: number;
  solicitante_rut: string;
  solicitante_rol: string;
  motivo: string;
  estado: string;
  estado_previo: string | null;
  fecha_solicitud: string;
  fecha_resolucion: string | null;
  admin_rut_resuelve: string | null;
  observacion_admin: string | null;
  solicitud_titulo?: string | null;
  solicitud_estado?: string | null;
  solicitante_nombre?: string | null;
}

export async function getCancelacionesAdmin(estado?: string): Promise<Cancelacion[]> {
  const query = estado ? `?estado=${encodeURIComponent(estado)}` : "";
  const response = await fetch(`${API_URL}/solicitudes/cancelaciones${query}`, {
    headers: jsonHeaders(),
  });
  if (!response.ok) throw new Error("Error al obtener las cancelaciones");
  return response.json();
}

export async function resolverCancelacion(
  idCancelacion: number,
  aprobar: boolean,
  observacion_admin?: string
): Promise<Cancelacion> {
  const response = await fetch(
    `${API_URL}/solicitudes/cancelaciones/${idCancelacion}/resolver`,
    {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify({ aprobar, observacion_admin }),
    }
  );
  if (!response.ok) throw new Error("No pudimos resolver la cancelación");
  return response.json();
}
