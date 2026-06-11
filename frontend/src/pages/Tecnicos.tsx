import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Briefcase, CheckCircle, Mail, Phone, RefreshCw, Search, Star } from "lucide-react";

import Navbar from "../components/Navbar";
import { getPublicTechnicianProfiles } from "../services/technicianService";
import type { TecnicoPublicProfile } from "../services/technicianService";

function Tecnicos() {
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
      setError("No se pudieron cargar los perfiles de tecnicos.");
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
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Tecnicos verificados
            </h1>
            <p className="mt-2 text-gray-600">
              Revisa perfiles tecnicos aprobados por FixYa.
            </p>
          </div>

          <button
            onClick={cargarTecnicos}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre, nivel o especialidad"
              className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            Cargando tecnicos...
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredTecnicos.map((tecnico) => (
              <article
                key={tecnico.usuario_rut}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                      <Briefcase className="h-6 w-6 text-blue-700" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900">
                        {tecnico.nombre_completo}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {tecnico.nivel_tecnico} · {tecnico.experiencia_anios} anos
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    Verificado
                  </span>
                </div>

                <p className="text-sm text-gray-600">
                  {tecnico.descripcion_perfil}
                </p>

                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold text-gray-900">
                    {tecnico.promedio_calificacion}
                  </span>
                  <span>({tecnico.total_resenas} reseñas)</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {tecnico.servicios.slice(0, 3).map((servicio) => (
                    <span
                      key={servicio}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                      {servicio}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedTecnico(tecnico)}
                  className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Ver perfil
                </button>
              </article>
            ))}

            {filteredTecnicos.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm md:col-span-2 xl:col-span-3">
                No hay tecnicos verificados para mostrar.
              </div>
            )}
          </div>
        )}
      </main>

      {selectedTecnico && (
        <div
          onClick={() => setSelectedTecnico(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedTecnico.nombre_completo}
                </h2>
                <p className="mt-1 text-gray-600">
                  {selectedTecnico.descripcion_perfil}
                </p>
              </div>
              <button
                onClick={() => setSelectedTecnico(null)}
                className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">RUT</p>
                <p className="font-semibold text-gray-900">
                  {selectedTecnico.usuario_rut}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Nivel</p>
                <p className="font-semibold text-gray-900">
                  {selectedTecnico.nivel_tecnico}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Experiencia</p>
                <p className="font-semibold text-gray-900">
                  {selectedTecnico.experiencia_anios} anos
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Contacto</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {selectedTecnico.correo}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {selectedTecnico.telefono}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 md:col-span-2">
                <p className="text-sm text-gray-500">Servicios</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedTecnico.servicios.length > 0
                    ? selectedTecnico.servicios.join(", ")
                    : "Sin servicios asociados"}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 md:col-span-2">
                <p className="text-sm text-gray-500">Comunas</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedTecnico.comunas.length > 0
                    ? selectedTecnico.comunas.join(", ")
                    : "Sin comunas asociadas"}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 md:col-span-2">
                <p className="text-sm text-gray-500">Reputacion</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedTecnico.promedio_calificacion} estrellas ·{" "}
                  {selectedTecnico.total_resenas} reseñas
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tecnicos;
