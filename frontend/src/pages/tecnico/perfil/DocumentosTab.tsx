import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import SectionCard from "../../../components/ui/SectionCard";
import Modal from "../../../components/ui/Modal";
import {
  deleteTechnicianDocument,
  getTechnicianDocuments,
  uploadTechnicianDocument,
  type DocumentoTecnico,
} from "../../../services/technicianService";
import { formatDate, getUploadUrl } from "../../../utils/format";

const TIPOS_DOCUMENTO = [
  "CERTIFICADO_TECNICO",
  "TITULO",
  "ANTECEDENTES",
  "CARNET_IDENTIDAD",
  "OTRO",
] as const;

const TIPO_LABELS: Record<string, string> = {
  CERTIFICADO_TECNICO: "Certificado técnico",
  TITULO: "Título / Diploma",
  ANTECEDENTES: "Certificado de antecedentes",
  CARNET_IDENTIDAD: "Cédula de identidad",
  OTRO: "Otro documento",
};

function tipoLabel(tipo: string) {
  return TIPO_LABELS[tipo] ?? tipo.replaceAll("_", " ");
}

function EstadoBadge({ documento }: { documento: DocumentoTecnico }) {
  const estado = documento.estado_documento;

  if (estado === "APROBADO") {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Aprobado
      </span>
    );
  }

  if (estado === "RECHAZADO") {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
        <XCircle className="h-3.5 w-3.5" />
        Rechazado
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
      <Clock className="h-3.5 w-3.5" />
      Pendiente de revisión
    </span>
  );
}

interface DocumentosTabProps {
  rut: string;
}

function DocumentosTab({ rut }: DocumentosTabProps) {
  const [documentos, setDocumentos] = useState<DocumentoTecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [tipoDocumento, setTipoDocumento] = useState<string>(TIPOS_DOCUMENTO[0]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendienteEliminar, setPendienteEliminar] =
    useState<DocumentoTecnico | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function cargarDocumentos() {
    setLoading(true);
    setError("");
    try {
      const data = await getTechnicianDocuments(rut);
      setDocumentos(data);
    } catch {
      setError("No pudimos cargar tus documentos. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDocumentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rut]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!archivo) {
      setError("Selecciona un archivo para subir.");
      return;
    }

    try {
      setUploading(true);
      await uploadTechnicianDocument({
        tecnico_usuario_rut: rut,
        tipo_documento: tipoDocumento,
        archivo,
      });
      setSuccess("Documento subido. Queda pendiente de revisión.");
      setArchivo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await cargarDocumentos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos subir el documento."
      );
    } finally {
      setUploading(false);
    }
  }

  async function confirmarEliminar() {
    if (!pendienteEliminar) return;

    setError("");
    setSuccess("");
    try {
      setDeleting(true);
      await deleteTechnicianDocument(pendienteEliminar.id_documento);
      setSuccess("Documento eliminado. Ya puedes subir uno nuevo.");
      setPendienteEliminar(null);
      await cargarDocumentos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos eliminar el documento."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {success}
        </div>
      )}

      <SectionCard
        title="Subir documento"
        description="Formatos recomendados: PDF o imagen. Cada documento pasa por revisión del administrador."
      >
        <form
          onSubmit={handleUpload}
          className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="tipo_documento"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Tipo de documento
              </label>
              <select
                id="tipo_documento"
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
              >
                {TIPOS_DOCUMENTO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipoLabel(tipo)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="archivo"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Archivo
              </label>
              <input
                id="archivo"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-teal-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="fixya-btn-primary px-5 py-3 text-sm disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Subiendo..." : "Subir"}
          </button>
        </form>
      </SectionCard>

      <SectionCard
        title="Mis documentos"
        description="Estado de revisión de cada certificado que has subido."
      >
        {loading ? (
          <div className="rounded-xl bg-slate-50 p-8 text-center font-medium text-slate-600">
            Cargando documentos...
          </div>
        ) : documentos.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aún no has subido documentos"
            description="Sube tu certificado técnico y otros documentos para que la administración valide tu perfil."
          />
        ) : (
          <div className="space-y-3">
            {documentos.map((documento) => {
              const puedeEliminar =
                documento.estado_documento !== "APROBADO" &&
                !documento.documento_aprobado;

              return (
                <article
                  key={documento.id_documento}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {tipoLabel(documento.tipo_documento)}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-600">
                        {documento.nombre_archivo}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Subido el {formatDate(documento.fecha_subida)}
                      </p>
                    </div>
                    <EstadoBadge documento={documento} />
                  </div>

                  {documento.estado_documento === "RECHAZADO" &&
                    documento.motivo_rechazo && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-semibold">Motivo del rechazo</p>
                          <p className="mt-0.5">{documento.motivo_rechazo}</p>
                          <p className="mt-1 text-xs text-rose-600">
                            Elimina este documento y vuelve a subir la versión
                            corregida.
                          </p>
                        </div>
                      </div>
                    )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={getUploadUrl(documento.archivo_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver documento
                    </a>

                    {puedeEliminar && (
                      <button
                        type="button"
                        onClick={() => setPendienteEliminar(documento)}
                        className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {documento.estado_documento === "RECHAZADO"
                          ? "Eliminar y reenviar"
                          : "Eliminar"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>

      <Modal
        open={pendienteEliminar !== null}
        onClose={() => (deleting ? null : setPendienteEliminar(null))}
        title="Eliminar documento"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            ¿Seguro que quieres eliminar{" "}
            <span className="font-semibold text-slate-900">
              {pendienteEliminar
                ? tipoLabel(pendienteEliminar.tipo_documento)
                : ""}
            </span>
            ? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setPendienteEliminar(null)}
              disabled={deleting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarEliminar}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:bg-rose-300"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DocumentosTab;
