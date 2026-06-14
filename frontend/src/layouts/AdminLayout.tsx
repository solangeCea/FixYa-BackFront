import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Star,
  LogOut,
  Wrench,
  Menu,
  X,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { path: "/admin/panel", icon: LayoutDashboard, label: "Resumen" },
    { path: "/admin/solicitudes", icon: ClipboardList, label: "Solicitudes" },
    { path: "/admin/tecnicos", icon: UserCheck, label: "Técnicos" },
    { path: "/admin/usuarios", icon: Users, label: "Usuarios" },
    { path: "/admin/resenas", icon: Star, label: "Reseñas" },
  ];

  const activeItem = menuItems.find((item) => location.pathname === item.path);

  const SidebarContent = (
    <>
      <div className="border-b border-[#E6E0D6] p-6">
        <Link to="/admin/panel" className="flex items-center gap-3">
          <div className="rounded-xl bg-[#123F66] p-2 text-white shadow-lg shadow-[#123F66]/20">
            <Wrench size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0E1B2A]">FixYa</h1>
            <p className="text-xs font-medium text-[#5F6B7A]">
              Operación interna
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-[#123F66] text-white shadow-lg shadow-[#123F66]/20"
                  : "text-[#5F6B7A] hover:bg-[#F8F5EF] hover:text-[#102033]"
              }`}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#E6E0D6] p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={19} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#F8F5EF]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-[#E6E0D6] bg-white/95 backdrop-blur lg:flex">
        {SidebarContent}
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="flex h-full w-72 flex-col bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-end p-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-xl bg-[#F8F5EF] p-2 text-[#123F66]"
              >
                <X size={22} />
              </button>
            </div>
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[#E6E0D6] bg-[#F8F5EF]/90 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl bg-white p-2 text-[#123F66] ring-1 ring-[#E6E0D6] lg:hidden"
              >
                <Menu size={22} />
              </button>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#C8872D]">
                Operación FixYa
                </p>
                <h2 className="text-xl font-black text-[#0E1B2A] md:text-2xl">
                  {activeItem?.label || "Administración"}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2 ring-1 ring-[#E6E0D6]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#123F66] text-sm font-bold text-white">
                A
              </div>
              <div className="hidden text-right md:block">
                <p className="text-sm font-bold text-[#102033]">Administrador</p>
                <p className="text-xs text-[#5F6B7A]">Gestión operativa</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
