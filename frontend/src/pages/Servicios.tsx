import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle,
  ClipboardList,
  Hammer,
  Home,
  KeyRound,
  MapPin,
  PlugZap,
  RefreshCw,
  Search,
  ShieldCheck,
  ShowerHead,
  Star,
  Wrench,
} from "lucide-react";

import Navbar from "../components/Navbar";
import EmptyState from "../components/ui/EmptyState";
import { useAuth } from "../context/AuthContext";
import { getComunas, getServicios } from "../services/catalogService";
import type { Comuna, Servicio } from "../services/catalogService";
import { getPublicTechnicianProfiles } from "../services/technicianService";
import type { TecnicoPublicProfile } from "../services/technicianService";

type ServiceStyle = {
  icon: typeof Wrench;
  accent: string;
  label: string;
};

const serviceStyle: Record<string, ServiceStyle> = {
  Electricidad: {
    icon: PlugZap,
    accent: "bg-yellow-100 text-yellow-700",
    label: "Instalaciones, enchufes y fallas electricas",
  },
  Gasfiteria: {
    icon: ShowerHead,
    accent: "bg-cyan-100 text-cyan-700",
    label: "Filtraciones, agua, cañerías y artefactos",
  },
  Carpinteria: {
    icon: Hammer,
    accent: "bg-amber-100 text-amber-800",
    label: "Muebles, puertas, terminaciones y reparaciones",
  },
  Cerrajeria: {
    icon: KeyRound,
    accent: "bg-slate-100 text-slate-700",
    label: "Cerraduras, llaves y accesos del hogar",
  },
};

function pluralize(total: number, singular: string, plural: string) {
  return total === 1 ? singular : plural;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getServiceStyle(nombreServicio: string): ServiceStyle {
  const normalized = normalizeText(nombreServicio);

  if (normalized.includes("electric")) return serviceStyle.Electricidad;
  if (normalized.includes("gasfiter")) return serviceStyle.Gasfiteria;
  if (normalized.includes("carpinter")) return serviceStyle.Carpinteria;
  if (normalized.includes("cerrajer")) return serviceStyle.Cerrajeria;

  return {
    icon: Wrench,
    accent: "bg-blue-100 text-blue-700",
    label: "Servicio técnico verificado por FixYa",
  };
}

function technicianMatchesService(
  tecnico: TecnicoPublicProfile,
  servicio: Servicio | null
) {
  if (!servicio) return false;

  const selected = normalizeText(servicio.nombre_servicio);
  return tecnico.servicios.some((item) => normalizeText(item).includes(selected));
}

function technicianMatchesComuna(
  tecnico: TecnicoPublicProfile,
  selectedComunaId: number,
  comunas: Comuna[]
) {
  if (!selectedComunaId) return true;

  const comuna = comunas.find((item) => item.id_comuna === selectedComunaId);
  if (!comuna) return true;

  const selected = normalizeText(comuna.nombre_comuna);
  return tecnico.comunas.some((item) => normalizeText(item).includes(selected));
}

function Servicios() {
  const { usuario } = useAuth();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoPublicProfile[]>([]);
  const [selectedServicioId, setSelectedServicioId] = useState<number | null>(
    null
  );
  const [selectedComunaId, setSelectedComunaId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function updateMarketplace(
    serviciosData: Servicio[],
    comunasData: Comuna[],
    tecnicosData: TecnicoPublicProfile[]
  ) {
    const serviciosActivos = serviciosData.filter(
      (servicio) => servicio.estado_servicio
    );

    setServicios(serviciosActivos);
    setComunas(comunasData);
    setTecnicos(tecnicosData);
    setSelectedServicioId((current) => {
      const currentExists = serviciosActivos.some(
        (servicio) => servicio.id_servicio === current
      );

      return currentExists
        ? current
        : serviciosActivos[0]?.id_servicio ?? null;
    });
  }

  async function cargarMarketplace() {
    try {
      setLoading(true);
      setError("");

      const [serviciosData, comunasData, tecnicosData] = await Promise.all([
        getServicios(),
        getComunas(),
        getPublicTechnicianProfiles(),
      ]);

      updateMarketplace(serviciosData, comunasData, tecnicosData);
    } catch {
      setServicios([]);
      setComunas([]);
      setTecnicos([]);
      setSelectedServicioId(null);
      setError("No pudimos cargar los servicios disponibles. Intenta actualizar los resultados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    Promise.all([getServicios(), getComunas(), getPublicTechnicianProfiles()])
      .then(([serviciosData, comunasData, tecnicosData]) => {
        if (!active) return;
        updateMarketplace(serviciosData, comunasData, tecnicosData);
      })
      .catch(() => {
        if (!active) return;
        setError("No pudimos cargar los servicios disponibles. Intenta actualizar los resultados.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedServicio = useMemo(
    () =>
      servicios.find((servicio) => servicio.id_servicio === selectedServicioId) ??
      null,
    [servicios, selectedServicioId]
  );

  const selectedComuna = useMemo(
    () => comunas.find((comuna) => comuna.id_comuna === selectedComunaId) ?? null,
    [comunas, selectedComunaId]
  );

  const tecnicosDisponibles = useMemo(() => {
    return tecnicos.filter(
      (tecnico) =>
        technicianMatchesService(tecnico, selectedServicio) &&
        technicianMatchesComuna(tecnico, selectedComunaId, comunas)
    );
  }, [tecnicos, selectedServicio, selectedComunaId, comunas]);

  const solicitudPath = useMemo(() => {
    const params = new URLSearchParams();

    if (selectedServicio) {
      params.set("servicio", String(selectedServicio.id_servicio));
    }

    if (selectedComunaId) {
      params.set("comuna", String(selectedComunaId));
    }

    const query = params.toString();
    return `/cliente/dashboard${query ? `?${query}` : ""}`;
  }, [selectedServicio, selectedComunaId]);

  const loginPath = `/login?next=${encodeURIComponent(solicitudPath)}`;
  const canRequestService = !usuario || usuario.tipo_usuario === "CLIENTE";
  const requestHref = usuario ? solicitudPath : loginPath;

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase text-blue-700">
              <Home className="h-3.5 w-3.5" />
              Servicios FixYa
            </p>
            <h1 className="text-4xl font-black text-slate-950">
              Servicios para el hogar
            </h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Elige una categoría, filtra por comuna y solicita ayuda con un
              flujo guiado desde tu panel de cliente.
            </p>
          </div>

          <button
            type="button"
            onClick={cargarMarketplace}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : undefined}
            />
            Actualizar resultados
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            Buscando servicios y técnicos disponibles...
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-8">
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {servicios.map((servicio) => {
                const style = getServiceStyle(servicio.nombre_servicio);
                const Icon = style.icon;
                const selected = servicio.id_servicio === selectedServicioId;
                const totalTecnicos = tecnicos.filter((tecnico) =>
                  technicianMatchesService(tecnico, servicio)
                ).length;

                return (
                  <button
                    key={servicio.id_servicio}
                    type="button"
                    onClick={() => setSelectedServicioId(servicio.id_servicio)}
                    className={`min-h-64 rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      selected
                        ? "border-blue-500 ring-2 ring-blue-100"
                        : "border-white"
                    }`}
                  >
                    <div
                      className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${style.accent}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <h2 className="text-xl font-black text-slate-950">
                      {servicio.nombre_servicio}
                    </h2>
                    <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                      {servicio.descripcion_servicio || style.label}
                    </p>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {totalTecnicos}{" "}
                        {pluralize(totalTecnicos, "técnico", "técnicos")}
                      </span>
                      <ArrowRight className="h-5 w-5 text-blue-600" />
                    </div>
                  </button>
                );
              })}
            </section>

            {servicios.length === 0 && (
              <EmptyState
                title="Aún no hay servicios activos para solicitar"
                description="Cuando administración habilite servicios, aparecerán aquí para que puedas filtrarlos por comuna."
                icon={Wrench}
              />
            )}

            {selectedServicio && (
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold uppercase text-blue-700">
                      <Search className="h-4 w-4" />
                      Técnicos disponibles
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">
                      {selectedServicio.nombre_servicio}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {tecnicosDisponibles.length}{" "}
                      {pluralize(
                        tecnicosDisponibles.length,
                        "resultado",
                        "resultados"
                      )}{" "}
                      para el filtro actual.
                    </p>
                  </div>

                  <div className="grid w-full gap-3 lg:w-auto lg:grid-cols-[20rem_auto] lg:items-end">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase text-slate-500">
                        Filtrar por comuna
                      </label>
                      <select
                        value={selectedComunaId}
                        onChange={(event) =>
                          setSelectedComunaId(Number(event.target.value))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option value={0}>Todas las comunas</option>
                        {comunas.map((comuna) => (
                          <option key={comuna.id_comuna} value={comuna.id_comuna}>
                            {comuna.nombre_comuna}
                          </option>
                        ))}
                      </select>
                    </div>

                    {canRequestService ? (
                      <Link
                        to={requestHref}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
                      >
                        <ClipboardList className="h-4 w-4" />
                        Solicitar este servicio
                      </Link>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                        Este flujo está disponible para clientes. Usa tu panel
                        para gestionar las acciones de tu rol.
                      </div>
                    )}
                  </div>
                </div>

                {tecnicosDisponibles.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-slate-900">
                      {selectedComuna
                        ? `No encontramos técnicos disponibles en ${selectedComuna.nombre_comuna}`
                        : "No hay técnicos disponibles para este servicio en este momento"}
                    </h3>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                      {selectedComuna
                        ? "No encontramos técnicos disponibles en esta comuna para el servicio seleccionado. Puedes cambiar la comuna o dejar la solicitud registrada para seguimiento."
                        : "Prueba filtrando por una comuna específica o solicita el servicio para que quede registrado en tu panel."}
                    </p>
                    {canRequestService && (
                      <Link
                        to={requestHref}
                        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-800"
                      >
                        <ClipboardList className="h-4 w-4" />
                        Solicitar este servicio
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {tecnicosDisponibles.map((tecnico) => (
                      <article
                        key={tecnico.usuario_rut}
                        className="rounded-2xl border border-slate-200 p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                              <Briefcase className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-black text-slate-950">
                                {tecnico.nombre_completo}
                              </h3>
                              <p className="text-sm text-slate-500">
                                {tecnico.nivel_tecnico} -{" "}
                                {tecnico.experiencia_anios} años
                              </p>
                            </div>
                          </div>

                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Verificado
                          </span>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-600">
                          {tecnico.descripcion_perfil}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            {tecnico.promedio_calificacion} (
                            {tecnico.total_resenas})
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            {tecnico.comunas.slice(0, 2).join(", ") ||
                              "Comunas por confirmar"}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Servicios;
