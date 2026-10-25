"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Must run before the first Map is created. The worker is copied into public/ at build time —
// see scripts/copy-maplibre-worker.mjs for why the default bundler-resolved worker doesn't work.
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
import { formatDistance, formatDuration } from "@/lib/utils";
import type { RouteLeg } from "@/lib/ors/optimization";

// Free basemap style, no API key required.
const CARTO_VOYAGER_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const ROUTE_SOURCE_ID = "trip-route";
const LEG_LABELS_SOURCE_ID = "trip-route-legs";
// Fixed hex values, not CSS vars: the basemap and its overlays render on WebGL canvas, not the
// DOM, so they can't read the app's light/dark tokens. The basemap itself is always light, so
// iOS systemBlue (light-mode value) reads correctly here regardless of the app's own theme.
const ORIGIN_COLOR = "#000000";
const STOP_COLOR = "#007aff";
const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  variant?: "origin" | "stop";
  order?: number; // visiting position (1, 2, 3...) shown inside the pin; omitted for the origin
}

// A numbered circle badge, matching the accent-blue "position" badge already used in the stop
// list — same visual language for the same concept, on the map instead of the list.
function createMarkerElement(point: MapMarker): HTMLDivElement {
  const el = document.createElement("div");
  el.textContent = point.order != null ? String(point.order) : "";
  Object.assign(el.style, {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "600",
    color: "#ffffff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
    background: point.variant === "origin" ? ORIGIN_COLOR : STOP_COLOR,
    border: "2px solid #ffffff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
  });
  return el;
}

// One label per leg, positioned at the straight-line midpoint between the two points it connects
// (not the midpoint along the actual road/path, which isn't worth the extra plumbing — every
// route here is short enough within a city that the straight-line midpoint sits right by the
// route line anyway). The route is a round trip (see getOptimizedRoute), so the last leg goes
// from the last stop back to the origin — closing the loop here the same way lets that leg's
// label position fall out of the same from/to pairing as every other one, instead of a special
// case. Routes calculated before the return leg existed just have one fewer entry in `legs`, so
// the loop below naturally stops short of that closing pair without any extra handling.
function buildLegLabels(markers: MapMarker[], legs: RouteLeg[] | null): GeoJSON.FeatureCollection {
  if (!legs || markers.length === 0) return EMPTY_FEATURE_COLLECTION;

  const loopPoints = [...markers, markers[0]];
  const count = Math.min(legs.length, loopPoints.length - 1);
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  for (let i = 0; i < count; i++) {
    const from = loopPoints[i];
    const to = loopPoints[i + 1];
    const leg = legs[i];
    features.push({
      type: "Feature",
      properties: { label: `${formatDistance(leg.distanceMeters)} · ${formatDuration(leg.durationSeconds)}` },
      geometry: { type: "Point", coordinates: [(from.lng + to.lng) / 2, (from.lat + to.lat) / 2] },
    });
  }
  return { type: "FeatureCollection", features };
}

interface MapViewProps {
  markers: MapMarker[];
  routeGeometry?: GeoJSON.Feature<GeoJSON.LineString> | null;
  legs?: RouteLeg[] | null;
  readOnly?: boolean;
}

// Phase 2/3: minimalist base map with a pin per origin/stop, auto-fitted to show them all,
// plus the optimized route line once it's been calculated.
export function MapView({ markers, routeGeometry = null, legs = null, readOnly = false }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const loadedRef = useRef(false);
  // Latest route/markers/legs, read inside the one-time map.on("load") callback below — a plain
  // closure over the props would only see whatever they were on the render that first mounted the
  // map. Kept current from a layout effect rather than during render (React 19's rules forbid
  // writing refs while rendering); layout effects run before the effect that mounts the map, so
  // the load callback still sees the latest values.
  const routeGeometryRef = useRef(routeGeometry);
  const markersDataRef = useRef(markers);
  const legsRef = useRef(legs);
  useLayoutEffect(() => {
    routeGeometryRef.current = routeGeometry;
    markersDataRef.current = markers;
    legsRef.current = legs;
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const first = markers[0];
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: CARTO_VOYAGER_STYLE,
      center: first ? [first.lng, first.lat] : [-73.9857, 40.7484],
      zoom: 12,
      interactive: !readOnly,
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource(ROUTE_SOURCE_ID, {
        type: "geojson",
        data: routeGeometryRef.current ?? EMPTY_FEATURE_COLLECTION,
      });
      map.addLayer({
        id: ROUTE_SOURCE_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        paint: { "line-color": STOP_COLOR, "line-width": 4 },
      });

      map.addSource(LEG_LABELS_SOURCE_ID, {
        type: "geojson",
        data: buildLegLabels(markersDataRef.current, legsRef.current),
      });
      map.addLayer({
        id: LEG_LABELS_SOURCE_ID,
        type: "symbol",
        source: LEG_LABELS_SOURCE_ID,
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Open Sans Regular"],
          "text-size": 11,
        },
        paint: {
          "text-color": "#1c1c1e",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        },
      });

      loadedRef.current = true;
    });

    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
    // Only re-create the map instance if readOnly mode changes, not on every marker/route update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = markers.map((point) =>
      new maplibregl.Marker({ element: createMarkerElement(point), anchor: "center" })
        .setLngLat([point.lng, point.lat])
        .setPopup(new maplibregl.Popup({ offset: 20 }).setText(point.label))
        .addTo(map),
    );

    if (markers.length > 0) {
      const bounds = markers.reduce(
        (b, point) => b.extend([point.lng, point.lat]),
        new maplibregl.LngLatBounds([markers[0].lng, markers[0].lat], [markers[0].lng, markers[0].lat]),
      );
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 });
    }
  }, [markers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    const source = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    source?.setData(routeGeometry ?? EMPTY_FEATURE_COLLECTION);
  }, [routeGeometry]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    const source = map.getSource(LEG_LABELS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    source?.setData(buildLegLabels(markers, legs));
  }, [markers, legs]);

  return <div ref={containerRef} className="h-full w-full" />;
}
