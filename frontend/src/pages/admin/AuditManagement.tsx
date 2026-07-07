import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  FileText,
  UserCog,
  Star,
  Wrench,
  ScrollText,
} from "lucide-react";

import { getAuditLog } from "../../services/auditService";
import type { AuditLogEntry } from "../../services/auditService";
import EmptyState from "../../components/ui/EmptyState";

type EntidadFilter = "all" | "TECNICO" | "DOCUMENTO" | "RESENA" | "USUARIO";

// Etiqueta y color por acción, para que la bitácora se lea de un vistazo.
const ACCION_META: Record<string, { label: string; classes: string }> = {
  APROBAR_TECNICO: { label: "Aprobar técnico", classes: "bg-emerald-100 text-emerald-700" },
  OBSERVAR_TECNICO: { label: "Observar técnico", classes: "bg-amber-100 text-amber-700" },
  SUSPENDER_TECNICO: { label: "Suspender técnico", classes: "bg-rose-100 text-rose-700" },
  RECHAZAR_TECNICO: { label: "Rechazar técnico", classes: "bg-rose-100 text-rose-700" },
  REVISAR_TECNICO: { label: "Revisar técnico", classes: "bg-slate-100 text-slate-700" },
  ELIMINAR_TECNICO: { label: "Eliminar técnico", classes: "bg-rose-100 text-rose-700" },
  APROBAR_DOCUMENTO: { label: "Aprobar documento", classes: "bg-emerald-100 text-emerald-700" },
  RECHAZAR_DOCUMENTO: { label: "Rechazar documento", classes: "bg-rose-100 text-rose-700" },
  SUSPENDER_USUARIO: { label: "Suspender usuario", classes: "bg-rose-100 text-rose-700" },
  REACTIVAR_USUARIO: { label: "Reactivar usuario", classes: "bg-emerald-100 text-emerald-700" },
  APROBAR_RESENA: { label: "Aprobar reseña", classes: "bg-emerald-100 text-emerald-700" },
  OCULTAR_RESENA: { label: "Ocultar reseña", classes: "bg-slate-100 text-slate-700" },
};

const ENTIDAD_ICONO: Record<string, typeof FileText> = {
  TECNICO: Wrench,
  DOCUMENTO: FileText,
  RESENA: Star,
  USUARIO: UserCog,
};

function accionMeta(accion: string) {
  return (
    ACCION_META[accion] || {
      label: accion,
      classes: "bg-slate-100 text-slate-700",
    }
  );
}

function formatearFecha(fecha: string) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditManagement() {
  const [entradas, setEntradas] = useState<AuditLogEntry[]>([]);
  const [filter, setFilter] = useState<EntidadFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function cargarAuditoria() {
    try {
      setLoading(true);
      setError("");

      const data = await getAuditLog({ limite: 300 });
      setEntradas(data);
    } catch (err) {
      console.error("Error cargando auditoría:", err);
      setError(
        "No pudimos cargar la bitácora de auditoría. Intenta actualizar el listado."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarAuditoria();
  }, []);

  const filtradas = useMemo(() => {
    if (filter === "all") return entradas;
    return entradas.filter((e) => e.entidad_tipo === filter);
  }, [entradas, filter]);

  const filtros: { key: EntidadFilter; label: string; count: number }[] = [
    { key: "all", label: "Todas", count: entradas.length },
    {
      key: "TECNICO",
      label: "Técnicos",
      count: entradas.filter((e) => e.entidad_tipo === "TECNICO").length,
    },
    {
      key: "DOCUMENTO",
      label: "Documentos",
      count: entradas.filter((e) => e.entidad_tipo === "DOCUMENTO").length,
    },
    {
      key: "RESENA",
      label: "Reseñas",
      count: entradas.filter((e) => e.entidad_tipo === "RESENA").length,
    },
    {
      key: "USUARIO",
      label: "Usuarios",
      count: entradas.filter((e) => e.entidad_tipo === "USUARIO").length,
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <RefreshCw className="mx-auto mb-3 animate-spin text-teal-600" />
          <p className="font-medium text-gray-700">
            Cargando bitácora de auditoría...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
            <ShieldCheck className="text-teal-700" size={28} />
            Auditoría de acciones administrativas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Registro de quién hizo qué, sobre quién, por qué y desde dónde. Es
            evidencia de trazabilidad: no se edita ni se elimina.
          </p>
        </div>

        <button
          onClick={cargarAuditoria}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Actualizar bitácora
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {filtros.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`rounded-2xl p-5 text-left shadow-sm ${
              filter === item.key
                ? "bg-teal-700 text-white"
                : "bg-white text-gray-900 hover:bg-gray-50"
            }`}
          >
            <p className="text-sm opacity-80">{item.label}</p>
            <p className="mt-2 text-3xl font-bold">{item.count}</p>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">
            Bitácora ({filtradas.length})
          </h2>
        </div>

        {filtradas.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sin registros de auditoría para este filtro"
              description="Las acciones administrativas (aprobar/rechazar documentos, revisar técnicos, moderar reseñas, suspender usuarios) quedarán registradas aquí."
              icon={ScrollText}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Administrador</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Entidad</th>
                  <th className="px-4 py-3">Afectado</th>
                  <th className="px-4 py-3">Cambio de estado</th>
                  <th className="px-4 py-3">Motivo / detalle</th>
                  <th className="px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtradas.map((e) => {
                  const meta = accionMeta(e.accion);
                  const EntIcon = ENTIDAD_ICONO[e.entidad_tipo] || FileText;

                  return (
                    <tr key={e.id_audit} className="align-top hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatearFecha(e.fecha)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">
                          {e.admin_correo || "—"}
                        </p>
                        <p className="text-xs text-slate-500">{e.admin_rut || ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${meta.classes}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <EntIcon size={14} className="text-slate-400" />
                          {e.entidad_tipo}
                          {e.entidad_id ? (
                            <span className="text-xs text-slate-400">
                              #{e.entidad_id}
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {e.usuario_afectado_rut || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {e.estado_antes || e.estado_despues ? (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-slate-600">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5">
                              {e.estado_antes || "—"}
                            </span>
                            <ArrowRight size={12} className="text-slate-400" />
                            <span className="rounded bg-slate-100 px-1.5 py-0.5">
                              {e.estado_despues || "—"}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-slate-600">
                        {e.motivo && <p className="break-words">{e.motivo}</p>}
                        {e.detalle && (
                          <p className="break-words text-xs text-slate-400">
                            {e.detalle}
                          </p>
                        )}
                        {!e.motivo && !e.detalle && (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                        {e.ip || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
