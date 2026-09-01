"use client";

import { formatDuration } from "@/lib/utils";
import type { TravelProfile } from "@/lib/ors/optimization";
import { useRouteProfile } from "./RouteProfileContext";

const OPTIONS: { profile: TravelProfile; label: string }[] = [
  { profile: "driving-car", label: "Driving" },
  { profile: "foot-walking", label: "Walking" },
];

// Both profiles are always calculated together (see calculateRoute), so viewing one vs. the
// other is just a toggle — no extra click before calculating, unlike an earlier version of this
// that made the user pick a profile up front.
export function RouteSummary() {
  const { routes, profile, setProfile } = useRouteProfile();
  const hasAnyRoute = Boolean(routes?.["driving-car"] || routes?.["foot-walking"]);
  if (!hasAnyRoute) return null;

  const route = routes?.[profile] ?? null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <div className="flex gap-1 rounded-full bg-[var(--color-fill-secondary)] p-0.5" role="tablist">
        {OPTIONS.map((option) => (
          <button
            key={option.profile}
            type="button"
            role="tab"
            aria-selected={profile === option.profile}
            onClick={() => setProfile(option.profile)}
            className={`rounded-full px-2.5 py-1 text-[0.75rem] font-medium transition-colors ${
              profile === option.profile
                ? "bg-[var(--color-bg-elevated)] text-[var(--color-label)] shadow-sm"
                : "text-[var(--color-label-secondary)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {route && (
        <span className="tinted-accent inline-block rounded-full px-3 py-1 text-[0.8125rem] font-medium">
          {(route.distanceMeters / 1000).toFixed(1)} km · {formatDuration(route.durationSeconds)}
        </span>
      )}
    </div>
  );
}
