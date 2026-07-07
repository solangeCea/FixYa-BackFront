import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Save,
  UserCog,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { getComunas, getRegiones } from "../../services/catalogService";
import type { Comuna, Region } from "../../services/catalogService";
import { updateMyProfile } from "../../services/userService";
import { saveToken } from "../../services/token";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fieldClass(error?: string) {
  return `w-full rounded-xl border px-4 py-3 transition focus:outline-none focus:ring-2 ${
    error
      ? "border-red-300 bg-red-50/40 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 bg-white focus:border-teal-600 focus:ring-teal-100"
  }`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
      <AlertCircle className="h-3.5 w-3.5" />
      {message}
    </p>
  );
}

const initialForm = {
  nombre_completo: "",
  correo: "",
  confirmarCorreo: "",
  telefono: "",
  region_id_region: 0,
  comuna_id_comuna: 0,
  direccion: "",
};

function ClientePerfil() {
  useDocumentTitle("Mi Perfil · FixYa");

  const { usuario, setUsuario } = useAuth();

  const [regiones, setRegiones] = useState<Region[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [prefilled, setPrefilled] = useState(false);
  const [originalCorreo, setOriginalCorreo] = useState("");
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([getRegiones(), getComunas()])
      .then(([regionesData, comunasData]) => {
        if (!active) return;
        setRegiones(regionesData);
        setComunas(comunasData);
      })
      .catch(() => {
        if (!active) return;
        setError("No pudimos cargar regiones y comunas. Actualiza la página.");
      })
      .finally(() => {
        if (!active) return;
        setLoadingCatalogos(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Precarga de datos actuales una vez que hay catálogos y usuario.
  useEffect(() => {
    if (prefilled || loadingCatalogos || !usuario) return;

    const comunaActual = comunas.find(
      (comuna) => comuna.id_comuna === usuario.comuna_id_comuna
    );

    setForm({
      nombre_completo: usuario.nombre_completo ?? "",
      correo: usuario.correo ?? "",
      confirmarCorreo: "",
      telefono: usuario.telefono ?? "",
      region_id_region: comunaActual?.region_id_region ?? 0,
      comuna_id_comuna: usuario.comuna_id_comuna ?? 0,
      direccion: usuario.direccion ?? "",
    });
    setOriginalCorreo(usuario.correo ?? "");
    setPrefilled(true);
  }, [prefilled, loadingCatalogos, usuario, comunas]);

  const comunasFiltradas = useMemo(
    () =>
      comunas.filter(
        (comuna) => comuna.region_id_region === form.region_id_region
      ),
    [comunas, form.region_id_region]
  );

  const correoCambio =
    form.correo.trim().toLowerCase() !== originalCorreo.trim().toLowerCase();

  function handleChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    const numericFields = ["region_id_region", "comuna_id_comuna"];

    setForm((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
      // Al cambiar la región se limpia la comuna.
      ...(name === "region_id_region" ? { comuna_id_comuna: 0 } : {}),
    }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
      ...(name === "region_id_region" ? { comuna_id_comuna: "" } : {}),
    }));
    setSuccess("");
  }

  function validar() {
    const nextErrors: Record<string, string> = {};

    if (!form.nombre_completo.trim()) {
      nextErrors.nombre_completo = "Ingresa tu nombre completo.";
    } else if (form.nombre_completo.trim().length < 3) {
      nextErrors.nombre_completo = "El nombre debe tener al menos 3 caracteres.";
    }

    if (!form.correo.trim()) {
      nextErrors.correo = "Ingresa tu correo electrónico.";
    } else if (!EMAIL_REGEX.test(form.correo.trim())) {
      nextErrors.correo = "Ingresa un correo válido.";
    }

    if (correoCambio) {
      if (!form.confirmarCorreo.trim()) {
        nextErrors.confirmarCorreo = "Confirma tu nuevo correo.";
      } else if (
        form.confirmarCorreo.trim().toLowerCase() !==
        form.correo.trim().toLowerCase()
      ) {
        nextErrors.confirmarCorreo = "Los correos no coinciden.";
      }
    }

    if (!form.telefono.trim()) {
      nextErrors.telefono = "Ingresa tu teléfono.";
    } else if (!/^9\d{8}$/.test(form.telefono.trim())) {
      nextErrors.telefono = "Debe tener 9 dígitos y comenzar con 9.";
    }

    if (!form.region_id_region) {
      nextErrors.region_id_region = "Selecciona tu región.";
    }

    if (!form.comuna_id_comuna) {
      nextErrors.comuna_id_comuna = "Selecciona tu comuna.";
    }

    if (form.direccion.trim() && form.direccion.trim().length < 5) {
      nextErrors.direccion = "La dirección debe tener al menos 5 caracteres.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const nextErrors = validar();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);

      const response = await updateMyProfile({
        nombre_completo: form.nombre_completo.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim(),
        comuna_id_comuna: form.comuna_id_comuna,
        direccion: form.direccion.trim() || null,
      });

      // El backend reemite el token (el correo pudo cambiar).
      saveToken(response.access_token);
      setUsuario(response.usuario);
      setOriginalCorreo(response.usuario.correo);
      setForm((prev) => ({
        ...prev,
        correo: response.usuario.correo,
        confirmarCorreo: "",
      }));
      setSuccess("Tus datos se actualizaron correctamente.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos actualizar tu perfil. Intenta nuevamente."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6">
          <Link
            to="/cliente/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a mis solicitudes
          </Link>
        </div>

        <header className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
            <UserCog className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Mi Perfil</h1>
            <p className="mt-1 text-sm text-slate-600">
              Actualiza tu información personal y de contacto.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
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

          {loadingCatalogos || !usuario ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center font-medium text-slate-600">
              Cargando tu información...
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="nombre_completo"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  id="nombre_completo"
                  name="nombre_completo"
                  value={form.nombre_completo}
                  onChange={handleChange}
                  placeholder="Ej: Josefa Reyes Muñoz"
                  className={fieldClass(fieldErrors.nombre_completo)}
                />
                <FieldError message={fieldErrors.nombre_completo} />
              </div>

              <div>
                <label
                  htmlFor="correo"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Correo electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  value={form.correo}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  className={fieldClass(fieldErrors.correo)}
                />
                <FieldError message={fieldErrors.correo} />
              </div>

              <div>
                <label
                  htmlFor="confirmarCorreo"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Confirmar correo electrónico
                </label>
                <input
                  id="confirmarCorreo"
                  name="confirmarCorreo"
                  type="email"
                  value={form.confirmarCorreo}
                  onChange={handleChange}
                  disabled={!correoCambio}
                  placeholder={
                    correoCambio
                      ? "Repite tu nuevo correo"
                      : "Solo si modificas tu correo"
                  }
                  className={`${fieldClass(fieldErrors.confirmarCorreo)} ${
                    !correoCambio ? "cursor-not-allowed bg-slate-50" : ""
                  }`}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Al cambiar tu correo debes ingresarlo dos veces para confirmarlo.
                </p>
                <FieldError message={fieldErrors.confirmarCorreo} />
              </div>

              <div>
                <label
                  htmlFor="telefono"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="912345678"
                  className={fieldClass(fieldErrors.telefono)}
                />
                <FieldError message={fieldErrors.telefono} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="region_id_region"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Región <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="region_id_region"
                    name="region_id_region"
                    value={form.region_id_region}
                    onChange={handleChange}
                    disabled={regiones.length === 0}
                    className={fieldClass(fieldErrors.region_id_region)}
                  >
                    <option value={0}>Selecciona tu región</option>
                    {regiones.map((region) => (
                      <option key={region.id_region} value={region.id_region}>
                        {region.nombre_region}
                      </option>
                    ))}
                  </select>
                  <FieldError message={fieldErrors.region_id_region} />
                </div>

                <div>
                  <label
                    htmlFor="comuna_id_comuna"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Comuna <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="comuna_id_comuna"
                    name="comuna_id_comuna"
                    value={form.comuna_id_comuna}
                    onChange={handleChange}
                    disabled={!form.region_id_region || comunasFiltradas.length === 0}
                    className={fieldClass(fieldErrors.comuna_id_comuna)}
                  >
                    {!form.region_id_region ? (
                      <option value={0}>Primero selecciona una región</option>
                    ) : comunasFiltradas.length === 0 ? (
                      <option value={0}>No hay comunas para esta región</option>
                    ) : (
                      <>
                        <option value={0}>Selecciona tu comuna</option>
                        {comunasFiltradas.map((comuna) => (
                          <option key={comuna.id_comuna} value={comuna.id_comuna}>
                            {comuna.nombre_comuna}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <FieldError message={fieldErrors.comuna_id_comuna} />
                </div>
              </div>

              <div>
                <label
                  htmlFor="direccion"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Dirección{" "}
                  <span className="text-xs font-normal text-slate-400">
                    (opcional)
                  </span>
                </label>
                <input
                  id="direccion"
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  maxLength={200}
                  placeholder="Ej: Av. Providencia 1234, depto 45"
                  className={fieldClass(fieldErrors.direccion)}
                />
                <FieldError message={fieldErrors.direccion} />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <Link
                  to="/cliente/dashboard"
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="fixya-btn-primary px-5 py-3 text-sm disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default ClientePerfil;
