import type { Stop } from "@/types";

interface StopListProps {
  stops: Stop[];
}

// Phase 1/3: ordered list of stops with estimated time, shown next to the map.
export function StopList({ stops }: StopListProps) {
  return (
    <ol className="flex flex-col gap-2">
      {stops.map((stop) => (
        <li key={stop.id} className="rounded-xl border border-slate-800 p-3">
          {stop.name}
        </li>
      ))}
    </ol>
  );
}
