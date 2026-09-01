"use client";

import { MapView, type MapMarker } from "@/components/map/MapView";
import { useRouteProfile } from "./RouteProfileContext";

export function RouteMap({ markers, readOnly = false }: { markers: MapMarker[]; readOnly?: boolean }) {
  const { routes, profile } = useRouteProfile();
  return <MapView markers={markers} routeGeometry={routes?.[profile]?.geometry ?? null} readOnly={readOnly} />;
}
