import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";

import Navbar from "../components/Navbar";
import EmptyState from "../components/ui/EmptyState";
import Avatar from "../components/ui/Avatar";
import Modal from "../components/ui/Modal";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { getPublicTechnicianProfiles } from "../services/technicianService";
import type { TecnicoPublicProfile } from "../services/technicianService";

function oficioPrincipal(tecnico: TecnicoPublicProfile) {
  return tecnico.servicios[0] ?? tecnico.nivel_tecnico ?? "Técnico especialista";
}

function comunaPrincipal(tecnico: TecnicoPublicProfile) {
  return tecnico.comunas[0] ?? "Comuna por confirmar";
}

function Tecnicos() {
  useDocumentTitle("Técnicos verificados · FixYa");

  const [tecnicos, setTecnicos] = useState<TecnicoPublicProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTecnico, setSelectedTecnico] =
    useState<TecnicoPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function cargarTecnicos() {
    try {
      setLoading(true);
      setError("");

      const data = await getPublicTechnicianProfiles();
      setTecnicos(data);
    } catch {
      setError("No pudimos cargar los técnicos verificados. Intenta actualizar la búsqueda.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarTecnicos();
  }, []);

  const filteredTecnicos = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return tecnicos.filter(
      (tecnico) =>
        tecnico.nombre_completo.toLowerCase().includes(search) ||
        tecnico.nivel_tecnico.toLowerCase().includes(search) ||
        tecnico.descripcion_perfil.toLowerCase().includes(search)
    );
  }, [tecnicos, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-teal-700">
              Directorio de especialistas
            </p>
            <h1 className="text-3xl font-bold text-slate-950 md:text-4xl">
              Técnicos verificados
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Cada perfil fue revisado y aprobado por FixYa. Compara experiencia,
              reseñas y cobertura antes de solicitar ayuda.
            </p>
          </div>

          <button
            onClick={cargarTecnicos}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : undefined} />
            Actualizar
          </button>
        </header>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label htmlFor="buscar-tecnico" className="sr-only">
            Buscar técnico por nombre, nivel o especialidad
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="buscar-tecnico"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre, nivel o especialidad"
              className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-medium text-slate-600 shadow-sm">
            Buscando técnicos verificados...
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTecnicos.map((tecnico) => (
              <article
                key={tecnico.usuario_rut}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-100/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={tecnico.nombre_completo} size="md" />
                    <div>
                      <h2 className="text-base font-bold leading-tight text-slate-900">
                        {tecnico.nombre_completo}
                      </h2>
                      <p className="mt-0.5 text-sm font-semibold text-teal-700">
                        {oficioPrincipal(tecnico)}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Verificado
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {tecnico.promedio_calificacion}
                    <span className="font-normal text-slate-400">
                      ({tecnico.total_resenas})
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {comunaPrincipal(tecnico)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    {tecnico.experiencia_anios} años
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                  {tecnico.descripcion_perfil}
                </p>

                {tecnico.servicios.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tecnico.servicios.slice(0, 3).map((servicio) => (
                      <span
                        key={servicio}
                        className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"
                      >
                        {servicio}
                      </span>
                    ))}
                    {tecnico.servicios.length > 3 && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        +{tecnico.servicios.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setSelectedTecnico(tecnico)}
                  className="fixya-btn-primary mt-6 w-full px-4 py-3 text-sm"
                >
                  Ver perfil
                </button>
              </article>
            ))}

            {filteredTecnicos.length === 0 && (
              <div className="sm:col-span-2 xl:col-span-3">
                <EmptyState
                  title="No encontramos técnicos verificados"
                  description="Ajusta la búsqueda o vuelve más tarde. Cuando administración verifique nuevos perfiles, aparecerán aquí."
                  icon={Briefcase}
                />
              </div>
            )}
          </div>
        )}
      </main>

      <Modal
        open={Boolean(selectedTecnico)}
        onClose={() => setSelectedTecnico(null)}
        title={selectedTecnico?.nombre_completo || "Perfil técnico"}
        description={
          selectedTecnico
            ? `${oficioPrincipal(selectedTecnico)} · Técnico verificado por FixYa`
            : undefined
        }
      >
        {selectedTecnico && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center">
              <Avatar name={selectedTecnico.nombre_completo} size="xl" />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verificado
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-900 ring-1 ring-slate-200">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {selectedTecnico.promedio_calificacion} ·{" "}
                    {selectedTecnico.total_resenas} reseñas
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {selectedTecnico.nivel_tecnico} ·{" "}
                  {selectedTecnico.experiencia_anios} años de experiencia
                </p>
              </div>
            </div>

            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                Sobre el técnico
              </h3>
              <p className="text-sm leading-6 text-slate-700">
                {selectedTecnico.descripcion_perfil}
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                Especialidades
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedTecnico.servicios.length > 0 ? (
                  selectedTecnico.servicios.map((servicio) => (
                    <span
                      key={servicio}
                      className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700"
                    >
                      {servicio}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Este técnico aún no tiene especialidades publicadas.
                  </p>
                )}
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                  <MapPin className="h-4 w-4" />
                  Comunas que atiende
                </h3>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedTecnico.comunas.length > 0
                    ? selectedTecnico.comunas.join(", ")
                    : "Comunas por confirmar"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Contacto
                </h3>
                <p className="flex items-center gap-2 text-sm text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {selectedTecnico.correo || "Sin correo registrado"}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {selectedTecnico.telefono || "Sin teléfono registrado"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Tecnicos;
