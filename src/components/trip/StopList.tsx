import { ListSection } from "@/components/ui/List";
import { SwipeableStopRow } from "./SwipeableStopRow";
import type { Stop } from "@/types";

interface StopListProps {
  tripId: string;
  stops: Stop[];
}

// Phase 1/3: ordered list of stops with estimated time, shown next to the map.
export function StopList({ tripId, stops }: StopListProps) {
  if (stops.length === 0) {
    return (
      <p className="px-1 text-[0.9375rem] text-[var(--color-label-secondary)]">
        No stops yet — search above to add one.
      </p>
    );
  }

  return (
    <ListSection>
      {stops.map((stop, index) => (
        <SwipeableStopRow key={stop.id} tripId={tripId} stop={stop} position={index + 1} />
      ))}
    </ListSection>
  );
}
