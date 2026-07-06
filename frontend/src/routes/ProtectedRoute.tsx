import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

function getHomeByRole(role: string) {
  if (role === "ADMIN") return "/admin/panel";
  if (role === "TECNICO") return "/tecnico/dashboard";
  if (role === "CLIENTE") return "/cliente/dashboard";
  return "/";
}

function getRoles(usuario: { tipo_usuario: string; roles?: string[] }) {
  const roles = usuario.roles?.length ? usuario.roles : [usuario.tipo_usuario];
  return Array.from(new Set(roles));
}

function getHomeByRoles(roles: string[]) {
  if (roles.includes("ADMIN")) return getHomeByRole("ADMIN");
  if (roles.includes("TECNICO")) return getHomeByRole("TECNICO");
  if (roles.includes("CLIENTE")) return getHomeByRole("CLIENTE");
  return "/";
}

function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">
          Preparando tu sesión...
        </p>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  const roles = getRoles(usuario);

  if (
    allowedRoles &&
    !roles.some((role) => allowedRoles.includes(role))
  ) {
    return <Navigate to={getHomeByRoles(roles)} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
