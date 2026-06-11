import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Wrench, User, Shield, Briefcase, AlertCircle, LogIn } from "lucide-react";
import { motion } from "framer-motion";

import { login, obtenerUsuarioActual } from "../../services/authService";
import { saveToken } from "../../services/token";
import { useAuth } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { setUsuario } = useAuth();

  const [selectedRole, setSelectedRole] = useState<
    "cliente" | "tecnico" | "admin" | null
  >(null);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
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
      description: "Solicita servicios y revisa cotizaciones.",
      icon: User,
      color: "bg-cyan-50 text-cyan-700",
    },
    {
      type: "tecnico" as const,
      title: "Tecnico",
      description: "Acepta trabajos y gestiona servicios.",
      icon: Briefcase,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      type: "admin" as const,
      title: "Admin",
      description: "Modera y supervisa la plataforma.",
      icon: Shield,
      color: "bg-teal-50 text-teal-700",
    },
  ];

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const nextErrors: typeof fieldErrors = {};

    if (!selectedRole) nextErrors.role = "Selecciona el rol con el que quieres ingresar.";
    if (!correo.trim()) nextErrors.correo = "Ingresa tu correo electronico.";
    if (correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      nextErrors.correo = "Ingresa un correo valido.";
    }
    if (!contrasena.trim()) nextErrors.contrasena = "Ingresa tu contrasena.";

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setLoading(true);
      const response = await login(correo, contrasena);
      saveToken(response.access_token);

      const usuario = await obtenerUsuarioActual(response.access_token);
      setUsuario(usuario);

      if (usuario.tipo_usuario === "CLIENTE") navigate("/cliente/dashboard");
      if (usuario.tipo_usuario === "TECNICO") navigate("/tecnico/dashboard");
      if (usuario.tipo_usuario === "ADMIN") navigate("/admin/panel");
    } catch (error) {
      setError("No pudimos iniciar sesion con esas credenciales.");
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
        className="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-950/10 lg:grid-cols-[0.9fr_1.1fr]"
      >
        <section className="hidden bg-gradient-to-br from-slate-950 via-teal-800 to-cyan-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
                <Wrench className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">FixYa</h1>
                <p className="text-sm text-cyan-100">Servicios tecnicos</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              Gestiona servicios del hogar con una experiencia clara y segura.
            </h2>
          </div>

          <div className="rounded-2xl bg-white/12 p-5 backdrop-blur">
            <p className="text-sm leading-6 text-cyan-50">
              Clientes, tecnicos y administradores trabajan sobre una misma
              plataforma con solicitudes, cotizaciones, reseñas y moderacion.
            </p>
          </div>
        </section>

        <section className="p-8 md:p-12">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-700/25 lg:hidden">
              <Wrench size={28} />
            </div>
            <h1 className="text-3xl font-bold text-slate-950">
              Bienvenido de vuelta
            </h1>
            <p className="mt-2 text-slate-600">
              Selecciona tu rol e ingresa con tus credenciales.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedRole === role.type
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : fieldErrors.role
                          ? "border-red-200 bg-white hover:border-red-300"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`mb-3 inline-flex rounded-xl p-2 ${role.color}`}>
                      <role.icon size={22} />
                    </div>
                    <h3 className="font-bold text-slate-950">{role.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
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
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Correo electronico
                </label>
                <input
                  type="email"
                  value={correo}
                  onChange={(event) => {
                    setCorreo(event.target.value);
                    setFieldErrors((prev) => ({ ...prev, correo: undefined }));
                  }}
                  placeholder="tu@email.com"
                  className={`fixya-input ${fieldErrors.correo ? "border-red-300 focus:border-red-500" : ""}`}
                />
                {fieldErrors.correo && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {fieldErrors.correo}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Contrasena
                </label>
                <input
                  type="password"
                  value={contrasena}
                  onChange={(event) => {
                    setContrasena(event.target.value);
                    setFieldErrors((prev) => ({ ...prev, contrasena: undefined }));
                  }}
                  placeholder="********"
                  className={`fixya-input ${fieldErrors.contrasena ? "border-red-300 focus:border-red-500" : ""}`}
                />
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
              disabled={!selectedRole || loading}
              className="fixya-btn-primary w-full px-5 py-4"
            >
              <LogIn size={18} />
              {loading ? "Ingresando..." : "Iniciar sesion"}
            </button>

            <p className="text-center text-sm text-slate-600">
              No tienes cuenta?{" "}
              <Link
                to="/register"
                className="font-bold text-teal-700 hover:text-teal-800"
              >
                Registrate aqui
              </Link>
            </p>
          </form>
        </section>
      </motion.div>
    </div>
  );
}

export default Login;
