import { CheckCircle2, Circle, XCircle } from "lucide-react";

import {
  SOLICITUD_PROGRESS_STEPS,
  getSolicitudStatusDescription,
  getSolicitudStatusLabel,
  type SolicitudStatus,
} from "../../utils/requestStatus";

interface RequestProgressProps {
  status: string;
}

function RequestProgress({ status }: RequestProgressProps) {
  const normalized = status.toUpperCase();
  const isCancelled = normalized === "CANCELADO";
  const steps = isCancelled
    ? [
        SOLICITUD_PROGRESS_STEPS[0],
        {
          status: "CANCELADO" as SolicitudStatus,
          label: "Cancelada",
          description: "La solicitud fue cancelada y no seguirá avanzando.",
        },
      ]
    : SOLICITUD_PROGRESS_STEPS;

  const activeIndex = Math.max(
    steps.findIndex((step) => step.status === normalized),
    0
  );
  const progress =
    steps.length === 1 ? 100 : Math.round((activeIndex / (steps.length - 1)) * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Estado de la solicitud
          </p>
          <p className="mt-1 text-base font-bold text-slate-950">
            {getSolicitudStatusLabel(normalized)}
          </p>
        </div>
        <p
          className={`rounded-xl px-3 py-2 text-xs font-semibold ${
            isCancelled
              ? "bg-rose-100 text-rose-700"
              : "bg-white text-slate-600 ring-1 ring-slate-200"
          }`}
        >
          {getSolicitudStatusDescription(normalized)}
        </p>
      </div>

      <div className="mb-4 hidden h-2 overflow-hidden rounded-full bg-slate-200 md:block">
        <div
          className={`h-full rounded-full ${
            isCancelled ? "bg-rose-500" : "bg-teal-600"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => {
          const completed = index < activeIndex;
          const current = index === activeIndex;
          const Icon = isCancelled && current ? XCircle : completed ? CheckCircle2 : Circle;

          return (
            <li
              key={step.status}
              className={`rounded-xl border bg-white p-3 ${
                current
                  ? isCancelled
                    ? "border-rose-200"
                    : "border-teal-200"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon
                  className={`mt-0.5 h-5 w-5 shrink-0 ${
                    current
                      ? isCancelled
                        ? "text-rose-600"
                        : "text-teal-700"
                      : completed
                        ? "text-emerald-600"
                        : "text-slate-300"
                  }`}
                />
                <div>
                  <p className="text-sm font-bold text-slate-900">{step.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {step.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default RequestProgress;
