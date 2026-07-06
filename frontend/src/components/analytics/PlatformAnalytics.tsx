import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  MapPin,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  getAdminAnalytics,
  type AdminAnaliticaData,
} from "../../services/analyticsService";
import SectionCard from "../ui/SectionCard";
import EmptyState from "../ui/EmptyState";
import LoadingState from "../ui/LoadingState";

const PALETTE = [
  "#0f766e",
  "#0891b2",
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#14b8a6",
  "#8b5cf6",
  "#f43f5e",
];

const ESTADO_COLOR: Record<string, string> = {
  INICIADO: "#0891b2",
  ASIGNADO: "#f59e0b",
  EN_PROCESO: "#14b8a6",
  FINALIZADO: "#10b981",
  CANCELADO: "#f43f5e",
};

const tooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid rgba(226, 232, 240, 0.9)",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.1)",
  fontSize: "0.8rem",
};

const axisProps = {
  tick: { fill: "#64748b", fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: "#e2e8f0" },
};

// -- Piezas reutilizables ---------------------------------------------------

interface MiniStatProps {
  label: string;
  value: number | string;
  accent?: string;
}

function MiniStat({ label, value, accent = "text-slate-900" }: MiniStatProps) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

interface InsightItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: string;
}

function InsightItem({ icon: Icon, label, value, tone }: InsightItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className={`rounded-xl p-2.5 ${tone}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-0.5 font-bold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  description?: string;
  isEmpty: boolean;
  emptyLabel?: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({
  title,
  description,
  isEmpty,
  emptyLabel = "Aún no hay datos suficientes para este gráfico.",
  children,
  className = "",
}: ChartCardProps) {
  return (
    <SectionCard title={title} description={description} className={className}>
      {isEmpty ? (
        <EmptyState
          title="Sin datos todavía"
          description={emptyLabel}
          icon={BarChart3}
        />
      ) : (
        children
      )}
    </SectionCard>
  );
}

// -- Componente principal ---------------------------------------------------

function PlatformAnalytics() {
  const [data, setData] = useState<AdminAnaliticaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function cargarAnalitica() {
    try {
      setLoading(true);
      setError("");
      const result = await getAdminAnalytics();
      setData(result);
    } catch (err) {
      console.error("Error cargando analítica:", err);
      setError("No pudimos cargar el análisis de la plataforma.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarAnalitica();
  }, []);

  const tendenciaTexto = useMemo(() => {
    if (!data) return "";
    const pct = data.insights.crecimiento_usuarios_pct;
    const signo = pct > 0 ? "+" : "";
    return `${signo}${pct}%`;
  }, [data]);

  if (loading) {
    return (
      <div className="mt-10">
        <LoadingState label="Cargando análisis de la plataforma..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mt-10">
        <SectionCard
          title="Análisis de la plataforma"
          description="Indicadores y tendencias basados en la información acumulada."
        >
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm font-semibold text-rose-600">
              {error || "No hay datos disponibles."}
            </p>
            <button
              onClick={cargarAnalitica}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
            >
              Reintentar
            </button>
          </div>
        </SectionCard>
      </div>
    );
  }

  const { indicadores, insights } = data;

  const indicadoresGenerales: MiniStatProps[] = [
    { label: "Usuarios", value: indicadores.total_usuarios, accent: "text-cyan-700" },
    { label: "Clientes", value: indicadores.total_clientes, accent: "text-teal-700" },
    { label: "Técnicos", value: indicadores.total_tecnicos, accent: "text-emerald-700" },
    { label: "Solicitudes", value: indicadores.total_solicitudes, accent: "text-slate-800" },
    { label: "Pendientes", value: indicadores.solicitudes_pendientes, accent: "text-cyan-700" },
    { label: "En proceso", value: indicadores.solicitudes_en_proceso, accent: "text-teal-700" },
    { label: "Finalizadas", value: indicadores.solicitudes_finalizadas, accent: "text-emerald-700" },
    { label: "Canceladas", value: indicadores.solicitudes_canceladas, accent: "text-rose-700" },
    { label: "Técnicos activos", value: indicadores.tecnicos_activos, accent: "text-emerald-700" },
    { label: "Téc. por aprobar", value: indicadores.tecnicos_pendientes, accent: "text-amber-700" },
    { label: "Reportes pendientes", value: indicadores.reportes_pendientes, accent: "text-rose-700" },
    { label: "Edad prom. clientes", value: `${data.edad_promedio_clientes} años`, accent: "text-slate-800" },
  ];

  const crecimientoIcon =
    insights.crecimiento_usuarios_pct < 0 ? TrendingDown : TrendingUp;
  const crecimientoTone =
    insights.crecimiento_usuarios_pct < 0
      ? "bg-rose-50 text-rose-700"
      : "bg-emerald-50 text-emerald-700";

  return (
    <div className="mt-12">
      <div className="mb-6">
        <p className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-teal-700">
          <Activity size={16} />
          Análisis de la plataforma
        </p>
        <h2 className="text-2xl font-bold text-slate-950 md:text-3xl">
          Del dato a la decisión
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Tendencias e indicadores calculados automáticamente con la información
          acumulada en FixYa. A medida que la plataforma crece, esta sección
          revela demanda por comuna, oficios más solicitados y cobertura técnica.
        </p>
      </div>

      {/* Indicadores generales */}
      <SectionCard
        title="Indicadores generales"
        description="Fotografía actual de usuarios y solicitudes."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {indicadoresGenerales.map((item) => (
            <MiniStat key={item.label} {...item} />
          ))}
        </div>
      </SectionCard>

      {/* Indicadores inteligentes */}
      <div className="mt-6">
        <SectionCard
          title="Indicadores inteligentes"
          description="Lecturas automáticas que resumen el comportamiento de la plataforma."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InsightItem
              icon={Trophy}
              label="Oficio más solicitado"
              value={insights.oficio_mas_solicitado ?? "Sin datos"}
              tone="bg-teal-50 text-teal-700"
            />
            <InsightItem
              icon={MapPin}
              label="Comuna con mayor demanda"
              value={insights.comuna_mayor_demanda ?? "Sin datos"}
              tone="bg-cyan-50 text-cyan-700"
            />
            <InsightItem
              icon={Wrench}
              label="Comuna con menor cobertura"
              value={insights.comuna_menor_cobertura ?? "Sin datos"}
              tone="bg-amber-50 text-amber-700"
            />
            <InsightItem
              icon={CheckCircle2}
              label="Solicitudes completadas"
              value={`${insights.porcentaje_completadas}%`}
              tone="bg-emerald-50 text-emerald-700"
            />
            <InsightItem
              icon={CalendarClock}
              label="Promedio de solicitudes por mes"
              value={`${insights.promedio_solicitudes_mes}`}
              tone="bg-indigo-50 text-indigo-700"
            />
            <InsightItem
              icon={crecimientoIcon}
              label="Crecimiento de usuarios (mes anterior)"
              value={`${tendenciaTexto} · ${insights.tendencia}`}
              tone={crecimientoTone}
            />
          </div>
        </SectionCard>
      </div>

      {/* Gráficos */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Solicitudes por oficio"
          description="Qué servicios concentran la demanda."
          isEmpty={data.solicitudes_por_oficio.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.solicitudes_por_oficio} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="nombre" {...axisProps} interval={0} />
              <YAxis allowDecimals={false} {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(15,118,110,0.06)" }} />
              <Bar dataKey="total" name="Solicitudes" radius={[8, 8, 0, 0]}>
                {data.solicitudes_por_oficio.map((_, index) => (
                  <Cell key={index} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Distribución de solicitudes por estado"
          description="Estado actual del flujo de trabajo."
          isEmpty={data.solicitudes_por_estado.every((e) => e.total === 0)}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.solicitudes_por_estado.filter((e) => e.total > 0)}
                dataKey="total"
                nameKey="label"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {data.solicitudes_por_estado
                  .filter((e) => e.total > 0)
                  .map((e) => (
                    <Cell key={e.estado} fill={ESTADO_COLOR[e.estado] ?? "#94a3b8"} />
                  ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Solicitudes por comuna"
          description="Distribución geográfica de la demanda (top 10)."
          isEmpty={data.solicitudes_por_comuna.length === 0}
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={data.solicitudes_por_comuna}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
              <XAxis type="number" allowDecimals={false} {...axisProps} />
              <YAxis type="category" dataKey="nombre" width={110} {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(8,145,178,0.06)" }} />
              <Bar dataKey="total" name="Solicitudes" fill="#0891b2" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Técnicos registrados por oficio"
          description="Oferta técnica disponible por especialidad."
          isEmpty={data.tecnicos_por_oficio.length === 0}
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={data.tecnicos_por_oficio}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
              <XAxis type="number" allowDecimals={false} {...axisProps} />
              <YAxis type="category" dataKey="nombre" width={110} {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(16,185,129,0.06)" }} />
              <Bar dataKey="total" name="Técnicos" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Usuarios registrados por mes"
          description="Crecimiento de la comunidad en el tiempo."
          isEmpty={data.usuarios_por_mes.length === 0}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.usuarios_por_mes} margin={{ left: -10 }}>
              <defs>
                <linearGradient id="gradClientes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTecnicos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis allowDecimals={false} {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" />
              <Area
                type="monotone"
                dataKey="clientes"
                name="Clientes"
                stroke="#0f766e"
                strokeWidth={2}
                fill="url(#gradClientes)"
              />
              <Area
                type="monotone"
                dataKey="tecnicos"
                name="Técnicos"
                stroke="#0891b2"
                strokeWidth={2}
                fill="url(#gradTecnicos)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Distribución de usuarios por rango etario"
          description="Composición demográfica de los clientes."
          isEmpty={data.distribucion_etaria.every((r) => r.total === 0)}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.distribucion_etaria} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="rango" {...axisProps} />
              <YAxis allowDecimals={false} {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
              <Bar dataKey="total" name="Clientes" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Problemas más frecuentes"
          description="Tipos de problema que más se reportan (top 8)."
          isEmpty={data.problemas_frecuentes.length === 0}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data.problemas_frecuentes}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
              <XAxis type="number" allowDecimals={false} {...axisProps} />
              <YAxis type="category" dataKey="nombre" width={110} {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(139,92,246,0.06)" }} />
              <Bar dataKey="total" name="Reportes" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Impacto de la plataforma */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-600 p-6 text-white shadow-lg md:p-8">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} />
          <h3 className="text-lg font-bold">Impacto de la plataforma</h3>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-teal-50">
          El valor que FixYa genera al transformar datos en conocimiento útil
          para decisiones de operación y expansión.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <ImpactStat
            icon={MapPin}
            label="Comuna con mayor demanda"
            value={insights.comuna_mayor_demanda ?? "—"}
          />
          <ImpactStat
            icon={Wrench}
            label="Oficio con mayor demanda"
            value={insights.oficio_mas_solicitado ?? "—"}
          />
          <ImpactStat
            icon={CheckCircle2}
            label="Solicitudes finalizadas"
            value={`${insights.porcentaje_completadas}%`}
          />
          <ImpactStat
            icon={Users}
            label="Técnicos activos"
            value={`${indicadores.tecnicos_activos}`}
          />
          <ImpactStat
            icon={crecimientoIcon}
            label="Crecimiento de usuarios"
            value={tendenciaTexto}
          />
        </div>
      </div>
    </div>
  );
}

interface ImpactStatProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

function ImpactStat({ icon: Icon, label, value }: ImpactStatProps) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
      <Icon size={18} className="text-teal-100" />
      <p className="mt-2 text-lg font-bold leading-tight">{value}</p>
      <p className="mt-1 text-xs text-teal-50">{label}</p>
    </div>
  );
}

export default PlatformAnalytics;
