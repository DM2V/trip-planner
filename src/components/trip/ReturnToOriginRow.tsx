"use client";

import { useState } from "react";
import { OpenInMapsSheet } from "@/components/trip/OpenInMapsSheet";
import { useRouteProfile } from "@/components/trip/RouteProfileContext";
import { LocationIcon } from "@/components/ui/icons";
import type { Stop } from "@/types";

interface ReturnToOriginRowProps {
  originLabel: string;
  originLat: number;
  originLng: number;
  stops: Stop[];
}

// The trip is calculated as a round trip (see getOptimizedRoute), so there's one more leg after
// the last stop: back to the origin. Shown the same way a stop would be — tap for directions —
// but with the origin's own black badge instead of a numbered blue one, and no delete button.
// Hidden entirely for routes calculated before the return leg existed (or not calculated at all).
export function ReturnToOriginRow({ originLabel, originLat, originLng, stops }: ReturnToOriginRowProps) {
  const [mapsSheetOpen, setMapsSheetOpen] = useState(false);
  const { routes, profile } = useRouteProfile();
  const hasReturnLeg = (routes?.[profile]?.legs?.length ?? 0) > stops.length;
  if (!hasReturnLeg) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setMapsSheetOpen(true)}
        aria-label={`Back to ${originLabel}, open directions in Google Maps`}
        className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 text-left active:bg-(--color-fill-secondary)"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-white">
          <LocationIcon className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1 truncate text-[1.0625rem]">Back to {originLabel}</span>
      </button>

      {mapsSheetOpen && (
        <OpenInMapsSheet stopName={originLabel} lat={originLat} lng={originLng} onClose={() => setMapsSheetOpen(false)} />
      )}
    </>
  );
}
