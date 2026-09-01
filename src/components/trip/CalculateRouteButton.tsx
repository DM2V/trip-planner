"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { calculateRoute } from "@/app/trips/actions";
import { Button } from "@/components/ui/Button";

// Full-screen, not just the button's own "Calculating..." label: calculating now makes two
// sequential API calls (driving optimization, then walking directions for that same order), so
// it can take a couple of seconds — a full-screen overlay makes it obvious the tap registered and
// something's happening, instead of a small in-button change easy to miss below the fold.
function CalculatingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="status" aria-live="polite">
      <div className="sheet-material flex flex-col items-center gap-3 rounded-2xl px-8 py-6 shadow-lg">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-current border-t-transparent text-[var(--color-accent)]" />
        <p className="text-[0.9375rem] font-medium">Calculating route...</p>
      </div>
    </div>
  );
}

export function CalculateRouteButton({
  tripId,
  disabled = false,
}: {
  tripId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {isPending && <CalculatingOverlay />}
      <Button
        type="button"
        className="w-full"
        disabled={disabled || isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await calculateRoute(tripId);
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
