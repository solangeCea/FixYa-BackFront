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
      setError("No se pudieron cargar las metricas del dashboard.");
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
        <LoadingState label="Cargando metricas reales..." />
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
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Aprobar tecnicos",
      description: "Revisa perfiles pendientes de validacion.",
      link: "/admin/tecnicos",
      count: dashboard.tecnicos_pendientes,
      icon: UserCheck,
    },
    {
      title: "Moderar resenas",
      description: "Gestiona reportes pendientes.",
      link: "/admin/resenas",
      count: dashboard.resenas_reportadas,
      icon: Star,
    },
    {
      title: "Solicitudes",
      description: "Monitorea trabajos por estado.",
      link: "/admin/solicitudes",
      count: dashboard.total_solicitudes,
      icon: ClipboardList,
    },
    {
      title: "Usuarios",
      description: "Consulta usuarios de la plataforma.",
      link: "/admin/usuarios",
      count: dashboard.total_usuarios,
      icon: Users,
    },
  ];

  return (
    <div className="fixya-page">
      <PageHeader
        eyebrow="Panel administrativo"
        title="Resumen operativo"
        description="Metricas reales del ecosistema FixYa: usuarios, tecnicos, solicitudes, resenas y cotizaciones."
        actions={
          <button
            onClick={cargarDashboard}
            className="fixya-btn-primary px-4 py-3 text-sm"
          >
            <RefreshCw size={16} />
            Actualizar
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
          label="Tecnicos verificados"
          value={dashboard.tecnicos_verificados}
          description={`${dashboard.total_tecnicos} tecnicos registrados`}
          icon={UserCheck}
          tone="green"
        />
        <StatCard
          label="Tecnicos pendientes"
          value={dashboard.tecnicos_pendientes}
          description="Requieren revision admin"
          icon={Clock}
          tone="yellow"
        />
        <StatCard
          label="Reportes pendientes"
          value={dashboard.resenas_reportadas}
          description="Resenas por moderar"
          icon={AlertCircle}
          tone="red"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Estado del sistema"
          description="Distribucion actual de solicitudes y contenido."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Iniciadas", dashboard.solicitudes_iniciadas, "text-cyan-700"],
              ["Asignadas", dashboard.solicitudes_asignadas, "text-amber-700"],
              ["En proceso", dashboard.solicitudes_en_proceso, "text-teal-700"],
              ["Finalizadas", dashboard.solicitudes_finalizadas, "text-emerald-700"],
              ["Canceladas", dashboard.solicitudes_canceladas, "text-rose-700"],
              ["Cotizaciones", dashboard.total_cotizaciones, "text-slate-700"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Acciones rapidas" description="Atajos administrativos">
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.link}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-teal-200 hover:bg-teal-50"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-teal-100 p-3 text-teal-700">
                    <action.icon size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-950">{action.title}</p>
                    <p className="text-sm text-slate-500">{action.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-900 ring-1 ring-slate-200">
                    {action.count}
                  </span>
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <StatCard
          label="Resenas activas"
          value={dashboard.resenas_activas}
          description={`${dashboard.total_resenas} resenas totales`}
          icon={Star}
          tone="green"
        />
        <StatCard
          label="Promedio general"
          value={dashboard.promedio_general_calificaciones}
          description="Calificacion promedio"
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
