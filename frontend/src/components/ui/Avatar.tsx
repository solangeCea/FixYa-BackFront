interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClass: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-lg",
  lg: "h-16 w-16 text-xl",
  xl: "h-20 w-20 text-2xl",
};

// Paleta de gradientes coherente con la identidad FixYa (teal/cyan/emerald).
const gradients = [
  "from-teal-600 to-cyan-600",
  "from-cyan-600 to-sky-600",
  "from-emerald-600 to-teal-600",
  "from-teal-700 to-emerald-600",
  "from-sky-600 to-indigo-600",
  "from-cyan-700 to-teal-600",
];

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "FX";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function gradientFor(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return gradients[hash % gradients.length];
}

/**
 * Avatar profesional basado en las iniciales del nombre, con un gradiente
 * determinista por persona. Sustituye al ícono genérico cuando no hay foto.
 */
function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-md ring-2 ring-white ${gradientFor(
        name
      )} ${sizeClass[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}

export default Avatar;
