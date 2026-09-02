"use client";

import { ASSUMED_TOURING_HOURS_PER_DAY, formatDistance, formatDuration, recommendStopTime } from "@/lib/utils";
import type { TravelProfile } from "@/lib/ors/optimization";
import { useRouteProfile } from "./RouteProfileContext";

const OPTIONS: { profile: TravelProfile; label: string }[] = [
  { profile: "driving-car", label: "Driving" },
  { profile: "foot-walking", label: "Walking" },
];

interface RouteSummaryProps {
  startDate: string;
  endDate: string;
  stopCount: number;
}

// Both profiles are usually calculated together (see calculateRoute), so viewing one vs. the
// other is normally just a toggle — no extra click before calculating, unlike an earlier version
// of this that made the user pick a profile up front. Walking can fail to calculate at all (e.g.
// an origin far enough out — an airport, say — that no walking route exists), in which case only
// driving is available: the toggle collapses to a plain label instead of offering a dead option
// (RouteProfileContext already falls back `profile` to driving-car in that case).
export function RouteSummary({ startDate, endDate, stopCount }: RouteSummaryProps) {
  const { routes, profile, setProfile } = useRouteProfile();
  const availableOptions = OPTIONS.filter((option) => routes?.[option.profile]);
  if (availableOptions.length === 0) return null;

  const walkingUnavailable = Boolean(routes?.["driving-car"]) && !routes?.["foot-walking"];
  const route = routes?.[profile] ?? null;
  const travelDurationSeconds = route?.durationSeconds ?? 0;
  const recommendation = route ? recommendStopTime(startDate, endDate, travelDurationSeconds, stopCount) : null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {availableOptions.length > 1 ? (
        <div className="flex gap-1 rounded-full bg-[var(--color-fill-secondary)] p-0.5" role="tablist">
          {availableOptions.map((option) => (
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
      ) : (
        <span className="rounded-full bg-[var(--color-fill-secondary)] px-2.5 py-1 text-[0.75rem] font-medium text-[var(--color-label-secondary)]">
          {availableOptions[0].label}
        </span>
      )}

      {route && (
        <span className="tinted-accent inline-block rounded-full px-3 py-1 text-[0.8125rem] font-medium">
          {formatDistance(route.distanceMeters)} · {formatDuration(route.durationSeconds)}
        </span>
      )}

      {route && (
        <p className="w-full text-[0.75rem] leading-snug text-[var(--color-label-secondary)]">
          Stops are ordered to minimize total {profile === "foot-walking" ? "walking" : "driving"} distance between
          them — calculated from real routes, not a straight line — so you spend less time getting around and more
          time exploring.
          {walkingUnavailable && (
            <> No walking route could be found for this trip (the starting point may be too far to walk from).</>
          )}
        </p>
      )}

      {recommendation && (
        <p
          className={`w-full rounded-xl px-3 py-2 text-[0.8125rem] leading-snug ${
            recommendation.feasible ? "bg-[var(--color-fill-secondary)] text-[var(--color-label-secondary)]" : "tinted-error"
          }`}
        >
          {recommendation.feasible ? (
            <>
              Assuming ~{ASSUMED_TOURING_HOURS_PER_DAY}h of sightseeing a day, your {recommendation.days}-day trip
              leaves about{" "}
              <span className="font-medium text-[var(--color-label)]">
                {formatDuration(recommendation.minutesPerStop * 60)}
              </span>{" "}
              per stop after travel time.
            </>
          ) : (
            <>
              Just getting between stops takes {formatDuration(travelDurationSeconds)} — more than the ~
              {recommendation.days * ASSUMED_TOURING_HOURS_PER_DAY}h you have across {recommendation.days} day
              {recommendation.days === 1 ? "" : "s"}, assuming ~{ASSUMED_TOURING_HOURS_PER_DAY}h of sightseeing a
              day. Consider adding more days or removing stops.
            </>
          )}
        </p>
      )}
    </div>
  );
}
