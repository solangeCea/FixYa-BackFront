import { useState } from "react";
import {
  ChevronDown,
  History,
  FilePlus2,
  UserCheck,
  PlayCircle,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  ReceiptText,
  FileText,
  Circle,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { getSolicitudTimeline } from "../../services/historyService";
import type { TimelineEvent } from "../../services/historyService";

interface SolicitudTimelineProps {
  idSolicitud: number;
}

// Icono, color y etiqueta por estado del evento del historial.
const EVENTO_META: Record<
  string,
  { icon: LucideIcon; label: string; dot: string; ring: string }
> = {
  INICIADO: {
    icon: FilePlus2,
    label: "Solicitud creada",
    dot: "text-sky-600",
    ring: "bg-sky-100",
  },
  COTIZACION_ENVIADA: {
    icon: FileText,
    label: "Cotización enviada",
    dot: "text-indigo-600",
    ring: "bg-indigo-100",
  },
  ASIGNADO: {
    icon: UserCheck,
    label: "Técnico asignado",
    dot: "text-amber-600",
    ring: "bg-amber-100",
  },
  EN_PROCESO: {
    icon: PlayCircle,
    label: "Trabajo en proceso",
    dot: "text-teal-600",
    ring: "bg-teal-100",
  },
  CAMBIO_ALCANCE: {
    icon: RefreshCcw,
    label: "Cambio de alcance",
    dot: "text-violet-600",
    ring: "bg-violet-100",
  },
  COMPROBANTE_EMITIDO: {
    icon: ReceiptText,
    label: "Comprobante emitido",
    dot: "text-emerald-600",
    ring: "bg-emerald-100",
  },
  FINALIZADO: {
    icon: CheckCircle2,
    label: "Trabajo finalizado",
    dot: "text-emerald-700",
    ring: "bg-emerald-100",
  },
  CANCELADO: {
    icon: XCircle,
    label: "Solicitud cancelada",
    dot: "text-rose-600",
    ring: "bg-rose-100",
  },
};

function eventoMeta(estado: string) {
  return (
    EVENTO_META[estado] || {
      icon: Circle,
      label: estado.replaceAll("_", " "),
      dot: "text-slate-500",
      ring: "bg-slate-100",
    }
  );
}

const ROL_LABEL: Record<string, string> = {
  CLIENTE: "Cliente",
  TECNICO: "Técnico",
  ADMIN: "Administrador",
};

function formatearFecha(fecha: string) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SolicitudTimeline({ idSolicitud }: SolicitudTimelineProps) {
  const [open, setOpen] = useState(false);
  const [eventos, setEventos] = useState<TimelineEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    const next = !open;
    setOpen(next);

    // Carga perezosa: solo golpea la API la primera vez que se abre.
    if (next && eventos === null && !loading) {
      try {
        setLoading(true);
        setError("");
        const data = await getSolicitudTimeline(idSolicitud);
        setEventos(data);
      } catch (err) {
        console.error("Error cargando línea de tiempo:", err);
        setError("No pudimos cargar la línea de tiempo. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <History size={17} className="text-teal-700" />
          Ver línea de tiempo
        </span>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <RefreshCw size={15} className="animate-spin text-teal-600" />
              Cargando línea de tiempo...
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && eventos && eventos.length === 0 && (
            <p className="text-sm text-slate-500">
              Esta solicitud todavía no tiene eventos registrados.
            </p>
          )}

          {!loading && !error && eventos && eventos.length > 0 && (
            <ol className="relative space-y-5 pl-2">
              {eventos.map((evento, index) => {
                const meta = eventoMeta(evento.estado);
                const Icon = meta.icon;
                const esUltimo = index === eventos.length - 1;

                return (
                  <li key={evento.id_historial} className="relative flex gap-3">
                    {/* Línea vertical conectora */}
                    {!esUltimo && (
                      <span
                        className="absolute left-[15px] top-8 h-full w-px bg-slate-200"
                        aria-hidden="true"
                      />
                    )}

                    <span
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.ring}`}
                    >
                      <Icon size={16} className={meta.dot} />
                    </span>

                    <div className="flex-1 pb-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <p className="text-sm font-bold text-slate-900">
                          {meta.label}
                        </p>
                        <time className="text-xs text-slate-400">
                          {formatearFecha(evento.fecha_historial)}
                        </time>
                      </div>

                      {evento.motivo && (
                        <p className="mt-0.5 text-sm text-slate-600">
                          {evento.motivo}
                        </p>
                      )}

                      {(evento.usuario_nombre || evento.usuario_rol) && (
                        <p className="mt-1 text-xs text-slate-400">
                          {evento.usuario_nombre || evento.usuario_rut}
                          {evento.usuario_rol
                            ? ` · ${ROL_LABEL[evento.usuario_rol] || evento.usuario_rol}`
                            : ""}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

export default SolicitudTimeline;
