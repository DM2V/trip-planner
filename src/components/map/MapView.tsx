"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Free basemap style, no API key required.
const CARTO_VOYAGER_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const ROUTE_SOURCE_ID = "trip-route";
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

interface MapViewProps {
  markers: MapMarker[];
  routeGeometry?: GeoJSON.Feature<GeoJSON.LineString> | null;
  readOnly?: boolean;
}

// Phase 2/3: minimalist base map with a pin per origin/stop, auto-fitted to show them all,
// plus the optimized route line once it's been calculated.
export function MapView({ markers, routeGeometry = null, readOnly = false }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const loadedRef = useRef(false);
  const routeGeometryRef = useRef(routeGeometry);
  routeGeometryRef.current = routeGeometry;

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

  return <div ref={containerRef} className="h-full w-full" />;
}
