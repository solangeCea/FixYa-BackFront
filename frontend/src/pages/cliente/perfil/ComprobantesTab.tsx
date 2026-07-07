import { useMemo, useState } from "react";
import { Download, Receipt, UserRound, Wrench } from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import SectionCard from "../../../components/ui/SectionCard";
import type { Solicitud } from "../../../services/solicitudService";
import { formatCLP, formatDate, getUploadUrl } from "../../../utils/format";
import { imprimirComprobante } from "../../../utils/comprobante";

interface ComprobantesTabProps {
  solicitudes: Solicitud[];
  loading: boolean;
  error: string;
  clienteNombre: string;
  servicioNombre: (id: number) => string;
  tecnicoNombre: (rut: string | null) => string;
}

function ComprobantesTab({
  solicitudes,
  loading,
  error,
  clienteNombre,
  servicioNombre,
  tecnicoNombre,
}: ComprobantesTabProps) {
  const [aviso, setAviso] = useState("");

  // Solo las solicitudes finalizadas con monto generan comprobante.
  const finalizadas = useMemo(
    () =>
      [...solicitudes]
        .filter((s) => s.estado_trabajo === "FINALIZADO" && s.costo_final)
        .sort(
          (a, b) =>
            new Date(b.fecha_real ?? b.fecha_creacion).getTime() -
            new Date(a.fecha_real ?? a.fecha_creacion).getTime()
        ),
    [solicitudes]
  );

  function descargar(solicitud: Solicitud) {
    setAviso("");
    const ok = imprimirComprobante({
      folio: solicitud.id_solicitud,
      cliente: clienteNombre,
      tecnico: tecnicoNombre(solicitud.tecnico_usuario_rut),
      servicio: servicioNombre(solicitud.servicio_id_servicio),
      direccion: solicitud.direccion,
      fecha: solicitud.fecha_real ?? solicitud.fecha_creacion,
      monto: solicitud.costo_final,
    });

    if (!ok) {
      setAviso(
        "Tu navegador bloqueó la ventana del comprobante. Permite las ventanas emergentes e inténtalo otra vez."
      );
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-50 p-8 text-center font-medium text-slate-600">
        Cargando tus comprobantes...
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
      title="Comprobantes de servicios"
      description="Descarga o imprime el comprobante de cada trabajo finalizado."
    >
      {aviso && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          {aviso}
        </div>
      )}

      {finalizadas.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aún no tienes comprobantes"
          description="Cuando un servicio finalice con su costo registrado, podrás descargar su comprobante aquí."
        />
      ) : (
        <div className="space-y-3">
          {finalizadas.map((solicitud) => (
            <article
              key={solicitud.id_solicitud}
              className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                    #{solicitud.id_solicitud}
                  </span>
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {solicitud.titulo_solicitud}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Wrench className="h-3.5 w-3.5" />
                    {servicioNombre(solicitud.servicio_id_servicio)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="h-3.5 w-3.5" />
                    {tecnicoNombre(solicitud.tecnico_usuario_rut)}
                  </span>
                  <span>{formatDate(solicitud.fecha_real)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-slate-900">
                  {formatCLP(solicitud.costo_final)}
                </span>
                {solicitud.archivo_comprobante_url ? (
                  // Comprobante profesional generado por el backend (PDF real).
                  <a
                    href={getUploadUrl(solicitud.archivo_comprobante_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-teal-200 px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                  >
                    <Download className="h-4 w-4" />
                    Comprobante
                  </a>
                ) : (
                  // Respaldo: comprobante básico imprimible (trabajos antiguos).
                  <button
                    type="button"
                    onClick={() => descargar(solicitud)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    Comprobante
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default ComprobantesTab;
