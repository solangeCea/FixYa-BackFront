import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
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
  SlidersHorizontal,
  Star,
  Wrench,
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
  label: string;
};

const serviceStyle: Record<string, ServiceStyle> = {
  Electricidad: {
    icon: PlugZap,
    accent: "bg-yellow-100 text-yellow-700",
    label: "Instalaciones, enchufes y fallas eléctricas",
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
    setSelectedServicioId((current) => {
      const currentExists = serviciosDisponibles.some(
        (servicio) => servicio.id_servicio === current
      );

      return currentExists
        ? current
        : serviciosDisponibles[0]?.id_servicio ?? null;
    });
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

  const selectedComuna = useMemo(
    () => comunas.find((comuna) => comuna.id_comuna === selectedComunaId) ?? null,
    [comunas, selectedComunaId]
  );

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
    if (!selectedServicio || !selectedRegionId || !selectedComunaId) return [];

    return tecnicosDelServicio.filter((tecnico) =>
      technicianMatchesComuna(tecnico, selectedComunaId, comunas)
    );
  }, [
    comunas,
    selectedComunaId,
    selectedRegionId,
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
  const hasLocationFilter = Boolean(selectedRegionId && selectedComunaId);

  function handleServicioChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextServicioId = Number(event.target.value);
    setSelectedServicioId(nextServicioId || null);
  }

  function handleRegionChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedRegionId(Number(event.target.value));
    setSelectedComunaId(0);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-bold uppercase text-teal-800">
              <Home className="h-3.5 w-3.5" />
              Servicios FixYa
            </p>
            <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">
              Servicios para el hogar
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Explora servicios activos con técnicos registrados, elige una
              categoría y filtra por región y comuna para ver disponibilidad real.
            </p>
          </div>

          <button
            type="button"
            onClick={cargarMarketplace}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : undefined}
            />
            Actualizar resultados
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-8 text-center text-slate-600 shadow-sm">
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
          <div className="space-y-6">
            <section id="servicios-disponibles" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Servicios disponibles
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Catálogo de servicios activos según técnicos verificados en
                    FixYa.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
                  {servicios.length}{" "}
                  {pluralize(servicios.length, "servicio activo", "servicios activos")}
                </span>
              </div>

              {servicios.length === 0 ? (
                <EmptyState
                  title="Aún no hay servicios activos con técnicos registrados"
                  description="Cuando existan técnicos verificados para un servicio, aparecerá aquí para que puedas revisar disponibilidad por zona."
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
                        className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                          selected
                            ? "border-teal-600 ring-2 ring-teal-100"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.accent}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-base font-black text-slate-950">
                              {servicio.nombre_servicio}
                            </h3>
                            <p className="mt-1 text-sm leading-5 text-slate-600">
                              {servicio.descripcion_servicio || style.label}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            <Briefcase className="h-3.5 w-3.5" />
                            {totalTecnicos}{" "}
                            {pluralize(totalTecnicos, "técnico", "técnicos")}
                          </span>
                          {selected && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700">
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

            {selectedServicio && (
              <>
                <section className="sticky top-28 z-30 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur lg:top-24">
                  <div className="grid gap-4 lg:grid-cols-[1fr_18rem] lg:items-end">
                    <div>
                      <p className="flex items-center gap-2 text-xs font-bold uppercase text-teal-700">
                        <Search className="h-4 w-4" />
                        Servicio seleccionado
                      </p>
                      <h2 className="mt-1 text-xl font-black text-slate-950">
                        Estás viendo técnicos disponibles para:{" "}
                        <span className="text-teal-700">
                          {selectedServicio.nombre_servicio}
                        </span>
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {totalTecnicosForSelected}{" "}
                        {pluralize(
                          totalTecnicosForSelected,
                          "técnico registrado ofrece",
                          "técnicos registrados ofrecen"
                        )}{" "}
                        este servicio. Usa los filtros para revisar tu zona.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="service-switcher"
                        className="mb-2 block text-xs font-bold uppercase text-slate-500"
                      >
                        Cambiar servicio
                      </label>
                      <select
                        id="service-switcher"
                        value={selectedServicioId ?? ""}
                        onChange={handleServicioChange}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-100"
                      >
                        {servicios.map((servicio) => (
                          <option
                            key={servicio.id_servicio}
                            value={servicio.id_servicio}
                          >
                            {servicio.nombre_servicio}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-teal-700" />
                      <h2 className="font-black text-slate-950">
                        Filtros de disponibilidad
                      </h2>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                      <div>
                        <label
                          htmlFor="region-filter"
                          className="mb-2 block text-xs font-bold uppercase text-slate-500"
                        >
                          Región
                        </label>
                        <select
                          id="region-filter"
                          value={selectedRegionId}
                          onChange={handleRegionChange}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-100"
                        >
                          <option value={0}>Selecciona una región</option>
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
                          className="mb-2 block text-xs font-bold uppercase text-slate-500"
                        >
                          Comuna
                        </label>
                        <select
                          id="comuna-filter"
                          value={selectedComunaId}
                          onChange={(event) =>
                            setSelectedComunaId(Number(event.target.value))
                          }
                          disabled={
                            !selectedRegionId ||
                            comunasBySelectedRegion.length === 0
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                        >
                          <option value={0}>
                            {selectedRegionId
                              ? "Selecciona una comuna"
                              : "Selecciona una región primero"}
                          </option>
                          {comunasBySelectedRegion.map((comuna) => (
                            <option key={comuna.id_comuna} value={comuna.id_comuna}>
                              {comuna.nombre_comuna}
                            </option>
                          ))}
                        </select>
                        {!selectedRegionId && (
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            Selecciona una región para ver sus comunas disponibles.
                          </p>
                        )}
                        {selectedRegionId &&
                          comunasBySelectedRegion.length === 0 && (
                            <p className="mt-2 text-xs font-semibold text-slate-500">
                              No hay comunas disponibles para esta región.
                            </p>
                          )}
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
                          Este flujo está disponible para clientes.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold uppercase text-teal-700">
                        <Briefcase className="h-4 w-4" />
                        Técnicos disponibles
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-slate-950">
                        {hasLocationFilter
                          ? `${selectedServicio.nombre_servicio} en ${selectedComuna?.nombre_comuna}`
                          : selectedServicio.nombre_servicio}
                      </h2>
                    </div>
                    <p className="text-sm font-semibold text-slate-500">
                      {hasLocationFilter
                        ? `${tecnicosDisponibles.length} ${pluralize(
                            tecnicosDisponibles.length,
                            "resultado",
                            "resultados"
                          )} para el filtro actual`
                        : "Selecciona región y comuna para ver resultados"}
                    </p>
                  </div>

                  {!selectedRegionId ? (
                    <EmptyState
                      title="Selecciona una región para comenzar"
                      description="Luego podrás elegir una comuna y ver técnicos disponibles para el servicio seleccionado."
                      icon={MapPin}
                    />
                  ) : !selectedComunaId ? (
                    <EmptyState
                      title={`Selecciona una comuna de ${
                        selectedRegion?.nombre_region ?? "la región elegida"
                      }`}
                      description="La comuna depende de la región seleccionada, así evitamos mostrar una lista demasiado larga."
                      icon={MapPin}
                    />
                  ) : tecnicosDisponibles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-500 shadow-sm">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-slate-900">
                        Por ahora no hay técnicos disponibles para este servicio
                        en tu zona.
                      </h3>
                      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                        Puedes cambiar la comuna o solicitar el servicio para que
                        quede registrado en tu panel de cliente.
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
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                <Briefcase className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-black text-slate-950">
                                  {tecnico.nombre_completo}
                                </h3>
                                <p className="text-sm text-slate-500">
                                  {tecnico.nivel_tecnico} -{" "}
                                  {tecnico.experiencia_anios} años
                                </p>
                              </div>
                            </div>

                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
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
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Servicios;
