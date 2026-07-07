import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  CheckCircle,
  ExternalLink,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  XCircle,
} from "lucide-react";

import {
  approveTechnicianDocument,
  approveTechnician,
  deleteTechnician,
  getTechnicianDocuments,
  getTechnicians,
  rejectTechnicianDocument,
  reviewTechnician,
} from "../../services/technicianService";
import type {
  DocumentoTecnico,
  Tecnico,
} from "../../services/technicianService";

import { getUsers } from "../../services/userService";
import type { UsuarioAdmin } from "../../services/userService";
import API_URL from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";

type FilterType =
  | "all"
  | "APROBADO"
  | "PENDIENTE"
  | "EN_REVISION"
  | "OBSERVADO"
  | "RECHAZADO"
  | "SUSPENDIDO";

interface TecnicoAdmin extends Tecnico {
  nombre_completo: string;
  correo: string;
  telefono: string | null;
}

function getDocumentUrl(archivoUrl: string) {
  if (archivoUrl.startsWith("http")) return archivoUrl;
  return `${API_URL}${archivoUrl}`;
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha registrada";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
  }).format(date);
}

function getVerificationState(tech: Tecnico) {
  return tech.estado_verificacion || (tech.tecnico_verificado ? "APROBADO" : "PENDIENTE");
}

function getVerificationLabel(state: string) {
  if (state === "APROBADO") return "Aprobado";
  if (state === "EN_REVISION") return "En revision";
  if (state === "OBSERVADO") return "Observado";
  if (state === "RECHAZADO") return "Rechazado";
  if (state === "SUSPENDIDO") return "Suspendido";
  return "Pendiente";
}

function getVerificationClass(state: string) {
  if (state === "APROBADO") return "bg-green-100 text-green-700";
  if (state === "RECHAZADO" || state === "SUSPENDIDO") {
    return "bg-red-100 text-red-700";
  }
  if (state === "OBSERVADO") return "bg-orange-100 text-orange-700";
  if (state === "EN_REVISION") return "bg-blue-100 text-blue-700";
  return "bg-yellow-100 text-yellow-700";
}

export default function TechnicianManagement() {
  const { usuario } = useAuth();
  const [technicians, setTechnicians] = useState<TecnicoAdmin[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechnician, setSelectedTechnician] =
    useState<TecnicoAdmin | null>(null);
  const [documents, setDocuments] = useState<DocumentoTecnico[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [documentActionLoading, setDocumentActionLoading] = useState<
    number | null
  >(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function cargarTecnicos() {
    try {
      setLoading(true);
      setError("");

      const [tecnicosData, usuariosData] = await Promise.all([
        getTechnicians(),
        getUsers(),
      ]);

      const tecnicosCompletos: TecnicoAdmin[] = tecnicosData.map(
        (tecnico) => {
          const usuario = usuariosData.find(
            (user: UsuarioAdmin) => user.rut === tecnico.usuario_rut
          );

          return {
            ...tecnico,
            nombre_completo:
              usuario?.nombre_completo || "Técnico sin usuario asociado",
            correo: usuario?.correo || "Correo no registrado",
            telefono: usuario?.telefono || "Teléfono no registrado",
          };
        }
      );

      setTechnicians(tecnicosCompletos);
    } catch {
      setError(
        "No pudimos cargar los técnicos registrados. Intenta actualizar el listado."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarTecnicos();
  }, []);

  async function cargarDocumentosTecnico(rut: string) {
    try {
      setDocumentsLoading(true);
      setDocumentsError("");

      const data = await getTechnicianDocuments(rut);
      setDocuments(data);
    } catch {
      setDocuments([]);
      setDocumentsError(
        "No pudimos cargar los documentos del tecnico. Intenta nuevamente."
      );
    } finally {
      setDocumentsLoading(false);
    }
  }

  function handleOpenTechnicianProfile(tech: TecnicoAdmin) {
    setSelectedTechnician(tech);
    setSuccess("");
    setError("");
    cargarDocumentosTecnico(tech.usuario_rut);
  }

  async function handleApprove(rut: string) {
    try {
      setActionLoading(rut);
      setError("");
      setSuccess("");

      await approveTechnician(rut);
      setSuccess("Técnico aprobado. Ya puede aparecer como verificado.");
      await cargarTecnicos();
    } catch {
      setError("No pudimos aprobar este técnico. Intenta nuevamente.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveDocument(idDocumento: number) {
    if (!usuario?.rut) {
      setError("No pudimos identificar al administrador actual.");
      return;
    }

    try {
      setDocumentActionLoading(idDocumento);
      setError("");
      setSuccess("");

      const updatedDocument = await approveTechnicianDocument(
        idDocumento,
        usuario.rut
      );

      setDocuments((currentDocuments) =>
        currentDocuments.map((document) =>
          document.id_documento === updatedDocument.id_documento
            ? updatedDocument
            : document
        )
      );
      setSuccess("Documento tecnico aprobado correctamente.");
    } catch {
      setError("No pudimos aprobar este documento tecnico. Intenta nuevamente.");
    } finally {
      setDocumentActionLoading(null);
    }
  }

  async function handleConfirmRejectDocument() {
    if (!rejectDocTarget) return;

    const motivo = rejectDocText.trim();
    if (!motivo) {
      setError("Escribe el motivo del rechazo antes de continuar.");
      return;
    }

    try {
      setDocumentActionLoading(rejectDocTarget.id_documento);
      setError("");
      setSuccess("");

      const updatedDocument = await rejectTechnicianDocument(
        rejectDocTarget.id_documento,
        motivo
      );

      setDocuments((currentDocuments) =>
        currentDocuments.map((document) =>
          document.id_documento === updatedDocument.id_documento
            ? updatedDocument
            : document
        )
      );
      setSuccess("Documento rechazado. El técnico verá el motivo.");
      setRejectDocTarget(null);
      setRejectDocText("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos rechazar este documento. Intenta nuevamente."
      );
    } finally {
      setDocumentActionLoading(null);
    }
  }

  const [revisionTarget, setRevisionTarget] = useState<{
    tech: TecnicoAdmin;
    mode: "suspender" | "observar";
  } | null>(null);
  const [revisionText, setRevisionText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TecnicoAdmin | null>(null);
  const [rejectDocTarget, setRejectDocTarget] =
    useState<DocumentoTecnico | null>(null);
  const [rejectDocText, setRejectDocText] = useState("");

  // Actualiza un técnico en memoria para reflejar la acción sin recargar.
  function applyTechnicianUpdate(rut: string, cambios: Partial<TecnicoAdmin>) {
    setTechnicians((prev) =>
      prev.map((tech) =>
        tech.usuario_rut === rut ? { ...tech, ...cambios } : tech
      )
    );
    setSelectedTechnician((prev) =>
      prev && prev.usuario_rut === rut ? { ...prev, ...cambios } : prev
    );
  }

  function openRevision(tech: TecnicoAdmin, mode: "suspender" | "observar") {
    setError("");
    setSuccess("");
    setRevisionText(mode === "observar" ? tech.observacion_admin || "" : "");
    setRevisionTarget({ tech, mode });
  }

  async function handleConfirmRevision() {
    if (!revisionTarget) return;

    const { tech, mode } = revisionTarget;
    const texto = revisionText.trim();

    if (mode === "observar" && !texto) {
      setError("Escribe una observación antes de guardar.");
      return;
    }

    const estado = mode === "suspender" ? "SUSPENDIDO" : "OBSERVADO";
    const observacion =
      texto || (mode === "suspender" ? "Suspendido por el administrador" : null);

    try {
      setActionLoading(tech.usuario_rut);
      setError("");
      setSuccess("");

      const res = await reviewTechnician(tech.usuario_rut, estado, observacion);

      applyTechnicianUpdate(tech.usuario_rut, {
        estado_verificacion: res.estado_verificacion,
        tecnico_verificado: res.tecnico_verificado,
        observacion_admin: res.observacion_admin,
        fecha_revision: res.fecha_revision,
        admin_revisor_rut: res.admin_revisor_rut,
      });

      setSuccess(
        mode === "suspender"
          ? "Técnico suspendido correctamente."
          : "Observación guardada correctamente."
      );
      setRevisionTarget(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos completar la acción."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReactivate(tech: TecnicoAdmin) {
    try {
      setActionLoading(tech.usuario_rut);
      setError("");
      setSuccess("");

      const res = await reviewTechnician(tech.usuario_rut, "APROBADO", null);

      applyTechnicianUpdate(tech.usuario_rut, {
        estado_verificacion: res.estado_verificacion,
        tecnico_verificado: res.tecnico_verificado,
        observacion_admin: res.observacion_admin,
        fecha_revision: res.fecha_revision,
        admin_revisor_rut: res.admin_revisor_rut,
      });

      setSuccess("Técnico reactivado. Vuelve a estado aprobado.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos reactivar al técnico."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    const rut = deleteTarget.usuario_rut;

    try {
      setActionLoading(rut);
      setError("");
      setSuccess("");

      await deleteTechnician(rut);

      setTechnicians((prev) => prev.filter((tech) => tech.usuario_rut !== rut));
      if (selectedTechnician?.usuario_rut === rut) setSelectedTechnician(null);
      setSuccess("Técnico eliminado correctamente.");
      setDeleteTarget(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos eliminar al técnico."
      );
    } finally {
      setActionLoading(null);
    }
  }

  const filteredTechnicians = useMemo(() => {
    return technicians.filter((tech) => {
      const matchesFilter =
        filter === "all" || getVerificationState(tech) === filter;

      const search = searchTerm.toLowerCase();

      const matchesSearch =
        tech.nombre_completo.toLowerCase().includes(search) ||
        tech.correo.toLowerCase().includes(search) ||
        tech.usuario_rut.toLowerCase().includes(search) ||
        tech.nivel_tecnico.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  }, [technicians, filter, searchTerm]);

  const totalVerificados = technicians.filter(
    (tech) => getVerificationState(tech) === "APROBADO"
  ).length;

  const totalPendientes = technicians.filter(
    (tech) => getVerificationState(tech) !== "APROBADO"
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de técnicos
        </h1>
        <p className="mt-2 text-gray-600">
          Revisa perfiles técnicos, estados de verificación y datos de contacto.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total técnicos
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {technicians.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Verificados
          </p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {totalVerificados}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Pendientes
          </p>
          <p className="mt-2 text-3xl font-bold text-yellow-700">
            {totalPendientes}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre, correo, RUT o nivel"
              className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                filter === "all"
                  ? "bg-teal-700 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>

            <button
              onClick={() => setFilter("APROBADO")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                filter === "APROBADO"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Aprobados
            </button>

            <button
              onClick={() => setFilter("PENDIENTE")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                filter === "PENDIENTE"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pendientes
            </button>

            <button
              onClick={() => setFilter("EN_REVISION")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                filter === "EN_REVISION"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              En revision
            </button>

            <button
              onClick={() => setFilter("OBSERVADO")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                filter === "OBSERVADO"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Observados
            </button>

            <button
              onClick={() => setFilter("RECHAZADO")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                filter === "RECHAZADO"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Rechazados
            </button>

            <button
              onClick={() => setFilter("SUSPENDIDO")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                filter === "SUSPENDIDO"
                  ? "bg-red-700 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Suspendidos
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-gray-600">
            Cargando perfiles técnicos...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {success && !loading && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-700">
          {success}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    Técnico
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    Perfil
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    Experiencia
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredTechnicians.map((tech) => {
                  const verificationState = getVerificationState(tech);

                  return (
                  <tr
                    key={tech.usuario_rut}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100">
                          <UserCog className="h-5 w-5 text-teal-700" />
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900">
                            {tech.nombre_completo}
                          </p>
                          <p className="text-sm text-gray-500">
                            RUT: {tech.usuario_rut}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {tech.correo}
                        </p>

                        <p className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {tech.telefono}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {tech.nivel_tecnico}
                      </p>
                      <p className="mt-1 max-w-xs text-sm text-gray-500">
                        {tech.descripcion_perfil}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {tech.experiencia_anios} años
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      {verificationState === "APROBADO" ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getVerificationClass(verificationState)}`}>
                          <CheckCircle className="h-4 w-4" />
                          {getVerificationLabel(verificationState)}
                          <span className="hidden">
                          </span>
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getVerificationClass(verificationState)}`}>
                          <XCircle className="h-4 w-4" />
                          {getVerificationLabel(verificationState)}
                          <span className="hidden">
                          Pendiente de verificación
                          </span>
                        </span>
                      )}

                      {tech.observacion_admin && (
                        <p className="mt-2 flex max-w-[220px] items-start gap-1 text-xs text-orange-700">
                          <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
                          <span className="break-words">
                            {tech.observacion_admin}
                          </span>
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleOpenTechnicianProfile(tech)}
                          disabled={actionLoading === tech.usuario_rut}
                          className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                        >
                          Ver perfil técnico
                        </button>

                        {verificationState !== "APROBADO" &&
                          verificationState !== "SUSPENDIDO" && (
                            <button
                              onClick={() => handleApprove(tech.usuario_rut)}
                              disabled={actionLoading === tech.usuario_rut}
                              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Aprobar
                            </button>
                          )}

                        {verificationState === "SUSPENDIDO" ? (
                          <button
                            onClick={() => handleReactivate(tech)}
                            disabled={actionLoading === tech.usuario_rut}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Reactivar
                          </button>
                        ) : (
                          <button
                            onClick={() => openRevision(tech, "suspender")}
                            disabled={actionLoading === tech.usuario_rut}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            <Ban className="h-4 w-4" />
                            Suspender
                          </button>
                        )}

                        <button
                          onClick={() => openRevision(tech, "observar")}
                          disabled={actionLoading === tech.usuario_rut}
                          className="inline-flex items-center gap-1 rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                        >
                          <MessageSquare className="h-4 w-4" />
                          {tech.observacion_admin
                            ? "Editar observación"
                            : "Observación"}
                        </button>

                        <button
                          onClick={() => setDeleteTarget(tech)}
                          disabled={actionLoading === tech.usuario_rut}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredTechnicians.length === 0 && (
            <div className="p-6">
              <EmptyState
                title="No encontramos técnicos para este filtro"
                description="Ajusta la búsqueda o cambia el estado de verificación para revisar otros perfiles técnicos."
                icon={UserCog}
              />
            </div>
          )}
        </div>
      )}

      <Modal
        open={Boolean(selectedTechnician)}
        title={selectedTechnician?.nombre_completo || "Perfil técnico"}
        description={selectedTechnician?.descripcion_perfil || "Detalle administrativo del técnico."}
        onClose={() => {
          setSelectedTechnician(null);
          setDocuments([]);
          setDocumentsError("");
        }}
      >
        {selectedTechnician && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">
                  RUT
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedTechnician.usuario_rut}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">
                  Correo
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedTechnician.correo}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">
                  Teléfono
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedTechnician.telefono}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">
                  Nivel técnico
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedTechnician.nivel_tecnico}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">
                  Experiencia
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedTechnician.experiencia_anios} años
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">
                  Estado
                </p>
                <p className="mt-1 inline-flex items-center gap-2 font-semibold text-gray-900">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  {getVerificationLabel(getVerificationState(selectedTechnician))}
                  <span className="hidden">
                  {selectedTechnician.tecnico_verificado
                    ? "Verificado"
                    : "Pendiente de verificación"}
                  </span>
                </p>
              </div>
            </div>

            <section className="mt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Documentos tecnicos
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Evidencia subida por el tecnico para validar su perfil.
                  </p>
                </div>

                <FileText className="h-5 w-5 text-teal-700" />
              </div>

              {documentsLoading && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-600">
                  Cargando documentos tecnicos...
                </div>
              )}

              {documentsError && !documentsLoading && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {documentsError}
                </div>
              )}

              {!documentsLoading && !documentsError && documents.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-600">
                  No hay documentos tecnicos registrados para este perfil.
                </div>
              )}

              {!documentsLoading && !documentsError && documents.length > 0 && (
                <div className="space-y-3">
                  {documents.map((document) => (
                    <article
                      key={document.id_documento}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {document.tipo_documento}
                          </p>
                          <p className="mt-1 break-words text-sm text-gray-600">
                            {document.nombre_archivo}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Subido el {formatDate(document.fecha_subida)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            document.estado_documento === "APROBADO"
                              ? "bg-green-100 text-green-700"
                              : document.estado_documento === "RECHAZADO"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {document.estado_documento === "APROBADO"
                            ? "Documento aprobado"
                            : document.estado_documento === "RECHAZADO"
                            ? "Documento rechazado"
                            : "Pendiente de validacion"}
                        </span>
                      </div>

                      {document.estado_documento === "RECHAZADO" &&
                        document.motivo_rechazo && (
                          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                            <span className="font-semibold">Motivo: </span>
                            {document.motivo_rechazo}
                          </div>
                        )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <a
                          href={getDocumentUrl(document.archivo_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ver documento
                        </a>

                        {document.estado_documento !== "APROBADO" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleApproveDocument(document.id_documento)
                            }
                            disabled={
                              documentActionLoading === document.id_documento
                            }
                            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-green-300"
                          >
                            {documentActionLoading === document.id_documento
                              ? "Procesando..."
                              : "Aprobar documento"}
                          </button>
                        )}

                        {document.estado_documento !== "RECHAZADO" &&
                          !document.documento_aprobado && (
                            <button
                              type="button"
                              onClick={() => {
                                setRejectDocText("");
                                setRejectDocTarget(document);
                              }}
                              disabled={
                                documentActionLoading === document.id_documento
                              }
                              className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                              Rechazar documento
                            </button>
                          )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(revisionTarget)}
        title={
          revisionTarget?.mode === "suspender"
            ? "Suspender técnico"
            : "Observación del técnico"
        }
        description={
          revisionTarget?.mode === "suspender"
            ? `Suspenderás a ${revisionTarget?.tech.nombre_completo}. Puedes indicar el motivo.`
            : `Agrega o edita la observación de ${revisionTarget?.tech.nombre_completo}.`
        }
        onClose={() => setRevisionTarget(null)}
      >
        {revisionTarget && (
          <div className="mt-4 space-y-4">
            <textarea
              value={revisionText}
              onChange={(event) => setRevisionText(event.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={
                revisionTarget.mode === "suspender"
                  ? "Motivo de la suspensión (opcional)"
                  : "Escribe la observación para este técnico..."
              }
              className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRevisionTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRevision}
                disabled={actionLoading === revisionTarget.tech.usuario_rut}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                  revisionTarget.mode === "suspender"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-teal-700 hover:bg-teal-800"
                }`}
              >
                {actionLoading === revisionTarget.tech.usuario_rut
                  ? "Guardando..."
                  : revisionTarget.mode === "suspender"
                  ? "Suspender técnico"
                  : "Guardar observación"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="Eliminar técnico"
        description="Esta acción no se puede deshacer."
        onClose={() => setDeleteTarget(null)}
      >
        {deleteTarget && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Vas a eliminar a <strong>{deleteTarget.nombre_completo}</strong> (
              {deleteTarget.usuario_rut}). Se quitarán su perfil técnico,
              servicios, comunas, documentos y cotizaciones. Las solicitudes se
              conservan sin técnico asignado y la cuenta de usuario se mantiene.
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading === deleteTarget.usuario_rut}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {actionLoading === deleteTarget.usuario_rut
                  ? "Eliminando..."
                  : "Eliminar definitivamente"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(rejectDocTarget)}
        onClose={() => {
          setRejectDocTarget(null);
          setRejectDocText("");
        }}
        title="Rechazar documento"
        description="El técnico verá el motivo y podrá eliminarlo para reenviar una versión corregida."
        maxWidth="lg"
      >
        {rejectDocTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Documento:{" "}
              <span className="font-semibold text-slate-900">
                {rejectDocTarget.tipo_documento} · {rejectDocTarget.nombre_archivo}
              </span>
            </p>
            <div>
              <label
                htmlFor="motivo_rechazo"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Motivo del rechazo <span className="text-red-500">*</span>
              </label>
              <textarea
                id="motivo_rechazo"
                value={rejectDocText}
                onChange={(e) => setRejectDocText(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Ej: El certificado está ilegible / no corresponde al tipo indicado."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejectDocTarget(null);
                  setRejectDocText("");
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectDocument}
                disabled={
                  documentActionLoading === rejectDocTarget.id_documento
                }
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:bg-rose-300"
              >
                {documentActionLoading === rejectDocTarget.id_documento
                  ? "Rechazando..."
                  : "Rechazar documento"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
