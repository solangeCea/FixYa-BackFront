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

function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">
          Cargando sesión...
        </p>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(usuario.tipo_usuario)
  ) {
    return <Navigate to={getHomeByRole(usuario.tipo_usuario)} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
