"use client";

import { useState } from "react";
import { OpenInMapsSheet } from "@/components/trip/OpenInMapsSheet";
import type { Stop } from "@/types";

// Read-only counterpart to StopRow for the public share page — tap to get directions, no
// delete button.
export function SharedStopRow({ stop, position }: { stop: Stop; position: number }) {
  const [mapsSheetOpen, setMapsSheetOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMapsSheetOpen(true)}
        aria-label={`${stop.name}, open directions in Google Maps`}
        className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 text-left active:bg-[var(--color-fill-secondary)]"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[0.8125rem] font-semibold text-white">
          {position}
        </span>
        <span className="flex-1 truncate text-[1.0625rem]">{stop.name}</span>
      </button>

      {mapsSheetOpen && (
        <OpenInMapsSheet
          stopName={stop.name}
          lat={stop.lat}
          lng={stop.lng}
          onClose={() => setMapsSheetOpen(false)}
        />
      )}
    </>
  );
}
