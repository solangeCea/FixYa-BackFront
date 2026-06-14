import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "yellow" | "red" | "purple" | "slate";
}

const tones = {
  blue: "bg-[#EAF0F5] text-[#123F66]",
  green: "bg-[#DDEADF] text-[#2F5F46]",
  yellow: "bg-[#FFF4D8] text-[#8C5F1D]",
  red: "bg-rose-50 text-rose-700",
  purple: "bg-[#F8F5EF] text-[#123F66]",
  slate: "bg-[#F8F5EF] text-[#5F6B7A]",
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
      <p className="text-3xl font-black text-[#0E1B2A]">{value}</p>
      <p className="mt-1 font-semibold text-[#102033]">{label}</p>
      {description && <p className="mt-1 text-sm text-[#5F6B7A]">{description}</p>}
    </div>
  );
}

export default StatCard;
