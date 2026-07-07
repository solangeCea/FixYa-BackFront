import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, Send, Wrench } from "lucide-react";

import { requestPasswordReset } from "../../services/userService";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecuperarPassword() {
  useDocumentTitle("Recuperar contraseña · FixYa");

  const [correo, setCorreo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enlaceDemo, setEnlaceDemo] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setFieldError("");

    if (!correo.trim()) {
      setFieldError("Ingresa tu correo electrónico.");
      return;
    }
    if (!EMAIL_REGEX.test(correo.trim())) {
      setFieldError("Ingresa un correo válido.");
      return;
    }

    try {
      setLoading(true);
      const respuesta = await requestPasswordReset(correo.trim());
      // Ruta interna del enlace demo (mismo origen) para no depender de FRONTEND_URL.
      if (respuesta.enlace_demo) {
        const idx = respuesta.enlace_demo.indexOf("/restablecer");
        setEnlaceDemo(idx >= 0 ? respuesta.enlace_demo.slice(idx) : respuesta.enlace_demo);
      }
      setEnviado(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos procesar tu solicitud. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

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
              Recuperar contraseña
            </h1>
            <p className="text-sm text-slate-600">
              Te enviaremos un enlace a tu correo.
            </p>
          </div>
        </div>

        {enviado ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
            <div className="mb-2 flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-5 w-5" />
              Revisa tu correo
            </div>
            <p className="leading-6">
              Si <strong>{correo}</strong> está registrado, te enviamos un enlace
              para restablecer tu contraseña. El enlace expira en 60 minutos.
            </p>

            {enlaceDemo && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide">
                  Modo demostración (sin correo configurado)
                </p>
                <p className="mb-3 text-sm leading-6">
                  No hay servidor de correo configurado, así que puedes continuar
                  directamente con este enlace:
                </p>
                <Link
                  to={enlaceDemo}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700"
                >
                  <Send className="h-4 w-4" />
                  Restablecer mi contraseña ahora
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="mt-4 inline-block font-bold text-teal-700 hover:text-teal-800"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Correo electrónico
              </label>
              <input
                type="email"
                value={correo}
                onChange={(event) => {
                  setCorreo(event.target.value);
                  setFieldError("");
                }}
                placeholder="tu@email.com"
                className={`fixya-input ${
                  fieldError ? "border-red-300 bg-red-50/40 focus:border-red-500" : ""
                }`}
              />
              {fieldError && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {fieldError}
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
              <Send size={18} />
              {loading ? "Enviando enlace..." : "Enviar enlace de recuperación"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
