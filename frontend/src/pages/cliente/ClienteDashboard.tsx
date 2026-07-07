import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Download,
  MapPin,
  MessageCircle,
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
  uploadSolicitudFoto,
} from "../../services/solicitudService";

import type {
  DiaSemana,
  Solicitud,
  SolicitudCreate,
  SolicitudDisponibilidad,
} from "../../services/solicitudService";

import { createReview, getClientReviews } from "../../services/reviewService";
import {
  getComunas,
  getRegiones,
  getServicios,
} from "../../services/catalogService";
import type { Comuna, Region, Servicio } from "../../services/catalogService";
import {
  acceptCotizacion,
  getCotizacionEstadoLabel,
  getCotizacionesSolicitud,
  rejectCotizacion,
} from "../../services/cotizacionService";
import { cancelarSolicitud } from "../../services/solicitudService";
import type { Cotizacion } from "../../services/cotizacionService";
import API_URL from "../../services/api";
import EmptyState from "../../components/ui/EmptyState";
import RequestProgress from "../../components/ui/RequestProgress";
import StatusBadge from "../../components/ui/StatusBadge";
import { getSolicitudStatusLabel } from "../../utils/requestStatus";
import { formatCLP, formatDate } from "../../utils/format";
import Modal from "../../components/ui/Modal";
import ChatPanel from "../../components/chat/ChatPanel";


function isSolicitudEnSeguimiento(estado: string) {
  return estado !== "FINALIZADO" && estado !== "CANCELADO";
}

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
  tipo_inmueble: "",
  detalle_inmueble: "",
  piso: "",
  numero_departamento: "",
  tiene_conserjeria: "",
  requiere_autorizacion: "",
  horario_permitido_trabajos: "",
  horario_atencion: "",
  trabajo_fuera_horario: "",
  local_funcionando: "",
  condiciones_acceso: "",
  instrucciones_acceso: "",
  persona_contacto: "",
  telefono_contacto: "",
  estacionamiento_disponible: "",
  tiene_mascotas: "",
  disponibilidad_horaria: [] as DisponibilidadDiaForm[],
};

type JornadaKey = "MANANA" | "TARDE" | "NOCHE" | "PERSONALIZADO";

type DisponibilidadDiaForm = SolicitudDisponibilidad & {
  jornada: JornadaKey;
};

const diasSemana: Array<{ value: DiaSemana; label: string }> = [
  { value: "LUNES", label: "Lunes" },
  { value: "MARTES", label: "Martes" },
  { value: "MIERCOLES", label: "Miércoles" },
  { value: "JUEVES", label: "Jueves" },
  { value: "VIERNES", label: "Viernes" },
  { value: "SABADO", label: "Sábado" },
  { value: "DOMINGO", label: "Domingo" },
];

const jornadaOptions: Array<{
  value: JornadaKey;
  label: string;
  hora_inicio: string;
  hora_fin: string;
}> = [
  { value: "MANANA", label: "Mañana", hora_inicio: "09:00", hora_fin: "13:00" },
  { value: "TARDE", label: "Tarde", hora_inicio: "15:00", hora_fin: "19:00" },
  { value: "NOCHE", label: "Noche", hora_inicio: "19:00", hora_fin: "22:00" },
  {
    value: "PERSONALIZADO",
    label: "Horario personalizado",
    hora_inicio: "09:00",
    hora_fin: "13:00",
  },
];

const acceptedImageMimeTypes = ["image/jpeg", "image/png", "image/webp"];
const acceptedImageExtensions = /\.(jpe?g|png|webp)$/i;
const maxImageSizeMb = 5;
const maxImageSizeBytes = maxImageSizeMb * 1024 * 1024;

const tipoInmuebleOptions = [
  "Casa",
  "Departamento",
  "Edificio",
  "Local comercial",
  "Oficina",
  "Gimnasio",
  "Colegio / institución",
  "Espacio público",
  "Otro",
];

const camposContextoInmueble = [
  "tipo_inmueble",
  "detalle_inmueble",
  "piso",
  "numero_departamento",
  "tiene_conserjeria",
  "requiere_autorizacion",
  "horario_permitido_trabajos",
  "horario_atencion",
  "trabajo_fuera_horario",
  "local_funcionando",
  "condiciones_acceso",
  "instrucciones_acceso",
  "persona_contacto",
  "telefono_contacto",
  "estacionamiento_disponible",
  "tiene_mascotas",
];

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

  return ["Otro"];
}

function isCasa(tipoInmueble: string) {
  return tipoInmueble === "Casa";
}

function isDepartamentoOEdificio(tipoInmueble: string) {
  return tipoInmueble === "Departamento" || tipoInmueble === "Edificio";
}

function isLugarComercial(tipoInmueble: string) {
  return ["Local comercial", "Oficina", "Gimnasio"].includes(tipoInmueble);
}

function isEspacioPublico(tipoInmueble: string) {
  return tipoInmueble === "Espacio público";
}

function requiereDetalleInmueble(tipoInmueble: string) {
  return tipoInmueble === "Otro" || tipoInmueble === "Colegio / institución";
}

function booleanFromSelect(value: string) {
  if (value === "SI") return true;
  if (value === "NO") return false;
  return null;
}

function booleanText(value: string) {
  if (value === "SI") return "Sí";
  if (value === "NO") return "No";
  return "";
}

function joinDetails(items: Array<string | null | undefined>) {
  return items.filter((item): item is string => Boolean(item?.trim())).join(" | ");
}

function getDayLabel(day: DiaSemana) {
  return diasSemana.find((item) => item.value === day)?.label || day;
}

function hasMinLength(value: string, minLength: number) {
  return value.trim().length >= minLength;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function availabilityErrorKey(day: DiaSemana, field: "hora_inicio" | "hora_fin") {
  return `disponibilidad_horaria.${day}.${field}`;
}

function formatAvailabilitySummary(items: SolicitudDisponibilidad[]) {
  if (items.length === 0) return "";

  const formatter = new Intl.ListFormat("es-CL", {
    style: "long",
    type: "conjunction",
  });

  return formatter.format(
    items.map(
      (item) =>
        `${getDayLabel(item.dia).toLowerCase()} de ${item.hora_inicio} a ${item.hora_fin}`
    )
  );
}

function validateAvailability(items: DisponibilidadDiaForm[]) {
  const nextErrors: Record<string, string> = {};

  if (items.length === 0) {
    nextErrors.disponibilidad_horaria = "Selecciona al menos un día para recibir al técnico.";
    return nextErrors;
  }

  const selectedDays = new Set<DiaSemana>();

  items.forEach((item) => {
    if (selectedDays.has(item.dia)) {
      nextErrors.disponibilidad_horaria = "No puedes repetir el mismo día.";
    }

    selectedDays.add(item.dia);

    if (!item.hora_inicio) {
      nextErrors[availabilityErrorKey(item.dia, "hora_inicio")] =
        "Indica la hora de inicio.";
    }

    if (!item.hora_fin) {
      nextErrors[availabilityErrorKey(item.dia, "hora_fin")] =
        "Indica la hora de término.";
    }

    const start = timeToMinutes(item.hora_inicio);
    const end = timeToMinutes(item.hora_fin);

    if (item.hora_inicio && start === null) {
      nextErrors[availabilityErrorKey(item.dia, "hora_inicio")] =
        "Ingresa una hora válida.";
    }

    if (item.hora_fin && end === null) {
      nextErrors[availabilityErrorKey(item.dia, "hora_fin")] =
        "Ingresa una hora válida.";
    }

    if (start !== null && end !== null && end <= start) {
      nextErrors[availabilityErrorKey(item.dia, "hora_fin")] =
        "La hora de término debe ser posterior a la hora de inicio.";
    }
  });

  return nextErrors;
}

function buildSolicitudTitle(servicio?: Servicio, tipoProblema?: string) {
  const baseTitle =
    [servicio?.nombre_servicio, tipoProblema]
      .filter((item): item is string => Boolean(item?.trim()))
      .join(" - ") || "Solicitud FixYa";
  const title = baseTitle.length >= 10 ? baseTitle : `${baseTitle} FixYa`;

  return title.slice(0, 100);
}

function isAcceptedImage(file: File) {
  return (
    acceptedImageMimeTypes.includes(file.type) ||
    acceptedImageExtensions.test(file.name)
  );
}

function revokeObjectUrl(url: string) {
  if (url && typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
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
      : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-100"
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

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [reviewErrors, setReviewErrors] = useState<Record<number, string>>({});
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState("");
  const [fotoFileName, setFotoFileName] = useState("");
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  // Cotización pendiente de confirmar aceptación (modal).
  const [confirmAccept, setConfirmAccept] = useState<Cotizacion | null>(null);
  const [aceptando, setAceptando] = useState(false);
  // Solicitud cuyo chat está abierto (null = ninguno).
  const [chatSolicitudId, setChatSolicitudId] = useState<number | null>(null);
  const [sendingReview, setSendingReview] = useState(false);
  // Solicitud pendiente de confirmar cancelación (modal).
  const [cancelTarget, setCancelTarget] = useState<Solicitud | null>(null);
  const [cancelling, setCancelling] = useState(false);
  // Ids de solicitudes que el cliente ya reseñó (para no permitir duplicados en la UI).
  const [resenadas, setResenadas] = useState<Set<number>>(new Set());

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

  const comunasFiltradas = useMemo(
    () =>
      form.region_id_region
        ? comunas.filter(
            (comuna) => comuna.region_id_region === form.region_id_region
          )
        : [],
    [comunas, form.region_id_region]
  );

  const muestraCamposCasa = isCasa(form.tipo_inmueble);
  const muestraCamposDepartamento = isDepartamentoOEdificio(form.tipo_inmueble);
  const muestraCamposComercial = isLugarComercial(form.tipo_inmueble);
  const muestraAdvertenciaEspacioPublico = isEspacioPublico(form.tipo_inmueble);
  const muestraDetalleInmueble = requiereDetalleInmueble(form.tipo_inmueble);
  const disponibilidadResumen = useMemo(
    () => formatAvailabilitySummary(form.disponibilidad_horaria),
    [form.disponibilidad_horaria]
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
      setForm((prev) => ({
        ...prev,
        servicio_id_servicio:
          prev.servicio_id_servicio || serviciosActivos[0]?.id_servicio || 0,
      }));
    } catch {
      setError(
        "No pudimos cargar servicios, regiones y comunas. Intenta actualizar la página antes de crear tu solicitud."
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

      // Marca qué solicitudes ya tienen reseña del cliente (para no duplicar).
      try {
        const misResenas = await getClientReviews(usuario.rut);
        setResenadas(
          new Set(misResenas.map((r) => r.solicitud_id_solicitud))
        );
      } catch {
        // No es crítico: si falla, el backend igual bloquea duplicados.
      }

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
      const requestedComuna = comunas.find(
        (comuna) => comuna.id_comuna === requestedComunaId
      );
      const nextServicioId = servicios.some(
        (servicio) => servicio.id_servicio === requestedServicioId
      )
        ? requestedServicioId
        : prev.servicio_id_servicio;

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

  useEffect(() => () => revokeObjectUrl(fotoPreviewUrl), [fotoPreviewUrl]);

  function handleChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    const parsedValue =
      name === "servicio_id_servicio" ||
      name === "region_id_region" ||
      name === "comuna_id_comuna"
        ? Number(value)
        : value;

    setForm((prev) => ({
      ...prev,
      [name]: parsedValue,
      ...(name === "servicio_id_servicio" ? { tipo_problema: "" } : {}),
      ...(name === "region_id_region" ? { comuna_id_comuna: 0 } : {}),
    }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
      ...(name === "servicio_id_servicio" ? { tipo_problema: "" } : {}),
      ...(name === "region_id_region" ? { comuna_id_comuna: "" } : {}),
      ...(name === "tipo_inmueble"
        ? Object.fromEntries(camposContextoInmueble.map((campo) => [campo, ""]))
        : {}),
      ...(name === "condiciones_acceso" || name === "instrucciones_acceso"
        ? {
            condiciones_acceso: "",
            instrucciones_acceso: "",
          }
        : {}),
    }));
  }

  function clearAvailabilityError(day?: DiaSemana) {
    setFieldErrors((prev) => {
      const next: Record<string, string> = {
        ...prev,
        disponibilidad_horaria: "",
      };

      if (day) {
        next[availabilityErrorKey(day, "hora_inicio")] = "";
        next[availabilityErrorKey(day, "hora_fin")] = "";
      }

      return next;
    });
  }

  function addAvailabilityDay(day: DiaSemana) {
    if (form.disponibilidad_horaria.some((item) => item.dia === day)) {
      return;
    }

    const defaultOption = jornadaOptions[0];

    setForm((prev) => ({
      ...prev,
      disponibilidad_horaria: [
        ...prev.disponibilidad_horaria,
        {
          dia: day,
          jornada: defaultOption.value,
          hora_inicio: defaultOption.hora_inicio,
          hora_fin: defaultOption.hora_fin,
        },
      ],
    }));
    clearAvailabilityError(day);
  }

  function removeAvailabilityDay(day: DiaSemana) {
    setForm((prev) => ({
      ...prev,
      disponibilidad_horaria: prev.disponibilidad_horaria.filter(
        (item) => item.dia !== day
      ),
    }));
    clearAvailabilityError(day);
  }

  function updateAvailabilityDay(
    day: DiaSemana,
    updates: Partial<DisponibilidadDiaForm>
  ) {
    setForm((prev) => ({
      ...prev,
      disponibilidad_horaria: prev.disponibilidad_horaria.map((item) =>
        item.dia === day ? { ...item, ...updates } : item
      ),
    }));
    clearAvailabilityError(day);
  }

  function handleJornadaChange(day: DiaSemana, jornada: JornadaKey) {
    const option = jornadaOptions.find((item) => item.value === jornada);

    if (!option) return;

    updateAvailabilityDay(day, {
      jornada,
      hora_inicio: option.hora_inicio,
      hora_fin: option.hora_fin,
    });
  }

  function clearPhotoSelection() {
    setForm((prev) => ({ ...prev, foto_problema: "" }));
    setFotoFileName("");
    setFotoPreviewUrl("");
    setFieldErrors((prev) => ({ ...prev, foto_problema: "" }));

    if (fotoInputRef.current) {
      fotoInputRef.current.value = "";
    }
  }

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      clearPhotoSelection();
      return;
    }

    if (!isAcceptedImage(file)) {
      clearPhotoSelection();
      setFieldErrors((prev) => ({
        ...prev,
        foto_problema: "Sube una imagen JPG, JPEG, PNG o WEBP.",
      }));
      return;
    }

    if (file.size > maxImageSizeBytes) {
      clearPhotoSelection();
      setFieldErrors((prev) => ({
        ...prev,
        foto_problema: `La imagen no puede superar ${maxImageSizeMb} MB.`,
      }));
      return;
    }

    const previewUrl =
      typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(file)
        : "";

    setFotoFileName(file.name);
    setFotoPreviewUrl(previewUrl);
    setFieldErrors((prev) => ({ ...prev, foto_problema: "" }));

    // Subir la imagen al backend y guardar la URL real (no el nombre del archivo).
    try {
      setSubiendoFoto(true);
      const { archivo_url } = await uploadSolicitudFoto(file);
      setForm((prev) => ({ ...prev, foto_problema: archivo_url }));
    } catch (err) {
      setForm((prev) => ({ ...prev, foto_problema: "" }));
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (subiendoFoto) {
      setError("Espera a que termine de subir la imagen antes de enviar.");
      return;
    }

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
    if (!form.descripcion_problema.trim()) {
      nextErrors.descripcion_problema = "Describe qué ocurre para orientar al técnico.";
    } else if (!hasMinLength(form.descripcion_problema, 20)) {
      nextErrors.descripcion_problema = "Describe el problema con al menos 20 caracteres.";
    }
    if (!form.direccion.trim()) {
      nextErrors.direccion = "Ingresa la dirección donde necesitas el servicio.";
    } else if (!hasMinLength(form.direccion, 10)) {
      nextErrors.direccion = "Ingresa una dirección con al menos 10 caracteres.";
    }
    if (!form.tipo_problema.trim()) nextErrors.tipo_problema = "Selecciona el tipo de problema según el servicio.";
    if (!form.ubicacion_problema_referencia.trim()) {
      nextErrors.ubicacion_problema_referencia = "Agrega una referencia para ubicar mejor el problema.";
    } else if (!hasMinLength(form.ubicacion_problema_referencia, 3)) {
      nextErrors.ubicacion_problema_referencia = "Agrega una referencia de al menos 3 caracteres.";
    }
    Object.assign(nextErrors, validateAvailability(form.disponibilidad_horaria));
    if (!form.tipo_inmueble) {
      nextErrors.tipo_inmueble = "Selecciona dónde se realizará el trabajo.";
    } else {
      if (muestraDetalleInmueble && !form.detalle_inmueble.trim()) {
        nextErrors.detalle_inmueble = "Describe brevemente el lugar donde se trabajará.";
      }
      if (muestraCamposCasa) {
        if (!form.estacionamiento_disponible) {
          nextErrors.estacionamiento_disponible = "Indica si hay estacionamiento disponible.";
        }
        if (!form.tiene_mascotas) {
          nextErrors.tiene_mascotas = "Indica si hay mascotas en el domicilio.";
        }
      }
      if (muestraCamposDepartamento) {
        if (!form.numero_departamento.trim()) {
          nextErrors.numero_departamento = "Ingresa el número de departamento u oficina.";
        }
        if (!form.piso.trim()) nextErrors.piso = "Ingresa el piso.";
        if (!form.tiene_conserjeria) {
          nextErrors.tiene_conserjeria = "Indica si hay conserjería.";
        }
        if (!form.requiere_autorizacion) {
          nextErrors.requiere_autorizacion = "Indica si requiere autorización de administración.";
        }
        if (!form.horario_permitido_trabajos.trim()) {
          nextErrors.horario_permitido_trabajos = "Indica el horario permitido para trabajos.";
        }
      }
      if (muestraCamposComercial) {
        if (!form.horario_atencion.trim()) {
          nextErrors.horario_atencion = "Ingresa el horario de atención.";
        }
        if (!form.trabajo_fuera_horario) {
          nextErrors.trabajo_fuera_horario = "Indica si el trabajo debe hacerse fuera de horario.";
        }
        if (!form.persona_contacto.trim()) {
          nextErrors.persona_contacto = "Ingresa la persona de contacto.";
        }
        if (!form.telefono_contacto.trim()) {
          nextErrors.telefono_contacto = "Ingresa el teléfono de contacto.";
        }
        if (!form.local_funcionando) {
          nextErrors.local_funcionando = "Indica si el lugar estará funcionando durante el trabajo.";
        }
      }
      if (!form.instrucciones_acceso.trim()) {
        nextErrors.instrucciones_acceso = "Indica cómo ingresar al lugar.";
      }
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

      const horarioDisponible = joinDetails([
        disponibilidadResumen
          ? `Disponibilidad cliente: ${disponibilidadResumen}`
          : null,
        muestraCamposDepartamento
          ? `Horario permitido para trabajos: ${form.horario_permitido_trabajos.trim()}`
          : null,
        muestraCamposComercial
          ? `Horario de atención: ${form.horario_atencion.trim()}`
          : null,
      ]);

      const condicionesAcceso = joinDetails([
        muestraCamposComercial
          ? `Trabajo fuera de horario: ${booleanText(form.trabajo_fuera_horario)}`
          : null,
        muestraCamposComercial
          ? `Lugar funcionando durante el trabajo: ${booleanText(form.local_funcionando)}`
          : null,
        muestraAdvertenciaEspacioPublico
          ? "Puede requerir permisos municipales o autorización previa"
          : null,
      ]);

      const payload: SolicitudCreate = {
        usuario_rut: usuario.rut,
        servicio_id_servicio: form.servicio_id_servicio,
        comuna_id_comuna: form.comuna_id_comuna,
        titulo_solicitud: buildSolicitudTitle(selectedServicio, form.tipo_problema),
        descripcion_problema: form.descripcion_problema.trim(),
        urgencia: form.urgencia,
        direccion: form.direccion.trim(),
        tipo_problema: form.tipo_problema,
        foto_problema: form.foto_problema || null,
        ubicacion_problema_referencia:
          form.ubicacion_problema_referencia.trim(),
        tipo_inmueble: form.tipo_inmueble,
        detalle_inmueble: form.detalle_inmueble.trim() || null,
        piso: muestraCamposDepartamento ? form.piso.trim() : null,
        numero_departamento: muestraCamposDepartamento
          ? form.numero_departamento.trim()
          : null,
        tiene_conserjeria: muestraCamposDepartamento
          ? booleanFromSelect(form.tiene_conserjeria)
          : null,
        requiere_autorizacion: muestraCamposDepartamento
          ? booleanFromSelect(form.requiere_autorizacion)
          : null,
        horario_disponible: horarioDisponible,
        disponibilidad_horaria: form.disponibilidad_horaria.map(
          ({ dia, hora_inicio, hora_fin }) => ({
            dia,
            hora_inicio,
            hora_fin,
          })
        ),
        condiciones_acceso: condicionesAcceso || null,
        instrucciones_acceso: form.instrucciones_acceso.trim() || null,
        persona_contacto: muestraCamposComercial
          ? form.persona_contacto.trim()
          : null,
        telefono_contacto: muestraCamposComercial
          ? form.telefono_contacto.trim()
          : null,
        estacionamiento_disponible: muestraCamposCasa
          ? booleanFromSelect(form.estacionamiento_disponible)
          : null,
        tiene_mascotas: muestraCamposCasa
          ? booleanFromSelect(form.tiene_mascotas)
          : null,
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
      clearPhotoSelection();

      await cargarSolicitudes();
    } catch (err) {
      if (err instanceof Error) {
        setError(`No pudimos enviar la solicitud. ${err.message}`);
        return;
      }
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

      // Marca la solicitud como reseñada: reemplaza el formulario por la
      // confirmación inline (feedback claro y evita reintentos duplicados).
      setResenadas((prev) => new Set(prev).add(idSolicitud));
      setSuccess("¡Reseña publicada con éxito! Gracias por compartir tu experiencia.");
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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos actualizar la cotizacion. Intenta nuevamente."
      );
    }
  }

  // Confirmación explícita antes de aceptar (la aceptación asigna al técnico).
  async function confirmarAceptacion() {
    if (!confirmAccept) return;
    setAceptando(true);
    try {
      await handleCotizacionAction(confirmAccept.id_cotizacion, "accept");
      setConfirmAccept(null);
    } finally {
      setAceptando(false);
    }
  }

  async function confirmarCancelacion() {
    if (!cancelTarget) return;
    setCancelling(true);
    setError("");
    setSuccess("");
    try {
      await cancelarSolicitud(cancelTarget.id_solicitud);
      setSuccess("Solicitud cancelada correctamente.");
      setCancelTarget(null);
      await cargarSolicitudes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos cancelar la solicitud."
      );
    } finally {
      setCancelling(false);
    }
  }

  // Una cotización ENVIADA cuya vigencia ya pasó se considera expirada.
  function cotizacionExpirada(cotizacion: Cotizacion) {
    return (
      cotizacion.estado_cotizacion === "ENVIADA" &&
      Boolean(cotizacion.fecha_vigencia) &&
      new Date(cotizacion.fecha_vigencia).getTime() < Date.now()
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">
            Hola, {usuario?.nombre_completo?.split(" ")[0] || "cliente"}. ¿Qué necesitas solucionar hoy?
          </h1>

          <p className="mt-2 text-gray-600">
            Crea una solicitud y revisa el avance de tus servicios en un solo lugar.
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
                {
                  solicitudes.filter((item) =>
                    isSolicitudEnSeguimiento(item.estado_trabajo)
                  ).length
                }
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
                  Solicitar servicio
                </h2>

                <p className="text-sm text-gray-500">
                  Cuéntanos qué ocurre y dónde necesitas ayuda.
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <legend className="px-1 text-base font-black text-slate-900">
                  Problema
                </legend>
              <div>
                <label
                  htmlFor="servicio_id_servicio"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Servicio que necesitas
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

              <div>
                <label
                  htmlFor="tipo_problema"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Tipo de problema
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
                  htmlFor="descripcion_problema"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Describe qué ocurre
                </label>
              <textarea
                id="descripcion_problema"
                name="descripcion_problema"
                value={form.descripcion_problema}
                onChange={handleChange}
                maxLength={1000}
                placeholder="Describe el problema con el mayor detalle posible"
                rows={4}
                className={`${fieldClass(fieldErrors.descripcion_problema)} resize-none`}
              />
              <p className="mt-1 text-xs text-slate-400">Mínimo 20 caracteres.</p>
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
                  htmlFor="foto_problema"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Foto del problema
                </label>
                <input
                  id="foto_problema"
                  ref={fotoInputRef}
                  name="foto_problema"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className={fieldClass(fieldErrors.foto_problema)}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Opcional. JPG, JPEG, PNG o WEBP, hasta {maxImageSizeMb} MB.
                </p>
                {subiendoFoto && (
                  <p className="mt-2 text-xs font-semibold text-teal-700">
                    Subiendo imagen...
                  </p>
                )}
                {fotoFileName && (
                  <div className="mt-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
                    {fotoPreviewUrl && (
                      <img
                        src={fotoPreviewUrl}
                        alt={`Vista previa de ${fotoFileName}`}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {fotoFileName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Imagen lista para enviar con la solicitud.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearPhotoSelection}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                    >
                      Quitar foto
                    </button>
                  </div>
                )}
                <FieldError message={fieldErrors.foto_problema} />
              </div>
              </fieldset>

              <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <legend className="px-1 text-base font-black text-slate-900">
                  Ubicación
                </legend>

              <div>
                <label
                  htmlFor="region_id_region"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Región
                </label>
                <select
                  id="region_id_region"
                  name="region_id_region"
                  value={form.region_id_region}
                  onChange={handleChange}
                  disabled={loadingCatalogos || regiones.length === 0}
                  className={fieldClass(fieldErrors.region_id_region)}
                >
                  <option value={0}>
                    {regiones.length === 0
                      ? "No hay regiones disponibles para seleccionar"
                      : "Selecciona una región"}
                  </option>
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
                  Comuna del servicio
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
                  <option value={0}>
                    {!form.region_id_region
                      ? "Primero selecciona una región"
                      : comunasFiltradas.length === 0
                        ? "No hay comunas disponibles para esta región"
                        : "Selecciona una comuna"}
                  </option>
                  {comunasFiltradas.map((comuna) => (
                    <option key={comuna.id_comuna} value={comuna.id_comuna}>
                      {comuna.nombre_comuna}
                    </option>
                  ))}
                </select>
                <FieldError message={fieldErrors.comuna_id_comuna} />
              </div>

              <div>
                <label
                  htmlFor="direccion"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Dirección
                </label>
              <input
                id="direccion"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                maxLength={200}
                placeholder="Calle, número y comuna"
                className={fieldClass(fieldErrors.direccion)}
              />
              <FieldError message={fieldErrors.direccion} />
              </div>

              <div>
                <label
                  htmlFor="ubicacion_problema_referencia"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  ¿En qué parte del inmueble está el problema?
                </label>
                <input
                  id="ubicacion_problema_referencia"
                  name="ubicacion_problema_referencia"
                  value={form.ubicacion_problema_referencia}
                  onChange={handleChange}
                  maxLength={200}
                  placeholder="Ej: cocina, baño del segundo piso o habitación principal"
                  className={fieldClass(fieldErrors.ubicacion_problema_referencia)}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Ejemplo: en la cocina, baño del segundo piso o habitación principal.
                </p>
                <FieldError message={fieldErrors.ubicacion_problema_referencia} />
              </div>
              </fieldset>

              <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <legend className="px-1 text-base font-black text-slate-900">
                  Datos del inmueble
                </legend>

                <div>
                  <label
                    htmlFor="tipo_inmueble"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    ¿Dónde se realizará el trabajo?
                  </label>
                  <select
                    id="tipo_inmueble"
                    name="tipo_inmueble"
                    value={form.tipo_inmueble}
                    onChange={handleChange}
                    className={fieldClass(fieldErrors.tipo_inmueble)}
                  >
                    <option value="">Selecciona el tipo de lugar</option>
                    {tipoInmuebleOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <FieldError message={fieldErrors.tipo_inmueble} />
                </div>

                {muestraDetalleInmueble && (
                  <div>
                    <label
                      htmlFor="detalle_inmueble"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Detalle del lugar
                    </label>
                    <input
                      id="detalle_inmueble"
                      name="detalle_inmueble"
                      value={form.detalle_inmueble}
                      onChange={handleChange}
                      placeholder="Ej: sede, sala, área o referencia del recinto"
                      className={fieldClass(fieldErrors.detalle_inmueble)}
                    />
                    <FieldError message={fieldErrors.detalle_inmueble} />
                  </div>
                )}

                {muestraCamposCasa && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="estacionamiento_disponible"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        ¿Hay estacionamiento disponible?
                      </label>
                      <select
                        id="estacionamiento_disponible"
                        name="estacionamiento_disponible"
                        value={form.estacionamiento_disponible}
                        onChange={handleChange}
                        className={fieldClass(fieldErrors.estacionamiento_disponible)}
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="SI">Sí</option>
                        <option value="NO">No</option>
                      </select>
                      <FieldError message={fieldErrors.estacionamiento_disponible} />
                    </div>

                    <div>
                      <label
                        htmlFor="tiene_mascotas"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        ¿Hay mascotas en el domicilio?
                      </label>
                      <select
                        id="tiene_mascotas"
                        name="tiene_mascotas"
                        value={form.tiene_mascotas}
                        onChange={handleChange}
                        className={fieldClass(fieldErrors.tiene_mascotas)}
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="SI">Sí</option>
                        <option value="NO">No</option>
                      </select>
                      <FieldError message={fieldErrors.tiene_mascotas} />
                    </div>
                  </div>
                )}

                {muestraCamposDepartamento && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="numero_departamento"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Número de departamento u oficina
                      </label>
                      <input
                        id="numero_departamento"
                        name="numero_departamento"
                        value={form.numero_departamento}
                        onChange={handleChange}
                        placeholder="Ej: 1204, oficina 302"
                        className={fieldClass(fieldErrors.numero_departamento)}
                      />
                      <FieldError message={fieldErrors.numero_departamento} />
                    </div>

                    <div>
                      <label
                        htmlFor="piso"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Piso
                      </label>
                      <input
                        id="piso"
                        name="piso"
                        value={form.piso}
                        onChange={handleChange}
                        placeholder="Ej: 12"
                        className={fieldClass(fieldErrors.piso)}
                      />
                      <FieldError message={fieldErrors.piso} />
                    </div>

                    <div>
                      <label
                        htmlFor="tiene_conserjeria"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        ¿Hay conserjería?
                      </label>
                      <select
                        id="tiene_conserjeria"
                        name="tiene_conserjeria"
                        value={form.tiene_conserjeria}
                        onChange={handleChange}
                        className={fieldClass(fieldErrors.tiene_conserjeria)}
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="SI">Sí</option>
                        <option value="NO">No</option>
                      </select>
                      <FieldError message={fieldErrors.tiene_conserjeria} />
                    </div>

                    <div>
                      <label
                        htmlFor="requiere_autorizacion"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        ¿Requiere autorización de administración?
                      </label>
                      <select
                        id="requiere_autorizacion"
                        name="requiere_autorizacion"
                        value={form.requiere_autorizacion}
                        onChange={handleChange}
                        className={fieldClass(fieldErrors.requiere_autorizacion)}
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="SI">Sí</option>
                        <option value="NO">No</option>
                      </select>
                      <FieldError message={fieldErrors.requiere_autorizacion} />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="horario_permitido_trabajos"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Horario permitido para trabajos
                      </label>
                      <input
                        id="horario_permitido_trabajos"
                        name="horario_permitido_trabajos"
                        value={form.horario_permitido_trabajos}
                        onChange={handleChange}
                        placeholder="Ej: lunes a viernes de 09:00 a 18:00"
                        className={fieldClass(fieldErrors.horario_permitido_trabajos)}
                      />
                      <FieldError message={fieldErrors.horario_permitido_trabajos} />
                    </div>
                  </div>
                )}

                {muestraCamposComercial && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="horario_atencion"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Horario de atención
                      </label>
                      <input
                        id="horario_atencion"
                        name="horario_atencion"
                        value={form.horario_atencion}
                        onChange={handleChange}
                        placeholder="Ej: lunes a sábado de 10:00 a 20:00"
                        className={fieldClass(fieldErrors.horario_atencion)}
                      />
                      <FieldError message={fieldErrors.horario_atencion} />
                    </div>

                    <div>
                      <label
                        htmlFor="trabajo_fuera_horario"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        ¿El trabajo debe hacerse fuera de horario?
                      </label>
                      <select
                        id="trabajo_fuera_horario"
                        name="trabajo_fuera_horario"
                        value={form.trabajo_fuera_horario}
                        onChange={handleChange}
                        className={fieldClass(fieldErrors.trabajo_fuera_horario)}
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="SI">Sí</option>
                        <option value="NO">No</option>
                      </select>
                      <FieldError message={fieldErrors.trabajo_fuera_horario} />
                    </div>

                    <div>
                      <label
                        htmlFor="persona_contacto"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Persona de contacto
                      </label>
                      <input
                        id="persona_contacto"
                        name="persona_contacto"
                        value={form.persona_contacto}
                        onChange={handleChange}
                        placeholder="Nombre de quien recibirá al técnico"
                        className={fieldClass(fieldErrors.persona_contacto)}
                      />
                      <FieldError message={fieldErrors.persona_contacto} />
                    </div>

                    <div>
                      <label
                        htmlFor="telefono_contacto"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Teléfono de contacto
                      </label>
                      <input
                        id="telefono_contacto"
                        name="telefono_contacto"
                        value={form.telefono_contacto}
                        onChange={handleChange}
                        placeholder="Ej: +56912345678"
                        className={fieldClass(fieldErrors.telefono_contacto)}
                      />
                      <FieldError message={fieldErrors.telefono_contacto} />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="local_funcionando"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        ¿El local estará funcionando durante el trabajo?
                      </label>
                      <select
                        id="local_funcionando"
                        name="local_funcionando"
                        value={form.local_funcionando}
                        onChange={handleChange}
                        className={fieldClass(fieldErrors.local_funcionando)}
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="SI">Sí</option>
                        <option value="NO">No</option>
                      </select>
                      <FieldError message={fieldErrors.local_funcionando} />
                    </div>
                  </div>
                )}

                {muestraAdvertenciaEspacioPublico && (
                  <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
                    <p>
                      Este tipo de solicitud puede requerir permisos municipales o autorización previa. El técnico podrá revisar la factibilidad antes de aceptar el trabajo.
                    </p>
                  </div>
                )}

              </fieldset>

              <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <legend className="px-1 text-base font-black text-slate-900">
                  Acceso al lugar
                </legend>

                <div>
                  <label
                    htmlFor="instrucciones_acceso"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Instrucciones para ingresar al lugar
                  </label>
                  <textarea
                    id="instrucciones_acceso"
                    name="instrucciones_acceso"
                    value={form.instrucciones_acceso}
                    onChange={handleChange}
                    placeholder="Ej: anunciarse en conserjería, llamar al llegar o usar entrada secundaria"
                    rows={3}
                    className={`${fieldClass(fieldErrors.instrucciones_acceso)} resize-none`}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Indica si hay conserjería, portón, estacionamiento, autorización previa u otra condición importante.
                  </p>
                  <FieldError message={fieldErrors.instrucciones_acceso} />
                </div>
              </fieldset>

              <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <legend className="px-1 text-base font-black text-slate-900">
                  ¿Cuándo puedes recibir al técnico?
                </legend>

                <div>
                  <p className="mb-3 text-sm text-slate-600">
                    Selecciona uno o varios días y ajusta el horario de visita para cada uno.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {diasSemana.map((day) => {
                      const isSelected = form.disponibilidad_horaria.some(
                        (item) => item.dia === day.value
                      );

                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => addAvailabilityDay(day.value)}
                          disabled={isSelected}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                  <FieldError message={fieldErrors.disponibilidad_horaria} />
                </div>

                {form.disponibilidad_horaria.length > 0 && (
                  <div className="space-y-3">
                    {form.disponibilidad_horaria.map((item) => (
                      <div
                        key={item.dia}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <h4 className="font-bold text-slate-900">
                            {getDayLabel(item.dia)}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeAvailabilityDay(item.dia)}
                            className="self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:self-auto"
                          >
                            Eliminar día
                          </button>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {jornadaOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                handleJornadaChange(item.dia, option.value)
                              }
                              className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                                item.jornada === option.value
                                  ? "border-teal-700 bg-teal-700 text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor={`hora_inicio_${item.dia}`}
                              className="mb-2 block text-sm font-bold text-slate-700"
                            >
                              Desde
                            </label>
                            <input
                              id={`hora_inicio_${item.dia}`}
                              aria-label={`Desde ${getDayLabel(item.dia)}`}
                              type="time"
                              value={item.hora_inicio}
                              onChange={(event) =>
                                updateAvailabilityDay(item.dia, {
                                  jornada: "PERSONALIZADO",
                                  hora_inicio: event.target.value,
                                })
                              }
                              className={fieldClass(
                                fieldErrors[
                                  availabilityErrorKey(item.dia, "hora_inicio")
                                ]
                              )}
                            />
                            <FieldError
                              message={
                                fieldErrors[
                                  availabilityErrorKey(item.dia, "hora_inicio")
                                ]
                              }
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`hora_fin_${item.dia}`}
                              className="mb-2 block text-sm font-bold text-slate-700"
                            >
                              Hasta
                            </label>
                            <input
                              id={`hora_fin_${item.dia}`}
                              aria-label={`Hasta ${getDayLabel(item.dia)}`}
                              type="time"
                              value={item.hora_fin}
                              onChange={(event) =>
                                updateAvailabilityDay(item.dia, {
                                  jornada: "PERSONALIZADO",
                                  hora_fin: event.target.value,
                                })
                              }
                              className={fieldClass(
                                fieldErrors[
                                  availabilityErrorKey(item.dia, "hora_fin")
                                ]
                              )}
                            />
                            <FieldError
                              message={
                                fieldErrors[
                                  availabilityErrorKey(item.dia, "hora_fin")
                                ]
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  <strong>Disponibilidad seleccionada:</strong>{" "}
                  {disponibilidadResumen || "Aún no has seleccionado horarios."}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={
                  creandoSolicitud ||
                  loadingCatalogos ||
                  servicios.length === 0 ||
                  regiones.length === 0 ||
                  comunas.length === 0
                }
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
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

                    {solicitud.estado_trabajo !== "FINALIZADO" &&
                      solicitud.estado_trabajo !== "CANCELADO" && (
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setCancelTarget(solicitud)}
                            className="text-sm font-semibold text-rose-600 underline-offset-2 hover:underline"
                          >
                            Cancelar solicitud
                          </button>
                        </div>
                      )}

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
                                className={`rounded-2xl border bg-white p-5 shadow-sm ${
                                  cotizacion.cotizacion_origen_id
                                    ? "border-amber-300 ring-1 ring-amber-200"
                                    : "border-slate-200"
                                }`}
                              >
                                {cotizacion.cotizacion_origen_id && (
                                  <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                                    Nueva cotización por cambio de alcance
                                    (reemplaza a la #
                                    {cotizacion.cotizacion_origen_id})
                                  </div>
                                )}
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                      Cotizacion #{cotizacion.id_cotizacion}
                                    </p>
                                    <p className="mt-1 text-3xl font-bold text-slate-950">
                                      {formatCLP(cotizacion.monto_estimado)}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600">
                                      {cotizacion.mensaje_cotizacion}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                      Técnico:{" "}
                                      {cotizacion.tecnico_usuario_rut}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                      Materiales:{" "}
                                      {cotizacion.materiales_incluidos
                                        ? "incluidos"
                                        : "no incluidos"}
                                      {cotizacion.plazo_estimado
                                        ? ` · Plazo: ${cotizacion.plazo_estimado}`
                                        : ""}
                                      {" · "}
                                      Vigente hasta{" "}
                                      {formatDate(cotizacion.fecha_vigencia)}
                                    </p>
                                    {cotizacion.estado_cotizacion ===
                                      "ANULADA_CAMBIO_ALCANCE" &&
                                      cotizacion.motivo_anulacion && (
                                        <p className="mt-1 text-xs font-semibold text-amber-700">
                                          Motivo del cambio:{" "}
                                          {cotizacion.motivo_anulacion}
                                        </p>
                                      )}
                                  </div>

                                  {cotizacionExpirada(cotizacion) ? (
                                    <span className="w-fit rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                                      Expirada
                                    </span>
                                  ) : (
                                    <StatusBadge
                                      status={cotizacion.estado_cotizacion}
                                      label={getCotizacionEstadoLabel(
                                        cotizacion.estado_cotizacion
                                      )}
                                    />
                                  )}
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

                                  {cotizacion.estado_cotizacion === "ENVIADA" &&
                                    !cotizacionExpirada(cotizacion) && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setConfirmAccept(cotizacion)
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

                                  {cotizacionExpirada(cotizacion) && (
                                    <span className="text-xs font-semibold text-slate-500">
                                      Esta cotización venció y ya no puede
                                      aceptarse.
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {solicitud.tecnico_usuario_rut &&
                      solicitud.estado_trabajo !== "INICIADO" &&
                      solicitud.estado_trabajo !== "CANCELADO" && (
                        <div className="mt-5">
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
                              : "Chat con el técnico"}
                          </button>
                          {chatSolicitudId === solicitud.id_solicitud &&
                            usuario && (
                              <div className="mt-3">
                                <ChatPanel
                                  idSolicitud={solicitud.id_solicitud}
                                  miRut={usuario.rut}
                                  nombreContraparte="Técnico asignado"
                                />
                              </div>
                            )}
                        </div>
                      )}

                    {solicitud.estado_trabajo === "FINALIZADO" &&
                      resenadas.has(solicitud.id_solicitud) && (
                        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
                          <div>
                            <h4 className="font-bold text-emerald-900">
                              ¡Reseña publicada con éxito!
                            </h4>
                            <p className="text-sm text-emerald-700">
                              Gracias por compartir tu experiencia con el técnico.
                            </p>
                          </div>
                        </div>
                      )}

                    {solicitud.estado_trabajo === "FINALIZADO" &&
                      !resenadas.has(solicitud.id_solicitud) && (
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

      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => (cancelling ? null : setCancelTarget(null))}
        title="Cancelar solicitud"
        description="La solicitud quedará cancelada y no seguirá avanzando. Esta acción no se puede deshacer."
        maxWidth="md"
      >
        {cancelTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              ¿Seguro que quieres cancelar{" "}
              <span className="font-semibold text-slate-900">
                {cancelTarget.titulo_solicitud}
              </span>
              ? Si hay una cotización aceptada, también se anulará y se avisará al
              técnico.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmarCancelacion}
                disabled={cancelling}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-rose-300"
              >
                {cancelling ? "Cancelando..." : "Sí, cancelar solicitud"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(confirmAccept)}
        onClose={() => (aceptando ? null : setConfirmAccept(null))}
        title="Confirmar aceptación"
        description="Al aceptar, asignarás el trabajo a este técnico y se rechazarán las demás cotizaciones de esta solicitud."
        maxWidth="md"
      >
        {confirmAccept && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Cotización #{confirmAccept.id_cotizacion}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-950">
                {formatCLP(confirmAccept.monto_estimado)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Materiales:{" "}
                {confirmAccept.materiales_incluidos
                  ? "incluidos"
                  : "no incluidos"}
              </p>
            </div>
            <p className="text-sm text-slate-600">
              Se registrará tu aceptación y el PDF quedará firmado por ambas
              partes. ¿Deseas continuar?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmAccept(null)}
                disabled={aceptando}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarAceptacion}
                disabled={aceptando}
                className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:bg-green-300"
              >
                {aceptando ? "Aceptando..." : "Aceptar cotización"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ClienteDashboard;
