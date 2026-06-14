import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  ClipboardList,
  FileText,
  MapPin,
  PlayCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Upload,
  Wrench,
  XCircle,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import EmptyState from "../../components/ui/EmptyState";
import { useAuth } from "../../context/AuthContext";
import API_URL from "../../services/api";
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
  getTechnicianDocuments,
  getTechnicianDashboard,
  getTechnicianProfile,
  uploadTechnicianDocument,
  type DocumentoTecnico,
  type Tecnico,
  type TecnicoDashboardMetrics,
  type TipoEvidenciaTecnica,
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

const evidenceOptions: Array<{ value: TipoEvidenciaTecnica; label: string }> = [
  { value: "CERTIFICADO", label: "Certificado" },
  { value: "TITULO", label: "Título" },
  { value: "CURSO", label: "Curso" },
  { value: "LICENCIA", label: "Licencia" },
  { value: "FOTO_TRABAJO", label: "Fotos de trabajos anteriores" },
  { value: "REFERENCIA_LABORAL", label: "Referencias laborales" },
  { value: "PORTAFOLIO", label: "Portafolio" },
  { value: "EXPERIENCIA_OFICIO", label: "Evidencia de experiencia en oficio" },
  { value: "OTRO", label: "Otra evidencia relevante" },
];

function getVerificationLabel(status?: string, verified?: boolean) {
  if (verified) return "Perfil verificado";
  if (status === "EN_REVISION") return "En revisión";
  if (status === "OBSERVADO") return "Necesitamos más información";
  if (status === "RECHAZADO") return "Verificación rechazada";
  return "Evidencias pendientes";
}

function getEvidenceLabel(tipo: string) {
  return evidenceOptions.find((item) => item.value === tipo)?.label || tipo;
}

function getEvidenceStatus(doc: DocumentoTecnico) {
  if (doc.estado_revision === "APROBADO") {
    return {
      label: "Aprobada",
      className: "bg-[#DDEADF] text-[#2F5F46]",
      icon: CheckCircle,
    };
  }

  if (doc.estado_revision === "RECHAZADO") {
    return {
      label: "Rechazada",
      className: "bg-red-50 text-red-700",
      icon: XCircle,
    };
  }

  return {
    label: "Pendiente de revisión",
    className: "bg-[#FFF4D8] text-[#8C5F1D]",
    icon: FileText,
  };
}

function TecnicoDashboard() {
  const { usuario } = useAuth();

  const [solicitudesDisponibles, setSolicitudesDisponibles] = useState<
    Solicitud[]
  >([]);
  const [misSolicitudes, setMisSolicitudes] = useState<Solicitud[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [metrics, setMetrics] = useState<TecnicoDashboardMetrics | null>(null);
  const [perfilTecnico, setPerfilTecnico] = useState<Tecnico | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoTecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [accionLoading, setAccionLoading] = useState<number | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tipoEvidencia, setTipoEvidencia] =
    useState<TipoEvidenciaTecnica>("EXPERIENCIA_OFICIO");
  const [archivoEvidencia, setArchivoEvidencia] = useState<File | null>(null);
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

      const [
        todas,
        asignadas,
        serviciosData,
        metricasData,
        perfilData,
        documentosData,
      ] = await Promise.all([
        getSolicitudes(),
        getSolicitudesTecnico(usuario.rut),
        getServicios(),
        getTechnicianDashboard(usuario.rut),
        getTechnicianProfile(usuario.rut),
        getTechnicianDocuments(usuario.rut),
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
      setPerfilTecnico(perfilData);
      setDocumentos(documentosData);
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

  const evidenciasAprobadas = documentos.filter(
    (documento) => documento.estado_revision === "APROBADO"
  ).length;

  const evidenciasPendientes = documentos.filter(
    (documento) => documento.estado_revision === "PENDIENTE_REVISION"
  ).length;

  const tecnicoPuedeTomarTrabajos = Boolean(perfilTecnico?.tecnico_verificado);

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

  async function handleUploadEvidence(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usuario?.rut) {
      setError("Necesitamos reconocer tu sesión para subir la evidencia.");
      return;
    }

    if (!archivoEvidencia) {
      setError("Selecciona un archivo en PDF, JPG o PNG para revisar tu perfil.");
      return;
    }

    try {
      setUploadingEvidence(true);
      setError("");
      setSuccess("");

      await uploadTechnicianDocument({
        tecnico_usuario_rut: usuario.rut,
        tipo_documento: tipoEvidencia,
        archivo: archivoEvidencia,
      });

      setArchivoEvidencia(null);
      setSuccess("Tu evidencia fue enviada y está pendiente de revisión.");
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos subir tu evidencia. Intenta nuevamente."
      );
    } finally {
      setUploadingEvidence(false);
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

        <section className="fixya-card mb-8 rounded-lg p-6">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8F5EF] text-[#123F66]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-[#C8872D]">
                    Verificación profesional
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#0E1B2A]">
                    {getVerificationLabel(
                      perfilTecnico?.estado_verificacion,
                      perfilTecnico?.tecnico_verificado
                    )}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#5F6B7A]">
                    {perfilTecnico?.observacion_verificacion ||
                      "Sube certificados, cursos, fotos de trabajos, referencias o portafolio para que administración revise tu perfil."}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-[#F8F5EF] p-4">
                  <p className="text-2xl font-black text-[#0E1B2A]">
                    {documentos.length}
                  </p>
                  <p className="text-sm text-[#5F6B7A]">Evidencias subidas</p>
                </div>
                <div className="rounded-lg bg-[#DDEADF] p-4">
                  <p className="text-2xl font-black text-[#2F5F46]">
                    {evidenciasAprobadas}
                  </p>
                  <p className="text-sm text-[#2F5F46]">Aprobadas</p>
                </div>
                <div className="rounded-lg bg-[#FFF4D8] p-4">
                  <p className="text-2xl font-black text-[#8C5F1D]">
                    {evidenciasPendientes}
                  </p>
                  <p className="text-sm text-[#8C5F1D]">Pendientes</p>
                </div>
              </div>

              {!tecnicoPuedeTomarTrabajos && (
                <div className="mt-4 rounded-xl border border-[#E6E0D6] bg-[#FFF8EA] p-4 text-sm leading-6 text-[#8C5F1D]">
                  Cuando tu perfil sea aprobado podrás aparecer en el catálogo y
                  tomar servicios disponibles.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <form
                onSubmit={handleUploadEvidence}
                className="rounded-lg border border-[#E6E0D6] bg-white p-4"
              >
                <h3 className="font-black text-[#102033]">
                  Subir nueva evidencia
                </h3>
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase text-[#5F6B7A]">
                      Tipo
                    </label>
                    <select
                      value={tipoEvidencia}
                      onChange={(event) =>
                        setTipoEvidencia(event.target.value as TipoEvidenciaTecnica)
                      }
                      className="fixya-input"
                    >
                      {evidenceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase text-[#5F6B7A]">
                      Archivo
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(event) =>
                        setArchivoEvidencia(event.target.files?.[0] || null)
                      }
                      className="fixya-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={uploadingEvidence}
                    className="fixya-btn-accent px-4 py-3 text-sm disabled:opacity-60"
                  >
                    <Upload className="h-4 w-4" />
                    {uploadingEvidence ? "Enviando..." : "Enviar"}
                  </button>
                </div>
              </form>

              {documentos.length === 0 ? (
                <EmptyState
                  title="Aún no has subido evidencias"
                  description="Puedes usar documentos formales o evidencia práctica de tu experiencia en oficio."
                  icon={FileText}
                />
              ) : (
                <div className="space-y-3">
                  {documentos.map((documento) => {
                    const status = getEvidenceStatus(documento);
                    const Icon = status.icon;

                    return (
                      <article
                        key={documento.id_documento}
                        className="rounded-lg border border-[#E6E0D6] bg-white p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-black text-[#102033]">
                              {getEvidenceLabel(documento.tipo_documento)}
                            </p>
                            <a
                              href={`${API_URL}${documento.archivo_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex text-sm font-semibold text-[#123F66] hover:text-[#C8872D]"
                            >
                              {documento.nombre_archivo}
                            </a>
                          </div>
                          <span
                            className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${status.className}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {status.label}
                          </span>
                        </div>
                        {documento.observacion_revision && (
                          <p className="mt-3 rounded-lg bg-[#F8F5EF] p-3 text-sm leading-6 text-[#5F6B7A]">
                            {documento.observacion_revision}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

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

              {!tecnicoPuedeTomarTrabajos ? (
                <EmptyState
                  title="Completa tu verificación para tomar servicios"
                  description="Administración debe revisar tus evidencias antes de que puedas aceptar solicitudes disponibles."
                  icon={ShieldCheck}
                />
              ) : solicitudesDisponibles.length === 0 ? (
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
