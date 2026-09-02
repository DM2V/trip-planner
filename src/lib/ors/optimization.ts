import polyline from "@mapbox/polyline";
import type { LatLng } from "@/types";

const ORS_API_KEY = process.env.ORS_API_KEY;

// ORS/VROOM has no public-transit profile at all — these are the two that make sense for a
// walkable/driveable trip itinerary.
export type TravelProfile = "driving-car" | "foot-walking";

export interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
}

export interface RouteMetrics {
  distanceMeters: number;
  durationSeconds: number;
  geometry: GeoJSON.Feature<GeoJSON.LineString>;
  // One entry per stop, in visiting order — legs[0] is origin -> first stop, legs[i] is the
  // previous stop -> stop i — plus, only for a round trip, one final entry for the trip back to
  // the origin at legs[stops.length]. Optional because routes calculated before this field
  // existed are still sitting in the database without it.
  legs?: RouteLeg[];
}

// Keyed by profile so a trip can hold both a driving and a walking route at once, letting the
// viewer toggle between them instead of picking one before calculating.
export type OptimizedRoutes = Partial<Record<TravelProfile, RouteMetrics>>;

interface VroomRoute extends RouteMetrics {
  order: number[];
}

// Thrown when ORS can't snap a coordinate onto the road/path network for the requested profile —
// e.g. a stop on an island with no bridge, or otherwise disconnected. Carries the coordinate (not
// which stop it was) since that's all ORS's own error message gives us; the caller matches it
// back to a stop name.
export class UnroutableCoordinateError extends Error {
  constructor(
    public lat: number,
    public lng: number,
  ) {
    super(`No routable point near ${lat}, ${lng}`);
    this.name = "UnroutableCoordinateError";
  }
}

// ORS's "could not find routable point" error embeds the offending coordinate as "lng lat" —
// e.g. `Could not find routable point within a radius of 350.0 meters of specified coordinate
// 1: -74.0445000 40.6892490.` Parsed out of the response body so failures for an unreachable
// stop (an island, a pedestrian-only area for driving, etc.) can be reported by name instead of
// failing the whole calculation with an opaque 500.
async function throwForFailedResponse(response: Response, apiName: string): Promise<never> {
  const body = await response.text();
  const match = /coordinate \d+: (-?\d+\.?\d*) (-?\d+\.?\d*)/.exec(body);
  if (match) {
    throw new UnroutableCoordinateError(Number(match[2]), Number(match[1]));
  }
  throw new Error(`${apiName} error: ${response.status}`);
}

// Phase 3: calls the OpenRouteService Optimization API (VROOM-based, solves the TSP) with the
// origin as the vehicle's start, and — only when roundTrip is true — also as its end, so it
// solves for an actual round trip (visit every stop and come back) rather than a one-way path.
// The order that's best for "go out and come home" isn't always the same as the order that's
// best for "just go out," so this changes what "optimal" means, not just which numbers get
// reported afterward — asked of the user up front each time (see RouteTypeSheet), not assumed.
// Used for the primary (driving) profile only — it's the one that picks the visiting order.
export async function getOptimizedRoute(
  origin: LatLng,
  stops: LatLng[],
  profile: TravelProfile,
  roundTrip: boolean,
): Promise<VroomRoute> {
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
          profile,
          start: [origin.lng, origin.lat],
          ...(roundTrip ? { end: [origin.lng, origin.lat] } : {}),
        },
      ],
      options: { g: true },
    }),
  });

  if (!response.ok) {
    await throwForFailedResponse(response, "OpenRouteService Optimization API");
  }

  const data = await response.json();
  const route = data.routes[0];

  // VROOM's per-step distance/duration are cumulative from the route's start, not deltas — so
  // each leg is the difference between one step and the one before it (the vehicle's "start" step
  // has distance/duration 0, which is exactly the base case the first job step needs).
  //
  // VROOM always emits a final "end" step, whether or not vehicle.end was set — when it wasn't,
  // that step is just a zero-distance duplicate of the last job (marking "the route stops here",
  // not an actual leg), confirmed by requesting the same route with and without vehicle.end and
  // diffing the response. Only fold it into the legs when this was actually a round trip, or a
  // one-way route would get a bogus extra "leg" of 0m/0s tacked onto its last stop.
  const relevantSteps = route.steps.filter(
    (step: { type: string }) => step.type === "job" || (roundTrip && step.type === "end"),
  );
  const order = relevantSteps
    .filter((step: { type: string }) => step.type === "job")
    .map((step: { id: number }) => step.id - 1);
  const legs: RouteLeg[] = relevantSteps.map((step: { distance: number; duration: number }, i: number) => {
    const previous = i === 0 ? { distance: 0, duration: 0 } : relevantSteps[i - 1];
    return {
      distanceMeters: step.distance - previous.distance,
      durationSeconds: step.duration - previous.duration,
    };
  });

  const decoded = polyline.decode(route.geometry) as [number, number][];

  return {
    order,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    legs,
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

// Distance/duration/geometry for a fixed sequence of waypoints, via the ORS Directions API. Used
// to get a second profile's numbers (e.g. walking) for the exact same visiting order the primary
// profile's optimization already picked, instead of letting the two profiles disagree on order.
export async function getRouteForSequence(waypoints: LatLng[], profile: TravelProfile): Promise<RouteMetrics> {
  const response = await fetch(`https://api.heigit.org/openrouteservice/v2/directions/${profile}/geojson`, {
    method: "POST",
    headers: {
      Authorization: ORS_API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ coordinates: waypoints.map((point) => [point.lng, point.lat]) }),
  });

  if (!response.ok) {
    await throwForFailedResponse(response, "OpenRouteService Directions API");
  }

  const data = await response.json();
  const feature = data.features[0];

  // Unlike VROOM's cumulative step distances, ORS Directions' `segments` are already one entry
  // per leg between consecutive waypoints — no diffing needed.
  const legs: RouteLeg[] = feature.properties.segments.map((segment: { distance: number; duration: number }) => ({
    distanceMeters: segment.distance,
    durationSeconds: segment.duration,
  }));

  return {
    distanceMeters: feature.properties.summary.distance,
    durationSeconds: feature.properties.summary.duration,
    legs,
    geometry: { type: "Feature", properties: {}, geometry: feature.geometry },
  };
}
