import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Wrench,
  User,
  Shield,
  Briefcase,
  AlertCircle,
  LogIn,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";

import { login, obtenerUsuarioActual } from "../../services/authService";
import { removeToken, saveToken } from "../../services/token";
import { useAuth } from "../../context/AuthContext";

type AuthRole = "CLIENTE" | "TECNICO" | "ADMIN";

function normalizeRole(role: string | null | undefined): AuthRole | null {
  const normalizedRole = role
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (normalizedRole === "CLIENTE") return "CLIENTE";
  if (normalizedRole === "TECNICO") return "TECNICO";
  if (normalizedRole === "ADMIN" || normalizedRole === "ADMINISTRADOR") {
    return "ADMIN";
  }

  return null;
}

function getDashboardPath(role: string) {
  if (role === "CLIENTE") return "/cliente/dashboard";
  if (role === "TECNICO") return "/tecnico/dashboard";
  if (role === "ADMIN") return "/admin/panel";
  return "/";
}

function isSafeClienteNext(next: string | null) {
  return Boolean(next && next.startsWith("/cliente/") && !next.startsWith("//"));
}

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUsuario } = useAuth();
  const nextPath = searchParams.get("next");

  const [selectedRole, setSelectedRole] = useState<
    "cliente" | "tecnico" | "admin" | null
  >(null);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    role?: string;
    correo?: string;
    contrasena?: string;
  }>({});

  const roles = [
    {
      type: "cliente" as const,
      title: "Cliente",
      description: "Revisa tus solicitudes y cotizaciones.",
      icon: User,
      color: "bg-[#F8F5EF] text-[#123F66]",
    },
    {
      type: "tecnico" as const,
      title: "Técnico",
      description: "Gestiona trabajos y respuestas a clientes.",
      icon: Briefcase,
      color: "bg-[#DDEADF] text-[#2F5F46]",
    },
    {
      type: "admin" as const,
      title: "Administrador",
      description: "Administra usuarios, técnicos y solicitudes.",
      icon: Shield,
      color: "bg-[#FFF4D8] text-[#8C5F1D]",
    },
  ];

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const nextErrors: typeof fieldErrors = {};

    if (!selectedRole) nextErrors.role = "Selecciona cómo quieres ingresar.";
    if (!correo.trim()) nextErrors.correo = "Ingresa tu correo electrónico.";
    if (correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      nextErrors.correo = "Ingresa un correo válido.";
    }
    if (!contrasena.trim()) nextErrors.contrasena = "Ingresa tu contraseña.";

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setLoading(true);
      const response = await login(correo, contrasena);
      const usuario = await obtenerUsuarioActual(response.access_token);

      const selectedAuthRole = normalizeRole(selectedRole);
      const userAuthRole = normalizeRole(usuario.tipo_usuario);

      if (selectedAuthRole !== userAuthRole) {
        removeToken();
        sessionStorage.clear();
        setUsuario(null);
        setError(
          "El rol seleccionado no corresponde a este usuario. Revisa tu selección e inténtalo nuevamente."
        );
        return;
      }

      saveToken(response.access_token);
      setUsuario(usuario);

      if (usuario.tipo_usuario === "CLIENTE" && isSafeClienteNext(nextPath)) {
        navigate(nextPath as string);
        return;
      }

      navigate(getDashboardPath(usuario.tipo_usuario));
    } catch (error) {
      setError(
        "El correo o la contraseña no coinciden. Revisa los datos e inténtalo nuevamente."
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixya-shell flex min-h-screen items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid w-full max-w-6xl overflow-hidden rounded-2xl border border-[#E6E0D6] bg-white shadow-2xl shadow-[#0E1B2A]/10 lg:grid-cols-[0.88fr_1.12fr]"
      >
        <section className="hidden bg-[#0E1B2A] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                <Wrench className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">FixYa</h1>
                <p className="text-sm text-white/75">Servicios para el hogar</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              Todo lo que necesitas para seguir tus servicios en un solo lugar.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/80">
              Entra a FixYa para revisar solicitudes, responder trabajos o
              administrar la plataforma según tu rol.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm leading-6 text-white/80">
              Una experiencia simple para clientes, técnicos y administradores:
              cada persona ve solo lo que necesita hacer.
            </p>
          </div>
        </section>

        <section className="p-8 md:p-12">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#123F66] text-white shadow-lg shadow-[#123F66]/25 lg:hidden">
              <Wrench size={28} />
            </div>
            <h1 className="text-3xl font-black text-[#0E1B2A] md:text-4xl">
              Bienvenido de nuevo a FixYa
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#5F6B7A] md:text-base">
              Ingresa a tu cuenta para revisar tus solicitudes, trabajos o
              administrar la plataforma.
            </p>
          </div>

          <form onSubmit={handleLogin} noValidate className="space-y-6">
            <div>
              <div className="grid gap-3 md:grid-cols-3">
                {roles.map((role) => (
                  <button
                    key={role.type}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role.type);
                      setFieldErrors((prev) => ({ ...prev, role: undefined }));
                    }}
                  className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                      selectedRole === role.type
                        ? "border-[#C8872D] bg-[#FFF8EA] shadow-sm"
                        : fieldErrors.role
                          ? "border-red-200 bg-white hover:border-red-300"
                          : "border-[#E6E0D6] bg-white hover:border-[#C8872D]/60 hover:bg-[#FBFAF7]"
                    }`}
                  >
                    <div className={`mb-3 inline-flex rounded-xl p-2 ${role.color}`}>
                      <role.icon size={22} />
                    </div>
                    <h3 className="font-bold text-[#102033]">{role.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#5F6B7A]">
                      {role.description}
                    </p>
                  </button>
                ))}
              </div>
              {fieldErrors.role && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {fieldErrors.role}
                </p>
              )}
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#102033]">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={correo}
                  onChange={(event) => {
                    setCorreo(event.target.value);
                    setFieldErrors((prev) => ({ ...prev, correo: undefined }));
                  }}
                  placeholder="tu@email.com"
                  className={`fixya-input ${fieldErrors.correo ? "border-red-300 bg-red-50/40 focus:border-red-500" : ""}`}
                />
                {fieldErrors.correo && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {fieldErrors.correo}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#102033]">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={contrasena}
                    onChange={(event) => {
                      setContrasena(event.target.value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        contrasena: undefined,
                      }));
                    }}
                    placeholder="********"
                    className={`fixya-input pr-12 ${fieldErrors.contrasena ? "border-red-300 bg-red-50/40 focus:border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#5F6B7A] transition hover:bg-[#F8F5EF] hover:text-[#102033]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.contrasena && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {fieldErrors.contrasena}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="fixya-btn-primary w-full px-5 py-4"
            >
              <LogIn size={18} />
              {loading ? "Entrando a tu cuenta..." : "Iniciar sesión"}
            </button>

            <p className="text-center text-sm text-[#5F6B7A]">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="font-bold text-[#123F66] hover:text-[#C8872D]"
              >
                Crea tu cuenta en FixYa
              </Link>
            </p>
          </form>
        </section>
      </motion.div>
    </div>
  );
}

export default Login;
