import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Wrench } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";
import type { Notificacion } from "../services/notificationService";

function Navbar() {
  const { usuario, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notificacion[]>([]);

  async function cargarNotificaciones() {
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
  }

  useEffect(() => {
    cargarNotificaciones();
  }, [usuario?.rut]);

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

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 shadow-sm backdrop-blur">
      <Link to="/" className="flex items-center gap-2">
        <div className="rounded-lg bg-teal-700 p-2 text-white shadow-lg shadow-teal-700/20">
          <Wrench className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-teal-700">FixYa</h1>
      </Link>

      <div className="flex items-center gap-6">
        <Link
          to="/"
          className="font-medium text-slate-700 hover:text-teal-700"
        >
          Inicio
        </Link>

        <Link
          to="/servicios"
          className="font-medium text-slate-700 hover:text-teal-700"
        >
          Servicios
        </Link>

        <Link
          to="/tecnicos"
          className="font-medium text-slate-700 hover:text-teal-700"
        >
          Tecnicos
        </Link>

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
                    Marcar todas
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                    No tienes notificaciones.
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
            Salir
          </button>
        ) : (
          <>
            <Link
              to="/login"
              className="font-medium text-slate-700 hover:text-teal-700"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-teal-700 px-4 py-2 text-white transition hover:bg-teal-800"
            >
              Registro
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
