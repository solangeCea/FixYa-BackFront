import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Servicios from "../pages/Servicios";
import Tecnicos from "../pages/Tecnicos";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import RecuperarPassword from "../pages/auth/RecuperarPassword";
import RestablecerPassword from "../pages/auth/RestablecerPassword";

import TecnicoDashboard from "../pages/tecnico/TecnicoDashboard";
import TecnicoPerfil from "../pages/tecnico/TecnicoPerfil";
import ClienteDashboard from "../pages/cliente/ClienteDashboard";
import ClientePerfil from "../pages/cliente/ClientePerfil";

import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminPerfil from "../pages/admin/AdminPerfil";
import TechnicianManagement from "../pages/admin/TechnicianManagement";
import UserManagement from "../pages/admin/UserManagement";
import ReviewManagement from "../pages/admin/ReviewManagement";
import RequestManagement from "../pages/admin/RequestManagement";
import AuditManagement from "../pages/admin/AuditManagement";
import ConflictManagement from "../pages/admin/ConflictManagement";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTAS PÚBLICAS */}
        <Route path="/" element={<Home />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/tecnicos" element={<Tecnicos />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recuperar" element={<RecuperarPassword />} />
        <Route path="/restablecer" element={<RestablecerPassword />} />

        {/* RUTA TÉCNICO */}
        <Route
          path="/tecnico/dashboard"
          element={
            <ProtectedRoute allowedRoles={["TECNICO"]}>
              <TecnicoDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tecnico/perfil"
          element={
            <ProtectedRoute allowedRoles={["TECNICO"]}>
              <TecnicoPerfil />
            </ProtectedRoute>
          }
        />

        {/* RUTA CLIENTE */}
        <Route
          path="/cliente/dashboard"
          element={
            <ProtectedRoute allowedRoles={["CLIENTE"]}>
              <ClienteDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cliente/perfil"
          element={
            <ProtectedRoute allowedRoles={["CLIENTE"]}>
              <ClientePerfil />
            </ProtectedRoute>
          }
        />

        {/* RUTAS ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="panel" element={<AdminDashboard />} />
          <Route path="solicitudes" element={<RequestManagement />} />
          <Route path="tecnicos" element={<TechnicianManagement />} />
          <Route path="usuarios" element={<UserManagement />} />
          <Route path="resenas" element={<ReviewManagement />} />
          <Route path="conflictos" element={<ConflictManagement />} />
          <Route path="auditoria" element={<AuditManagement />} />
          <Route path="perfil" element={<AdminPerfil />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
