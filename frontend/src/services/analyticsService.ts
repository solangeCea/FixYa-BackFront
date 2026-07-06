import API_URL from "./api";
import { getToken } from "./token";

export interface AnaliticaIndicadores {
  total_usuarios: number;
  total_clientes: number;
  total_tecnicos: number;
  total_solicitudes: number;
  solicitudes_pendientes: number;
  solicitudes_asignadas: number;
  solicitudes_en_proceso: number;
  solicitudes_finalizadas: number;
  solicitudes_canceladas: number;
  tecnicos_pendientes: number;
  tecnicos_activos: number;
  reportes_pendientes: number;
}

export interface ConteoNombre {
  nombre: string;
  total: number;
}

export interface ConteoEstado {
  estado: string;
  label: string;
  total: number;
}

export interface UsuariosPorMes {
  periodo: string;
  label: string;
  clientes: number;
  tecnicos: number;
  total: number;
}

export interface DistribucionEtaria {
  rango: string;
  total: number;
}

export interface AnaliticaInsights {
  oficio_mas_solicitado: string | null;
  comuna_mayor_demanda: string | null;
  comuna_menor_cobertura: string | null;
  porcentaje_completadas: number;
  promedio_solicitudes_mes: number;
  crecimiento_usuarios_pct: number;
  tendencia: string;
}

export interface AdminAnaliticaData {
  indicadores: AnaliticaIndicadores;
  solicitudes_por_oficio: ConteoNombre[];
  solicitudes_por_comuna: ConteoNombre[];
  usuarios_por_mes: UsuariosPorMes[];
  solicitudes_por_estado: ConteoEstado[];
  tecnicos_por_oficio: ConteoNombre[];
  clientes_por_comuna: ConteoNombre[];
  tecnicos_por_comuna: ConteoNombre[];
  problemas_frecuentes: ConteoNombre[];
  distribucion_etaria: DistribucionEtaria[];
  edad_promedio_clientes: number;
  insights: AnaliticaInsights;
}

export async function getAdminAnalytics(): Promise<AdminAnaliticaData> {
  const token = getToken();

  const response = await fetch(`${API_URL}/admin/analitica`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener la analítica de la plataforma");
  }

  return response.json();
}
