import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  FileText,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserCog,
  XCircle,
} from "lucide-react";

import {
  approveTechnicianDocument,
  approveTechnician,
  getTechnicianDocuments,
  getTechnicians,
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
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleOpenTechnicianProfile(tech)}
                          className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
                        >
                          Ver perfil técnico
                        </button>

                        {verificationState !== "APROBADO" && (
                          <button
                            onClick={() => handleApprove(tech.usuario_rut)}
                            disabled={actionLoading === tech.usuario_rut}
                            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-green-300"
                          >
                            {actionLoading === tech.usuario_rut
                              ? "Aprobando técnico..."
                              : "Aprobar técnico pendiente"}
                          </button>
                        )}
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
                            document.documento_aprobado
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {document.documento_aprobado
                            ? "Documento aprobado"
                            : "Pendiente de validacion"}
                        </span>
                      </div>

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

                        {!document.documento_aprobado && (
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
                              ? "Aprobando documento..."
                              : "Aprobar documento tecnico"}
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
    </div>
  );
}
