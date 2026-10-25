"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { type MapMarker } from "@/components/map/MapView";
import { useRouteProfile } from "./RouteProfileContext";

const MapSkeleton = () => <div className="h-full w-full animate-pulse bg-(--color-fill-secondary)" />;

// maplibre-gl is the bulk of this route's client bundle. Loading it as its own chunk (instead of
// bundled with the rest of the page's client JS) lets the rest of the page hydrate/become
// interactive without waiting on it. `ssr: false` means the map is never server-rendered anyway
// (mounting it requires a DOM container via useEffect), so the only visible change is that the
// empty placeholder div is swapped for the same pulsing skeleton already used for this exact
// screen area in loading.tsx, instead of a blank box, while the chunk loads.
const MapView = dynamic(() => import("@/components/map/MapView").then((mod) => mod.MapView), {
  ssr: false,
  loading: MapSkeleton,
});

// Its own chunk still gets requested the moment this component mounts, i.e. during hydration,
// where ~209KB of download and its parse/execute compete with painting the page's actual content.
// Measured on a shared trip (iPhone, 1.6Mbps, 4x CPU throttle): the largest contentful paint was a
// paragraph of text, not the map, arriving at ~3.1s behind ~963ms of blocked main thread.
//
// Waiting for the browser to go idle moves that work off the critical path without changing what
// renders. requestIdleCallback only landed in Safari 17 and this is an iOS-first app, so the
// timeout fallback is the path most of these users actually take.
function useIdleAfterPaint(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      // The timeout caps how long a busy main thread can defer the map.
      const handle = window.requestIdleCallback(() => setReady(true), { timeout: 2000 });
      return () => window.cancelIdleCallback?.(handle);
    }
    const handle = window.setTimeout(() => setReady(true), 200);
    return () => window.clearTimeout(handle);
  }, []);

  return ready;
}

export function RouteMap({ markers, readOnly = false }: { markers: MapMarker[]; readOnly?: boolean }) {
  const { routes, profile } = useRouteProfile();
  const route = routes?.[profile];
  const ready = useIdleAfterPaint();

  if (!ready) return <MapSkeleton />;

  return (
    <MapView markers={markers} routeGeometry={route?.geometry ?? null} legs={route?.legs ?? null} readOnly={readOnly} />
  );
}
