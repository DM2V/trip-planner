"use client";

import { useState } from "react";
import { OpenInMapsSheet } from "@/components/trip/OpenInMapsSheet";
import { useRouteProfile } from "@/components/trip/RouteProfileContext";
import { formatDistance, formatDuration } from "@/lib/utils";
import type { Stop } from "@/types";

// Read-only counterpart to StopRow for the public share page — tap to get directions, no
// delete button.
export function SharedStopRow({ stop, position }: { stop: Stop; position: number }) {
  const [mapsSheetOpen, setMapsSheetOpen] = useState(false);

  // The leg from the previous stop (or the trip's origin, for position 1) to this one — absent
  // until a route has been calculated, or for routes calculated before this field existed.
  const { routes, profile } = useRouteProfile();
  const leg = routes?.[profile]?.legs?.[position - 1];

  return (
    <>
      <button
        type="button"
        onClick={() => setMapsSheetOpen(true)}
        aria-label={`${stop.name}, open directions in Google Maps${leg ? `, ${formatDistance(leg.distanceMeters)} from the previous stop` : ""}`}
        className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left active:bg-[var(--color-fill-secondary)]"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[0.8125rem] font-semibold text-white">
          {position}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[1.0625rem]">{stop.name}</span>
          {leg && (
            <span className="block text-[0.8125rem] text-[var(--color-label-secondary)]">
              {formatDistance(leg.distanceMeters)} · {formatDuration(leg.durationSeconds)}
            </span>
          )}
        </span>
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
