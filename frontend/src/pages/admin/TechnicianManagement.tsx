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
  rejectTechnician,
  rejectTechnicianDocument,
} from "../../services/technicianService";
import type { DocumentoTecnico, Tecnico } from "../../services/technicianService";

import { getUsers } from "../../services/userService";
import type { UsuarioAdmin } from "../../services/userService";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import API_URL from "../../services/api";

type FilterType = "all" | "verified" | "pending";

interface TecnicoAdmin extends Tecnico {
  nombre_completo: string;
  correo: string;
  telefono: string | null;
}

const evidenceLabels: Record<string, string> = {
  CERTIFICADO: "Certificado",
  TITULO: "Título",
  CURSO: "Curso",
  LICENCIA: "Licencia",
  FOTO_TRABAJO: "Fotos de trabajos anteriores",
  REFERENCIA_LABORAL: "Referencias laborales",
  PORTAFOLIO: "Portafolio",
  EXPERIENCIA_OFICIO: "Evidencia de experiencia en oficio",
  OTRO: "Otra evidencia relevante",
  CERTIFICADO_TECNICO: "Certificado técnico",
  ANTECEDENTES: "Antecedentes",
};

function getEvidenceLabel(tipo: string) {
  return evidenceLabels[tipo] || tipo;
}

function getEvidenceStatusStyle(status: DocumentoTecnico["estado_revision"]) {
  if (status === "APROBADO") {
    return "bg-[#DDEADF] text-[#2F5F46]";
  }

  if (status === "RECHAZADO") {
    return "bg-red-50 text-red-700";
  }

  return "bg-[#FFF4D8] text-[#8C5F1D]";
}

function getEvidenceStatusLabel(status: DocumentoTecnico["estado_revision"]) {
  if (status === "APROBADO") return "Aprobada";
  if (status === "RECHAZADO") return "Rechazada";
  return "Pendiente de revisión";
}

export default function TechnicianManagement() {
  const [technicians, setTechnicians] = useState<TecnicoAdmin[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechnician, setSelectedTechnician] =
    useState<TecnicoAdmin | null>(null);
  const [documents, setDocuments] = useState<DocumentoTecnico[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [documentActionLoading, setDocumentActionLoading] = useState<number | null>(
    null
  );
  const [profileObservation, setProfileObservation] = useState("");
  const [documentObservations, setDocumentObservations] = useState<
    Record<number, string>
  >({});
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
    } catch (err) {
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

  useEffect(() => {
    async function cargarEvidenciasTecnico(rut: string) {
      try {
        setLoadingDocuments(true);
        setError("");
        const data = await getTechnicianDocuments(rut);
        setDocuments(data);
      } catch (err) {
        setDocuments([]);
        setError(
          err instanceof Error
            ? err.message
            : "No pudimos cargar las evidencias del técnico."
        );
      } finally {
        setLoadingDocuments(false);
      }
    }

    if (!selectedTechnician) {
      setDocuments([]);
      setProfileObservation("");
      setDocumentObservations({});
      return;
    }

    setProfileObservation(selectedTechnician.observacion_verificacion || "");
    cargarEvidenciasTecnico(selectedTechnician.usuario_rut);
  }, [selectedTechnician]);

  async function handleApprove(rut: string, observation = profileObservation) {
    try {
      setActionLoading(rut);
      setError("");
      setSuccess("");

      await approveTechnician(rut, observation);
      setSuccess("Técnico aprobado. Ya puede aparecer como verificado.");
      await cargarTecnicos();
      setSelectedTechnician(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos aprobar este técnico. Intenta nuevamente."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectTechnician(rut: string) {
    if (!profileObservation.trim()) {
      setError("Escribe una observación para que el técnico sepa qué corregir.");
      return;
    }

    try {
      setActionLoading(rut);
      setError("");
      setSuccess("");

      await rejectTechnician(rut, profileObservation);
      setSuccess("Técnico rechazado con observación registrada.");
      await cargarTecnicos();
      setSelectedTechnician(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos rechazar este técnico. Intenta nuevamente."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveEvidence(documento: DocumentoTecnico) {
    try {
      setDocumentActionLoading(documento.id_documento);
      setError("");
      setSuccess("");

      await approveTechnicianDocument(
        documento.id_documento,
        documentObservations[documento.id_documento]
      );

      setSuccess("Este documento fue aprobado por el administrador.");
      setDocuments(await getTechnicianDocuments(documento.tecnico_usuario_rut));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos aprobar esta evidencia. Intenta nuevamente."
      );
    } finally {
      setDocumentActionLoading(null);
    }
  }

  async function handleRejectEvidence(documento: DocumentoTecnico) {
    const observation = documentObservations[documento.id_documento]?.trim();

    if (!observation) {
      setError("Escribe una observación para que el técnico sepa qué corregir.");
      return;
    }

    try {
      setDocumentActionLoading(documento.id_documento);
      setError("");
      setSuccess("");

      await rejectTechnicianDocument(documento.id_documento, observation);
      setSuccess("Evidencia rechazada con observación registrada.");
      setDocuments(await getTechnicianDocuments(documento.tecnico_usuario_rut));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos rechazar esta evidencia. Intenta nuevamente."
      );
    } finally {
      setDocumentActionLoading(null);
    }
  }

  const filteredTechnicians = useMemo(() => {
    return technicians.filter((tech) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "verified" && tech.tecnico_verificado) ||
        (filter === "pending" && !tech.tecnico_verificado);

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
    (tech) => tech.tecnico_verificado
  ).length;

  const totalPendientes = technicians.filter(
    (tech) => !tech.tecnico_verificado
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
              onClick={() => setFilter("verified")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                filter === "verified"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Verificados
            </button>

            <button
              onClick={() => setFilter("pending")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                filter === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pendientes
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
                {filteredTechnicians.map((tech) => (
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
                      {tech.tecnico_verificado ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          Verificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                          <XCircle className="h-4 w-4" />
                          Pendiente de verificación
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedTechnician(tech)}
                          className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
                        >
                          Ver perfil técnico
                        </button>

                        {!tech.tecnico_verificado && (
                          <button
                            onClick={() => setSelectedTechnician(tech)}
                            className="rounded-lg bg-[#C8872D] px-3 py-2 text-sm font-medium text-white hover:bg-[#AD711F]"
                          >
                            {actionLoading === tech.usuario_rut
                              ? "Revisando evidencias..."
                              : "Revisar evidencias"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
        onClose={() => setSelectedTechnician(null)}
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
                  {selectedTechnician.tecnico_verificado
                    ? "Verificado"
                    : "Pendiente de verificación"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#E6E0D6] bg-[#FBFAF7] p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#0E1B2A]">
                    Evidencias del técnico
                  </h3>
                  <p className="mt-1 text-sm text-[#5F6B7A]">
                    Revisa certificados, fotos, referencias o portafolios antes
                    de aprobar el perfil.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#102033] ring-1 ring-[#E6E0D6]">
                  {documents.length} evidencias
                </span>
              </div>

              {loadingDocuments ? (
                <p className="rounded-xl bg-white p-4 text-sm text-[#5F6B7A]">
                  Cargando evidencias...
                </p>
              ) : documents.length === 0 ? (
                <EmptyState
                  title="Este técnico aún no subió evidencias"
                  description="Para aprobar este técnico, primero debe existir al menos una evidencia revisada o una justificación registrada."
                  icon={FileText}
                />
              ) : (
                <div className="space-y-4">
                  {documents.map((documento) => (
                    <article
                      key={documento.id_documento}
                      className="rounded-xl border border-[#E6E0D6] bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="font-black text-[#102033]">
                            {getEvidenceLabel(documento.tipo_documento)}
                          </p>
                          <a
                            href={`${API_URL}${documento.archivo_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#123F66] hover:text-[#C8872D]"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {documento.nombre_archivo}
                          </a>
                        </div>
                        <span
                          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-black ${getEvidenceStatusStyle(
                            documento.estado_revision
                          )}`}
                        >
                          {getEvidenceStatusLabel(documento.estado_revision)}
                        </span>
                      </div>

                      {documento.observacion_revision && (
                        <p className="mt-3 rounded-lg bg-[#F8F5EF] p-3 text-sm leading-6 text-[#5F6B7A]">
                          {documento.observacion_revision}
                        </p>
                      )}

                      <textarea
                        value={documentObservations[documento.id_documento] || ""}
                        onChange={(event) =>
                          setDocumentObservations((prev) => ({
                            ...prev,
                            [documento.id_documento]: event.target.value,
                          }))
                        }
                        rows={2}
                        placeholder="Observación para esta evidencia"
                        className="fixya-input mt-3 resize-none"
                      />

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveEvidence(documento)}
                          disabled={documentActionLoading === documento.id_documento}
                          className="rounded-xl bg-[#2F5F46] px-4 py-2 text-sm font-bold text-white hover:bg-[#244B38] disabled:opacity-60"
                        >
                          Aprobar evidencia
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectEvidence(documento)}
                          disabled={documentActionLoading === documento.id_documento}
                          className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          Rechazar evidencia
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-[#E6E0D6] bg-white p-5">
              <label className="mb-2 block text-sm font-bold text-[#102033]">
                Observación o justificación del perfil
              </label>
              <textarea
                value={profileObservation}
                onChange={(event) => setProfileObservation(event.target.value)}
                rows={3}
                placeholder="Ej: evidencia revisada, experiencia validada por portafolio o motivo de rechazo"
                className="fixya-input resize-none"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {!selectedTechnician.tecnico_verificado && (
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedTechnician.usuario_rut)}
                    disabled={actionLoading === selectedTechnician.usuario_rut}
                    className="rounded-xl bg-[#2F5F46] px-4 py-3 text-sm font-bold text-white hover:bg-[#244B38] disabled:opacity-60"
                  >
                    Aprobar técnico
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRejectTechnician(selectedTechnician.usuario_rut)}
                  disabled={actionLoading === selectedTechnician.usuario_rut}
                  className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  Rechazar técnico
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
