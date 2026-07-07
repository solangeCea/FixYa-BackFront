import { useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Save } from "lucide-react";

import { changeMyPassword } from "../services/userService";
import { saveToken } from "../services/token";

type Campo = "actual" | "nueva" | "confirmar";

function fieldClass(error?: string) {
  return `w-full rounded-xl border px-4 py-3 pr-11 transition focus:outline-none focus:ring-2 ${
    error
      ? "border-red-300 bg-red-50/40 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 bg-white focus:border-teal-600 focus:ring-teal-100"
  }`;
}

export default function CambiarPassword() {
  const [form, setForm] = useState({ actual: "", nueva: "", confirmar: "" });
  const [visible, setVisible] = useState<Record<Campo, boolean>>({
    actual: false,
    nueva: false,
    confirmar: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(campo: Campo, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setFieldErrors((prev) => ({ ...prev, [campo]: "" }));
    setSuccess("");
  }

  function validar() {
    const errores: Record<string, string> = {};

    if (!form.actual) {
      errores.actual = "Ingresa tu contraseña actual.";
    }

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
    } else if (form.nueva === form.actual) {
      errores.nueva = "La nueva contraseña debe ser distinta de la actual.";
    }

    if (form.confirmar !== form.nueva) {
      errores.confirmar = "Las contraseñas no coinciden.";
    }

    return errores;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const errores = validar();
    setFieldErrors(errores);
    if (Object.keys(errores).length > 0) return;

    try {
      setSaving(true);
      const res = await changeMyPassword({
        contrasena_actual: form.actual,
        contrasena_nueva: form.nueva,
        confirmar_contrasena: form.confirmar,
      });

      // El backend renueva el token tras el cambio.
      saveToken(res.access_token);
      setForm({ actual: "", nueva: "", confirmar: "" });
      setSuccess("Tu contraseña se actualizó correctamente.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos cambiar tu contraseña. Intenta nuevamente."
      );
    } finally {
      setSaving(false);
    }
  }

  const campos: { key: Campo; label: string }[] = [
    { key: "actual", label: "Contraseña actual" },
    { key: "nueva", label: "Nueva contraseña" },
    { key: "confirmar", label: "Confirmar nueva contraseña" },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <header className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-950">Cambiar contraseña</h2>
          <p className="text-sm text-slate-600">
            Usa una contraseña segura con mayúscula, minúscula y número.
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {campos.map(({ key, label }) => (
          <div key={key}>
            <label
              htmlFor={`password-${key}`}
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              {label} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id={`password-${key}`}
                name={key}
                type={visible[key] ? "text" : "password"}
                value={form[key]}
                onChange={(event) => handleChange(key, event.target.value)}
                autoComplete={key === "actual" ? "current-password" : "new-password"}
                placeholder="••••••••"
                className={fieldClass(fieldErrors[key])}
              />
              <button
                type="button"
                onClick={() =>
                  setVisible((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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

        <div className="flex justify-end border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={saving}
            className="fixya-btn-primary px-5 py-3 text-sm disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </div>
      </form>
    </section>
  );
}
