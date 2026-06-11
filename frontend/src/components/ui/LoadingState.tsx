import { RefreshCw } from "lucide-react";

interface LoadingStateProps {
  label?: string;
}

function LoadingState({ label = "Cargando datos..." }: LoadingStateProps) {
  return (
    <div className="fixya-card rounded-2xl p-8 text-center">
      <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin text-teal-600" />
      <p className="font-semibold text-slate-700">{label}</p>
    </div>
  );
}

export default LoadingState;
