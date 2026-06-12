import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  ClipboardList,
  MapPin,
  PlayCircle,
  RefreshCw,
  Send,
  Wrench,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import EmptyState from "../../components/ui/EmptyState";
import { useAuth } from "../../context/AuthContext";
import {
  asignarTecnico,
  finalizarSolicitud,
  getSolicitudes,
  getSolicitudesTecnico,
  iniciarSolicitud,
} from "../../services/solicitudService";

import type { Solicitud } from "../../services/solicitudService";
import { getServicios } from "../../services/catalogService";
import type { Servicio } from "../../services/catalogService";
import { createCotizacion } from "../../services/cotizacionService";
import {
  getTechnicianDashboard,
  type TecnicoDashboardMetrics,
} from "../../services/technicianService";
import { getSolicitudStatusLabel } from "../../utils/requestStatus";

function getEstadoStyle(estado: string) {
  if (estado === "INICIADO") {
    return "bg-blue-100 text-blue-700";
  }

  if (estado === "ASIGNADO") {
    return "bg-yellow-100 text-yellow-700";
  }

  if (estado === "EN_PROCESO") {
    return "bg-purple-100 text-purple-700";
  }

  if (estado === "FINALIZADO") {
    return "bg-green-100 text-green-700";
  }

  if (estado === "CANCELADO") {
    return "bg-red-100 text-red-700";
  }

  return "bg-gray-100 text-gray-700";
}

function TecnicoDashboard() {
  const { usuario } = useAuth();

  const [solicitudesDisponibles, setSolicitudesDisponibles] = useState<
    Solicitud[]
  >([]);
  const [misSolicitudes, setMisSolicitudes] = useState<Solicitud[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [metrics, setMetrics] = useState<TecnicoDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [accionLoading, setAccionLoading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [costosFinales, setCostosFinales] = useState<Record<number, string>>(
    {}
  );
  const [cotizaciones, setCotizaciones] = useState<
    Record<number, { monto: string; detalle: string; vigencia: string }>
  >({});

  const cargarDatos = useCallback(async () => {
    if (!usuario?.rut) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [todas, asignadas, serviciosData, metricasData] = await Promise.all([
        getSolicitudes(),
        getSolicitudesTecnico(usuario.rut),
        getServicios(),
        getTechnicianDashboard(usuario.rut),
      ]);

      const disponibles = todas.filter(
        (solicitud) =>
          solicitud.estado_trabajo === "INICIADO" &&
          solicitud.tecnico_usuario_rut === null
      );

      setSolicitudesDisponibles(disponibles);
      setMisSolicitudes(asignadas);
      setServicios(serviciosData);
      setMetrics(metricasData);
    } catch {
      setError("No se pudieron cargar las solicitudes del técnico.");
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const solicitudesActivas = useMemo(() => {
    return misSolicitudes.filter(
      (solicitud) =>
        solicitud.estado_trabajo === "ASIGNADO" ||
        solicitud.estado_trabajo === "EN_PROCESO"
    );
  }, [misSolicitudes]);

  const solicitudesFinalizadas = useMemo(() => {
    return misSolicitudes.filter(
      (solicitud) => solicitud.estado_trabajo === "FINALIZADO"
    );
  }, [misSolicitudes]);

  const serviciosPorId = useMemo(() => {
    return new Map(
      servicios.map((servicio) => [
        servicio.id_servicio,
        servicio.nombre_servicio,
      ])
    );
  }, [servicios]);

  async function handleIniciar(idSolicitud: number) {
    try {
      setAccionLoading(idSolicitud);
      setError("");
      setSuccess("");

      await iniciarSolicitud(idSolicitud);

      setSuccess("Trabajo iniciado. El cliente verá la solicitud en proceso.");
      await cargarDatos();
    } catch {
      setError("No se pudo iniciar la solicitud.");
    } finally {
      setAccionLoading(null);
    }
  }

  async function handleAceptarTrabajo(idSolicitud: number) {
    if (!usuario?.rut) {
      setError("No se pudo identificar al tecnico autenticado.");
      return;
    }

    try {
      setAccionLoading(idSolicitud);
      setError("");
      setSuccess("");

      await asignarTecnico(idSolicitud, usuario.rut);

      setSuccess("Trabajo aceptado. Ahora puedes coordinar y enviar cotización.");
      await cargarDatos();
    } catch {
      setError("No se pudo aceptar el trabajo.");
    } finally {
      setAccionLoading(null);
    }
  }

  async function handleFinalizar(idSolicitud: number) {
    const costo = Number(costosFinales[idSolicitud]);

    if (!costo || costo <= 0) {
      setError("Debes ingresar un costo final válido.");
      return;
    }

    try {
      setAccionLoading(idSolicitud);
      setError("");
      setSuccess("");

      await finalizarSolicitud(idSolicitud, costo);

      setSuccess("Trabajo finalizado. El cliente podrá revisar y calificar el servicio.");
      setCostosFinales((prev) => ({
        ...prev,
        [idSolicitud]: "",
      }));
      await cargarDatos();
    } catch {
      setError("No se pudo finalizar la solicitud.");
    } finally {
      setAccionLoading(null);
    }
  }

  async function handleCrearCotizacion(idSolicitud: number) {
    if (!usuario?.rut) {
      setError("No se pudo identificar al tecnico autenticado.");
      return;
    }

    const cotizacion = cotizaciones[idSolicitud];
    const monto = Number(cotizacion?.monto);

    if (!monto || monto <= 0 || !cotizacion?.detalle?.trim() || !cotizacion.vigencia) {
      setError("Completa monto, detalle y vigencia de la cotizacion.");
      return;
    }

    try {
      setAccionLoading(idSolicitud);
      setError("");
      setSuccess("");

      await createCotizacion({
        solicitud_id_solicitud: idSolicitud,
        tecnico_usuario_rut: usuario.rut,
        monto_estimado: monto,
        mensaje_cotizacion: cotizacion.detalle,
        fecha_vigencia: new Date(`${cotizacion.vigencia}T23:59:00`).toISOString(),
      });

      setSuccess("Cotización enviada y PDF generado correctamente.");
      setCotizaciones((prev) => ({
        ...prev,
        [idSolicitud]: { monto: "", detalle: "", vigencia: "" },
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear la cotizacion."
      );
    } finally {
      setAccionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Panel de trabajos técnicos
          </h1>
          <p className="mt-2 text-gray-600">
            Recibe solicitudes disponibles, envía cotizaciones y gestiona tus
            trabajos asignados hasta finalizar el servicio.
          </p>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <ClipboardList className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Solicitudes disponibles
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {solicitudesDisponibles.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
                <Briefcase className="h-6 w-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Trabajos activos
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {solicitudesActivas.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Finalizadas
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {solicitudesFinalizadas.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Rating</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {metrics?.promedio_calificacion ?? 0}
            </p>
            <p className="text-xs text-gray-500">
              {metrics?.total_resenas ?? 0} reseñas
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Ingresos</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              ${metrics?.ingresos_totales ?? 0}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">En proceso</p>
            <p className="mt-2 text-3xl font-bold text-purple-700">
              {metrics?.solicitudes_en_proceso ?? 0}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Solicitudes y trabajos
            </h2>
            <p className="text-sm text-gray-500">
              Toma solicitudes disponibles, envía una cotización cuando
              corresponda e informa el avance del trabajo.
            </p>
          </div>

          <button
            onClick={cargarDatos}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar trabajos
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
            {success}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            Cargando solicitudes...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Solicitudes Disponibles
              </h3>

              {solicitudesDisponibles.length === 0 ? (
                <EmptyState
                  title="No hay solicitudes disponibles para tomar"
                  description="Cuando un cliente cree una solicitud relacionada con tus servicios, aparecerá aquí para que puedas aceptarla."
                  icon={ClipboardList}
                />
              ) : (
                <div className="space-y-4">
                  {solicitudesDisponibles.map((solicitud) => (
                    <div
                      key={solicitud.id_solicitud}
                      className="rounded-2xl border border-gray-200 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">
                            {solicitud.titulo_solicitud}
                          </h4>
                          <p className="mt-1 text-sm text-gray-600">
                            {solicitud.descripcion_problema}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getEstadoStyle(
                            solicitud.estado_trabajo
                          )}`}
                        >
                          {getSolicitudStatusLabel(solicitud.estado_trabajo)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-gray-400" />
                          {serviciosPorId.get(solicitud.servicio_id_servicio) ||
                            `Servicio ID ${solicitud.servicio_id_servicio}`}
                        </p>

                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {solicitud.direccion}
                        </p>

                        <p>
                          <strong>Urgencia:</strong> {solicitud.urgencia}
                        </p>

                        <p>
                          <strong>Referencia:</strong>{" "}
                          {solicitud.ubicacion_problema_referencia}
                        </p>
                      </div>

                      <div className="mt-4 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-700">
                        Esta solicitud está disponible para ser aceptada.
                      </div>

                      <button
                        onClick={() =>
                          handleAceptarTrabajo(solicitud.id_solicitud)
                        }
                        disabled={accionLoading === solicitud.id_solicitud}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                      >
                        <CheckCircle className="h-5 w-5" />
                        {accionLoading === solicitud.id_solicitud
                          ? "Aceptando..."
                          : "Aceptar trabajo"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Mis Trabajos
              </h3>

              {misSolicitudes.length === 0 ? (
                <EmptyState
                  title="Aún no tienes trabajos asignados"
                  description="Cuando aceptes una solicitud o se te asigne un servicio relacionado con tus especialidades, aparecerá aquí."
                  icon={Briefcase}
                />
              ) : (
                <div className="space-y-4">
                  {misSolicitudes.map((solicitud) => (
                    <div
                      key={solicitud.id_solicitud}
                      className="rounded-2xl border border-gray-200 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">
                            {solicitud.titulo_solicitud}
                          </h4>
                          <p className="mt-1 text-sm text-gray-600">
                            {solicitud.descripcion_problema}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getEstadoStyle(
                            solicitud.estado_trabajo
                          )}`}
                        >
                          {getSolicitudStatusLabel(solicitud.estado_trabajo)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {solicitud.direccion}
                        </p>

                        <p>
                          <strong>Urgencia:</strong> {solicitud.urgencia}
                        </p>

                        <p>
                          <strong>Referencia:</strong>{" "}
                          {solicitud.ubicacion_problema_referencia}
                        </p>

                        {solicitud.costo_final && (
                          <p>
                            <strong>Costo final:</strong> $
                            {solicitud.costo_final}
                          </p>
                        )}
                      </div>

                      {(solicitud.estado_trabajo === "ASIGNADO" ||
                        solicitud.estado_trabajo === "EN_PROCESO") && (
                        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                          <h5 className="mb-3 font-semibold text-gray-900">
                            Preparar cotización
                          </h5>

                          <div className="grid gap-3">
                            <input
                              type="number"
                              min="1"
                              value={
                                cotizaciones[solicitud.id_solicitud]?.monto ||
                                ""
                              }
                              onChange={(event) =>
                                setCotizaciones((prev) => ({
                                  ...prev,
                                  [solicitud.id_solicitud]: {
                                    monto: event.target.value,
                                    detalle:
                                      prev[solicitud.id_solicitud]?.detalle ||
                                      "",
                                    vigencia:
                                      prev[solicitud.id_solicitud]?.vigencia ||
                                      "",
                                  },
                                }))
                              }
                              placeholder="Monto estimado de la cotización"
                              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />

                            <textarea
                              value={
                                cotizaciones[solicitud.id_solicitud]
                                  ?.detalle || ""
                              }
                              onChange={(event) =>
                                setCotizaciones((prev) => ({
                                  ...prev,
                                  [solicitud.id_solicitud]: {
                                    monto:
                                      prev[solicitud.id_solicitud]?.monto ||
                                      "",
                                    detalle: event.target.value,
                                    vigencia:
                                      prev[solicitud.id_solicitud]?.vigencia ||
                                      "",
                                  },
                                }))
                              }
                              rows={3}
                              placeholder="Detalle, alcance o condiciones de la cotización"
                              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />

                            <input
                              type="date"
                              value={
                                cotizaciones[solicitud.id_solicitud]
                                  ?.vigencia || ""
                              }
                              onChange={(event) =>
                                setCotizaciones((prev) => ({
                                  ...prev,
                                  [solicitud.id_solicitud]: {
                                    monto:
                                      prev[solicitud.id_solicitud]?.monto ||
                                      "",
                                    detalle:
                                      prev[solicitud.id_solicitud]?.detalle ||
                                      "",
                                    vigencia: event.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />

                            <button
                              onClick={() =>
                                handleCrearCotizacion(
                                  solicitud.id_solicitud
                                )
                              }
                              disabled={
                                accionLoading === solicitud.id_solicitud
                              }
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-300"
                            >
                              <Send className="h-5 w-5" />
                              {accionLoading === solicitud.id_solicitud
                                ? "Enviando cotización..."
                                : "Enviar cotización al cliente"}
                            </button>
                          </div>
                        </div>
                      )}

                      {solicitud.estado_trabajo === "ASIGNADO" && (
                        <button
                          onClick={() =>
                            handleIniciar(solicitud.id_solicitud)
                          }
                          disabled={accionLoading === solicitud.id_solicitud}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                        >
                          <PlayCircle className="h-5 w-5" />
                          {accionLoading === solicitud.id_solicitud
                            ? "Iniciando..."
                            : "Iniciar trabajo"}
                        </button>
                      )}

                      {solicitud.estado_trabajo === "EN_PROCESO" && (
                        <div className="mt-4 space-y-3">
                          <input
                            type="number"
                            min="1"
                            value={
                              costosFinales[solicitud.id_solicitud] || ""
                            }
                            onChange={(event) =>
                              setCostosFinales((prev) => ({
                                ...prev,
                                [solicitud.id_solicitud]:
                                  event.target.value,
                              }))
                            }
                            placeholder="Costo final"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />

                          <button
                            onClick={() =>
                              handleFinalizar(solicitud.id_solicitud)
                            }
                            disabled={
                              accionLoading === solicitud.id_solicitud
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-green-300"
                          >
                            <CheckCircle className="h-5 w-5" />
                            {accionLoading === solicitud.id_solicitud
                              ? "Registrando cierre..."
                              : "Finalizar trabajo y registrar costo"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default TecnicoDashboard;
