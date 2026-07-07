import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ClipboardList, Receipt, Star, UserCog } from "lucide-react";

import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { getServicios } from "../../services/catalogService";
import type { Servicio } from "../../services/catalogService";
import { getSolicitudesCliente } from "../../services/solicitudService";
import type { Solicitud } from "../../services/solicitudService";
import { getPublicTechnicianProfiles } from "../../services/technicianService";
import DatosTab from "./perfil/DatosTab";
import SolicitudesTab from "./perfil/SolicitudesTab";
import CalificacionesTab from "./perfil/CalificacionesTab";
import ComprobantesTab from "./perfil/ComprobantesTab";

type TabKey = "datos" | "solicitudes" | "calificaciones" | "comprobantes";

const TABS: Array<{ key: TabKey; label: string; icon: typeof UserCog }> = [
  { key: "datos", label: "Mis datos", icon: UserCog },
  { key: "solicitudes", label: "Solicitudes", icon: ClipboardList },
  { key: "calificaciones", label: "Calificaciones", icon: Star },
  { key: "comprobantes", label: "Comprobantes", icon: Receipt },
];

function ClientePerfil() {
  useDocumentTitle("Mi Perfil · FixYa");

  const { usuario, setUsuario } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("datos");
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [tecnicos, setTecnicos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rut = usuario?.rut;

  useEffect(() => {
    if (!rut) return;

    let active = true;
    setLoading(true);
    setError("");

    Promise.all([
      getSolicitudesCliente(rut),
      getServicios(),
      getPublicTechnicianProfiles().catch(() => []),
    ])
      .then(([solicitudesData, serviciosData, tecnicosData]) => {
        if (!active) return;
        setSolicitudes(solicitudesData);
        setServicios(serviciosData);
        setTecnicos(
          Object.fromEntries(
            tecnicosData.map((t) => [t.usuario_rut, t.nombre_completo])
          )
        );
      })
      .catch(() => {
        if (active) setError("No pudimos cargar tu actividad. Intenta nuevamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [rut]);

  const servicioNombre = useCallback(
    (id: number) =>
      servicios.find((s) => s.id_servicio === id)?.nombre_servicio ?? "Servicio",
    [servicios]
  );

  const tecnicoNombre = useCallback(
    (rutTecnico: string | null) => {
      if (!rutTecnico) return "Sin asignar";
      return tecnicos[rutTecnico] ?? rutTecnico;
    },
    [tecnicos]
  );

  const clienteNombre = useMemo(
    () => usuario?.nombre_completo ?? "",
    [usuario]
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6">
          <Link
            to="/cliente/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a mi panel
          </Link>
        </div>

        <header className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
            <UserCog className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Mi Perfil</h1>
            <p className="mt-1 text-sm text-slate-600">
              Gestiona tus datos, solicitudes, calificaciones y comprobantes.
            </p>
          </div>
        </header>

        <nav className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {!usuario ? (
          <div className="rounded-2xl bg-white p-8 text-center font-medium text-slate-600 shadow-sm">
            Cargando tu información...
          </div>
        ) : (
          <>
            {activeTab === "datos" && (
              <DatosTab usuario={usuario} setUsuario={setUsuario} />
            )}
            {activeTab === "solicitudes" && (
              <SolicitudesTab
                solicitudes={solicitudes}
                loading={loading}
                error={error}
                servicioNombre={servicioNombre}
                tecnicoNombre={tecnicoNombre}
              />
            )}
            {activeTab === "calificaciones" && (
              <CalificacionesTab
                rut={usuario.rut}
                solicitudes={solicitudes}
                servicioNombre={servicioNombre}
                tecnicoNombre={tecnicoNombre}
              />
            )}
            {activeTab === "comprobantes" && (
              <ComprobantesTab
                solicitudes={solicitudes}
                loading={loading}
                error={error}
                clienteNombre={clienteNombre}
                servicioNombre={servicioNombre}
                tecnicoNombre={tecnicoNombre}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default ClientePerfil;
