export type SolicitudStatus =
  | "INICIADO"
  | "ASIGNADO"
  | "EN_PROCESO"
  | "FINALIZADO"
  | "CANCELADO";

export const SOLICITUD_PROGRESS_STEPS: Array<{
  status: SolicitudStatus;
  label: string;
  description: string;
}> = [
  {
    status: "INICIADO",
    label: "Solicitud enviada",
    description: "Tu solicitud fue registrada y queda disponible para revisión.",
  },
  {
    status: "ASIGNADO",
    label: "Técnico asignado",
    description: "Un técnico tomó el trabajo o fue asociado a la solicitud.",
  },
  {
    status: "EN_PROCESO",
    label: "En proceso",
    description: "El trabajo está en ejecución o coordinado para resolverlo.",
  },
  {
    status: "FINALIZADO",
    label: "Finalizada",
    description: "El servicio quedó cerrado y puedes revisar el resultado.",
  },
];

const statusLabels: Record<string, string> = {
  INICIADO: "Solicitud enviada",
  ASIGNADO: "Técnico asignado",
  EN_PROCESO: "En proceso",
  EN_REVISION_ADMIN: "Cancelación en revisión",
  FINALIZADO: "Finalizada",
  CANCELADO: "Cancelada",
  CAMBIO_ALCANCE: "Cambio de alcance · nueva cotización pendiente",
};

const statusDescriptions: Record<string, string> = {
  INICIADO: "Estamos esperando que un técnico disponible tome tu solicitud.",
  ASIGNADO: "Ya hay un técnico asociado. Revisa cotizaciones o próximos pasos.",
  EN_PROCESO: "El servicio está avanzando. Mantente atento a las actualizaciones.",
  EN_REVISION_ADMIN:
    "Se solicitó cancelar el trabajo. Un administrador está revisando el caso.",
  FINALIZADO: "El trabajo fue cerrado. Puedes dejar una reseña si corresponde.",
  CANCELADO: "La solicitud fue cancelada y no seguirá avanzando.",
  CAMBIO_ALCANCE:
    "El técnico informó un cambio de alcance. Revisa la nueva cotización para continuar.",
};

export function getSolicitudStatusLabel(status: string) {
  return statusLabels[status] ?? status.replaceAll("_", " ");
}

export function getSolicitudStatusDescription(status: string) {
  return (
    statusDescriptions[status] ??
    "Revisa el detalle para conocer el estado actual de la solicitud."
  );
}
