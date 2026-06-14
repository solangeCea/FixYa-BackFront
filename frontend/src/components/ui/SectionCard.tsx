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
        <div className="flex flex-col gap-3 border-b border-[#E6E0D6] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            {title && <h2 className="text-lg font-black text-[#0E1B2A]">{title}</h2>}
            {description && (
              <p className="mt-1 text-sm text-[#5F6B7A]">{description}</p>
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
