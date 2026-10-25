"use client";

import { CarIcon, WalkIcon } from "@/components/ui/icons";
import { formatDistance, formatDuration } from "@/lib/utils";
import { useRouteProfile } from "./RouteProfileContext";

// A thin row *between* two stops, not attached to either one, so it reads unambiguously as "the
// trip from the previous stop to this one" — showing the same number as a subtitle under the
// destination's own name (an earlier version of this) was easy to misread as a property of that
// stop itself (how long you'd spend there, say) rather than how you'd get there.
export function RouteLegConnector({ position }: { position: number }) {
  const { routes, profile } = useRouteProfile();
  const leg = routes?.[profile]?.legs?.[position - 1];
  if (!leg) return null;

  const Icon = profile === "foot-walking" ? WalkIcon : CarIcon;

  return (
    <div className="flex min-h-[32px] items-center gap-2 px-4 py-1 text-[0.75rem] text-(--color-label-secondary)">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>
        {formatDistance(leg.distanceMeters)} · {formatDuration(leg.durationSeconds)}
      </span>
    </div>
  );
}
