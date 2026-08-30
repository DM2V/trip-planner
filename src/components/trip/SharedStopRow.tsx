"use client";

import { googleMapsDirectionsUrl } from "@/lib/utils";
import type { Stop } from "@/types";

// Read-only counterpart to SwipeableStopRow for the public share page — no swipe gesture, just
// tap to get directions.
export function SharedStopRow({ stop, position }: { stop: Stop; position: number }) {
  return (
    <button
      type="button"
      onClick={() =>
        window.open(googleMapsDirectionsUrl(stop.lat, stop.lng), "_blank", "noopener,noreferrer")
      }
      aria-label={`${stop.name}, open directions in Google Maps`}
      className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 text-left active:bg-[var(--color-fill-secondary)]"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[0.8125rem] font-semibold text-white">
        {position}
      </span>
      <span className="flex-1 truncate text-[1.0625rem]">{stop.name}</span>
    </button>
  );
}
