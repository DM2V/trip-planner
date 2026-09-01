"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
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
  // profile has no data, every consumer (map, summary, stop rows) should fall back to whichever
  // profile actually does, rather than each re-deriving that fallback — and rather than resetting
  // the underlying selection, so it picks back up if that profile becomes available again later.
  const effectiveProfile = routes?.[profile] ? profile : routes?.["driving-car"] ? "driving-car" : profile;

  return (
    <RouteProfileContext.Provider value={{ profile: effectiveProfile, setProfile, routes }}>
      {children}
    </RouteProfileContext.Provider>
  );
}

export function useRouteProfile() {
  const context = useContext(RouteProfileContext);
  if (!context) throw new Error("useRouteProfile must be used within a RouteProfileProvider");
  return context;
}
