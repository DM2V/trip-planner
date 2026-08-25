import polyline from "@mapbox/polyline";
import type { LatLng } from "@/types";

const ORS_API_KEY = process.env.ORS_API_KEY;

export interface OptimizedRoute {
  order: number[];
  distanceMeters: number;
  durationSeconds: number;
  geometry: GeoJSON.Feature<GeoJSON.LineString>;
}

// Phase 3: calls the OpenRouteService Optimization API (VROOM-based, solves the TSP) with the
// origin as the vehicle's fixed starting point and each stop as a job to visit.
export async function getOptimizedRoute(
  origin: LatLng,
  stops: LatLng[],
): Promise<OptimizedRoute> {
  // api.openrouteservice.org was shut off on 2026-08-24 in favor of api.heigit.org (unified HeiGIT API).
  const response = await fetch("https://api.heigit.org/vroom/v0", {
    method: "POST",
    headers: {
      Authorization: ORS_API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jobs: stops.map((stop, index) => ({
        id: index + 1,
        location: [stop.lng, stop.lat],
      })),
      vehicles: [
        {
          id: 1,
          profile: "foot-walking",
          start: [origin.lng, origin.lat],
        },
      ],
      options: { g: true },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouteService Optimization API error: ${response.status}`);
  }

  const data = await response.json();
  const route = data.routes[0];

  const order = route.steps
    .filter((step: { type: string }) => step.type === "job")
    .map((step: { id: number }) => step.id - 1);

  const decoded = polyline.decode(route.geometry) as [number, number][];

  return {
    order,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: decoded.map(([lat, lng]) => [lng, lat]),
      },
    },
  };
}
