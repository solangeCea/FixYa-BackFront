import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Wrench,
} from "lucide-react";

import { resetPassword } from "../../services/userService";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export default function RestablecerPassword() {
  useDocumentTitle("Restablecer contraseña · FixYa");

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ nueva: "", confirmar: "" });
  const [visible, setVisible] = useState({ nueva: false, confirmar: false });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);
  const [loading, setLoading] = useState(false);

  function validar() {
    const errores: Record<string, string> = {};
    if (!form.nueva) {
      errores.nueva = "Ingresa la nueva contraseña.";
    } else if (form.nueva.length < 8) {
      errores.nueva = "La contraseña debe tener al menos 8 caracteres.";
    } else if (
      !/[A-Z]/.test(form.nueva) ||
      !/[a-z]/.test(form.nueva) ||
      !/\d/.test(form.nueva)
    ) {
      errores.nueva = "Debe incluir mayúscula, minúscula y número.";
    }
    if (form.confirmar !== form.nueva) {
      errores.confirmar = "Las contraseñas no coinciden.";
    }
    return errores;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const errores = validar();
    setFieldErrors(errores);
    if (Object.keys(errores).length > 0) return;

    try {
      setLoading(true);
      await resetPassword({
        token,
        contrasena_nueva: form.nueva,
        confirmar_contrasena: form.confirmar,
      });
      setListo(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos restablecer tu contraseña."
      );
    } finally {
      setLoading(false);
    }
  }

  const campos: { key: "nueva" | "confirmar"; label: string }[] = [
    { key: "nueva", label: "Nueva contraseña" },
    { key: "confirmar", label: "Confirmar nueva contraseña" },
  ];

  return (
    <div className="fixya-shell flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-950/10 md:p-10">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a iniciar sesión
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-950">
              Nueva contraseña
            </h1>
            <p className="text-sm text-slate-600">
              Crea una contraseña segura para tu cuenta.
            </p>
          </div>
        </div>

        {!token ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <div className="mb-1 flex items-center gap-2 font-bold">
              <AlertCircle className="h-5 w-5" />
              Enlace inválido
            </div>
            <p className="leading-6">
              Falta el token de recuperación. Vuelve a solicitar el enlace desde{" "}
              <Link to="/recuperar" className="font-bold underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
          </div>
        ) : listo ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
            <div className="mb-2 flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-5 w-5" />
              Contraseña actualizada
            </div>
            <p className="leading-6">
              Tu contraseña se restableció correctamente. Ya puedes iniciar
              sesión con tu nueva contraseña.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block font-bold text-teal-700 hover:text-teal-800"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {campos.map(({ key, label }) => (
              <div key={key}>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  {label}
                </label>
                <div className="relative">
                  <input
                    type={visible[key] ? "text" : "password"}
                    value={form[key]}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, [key]: event.target.value }));
                      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
                    }}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={`fixya-input pr-12 ${
                      fieldErrors[key]
                        ? "border-red-300 bg-red-50/40 focus:border-red-500"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setVisible((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label={visible[key] ? "Ocultar" : "Mostrar"}
                  >
                    {visible[key] ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {fieldErrors[key] && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {fieldErrors[key]}
                  </p>
                )}
              </div>
            ))}

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
              <KeyRound size={18} />
              {loading ? "Guardando..." : "Restablecer contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
