import API_URL from "../services/api";

// Formatea una fecha ISO a formato chileno legible (ej: "6 jul 2026").
export function formatDate(value: string | null | undefined): string {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
  }).format(date);
}

// Igual que formatDate pero incluye la hora (ej: "6 jul 2026, 14:32").
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

// Convierte la archivo_url del backend (/uploads/...) en una URL absoluta servible.
export function getUploadUrl(archivoUrl: string): string {
  if (!archivoUrl) return "#";
  if (archivoUrl.startsWith("http")) return archivoUrl;
  return `${API_URL}${archivoUrl}`;
}

// Formatea un monto en pesos chilenos (ej: "$45.000"). Acepta string o número.
export function formatCLP(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";

  const amount = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(amount)) return "—";

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Deja solo los dígitos de un texto (para inputs de monto en pesos).
// Evita el bug de interpretar "20.000" como 20 al usar el punto como decimal.
export function soloDigitos(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}

// Formatea una cadena de dígitos con separador de miles chileno para mostrar
// en un input (ej: "20000" -> "20.000"). Cadena vacía si no hay dígitos.
export function formatMilesCL(digits: string): string {
  const limpio = soloDigitos(digits);
  if (!limpio) return "";
  return new Intl.NumberFormat("es-CL").format(Number(limpio));
}
