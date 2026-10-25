// The app's mark: three stops climbing a winding route, the last one larger as the destination.
// Replaces a placeholder circle-on-circle that read as unfinished artwork on the one screen every
// first-time visitor sees.
export function AppMark({ className = "h-20 w-20" }: { className?: string }) {
  return (
    <div
      className={`${className} flex items-center justify-center rounded-[26%] bg-(--color-accent) shadow-xs`}
    >
      <svg viewBox="0 0 48 48" fill="none" className="h-[64%] w-[64%]" aria-hidden="true">
        {/* Held back from full white so the stops read as the foreground, not the line. */}
        <path
          d="M12 37C12 28.5 23 31 24 22C25 13 32.5 14 36 11"
          stroke="white"
          strokeOpacity="0.55"
          strokeWidth="2.75"
          strokeLinecap="round"
        />
        <circle cx="12" cy="37" r="3.25" fill="white" />
        <circle cx="24" cy="22" r="3.25" fill="white" />
        <circle cx="36" cy="11" r="4.75" fill="white" />
      </svg>
    </div>
  );
}
