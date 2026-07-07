// Estados de verificación del técnico (columna estado_verificacion) y su
// presentación (etiqueta legible + tono de color para badges).

export type EstadoVerificacion =
  | "PENDIENTE"
  | "EN_REVISION"
  | "OBSERVADO"
  | "APROBADO"
  | "RECHAZADO"
  | "SUSPENDIDO";

const labels: Record<string, string> = {
  PENDIENTE: "Pendiente de revisión",
  EN_REVISION: "En revisión",
  OBSERVADO: "Con observaciones",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
  SUSPENDIDO: "Suspendido",
};

const badgeClasses: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700",
  EN_REVISION: "bg-cyan-100 text-cyan-700",
  OBSERVADO: "bg-orange-100 text-orange-700",
  APROBADO: "bg-emerald-100 text-emerald-700",
  RECHAZADO: "bg-rose-100 text-rose-700",
  SUSPENDIDO: "bg-slate-200 text-slate-700",
};

export function getVerificacionLabel(estado?: string | null): string {
  if (!estado) return "Sin estado";
  return labels[estado] ?? estado.replaceAll("_", " ");
}

export function getVerificacionBadgeClass(estado?: string | null): string {
  if (!estado) return "bg-slate-100 text-slate-600";
  return badgeClasses[estado] ?? "bg-slate-100 text-slate-600";
}

// Estados en que el admin dejó una observación que el técnico debe atender.
export function verificacionRequiereAtencion(estado?: string | null): boolean {
  return estado === "OBSERVADO" || estado === "RECHAZADO" || estado === "SUSPENDIDO";
}
