import API_URL from "./api";
import { getToken } from "./token";

export type EstadoVerificacionTecnico =
  | "DOCUMENTOS_PENDIENTES"
  | "EN_REVISION"
  | "OBSERVADO"
  | "APROBADO"
  | "RECHAZADO";

export type TipoEvidenciaTecnica =
  | "CERTIFICADO"
  | "TITULO"
  | "CURSO"
  | "LICENCIA"
  | "FOTO_TRABAJO"
  | "REFERENCIA_LABORAL"
  | "PORTAFOLIO"
  | "EXPERIENCIA_OFICIO"
  | "OTRO";

export interface Tecnico {
  usuario_rut: string;
  descripcion_perfil: string;
  experiencia_anios: number;
  nivel_tecnico: string;
  tecnico_verificado: boolean;
  estado_verificacion: EstadoVerificacionTecnico;
  observacion_verificacion?: string | null;
  fecha_verificacion?: string | null;
  verificado_por_rut?: string | null;
}

export interface DocumentoTecnico {
  id_documento: number;
  tecnico_usuario_rut: string;
  tipo_documento: TipoEvidenciaTecnica | string;
  nombre_archivo: string;
  archivo_url: string;
  fecha_subida: string;
  documento_aprobado: boolean;
  estado_revision: "PENDIENTE_REVISION" | "APROBADO" | "RECHAZADO";
  observacion_revision?: string | null;
  fecha_aprobacion?: string | null;
  fecha_revision?: string | null;
  usuario_rut?: string | null;
  revisado_por_rut?: string | null;
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

export interface TecnicoDashboardMetrics {
  tecnico_usuario_rut: string;
  solicitudes_asignadas: number;
  solicitudes_en_proceso: number;
  solicitudes_finalizadas: number;
  ingresos_totales: number;
  promedio_calificacion: number;
  total_resenas: number;
}

async function getApiErrorMessage(response: Response, fallback: string) {
  const errorData = await response.json().catch(() => null);
  return errorData?.detail || fallback;
}

export async function getPublicTechnicianProfiles(): Promise<
  TecnicoPublicProfile[]
> {
  const response = await fetch(`${API_URL}/tecnicos/publicos/perfiles`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("No pudimos cargar los perfiles técnicos disponibles.");
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
    throw new Error(
      await getApiErrorMessage(
        response,
        "No pudimos cargar los técnicos registrados."
      )
    );
  }

  return response.json();
}

export async function getTechnicianProfile(rut: string): Promise<Tecnico> {
  const token = getToken();

  const response = await fetch(`${API_URL}/tecnicos/${rut}/perfil`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "No pudimos cargar tu perfil técnico.")
    );
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
    throw new Error("No pudimos cargar el ranking de técnicos.");
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
    throw new Error("No pudimos buscar técnicos con esos filtros.");
  }

  return response.json();
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
    throw new Error(
      await getApiErrorMessage(response, "No pudimos cargar tu panel técnico.")
    );
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

  const response = await fetch(`${API_URL}/tecnicos/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        "No pudimos crear tu perfil técnico. Revisa los datos e intenta nuevamente."
      )
    );
  }

  return response.json();
}

export async function approveTechnician(rut: string, observacion?: string) {
  const token = getToken();

  const response = await fetch(`${API_URL}/admin/tecnicos/${rut}/verificar`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      observacion: observacion?.trim() || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        "Para aprobar este técnico, primero debes revisar al menos una evidencia."
      )
    );
  }

  return response.json();
}

export async function rejectTechnician(rut: string, observacion: string) {
  const token = getToken();

  const response = await fetch(`${API_URL}/admin/tecnicos/${rut}/rechazar`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ observacion }),
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        "Escribe una observación para que el técnico sepa qué corregir."
      )
    );
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
    throw new Error(
      await getApiErrorMessage(
        response,
        "No pudimos cargar las evidencias del perfil."
      )
    );
  }

  return response.json();
}

export async function approveTechnicianDocument(
  idDocumento: number,
  observacion?: string
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
        observacion: observacion?.trim() || undefined,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        "No pudimos aprobar esta evidencia. Intenta nuevamente."
      )
    );
  }

  return response.json();
}

export async function rejectTechnicianDocument(
  idDocumento: number,
  observacion: string
): Promise<DocumentoTecnico> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/documentos-tecnicos/${idDocumento}/rechazar`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ observacion }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        "Escribe una observación para que el técnico sepa qué corregir."
      )
    );
  }

  return response.json();
}

export async function uploadTechnicianDocument(data: {
  tecnico_usuario_rut: string;
  tipo_documento: TipoEvidenciaTecnica | string;
  archivo: File;
}): Promise<DocumentoTecnico> {
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
    throw new Error(
      await getApiErrorMessage(
        response,
        "No pudimos subir tu evidencia. Revisa el archivo e intenta nuevamente."
      )
    );
  }

  return response.json();
}
