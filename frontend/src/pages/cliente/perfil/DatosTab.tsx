import { Mail, Phone, ShieldCheck } from "lucide-react";

import CambiarPassword from "../../../components/CambiarPassword";
import PerfilDatosForm from "../../../components/perfil/PerfilDatosForm";
import SectionCard from "../../../components/ui/SectionCard";
import type { Usuario } from "../../../types/auth";

interface DatosTabProps {
  usuario: Usuario;
  setUsuario: (usuario: Usuario) => void;
}

function DatosTab({ usuario, setUsuario }: DatosTabProps) {
  return (
    <div className="space-y-6">
      <SectionCard title="Tu cuenta">
        <div className="flex flex-col gap-4">
          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
              usuario.estado_usuario
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            {usuario.estado_usuario ? "Cuenta activa" : "Cuenta desactivada"}
          </span>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-teal-600" />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Correo
                </dt>
                <dd className="text-sm font-medium text-slate-800">
                  {usuario.correo}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-teal-600" />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Teléfono
                </dt>
                <dd className="text-sm font-medium text-slate-800">
                  {usuario.telefono || "—"}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </SectionCard>

      <PerfilDatosForm usuario={usuario} setUsuario={setUsuario} />
      <CambiarPassword />
    </div>
  );
}

export default DatosTab;
