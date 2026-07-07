import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Paperclip,
  Ban,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  getConflictosAdmin,
  resolverConflicto,
  getCancelacionesAdmin,
  resolverCancelacion,
  tipoConflictoLabel,
  type Conflicto,
  type Cancelacion,
} from "../../services/conflictoService";
import { getUploadUrl } from "../../utils/format";
import EmptyState from "../../components/ui/EmptyState";

type Tab = "conflictos" | "cancelaciones";

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

const ROL_LABEL: Record<string, string> = {
  CLIENTE: "Cliente",
  TECNICO: "Técnico",
};

export default function ConflictManagement() {
  const [tab, setTab] = useState<Tab>("conflictos");
  const [conflictos, setConflictos] = useState<Conflicto[]>([]);
  const [cancelaciones, setCancelaciones] = useState<Cancelacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});

  async function cargar(silencioso = false) {
    try {
      if (!silencioso) setLoading(true);
      setError("");
      const [c, k] = await Promise.all([
        getConflictosAdmin(),
        getCancelacionesAdmin(),
      ]);
      setConflictos(c);
      setCancelaciones(k);
    } catch (err) {
      console.error(err);
      setError("No pudimos cargar los conflictos y cancelaciones.");
    } finally {
      if (!silencioso) setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const conflictosPendientes = useMemo(
    () => conflictos.filter((c) => c.estado === "PENDIENTE").length,
    [conflictos]
  );
  const cancelacionesPendientes = useMemo(
    () => cancelaciones.filter((c) => c.estado === "PENDIENTE").length,
    [cancelaciones]
  );

  async function handleResolverConflicto(
    id: number,
    estado: "CONFIRMADO" | "DESCARTADO"
  ) {
    try {
      setActionLoading(`conf-${id}`);
      setError("");
      setSuccess("");
      await resolverConflicto(id, estado, observaciones[`conf-${id}`]);
      setSuccess(
        estado === "CONFIRMADO"
          ? "Conflicto confirmado."
          : "Conflicto descartado."
      );
      await cargar(true);
    } catch {
      setError("No pudimos resolver el conflicto.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResolverCancelacion(id: number, aprobar: boolean) {
    try {
      setActionLoading(`canc-${id}`);
      setError("");
      setSuccess("");
      await resolverCancelacion(id, aprobar, observaciones[`canc-${id}`]);
      setSuccess(
        aprobar
          ? "Cancelación aprobada: el trabajo quedó cancelado."
          : "Cancelación rechazada: el trabajo continúa."
      );
      await cargar(true);
    } catch {
      setError("No pudimos resolver la cancelación.");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <RefreshCw className="mx-auto mb-3 animate-spin text-teal-600" />
          <p className="font-medium text-gray-700">
            Cargando conflictos y cancelaciones...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
            <ShieldCheck className="text-teal-700" size={28} />
            Conflictos y cancelaciones
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Revisa reportes de conflicto y solicitudes de cancelación de trabajos
            en proceso.
          </p>
        </div>
        <button
          onClick={() => cargar()}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("conflictos")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            tab === "conflictos"
              ? "bg-teal-700 text-white"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Conflictos ({conflictosPendientes} pendientes)
        </button>
        <button
          type="button"
          onClick={() => setTab("cancelaciones")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            tab === "cancelaciones"
              ? "bg-teal-700 text-white"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Cancelaciones ({cancelacionesPendientes} pendientes)
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      {tab === "conflictos" && (
        <div className="space-y-4">
          {conflictos.length === 0 ? (
            <EmptyState
              title="No hay conflictos reportados"
              description="Los reportes de conflicto de clientes y técnicos aparecerán aquí."
              icon={AlertTriangle}
            />
          ) : (
            conflictos.map((c) => {
              const pendiente = c.estado === "PENDIENTE";
              return (
                <div
                  key={c.id_conflicto}
                  className={`rounded-2xl border bg-white p-5 shadow-sm ${
                    pendiente ? "border-amber-200" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">
                          {tipoConflictoLabel(c.tipo)}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            c.estado === "CONFIRMADO"
                              ? "bg-rose-100 text-rose-700"
                              : c.estado === "DESCARTADO"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {c.estado}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Solicitud #{c.solicitud_id_solicitud}
                        {c.solicitud_titulo ? ` · ${c.solicitud_titulo}` : ""} ·
                        Reportado por {c.reportante_nombre || c.reportante_rut} (
                        {ROL_LABEL[c.reportante_rol] || c.reportante_rol}) ·{" "}
                        {formatearFecha(c.fecha_reporte)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    {c.descripcion}
                  </p>

                  {c.evidencias.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.evidencias.map((ev) => (
                        <a
                          key={ev.id_evidencia}
                          href={getUploadUrl(ev.archivo_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          {ev.nombre_archivo.length > 28
                            ? ev.nombre_archivo.slice(0, 28) + "…"
                            : ev.nombre_archivo}
                        </a>
                      ))}
                    </div>
                  )}

                  {pendiente ? (
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={observaciones[`conf-${c.id_conflicto}`] || ""}
                        onChange={(e) =>
                          setObservaciones((prev) => ({
                            ...prev,
                            [`conf-${c.id_conflicto}`]: e.target.value,
                          }))
                        }
                        rows={2}
                        placeholder="Observación del administrador (opcional)"
                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
                      />
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={actionLoading === `conf-${c.id_conflicto}`}
                          onClick={() =>
                            handleResolverConflicto(c.id_conflicto, "CONFIRMADO")
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                        >
                          <AlertTriangle size={16} />
                          Confirmar conflicto
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === `conf-${c.id_conflicto}`}
                          onClick={() =>
                            handleResolverConflicto(c.id_conflicto, "DESCARTADO")
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Descartar
                        </button>
                      </div>
                    </div>
                  ) : (
                    c.observacion_admin && (
                      <p className="mt-3 text-sm text-slate-500">
                        <span className="font-semibold">Resolución:</span>{" "}
                        {c.observacion_admin}
                      </p>
                    )
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "cancelaciones" && (
        <div className="space-y-4">
          {cancelaciones.length === 0 ? (
            <EmptyState
              title="No hay solicitudes de cancelación"
              description="Las cancelaciones de trabajos en proceso que requieren revisión aparecerán aquí."
              icon={Ban}
            />
          ) : (
            cancelaciones.map((c) => {
              const pendiente = c.estado === "PENDIENTE";
              return (
                <div
                  key={c.id_cancelacion}
                  className={`rounded-2xl border bg-white p-5 shadow-sm ${
                    pendiente ? "border-violet-200" : "border-slate-200"
                  }`}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900">
                      Solicitud #{c.solicitud_id_solicitud}
                      {c.solicitud_titulo ? ` · ${c.solicitud_titulo}` : ""}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        c.estado === "APROBADA"
                          ? "bg-rose-100 text-rose-700"
                          : c.estado === "RECHAZADA"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-violet-100 text-violet-700"
                      }`}
                    >
                      {c.estado}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Solicitada por {c.solicitante_nombre || c.solicitante_rut} (
                    {ROL_LABEL[c.solicitante_rol] || c.solicitante_rol}) ·{" "}
                    {formatearFecha(c.fecha_solicitud)}
                  </p>

                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    {c.motivo}
                  </p>

                  {pendiente ? (
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={observaciones[`canc-${c.id_cancelacion}`] || ""}
                        onChange={(e) =>
                          setObservaciones((prev) => ({
                            ...prev,
                            [`canc-${c.id_cancelacion}`]: e.target.value,
                          }))
                        }
                        rows={2}
                        placeholder="Observación del administrador (opcional)"
                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
                      />
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={actionLoading === `canc-${c.id_cancelacion}`}
                          onClick={() =>
                            handleResolverCancelacion(c.id_cancelacion, true)
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} />
                          Aprobar cancelación
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === `canc-${c.id_cancelacion}`}
                          onClick={() =>
                            handleResolverCancelacion(c.id_cancelacion, false)
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <XCircle size={16} />
                          Rechazar (continúa el trabajo)
                        </button>
                      </div>
                    </div>
                  ) : (
                    c.observacion_admin && (
                      <p className="mt-3 text-sm text-slate-500">
                        <span className="font-semibold">Resolución:</span>{" "}
                        {c.observacion_admin}
                      </p>
                    )
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
