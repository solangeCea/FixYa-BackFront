import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  ClipboardList,
  Hammer,
  KeyRound,
  MapPin,
  PlugZap,
  RefreshCw,
  Search,
  ShieldCheck,
  ShowerHead,
  Star,
  Wrench,
  X,
} from "lucide-react";

import Navbar from "../components/Navbar";
import EmptyState from "../components/ui/EmptyState";
import { useAuth } from "../context/AuthContext";
import { getComunas, getRegiones, getServicios } from "../services/catalogService";
import type { Comuna, Region, Servicio } from "../services/catalogService";
import { getPublicTechnicianProfiles } from "../services/technicianService";
import type { TecnicoPublicProfile } from "../services/technicianService";

type ServiceStyle = {
  icon: typeof Wrench;
  accent: string;
  description: string;
};

const serviceStyles: Record<string, ServiceStyle> = {
  electricidad: {
    icon: PlugZap,
    accent: "bg-[#FFF4D8] text-[#8C5F1D]",
    description: "Instalaciones, enchufes, luminarias y fallas eléctricas.",
  },
  gasfiteria: {
    icon: ShowerHead,
    accent: "bg-[#E9F4F3] text-[#123F66]",
    description: "Filtraciones, cañerías, grifería y artefactos del hogar.",
  },
  carpinteria: {
    icon: Hammer,
    accent: "bg-[#F3E7D8] text-[#7A4F1A]",
    description: "Puertas, muebles, terminaciones y reparaciones de madera.",
  },
  cerrajeria: {
    icon: KeyRound,
    accent: "bg-[#EEF1F4] text-[#123F66]",
    description: "Cerraduras, llaves, chapas y accesos del hogar.",
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

  if (normalized.includes("electric")) return serviceStyles.electricidad;
  if (normalized.includes("gasfiter")) return serviceStyles.gasfiteria;
  if (normalized.includes("carpinter")) return serviceStyles.carpinteria;
  if (normalized.includes("cerrajer")) return serviceStyles.cerrajeria;

  return {
    icon: Wrench,
    accent: "bg-[#F8F5EF] text-[#123F66]",
    description: "Servicio técnico publicado por FixYa.",
  };
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function technicianMatchesService(
  tecnico: TecnicoPublicProfile,
  servicio: Servicio | null
) {
  if (!servicio) return false;

  const selected = normalizeText(servicio.nombre_servicio);
  return tecnico.servicios.some((item) => {
    const technicianService = normalizeText(item);
    return (
      technicianService.includes(selected) || selected.includes(technicianService)
    );
  });
}

function technicianMatchesComuna(
  tecnico: TecnicoPublicProfile,
  selectedComunaId: number,
  comunas: Comuna[]
) {
  if (!selectedComunaId) return false;

  const comuna = comunas.find((item) => item.id_comuna === selectedComunaId);
  if (!comuna) return false;

  const selected = normalizeText(comuna.nombre_comuna);
  return tecnico.comunas.some((item) => {
    const technicianComuna = normalizeText(item);
    return technicianComuna.includes(selected) || selected.includes(technicianComuna);
  });
}

function technicianMatchesSearch(tecnico: TecnicoPublicProfile, query: string) {
  if (!query.trim()) return true;

  const search = normalizeText(query);
  const haystack = [
    tecnico.nombre_completo,
    tecnico.nivel_tecnico,
    tecnico.descripcion_perfil,
    ...tecnico.servicios,
    ...tecnico.comunas,
  ]
    .map(normalizeText)
    .join(" ");

  return haystack.includes(search);
}

function Servicios() {
  const { usuario } = useAuth();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoPublicProfile[]>([]);
  const [selectedServicioId, setSelectedServicioId] = useState<number | null>(
    null
  );
  const [selectedRegionId, setSelectedRegionId] = useState(0);
  const [selectedComunaId, setSelectedComunaId] = useState(0);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTecnico, setSelectedTecnico] =
    useState<TecnicoPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function updateMarketplace(
    serviciosData: Servicio[],
    regionesData: Region[],
    comunasData: Comuna[],
    tecnicosData: TecnicoPublicProfile[]
  ) {
    const serviciosDisponibles = serviciosData.filter(
      (servicio) =>
        servicio.estado_servicio &&
        tecnicosData.some((tecnico) => technicianMatchesService(tecnico, servicio))
    );

    setServicios(serviciosDisponibles);
    setRegiones(regionesData);
    setComunas(comunasData);
    setTecnicos(tecnicosData);
    setSelectedServicioId((current) =>
      serviciosDisponibles.some((servicio) => servicio.id_servicio === current)
        ? current
        : null
    );
    setSelectedRegionId((current) =>
      regionesData.some((region) => region.id_region === current) ? current : 0
    );
    setSelectedComunaId((current) =>
      comunasData.some((comuna) => comuna.id_comuna === current) ? current : 0
    );
  }

  async function cargarMarketplace() {
    try {
      setLoading(true);
      setError("");

      const [serviciosData, regionesData, comunasData, tecnicosData] =
        await Promise.all([
          getServicios(),
          getRegiones(),
          getComunas(),
          getPublicTechnicianProfiles(),
        ]);

      updateMarketplace(serviciosData, regionesData, comunasData, tecnicosData);
    } catch {
      setServicios([]);
      setRegiones([]);
      setComunas([]);
      setTecnicos([]);
      setSelectedServicioId(null);
      setSelectedRegionId(0);
      setSelectedComunaId(0);
      setError(
        "No pudimos cargar los servicios disponibles. Intenta actualizar los resultados."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    Promise.all([
      getServicios(),
      getRegiones(),
      getComunas(),
      getPublicTechnicianProfiles(),
    ])
      .then(([serviciosData, regionesData, comunasData, tecnicosData]) => {
        if (!active) return;
        updateMarketplace(serviciosData, regionesData, comunasData, tecnicosData);
      })
      .catch(() => {
        if (!active) return;
        setServicios([]);
        setRegiones([]);
        setComunas([]);
        setTecnicos([]);
        setSelectedServicioId(null);
        setError(
          "No pudimos cargar los servicios disponibles. Intenta actualizar los resultados."
        );
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

  const selectedRegion = useMemo(
    () =>
      regiones.find((region) => region.id_region === selectedRegionId) ?? null,
    [regiones, selectedRegionId]
  );

  const comunasBySelectedRegion = useMemo(() => {
    if (!selectedRegionId) return [];

    return comunas.filter(
      (comuna) => comuna.region_id_region === selectedRegionId
    );
  }, [comunas, selectedRegionId]);

  const technicianCountByService = useMemo(() => {
    return servicios.reduce<Map<number, number>>((counts, servicio) => {
      counts.set(
        servicio.id_servicio,
        tecnicos.filter((tecnico) => technicianMatchesService(tecnico, servicio))
          .length
      );
      return counts;
    }, new Map());
  }, [servicios, tecnicos]);

  const tecnicosDelServicio = useMemo(() => {
    return tecnicos.filter((tecnico) =>
      technicianMatchesService(tecnico, selectedServicio)
    );
  }, [tecnicos, selectedServicio]);

  const tecnicosDisponibles = useMemo(() => {
    if (!selectedServicio || !selectedComunaId) return [];

    return tecnicosDelServicio
      .filter((tecnico) => technicianMatchesComuna(tecnico, selectedComunaId, comunas))
      .filter((tecnico) => technicianMatchesSearch(tecnico, searchTerm));
  }, [
    comunas,
    searchTerm,
    selectedComunaId,
    selectedServicio,
    tecnicosDelServicio,
  ]);

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
  const totalTecnicosForSelected = selectedServicio
    ? technicianCountByService.get(selectedServicio.id_servicio) ?? 0
    : 0;
  const readyForResults = Boolean(selectedServicio && selectedComunaId);

  function handleRegionChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedRegionId(Number(event.target.value));
    setSelectedComunaId(0);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchTerm(searchDraft.trim());
  }

  function clearFilters() {
    setSelectedRegionId(0);
    setSelectedComunaId(0);
    setSearchDraft("");
    setSearchTerm("");
  }

  return (
    <div className="min-h-screen bg-[#F8F5EF]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E6E0D6] bg-white px-3 py-1 text-xs font-black uppercase text-[#123F66]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#C8872D]" />
              Catálogo FixYa
            </p>
            <h1 className="text-3xl font-black tracking-tight text-[#0E1B2A] sm:text-4xl">
              Servicios disponibles en FixYa
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[#5F6B7A]">
              Explora los servicios que cuentan con técnicos registrados y
              disponibles en tu zona.
            </p>
          </div>

          <button
            type="button"
            onClick={cargarMarketplace}
            disabled={loading}
            className="fixya-btn-secondary px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : undefined}
            />
            Actualizar
          </button>
        </div>

        {loading && (
          <div className="fixya-card rounded-2xl p-8 text-center text-[#5F6B7A]">
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
          <div className="space-y-7">
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#0E1B2A]">
                    Elige un servicio
                  </h2>
                  <p className="mt-1 text-sm text-[#5F6B7A]">
                    Primero selecciona una categoría. Después podrás filtrar por
                    ubicación y búsqueda.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E6E0D6] bg-white px-3 py-1.5 text-xs font-black text-[#123F66]">
                  <Briefcase className="h-3.5 w-3.5 text-[#C8872D]" />
                  {servicios.length}{" "}
                  {pluralize(servicios.length, "servicio disponible", "servicios disponibles")}
                </span>
              </div>

              {servicios.length === 0 ? (
                <EmptyState
                  title="Aún no hay servicios disponibles."
                  description="Cuando existan técnicos registrados para un servicio, aparecerá aquí."
                  icon={Wrench}
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {servicios.map((servicio) => {
                    const style = getServiceStyle(servicio.nombre_servicio);
                    const Icon = style.icon;
                    const selected = servicio.id_servicio === selectedServicioId;
                    const totalTecnicos =
                      technicianCountByService.get(servicio.id_servicio) ?? 0;

                    return (
                      <button
                        key={servicio.id_servicio}
                        type="button"
                        onClick={() => setSelectedServicioId(servicio.id_servicio)}
                        className={`fixya-card-hover rounded-2xl border bg-white p-5 text-left transition ${
                          selected
                            ? "border-[#C8872D] ring-2 ring-[#C8872D]/20"
                            : "border-[#E6E0D6]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.accent}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-base font-black text-[#102033]">
                              {servicio.nombre_servicio}
                            </h3>
                            <p className="mt-1 line-clamp-3 text-sm leading-5 text-[#5F6B7A]">
                              {servicio.descripcion_servicio || style.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F5EF] px-3 py-1 text-xs font-black text-[#123F66]">
                            <Briefcase className="h-3.5 w-3.5" />
                            {totalTecnicos}{" "}
                            {pluralize(totalTecnicos, "técnico", "técnicos")}
                          </span>
                          {selected && (
                            <span className="inline-flex items-center gap-1 text-xs font-black text-[#2F5F46]">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Seleccionado
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="fixya-card rounded-2xl p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-xs font-black uppercase text-[#123F66]">
                    <Search className="h-4 w-4 text-[#C8872D]" />
                    Filtros
                  </p>
                  <h2 className="mt-1 text-xl font-black text-[#0E1B2A]">
                    {selectedServicio
                      ? `Técnicos para ${selectedServicio.nombre_servicio}`
                      : "Busca por servicio y zona"}
                  </h2>
                </div>
                {selectedServicio && (
                  <p className="text-sm font-semibold text-[#5F6B7A]">
                    {totalTecnicosForSelected}{" "}
                    {pluralize(totalTecnicosForSelected, "técnico ofrece", "técnicos ofrecen")}{" "}
                    este servicio
                  </p>
                )}
              </div>

              <form
                onSubmit={handleSearch}
                className="grid gap-4 lg:grid-cols-[1fr_1fr_1.15fr_auto_auto] lg:items-end"
              >
                <div>
                  <label
                    htmlFor="region-filter"
                    className="mb-2 block text-xs font-black uppercase text-[#5F6B7A]"
                  >
                    Región
                  </label>
                  <select
                    id="region-filter"
                    value={selectedRegionId}
                    onChange={handleRegionChange}
                    className="fixya-input"
                  >
                    <option value={0}>Todas las regiones</option>
                    {regiones.map((region) => (
                      <option key={region.id_region} value={region.id_region}>
                        {region.nombre_region}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="comuna-filter"
                    className="mb-2 block text-xs font-black uppercase text-[#5F6B7A]"
                  >
                    Comuna
                  </label>
                  <select
                    id="comuna-filter"
                    value={selectedComunaId}
                    onChange={(event) =>
                      setSelectedComunaId(Number(event.target.value))
                    }
                    disabled={!selectedRegionId || comunasBySelectedRegion.length === 0}
                    className="fixya-input disabled:cursor-not-allowed disabled:bg-[#F1ECE3] disabled:text-[#5F6B7A]"
                  >
                    <option value={0}>
                      {selectedRegionId
                        ? "Selecciona una comuna"
                        : "Selecciona región primero"}
                    </option>
                    {comunasBySelectedRegion.map((comuna) => (
                      <option key={comuna.id_comuna} value={comuna.id_comuna}>
                        {comuna.nombre_comuna}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="search-filter"
                    className="mb-2 block text-xs font-black uppercase text-[#5F6B7A]"
                  >
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F6B7A]" />
                    <input
                      id="search-filter"
                      value={searchDraft}
                      onChange={(event) => setSearchDraft(event.target.value)}
                      placeholder="Nombre, especialidad o comuna"
                      className="fixya-input pl-10"
                    />
                  </div>
                </div>

                <button type="submit" className="fixya-btn-primary px-5 py-3">
                  <Search className="h-4 w-4" />
                  Buscar
                </button>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="fixya-btn-secondary px-5 py-3"
                >
                  <X className="h-4 w-4" />
                  Limpiar
                </button>
              </form>

              {selectedServicio && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#5F6B7A]">
                  <span className="rounded-full bg-[#F8F5EF] px-3 py-1 font-semibold">
                    Servicio: {selectedServicio.nombre_servicio}
                  </span>
                  {selectedRegion && (
                    <span className="rounded-full bg-[#F8F5EF] px-3 py-1 font-semibold">
                      Región: {selectedRegion.nombre_region}
                    </span>
                  )}
                  {selectedComuna && (
                    <span className="rounded-full bg-[#F8F5EF] px-3 py-1 font-semibold">
                      Comuna: {selectedComuna.nombre_comuna}
                    </span>
                  )}
                  {searchTerm && (
                    <span className="rounded-full bg-[#F8F5EF] px-3 py-1 font-semibold">
                      Búsqueda: {searchTerm}
                    </span>
                  )}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-black uppercase text-[#123F66]">
                    <Briefcase className="h-4 w-4 text-[#C8872D]" />
                    Técnicos asociados
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#0E1B2A]">
                    {readyForResults
                      ? `${selectedServicio?.nombre_servicio} en ${selectedComuna?.nombre_comuna}`
                      : "Disponibilidad por servicio y comuna"}
                  </h2>
                </div>
                {readyForResults && (
                  <p className="text-sm font-semibold text-[#5F6B7A]">
                    {tecnicosDisponibles.length}{" "}
                    {pluralize(tecnicosDisponibles.length, "resultado", "resultados")}
                  </p>
                )}
              </div>

              {!selectedServicio ? (
                <EmptyState
                  title="Selecciona un servicio para ver técnicos disponibles."
                  description="El catálogo muestra primero los servicios. Al elegir uno, podrás revisar disponibilidad por comuna."
                  icon={Wrench}
                />
              ) : !selectedComunaId ? (
                <EmptyState
                  title="Selecciona una comuna para ver técnicos disponibles."
                  description="Así mostramos solo profesionales que atienden esa zona."
                  icon={MapPin}
                />
              ) : tecnicosDisponibles.length === 0 ? (
                <EmptyState
                  title="No encontramos técnicos disponibles con esos filtros."
                  description="Prueba otra comuna, limpia la búsqueda o vuelve a revisar más tarde."
                  icon={MapPin}
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {tecnicosDisponibles.map((tecnico) => (
                    <article
                      key={tecnico.usuario_rut}
                      className="fixya-card fixya-card-hover rounded-2xl p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#123F66] text-sm font-black text-white">
                            {getInitials(tecnico.nombre_completo) || "FY"}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-black text-[#102033]">
                              {tecnico.nombre_completo}
                            </h3>
                            <p className="text-sm text-[#5F6B7A]">
                              {tecnico.nivel_tecnico} · {tecnico.experiencia_anios}{" "}
                              años
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#DDEADF] px-3 py-1 text-xs font-black text-[#2F5F46]">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Verificado
                        </span>
                      </div>

                      <div className="mt-5 space-y-3 text-sm text-[#5F6B7A]">
                        <p className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-[#C8872D]" />
                          <span className="font-bold text-[#102033]">
                            {selectedServicio.nombre_servicio}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#C8872D]" />
                          {selectedComuna?.nombre_comuna ||
                            tecnico.comunas.slice(0, 2).join(", ")}
                        </p>
                        <p className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-[#C8872D] text-[#C8872D]" />
                          <span className="font-bold text-[#102033]">
                            {tecnico.promedio_calificacion || 0}
                          </span>
                          <span>
                            ({tecnico.total_resenas}{" "}
                            {pluralize(tecnico.total_resenas, "reseña", "reseñas")})
                          </span>
                        </p>
                      </div>

                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#5F6B7A]">
                        {tecnico.descripcion_perfil ||
                          "Perfil técnico disponible para revisar más información."}
                      </p>

                      <button
                        type="button"
                        onClick={() => setSelectedTecnico(tecnico)}
                        className="mt-5 w-full rounded-xl bg-[#123F66] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0E1B2A]"
                      >
                        Ver perfil
                      </button>
                    </article>
                  ))}
                </div>
              )}

              {selectedServicio && canRequestService && (
                <div className="fixya-card flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-black text-[#102033]">
                      ¿Necesitas crear una solicitud?
                    </h3>
                    <p className="mt-1 text-sm text-[#5F6B7A]">
                      Guardaremos el servicio seleccionado y la comuna si ya la
                      elegiste.
                    </p>
                  </div>
                  <Link to={requestHref} className="fixya-btn-accent px-5 py-3 text-sm">
                    <ClipboardList className="h-4 w-4" />
                    Solicitar servicio
                  </Link>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {selectedTecnico && (
        <div
          onClick={() => setSelectedTecnico(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1B2A]/60 p-4"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#123F66] text-lg font-black text-white">
                  {getInitials(selectedTecnico.nombre_completo) || "FY"}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#102033]">
                    {selectedTecnico.nombre_completo}
                  </h2>
                  <p className="mt-1 text-sm text-[#5F6B7A]">
                    {selectedTecnico.nivel_tecnico} ·{" "}
                    {selectedTecnico.experiencia_anios} años de experiencia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTecnico(null)}
                className="rounded-xl bg-[#F8F5EF] p-2 text-[#5F6B7A] hover:text-[#102033]"
                aria-label="Cerrar perfil"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="rounded-2xl border border-[#E6E0D6] bg-[#F8F5EF] p-4 text-sm leading-6 text-[#5F6B7A]">
              {selectedTecnico.descripcion_perfil ||
                "Este técnico aún no agregó una descripción detallada."}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#E6E0D6] p-4">
                <p className="text-xs font-black uppercase text-[#5F6B7A]">
                  Servicio
                </p>
                <p className="mt-1 font-black text-[#102033]">
                  {selectedServicio?.nombre_servicio ||
                    selectedTecnico.servicios.join(", ")}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E6E0D6] p-4">
                <p className="text-xs font-black uppercase text-[#5F6B7A]">
                  Comuna
                </p>
                <p className="mt-1 font-black text-[#102033]">
                  {selectedComuna?.nombre_comuna ||
                    selectedTecnico.comunas.join(", ")}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E6E0D6] p-4">
                <p className="text-xs font-black uppercase text-[#5F6B7A]">
                  Calificación
                </p>
                <p className="mt-1 font-black text-[#102033]">
                  {selectedTecnico.promedio_calificacion || 0} estrellas ·{" "}
                  {selectedTecnico.total_resenas} reseñas
                </p>
              </div>
              <div className="rounded-2xl border border-[#E6E0D6] p-4">
                <p className="text-xs font-black uppercase text-[#5F6B7A]">
                  Estado
                </p>
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#DDEADF] px-3 py-1 text-sm font-black text-[#2F5F46]">
                  <CheckCircle className="h-4 w-4" />
                  Verificado
                </p>
              </div>
            </div>

            {canRequestService && (
              <Link
                to={requestHref}
                className="fixya-btn-accent mt-6 w-full px-5 py-3 text-sm"
              >
                <ClipboardList className="h-4 w-4" />
                Solicitar servicio
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Servicios;
