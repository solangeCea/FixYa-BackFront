import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Star, UserRound, Wrench } from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import SectionCard from "../../../components/ui/SectionCard";
import { getClientReviews, type Review } from "../../../services/reviewService";
import type { Solicitud } from "../../../services/solicitudService";
import { formatDate } from "../../../utils/format";

function Estrellas({ valor }: { valor: number }) {
  const llenas = Math.round(valor);

  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${
            n <= llenas
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200"
          }`}
        />
      ))}
    </span>
  );
}

interface CalificacionesTabProps {
  rut: string;
  solicitudes: Solicitud[];
  servicioNombre: (id: number) => string;
  tecnicoNombre: (rut: string | null) => string;
}

function CalificacionesTab({
  rut,
  solicitudes,
  servicioNombre,
  tecnicoNombre,
}: CalificacionesTabProps) {
  const [resenas, setResenas] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Índice de solicitud por id para enriquecer cada reseña con técnico/servicio.
  const solicitudPorId = useMemo(() => {
    const mapa = new Map<number, Solicitud>();
    solicitudes.forEach((s) => mapa.set(s.id_solicitud, s));
    return mapa;
  }, [solicitudes]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getClientReviews(rut)
      .then((data) => {
        if (active) setResenas(data);
      })
      .catch(() => {
        if (active) setError("No pudimos cargar tus calificaciones.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [rut]);

  const ordenadas = useMemo(
    () =>
      [...resenas].sort(
        (a, b) =>
          new Date(b.fecha_resena ?? 0).getTime() -
          new Date(a.fecha_resena ?? 0).getTime()
      ),
    [resenas]
  );

  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-50 p-8 text-center font-medium text-slate-600">
        Cargando tus calificaciones...
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
      title="Calificaciones que emitiste"
      description="Las reseñas que dejaste tras cada servicio finalizado."
    >
      {ordenadas.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Aún no has calificado ningún servicio"
          description="Cuando un trabajo finalice, podrás calificar al técnico desde tu panel."
        />
      ) : (
        <ul className="space-y-3">
          {ordenadas.map((resena) => {
            const solicitud = solicitudPorId.get(resena.solicitud_id_solicitud);

            return (
              <li
                key={resena.id_resena}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <Estrellas valor={resena.calificacion} />
                  <span className="text-xs text-slate-500">
                    {formatDate(resena.fecha_resena)}
                  </span>
                </div>

                {solicitud && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Wrench className="h-3.5 w-3.5" />
                      {servicioNombre(solicitud.servicio_id_servicio)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UserRound className="h-3.5 w-3.5" />
                      {tecnicoNombre(solicitud.tecnico_usuario_rut)}
                    </span>
                  </div>
                )}

                {resena.comentario && (
                  <p className="mt-2 text-sm text-slate-700">
                    {resena.comentario}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

export default CalificacionesTab;
