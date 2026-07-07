import API_URL from "./api";
import { getToken } from "./token";

export interface Tecnico {
  usuario_rut: string;
  descripcion_perfil: string;
  experiencia_anios: number;
  nivel_tecnico: string;
  tecnico_verificado: boolean;
  estado_verificacion?: string;
  fecha_solicitud?: string | null;
  fecha_revision?: string | null;
  observacion_admin?: string | null;
  admin_revisor_rut?: string | null;
}

export interface DocumentoTecnico {
  id_documento: number;
  tecnico_usuario_rut: string;
  tipo_documento: string;
  nombre_archivo: string;
  archivo_url: string;
  fecha_subida: string;
  documento_aprobado: boolean;
  fecha_aprobacion: string | null;
  usuario_rut: string | null;
}

export interface TecnicoPublicProfile extends Tecnico {
  nombre_completo: string;
  correo: string | null;
  telefono: string | null;
  promedio_calificacion: number;
  total_resenas: number;
  servicios: string[];
  comunas: string[];
}

export async function getPublicTechnicianProfiles(): Promise<
  TecnicoPublicProfile[]
> {
  const response = await fetch(`${API_URL}/tecnicos/publicos/perfiles`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Error al obtener perfiles de tecnicos");
  }

  return response.json();
}

export async function getTechnicians(): Promise<Tecnico[]> {
  const token = getToken();

  const response = await fetch(`${API_URL}/tecnicos/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener técnicos");
  }

  return response.json();
}

export async function getTechnicianProfile(rut: string) {
  const token = getToken();

  const response = await fetch(`${API_URL}/tecnicos/${rut}/perfil`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener perfil");
  }

  return response.json();
}

export async function getTopTechnicians() {
  const token = getToken();

  const response = await fetch(`${API_URL}/tecnicos/top-rating`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener ranking");
  }

  return response.json();
}

export async function searchTechnicians(
  servicioId: number,
  comunaId: number
) {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/tecnicos/buscar?servicio_id=${servicioId}&comuna_id=${comunaId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al buscar técnicos");
  }

  return response.json();
}

export interface TecnicoDashboardMetrics {
  tecnico_usuario_rut: string;
  solicitudes_asignadas: number;
  solicitudes_en_proceso: number;
  solicitudes_finalizadas: number;
  ingresos_totales: number;
  promedio_calificacion: number;
  total_resenas: number;
}

export async function getTechnicianDashboard(
  rut: string
): Promise<TecnicoDashboardMetrics> {
  const token = getToken();

  const response = await fetch(`${API_URL}/tecnicos/${rut}/dashboard`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener dashboard tecnico");
  }

  return response.json();
}

export async function createTechnicianProfile(data: {
  usuario_rut: string;
  descripcion_perfil: string;
  experiencia_anios: number;
  nivel_tecnico: string;
  servicios: number[];
  comunas: number[];
}): Promise<Tecnico> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/tecnicos/`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Error al crear perfil tecnico");
  }

  return response.json();
}

export async function approveTechnician(rut: string) {
  const token = getToken();

  const response = await fetch(`${API_URL}/admin/tecnicos/${rut}/verificar`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al aprobar tecnico");
  }

  return response.json();
}

export type EstadoRevision =
  | "EN_REVISION"
  | "OBSERVADO"
  | "APROBADO"
  | "RECHAZADO"
  | "SUSPENDIDO";

export interface RevisionTecnicoResponse {
  usuario_rut: string;
  tecnico_verificado: boolean;
  estado_verificacion: string;
  fecha_revision: string | null;
  admin_revisor_rut: string | null;
  observacion_admin: string | null;
}

export async function reviewTechnician(
  rut: string,
  estadoVerificacion: EstadoRevision,
  observacionAdmin?: string | null
): Promise<RevisionTecnicoResponse> {
  const token = getToken();

  const response = await fetch(`${API_URL}/admin/tecnicos/${rut}/revision`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      estado_verificacion: estadoVerificacion,
      observacion_admin: observacionAdmin ?? null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Error al actualizar la revisión del técnico");
  }

  return response.json();
}

export async function deleteTechnician(rut: string): Promise<void> {
  const token = getToken();

  const response = await fetch(`${API_URL}/tecnicos/${rut}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Error al eliminar el técnico");
  }
}

export async function getMyTechnicianProfile(): Promise<Tecnico> {
  const token = getToken();

  const response = await fetch(`${API_URL}/usuarios/me/perfil-tecnico`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener tu perfil tecnico");
  }

  return response.json();
}

export async function getTechnicianDocuments(
  rut: string
): Promise<DocumentoTecnico[]> {
  const token = getToken();

  const response = await fetch(`${API_URL}/documentos-tecnicos/tecnico/${rut}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener documentos tecnicos");
  }

  return response.json();
}

export async function approveTechnicianDocument(
  idDocumento: number,
  adminRut: string
): Promise<DocumentoTecnico> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/documentos-tecnicos/${idDocumento}/aprobar`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        usuario_rut: adminRut,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Error al aprobar documento tecnico");
  }

  return response.json();
}

export async function uploadTechnicianDocument(data: {
  tecnico_usuario_rut: string;
  tipo_documento: string;
  archivo: File;
}) {
  const token = getToken();
  const formData = new FormData();

  formData.append("tecnico_usuario_rut", data.tecnico_usuario_rut);
  formData.append("tipo_documento", data.tipo_documento);
  formData.append("archivo", data.archivo);

  const response = await fetch(`${API_URL}/documentos-tecnicos/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Error al subir documento");
  }

  return response.json();
}
