import { useMemo } from "react";
import { ClipboardList, MapPin, UserRound, Wrench } from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import SectionCard from "../../../components/ui/SectionCard";
import type { Solicitud } from "../../../services/solicitudService";
import { formatCLP, formatDate } from "../../../utils/format";
import { getSolicitudStatusLabel } from "../../../utils/requestStatus";

function estadoBadgeClass(estado: string) {
  if (estado === "FINALIZADO") return "bg-emerald-100 text-emerald-700";
  if (estado === "CANCELADO") return "bg-rose-100 text-rose-700";
  if (estado === "EN_PROCESO") return "bg-teal-100 text-teal-700";
  if (estado === "ASIGNADO") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

interface SolicitudesTabProps {
  solicitudes: Solicitud[];
  loading: boolean;
  error: string;
  servicioNombre: (id: number) => string;
  tecnicoNombre: (rut: string | null) => string;
}

function SolicitudesTab({
  solicitudes,
  loading,
  error,
  servicioNombre,
  tecnicoNombre,
}: SolicitudesTabProps) {
  const ordenadas = useMemo(
    () =>
      [...solicitudes].sort(
        (a, b) =>
          new Date(b.fecha_creacion).getTime() -
          new Date(a.fecha_creacion).getTime()
      ),
    [solicitudes]
  );

  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-50 p-8 text-center font-medium text-slate-600">
        Cargando tus solicitudes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
        {error}
      </div>
    );
  }

  return (
    <SectionCard
      title="Historial de solicitudes"
      description="Todas tus solicitudes con su estado y el técnico que las atendió."
    >
      {ordenadas.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aún no tienes solicitudes"
          description="Cuando publiques una solicitud de servicio, aparecerá aquí con su estado y avance."
        />
      ) : (
        <div className="space-y-3">
          {ordenadas.map((solicitud) => (
            <article
              key={solicitud.id_solicitud}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {solicitud.titulo_solicitud}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Wrench className="h-3.5 w-3.5" />
                      {servicioNombre(solicitud.servicio_id_servicio)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UserRound className="h-3.5 w-3.5" />
                      {tecnicoNombre(solicitud.tecnico_usuario_rut)}
                    </span>
                    {solicitud.direccion && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {solicitud.direccion}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
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
  );
}

export default SolicitudesTab;
