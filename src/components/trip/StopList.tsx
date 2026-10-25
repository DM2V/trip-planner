import { ListSection } from "@/components/ui/List";
import { ReturnToOriginRow } from "./ReturnToOriginRow";
import { RouteLegConnector } from "./RouteLegConnector";
import { StopRow } from "./StopRow";
import type { Stop } from "@/types";

interface StopListProps {
  tripId: string;
  stops: Stop[];
  originLabel: string;
  originLat: number;
  originLng: number;
}

// Phase 1/3: ordered list of stops with estimated time, shown next to the map. A RouteLegConnector
// sits above each stop (once a route exists) showing the trip from the previous stop — or the
// trip's origin, for the first one — so the distance/time reads as "getting to this stop," not as
// an attribute of the stop itself. The trip is calculated as a round trip, so one more connector +
// a closing row show the trip back to the origin after the last stop.
export function StopList({ tripId, stops, originLabel, originLat, originLng }: StopListProps) {
  if (stops.length === 0) {
    return (
      <p className="px-1 text-[0.9375rem] text-(--color-label-secondary)">
        No stops yet — search above to add one.
      </p>
    );
  }

  return (
    <ListSection>
      {stops.flatMap((stop, index) => [
        <RouteLegConnector key={`${stop.id}-leg`} position={index + 1} />,
        <StopRow key={stop.id} tripId={tripId} stop={stop} position={index + 1} />,
      ])}
      <RouteLegConnector key="return-leg" position={stops.length + 1} />
      <ReturnToOriginRow originLabel={originLabel} originLat={originLat} originLng={originLng} stops={stops} />
    </ListSection>
  );
}
