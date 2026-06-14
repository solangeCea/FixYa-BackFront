import { useEffect, useState } from "react";
import type { ChangeEvent, FocusEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wrench,
  User,
  Briefcase,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";

import { createUser } from "../../services/userService";
import type { UsuarioCreate } from "../../services/userService";
import { getComunas, getRegiones } from "../../services/catalogService";
import type { Comuna, Region } from "../../services/catalogService";
import { getServicios } from "../../services/catalogService";
import type { Servicio } from "../../services/catalogService";
import { login } from "../../services/authService";
import { saveToken } from "../../services/token";
import {
  createTechnicianProfile,
  uploadTechnicianDocument,
} from "../../services/technicianService";
import type { TipoEvidenciaTecnica } from "../../services/technicianService";

type UserType = "cliente" | "tecnico";
type RegisterField = keyof RegisterForm | "documento";

interface RegisterForm {
  nombre_completo: string;
  rut: string;
  fecha_nacimiento: string;
  genero: string;
  correo: string;
  telefono: string;
  contrasena: string;
  confirmarContrasena: string;
  region_id_region: number;
  comuna_id_comuna: number;
  descripcion_perfil: string;
  experiencia_anios: number;
  nivel_tecnico: string;
  servicio_id_servicio: number;
  tipo_evidencia: TipoEvidenciaTecnica;
}

const initialForm: RegisterForm = {
  nombre_completo: "",
  rut: "",
  fecha_nacimiento: "",
  genero: "Femenino",
  correo: "",
  telefono: "",
  contrasena: "",
  confirmarContrasena: "",
  region_id_region: 0,
  comuna_id_comuna: 0,
  descripcion_perfil: "",
  experiencia_anios: 0,
  nivel_tecnico: "Inicial",
  servicio_id_servicio: 0,
  tipo_evidencia: "EXPERIENCIA_OFICIO",
};

const evidenceOptions: Array<{ value: TipoEvidenciaTecnica; label: string }> = [
  { value: "CERTIFICADO", label: "Certificado" },
  { value: "TITULO", label: "Título" },
  { value: "CURSO", label: "Curso" },
  { value: "LICENCIA", label: "Licencia" },
  { value: "FOTO_TRABAJO", label: "Fotos de trabajos anteriores" },
  { value: "REFERENCIA_LABORAL", label: "Referencias laborales" },
  { value: "PORTAFOLIO", label: "Portafolio" },
  { value: "EXPERIENCIA_OFICIO", label: "Evidencia de experiencia en oficio" },
  { value: "OTRO", label: "Otra evidencia relevante" },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
      <AlertCircle className="h-3.5 w-3.5" />
      {message}
    </p>
  );
}

function fieldClass(error?: string) {
  return `w-full rounded-xl border px-4 py-3 transition focus:outline-none focus:ring-2 ${
    error
      ? "border-red-300 bg-red-50/40 focus:border-red-500 focus:ring-red-100"
      : "border-[#E6E0D6] bg-white focus:border-[#123F66] focus:ring-[#123F66]/10"
  }`;
}

function PasswordVisibilityButton({
  visible,
  onToggle,
  label,
}: {
  visible: boolean;
  onToggle: () => void;
  label: string;
}) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={visible}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#5F6B7A] transition hover:bg-[#F8F5EF] hover:text-[#102033]"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function normalizeRut(value: string) {
  return value.replace(/\./g, "").replace(/\s/g, "").toUpperCase();
}

function isValidRut(value: string) {
  const rut = normalizeRut(value);

  if (!/^\d{7,8}-[\dK]$/.test(rut)) return false;

  const [body, verifier] = rut.split("-");
  let sum = 0;
  let multiplier = 2;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expected = 11 - (sum % 11);
  const expectedVerifier =
    expected === 11 ? "0" : expected === 10 ? "K" : String(expected);

  return verifier === expectedVerifier;
}

function Register() {
  const [userType, setUserType] = useState<UserType>("cliente");
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [documento, setDocumento] = useState<File | null>(null);
  const [loadingComunas, setLoadingComunas] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [, setTouchedFields] = useState<Record<string, boolean>>(
    {}
  );

  const navigate = useNavigate();

  useEffect(() => {
    async function cargarComunas() {
      try {
        setLoadingComunas(true);
        setError("");

        const [regionesData, comunasData, serviciosData] = await Promise.all([
          getRegiones(),
          getComunas(),
          getServicios(),
        ]);

        const serviciosActivos = serviciosData.filter(
          (servicio) => servicio.estado_servicio
        );

        const primeraRegion = regionesData[0]?.id_region || 0;
        const comunasRegion = comunasData.filter(
          (comuna) => comuna.region_id_region === primeraRegion
        );

        setRegiones(regionesData);
        setComunas(comunasData);
        setServicios(serviciosActivos);
        setForm((prev) => ({
          ...prev,
          region_id_region: prev.region_id_region || primeraRegion,
          comuna_id_comuna:
            prev.comuna_id_comuna ||
            comunasRegion[0]?.id_comuna ||
            comunasData[0]?.id_comuna ||
            0,
          servicio_id_servicio:
            prev.servicio_id_servicio ||
            serviciosActivos[0]?.id_servicio ||
            0,
        }));
      } catch {
        setError(
          "No pudimos cargar regiones, comunas y servicios. Intenta actualizar la página antes de registrarte."
        );
      } finally {
        setLoadingComunas(false);
      }
    }

    cargarComunas();
  }, []);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    const field = name as RegisterField;
    const parsedValue =
      name === "comuna_id_comuna" ||
      name === "region_id_region" ||
      name === "experiencia_anios" ||
      name === "servicio_id_servicio"
        ? Number(value)
        : value;

    let nextForm: RegisterForm = {
      ...form,
      [name]: parsedValue,
    };

    if (name === "region_id_region") {
      const regionId = Number(value);
      const primeraComunaRegion = comunas.find(
        (comuna) => comuna.region_id_region === regionId
      );

      nextForm = {
        ...nextForm,
        region_id_region: regionId,
        comuna_id_comuna: primeraComunaRegion?.id_comuna || 0,
      };
    }

    setForm(nextForm);
    setError("");
    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
      ...(name === "region_id_region" ? { comuna_id_comuna: true } : {}),
    }));
    setFieldErrors((prev) => {
      const nextErrors = {
        ...prev,
        [name]: validateField(field, nextForm),
      };

      if (name === "region_id_region") {
        nextErrors.comuna_id_comuna = validateField(
          "comuna_id_comuna",
          nextForm
        );
      }

      if (name === "contrasena" || name === "confirmarContrasena") {
        nextErrors.confirmarContrasena = validateField(
          "confirmarContrasena",
          nextForm
        );
      }

      return nextErrors;
    });
  }

  function handleBlur(
    event: FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const field = event.target.name as RegisterField;

    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => {
      const nextErrors = {
        ...prev,
        [field]: validateField(field),
      };

      if (field === "contrasena" || field === "confirmarContrasena") {
        nextErrors.confirmarContrasena = validateField("confirmarContrasena");
      }

      return nextErrors;
    });
  }

  function handleUserTypeChange(nextUserType: UserType) {
    setUserType(nextUserType);
    setError("");

    if (nextUserType === "cliente") {
      setFieldErrors((prev) => {
        const nextErrors = { ...prev };

        delete nextErrors.servicio_id_servicio;
        delete nextErrors.experiencia_anios;
        delete nextErrors.descripcion_perfil;
        delete nextErrors.documento;

        return nextErrors;
      });
    }
  }

  function handleDocumentChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedDocument = event.target.files?.[0] || null;

    setDocumento(selectedDocument);
    setTouchedFields((prev) => ({ ...prev, documento: true }));
    setFieldErrors((prev) => ({
      ...prev,
      documento: validateField("documento", form, selectedDocument),
    }));
  }

  const comunasFiltradas = comunas.filter(
    (comuna) => comuna.region_id_region === form.region_id_region
  );

  function validateField(
    field: RegisterField,
    values: RegisterForm = form,
    currentDocumento: File | null = documento
  ) {
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const telefonoRegex = /^\d{8,12}$/;
    const nacimiento = new Date(`${values.fecha_nacimiento}T00:00:00`);
    const hoy = new Date();
    const edad =
      hoy.getFullYear() -
      nacimiento.getFullYear() -
      (hoy <
      new Date(
        hoy.getFullYear(),
        nacimiento.getMonth(),
        nacimiento.getDate()
      )
        ? 1
        : 0);

    if (field === "nombre_completo" && !values.nombre_completo.trim()) {
      return "Este campo es obligatorio.";
    }

    if (field === "rut") {
      if (!values.rut.trim()) return "Este campo es obligatorio.";
      if (!isValidRut(values.rut)) {
        return "Ingresa un RUT válido, por ejemplo 12345678-9.";
      }
    }

    if (field === "fecha_nacimiento") {
      if (!values.fecha_nacimiento) return "Selecciona tu fecha de nacimiento.";
      if (nacimiento > hoy || edad < 18) {
        return "Debes tener al menos 18 años para registrarte.";
      }
    }

    if (field === "genero" && !values.genero) {
      return "Selecciona una opción.";
    }

    if (field === "correo") {
      if (!values.correo.trim()) return "Este campo es obligatorio.";
      if (!correoRegex.test(values.correo)) return "Ingresa un correo válido.";
    }

    if (field === "telefono") {
      if (!values.telefono.trim()) return "Este campo es obligatorio.";
      if (!telefonoRegex.test(values.telefono)) {
        return "Ingresa un teléfono válido, solo números entre 8 y 12 dígitos.";
      }
    }

    if (field === "region_id_region" && !values.region_id_region) {
      return "Selecciona una región.";
    }

    if (field === "comuna_id_comuna" && !values.comuna_id_comuna) {
      return "Selecciona una comuna.";
    }

    if (field === "contrasena") {
      if (!values.contrasena) return "Este campo es obligatorio.";
      if (values.contrasena.length < 8) {
        return "La contraseña debe tener al menos 8 caracteres.";
      }
      if (!/[A-Z]/.test(values.contrasena)) {
        return "Incluye al menos una letra mayúscula.";
      }
      if (!/[a-z]/.test(values.contrasena)) {
        return "Incluye al menos una letra minúscula.";
      }
      if (!/\d/.test(values.contrasena)) {
        return "Incluye al menos un número.";
      }
    }

    if (field === "confirmarContrasena") {
      if (!values.confirmarContrasena) return "Confirma tu contraseña.";
      if (values.contrasena !== values.confirmarContrasena) {
        return "Las contraseñas no coinciden.";
      }
    }

    if (userType === "tecnico") {
      if (field === "servicio_id_servicio" && !values.servicio_id_servicio) {
        return "Selecciona el servicio que ofreces principalmente.";
      }

      if (field === "tipo_evidencia" && !values.tipo_evidencia) {
        return "Selecciona qué tipo de evidencia subirás.";
      }

      if (field === "experiencia_anios" && values.experiencia_anios < 0) {
        return "Ingresa años de experiencia válidos.";
      }

      if (field === "descripcion_perfil" && !values.descripcion_perfil.trim()) {
        return "Cuéntanos brevemente tu experiencia y especialidad.";
      }

      if (field === "documento") {
        const tiposPermitidos = ["application/pdf", "image/jpeg", "image/png"];

        if (!currentDocumento) return "Sube un documento técnico.";
        if (!tiposPermitidos.includes(currentDocumento.type)) {
          return "El documento debe ser PDF, JPG o PNG.";
        }
      }
    }

    return "";
  }

  function validarFormulario() {
    const fieldsToValidate: RegisterField[] = [
      "nombre_completo",
      "rut",
      "fecha_nacimiento",
      "genero",
      "correo",
      "telefono",
      "region_id_region",
      "comuna_id_comuna",
      "contrasena",
      "confirmarContrasena",
    ];

    if (userType === "tecnico") {
      fieldsToValidate.push(
        "servicio_id_servicio",
        "tipo_evidencia",
        "experiencia_anios",
        "descripcion_perfil",
        "documento"
      );
    }

    const errors = fieldsToValidate.reduce<Record<string, string>>(
      (nextErrors, field) => {
        const message = validateField(field);

        if (message) {
          nextErrors[field] = message;
        }

        return nextErrors;
      },
      {}
    );

    setTouchedFields(
      fieldsToValidate.reduce<Record<string, boolean>>((nextTouched, field) => {
        nextTouched[field] = true;
        return nextTouched;
      }, {})
    );
    setFieldErrors(errors);
    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validarFormulario();
    if (Object.keys(validationErrors).length > 0) {
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload: UsuarioCreate = {
        rut: form.rut,
        nombre_completo: form.nombre_completo,
        fecha_nacimiento: form.fecha_nacimiento,
        genero: form.genero,
        correo: form.correo,
        telefono: form.telefono,
        contrasena: form.contrasena,
        comuna_id_comuna: form.comuna_id_comuna,
        tipo_usuario: userType === "cliente" ? "CLIENTE" : "TECNICO",
      };

      await createUser(payload);

      if (userType === "tecnico") {
        await createTechnicianProfile({
          usuario_rut: form.rut,
          descripcion_perfil: form.descripcion_perfil,
          experiencia_anios: form.experiencia_anios,
          nivel_tecnico: form.nivel_tecnico,
          servicios: [form.servicio_id_servicio],
          comunas: [form.comuna_id_comuna],
        });

        const loginResponse = await login(form.correo, form.contrasena);
        saveToken(loginResponse.access_token);

        if (documento) {
          await uploadTechnicianDocument({
            tecnico_usuario_rut: form.rut,
            tipo_documento: form.tipo_evidencia,
            archivo: documento,
          });
        }
      }

      navigate("/login");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos crear tu cuenta. Revisa los datos e inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixya-shell min-h-screen">
      <div className="border-b border-[#E6E0D6] bg-[#F8F5EF]/95 py-6">
        <div className="mx-auto max-w-4xl px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-[#123F66] hover:text-[#C8872D]"
          >
            <div className="rounded-lg bg-[#123F66] p-2">
              <Wrench className="text-white" size={20} />
            </div>

            <span className="text-xl font-bold">FixYa</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixya-card rounded-2xl p-8"
        >
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-black text-[#0E1B2A]">
              Crear cuenta en FixYa
            </h1>

            <p className="text-[#5F6B7A]">
              Únete a la comunidad FixYa
            </p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleUserTypeChange("cliente")}
              className={`rounded-xl border-2 p-4 transition-all ${
                userType === "cliente"
                  ? "border-[#C8872D] bg-[#FFF8EA]"
                  : "border-[#E6E0D6] hover:border-[#C8872D]/60"
              }`}
            >
              <div
                className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${
                  userType === "cliente"
                    ? "bg-[#123F66] text-white"
                    : "bg-[#F8F5EF] text-[#5F6B7A]"
                }`}
              >
                <User size={24} />
              </div>

              <h3 className="font-bold text-[#102033]">
                Soy Cliente
              </h3>

              <p className="mt-1 text-sm text-[#5F6B7A]">
                Busco contratar técnicos
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleUserTypeChange("tecnico")}
              className={`rounded-xl border-2 p-4 transition-all ${
                userType === "tecnico"
                  ? "border-[#C8872D] bg-[#FFF8EA]"
                  : "border-[#E6E0D6] hover:border-[#C8872D]/60"
              }`}
            >
              <div
                className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${
                  userType === "tecnico"
                    ? "bg-[#DDEADF] text-[#2F5F46]"
                    : "bg-[#F8F5EF] text-[#5F6B7A]"
                }`}
              >
                <Briefcase size={24} />
              </div>

              <h3 className="font-bold text-[#102033]">
                Soy Técnico
              </h3>

              <p className="mt-1 text-sm text-[#5F6B7A]">
                Ofrezco mis servicios
              </p>
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="nombre_completo"
                  className="mb-2 block font-medium text-[#102033]"
                >
                  Nombre completo
                </label>

                <input
                  id="nombre_completo"
                  name="nombre_completo"
                  value={form.nombre_completo}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  type="text"
                  required
                  placeholder="Juan Pérez"
                  className={fieldClass(fieldErrors.nombre_completo)}
                />
                <FieldError message={fieldErrors.nombre_completo} />
              </div>

              <div>
                <label
                  htmlFor="rut"
                  className="mb-2 block font-medium text-[#102033]"
                >
                  RUT
                </label>

                <input
                  id="rut"
                  name="rut"
                  value={form.rut}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  type="text"
                  required
                  placeholder="12345678-9"
                  className={fieldClass(fieldErrors.rut)}
                />
                <FieldError message={fieldErrors.rut} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="fecha_nacimiento"
                  className="mb-2 block font-medium text-[#102033]"
                >
                  Fecha de nacimiento
                </label>

                <input
                  id="fecha_nacimiento"
                  name="fecha_nacimiento"
                  value={form.fecha_nacimiento}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  type="date"
                  required
                  className={fieldClass(fieldErrors.fecha_nacimiento)}
                />
                <FieldError message={fieldErrors.fecha_nacimiento} />
              </div>

              <div>
                <label
                  htmlFor="genero"
                  className="mb-2 block font-medium text-[#102033]"
                >
                  Género
                </label>

                <select
                  id="genero"
                  name="genero"
                  value={form.genero}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className="fixya-input"
                >
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="correo"
                className="mb-2 block font-medium text-[#102033]"
              >
                Correo electrónico
              </label>

              <input
                id="correo"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                onBlur={handleBlur}
                type="email"
                required
                placeholder="correo@gmail.com"
                className={fieldClass(fieldErrors.correo)}
              />
              <FieldError message={fieldErrors.correo} />
            </div>

            <div>
              <label
                htmlFor="telefono"
                className="mb-2 block font-medium text-[#102033]"
              >
                Teléfono
              </label>

              <input
                id="telefono"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                onBlur={handleBlur}
                type="tel"
                required
                placeholder="912345678"
                className={fieldClass(fieldErrors.telefono)}
              />
              <FieldError message={fieldErrors.telefono} />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="region_id_region"
                  className="mb-2 block font-medium text-[#102033]"
                >
                  Región
                </label>

                <select
                  id="region_id_region"
                  name="region_id_region"
                  value={form.region_id_region}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  disabled={loadingComunas || regiones.length === 0}
                  className={fieldClass(fieldErrors.region_id_region)}
                >
                  {regiones.length === 0 && (
                    <option value={0}>No hay regiones disponibles para seleccionar</option>
                  )}
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
                  className="mb-2 block font-medium text-[#102033]"
                >
                  Comuna
                </label>

                <select
                  id="comuna_id_comuna"
                  name="comuna_id_comuna"
                  value={form.comuna_id_comuna}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  disabled={loadingComunas || comunasFiltradas.length === 0}
                  className={fieldClass(fieldErrors.comuna_id_comuna)}
                >
                  {comunasFiltradas.length === 0 && (
                    <option value={0}>No hay comunas disponibles para esta región</option>
                  )}
                  {comunasFiltradas.map((comuna) => (
                    <option key={comuna.id_comuna} value={comuna.id_comuna}>
                      {comuna.nombre_comuna}
                    </option>
                  ))}
                </select>
                <FieldError message={fieldErrors.comuna_id_comuna} />
              </div>
            </div>

            {userType === "tecnico" && (
              <div className="space-y-4 rounded-xl border border-[#E6E0D6] bg-[#FFF8EA] p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="servicio_id_servicio"
                      className="mb-2 block font-medium text-[#102033]"
                    >
                      Servicio principal
                    </label>
                    <select
                      id="servicio_id_servicio"
                      name="servicio_id_servicio"
                      value={form.servicio_id_servicio}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={servicios.length === 0}
                      className={fieldClass(fieldErrors.servicio_id_servicio)}
                    >
                      {servicios.length === 0 && (
                        <option value={0}>No hay servicios disponibles para técnicos</option>
                      )}
                      {servicios.map((servicio) => (
                        <option
                          key={servicio.id_servicio}
                          value={servicio.id_servicio}
                        >
                          {servicio.nombre_servicio}
                        </option>
                      ))}
                    </select>
                    <FieldError message={fieldErrors.servicio_id_servicio} />
                  </div>

                  <div>
                    <label
                      htmlFor="tipo_evidencia"
                      className="mb-2 block font-medium text-[#102033]"
                    >
                      Tipo de evidencia
                    </label>
                    <select
                      id="tipo_evidencia"
                      name="tipo_evidencia"
                      value={form.tipo_evidencia}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={fieldClass(fieldErrors.tipo_evidencia)}
                    >
                      {evidenceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FieldError message={fieldErrors.tipo_evidencia} />
                  </div>

                  <div>
                    <label
                      htmlFor="nivel_tecnico"
                      className="mb-2 block font-medium text-[#102033]"
                    >
                      Nivel técnico
                    </label>
                    <select
                      id="nivel_tecnico"
                      name="nivel_tecnico"
                      value={form.nivel_tecnico}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="fixya-input"
                    >
                      <option value="Inicial">Inicial</option>
                      <option value="Intermedio">Intermedio</option>
                      <option value="Avanzado">Avanzado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="experiencia_anios"
                    className="mb-2 block font-medium text-[#102033]"
                  >
                    Experiencia en anos
                  </label>
                  <input
                    id="experiencia_anios"
                    name="experiencia_anios"
                    value={form.experiencia_anios}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    type="number"
                    min="0"
                    className={fieldClass(fieldErrors.experiencia_anios)}
                  />
                  <FieldError message={fieldErrors.experiencia_anios} />
                </div>

                <div>
                  <label
                    htmlFor="descripcion_perfil"
                    className="mb-2 block font-medium text-[#102033]"
                  >
                    Descripcion del perfil
                  </label>
                  <input
                    id="descripcion_perfil"
                    name="descripcion_perfil"
                    value={form.descripcion_perfil}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    type="text"
                    placeholder="Especialidad, experiencia y tipo de trabajos"
                    className={fieldClass(fieldErrors.descripcion_perfil)}
                  />
                  <FieldError message={fieldErrors.descripcion_perfil} />
                </div>

                <div>
                  <label
                    htmlFor="documento"
                    className="mb-2 block font-medium text-[#102033]"
                  >
                    Evidencia para verificar tu perfil
                  </label>
                  <input
                    id="documento"
                    name="documento"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleDocumentChange}
                    onBlur={handleBlur}
                    className={fieldClass(fieldErrors.documento)}
                  />
                  <FieldError message={fieldErrors.documento} />
                  <p className="mt-2 text-xs text-[#8C5F1D]">
                    Puedes subir certificados, fotos de trabajos, referencias o portafolio en PDF, JPG o PNG.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="contrasena"
                  className="mb-2 block font-medium text-[#102033]"
                >
                  Contraseña
                </label>

                <div className="relative">
                  <input
                    id="contrasena"
                    name="contrasena"
                    value={form.contrasena}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className={`${fieldClass(fieldErrors.contrasena)} pr-12`}
                  />
                  <PasswordVisibilityButton
                    visible={showPassword}
                    onToggle={() => setShowPassword((prev) => !prev)}
                    label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  />
                </div>
                <FieldError message={fieldErrors.contrasena} />
              </div>

              <div>
                <label
                  htmlFor="confirmarContrasena"
                  className="mb-2 block font-medium text-[#102033]"
                >
                  Confirmar contraseña
                </label>

                <div className="relative">
                  <input
                    id="confirmarContrasena"
                    name="confirmarContrasena"
                    value={form.confirmarContrasena}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className={`${fieldClass(fieldErrors.confirmarContrasena)} pr-12`}
                  />
                  <PasswordVisibilityButton
                    visible={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((prev) => !prev)}
                    label={
                      showConfirmPassword
                        ? "Ocultar confirmación de contraseña"
                        : "Mostrar confirmación de contraseña"
                    }
                  />
                </div>
                <FieldError message={fieldErrors.confirmarContrasena} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || loadingComunas || comunasFiltradas.length === 0}
              className="fixya-btn-primary w-full py-4 disabled:cursor-not-allowed"
            >
              {loading
                ? "Creando cuenta..."
                : userType === "tecnico"
                ? "Crear cuenta técnico"
                : "Crear cuenta cliente"}
            </button>

            <p className="text-center text-sm text-[#5F6B7A]">
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#123F66] hover:text-[#C8872D]"
              >
                Inicia sesión
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default Register;
