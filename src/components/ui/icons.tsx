type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function ChevronLeftIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...base} strokeWidth={2.5} className={className}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function ChevronRightIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} strokeWidth={2.5} className={className}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function PlusIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...base} strokeWidth={2.25} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ShareIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M12 3v12" />
      <path d="M7.5 7.5 12 3l4.5 4.5" />
      <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

export function TrashIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}

export function LocationIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M12 20s7-6.5 7-11.5A7 7 0 0 0 5 8.5C5 13.5 12 20 12 20Z" />
      <circle cx="12" cy="8.5" r="2.5" />
    </svg>
  );
}

export function SearchIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function CheckIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...base} strokeWidth={2.5} className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function DirectionsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M3 11l18-8-8 18-2-8-8-2z" />
    </svg>
  );
}
