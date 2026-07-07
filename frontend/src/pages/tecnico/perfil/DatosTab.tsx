import { AlertCircle, Award, BadgeCheck, CalendarClock } from "lucide-react";

import CambiarPassword from "../../../components/CambiarPassword";
import PerfilDatosForm from "../../../components/perfil/PerfilDatosForm";
import SectionCard from "../../../components/ui/SectionCard";
import type { Tecnico } from "../../../services/technicianService";
import type { Usuario } from "../../../types/auth";
import { formatDate } from "../../../utils/format";
import {
  getVerificacionBadgeClass,
  getVerificacionLabel,
  verificacionRequiereAtencion,
} from "../../../utils/verificacion";

interface DatosTabProps {
  usuario: Usuario;
  setUsuario: (usuario: Usuario) => void;
  perfilTecnico: Tecnico | null;
}

// Tarjeta con el estado de validación del técnico y sus datos profesionales.
function ValidacionCard({
  usuario,
  perfilTecnico,
}: {
  usuario: Usuario;
  perfilTecnico: Tecnico | null;
}) {
  const estado = perfilTecnico?.estado_verificacion;
  const requiereAtencion = verificacionRequiereAtencion(estado);

  return (
    <SectionCard
      title="Estado de validación"
      description="Así ve la administración tu perfil profesional."
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${getVerificacionBadgeClass(
              estado
            )}`}
          >
            <BadgeCheck className="h-4 w-4" />
            {getVerificacionLabel(estado)}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
              usuario.estado_usuario
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {usuario.estado_usuario ? "Cuenta activa" : "Cuenta desactivada"}
          </span>
        </div>

        {requiereAtencion && perfilTecnico?.observacion_admin && (
          <div className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Observación del administrador</p>
              <p className="mt-1">{perfilTecnico.observacion_admin}</p>
            </div>
          </div>
        )}

        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Award className="mt-0.5 h-5 w-5 text-teal-600" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Especialidad / Nivel
              </dt>
              <dd className="text-sm font-medium text-slate-800">
                {perfilTecnico?.nivel_tecnico ?? "—"}
                {perfilTecnico?.experiencia_anios != null && (
                  <span className="text-slate-500">
                    {" "}
                    · {perfilTecnico.experiencia_anios} años de experiencia
                  </span>
                )}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 h-5 w-5 text-teal-600" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Solicitud / Última revisión
              </dt>
              <dd className="text-sm font-medium text-slate-800">
                {formatDate(perfilTecnico?.fecha_solicitud)}
                {" · "}
                {perfilTecnico?.fecha_revision
                  ? formatDate(perfilTecnico.fecha_revision)
                  : "sin revisar"}
              </dd>
            </div>
          </div>
        </dl>

        {perfilTecnico?.descripcion_perfil && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Descripción de tu perfil
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {perfilTecnico.descripcion_perfil}
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function DatosTab({ usuario, setUsuario, perfilTecnico }: DatosTabProps) {
  return (
    <div className="space-y-6">
      <ValidacionCard usuario={usuario} perfilTecnico={perfilTecnico} />
      <PerfilDatosForm usuario={usuario} setUsuario={setUsuario} />
      <CambiarPassword />
    </div>
  );
}

export default DatosTab;
