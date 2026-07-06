import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Bell, Briefcase, ClipboardList, LayoutDashboard, Wrench } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";
import type { Notificacion } from "../services/notificationService";

const roleLinks = {
  CLIENTE: [
    { to: "/servicios", label: "Solicitar servicio", icon: Wrench },
    { to: "/cliente/dashboard", label: "Mis solicitudes", icon: ClipboardList },
  ],
  TECNICO: [
    { to: "/tecnico/dashboard", label: "Trabajos técnicos", icon: Briefcase },
  ],
  ADMIN: [
    { to: "/admin/panel", label: "Administrar plataforma", icon: LayoutDashboard },
  ],
};

const publicLinks = [
  { to: "/", label: "Inicio", icon: LayoutDashboard },
  { to: "/servicios", label: "Servicios", icon: Wrench },
  { to: "/tecnicos", label: "Técnicos", icon: Briefcase },
];

function getRoleLabel(role?: string) {
  if (role === "CLIENTE") return "Cliente";
  if (role === "TECNICO") return "Técnico";
  if (role === "ADMIN") return "Administrador";
  return "";
}

function getUserRoles(usuario?: { tipo_usuario: string; roles?: string[] } | null) {
  if (!usuario) return [];
  const roles = usuario.roles?.length ? usuario.roles : [usuario.tipo_usuario];
  return Array.from(new Set(roles));
}

function Navbar() {
  const { usuario, logout } = useAuth();
  const [open, setOpen] = useState(false);
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

  async function handleMarkRead(id: number) {
    await markNotificationRead(id);
    await cargarNotificaciones();
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    await cargarNotificaciones();
  }

  const roles = getUserRoles(usuario);
  const links = usuario
    ? roles
        .flatMap((role) => roleLinks[role as keyof typeof roleLinks] ?? [])
        .filter(
          (link, index, allLinks) =>
            allLinks.findIndex((item) => item.to === link.to) === index
        )
    : publicLinks;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-teal-50 text-teal-800"
        : "text-slate-700 hover:bg-slate-100 hover:text-teal-800"
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-6 py-4 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <Link to="/" className="flex items-center gap-2">
        <div className="rounded-lg bg-teal-700 p-2 text-white shadow-lg shadow-teal-700/20">
          <Wrench className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-none text-teal-700">FixYa</h1>
          {usuario && (
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Flujo {roles.map(getRoleLabel).join(" / ")}
            </p>
          )}
        </div>
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        {links.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClass}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}

        {usuario && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="relative rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
              aria-label="Notificaciones"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Notificaciones</h3>
                  <button
                    type="button"
                    onClick={handleMarkAll}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                  >
                    Marcar todas como leídas
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                    No tienes notificaciones nuevas. Cuando haya avances en tus solicitudes o trabajos, aparecerán aquí.
                  </p>
                ) : (
                  <div className="max-h-80 space-y-2 overflow-auto">
                    {notifications.map((item) => (
                      <button
                        key={item.id_notificacion}
                        type="button"
                        onClick={() => handleMarkRead(item.id_notificacion)}
                        className={`w-full rounded-xl p-3 text-left text-sm ${
                          item.leida
                            ? "bg-gray-50 text-gray-600"
                            : "bg-teal-50 text-slate-900"
                        }`}
                      >
                        <p className="font-semibold">{item.titulo}</p>
                        <p className="mt-1 text-xs">{item.mensaje}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {usuario ? (
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-200"
          >
            Cerrar sesión
          </button>
        ) : (
          <>
            <Link
              to="/login"
              className="font-medium text-slate-700 hover:text-teal-700"
            >
              Iniciar sesión
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-teal-700 px-4 py-2 text-white transition hover:bg-teal-800"
            >
              Crear cuenta
            </Link>
          </>
        )}
      </div>
      </div>
    </nav>
  );
}

export default Navbar;
