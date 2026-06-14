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
    return "bg-[#EAF0F5] text-[#123F66]";
  }

  if (estado === "ASIGNADO") {
    return "bg-[#FFF4D8] text-[#8C5F1D]";
  }

  if (estado === "EN_PROCESO") {
    return "bg-[#F8F5EF] text-[#123F66]";
  }

  if (estado === "FINALIZADO") {
    return "bg-[#DDEADF] text-[#2F5F46]";
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
      setError("No pudimos cargar tus trabajos y solicitudes disponibles. Intenta actualizar el panel.");
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
      setError("No pudimos iniciar este trabajo. Intenta nuevamente.");
    } finally {
      setAccionLoading(null);
    }
  }

  async function handleAceptarTrabajo(idSolicitud: number) {
    if (!usuario?.rut) {
      setError("Necesitamos reconocer tu sesión de técnico. Inicia sesión nuevamente.");
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
      setError("No pudimos aceptar este trabajo. Puede que ya no esté disponible.");
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
      setError("No pudimos finalizar el trabajo. Revisa el costo e intenta nuevamente.");
    } finally {
      setAccionLoading(null);
    }
  }

  async function handleCrearCotizacion(idSolicitud: number) {
    if (!usuario?.rut) {
      setError("Necesitamos reconocer tu sesión de técnico. Inicia sesión nuevamente.");
      return;
    }

    const cotizacion = cotizaciones[idSolicitud];
    const monto = Number(cotizacion?.monto);

    if (!monto || monto <= 0 || !cotizacion?.detalle?.trim() || !cotizacion.vigencia) {
      setError("Completa el monto, el detalle y la vigencia antes de enviar la cotización.");
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
        err instanceof Error ? err.message : "No pudimos enviar la cotización al cliente."
      );
    } finally {
      setAccionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F5EF]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-[#0E1B2A]">
            Tus trabajos y nuevas oportunidades
          </h1>
          <p className="mt-2 max-w-3xl text-[#5F6B7A]">
            Recibe solicitudes disponibles, envía cotizaciones y gestiona tus
            trabajos asignados hasta finalizar el servicio.
          </p>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3 xl:grid-cols-6">
          <div className="fixya-card rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8F5EF]">
                <ClipboardList className="h-6 w-6 text-[#123F66]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#5F6B7A]">
                  Solicitudes disponibles
                </p>
                <p className="text-3xl font-black text-[#0E1B2A]">
                  {solicitudesDisponibles.length}
                </p>
              </div>
            </div>
          </div>

          <div className="fixya-card rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF4D8]">
                <Briefcase className="h-6 w-6 text-[#8C5F1D]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#5F6B7A]">
                  Trabajos activos
                </p>
                <p className="text-3xl font-black text-[#0E1B2A]">
                  {solicitudesActivas.length}
                </p>
              </div>
            </div>
          </div>

          <div className="fixya-card rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DDEADF]">
                <CheckCircle className="h-6 w-6 text-[#2F5F46]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#5F6B7A]">
                  Finalizadas
                </p>
                <p className="text-3xl font-black text-[#0E1B2A]">
                  {solicitudesFinalizadas.length}
                </p>
              </div>
            </div>
          </div>

          <div className="fixya-card rounded-lg p-6">
            <p className="text-sm font-medium text-[#5F6B7A]">Rating</p>
            <p className="mt-2 text-3xl font-black text-[#C8872D]">
              {metrics?.promedio_calificacion ?? 0}
            </p>
            <p className="text-xs text-[#5F6B7A]">
              {metrics?.total_resenas ?? 0} reseñas
            </p>
          </div>

          <div className="fixya-card rounded-lg p-6">
            <p className="text-sm font-medium text-[#5F6B7A]">Ingresos</p>
            <p className="mt-2 text-3xl font-black text-[#2F5F46]">
              ${metrics?.ingresos_totales ?? 0}
            </p>
          </div>

          <div className="fixya-card rounded-lg p-6">
            <p className="text-sm font-medium text-[#5F6B7A]">En proceso</p>
            <p className="mt-2 text-3xl font-black text-[#123F66]">
              {metrics?.solicitudes_en_proceso ?? 0}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#0E1B2A]">
              Solicitudes y trabajos
            </h2>
            <p className="text-sm text-[#5F6B7A]">
              Toma solicitudes disponibles, envía una cotización cuando
              corresponda e informa el avance del trabajo.
            </p>
          </div>

          <button
            onClick={cargarDatos}
            className="fixya-btn-secondary px-4 py-3 text-sm"
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
          <div className="mb-4 rounded-2xl border border-[#DDEADF] bg-[#DDEADF] p-4 text-[#2F5F46]">
            {success}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            Cargando trabajos y solicitudes...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="fixya-card rounded-lg p-6">
              <h3 className="mb-4 text-xl font-black text-[#0E1B2A]">
                Solicitudes disponibles
              </h3>

              {solicitudesDisponibles.length === 0 ? (
                <EmptyState
                  title="Aún no hay solicitudes disponibles para tomar"
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

                      <div className="mt-4 rounded-xl bg-[#FFF4D8] p-3 text-sm text-[#8C5F1D]">
                        Esta solicitud está disponible para ser aceptada.
                      </div>

                      <button
                        onClick={() =>
                          handleAceptarTrabajo(solicitud.id_solicitud)
                        }
                        disabled={accionLoading === solicitud.id_solicitud}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#123F66] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0E1B2A] disabled:opacity-50"
                      >
                        <CheckCircle className="h-5 w-5" />
                        {accionLoading === solicitud.id_solicitud
                          ? "Aceptando trabajo..."
                          : "Aceptar este trabajo"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="fixya-card rounded-lg p-6">
              <h3 className="mb-4 text-xl font-black text-[#0E1B2A]">
                Trabajos asignados
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
                        <div className="mt-4 rounded-2xl border border-[#E6E0D6] bg-[#F8F5EF] p-4">
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
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8872D] px-4 py-3 text-sm font-semibold text-white hover:bg-[#AD711F] disabled:opacity-50"
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
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#123F66] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0E1B2A] disabled:opacity-50"
                        >
                          <PlayCircle className="h-5 w-5" />
                          {accionLoading === solicitud.id_solicitud
                            ? "Iniciando trabajo..."
                            : "Iniciar trabajo asignado"}
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
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F5F46] px-4 py-3 text-sm font-semibold text-white hover:bg-[#244B38] disabled:opacity-50"
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
