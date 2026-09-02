"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { OptimizedRoutes, TravelProfile } from "@/lib/ors/optimization";

interface RouteProfileContextValue {
  profile: TravelProfile;
  setProfile: (profile: TravelProfile) => void;
  routes: OptimizedRoutes | null;
}

const RouteProfileContext = createContext<RouteProfileContextValue | null>(null);

// Shares which travel profile is being viewed between the map (shows that profile's route line)
// and the distance/duration toggle — they sit in different parts of the page layout, with server
// component markup in between, so plain prop-drilling can't connect them without restructuring
// the whole page around a single client wrapper.
export function RouteProfileProvider({
  routes,
  children,
}: {
  routes: OptimizedRoutes | null;
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<TravelProfile>("driving-car");

  // Walking can fail to calculate at all (e.g. an origin far enough out — an airport, say — that
  // no walking route exists) while driving still succeeds — see calculateRoute. If the selected
  // profile has no data, every consumer (map, summary, stop rows) should fall back to driving
  // rather than each re-deriving that fallback — and the underlying selection is left alone
  // rather than reset, so it picks back up if that profile becomes available again later.
  const effectiveProfile: TravelProfile =
    routes?.[profile] || !routes?.["driving-car"] ? profile : "driving-car";

  // Every consumer (map, summary, stop rows, connectors) reads this context, so a value object
  // rebuilt on every render would re-render all of them on any unrelated parent re-render, not
  // just an actual profile/routes change.
  const value = useMemo(
    () => ({ profile: effectiveProfile, setProfile, routes }),
    [effectiveProfile, setProfile, routes],
  );

  return <RouteProfileContext.Provider value={value}>{children}</RouteProfileContext.Provider>;
}

export function useRouteProfile() {
  const context = useContext(RouteProfileContext);
  if (!context) throw new Error("useRouteProfile must be used within a RouteProfileProvider");
  return context;
}
