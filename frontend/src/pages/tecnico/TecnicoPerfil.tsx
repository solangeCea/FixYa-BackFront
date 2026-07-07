import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Star,
  UserCog,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import {
  getMyTechnicianProfile,
  type Tecnico,
} from "../../services/technicianService";
import DatosTab from "./perfil/DatosTab";
import DocumentosTab from "./perfil/DocumentosTab";
import ValoracionesTab from "./perfil/ValoracionesTab";
import TrabajosTab from "./perfil/TrabajosTab";

type TabKey = "datos" | "documentos" | "valoraciones" | "trabajos";

const TABS: Array<{ key: TabKey; label: string; icon: typeof UserCog }> = [
  { key: "datos", label: "Datos y validación", icon: UserCog },
  { key: "documentos", label: "Documentos", icon: FileText },
  { key: "valoraciones", label: "Valoraciones", icon: Star },
  { key: "trabajos", label: "Trabajos", icon: Briefcase },
];

function TecnicoPerfil() {
  useDocumentTitle("Mi Perfil · FixYa");

  const { usuario, setUsuario } = useAuth();

  // Permite abrir directamente una pestaña vía ?tab= (ej. el CTA del dashboard
  // "Completar perfil" enlaza a /tecnico/perfil?tab=documentos).
  const [searchParams] = useSearchParams();
  const tabInicial: TabKey = (["datos", "documentos", "valoraciones", "trabajos"] as const).includes(
    searchParams.get("tab") as TabKey
  )
    ? (searchParams.get("tab") as TabKey)
    : "datos";

  const [activeTab, setActiveTab] = useState<TabKey>(tabInicial);
  const [perfilTecnico, setPerfilTecnico] = useState<Tecnico | null>(null);

  useEffect(() => {
    let active = true;

    getMyTechnicianProfile()
      .then((data) => {
        if (active) setPerfilTecnico(data);
      })
      .catch(() => {
        // El perfil técnico puede no existir aún; los tabs manejan su ausencia.
        if (active) setPerfilTecnico(null);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6">
          <Link
            to="/tecnico/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a mis trabajos
          </Link>
        </div>

        <header className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
            <UserCog className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Mi Perfil</h1>
            <p className="mt-1 text-sm text-slate-600">
              Gestiona tus datos, documentos, valoraciones y trabajos.
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
              <DatosTab
                usuario={usuario}
                setUsuario={setUsuario}
                perfilTecnico={perfilTecnico}
              />
            )}
            {activeTab === "documentos" && (
              <DocumentosTab rut={usuario.rut} />
            )}
            {activeTab === "valoraciones" && (
              <ValoracionesTab rut={usuario.rut} />
            )}
            {activeTab === "trabajos" && <TrabajosTab rut={usuario.rut} />}
          </>
        )}
      </main>
    </div>
  );
}

export default TecnicoPerfil;
