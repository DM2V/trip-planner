"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Free minimalist basemap style, no API key required.
const CARTO_POSITRON_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

interface MapViewProps {
  center?: [number, number];
  readOnly?: boolean;
}

// Phase 2: minimalist base map. <RouteLayer /> is mounted on top once the route has been calculated.
export function MapView({ center = [-73.9857, 40.7484], readOnly = false }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: CARTO_POSITRON_STYLE,
      center,
      zoom: 12,
      interactive: !readOnly,
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [center, readOnly]);

  return <div ref={containerRef} className="h-full w-full" />;
}
