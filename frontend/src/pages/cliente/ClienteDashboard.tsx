import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Download,
  MapPin,
  PlusCircle,
  Send,
  Star,
  TrendingUp,
  Wrench,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
  createSolicitud,
  getSolicitudesCliente,
} from "../../services/solicitudService";

import type {
  Solicitud,
  SolicitudCreate,
} from "../../services/solicitudService";

import { createReview } from "../../services/reviewService";
import { getComunas, getServicios } from "../../services/catalogService";
import type { Comuna, Servicio } from "../../services/catalogService";
import {
  acceptCotizacion,
  getCotizacionesSolicitud,
  rejectCotizacion,
} from "../../services/cotizacionService";
import type { Cotizacion } from "../../services/cotizacionService";
import API_URL from "../../services/api";
import StatusBadge from "../../components/ui/StatusBadge";


const initialForm = {
  servicio_id_servicio: 0,
  comuna_id_comuna: 0,
  titulo_solicitud: "",
  descripcion_problema: "",
  urgencia: "MEDIA",
  direccion: "",
  tipo_problema: "",
  foto_problema: "",
  ubicacion_problema_referencia: "",
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
      <AlertCircle className="h-3.5 w-3.5" />
      {message}
    </p>
  );
}

function fieldClass(error?: string) {
  return `w-full rounded-xl border px-4 py-3 transition focus:outline-none focus:ring-2 ${
    error
      ? "border-red-300 bg-red-50/40 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
  }`;
}

function ClienteDashboard() {
  const { usuario } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Record<number, Cotizacion[]>>(
    {}
  );
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
  const [creandoSolicitud, setCreandoSolicitud] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [reviewErrors, setReviewErrors] = useState<Record<number, string>>({});

  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [sendingReview, setSendingReview] = useState(false);

  async function cargarCatalogos() {
    try {
      setLoadingCatalogos(true);
      setError("");

      const [serviciosData, comunasData] = await Promise.all([
        getServicios(),
        getComunas(),
      ]);

      const serviciosActivos = serviciosData.filter(
        (servicio) => servicio.estado_servicio
      );

      setServicios(serviciosActivos);
      setComunas(comunasData);
      setForm((prev) => ({
        ...prev,
        servicio_id_servicio:
          prev.servicio_id_servicio || serviciosActivos[0]?.id_servicio || 0,
        comuna_id_comuna:
          prev.comuna_id_comuna || comunasData[0]?.id_comuna || 0,
      }));
    } catch {
      setError("No se pudieron cargar servicios y comunas.");
    } finally {
      setLoadingCatalogos(false);
    }
  }

  async function cargarSolicitudes() {
    if (!usuario?.rut) {
      setLoadingSolicitudes(false);
      return;
    }

    try {
      setLoadingSolicitudes(true);
      setError("");

      const data = await getSolicitudesCliente(usuario.rut);
      setSolicitudes(data);

      const cotizacionesData = await Promise.all(
        data.map(async (solicitud) => {
          try {
            const items = await getCotizacionesSolicitud(
              solicitud.id_solicitud
            );
            return [solicitud.id_solicitud, items] as const;
          } catch {
            return [solicitud.id_solicitud, []] as const;
          }
        })
      );

      setCotizaciones(Object.fromEntries(cotizacionesData));
    } catch {
      setError("No se pudieron cargar tus solicitudes.");
    } finally {
      setLoadingSolicitudes(false);
    }
  }

  useEffect(() => {
    cargarSolicitudes();
  }, [usuario?.rut]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  function handleChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "servicio_id_servicio" || name === "comuna_id_comuna"
          ? Number(value)
          : value,
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usuario?.rut) {
      setError("No se pudo identificar al cliente autenticado.");
      return;
    }

    const nextErrors: Record<string, string> = {};
    if (!form.servicio_id_servicio) nextErrors.servicio_id_servicio = "Selecciona un servicio.";
    if (!form.comuna_id_comuna) nextErrors.comuna_id_comuna = "Selecciona una comuna.";
    if (!form.titulo_solicitud.trim()) nextErrors.titulo_solicitud = "Escribe un titulo breve.";
    if (!form.descripcion_problema.trim()) nextErrors.descripcion_problema = "Describe el problema.";
    if (!form.direccion.trim()) nextErrors.direccion = "Ingresa la direccion.";
    if (!form.tipo_problema.trim()) nextErrors.tipo_problema = "Indica el tipo de problema.";
    if (!form.ubicacion_problema_referencia.trim()) {
      nextErrors.ubicacion_problema_referencia = "Agrega una referencia de ubicacion.";
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("");
      return;
    }

    try {
      setCreandoSolicitud(true);
      setError("");
      setSuccess("");

      const payload: SolicitudCreate = {
        usuario_rut: usuario.rut,
        servicio_id_servicio: form.servicio_id_servicio,
        comuna_id_comuna: form.comuna_id_comuna,
        titulo_solicitud: form.titulo_solicitud,
        descripcion_problema: form.descripcion_problema,
        urgencia: form.urgencia,
        direccion: form.direccion,
        tipo_problema: form.tipo_problema,
        foto_problema: form.foto_problema || null,
        ubicacion_problema_referencia:
          form.ubicacion_problema_referencia,
      };

      await createSolicitud(payload);

      setSuccess("Solicitud creada correctamente.");
      setForm((prev) => ({
        ...initialForm,
        servicio_id_servicio: prev.servicio_id_servicio,
        comuna_id_comuna: prev.comuna_id_comuna,
      }));

      await cargarSolicitudes();
    } catch {
      setError("No se pudo crear la solicitud.");
    } finally {
      setCreandoSolicitud(false);
    }
  }

  async function handleCreateReview(idSolicitud: number) {
    if (!reviewComment.trim()) {
      setReviewErrors((prev) => ({
        ...prev,
        [idSolicitud]: "Escribe un comentario para publicar tu reseña.",
      }));
      return;
    }

    try {
      setSendingReview(true);
      setError("");
      setSuccess("");

      await createReview({
        id_solicitud: idSolicitud,
        calificacion: reviewRating,
        comentario: reviewComment,
      });

      setSuccess("Reseña creada correctamente.");
      setReviewErrors((prev) => ({ ...prev, [idSolicitud]: "" }));
      setReviewComment("");
      setReviewRating(5);
      setReviewingId(null);

      await cargarSolicitudes();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear la reseña."
      );
    } finally {
      setSendingReview(false);
    }
  }

  async function handleCotizacionAction(
    idCotizacion: number,
    action: "accept" | "reject"
  ) {
    try {
      setError("");
      setSuccess("");

      if (action === "accept") {
        await acceptCotizacion(idCotizacion);
        setSuccess("Cotizacion aceptada correctamente.");
      } else {
        await rejectCotizacion(idCotizacion);
        setSuccess("Cotizacion rechazada correctamente.");
      }

      await cargarSolicitudes();
    } catch {
      setError("No se pudo actualizar la cotizacion.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">
            Hola, {usuario?.nombre_completo?.split(" ")[0] || "cliente"}
          </h1>

          <p className="mt-2 text-gray-600">
            Gestiona solicitudes, revisa cotizaciones y califica trabajos finalizados.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <ClipboardList className="h-6 w-6 text-blue-600" />
              <p className="mt-4 text-3xl font-black text-slate-950">{solicitudes.length}</p>
              <p className="text-sm text-slate-500">Solicitudes creadas</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <TrendingUp className="h-6 w-6 text-violet-600" />
              <p className="mt-4 text-3xl font-black text-slate-950">
                {solicitudes.filter((item) => item.estado_trabajo !== "FINALIZADO").length}
              </p>
              <p className="text-sm text-slate-500">En seguimiento</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <p className="mt-4 text-3xl font-black text-slate-950">
                {solicitudes.filter((item) => item.estado_trabajo === "FINALIZADO").length}
              </p>
              <p className="text-sm text-slate-500">Finalizadas</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <PlusCircle className="h-6 w-6 text-blue-700" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Solicitar Servicio
                </h2>

                <p className="text-sm text-gray-500">
                  Registra un problema para buscar ayuda técnica.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
              <select
                name="servicio_id_servicio"
                value={form.servicio_id_servicio}
                onChange={handleChange}
                disabled={loadingCatalogos || servicios.length === 0}
                className={fieldClass(fieldErrors.servicio_id_servicio)}
              >
                {servicios.length === 0 && (
                  <option value={0}>Sin servicios disponibles</option>
                )}
                {servicios.map((servicio) => (
                  <option
                    key={servicio.id_servicio}
                    value={servicio.id_servicio}
                  >
                    {servicio.nombre_servicio}
                  </option>
                ))}
              </select>
              <FieldError message={fieldErrors.servicio_id_servicio} />
              </div>

              <div>
              <select
                name="comuna_id_comuna"
                value={form.comuna_id_comuna}
                onChange={handleChange}
                disabled={loadingCatalogos || comunas.length === 0}
                className={fieldClass(fieldErrors.comuna_id_comuna)}
              >
                {comunas.length === 0 && (
                  <option value={0}>Sin comunas disponibles</option>
                )}
                {comunas.map((comuna) => (
                  <option key={comuna.id_comuna} value={comuna.id_comuna}>
                    {comuna.nombre_comuna}
                  </option>
                ))}
              </select>
              <FieldError message={fieldErrors.comuna_id_comuna} />
              </div>

              <div>
              <input
                name="titulo_solicitud"
                value={form.titulo_solicitud}
                onChange={handleChange}
                placeholder="Título de la solicitud"
                className={fieldClass(fieldErrors.titulo_solicitud)}
              />
              <FieldError message={fieldErrors.titulo_solicitud} />
              </div>

              <div>
              <textarea
                name="descripcion_problema"
                value={form.descripcion_problema}
                onChange={handleChange}
                placeholder="Describe el problema"
                rows={4}
                className={`${fieldClass(fieldErrors.descripcion_problema)} resize-none`}
              />
              <FieldError message={fieldErrors.descripcion_problema} />
              </div>

              <select
                name="urgencia"
                value={form.urgencia}
                onChange={handleChange}
                className={fieldClass()}
              >
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
              </select>

              <div>
              <input
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                placeholder="Dirección"
                className={fieldClass(fieldErrors.direccion)}
              />
              <FieldError message={fieldErrors.direccion} />
              </div>

              <div>
              <input
                name="tipo_problema"
                value={form.tipo_problema}
                onChange={handleChange}
                placeholder="Tipo de problema"
                className={fieldClass(fieldErrors.tipo_problema)}
              />
              <FieldError message={fieldErrors.tipo_problema} />
              </div>

              <input
                name="foto_problema"
                value={form.foto_problema}
                onChange={handleChange}
                placeholder="URL de imagen opcional"
                className={fieldClass()}
              />

              <div>
              <input
                name="ubicacion_problema_referencia"
                value={form.ubicacion_problema_referencia}
                onChange={handleChange}
                placeholder="Referencia de ubicación"
                className={fieldClass(fieldErrors.ubicacion_problema_referencia)}
              />
              <FieldError message={fieldErrors.ubicacion_problema_referencia} />
              </div>

              <button
                type="submit"
                disabled={
                  creandoSolicitud ||
                  loadingCatalogos ||
                  servicios.length === 0 ||
                  comunas.length === 0
                }
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
              >
                {creandoSolicitud ? "Creando solicitud..." : "Crear solicitud"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <ClipboardList className="h-6 w-6 text-green-700" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Mis Solicitudes
                </h2>
                <p className="text-sm text-gray-500">
                  Historial de solicitudes creadas por tu cuenta.
                </p>
              </div>
            </div>

            {loadingSolicitudes ? (
              <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-600">
                Cargando solicitudes...
              </div>
            ) : solicitudes.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-600">
                Aún no tienes solicitudes registradas.
              </div>
            ) : (
              <div className="space-y-4">
                {solicitudes.map((solicitud) => (
                  <div
                    key={solicitud.id_solicitud}
                    className="rounded-2xl border border-gray-200 p-5"
                  >
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {solicitud.titulo_solicitud}
                        </h3>

                        <p className="mt-1 text-sm text-gray-600">
                          {solicitud.descripcion_problema}
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {solicitud.estado_trabajo}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
                      <p className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-gray-400" />
                        {servicios.find(
                          (servicio) =>
                            servicio.id_servicio ===
                            solicitud.servicio_id_servicio
                        )?.nombre_servicio ||
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

                    {(cotizaciones[solicitud.id_solicitud]?.length || 0) > 0 && (
                      <div className="mt-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 p-4">
                        <h4 className="mb-3 flex items-center gap-2 font-bold text-gray-900">
                          <ClipboardList className="h-5 w-5 text-blue-700" />
                          Cotizaciones recibidas
                        </h4>

                        <div className="space-y-3">
                          {cotizaciones[solicitud.id_solicitud].map(
                            (cotizacion) => (
                              <div
                                key={cotizacion.id_cotizacion}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                              >
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                      Cotizacion #{cotizacion.id_cotizacion}
                                    </p>
                                    <p className="mt-1 text-3xl font-bold text-slate-950">
                                      ${Number(cotizacion.monto_estimado).toLocaleString("es-CL")}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600">
                                      {cotizacion.mensaje_cotizacion}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                      Tecnico:{" "}
                                      {cotizacion.tecnico_usuario_rut}
                                    </p>
                                  </div>

                                  <StatusBadge status={cotizacion.estado_cotizacion} />
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                  {cotizacion.archivo_pdf_url && (
                                    <a
                                      href={`${API_URL}${cotizacion.archivo_pdf_url}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
                                    >
                                      <Download className="h-4 w-4" />
                                      PDF
                                    </a>
                                  )}

                                  {cotizacion.estado_cotizacion ===
                                    "ENVIADA" && (
                                    <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCotizacionAction(
                                          cotizacion.id_cotizacion,
                                          "accept"
                                        )
                                      }
                                      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
                                    >
                                      Aceptar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCotizacionAction(
                                          cotizacion.id_cotizacion,
                                          "reject"
                                        )
                                      }
                                      className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                                    >
                                      Rechazar
                                    </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {solicitud.estado_trabajo === "FINALIZADO" && (
                      <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <div>
                            <h4 className="font-bold text-gray-900">
                              Califica el servicio
                            </h4>

                            <p className="text-sm text-gray-600">
                              Comparte tu experiencia con el técnico.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setReviewingId(
                                reviewingId === solicitud.id_solicitud
                                  ? null
                                  : solicitud.id_solicitud
                              )
                            }
                            className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
                          >
                            {reviewingId === solicitud.id_solicitud
                              ? "Cerrar"
                              : "⭐ Dejar reseña"}
                          </button>
                        </div>

                        {reviewingId === solicitud.id_solicitud && (
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => setReviewRating(value)}
                                >
                                  <Star
                                    className={`h-7 w-7 ${
                                      value <= reviewRating
                                        ? "fill-yellow-500 text-yellow-500"
                                        : "text-gray-300"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>

                            <textarea
                              value={reviewComment}
                              onChange={(event) => {
                                setReviewComment(event.target.value);
                                setReviewErrors((prev) => ({
                                  ...prev,
                                  [solicitud.id_solicitud]: "",
                                }));
                              }}
                              rows={4}
                              placeholder="Describe cómo fue el servicio recibido"
                              className={`${fieldClass(reviewErrors[solicitud.id_solicitud])} resize-none`}
                            />
                            <FieldError message={reviewErrors[solicitud.id_solicitud]} />

                            <button
                              type="button"
                              onClick={() =>
                                handleCreateReview(solicitud.id_solicitud)
                              }
                              disabled={sendingReview}
                              className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:bg-green-300"
                            >
                              <Send className="h-4 w-4" />

                              {sendingReview
                                ? "Enviando reseña..."
                                : "Publicar reseña"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default ClienteDashboard;
