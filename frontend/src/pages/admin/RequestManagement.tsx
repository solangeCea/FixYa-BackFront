import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, ClipboardList, Eye, Flag, RefreshCw } from "lucide-react";

import {
  asignarTecnico,
  getReportesSolicitudes,
  getSolicitudes,
  resolverReporteSolicitud,
} from "../../services/solicitudService";
import type { Solicitud, SolicitudReporte } from "../../services/solicitudService";
import { getComunas, getServicios } from "../../services/catalogService";
import type { Comuna, Servicio } from "../../services/catalogService";
import { getPublicTechnicianProfiles } from "../../services/technicianService";
import type { TecnicoPublicProfile } from "../../services/technicianService";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import { getSolicitudStatusLabel } from "../../utils/requestStatus";

function getEstadoStyle(estado: string) {
  if (estado === "INICIADO") return "bg-cyan-100 text-cyan-700";
  if (estado === "ASIGNADO") return "bg-amber-100 text-amber-700";
  if (estado === "EN_PROCESO") return "bg-teal-100 text-teal-700";
  if (estado === "FINALIZADO") return "bg-emerald-100 text-emerald-700";
  if (estado === "CANCELADO") return "bg-rose-100 text-rose-700";

  return "bg-gray-100 text-gray-700";
}

function isSolicitudActiva(estado: string) {
  return estado !== "FINALIZADO" && estado !== "CANCELADO";
}

const reportReasonLabels: Record<string, string> = {
  SOSPECHA_ESTAFA: "Sospecha de estafa",
  SUPLANTACION: "Suplantacion",
  INFORMACION_FALSA: "Informacion falsa",
  SOLICITUD_DUPLICADA: "Solicitud duplicada",
  CONTENIDO_INAPROPIADO: "Contenido inapropiado",
  SERVICIO_INCORRECTO: "Servicio incorrecto",
  CONTACTO_SOSPECHOSO: "Contacto sospechoso",
  UBICACION_SOSPECHOSA: "Ubicacion sospechosa",
  RIESGO_SEGURIDAD: "Riesgo para el tecnico",
  PAGO_FUERA_FIXYA: "Pago fuera de FixYa",
  OTRO_MOTIVO: "Otro motivo",
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">
        {value || "Información no registrada"}
      </p>
    </div>
  );
}

function RequestManagement() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [reportes, setReportes] = useState<SolicitudReporte[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [selectedReporte, setSelectedReporte] = useState<SolicitudReporte | null>(null);
  const [resolverForm, setResolverForm] = useState({
    estado_reporte: "EN_REVISION",
    observacion_admin: "",
    solicitud_activa: "",
  });
  const [resolving, setResolving] = useState(false);
  const [tecnicos, setTecnicos] = useState<TecnicoPublicProfile[]>([]);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState("");
  const [asignando, setAsignando] = useState(false);
  const [success, setSuccess] = useState("");

  async function cargarDatos() {
    try {
      setLoading(true);
      setError("");

      const [
        solicitudesData,
        serviciosData,
        comunasData,
        reportesData,
        tecnicosData,
      ] = await Promise.all([
        getSolicitudes(),
        getServicios(),
        getComunas(),
        getReportesSolicitudes(),
        getPublicTechnicianProfiles(),
      ]);

      setSolicitudes(solicitudesData);
      setServicios(serviciosData);
      setComunas(comunasData);
      setReportes(reportesData);
      setTecnicos(tecnicosData);
    } catch (error) {
      console.error(error);
      setError(
        "No pudimos cargar las solicitudes del sistema. Intenta actualizar el listado."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const solicitudesActivas = useMemo(
    () => solicitudes.filter((s) => isSolicitudActiva(s.estado_trabajo)),
    [solicitudes]
  );

  const solicitudesSinTecnico = useMemo(
    () =>
      solicitudes.filter(
        (s) => !s.tecnico_usuario_rut && isSolicitudActiva(s.estado_trabajo)
      ),
    [solicitudes]
  );

  const reportesPendientes = useMemo(
    () =>
      reportes.filter(
        (reporte) =>
          reporte.estado_reporte === "PENDIENTE" ||
          reporte.estado_reporte === "EN_REVISION"
      ),
    [reportes]
  );

  const serviciosPorId = useMemo(() => {
    return new Map(
      servicios.map((servicio) => [
        servicio.id_servicio,
        servicio.nombre_servicio,
      ])
    );
  }, [servicios]);

  const comunasPorId = useMemo(() => {
    return new Map(
      comunas.map((comuna) => [comuna.id_comuna, comuna.nombre_comuna])
    );
  }, [comunas]);

  function openReporte(reporte: SolicitudReporte) {
    setSelectedReporte(reporte);
    setResolverForm({
      estado_reporte: reporte.estado_reporte,
      observacion_admin: reporte.observacion_admin || "",
      solicitud_activa: "",
    });
  }

  async function handleAsignarTecnico() {
    if (!selectedSolicitud || !tecnicoSeleccionado) return;

    try {
      setAsignando(true);
      setError("");
      setSuccess("");

      await asignarTecnico(selectedSolicitud.id_solicitud, tecnicoSeleccionado);

      setSuccess("Técnico asignado correctamente.");
      setSelectedSolicitud(null);
      setTecnicoSeleccionado("");
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos asignar el técnico."
      );
    } finally {
      setAsignando(false);
    }
  }

  async function handleResolverReporte() {
    if (!selectedReporte) return;

    try {
      setResolving(true);
      setError("");
      setSuccess("");
      await resolverReporteSolicitud(selectedReporte.id_reporte, {
        estado_reporte: resolverForm.estado_reporte,
        observacion_admin: resolverForm.observacion_admin || null,
        solicitud_activa:
          resolverForm.solicitud_activa === ""
            ? null
            : resolverForm.solicitud_activa === "true",
      });
      setSelectedReporte(null);
      setSuccess("Reporte resuelto correctamente.");
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos resolver el reporte."
      );
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de solicitudes
        </h1>
        <p className="mt-2 text-gray-600">
          Supervisa solicitudes, técnicos asignados, comunas y estados generales
          sin mezclar acciones del cliente o del técnico.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total solicitudes</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {solicitudes.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Solicitudes activas</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">
            {solicitudesActivas.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Sin técnico asignado</p>
          <p className="mt-2 text-3xl font-bold text-yellow-700">
            {solicitudesSinTecnico.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Reportes pendientes</p>
          <p className="mt-2 text-3xl font-bold text-rose-700">
            {reportesPendientes.length}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Solicitudes del sistema
        </h2>

        <button
          onClick={cargarDatos}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Actualizar solicitudes
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 font-medium text-green-700">
          {success}
        </div>
      )}

      {reportes.length > 0 && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Solicitudes reportadas
              </h2>
              <p className="text-sm text-gray-500">
                Revisa motivos, comentarios y estado de moderacion.
              </p>
            </div>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-bold text-rose-700">
              {reportesPendientes.length} pendientes
            </span>
          </div>

          <div className="space-y-3">
            {reportes.map((reporte) => (
              <div
                key={reporte.id_reporte}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="flex items-center gap-2 font-bold text-slate-950">
                    <Flag className="h-4 w-4 text-rose-600" />
                    {reporte.solicitud_titulo ||
                      `Solicitud #${reporte.solicitud_id_solicitud}`}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Motivo: {reportReasonLabels[reporte.motivo] || reporte.motivo}
                  </p>
                  {reporte.comentario && (
                    <p className="mt-1 text-sm text-slate-500">
                      {reporte.comentario}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {reporte.estado_reporte}
                  </span>
                  <button
                    type="button"
                    onClick={() => openReporte(reporte)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Revisar reporte
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          Cargando solicitudes del sistema...
        </div>
      ) : solicitudes.length === 0 ? (
        <EmptyState
          title="Aún no hay solicitudes registradas en la plataforma"
          description="Cuando los clientes creen solicitudes de servicio, aparecerán aquí para seguimiento administrativo."
          icon={ClipboardList}
        />
      ) : (
        <div className="space-y-4">
          {solicitudes.map((solicitud) => (
            <div
              key={solicitud.id_solicitud}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100">
                      <ClipboardList className="text-teal-700" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {solicitud.titulo_solicitud}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Cliente: {solicitud.usuario_rut}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600">
                    {solicitud.descripcion_problema}
                  </p>

                  <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                    <p>
                      <strong>Dirección:</strong> {solicitud.direccion}
                    </p>
                    <p>
                      <strong>Urgencia:</strong> {solicitud.urgencia}
                    </p>
                    <p>
                      <strong>Servicio:</strong>{" "}
                      {serviciosPorId.get(solicitud.servicio_id_servicio) ||
                        `ID ${solicitud.servicio_id_servicio}`}
                    </p>
                    <p>
                      <strong>Comuna:</strong>{" "}
                      {comunasPorId.get(solicitud.comuna_id_comuna) ||
                        `ID ${solicitud.comuna_id_comuna}`}
                    </p>
                    <p>
                      <strong>Técnico:</strong>{" "}
                      {solicitud.tecnico_usuario_rut || "Pendiente de aceptación"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getEstadoStyle(
                      solicitud.estado_trabajo
                    )}`}
                  >
                    {getSolicitudStatusLabel(solicitud.estado_trabajo)}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedSolicitud(solicitud)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                  >
                    <Eye className="h-4 w-4" />
                    Ver detalle de solicitud
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selectedSolicitud)}
        title={
          selectedSolicitud
            ? `Solicitud #${selectedSolicitud.id_solicitud}`
            : "Detalle de solicitud"
        }
        description={selectedSolicitud?.titulo_solicitud}
        onClose={() => {
          setSelectedSolicitud(null);
          setTecnicoSeleccionado("");
        }}
      >
        {selectedSolicitud && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${getEstadoStyle(
                  selectedSolicitud.estado_trabajo
                )}`}
              >
                {getSolicitudStatusLabel(selectedSolicitud.estado_trabajo)}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                Urgencia: {selectedSolicitud.urgencia}
              </span>
            </div>

            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
              {selectedSolicitud.descripcion_problema}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailItem label="Cliente" value={selectedSolicitud.usuario_rut} />
              <DetailItem
                label="Técnico"
                value={
                  selectedSolicitud.tecnico_usuario_rut ||
                  "Pendiente de aceptación"
                }
              />
              <DetailItem
                label="Servicio"
                value={
                  serviciosPorId.get(selectedSolicitud.servicio_id_servicio) ||
                  `ID ${selectedSolicitud.servicio_id_servicio}`
                }
              />
              <DetailItem
                label="Comuna"
                value={
                  comunasPorId.get(selectedSolicitud.comuna_id_comuna) ||
                  `ID ${selectedSolicitud.comuna_id_comuna}`
                }
              />
              <DetailItem label="Dirección" value={selectedSolicitud.direccion} />
              <DetailItem label="Referencia" value={selectedSolicitud.ubicacion_problema_referencia} />
              <DetailItem label="Tipo de problema" value={selectedSolicitud.tipo_problema} />
              <DetailItem label="Fecha creación" value={selectedSolicitud.fecha_creacion} />
              <DetailItem label="Costo final" value={selectedSolicitud.costo_final} />
              <DetailItem label="Fecha real" value={selectedSolicitud.fecha_real} />
            </div>

            {!selectedSolicitud.tecnico_usuario_rut &&
              isSolicitudActiva(selectedSolicitud.estado_trabajo) && (
                <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
                  <p className="mb-2 text-sm font-bold text-teal-800">
                    Asignar técnico manualmente
                  </p>
                  <p className="mb-3 text-xs text-slate-500">
                    Solo se listan técnicos aprobados. Al asignar, la solicitud
                    pasa a estado ASIGNADO.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                      value={tecnicoSeleccionado}
                      onChange={(event) =>
                        setTecnicoSeleccionado(event.target.value)
                      }
                      className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    >
                      <option value="">Selecciona un técnico aprobado</option>
                      {tecnicos.map((tecnico) => (
                        <option
                          key={tecnico.usuario_rut}
                          value={tecnico.usuario_rut}
                        >
                          {tecnico.nombre_completo} · {tecnico.usuario_rut}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAsignarTecnico}
                      disabled={!tecnicoSeleccionado || asignando}
                      className="rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                      {asignando ? "Asignando..." : "Asignar técnico"}
                    </button>
                  </div>
                </div>
              )}
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(selectedReporte)}
        title={
          selectedReporte
            ? `Reporte #${selectedReporte.id_reporte}`
            : "Reporte de solicitud"
        }
        description={selectedReporte?.solicitud_titulo || undefined}
        onClose={() => setSelectedReporte(null)}
      >
        {selectedReporte && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailItem
                label="Solicitud"
                value={selectedReporte.solicitud_id_solicitud}
              />
              <DetailItem
                label="Tecnico reportante"
                value={selectedReporte.tecnico_usuario_rut}
              />
              <DetailItem
                label="Cliente"
                value={selectedReporte.cliente_usuario_rut}
              />
              <DetailItem
                label="Motivo"
                value={
                  reportReasonLabels[selectedReporte.motivo] ||
                  selectedReporte.motivo
                }
              />
            </div>

            {selectedReporte.comentario && (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {selectedReporte.comentario}
              </p>
            )}

            <label className="block text-sm font-semibold text-slate-700">
              Estado del reporte
              <select
                value={resolverForm.estado_reporte}
                onChange={(event) =>
                  setResolverForm((prev) => ({
                    ...prev,
                    estado_reporte: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_REVISION">En revision</option>
                <option value="DESCARTADO">Descartado</option>
                <option value="CONFIRMADO">Confirmado</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Accion sobre la solicitud
              <select
                value={resolverForm.solicitud_activa}
                onChange={(event) =>
                  setResolverForm((prev) => ({
                    ...prev,
                    solicitud_activa: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="">Mantener estado actual</option>
                <option value="true">Mantener o reactivar visible</option>
                <option value="false">Ocultar solicitud</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Observacion administrativa
              <textarea
                value={resolverForm.observacion_admin}
                onChange={(event) =>
                  setResolverForm((prev) => ({
                    ...prev,
                    observacion_admin: event.target.value,
                  }))
                }
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3"
              />
            </label>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedReporte(null)}
                className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResolverReporte}
                disabled={resolving}
                className="rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:bg-teal-300"
              >
                {resolving ? "Guardando..." : "Guardar resolucion"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default RequestManagement;
