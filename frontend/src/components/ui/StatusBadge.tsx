interface StatusBadgeProps {
  status: string;
  label?: string;
}

function StatusBadge({ status, label }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  const esAnulada = normalized.startsWith("ANULADA");
  const className =
    normalized === "FINALIZADO" || normalized === "ACEPTADA" || normalized === "ACTIVA"
      ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
      : normalized === "ASIGNADO" || normalized === "ENVIADA"
        ? "bg-amber-100 text-amber-700 ring-amber-200"
        : normalized === "EN_PROCESO"
          ? "bg-teal-100 text-teal-700 ring-teal-200"
          : normalized === "CAMBIO_ALCANCE"
            ? "bg-orange-100 text-orange-700 ring-orange-200"
            : normalized === "EXPIRADA"
              ? "bg-slate-200 text-slate-600 ring-slate-300"
              : normalized === "CANCELADO" ||
                  normalized === "RECHAZADA" ||
                  normalized === "OCULTADA" ||
                  esAnulada
                ? "bg-rose-100 text-rose-700 ring-rose-200"
                : "bg-cyan-100 text-cyan-700 ring-cyan-200";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${className}`}>
      {label ?? status}
    </span>
  );
}

export default StatusBadge;
