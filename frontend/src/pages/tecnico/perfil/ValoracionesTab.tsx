import { useEffect, useState } from "react";
import { AlertCircle, MessageSquare, Sparkles, Star, ThumbsUp } from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import SectionCard from "../../../components/ui/SectionCard";
import {
  getTechnicianReviews,
  getTechnicianReviewSummary,
  type ReputationSummary,
  type Review,
} from "../../../services/reviewService";
import { formatDate } from "../../../utils/format";

function Estrellas({ valor, size = "sm" }: { valor: number; size?: "sm" | "lg" }) {
  const llenas = Math.round(valor);
  const dim = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${dim} ${
            n <= llenas
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200"
          }`}
        />
      ))}
    </span>
  );
}

interface ValoracionesTabProps {
  rut: string;
}

function ValoracionesTab({ rut }: ValoracionesTabProps) {
  const [resumen, setResumen] = useState<ReputationSummary | null>(null);
  const [resenas, setResenas] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    Promise.all([getTechnicianReviewSummary(rut), getTechnicianReviews(rut)])
      .then(([resumenData, resenasData]) => {
        if (!active) return;
        setResumen(resumenData);
        setResenas(resenasData);
      })
      .catch(() => {
        if (!active) return;
        setError("No pudimos cargar tus valoraciones. Intenta nuevamente.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [rut]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-50 p-8 text-center font-medium text-slate-600">
        Cargando valoraciones...
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

  const promedio = resumen?.promedio_calificacion ?? 0;
  const total = resumen?.comentarios_analizados ?? resenas.length;

  return (
    <div className="space-y-6">
      <SectionCard title="Resumen de reputación">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 px-8 py-6 text-center">
            <span className="text-4xl font-bold text-slate-900">
              {promedio.toFixed(1)}
            </span>
            <Estrellas valor={promedio} size="lg" />
            <span className="mt-2 text-xs font-semibold text-slate-500">
              {total} {total === 1 ? "reseña" : "reseñas"}
            </span>
          </div>

          <div className="flex-1 space-y-4">
            {resumen?.resumen && (
              <div className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-teal-900">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p>{resumen.resumen}</p>
                  {resumen.sentimiento_general &&
                    resumen.sentimiento_general !== "Sin datos" && (
                      <p className="mt-1 text-xs font-semibold text-teal-700">
                        Sentimiento general: {resumen.sentimiento_general}
                      </p>
                    )}
                </div>
              </div>
            )}

            {resumen && resumen.fortalezas.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Fortalezas destacadas
                </p>
                <div className="flex flex-wrap gap-2">
                  {resumen.fortalezas.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {resumen && resumen.aspectos_a_mejorar.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Aspectos a mejorar
                </p>
                <div className="flex flex-wrap gap-2">
                  {resumen.aspectos_a_mejorar.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Comentarios de clientes">
        {resenas.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Aún no tienes reseñas"
            description="Cuando completes trabajos y tus clientes te califiquen, sus comentarios aparecerán aquí."
          />
        ) : (
          <ul className="space-y-3">
            {resenas.map((resena) => (
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
                {resena.comentario && (
                  <p className="mt-2 text-sm text-slate-700">
                    {resena.comentario}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export default ValoracionesTab;
