"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { calculateRoute } from "@/app/trips/actions";
import { Button } from "@/components/ui/Button";
import type { TravelProfile } from "@/lib/ors/optimization";

const OPTIONS: { profile: TravelProfile; label: string }[] = [
  { profile: "driving-car", label: "Driving" },
  { profile: "foot-walking", label: "Walking" },
];

export function CalculateRouteButton({
  tripId,
  disabled = false,
}: {
  tripId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<TravelProfile>("driving-car");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 rounded-xl bg-[var(--color-fill-secondary)] p-1" role="tablist">
        {OPTIONS.map((option) => (
          <button
            key={option.profile}
            type="button"
            role="tab"
            aria-selected={profile === option.profile}
            disabled={isPending}
            onClick={() => setProfile(option.profile)}
            className={`flex-1 rounded-lg py-1.5 text-[0.9375rem] font-medium transition-colors disabled:opacity-50 ${
              profile === option.profile
                ? "bg-[var(--color-bg-elevated)] text-[var(--color-label)] shadow-sm"
                : "text-[var(--color-label-secondary)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={disabled || isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await calculateRoute(tripId, profile);
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not calculate the route");
            }
          });
        }}
      >
        {isPending ? "Calculating..." : "Calculate Optimal Route"}
      </Button>
      {error && <p className="text-[0.8125rem] text-[var(--color-destructive)]">{error}</p>}
    </div>
  );
}
