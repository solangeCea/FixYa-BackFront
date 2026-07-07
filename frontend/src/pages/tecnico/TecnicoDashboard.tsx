import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  Clock,
  ClipboardList,
  Flag,
  MapPin,
  MessageCircle,
  PlayCircle,
  RefreshCw,
  Send,
  Trash2,
  Wrench,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import ChatPanel from "../../components/chat/ChatPanel";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import { useAuth } from "../../context/AuthContext";
import {
  descartarSolicitud,
  finalizarSolicitud,
  getSolicitudesDisponiblesTecnico,
  getSolicitudesTecnico,
  iniciarSolicitud,
  reportarSolicitud,
} from "../../services/solicitudService";
import type { Solicitud } from "../../services/solicitudService";
import { getServicios } from "../../services/catalogService";
import type { Servicio } from "../../services/catalogService";
import {
  createCotizacion,
  getCotizacionEstadoLabel,
  getMisCotizaciones,
  solicitarCambioAlcance,
} from "../../services/cotizacionService";
import type { Cotizacion } from "../../services/cotizacionService";
import {
  getMyTechnicianProfile,
  getTechnicianDashboard,
  type Tecnico,
  type TecnicoDashboardMetrics,
} from "../../services/technicianService";
import { getSolicitudStatusLabel } from "../../utils/requestStatus";
import {
  formatCLP,
  formatMilesCL,
  getUploadUrl,
  soloDigitos,
} from "../../utils/format";

function getEstadoStyle(estado: string) {
  if (estado === "INICIADO") return "bg-blue-100 text-blue-700";
  if (estado === "ASIGNADO") return "bg-yellow-100 text-yellow-700";
  if (estado === "EN_PROCESO") return "bg-purple-100 text-purple-700";
  if (estado === "CAMBIO_ALCANCE") return "bg-orange-100 text-orange-700";
  if (estado === "FINALIZADO") return "bg-green-100 text-green-700";
  if (estado === "CANCELADO") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

const disponibilidadDayLabels: Record<string, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miercoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sabado",
  DOMINGO: "Domingo",
};

const motivosCambioAlcance = [
  "El daño es mucho mayor al diagnosticado inicialmente.",
  "Se requiere reemplazar más componentes de los previstos.",
  "Se necesitan materiales adicionales no considerados.",
  "El tiempo de trabajo aumenta considerablemente.",
  "Otro motivo (lo detallo abajo).",
];

const reportReasons = [
  ["SOSPECHA_ESTAFA", "Sospecho que es una estafa."],
  ["SUPLANTACION", "Sospecho que alguien esta suplantando a otra persona."],
  ["INFORMACION_FALSA", "La informacion de la solicitud parece falsa."],
  ["SOLICITUD_DUPLICADA", "La solicitud esta duplicada."],
  ["CONTENIDO_INAPROPIADO", "Contiene contenido o lenguaje inapropiado."],
  ["SERVICIO_INCORRECTO", "No corresponde al servicio seleccionado."],
  ["CONTACTO_SOSPECHOSO", "Los datos de contacto parecen sospechosos."],
  ["UBICACION_SOSPECHOSA", "La direccion o ubicacion parece sospechosa."],
  ["RIESGO_SEGURIDAD", "Podria representar un riesgo para mi seguridad."],
  ["PAGO_FUERA_FIXYA", "Intenta pagos o acuerdos fuera de FixYa."],
  ["OTRO_MOTIVO", "Otro motivo."],
] as const;

function getVerificationLabel(state?: string) {
  if (state === "APROBADO") return "Aprobado";
  if (state === "EN_REVISION") return "En revision";
  if (state === "OBSERVADO") return "Observado";
  if (state === "RECHAZADO") return "Rechazado";
  if (state === "SUSPENDIDO") return "Suspendido";
  return "Pendiente";
}

type ReportForm = {
  motivo: string;
  descripcion_otro: string;
  comentario: string;
};

function AvailabilitySummary({ solicitud }: { solicitud: Solicitud }) {
  const items = solicitud.disponibilidad_horaria || [];

  if (items.length === 0 && !solicitud.horario_disponible) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-950">
      <h5 className="mb-3 flex items-center gap-2 font-bold">
        <Clock className="h-4 w-4 text-teal-700" />
        Disponibilidad del cliente
      </h5>

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={`${solicitud.id_solicitud}-${item.dia}`}
              className="rounded-full bg-white px-3 py-2 font-semibold text-teal-900 ring-1 ring-teal-200"
            >
              {disponibilidadDayLabels[item.dia] || item.dia}:{" "}
              {item.hora_inicio} a {item.hora_fin}
            </span>
          ))}
        </div>
      ) : (
        <p>{solicitud.horario_disponible}</p>
      )}
    </div>
  );
}

function TecnicoDashboard() {
  const { usuario } = useAuth();
  const [solicitudesDisponibles, setSolicitudesDisponibles] = useState<
    Solicitud[]
  >([]);
  const [misSolicitudes, setMisSolicitudes] = useState<Solicitud[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [metrics, setMetrics] = useState<TecnicoDashboardMetrics | null>(null);
  const [technicianProfile, setTechnicianProfile] = useState<Tecnico | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [accionLoading, setAccionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [costosFinales, setCostosFinales] = useState<Record<number, string>>(
    {}
  );
  // Datos extra para el comprobante al finalizar (materiales, pago, garantía, obs).
  const [finalizarExtra, setFinalizarExtra] = useState<
    Record<
      number,
      { materiales: string; metodo: string; garantia: string; observaciones: string }
    >
  >({});

  function updateFinalizar(
    id: number,
    patch: Partial<{
      materiales: string;
      metodo: string;
      garantia: string;
      observaciones: string;
    }>
  ) {
    setFinalizarExtra((prev) => ({
      ...prev,
      [id]: {
        materiales: prev[id]?.materiales ?? "",
        metodo: prev[id]?.metodo ?? "",
        garantia: prev[id]?.garantia ?? "",
        observaciones: prev[id]?.observaciones ?? "",
        ...patch,
      },
    }));
  }
  const [cotizaciones, setCotizaciones] = useState<
    Record<
      number,
      { monto: string; detalle: string; vigencia: string; materiales: boolean }
    >
  >({});
  const [misCotizaciones, setMisCotizaciones] = useState<Cotizacion[]>([]);
  // Solicitud cuyo chat está abierto (null = ninguno).
  const [chatSolicitudId, setChatSolicitudId] = useState<number | null>(null);
  // Solicitud para la que se está solicitando un cambio de alcance (modal).
  const [cambioTarget, setCambioTarget] = useState<Solicitud | null>(null);
  const [cambioForm, setCambioForm] = useState({
    motivoOpcion: motivosCambioAlcance[0],
    motivoDetalle: "",
    monto: "",
    detalle: "",
    plazo: "",
    vigencia: "",
    materiales: false,
  });
  const [cambioLoading, setCambioLoading] = useState(false);

  function abrirCambioAlcance(solicitud: Solicitud) {
    resetMessages();
    setCambioForm({
      motivoOpcion: motivosCambioAlcance[0],
      motivoDetalle: "",
      monto: "",
      detalle: "",
      plazo: "",
      vigencia: "",
      materiales: false,
    });
    setCambioTarget(solicitud);
  }

  async function handleCambioAlcance() {
    if (!cambioTarget) return;

    const original = misCotizaciones.find(
      (c) =>
        c.solicitud_id_solicitud === cambioTarget.id_solicitud &&
        c.estado_cotizacion === "ACEPTADA"
    );
    if (!original) {
      setError("No encontramos la cotización aceptada de este trabajo.");
      return;
    }

    const esOtro = cambioForm.motivoOpcion.startsWith("Otro");
    const motivo = esOtro
      ? cambioForm.motivoDetalle.trim()
      : cambioForm.motivoOpcion;
    const monto = Number(soloDigitos(cambioForm.monto));

    if (!motivo) {
      setError("Indica el motivo del cambio de alcance.");
      return;
    }
    if (!monto || monto <= 0) {
      setError("Ingresa el nuevo valor del trabajo.");
      return;
    }
    if (!cambioForm.detalle.trim() || !cambioForm.vigencia) {
      setError("Completa el nuevo diagnóstico y la vigencia.");
      return;
    }

    try {
      setCambioLoading(true);
      resetMessages();
      await solicitarCambioAlcance(original.id_cotizacion, {
        motivo,
        monto_estimado: monto,
        materiales_incluidos: cambioForm.materiales,
        mensaje_cotizacion: cambioForm.detalle.trim(),
        plazo_estimado: cambioForm.plazo.trim(),
        fecha_vigencia: new Date(
          `${cambioForm.vigencia}T23:59:00`
        ).toISOString(),
      });
      setSuccess(
        "Nueva cotización enviada por cambio de alcance. El cliente será notificado."
      );
      setCambioTarget(null);
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos enviar el cambio de alcance."
      );
    } finally {
      setCambioLoading(false);
    }
  }

  // Actualiza un campo del borrador de cotización de una solicitud, preservando
  // el resto de los campos (monto, detalle, vigencia, materiales).
  function updateCotizacion(
    idSolicitud: number,
    patch: Partial<{
      monto: string;
      detalle: string;
      vigencia: string;
      materiales: boolean;
    }>
  ) {
    setCotizaciones((prev) => ({
      ...prev,
      [idSolicitud]: {
        monto: prev[idSolicitud]?.monto ?? "",
        detalle: prev[idSolicitud]?.detalle ?? "",
        vigencia: prev[idSolicitud]?.vigencia ?? "",
        materiales: prev[idSolicitud]?.materiales ?? false,
        ...patch,
      },
    }));
  }

  const [reportSolicitud, setReportSolicitud] = useState<Solicitud | null>(
    null
  );
  const [reportForm, setReportForm] = useState<ReportForm>({
    motivo: reportReasons[0][0],
    descripcion_otro: "",
    comentario: "",
  });

  const cargarDatos = useCallback(async () => {
    if (!usuario?.rut) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const profile = await getMyTechnicianProfile();
      setTechnicianProfile(profile);

      const verificationState =
        profile.estado_verificacion ||
        (profile.tecnico_verificado ? "APROBADO" : "PENDIENTE");

      if (verificationState !== "APROBADO" || !profile.tecnico_verificado) {
        const [asignadas, serviciosData, metricasData, cotizacionesData] =
          await Promise.all([
            getSolicitudesTecnico(usuario.rut),
            getServicios(),
            getTechnicianDashboard(usuario.rut),
            getMisCotizaciones(),
          ]);

        setSolicitudesDisponibles([]);
        setMisSolicitudes(asignadas);
        setServicios(serviciosData);
        setMetrics(metricasData);
        setMisCotizaciones(cotizacionesData);
        return;
      }

      const [disponibles, asignadas, serviciosData, metricasData, cotizacionesData] =
        await Promise.all([
          getSolicitudesDisponiblesTecnico(),
          getSolicitudesTecnico(usuario.rut),
          getServicios(),
          getTechnicianDashboard(usuario.rut),
          getMisCotizaciones(),
        ]);

      setSolicitudesDisponibles(disponibles);
      setMisSolicitudes(asignadas);
      setServicios(serviciosData);
      setMetrics(metricasData);
      setMisCotizaciones(cotizacionesData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos cargar tus trabajos y solicitudes disponibles."
      );
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

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  async function handleIniciar(idSolicitud: number) {
    try {
      setAccionLoading(`start-${idSolicitud}`);
      resetMessages();
      await iniciarSolicitud(idSolicitud);
      setSuccess("Trabajo iniciado. El cliente vera la solicitud en proceso.");
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos iniciar este trabajo. Intenta nuevamente."
      );
    } finally {
      setAccionLoading(null);
    }
  }

  async function handleFinalizar(idSolicitud: number) {
    // Igual que el monto: se guardan solo dígitos (pesos) para no perder el valor.
    const costo = Number(soloDigitos(costosFinales[idSolicitud] ?? ""));

    if (!costo || costo <= 0) {
      setError("Debes ingresar un costo final valido.");
      return;
    }

    const extra = finalizarExtra[idSolicitud];
    const materiales = Number(soloDigitos(extra?.materiales ?? ""));
    if (materiales > costo) {
      setError("El costo de materiales no puede superar el total.");
      return;
    }

    try {
      setAccionLoading(`finish-${idSolicitud}`);
      resetMessages();
      await finalizarSolicitud(idSolicitud, {
        costo_final: costo,
        costo_materiales: materiales > 0 ? materiales : null,
        metodo_pago: extra?.metodo?.trim() || null,
        garantia: extra?.garantia?.trim() || null,
        observaciones_finales: extra?.observaciones?.trim() || null,
      });
      setSuccess(
        "Trabajo finalizado. Se generó el comprobante y el cliente podrá descargarlo."
      );
      setCostosFinales((prev) => ({ ...prev, [idSolicitud]: "" }));
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos finalizar el trabajo. Intenta nuevamente."
      );
    } finally {
      setAccionLoading(null);
    }
  }

  async function handleCrearCotizacion(idSolicitud: number) {
    const cotizacion = cotizaciones[idSolicitud];
    // El monto se guarda como dígitos en pesos (sin puntos); lo parseamos a entero.
    const monto = Number(soloDigitos(cotizacion?.monto ?? ""));

    if (!monto || monto <= 0 || !cotizacion?.detalle?.trim() || !cotizacion.vigencia) {
      setError("Completa monto, detalle y vigencia antes de cotizar.");
      return;
    }

    try {
      setAccionLoading(`quote-${idSolicitud}`);
      resetMessages();
      await createCotizacion({
        solicitud_id_solicitud: idSolicitud,
        monto_estimado: monto,
        materiales_incluidos: cotizacion.materiales ?? false,
        mensaje_cotizacion: cotizacion.detalle,
        fecha_vigencia: new Date(`${cotizacion.vigencia}T23:59:00`).toISOString(),
      });

      setSuccess("Cotizacion enviada. El cliente podra revisarla antes de asignar.");
      setCotizaciones((prev) => ({
        ...prev,
        [idSolicitud]: { monto: "", detalle: "", vigencia: "", materiales: false },
      }));
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos enviar la cotizacion al cliente."
      );
    } finally {
      setAccionLoading(null);
    }
  }

  async function handleDescartar(idSolicitud: number) {
    const confirmed = window.confirm(
      "Esta solicitud se ocultara solo para tu cuenta. Deseas continuar?"
    );

    if (!confirmed) return;

    try {
      setAccionLoading(`discard-${idSolicitud}`);
      resetMessages();
      await descartarSolicitud(idSolicitud);
      setSuccess("Solicitud descartada. No volvera a aparecer en tu listado.");
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos descartar la solicitud."
      );
    } finally {
      setAccionLoading(null);
    }
  }

  function openReportModal(solicitud: Solicitud) {
    setReportSolicitud(solicitud);
    setReportForm({
      motivo: reportReasons[0][0],
      descripcion_otro: "",
      comentario: "",
    });
    resetMessages();
  }

  function closeReportModal() {
    setReportSolicitud(null);
  }

  async function handleReportarSolicitud() {
    if (!reportSolicitud) return;

    if (
      reportForm.motivo === "OTRO_MOTIVO" &&
      !reportForm.descripcion_otro.trim()
    ) {
      setError("Describe el motivo para poder enviar el reporte.");
      return;
    }

    try {
      setAccionLoading(`report-${reportSolicitud.id_solicitud}`);
      resetMessages();
      await reportarSolicitud(reportSolicitud.id_solicitud, {
        motivo: reportForm.motivo,
        descripcion_otro: reportForm.descripcion_otro || null,
        comentario: reportForm.comentario || null,
      });
      setSuccess("Reporte enviado. La solicitud quedo oculta para tu cuenta.");
      closeReportModal();
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos reportar la solicitud."
      );
    } finally {
      setAccionLoading(null);
    }
  }

  const verificationState =
    technicianProfile?.estado_verificacion ||
    (technicianProfile?.tecnico_verificado ? "APROBADO" : "PENDIENTE");
  const isTechnicianApproved =
    Boolean(technicianProfile?.tecnico_verificado) &&
    verificationState === "APROBADO";

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Panel de trabajos tecnicos
          </h1>
          <p className="mt-2 text-gray-600">
            Cotiza solicitudes compatibles y gestiona los trabajos asignados.
          </p>
        </div>

        {!loading && technicianProfile && !isTechnicianApproved && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <div className="flex items-start gap-3">
              <Clock className="mt-1 h-6 w-6 text-amber-700" />
              <div>
                <p className="text-lg font-bold">
                  Perfil tecnico {getVerificationLabel(verificationState).toLowerCase()}
                </p>
                <p className="mt-2 text-sm leading-6">
                  Puedes revisar tu panel, pero aun no puedes cotizar,
                  descartar, reportar ni tomar trabajos hasta que un
                  administrador apruebe tu perfil tecnico.
                </p>
                {technicianProfile.observacion_admin && (
                  <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm font-medium">
                    {technicianProfile.observacion_admin}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 grid gap-6 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <ClipboardList className="h-6 w-6 text-blue-700" />
            <p className="mt-4 text-3xl font-bold text-gray-900">
              {solicitudesDisponibles.length}
            </p>
            <p className="text-sm font-medium text-gray-500">
              Solicitudes disponibles
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <Briefcase className="h-6 w-6 text-yellow-700" />
            <p className="mt-4 text-3xl font-bold text-gray-900">
              {solicitudesActivas.length}
            </p>
            <p className="text-sm font-medium text-gray-500">Trabajos activos</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <CheckCircle className="h-6 w-6 text-green-700" />
            <p className="mt-4 text-3xl font-bold text-gray-900">
              {solicitudesFinalizadas.length}
            </p>
            <p className="text-sm font-medium text-gray-500">Finalizadas</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Rating</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {metrics?.promedio_calificacion ?? 0}
            </p>
            <p className="text-xs text-gray-500">
              {metrics?.total_resenas ?? 0} resenas
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
              Envia cotizaciones, descarta solicitudes que no te interesen o
              reporta casos sospechosos.
            </p>
          </div>

          <button
            type="button"
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
            Cargando trabajos y solicitudes...
          </div>
        ) : (
          <>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Solicitudes Disponibles
              </h3>

              {solicitudesDisponibles.length === 0 ? (
                <EmptyState
                  title="Aun no hay solicitudes disponibles para cotizar"
                  description="Cuando exista una solicitud compatible con tus servicios y comunas, aparecera aqui."
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

                      <AvailabilitySummary solicitud={solicitud} />

                      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <h5 className="mb-3 font-semibold text-gray-900">
                          Realizar cotizacion
                        </h5>
                        <div className="grid gap-3">
                          <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
                              $
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatMilesCL(
                                cotizaciones[solicitud.id_solicitud]?.monto || ""
                              )}
                              onChange={(event) =>
                                // Guardamos solo dígitos (pesos), sin separadores.
                                updateCotizacion(solicitud.id_solicitud, {
                                  monto: soloDigitos(event.target.value),
                                })
                              }
                              placeholder="Monto estimado (ej: 20.000)"
                              className="w-full rounded-xl border border-gray-300 py-3 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>
                          <textarea
                            value={cotizaciones[solicitud.id_solicitud]?.detalle || ""}
                            onChange={(event) =>
                              updateCotizacion(solicitud.id_solicitud, {
                                detalle: event.target.value,
                              })
                            }
                            rows={3}
                            placeholder="Detalle, alcance o condiciones"
                            className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={
                                cotizaciones[solicitud.id_solicitud]?.materiales ??
                                false
                              }
                              onChange={(event) =>
                                updateCotizacion(solicitud.id_solicitud, {
                                  materiales: event.target.checked,
                                })
                              }
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            El monto incluye los materiales
                          </label>
                          <input
                            type="date"
                            value={cotizaciones[solicitud.id_solicitud]?.vigencia || ""}
                            onChange={(event) =>
                              updateCotizacion(solicitud.id_solicitud, {
                                vigencia: event.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleCrearCotizacion(solicitud.id_solicitud)
                            }
                            disabled={
                              accionLoading === `quote-${solicitud.id_solicitud}`
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-300"
                          >
                            <Send className="h-5 w-5" />
                            {accionLoading === `quote-${solicitud.id_solicitud}`
                              ? "Enviando cotizacion..."
                              : "Realizar cotizacion"}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => handleDescartar(solicitud.id_solicitud)}
                          disabled={
                            accionLoading === `discard-${solicitud.id_solicitud}`
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:text-slate-400"
                        >
                          <Trash2 className="h-4 w-4" />
                          No me interesa
                        </button>
                        <button
                          type="button"
                          onClick={() => openReportModal(solicitud)}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700 hover:text-rose-800"
                        >
                          <Flag className="h-4 w-4" />
                          Reportar solicitud
                        </button>
                      </div>
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
                  title="Aun no tienes trabajos asignados"
                  description="Cuando un cliente acepte una cotizacion tuya, el trabajo aparecera aqui."
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
                            <strong>Costo final:</strong>{" "}
                            {formatCLP(solicitud.costo_final)}
                          </p>
                        )}
                      </div>

                      <AvailabilitySummary solicitud={solicitud} />

                      {solicitud.estado_trabajo !== "CANCELADO" && (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() =>
                              setChatSolicitudId(
                                chatSolicitudId === solicitud.id_solicitud
                                  ? null
                                  : solicitud.id_solicitud
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-100"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {chatSolicitudId === solicitud.id_solicitud
                              ? "Ocultar chat"
                              : "Chat con el cliente"}
                          </button>
                          {chatSolicitudId === solicitud.id_solicitud &&
                            usuario && (
                              <div className="mt-3">
                                <ChatPanel
                                  idSolicitud={solicitud.id_solicitud}
                                  miRut={usuario.rut}
                                  nombreContraparte="Cliente"
                                />
                              </div>
                            )}
                        </div>
                      )}

                      {solicitud.estado_trabajo === "FINALIZADO" &&
                        solicitud.archivo_comprobante_url && (
                          <a
                            href={getUploadUrl(solicitud.archivo_comprobante_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            Descargar comprobante
                          </a>
                        )}

                      {isTechnicianApproved &&
                        (solicitud.estado_trabajo === "ASIGNADO" ||
                          solicitud.estado_trabajo === "EN_PROCESO") && (
                          <button
                            type="button"
                            onClick={() => abrirCambioAlcance(solicitud)}
                            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 hover:bg-amber-100"
                          >
                            <Flag className="h-4 w-4" />
                            Solicitar cambio de alcance
                          </button>
                        )}

                      {solicitud.estado_trabajo === "CAMBIO_ALCANCE" && (
                        <div className="mt-3 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                          <Flag className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>
                            Enviaste una nueva cotización por cambio de alcance.
                            El trabajo continuará cuando el cliente la acepte, o
                            se cancelará si la rechaza.
                          </span>
                        </div>
                      )}

                      {isTechnicianApproved && solicitud.estado_trabajo === "ASIGNADO" && (
                        <button
                          type="button"
                          onClick={() => handleIniciar(solicitud.id_solicitud)}
                          disabled={
                            accionLoading === `start-${solicitud.id_solicitud}`
                          }
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                        >
                          <PlayCircle className="h-5 w-5" />
                          {accionLoading === `start-${solicitud.id_solicitud}`
                            ? "Iniciando trabajo..."
                            : "Iniciar trabajo asignado"}
                        </button>
                      )}

                      {isTechnicianApproved && solicitud.estado_trabajo === "EN_PROCESO" && (
                        <div className="mt-4 space-y-3">
                          <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
                              $
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatMilesCL(
                                costosFinales[solicitud.id_solicitud] || ""
                              )}
                              onChange={(event) =>
                                setCostosFinales((prev) => ({
                                  ...prev,
                                  [solicitud.id_solicitud]: soloDigitos(
                                    event.target.value
                                  ),
                                }))
                              }
                              placeholder="Costo final total (ej: 45.000)"
                              className="w-full rounded-xl border border-gray-300 py-3 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>

                          <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
                              $
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatMilesCL(
                                finalizarExtra[solicitud.id_solicitud]?.materiales ||
                                  ""
                              )}
                              onChange={(e) =>
                                updateFinalizar(solicitud.id_solicitud, {
                                  materiales: soloDigitos(e.target.value),
                                })
                              }
                              placeholder="Valor materiales (opcional)"
                              className="w-full rounded-xl border border-gray-300 py-3 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>

                          <input
                            type="text"
                            value={
                              finalizarExtra[solicitud.id_solicitud]?.metodo || ""
                            }
                            onChange={(e) =>
                              updateFinalizar(solicitud.id_solicitud, {
                                metodo: e.target.value,
                              })
                            }
                            placeholder="Método de pago (ej: Efectivo, Transferencia)"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />

                          <input
                            type="text"
                            value={
                              finalizarExtra[solicitud.id_solicitud]?.garantia || ""
                            }
                            onChange={(e) =>
                              updateFinalizar(solicitud.id_solicitud, {
                                garantia: e.target.value,
                              })
                            }
                            placeholder="Garantía (ej: 30 días sobre la reparación)"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />

                          <textarea
                            value={
                              finalizarExtra[solicitud.id_solicitud]
                                ?.observaciones || ""
                            }
                            onChange={(e) =>
                              updateFinalizar(solicitud.id_solicitud, {
                                observaciones: e.target.value,
                              })
                            }
                            rows={2}
                            placeholder="Observaciones finales (opcional)"
                            className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />

                          <button
                            type="button"
                            onClick={() => handleFinalizar(solicitud.id_solicitud)}
                            disabled={
                              accionLoading === `finish-${solicitud.id_solicitud}`
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-green-300"
                          >
                            <CheckCircle className="h-5 w-5" />
                            {accionLoading === `finish-${solicitud.id_solicitud}`
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

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              Mis cotizaciones enviadas
            </h3>
            {misCotizaciones.length === 0 ? (
              <EmptyState
                title="Aun no has enviado cotizaciones"
                description="Cuando cotices una solicitud disponible, podras seguir aqui su estado (pendiente, aceptada o rechazada)."
                icon={ClipboardList}
              />
            ) : (
              <div className="space-y-3">
                {misCotizaciones.map((cot) => {
                  // Una cotización ENVIADA con vigencia vencida se ve como Expirada
                  // (mismo criterio que el cliente), aunque el backend aún no la marque.
                  const cotExpirada =
                    cot.estado_cotizacion === "ENVIADA" &&
                    new Date(cot.fecha_vigencia).getTime() < Date.now();
                  return (
                  <div
                    key={cot.id_cotizacion}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        Solicitud #{cot.solicitud_id_solicitud}
                      </p>
                      <p className="text-sm text-slate-500">
                        Monto estimado: {formatCLP(cot.monto_estimado)} ·{" "}
                        {cot.materiales_incluidos
                          ? "materiales incluidos"
                          : "materiales no incluidos"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {cot.archivo_pdf_url && (
                        <a
                          href={getUploadUrl(cot.archivo_pdf_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-indigo-600 underline-offset-2 hover:underline"
                        >
                          Ver PDF
                        </a>
                      )}
                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                          cotExpirada
                            ? "bg-slate-200 text-slate-600"
                            : cot.estado_cotizacion === "ACEPTADA"
                            ? "bg-emerald-100 text-emerald-700"
                            : cot.estado_cotizacion.startsWith("RECHAZADA") ||
                              cot.estado_cotizacion.startsWith("ANULADA")
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {cotExpirada
                          ? "Expirada"
                          : getCotizacionEstadoLabel(cot.estado_cotizacion)}
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </section>
          </>
        )}
      </main>

      <Modal
        open={Boolean(reportSolicitud)}
        title="Reportar solicitud"
        description={reportSolicitud?.titulo_solicitud}
        onClose={closeReportModal}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Motivo
            <select
              value={reportForm.motivo}
              onChange={(event) =>
                setReportForm((prev) => ({
                  ...prev,
                  motivo: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {reportReasons.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {reportForm.motivo === "OTRO_MOTIVO" && (
            <label className="block text-sm font-semibold text-slate-700">
              Describe el motivo
              <textarea
                value={reportForm.descripcion_otro}
                onChange={(event) =>
                  setReportForm((prev) => ({
                    ...prev,
                    descripcion_otro: event.target.value,
                  }))
                }
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </label>
          )}

          <label className="block text-sm font-semibold text-slate-700">
            Comentario opcional
            <textarea
              value={reportForm.comentario}
              onChange={(event) =>
                setReportForm((prev) => ({
                  ...prev,
                  comentario: event.target.value,
                }))
              }
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </label>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={closeReportModal}
              className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleReportarSolicitud}
              disabled={
                Boolean(reportSolicitud) &&
                accionLoading === `report-${reportSolicitud?.id_solicitud}`
              }
              className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-rose-300"
            >
              Enviar reporte
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(cambioTarget)}
        onClose={() => (cambioLoading ? null : setCambioTarget(null))}
        title="Solicitar cambio de alcance"
        description="Se anulará la cotización aceptada (se conserva el historial) y se enviará una nueva al cliente para su aprobación."
        maxWidth="xl"
      >
        {cambioTarget && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Motivo del cambio
              </label>
              <select
                value={cambioForm.motivoOpcion}
                onChange={(e) =>
                  setCambioForm((p) => ({ ...p, motivoOpcion: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {motivosCambioAlcance.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {cambioForm.motivoOpcion.startsWith("Otro") && (
                <input
                  value={cambioForm.motivoDetalle}
                  onChange={(e) =>
                    setCambioForm((p) => ({
                      ...p,
                      motivoDetalle: e.target.value,
                    }))
                  }
                  placeholder="Escribe el motivo"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Nuevo diagnóstico / descripción del trabajo
              </label>
              <textarea
                value={cambioForm.detalle}
                onChange={(e) =>
                  setCambioForm((p) => ({ ...p, detalle: e.target.value }))
                }
                rows={3}
                placeholder="Ej: El cableado interno de la cocina está quemado; se requiere cambiar el cableado de 3 habitaciones."
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Nuevo valor
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatMilesCL(cambioForm.monto)}
                    onChange={(e) =>
                      setCambioForm((p) => ({
                        ...p,
                        monto: soloDigitos(e.target.value),
                      }))
                    }
                    placeholder="100.000"
                    className="w-full rounded-xl border border-gray-300 py-3 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Nuevo plazo estimado
                </label>
                <input
                  value={cambioForm.plazo}
                  onChange={(e) =>
                    setCambioForm((p) => ({ ...p, plazo: e.target.value }))
                  }
                  placeholder="Ej: 2 días"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={cambioForm.materiales}
                  onChange={(e) =>
                    setCambioForm((p) => ({
                      ...p,
                      materiales: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                El nuevo monto incluye los materiales
              </label>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Vigencia de la nueva cotización
                </label>
                <input
                  type="date"
                  value={cambioForm.vigencia}
                  onChange={(e) =>
                    setCambioForm((p) => ({ ...p, vigencia: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setCambioTarget(null)}
                disabled={cambioLoading}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCambioAlcance}
                disabled={cambioLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:bg-amber-300"
              >
                <Flag className="h-4 w-4" />
                {cambioLoading
                  ? "Enviando..."
                  : "Anular y enviar nueva cotización"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default TecnicoDashboard;
