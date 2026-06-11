import type { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

function SectionCard({
  title,
  description,
  actions,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section className={`fixya-card rounded-2xl ${className}`}>
      {(title || description || actions) && (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            {title && <h2 className="text-lg font-bold text-slate-950">{title}</h2>}
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

export default SectionCard;
