import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Bell,
  Briefcase,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Wrench,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";
import type { Notificacion } from "../services/notificationService";

const publicLinks = [
  { to: "/", label: "Inicio" },
  { to: "/servicios", label: "Servicios" },
  { to: "/tecnicos", label: "Marketplace" },
];

const roleLinks = {
  CLIENTE: {
    to: "/cliente/dashboard",
    label: "Mis solicitudes",
    icon: ClipboardList,
  },
  TECNICO: {
    to: "/tecnico/dashboard",
    label: "Mis trabajos",
    icon: Briefcase,
  },
  ADMIN: {
    to: "/admin/panel",
    label: "Administración",
    icon: LayoutDashboard,
  },
};

function getRoleLabel(role?: string) {
  if (role === "CLIENTE") return "Cliente";
  if (role === "TECNICO") return "Técnico";
  if (role === "ADMIN") return "Administrador";
  return "Cuenta";
}

function Navbar() {
  const { usuario, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notificacion[]>([]);

  const cargarNotificaciones = useCallback(async () => {
    if (!usuario) {
      setNotifications([]);
      return;
    }

    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      setNotifications([]);
    }
  }, [usuario]);

  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.leida).length,
    [notifications]
  );

  const roleLink = usuario
    ? roleLinks[usuario.tipo_usuario as keyof typeof roleLinks]
    : undefined;

  async function handleMarkRead(id: number) {
    await markNotificationRead(id);
    await cargarNotificaciones();
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    await cargarNotificaciones();
  }

  function handleLogout() {
    setMobileOpen(false);
    setNotificationsOpen(false);
    logout();
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-3 py-2 text-sm font-extrabold transition ${
      isActive
        ? "bg-[#123F66] text-white shadow-sm"
        : "text-[#102033] hover:bg-white hover:text-[#123F66]"
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-4 py-3 text-sm font-extrabold transition ${
      isActive
        ? "bg-[#123F66] text-white"
        : "text-[#102033] hover:bg-white"
    }`;

  const notificationsButton = usuario && (
    <div className="relative">
      <button
        type="button"
        onClick={() => setNotificationsOpen((prev) => !prev)}
        className="relative rounded-xl border border-[#E6E0D6] bg-white p-2.5 text-[#123F66] transition hover:border-[#C8872D] hover:bg-[#FBFAF7]"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-[#C8872D] px-1.5 text-xs font-black text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {notificationsOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-[#E6E0D6] bg-white p-4 shadow-2xl shadow-[#0E1B2A]/10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-black text-[#102033]">Notificaciones</h3>
            <button
              type="button"
              onClick={handleMarkAll}
              className="text-xs font-extrabold text-[#123F66] hover:text-[#C8872D]"
            >
              Marcar leídas
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="rounded-xl bg-[#F8F5EF] p-4 text-sm leading-6 text-[#5F6B7A]">
              No tienes notificaciones nuevas. Los avances de tus solicitudes
              aparecerán aquí.
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-auto">
              {notifications.map((item) => (
                <button
                  key={item.id_notificacion}
                  type="button"
                  onClick={() => handleMarkRead(item.id_notificacion)}
                  className={`w-full rounded-xl p-3 text-left text-sm transition hover:bg-[#F8F5EF] ${
                    item.leida
                      ? "bg-white text-[#5F6B7A]"
                      : "bg-[#DDEADF] text-[#102033]"
                  }`}
                >
                  <p className="font-extrabold">{item.titulo}</p>
                  <p className="mt-1 text-xs leading-5">{item.mensaje}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <nav className="sticky top-0 z-40 border-b border-[#E6E0D6] bg-[#F8F5EF]/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3">
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#123F66] text-white shadow-lg shadow-[#123F66]/20">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-2xl font-black tracking-tight text-[#123F66]">
              FixYa
            </p>
            <p className="hidden text-xs font-bold text-[#5F6B7A] sm:block">
              Servicios técnicos
            </p>
          </div>
        </Link>

        <div className="hidden justify-center lg:flex">
          <div className="flex items-center gap-1 rounded-2xl border border-[#E6E0D6] bg-[#FBFAF7] p-1">
            {publicLinks.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="hidden items-center justify-end gap-2 lg:flex">
          {usuario ? (
            <>
              {notificationsButton}
              {roleLink && (
                <Link
                  to={roleLink.to}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E6E0D6] bg-white px-4 py-2.5 text-sm font-extrabold text-[#123F66] transition hover:border-[#C8872D] hover:bg-[#FBFAF7]"
                >
                  <roleLink.icon className="h-4 w-4" />
                  {roleLink.label}
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-[#5F6B7A] transition hover:bg-white hover:text-[#0E1B2A]"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-4 py-2.5 text-sm font-extrabold text-[#123F66] transition hover:bg-white"
              >
                Ingresar
              </Link>
              <Link to="/register" className="fixya-btn-accent px-4 py-2.5 text-sm">
                Registrarme
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-xl border border-[#E6E0D6] bg-white p-2.5 text-[#123F66] lg:hidden"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="mx-auto mt-3 max-w-7xl rounded-2xl border border-[#E6E0D6] bg-[#FBFAF7] p-3 shadow-xl shadow-[#0E1B2A]/10 lg:hidden">
          <div className="grid gap-1">
            {publicLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={mobileNavLinkClass}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="mt-3 border-t border-[#E6E0D6] pt-3">
            {usuario ? (
              <div className="grid gap-2">
                <div className="rounded-xl bg-white px-4 py-3 text-sm text-[#5F6B7A]">
                  Sesión iniciada como{" "}
                  <span className="font-extrabold text-[#102033]">
                    {getRoleLabel(usuario.tipo_usuario)}
                  </span>
                </div>
                {roleLink && (
                  <Link
                    to={roleLink.to}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#123F66] px-4 py-3 text-sm font-extrabold text-white"
                  >
                    <roleLink.icon className="h-4 w-4" />
                    {roleLink.label}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6E0D6] bg-white px-4 py-3 text-sm font-extrabold text-[#5F6B7A]"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="fixya-btn-secondary px-4 py-3 text-sm"
                >
                  Ingresar
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="fixya-btn-accent px-4 py-3 text-sm"
                >
                  Registrarme
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
