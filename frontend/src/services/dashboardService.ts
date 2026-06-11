import API_URL from "./api";
import { getToken } from "./token";

export interface AdminDashboardData {
  total_usuarios: number;
  total_tecnicos: number;
  total_clientes: number;
  total_admins: number;
  tecnicos_verificados: number;
  tecnicos_pendientes: number;
  total_solicitudes: number;
  solicitudes_iniciadas: number;
  solicitudes_asignadas: number;
  solicitudes_en_proceso: number;
  solicitudes_activas: number;
  solicitudes_finalizadas: number;
  solicitudes_canceladas: number;
  total_resenas: number;
  resenas_activas: number;
  resenas_reportadas: number;
  total_cotizaciones: number;
  promedio_general_calificaciones: number;
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const token = getToken();

  const response = await fetch(`${API_URL}/admin/dashboard`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener métricas del dashboard");
  }

  return response.json();
}
