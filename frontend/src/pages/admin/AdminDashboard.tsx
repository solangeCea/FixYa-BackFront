import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ClipboardList,
  Star,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getAdminDashboard } from "../../services/dashboardService";
import type { AdminDashboardData } from "../../services/dashboardService";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import SectionCard from "../../components/ui/SectionCard";
import LoadingState from "../../components/ui/LoadingState";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function cargarDashboard() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminDashboard();
      setDashboard(data);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
      setError("No pudimos cargar el resumen administrativo. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDashboard();
  }, []);

  if (loading) {
    return (
      <div className="fixya-page">
        <LoadingState label="Cargando resumen administrativo..." />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="fixya-page">
        <div className="fixya-card rounded-2xl border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">{error}</p>
          <button
            onClick={cargarDashboard}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            Reintentar carga del panel
          </button>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Revisar técnicos pendientes",
      description: "Valida perfiles antes de que puedan recibir trabajos.",
      link: "/admin/tecnicos",
      count: dashboard.tecnicos_pendientes,
      icon: UserCheck,
    },
    {
      title: "Revisar reseñas reportadas",
      description: "Evalúa reseñas marcadas por usuarios.",
      link: "/admin/resenas",
      count: dashboard.resenas_reportadas,
      icon: Star,
    },
    {
      title: "Solicitudes",
      description: "Revisa solicitudes y estados de atención.",
      link: "/admin/solicitudes",
      count: dashboard.total_solicitudes,
      icon: ClipboardList,
    },
    {
      title: "Usuarios",
      description: "Consulta clientes, técnicos y administradores.",
      link: "/admin/usuarios",
      count: dashboard.total_usuarios,
      icon: Users,
    },
  ];

  return (
    <div className="fixya-page">
      <PageHeader
        eyebrow="Administración"
        title="Centro de control FixYa"
        description="Una vista rápida de usuarios, técnicos, solicitudes, reseñas y cotizaciones para mantener la operación al día."
        actions={
          <button
            onClick={cargarDashboard}
            className="fixya-btn-primary px-4 py-3 text-sm"
          >
            <RefreshCw size={16} />
            Actualizar panel
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Usuarios"
          value={dashboard.total_usuarios}
          description={`${dashboard.total_clientes} clientes, ${dashboard.total_admins} admins`}
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Técnicos verificados"
          value={dashboard.tecnicos_verificados}
          description={`${dashboard.total_tecnicos} técnicos registrados`}
          icon={UserCheck}
          tone="green"
        />
        <StatCard
          label="Técnicos pendientes"
          value={dashboard.tecnicos_pendientes}
          description="Requieren revisión administrativa"
          icon={Clock}
          tone="yellow"
        />
        <StatCard
          label="Reportes pendientes"
          value={dashboard.resenas_reportadas}
          description="Reseñas por moderar"
          icon={AlertCircle}
          tone="red"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Estado del sistema"
          description="Distribución actual de solicitudes y contenido."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Iniciadas", dashboard.solicitudes_iniciadas, "text-cyan-700"],
              ["Asignadas", dashboard.solicitudes_asignadas, "text-amber-700"],
              ["En proceso", dashboard.solicitudes_en_proceso, "text-[#123F66]"],
              ["Finalizadas", dashboard.solicitudes_finalizadas, "text-[#2F5F46]"],
              ["Canceladas", dashboard.solicitudes_canceladas, "text-rose-700"],
              ["Cotizaciones", dashboard.total_cotizaciones, "text-[#102033]"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-lg bg-[#F8F5EF] p-5">
                <p className="text-sm font-semibold text-[#5F6B7A]">{label}</p>
                <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Acciones rápidas" description="Atajos administrativos">
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.link}
                className="flex items-center justify-between rounded-lg border border-[#E6E0D6] bg-white p-4 transition hover:border-[#C8872D]/60 hover:bg-[#FBFAF7]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#F8F5EF] p-3 text-[#123F66]">
                    <action.icon size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-[#102033]">{action.title}</p>
                    <p className="text-sm text-[#5F6B7A]">{action.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#F8F5EF] px-3 py-1 text-sm font-bold text-[#102033] ring-1 ring-[#E6E0D6]">
                    {action.count}
                  </span>
                  <ArrowRight className="h-5 w-5 text-[#C8872D]" />
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <StatCard
          label="Reseñas activas"
          value={dashboard.resenas_activas}
          description={`${dashboard.total_resenas} reseñas totales`}
          icon={Star}
          tone="green"
        />
        <StatCard
          label="Promedio general"
          value={dashboard.promedio_general_calificaciones}
          description="Calificación promedio"
          icon={Star}
          tone="yellow"
        />
        <StatCard
          label="Solicitudes activas"
          value={dashboard.solicitudes_activas}
          description="Iniciadas, asignadas o en proceso"
          icon={FileText}
          tone="purple"
        />
      </div>
    </div>
  );
}

export default AdminDashboard;
