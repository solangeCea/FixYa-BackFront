import { useState } from "react";
import { AlertTriangle, Paperclip, X } from "lucide-react";

import Modal from "../ui/Modal";
import {
  crearConflicto,
  TIPOS_CONFLICTO,
} from "../../services/conflictoService";

interface ReportarConflictoModalProps {
  open: boolean;
  idSolicitud: number;
  tituloSolicitud?: string;
  onClose: () => void;
  onReportado?: () => void;
}

const MAX_ARCHIVOS = 5;
const MAX_MB = 5;
const TIPOS_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export default function ReportarConflictoModal({
  open,
  idSolicitud,
  tituloSolicitud,
  onClose,
  onReportado,
}: ReportarConflictoModalProps) {
  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setTipo("");
    setDescripcion("");
    setArchivos([]);
    setError("");
    setEnviando(false);
  }

  function cerrar() {
    reset();
    onClose();
  }

  function agregarArchivos(lista: FileList | null) {
    if (!lista) return;
    setError("");
    const nuevos = Array.from(lista);

    for (const archivo of nuevos) {
      if (!TIPOS_MIME.includes(archivo.type)) {
        setError("Solo se permiten imágenes (JPG/PNG/WEBP) o PDF.");
        return;
      }
      if (archivo.size > MAX_MB * 1024 * 1024) {
        setError(`Cada archivo debe pesar menos de ${MAX_MB} MB.`);
        return;
      }
    }

    const combinados = [...archivos, ...nuevos].slice(0, MAX_ARCHIVOS);
    if (archivos.length + nuevos.length > MAX_ARCHIVOS) {
      setError(`Máximo ${MAX_ARCHIVOS} archivos de evidencia.`);
    }
    setArchivos(combinados);
  }

  function quitarArchivo(indice: number) {
    setArchivos((prev) => prev.filter((_, i) => i !== indice));
  }

  async function enviar() {
    if (!tipo) {
      setError("Selecciona el tipo de problema.");
      return;
    }
    if (descripcion.trim().length < 10) {
      setError("Describe el problema con al menos 10 caracteres.");
      return;
    }

    try {
      setEnviando(true);
      setError("");
      await crearConflicto(idSolicitud, tipo, descripcion.trim(), archivos);
      reset();
      onReportado?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos registrar el reporte."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Reportar un problema"
      description={
        tituloSolicitud
          ? `Trabajo: ${tituloSolicitud}`
          : "Cuéntanos qué ocurrió con este trabajo."
      }
      onClose={cerrar}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Un administrador revisará tu reporte. Adjunta evidencia (fotos o PDF)
            para respaldarlo.
          </span>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Tipo de problema
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          >
            <option value="">Selecciona una opción</option>
            {TIPOS_CONFLICTO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Descripción
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Explica qué ocurrió con el mayor detalle posible."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Evidencia (opcional, hasta {MAX_ARCHIVOS} archivos)
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <Paperclip className="h-4 w-4" />
            Adjuntar archivos
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => agregarArchivos(e.target.files)}
            />
          </label>

          {archivos.length > 0 && (
            <ul className="mt-2 space-y-1">
              {archivos.map((archivo, indice) => (
                <li
                  key={`${archivo.name}-${indice}`}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"
                >
                  <span className="truncate">{archivo.name}</span>
                  <button
                    type="button"
                    onClick={() => quitarArchivo(indice)}
                    className="ml-2 text-slate-400 hover:text-rose-600"
                    aria-label="Quitar archivo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={cerrar}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={enviar}
            disabled={enviando}
            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {enviando ? "Enviando reporte..." : "Enviar reporte"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
