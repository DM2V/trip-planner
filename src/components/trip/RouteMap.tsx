"use client";

import dynamic from "next/dynamic";
import { type MapMarker } from "@/components/map/MapView";
import { useRouteProfile } from "./RouteProfileContext";

// maplibre-gl is the bulk of this route's client bundle. Loading it as its own chunk (instead of
// bundled with the rest of the page's client JS) lets the rest of the page hydrate/become
// interactive without waiting on it. `ssr: false` means the map is never server-rendered anyway
// (mounting it requires a DOM container via useEffect), so the only visible change is that the
// empty placeholder div is swapped for the same pulsing skeleton already used for this exact
// screen area in loading.tsx, instead of a blank box, while the chunk loads.
const MapView = dynamic(() => import("@/components/map/MapView").then((mod) => mod.MapView), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[var(--color-fill-secondary)]" />,
});

export function RouteMap({ markers, readOnly = false }: { markers: MapMarker[]; readOnly?: boolean }) {
  const { routes, profile } = useRouteProfile();
  const route = routes?.[profile];
  return (
    <MapView markers={markers} routeGeometry={route?.geometry ?? null} legs={route?.legs ?? null} readOnly={readOnly} />
  );
}
