"use client";

import { useState, useTransition } from "react";
import { joinSharedTrip } from "@/app/trips/actions";
import { Button } from "@/components/ui/Button";

export function JoinTripButton({ tripId, token }: { tripId: string; token: string }) {
  const [isPending, startTransition] = useTransition();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (joined) {
    return <p className="text-[0.9375rem] text-(--color-success)">Saved to your trips.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        className="w-full"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await joinSharedTrip(tripId, token);
              setJoined(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not save this trip");
            }
          });
        }}
      >
        {isPending ? "Saving..." : "Save to My Trips"}
      </Button>
      {error && <p className="text-[0.8125rem] text-(--color-destructive)">{error}</p>}
    </div>
  );
}
