import API_URL from "./api";
import { getToken } from "./token";

function getAuthHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface AuditLogEntry {
  id_audit: number;
  admin_rut: string | null;
  admin_correo: string | null;
  accion: string;
  entidad_tipo: string;
  entidad_id: string | null;
  usuario_afectado_rut: string | null;
  motivo: string | null;
  estado_antes: string | null;
  estado_despues: string | null;
  detalle: string | null;
  ip: string | null;
  fecha: string;
}

export interface AuditFilters {
  accion?: string;
  entidad_tipo?: string;
  admin_rut?: string;
  usuario_afectado_rut?: string;
  limite?: number;
  offset?: number;
}

export async function getAuditLog(
  filters: AuditFilters = {}
): Promise<AuditLogEntry[]> {
  const params = new URLSearchParams();

  if (filters.accion) params.set("accion", filters.accion);
  if (filters.entidad_tipo) params.set("entidad_tipo", filters.entidad_tipo);
  if (filters.admin_rut) params.set("admin_rut", filters.admin_rut);
  if (filters.usuario_afectado_rut)
    params.set("usuario_afectado_rut", filters.usuario_afectado_rut);
  if (filters.limite != null) params.set("limite", String(filters.limite));
  if (filters.offset != null) params.set("offset", String(filters.offset));

  const query = params.toString();
  const url = `${API_URL}/admin/auditoria${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Error al obtener la bitácora de auditoría");
  }

  return response.json();
}
