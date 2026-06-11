import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ClipboardList, Eye, RefreshCw } from "lucide-react";

import { getSolicitudes } from "../../services/solicitudService";
import type { Solicitud } from "../../services/solicitudService";
import { getComunas, getServicios } from "../../services/catalogService";
import type { Comuna, Servicio } from "../../services/catalogService";
import Modal from "../../components/ui/Modal";

function getEstadoStyle(estado: string) {
  if (estado === "INICIADO") return "bg-cyan-100 text-cyan-700";
  if (estado === "ASIGNADO") return "bg-amber-100 text-amber-700";
  if (estado === "EN_PROCESO") return "bg-teal-100 text-teal-700";
  if (estado === "FINALIZADO") return "bg-emerald-100 text-emerald-700";
  if (estado === "CANCELADO") return "bg-rose-100 text-rose-700";

  return "bg-gray-100 text-gray-700";
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">
        {value || "No informado"}
      </p>
    </div>
  );
}

function RequestManagement() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);

  async function cargarDatos() {
    try {
      setLoading(true);
      setError("");

      const [solicitudesData, serviciosData, comunasData] = await Promise.all([
        getSolicitudes(),
        getServicios(),
        getComunas(),
      ]);

      setSolicitudes(solicitudesData);
      setServicios(serviciosData);
      setComunas(comunasData);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar las solicitudes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const solicitudesActivas = useMemo(
    () => solicitudes.filter((s) => s.estado_trabajo !== "FINALIZADO"),
    [solicitudes]
  );

  const solicitudesSinTecnico = useMemo(
    () => solicitudes.filter((s) => !s.tecnico_usuario_rut),
    [solicitudes]
  );

  const serviciosPorId = useMemo(() => {
    return new Map(
      servicios.map((servicio) => [
        servicio.id_servicio,
        servicio.nombre_servicio,
      ])
    );
  }, [servicios]);

  const comunasPorId = useMemo(() => {
    return new Map(
      comunas.map((comuna) => [comuna.id_comuna, comuna.nombre_comuna])
    );
  }, [comunas]);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Gestion de Solicitudes
        </h1>
        <p className="mt-2 text-gray-600">
          Vista administrativa de seguimiento. Los tecnicos aceptan trabajos desde su panel.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total solicitudes</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {solicitudes.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Solicitudes activas</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">
            {solicitudesActivas.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Sin tecnico</p>
          <p className="mt-2 text-3xl font-bold text-yellow-700">
            {solicitudesSinTecnico.length}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Solicitudes del sistema
        </h2>

        <button
          onClick={cargarDatos}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          Cargando solicitudes...
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm">
          No hay solicitudes registradas.
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map((solicitud) => (
            <div
              key={solicitud.id_solicitud}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100">
                      <ClipboardList className="text-teal-700" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {solicitud.titulo_solicitud}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Cliente: {solicitud.usuario_rut}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600">
                    {solicitud.descripcion_problema}
                  </p>

                  <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                    <p>
                      <strong>Direccion:</strong> {solicitud.direccion}
                    </p>
                    <p>
                      <strong>Urgencia:</strong> {solicitud.urgencia}
                    </p>
                    <p>
                      <strong>Servicio:</strong>{" "}
                      {serviciosPorId.get(solicitud.servicio_id_servicio) ||
                        `ID ${solicitud.servicio_id_servicio}`}
                    </p>
                    <p>
                      <strong>Comuna:</strong>{" "}
                      {comunasPorId.get(solicitud.comuna_id_comuna) ||
                        `ID ${solicitud.comuna_id_comuna}`}
                    </p>
                    <p>
                      <strong>Tecnico:</strong>{" "}
                      {solicitud.tecnico_usuario_rut || "Pendiente de aceptacion"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getEstadoStyle(
                      solicitud.estado_trabajo
                    )}`}
                  >
                    {solicitud.estado_trabajo}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedSolicitud(solicitud)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                  >
                    <Eye className="h-4 w-4" />
                    Ver detalle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selectedSolicitud)}
        title={
          selectedSolicitud
            ? `Solicitud #${selectedSolicitud.id_solicitud}`
            : "Detalle de solicitud"
        }
        description={selectedSolicitud?.titulo_solicitud}
        onClose={() => setSelectedSolicitud(null)}
      >
        {selectedSolicitud && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${getEstadoStyle(
                  selectedSolicitud.estado_trabajo
                )}`}
              >
                {selectedSolicitud.estado_trabajo}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                Urgencia: {selectedSolicitud.urgencia}
              </span>
            </div>

            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
              {selectedSolicitud.descripcion_problema}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailItem label="Cliente" value={selectedSolicitud.usuario_rut} />
              <DetailItem
                label="Técnico"
                value={
                  selectedSolicitud.tecnico_usuario_rut ||
                  "Pendiente de aceptación"
                }
              />
              <DetailItem
                label="Servicio"
                value={
                  serviciosPorId.get(selectedSolicitud.servicio_id_servicio) ||
                  `ID ${selectedSolicitud.servicio_id_servicio}`
                }
              />
              <DetailItem
                label="Comuna"
                value={
                  comunasPorId.get(selectedSolicitud.comuna_id_comuna) ||
                  `ID ${selectedSolicitud.comuna_id_comuna}`
                }
              />
              <DetailItem label="Dirección" value={selectedSolicitud.direccion} />
              <DetailItem label="Referencia" value={selectedSolicitud.ubicacion_problema_referencia} />
              <DetailItem label="Tipo de problema" value={selectedSolicitud.tipo_problema} />
              <DetailItem label="Fecha creación" value={selectedSolicitud.fecha_creacion} />
              <DetailItem label="Costo final" value={selectedSolicitud.costo_final} />
              <DetailItem label="Fecha real" value={selectedSolicitud.fecha_real} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default RequestManagement;
