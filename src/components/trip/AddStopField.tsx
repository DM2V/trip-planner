"use client";

import { useRouter } from "next/navigation";
import { addStop } from "@/app/trips/actions";
import { PlaceSearchInput } from "./PlaceSearchInput";
import type { LatLng } from "@/types";

export function AddStopField({ tripId, origin }: { tripId: string; origin: LatLng }) {
  const router = useRouter();

  return (
    <PlaceSearchInput
      placeholder="Add a place to visit..."
      focus={origin}
      onSelect={async (place) => {
        await addStop(tripId, place);
        router.refresh();
      }}
    />
  );
}
