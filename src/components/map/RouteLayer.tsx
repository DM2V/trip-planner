// Phase 3: draws the geometry (GeoJSON LineString) returned by the OpenRouteService Optimization API on the map.
import type { Feature, LineString } from "geojson";

interface RouteLayerProps {
  geometry: Feature<LineString> | null;
}

export function RouteLayer({ geometry }: RouteLayerProps) {
  // TODO: map.addSource/addLayer with `geometry` once the map is ready (via a ref shared with MapView)
  return null;
}
