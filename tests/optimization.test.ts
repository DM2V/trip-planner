import polyline from "@mapbox/polyline";
import { describe, expect, it, vi } from "vitest";
import {
  describeUnreachablePoint,
  getOptimizedRoute,
  getRouteForSequence,
  UnroutableCoordinateError,
} from "@/lib/ors/optimization";

const ORIGIN = { lat: 40.758, lng: -73.9855 };
const STOPS = [
  { lat: 40.7829, lng: -73.9654 },
  { lat: 40.7484, lng: -73.9857 },
];

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// VROOM reports each step's distance/duration cumulatively from the route start, and always ends
// with an "end" step whether or not the vehicle was given an end.
function vroomResponse() {
  return {
    routes: [
      {
        distance: 4000,
        duration: 400,
        geometry: polyline.encode([
          [40.758, -73.9855],
          [40.7484, -73.9857],
          [40.7829, -73.9654],
        ]),
        steps: [
          { type: "start", distance: 0, duration: 0 },
          { type: "job", id: 2, distance: 1000, duration: 100 },
          { type: "job", id: 1, distance: 2500, duration: 260 },
          { type: "end", distance: 4000, duration: 400 },
        ],
      },
    ],
  };
}

describe("getOptimizedRoute", () => {
  it("orders the stops by VROOM's visiting order and turns cumulative steps into per-leg figures", async () => {
    stubFetch(vroomResponse());
    const route = await getOptimizedRoute(ORIGIN, STOPS, "driving-car", true);

    // job ids are 1-based; the order returned is 0-based indices into the stops passed in
    expect(route.order).toEqual([1, 0]);
    expect(route.legs).toEqual([
      { distanceMeters: 1000, durationSeconds: 100 }, // origin -> stop 2
      { distanceMeters: 1500, durationSeconds: 160 }, // stop 2 -> stop 1
      { distanceMeters: 1500, durationSeconds: 140 }, // stop 1 -> back to origin
    ]);
    expect(route.distanceMeters).toBe(4000);
  });

  it("does NOT count VROOM's trailing 'end' step as a leg on a one-way route", async () => {
    // VROOM emits that step even without vehicle.end; it's a zero-distance duplicate of the last
    // job, and treating it as a leg showed a bogus "Back to <origin>" row on one-way trips.
    stubFetch({
      routes: [
        {
          ...vroomResponse().routes[0],
          steps: [
            { type: "start", distance: 0, duration: 0 },
            { type: "job", id: 2, distance: 1000, duration: 100 },
            { type: "job", id: 1, distance: 2500, duration: 260 },
            { type: "end", distance: 2500, duration: 260 },
          ],
        },
      ],
    });
    const route = await getOptimizedRoute(ORIGIN, STOPS, "driving-car", false);

    expect(route.legs).toHaveLength(STOPS.length);
    expect(route.legs).toEqual([
      { distanceMeters: 1000, durationSeconds: 100 },
      { distanceMeters: 1500, durationSeconds: 160 },
    ]);
  });

  it("only asks VROOM to return to the origin for a round trip", async () => {
    const roundTrip = stubFetch(vroomResponse());
    await getOptimizedRoute(ORIGIN, STOPS, "driving-car", true);
    const sentRound = JSON.parse((roundTrip.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(sentRound.vehicles[0].end).toEqual([ORIGIN.lng, ORIGIN.lat]);

    const oneWay = stubFetch(vroomResponse());
    await getOptimizedRoute(ORIGIN, STOPS, "driving-car", false);
    const sentOneWay = JSON.parse((oneWay.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(sentOneWay.vehicles[0]).not.toHaveProperty("end");
  });

  it("sends coordinates as [lng, lat], and decodes the geometry back to [lng, lat]", async () => {
    const fetchMock = stubFetch(vroomResponse());
    const route = await getOptimizedRoute(ORIGIN, STOPS, "driving-car", true);

    const sent = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(sent.vehicles[0].start).toEqual([-73.9855, 40.758]);
    expect(sent.jobs[0].location).toEqual([-73.9654, 40.7829]);
    expect(route.geometry.geometry.coordinates[0]).toEqual([-73.9855, 40.758]);
  });

  it("names the unreachable coordinate instead of failing opaquely", async () => {
    // Real message from the live API for a stop on an island with no road access.
    stubFetch(
      {
        code: 3,
        error:
          "Could not find routable point within a radius of 350.0 meters of specified coordinate 1: -74.0445000 40.6892000.",
      },
      500,
    );
    const error = await getOptimizedRoute(ORIGIN, STOPS, "driving-car", true).catch((e) => e);

    expect(error).toBeInstanceOf(UnroutableCoordinateError);
    // the message gives "lng lat"; it must come out as lat 40.6892, lng -74.0445, not swapped
    expect(error.lat).toBeCloseTo(40.6892, 4);
    expect(error.lng).toBeCloseTo(-74.0445, 4);
  });

  it("throws a plain error for any other API failure", async () => {
    stubFetch({ error: "rate limit exceeded" }, 429);
    const error = await getOptimizedRoute(ORIGIN, STOPS, "driving-car", true).catch((e) => e);

    expect(error).not.toBeInstanceOf(UnroutableCoordinateError);
    expect(error.message).toContain("429");
  });
});

describe("getRouteForSequence", () => {
  it("takes one leg per segment, with no diffing (unlike VROOM)", async () => {
    stubFetch({
      features: [
        {
          geometry: { type: "LineString", coordinates: [[-73.9855, 40.758]] },
          properties: {
            summary: { distance: 3000, duration: 2100 },
            segments: [
              { distance: 1200, duration: 800 },
              { distance: 1800, duration: 1300 },
            ],
          },
        },
      ],
    });
    const route = await getRouteForSequence([ORIGIN, ...STOPS], "foot-walking");

    expect(route.legs).toEqual([
      { distanceMeters: 1200, durationSeconds: 800 },
      { distanceMeters: 1800, durationSeconds: 1300 },
    ]);
    expect(route.distanceMeters).toBe(3000);
  });

  it("reports an unroutable point the same way", async () => {
    stubFetch({ error: { message: "Could not find routable point within a radius of 350.0 meters of specified coordinate 0: -80.1 25.7." } }, 404);
    const error = await getRouteForSequence([ORIGIN, ...STOPS], "foot-walking").catch((e) => e);

    expect(error).toBeInstanceOf(UnroutableCoordinateError);
  });
});

describe("describeUnreachablePoint", () => {
  const stops = [
    { name: "Statue of Liberty", lat: 40.6892, lng: -74.0445 },
    { name: "Central Park", lat: 40.7829, lng: -73.9654 },
  ];

  it("recognises the starting point", () => {
    expect(describeUnreachablePoint(ORIGIN, ORIGIN, stops)).toBe("your starting point");
  });

  it("names the stop, matching despite the API rounding the coordinate", () => {
    expect(describeUnreachablePoint({ lat: 40.68921, lng: -74.04449 }, ORIGIN, stops)).toBe('"Statue of Liberty"');
  });

  it("falls back to a generic phrase when nothing is close enough", () => {
    expect(describeUnreachablePoint({ lat: 41.5, lng: -73.0 }, ORIGIN, stops)).toBe("one of your stops");
  });

  it("matches within ~100 m but not beyond", () => {
    const inside = { lat: stops[1].lat + 0.0009, lng: stops[1].lng };
    const outside = { lat: stops[1].lat + 0.0011, lng: stops[1].lng };
    expect(describeUnreachablePoint(inside, ORIGIN, stops)).toBe('"Central Park"');
    expect(describeUnreachablePoint(outside, ORIGIN, stops)).toBe("one of your stops");
  });
});
