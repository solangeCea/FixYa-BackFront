import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Briefcase, CheckCircle, Clock, XCircle } from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import SectionCard from "../../../components/ui/SectionCard";
import StatCard from "../../../components/ui/StatCard";
import {
  getSolicitudesTecnico,
  type Solicitud,
} from "../../../services/solicitudService";
import { formatCLP, formatDate } from "../../../utils/format";
import { getSolicitudStatusLabel } from "../../../utils/requestStatus";

const EN_CURSO = new Set(["ASIGNADO", "EN_PROCESO", "INICIADO"]);

function estadoBadgeClass(estado: string) {
  if (estado === "FINALIZADO") return "bg-emerald-100 text-emerald-700";
  if (estado === "CANCELADO") return "bg-rose-100 text-rose-700";
  if (estado === "EN_PROCESO") return "bg-teal-100 text-teal-700";
  if (estado === "ASIGNADO") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

interface TrabajosTabProps {
  rut: string;
}

function TrabajosTab({ rut }: TrabajosTabProps) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getSolicitudesTecnico(rut)
      .then((data) => {
        if (!active) return;
        setSolicitudes(data);
      })
      .catch(() => {
        if (!active) return;
        setError("No pudimos cargar tus trabajos. Intenta nuevamente.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [rut]);

  const { completados, enCurso, cancelados, historial } = useMemo(() => {
    const ordenadas = [...solicitudes].sort(
      (a, b) =>
        new Date(b.fecha_creacion).getTime() -
        new Date(a.fecha_creacion).getTime()
    );

    return {
      completados: solicitudes.filter((s) => s.estado_trabajo === "FINALIZADO")
        .length,
      enCurso: solicitudes.filter((s) => EN_CURSO.has(s.estado_trabajo)).length,
      cancelados: solicitudes.filter((s) => s.estado_trabajo === "CANCELADO")
        .length,
      historial: ordenadas,
    };
  }, [solicitudes]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-50 p-8 text-center font-medium text-slate-600">
        Cargando trabajos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
        <AlertCircle className="h-5 w-5 shrink-0" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Completados"
          value={completados}
          icon={CheckCircle}
          tone="green"
        />
        <StatCard
          label="En curso"
          value={enCurso}
          icon={Clock}
          tone="yellow"
        />
        <StatCard
          label="Cancelados"
          value={cancelados}
          icon={XCircle}
          tone="red"
        />
      </div>

      <SectionCard
        title="Historial de trabajos"
        description="Todas las solicitudes asociadas a tu cuenta."
      >
        {historial.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Aún no tienes trabajos"
            description="Cuando tomes solicitudes o se te asignen trabajos, aparecerán en tu historial."
          />
        ) : (
          <div className="space-y-3">
            {historial.map((solicitud) => (
              <article
                key={solicitud.id_solicitud}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {solicitud.titulo_solicitud}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Creada el {formatDate(solicitud.fecha_creacion)}
                      {solicitud.fecha_real && (
                        <> · Finalizada el {formatDate(solicitud.fecha_real)}</>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {solicitud.estado_trabajo === "FINALIZADO" &&
                      solicitud.costo_final && (
                        <span className="text-sm font-bold text-slate-900">
                          {formatCLP(solicitud.costo_final)}
                        </span>
                      )}
                    <span
                      className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${estadoBadgeClass(
                        solicitud.estado_trabajo
                      )}`}
                    >
                      {getSolicitudStatusLabel(solicitud.estado_trabajo)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default TrabajosTab;
