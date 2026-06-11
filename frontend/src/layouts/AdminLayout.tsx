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

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  const menuItems = [
    { path: "/admin/panel", icon: LayoutDashboard, label: "Resumen" },
    { path: "/admin/solicitudes", icon: ClipboardList, label: "Solicitudes" },
    { path: "/admin/tecnicos", icon: UserCheck, label: "Tecnicos" },
    { path: "/admin/usuarios", icon: Users, label: "Usuarios" },
    { path: "/admin/resenas", icon: Star, label: "Resenas" },
  ];

  const activeItem = menuItems.find((item) => location.pathname === item.path);

  const SidebarContent = (
    <>
      <div className="border-b border-slate-200 p-6">
        <Link to="/admin/panel" className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-700 p-2 text-white shadow-lg shadow-teal-700/20">
            <Wrench size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-950">FixYa</h1>
            <p className="text-xs font-medium text-slate-500">Admin Center</p>
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
                  ? "bg-teal-700 text-white shadow-lg shadow-teal-700/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={19} />
          <span>Cerrar sesion</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-slate-200 bg-white/95 backdrop-blur lg:flex">
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
                className="rounded-xl bg-slate-100 p-2 text-slate-700"
              >
                <X size={22} />
              </button>
            </div>
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl bg-slate-100 p-2 text-slate-700 lg:hidden"
              >
                <Menu size={22} />
              </button>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                  Administracion
                </p>
                <h2 className="text-xl font-bold text-slate-950 md:text-2xl">
                  {activeItem?.label || "Panel Admin"}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-sm font-bold text-white">
                A
              </div>
              <div className="hidden text-right md:block">
                <p className="text-sm font-bold text-slate-900">Administrador</p>
                <p className="text-xs text-slate-500">Panel operativo</p>
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
