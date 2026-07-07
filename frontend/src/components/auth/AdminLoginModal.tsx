import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";

import { login, obtenerUsuarioActual } from "../../services/authService";
import { removeToken, saveToken } from "../../services/token";
import { useAuth } from "../../context/AuthContext";
import Modal from "../ui/Modal";

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
}

function esRolAdmin(tipoUsuario: string | null | undefined) {
  const normalizado = (tipoUsuario ?? "").trim().toUpperCase();
  return normalizado === "ADMIN" || normalizado === "ADMINISTRADOR";
}

/**
 * Acceso administrativo discreto. Reutiliza exactamente el mismo backend y la
 * misma lógica de validación que el login principal (login +
 * obtenerUsuarioActual), solo que restringido al rol ADMIN.
 */
function AdminLoginModal({ open, onClose }: AdminLoginModalProps) {
  const navigate = useNavigate();
  const { setUsuario } = useAuth();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    correo?: string;
    contrasena?: string;
  }>({});

  function resetForm() {
    setCorreo("");
    setContrasena("");
    setShowPassword(false);
    setError("");
    setFieldErrors({});
  }

  function handleClose() {
    if (loading) return;
    resetForm();
    onClose();
  }

  async function handleAdminLogin(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return; // Evita doble envío.
    setError("");

    const nextErrors: typeof fieldErrors = {};
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

      if (!esRolAdmin(usuario.tipo_usuario)) {
        removeToken();
        sessionStorage.clear();
        setUsuario(null);
        setError(
          "Estas credenciales no corresponden a una cuenta administrativa."
        );
        return;
      }

      saveToken(response.access_token);
      setUsuario(usuario);
      navigate("/admin/panel");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos iniciar sesión. Revisa los datos e inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Acceso Administrativo"
      description="Ingreso exclusivo para administradores de la plataforma."
      maxWidth="md"
    >
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-teal-50 p-4 text-teal-800">
        <div className="rounded-xl bg-teal-700 p-2.5 text-white">
          <ShieldCheck size={20} />
        </div>
        <p className="text-sm font-semibold leading-5">
          Este acceso está restringido. Solo cuentas con rol administrador
          pueden ingresar al panel.
        </p>
      </div>

      <form onSubmit={handleAdminLogin} noValidate className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Correo electrónico
          </label>
          <input
            type="email"
            value={correo}
            onChange={(event) => {
              setCorreo(event.target.value);
              setFieldErrors((prev) => ({ ...prev, correo: undefined }));
            }}
            placeholder="admin@fixya.cl"
            className={`fixya-input ${
              fieldErrors.correo
                ? "border-red-300 bg-red-50/40 focus:border-red-500"
                : ""
            }`}
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
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={contrasena}
              onChange={(event) => {
                setContrasena(event.target.value);
                setFieldErrors((prev) => ({ ...prev, contrasena: undefined }));
              }}
              placeholder="********"
              className={`fixya-input pr-12 ${
                fieldErrors.contrasena
                  ? "border-red-300 bg-red-50/40 focus:border-red-500"
                  : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
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
          {loading ? "Verificando acceso..." : "Ingresar al panel"}
        </button>
      </form>
    </Modal>
  );
}

export default AdminLoginModal;
