import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "yellow" | "red" | "purple" | "slate";
}

const tones = {
  blue: "bg-cyan-50 text-cyan-700",
  green: "bg-emerald-50 text-emerald-700",
  yellow: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
  purple: "bg-teal-50 text-teal-700",
  slate: "bg-slate-100 text-slate-700",
};

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "blue",
}: StatCardProps) {
  return (
    <div className="fixya-card fixya-card-hover rounded-2xl p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className={`rounded-xl p-3 ${tones[tone]}`}>
          <Icon size={22} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 font-semibold text-slate-700">{label}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export default StatCard;
