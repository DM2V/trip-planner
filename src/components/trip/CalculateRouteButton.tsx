"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { calculateRoute } from "@/app/trips/actions";
import { Button } from "@/components/ui/Button";

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
