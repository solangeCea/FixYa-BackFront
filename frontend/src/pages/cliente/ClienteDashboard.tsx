import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Download,
  ImagePlus,
  MapPin,
  PlusCircle,
  Send,
  Star,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
  createSolicitud,
  getSolicitudesCliente,
  uploadSolicitudFoto,
} from "../../services/solicitudService";

import type {
  Solicitud,
  SolicitudCreate,
} from "../../services/solicitudService";

import { createReview } from "../../services/reviewService";
import { getComunas, getRegiones, getServicios } from "../../services/catalogService";
import type { Comuna, Region, Servicio } from "../../services/catalogService";
import {
  acceptCotizacion,
  getCotizacionesSolicitud,
  rejectCotizacion,
} from "../../services/cotizacionService";
import type { Cotizacion } from "../../services/cotizacionService";
import API_URL from "../../services/api";
import EmptyState from "../../components/ui/EmptyState";
import RequestProgress from "../../components/ui/RequestProgress";
import StatusBadge from "../../components/ui/StatusBadge";
import { getSolicitudStatusLabel } from "../../utils/requestStatus";


const initialForm = {
  servicio_id_servicio: 0,
  region_id_region: 0,
  comuna_id_comuna: 0,
  titulo_solicitud: "",
  descripcion_problema: "",
  urgencia: "MEDIA",
  direccion: "",
  tipo_problema: "",
  foto_problema: "",
  ubicacion_problema_referencia: "",
};

const problemOptionsByService = {
  electricidad: [
    "Enchufe",
    "Cables",
    "Iluminación",
    "Electrodomésticos",
    "Cortocircuito",
    "Otro",
  ],
  gasfiteria: [
    "Fuga de agua",
    "Cañería",
    "Baño",
    "Lavaplatos",
    "Calefont",
    "Otro",
  ],
  carpinteria: [
    "Puerta",
    "Mueble",
    "Repisa",
    "Piso",
    "Estructura de madera",
    "Otro",
  ],
  cerrajeria: [
    "Cerradura",
    "Llave",
    "Chapa",
    "Apertura de puerta",
    "Cambio de cilindro",
    "Otro",
  ],
  techumbre: [
    "Gotera",
    "Filtración",
    "Planchas de zinc",
    "Canaletas",
    "Aislación",
    "Otro",
  ],
  pintura: [
    "Pintura interior",
    "Pintura exterior",
    "Reparación de muro",
    "Estuco",
    "Humedad",
    "Otro",
  ],
  albanileria: [
    "Muro",
    "Grietas",
    "Radier",
    "Estuco",
    "Ampliación",
    "Otro",
  ],
  jardineria: [
    "Poda",
    "Corte de pasto",
    "Riego",
    "Diseño de jardín",
    "Mantención",
    "Otro",
  ],
};

function normalizeServiceName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getProblemOptions(servicio?: Servicio) {
  if (!servicio) return [];

  const normalizedName = normalizeServiceName(servicio.nombre_servicio);

  if (normalizedName.includes("electric")) {
    return problemOptionsByService.electricidad;
  }

  if (normalizedName.includes("gasfiter")) {
    return problemOptionsByService.gasfiteria;
  }

  if (normalizedName.includes("carpinter")) {
    return problemOptionsByService.carpinteria;
  }

  if (normalizedName.includes("cerrajer")) {
    return problemOptionsByService.cerrajeria;
  }

  if (normalizedName.includes("techumbre")) {
    return problemOptionsByService.techumbre;
  }

  if (normalizedName.includes("pintur")) {
    return problemOptionsByService.pintura;
  }

  if (normalizedName.includes("albani")) {
    return problemOptionsByService.albanileria;
  }

  if (normalizedName.includes("jardin")) {
    return problemOptionsByService.jardineria;
  }

  return ["Otro"];
}

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
      : "border-slate-300 bg-white focus:border-teal-600 focus:ring-teal-100"
  }`;
}

function ClienteDashboard() {
  const { usuario } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedServicioId = Number(searchParams.get("servicio") || 0);
  const requestedComunaId = Number(searchParams.get("comuna") || 0);

  const [form, setForm] = useState(initialForm);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Record<number, Cotizacion[]>>(
    {}
  );
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
  const [creandoSolicitud, setCreandoSolicitud] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [reviewErrors, setReviewErrors] = useState<Record<number, string>>({});

  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [sendingReview, setSendingReview] = useState(false);

  const selectedServicio = useMemo(
    () =>
      servicios.find(
        (servicio) => servicio.id_servicio === form.servicio_id_servicio
      ),
    [servicios, form.servicio_id_servicio]
  );

  const tipoProblemaOptions = useMemo(
    () => getProblemOptions(selectedServicio),
    [selectedServicio]
  );

  // La comuna depende de la región seleccionada: se reutiliza la relación
  // existente Comuna.region_id_region sin nuevas tablas ni endpoints.
  const comunasFiltradas = useMemo(
    () =>
      comunas.filter(
        (comuna) => comuna.region_id_region === form.region_id_region
      ),
    [comunas, form.region_id_region]
  );

  async function cargarCatalogos() {
    try {
      setLoadingCatalogos(true);
      setError("");

      const [serviciosData, regionesData, comunasData] = await Promise.all([
        getServicios(),
        getRegiones(),
        getComunas(),
      ]);

      const serviciosActivos = serviciosData.filter(
        (servicio) => servicio.estado_servicio
      );

      setServicios(serviciosActivos);
      setRegiones(regionesData);
      setComunas(comunasData);
      // La región y la comuna no se preseleccionan: el usuario elige primero
      // la región y recién entonces se habilitan sus comunas.
      setForm((prev) => ({
        ...prev,
        servicio_id_servicio:
          prev.servicio_id_servicio || serviciosActivos[0]?.id_servicio || 0,
      }));
    } catch {
      setError(
        "No pudimos cargar servicios y comunas. Intenta actualizar la página antes de crear tu solicitud."
      );
    } finally {
      setLoadingCatalogos(false);
    }
  }

  const cargarSolicitudes = useCallback(async () => {
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
      setError(
        "No pudimos cargar tus solicitudes. Intenta nuevamente en unos momentos."
      );
    } finally {
      setLoadingSolicitudes(false);
    }
  }, [usuario]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (loadingCatalogos || (!requestedServicioId && !requestedComunaId)) {
      return;
    }

    setForm((prev) => {
      const nextServicioId = servicios.some(
        (servicio) => servicio.id_servicio === requestedServicioId
      )
        ? requestedServicioId
        : prev.servicio_id_servicio;

      // Si llega una comuna por parámetro, también fijamos su región para
      // respetar la dependencia región -> comuna.
      const requestedComuna = comunas.find(
        (comuna) => comuna.id_comuna === requestedComunaId
      );

      return {
        ...prev,
        servicio_id_servicio: nextServicioId,
        region_id_region: requestedComuna
          ? requestedComuna.region_id_region
          : prev.region_id_region,
        comuna_id_comuna: requestedComuna
          ? requestedComuna.id_comuna
          : prev.comuna_id_comuna,
        tipo_problema:
          nextServicioId !== prev.servicio_id_servicio
            ? ""
            : prev.tipo_problema,
      };
    });
  }, [
    loadingCatalogos,
    requestedServicioId,
    requestedComunaId,
    servicios,
    comunas,
  ]);

  function handleChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    const numericFields = [
      "servicio_id_servicio",
      "region_id_region",
      "comuna_id_comuna",
    ];

    setForm((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
      ...(name === "servicio_id_servicio" ? { tipo_problema: "" } : {}),
      // Al cambiar la región se limpia la comuna seleccionada.
      ...(name === "region_id_region" ? { comuna_id_comuna: 0 } : {}),
    }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
      ...(name === "servicio_id_servicio" ? { tipo_problema: "" } : {}),
      ...(name === "region_id_region" ? { comuna_id_comuna: "" } : {}),
    }));
  }

  async function handleFotoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    // Permite reintentar con el mismo archivo si hubo error.
    event.target.value = "";

    if (!file) return;

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
    if (!tiposPermitidos.includes(file.type)) {
      setFieldErrors((prev) => ({
        ...prev,
        foto_problema: "La imagen debe ser JPG, PNG o WEBP.",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        foto_problema: "La imagen no debe superar los 5 MB.",
      }));
      return;
    }

    try {
      setSubiendoFoto(true);
      setFieldErrors((prev) => ({ ...prev, foto_problema: "" }));

      const { archivo_url } = await uploadSolicitudFoto(file);
      setForm((prev) => ({ ...prev, foto_problema: archivo_url }));
    } catch (err) {
      setFieldErrors((prev) => ({
        ...prev,
        foto_problema:
          err instanceof Error
            ? err.message
            : "No pudimos subir la imagen. Intenta nuevamente.",
      }));
    } finally {
      setSubiendoFoto(false);
    }
  }

  function handleRemoveFoto() {
    setForm((prev) => ({ ...prev, foto_problema: "" }));
    setFieldErrors((prev) => ({ ...prev, foto_problema: "" }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usuario?.rut) {
      setError(
        "Necesitamos reconocer tu sesión para crear la solicitud. Inicia sesión nuevamente."
      );
      return;
    }

    const nextErrors: Record<string, string> = {};
    if (!form.servicio_id_servicio) nextErrors.servicio_id_servicio = "Selecciona un servicio.";
    if (!form.region_id_region) nextErrors.region_id_region = "Selecciona una región.";
    if (!form.comuna_id_comuna) nextErrors.comuna_id_comuna = "Selecciona una comuna.";
    if (!form.titulo_solicitud.trim()) nextErrors.titulo_solicitud = "Escribe un título breve para tu solicitud.";
    if (!form.descripcion_problema.trim()) nextErrors.descripcion_problema = "Describe qué ocurre para orientar al técnico.";
    if (!form.direccion.trim()) nextErrors.direccion = "Ingresa la dirección donde necesitas el servicio.";
    if (!form.tipo_problema.trim()) nextErrors.tipo_problema = "Selecciona el tipo de problema según el servicio.";
    if (!form.ubicacion_problema_referencia.trim()) {
      nextErrors.ubicacion_problema_referencia = "Agrega una referencia para ubicar mejor el problema.";
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

      setSuccess(
        "Solicitud enviada correctamente. Podrás seguir su avance desde Mis solicitudes."
      );
      setForm((prev) => ({
        ...initialForm,
        servicio_id_servicio: prev.servicio_id_servicio,
        region_id_region: prev.region_id_region,
        comuna_id_comuna: prev.comuna_id_comuna,
      }));

      await cargarSolicitudes();
    } catch {
      setError("No pudimos enviar la solicitud. Revisa los datos e inténtalo nuevamente.");
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

      setSuccess("Tu reseña fue publicada correctamente.");
      setReviewErrors((prev) => ({ ...prev, [idSolicitud]: "" }));
      setReviewComment("");
      setReviewRating(5);
      setReviewingId(null);

      await cargarSolicitudes();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos publicar tu reseña. Intenta nuevamente."
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
        setSuccess("Cotización aceptada. El técnico podrá continuar con el servicio.");
      } else {
        await rejectCotizacion(idCotizacion);
        setSuccess("Cotización rechazada. Puedes revisar otras alternativas si existen.");
      }

      await cargarSolicitudes();
    } catch {
      setError("No pudimos actualizar la cotización. Intenta nuevamente.");
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100">
                <PlusCircle className="h-6 w-6 text-teal-700" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Solicitar servicio
                </h2>

                <p className="text-sm text-gray-500">
                  Cuéntanos qué ocurre para buscar ayuda técnica.
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
                <label
                  htmlFor="servicio_id_servicio"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Servicio que necesitas <span className="text-red-500">*</span>
                </label>
                <select
                  id="servicio_id_servicio"
                  name="servicio_id_servicio"
                  value={form.servicio_id_servicio}
                  onChange={handleChange}
                  disabled={loadingCatalogos || servicios.length === 0}
                  className={fieldClass(fieldErrors.servicio_id_servicio)}
                >
                  {servicios.length === 0 && (
                    <option value={0}>No hay servicios disponibles para solicitar</option>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="region_id_region"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Región <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="region_id_region"
                    name="region_id_region"
                    value={form.region_id_region}
                    onChange={handleChange}
                    disabled={loadingCatalogos || regiones.length === 0}
                    className={fieldClass(fieldErrors.region_id_region)}
                  >
                    <option value={0}>Selecciona tu región</option>
                    {regiones.map((region) => (
                      <option key={region.id_region} value={region.id_region}>
                        {region.nombre_region}
                      </option>
                    ))}
                  </select>
                  <FieldError message={fieldErrors.region_id_region} />
                </div>

                <div>
                  <label
                    htmlFor="comuna_id_comuna"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Comuna <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="comuna_id_comuna"
                    name="comuna_id_comuna"
                    value={form.comuna_id_comuna}
                    onChange={handleChange}
                    disabled={
                      loadingCatalogos ||
                      !form.region_id_region ||
                      comunasFiltradas.length === 0
                    }
                    className={fieldClass(fieldErrors.comuna_id_comuna)}
                  >
                    {!form.region_id_region ? (
                      <option value={0}>Primero selecciona una región</option>
                    ) : comunasFiltradas.length === 0 ? (
                      <option value={0}>No hay comunas para esta región</option>
                    ) : (
                      <>
                        <option value={0}>Selecciona tu comuna</option>
                        {comunasFiltradas.map((comuna) => (
                          <option key={comuna.id_comuna} value={comuna.id_comuna}>
                            {comuna.nombre_comuna}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <FieldError message={fieldErrors.comuna_id_comuna} />
                </div>
              </div>

              <div>
                <label
                  htmlFor="titulo_solicitud"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Título breve <span className="text-red-500">*</span>
                </label>
              <input
                id="titulo_solicitud"
                name="titulo_solicitud"
                value={form.titulo_solicitud}
                onChange={handleChange}
                placeholder="Ej: Filtración bajo el lavaplatos"
                className={fieldClass(fieldErrors.titulo_solicitud)}
              />
              <FieldError message={fieldErrors.titulo_solicitud} />
              </div>

              <div>
                <label
                  htmlFor="descripcion_problema"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Describe qué ocurre <span className="text-red-500">*</span>
                </label>
              <textarea
                id="descripcion_problema"
                name="descripcion_problema"
                value={form.descripcion_problema}
                onChange={handleChange}
                placeholder="Describe el problema con el mayor detalle posible"
                rows={4}
                className={`${fieldClass(fieldErrors.descripcion_problema)} resize-none`}
              />
              <FieldError message={fieldErrors.descripcion_problema} />
              </div>

              <div>
                <label
                  htmlFor="urgencia"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Urgencia
                </label>
                <select
                  id="urgencia"
                  name="urgencia"
                  value={form.urgencia}
                  onChange={handleChange}
                  className={fieldClass()}
                >
                  <option value="BAJA">Baja: puede esperar</option>
                  <option value="MEDIA">Media: necesito coordinación pronta</option>
                  <option value="ALTA">Alta: requiere atención urgente</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="direccion"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Dirección <span className="text-red-500">*</span>
                </label>
              <input
                id="direccion"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                placeholder="Ej: Av. Providencia 1234, depto 45"
                className={fieldClass(fieldErrors.direccion)}
              />
              <FieldError message={fieldErrors.direccion} />
              </div>

              <div>
                <label
                  htmlFor="tipo_problema"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Tipo de problema <span className="text-red-500">*</span>
                </label>
                <select
                  id="tipo_problema"
                  name="tipo_problema"
                  value={form.tipo_problema}
                  onChange={handleChange}
                  disabled={
                    !form.servicio_id_servicio ||
                    tipoProblemaOptions.length === 0
                  }
                  className={fieldClass(fieldErrors.tipo_problema)}
                >
                  {!form.servicio_id_servicio ? (
                    <option value="">Primero selecciona un servicio</option>
                  ) : tipoProblemaOptions.length === 0 ? (
                    <option value="">
                      Este servicio aún no tiene tipos de problema configurados
                    </option>
                  ) : (
                    <>
                      <option value="">Selecciona el tipo de problema</option>
                      {tipoProblemaOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  Esto ayuda a que el técnico entienda más rápido qué necesitas.
                </p>
                <FieldError message={fieldErrors.tipo_problema} />
              </div>

              <div>
                <label
                  htmlFor="foto_problema"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Foto del problema <span className="text-xs font-normal text-slate-400">(opcional)</span>
                </label>

                {form.foto_problema ? (
                  <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <img
                      src={`${API_URL}${form.foto_problema}`}
                      alt="Vista previa de la foto del problema"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-700">
                        Imagen adjunta
                      </p>
                      <button
                        type="button"
                        onClick={handleRemoveFoto}
                        className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                      >
                        <X className="h-4 w-4" />
                        Quitar imagen
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="foto_problema"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-teal-300 hover:bg-teal-50"
                  >
                    <ImagePlus className="h-6 w-6 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">
                      {subiendoFoto
                        ? "Subiendo imagen..."
                        : "Adjuntar una foto desde tu dispositivo"}
                    </span>
                    <span className="text-xs text-slate-400">
                      JPG, PNG o WEBP · hasta 5 MB
                    </span>
                    <input
                      id="foto_problema"
                      name="foto_problema"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFotoChange}
                      disabled={subiendoFoto}
                      className="sr-only"
                    />
                  </label>
                )}

                <FieldError message={fieldErrors.foto_problema} />
                <p className="mt-2 text-xs text-slate-500">
                  Opcional. Ayuda al técnico a entender el problema antes de responder.
                </p>
              </div>

              <div>
                <label
                  htmlFor="ubicacion_problema_referencia"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Referencia de ubicación <span className="text-red-500">*</span>
                </label>
              <input
                id="ubicacion_problema_referencia"
                name="ubicacion_problema_referencia"
                value={form.ubicacion_problema_referencia}
                onChange={handleChange}
                placeholder="Ej: Cocina, segundo piso, portón negro"
                className={fieldClass(fieldErrors.ubicacion_problema_referencia)}
              />
              <FieldError message={fieldErrors.ubicacion_problema_referencia} />
              </div>

              <button
                type="submit"
                disabled={
                  creandoSolicitud ||
                  subiendoFoto ||
                  loadingCatalogos ||
                  servicios.length === 0 ||
                  comunas.length === 0
                }
                className="fixya-btn-primary w-full px-4 py-3 disabled:cursor-not-allowed"
              >
                {creandoSolicitud ? "Enviando solicitud..." : "Solicitar servicio"}
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
                Cargando tus solicitudes...
              </div>
            ) : solicitudes.length === 0 ? (
              <div className="space-y-4">
                <EmptyState
                  title="Aún no tienes solicitudes registradas"
                  description="Cuando necesites ayuda en tu hogar, crea una solicitud y podrás seguirla desde aquí."
                  icon={ClipboardList}
                />
                <Link
                  to="/servicios"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-800"
                >
                  <Wrench className="h-4 w-4" />
                  Explorar servicios disponibles
                </Link>
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

                      <StatusBadge
                        status={solicitud.estado_trabajo}
                        label={getSolicitudStatusLabel(solicitud.estado_trabajo)}
                      />
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

                    <div className="mt-5">
                      <RequestProgress status={solicitud.estado_trabajo} />
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
                                      Técnico:{" "}
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
                                      Descargar cotización PDF
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
                                      Aceptar cotización
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
                                      Rechazar cotización
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
                              ? "Cerrar formulario de reseña"
                              : "Escribir reseña del servicio"}
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
