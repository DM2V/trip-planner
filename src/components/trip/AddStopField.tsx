"use client";

import { useRouter } from "next/navigation";
import { addStop } from "@/app/trips/actions";
import { PlaceSearchInput } from "./PlaceSearchInput";

export function AddStopField({ tripId }: { tripId: string }) {
  const router = useRouter();

  return (
    <PlaceSearchInput
      placeholder="Add a place to visit..."
      onSelect={async (place) => {
        await addStop(tripId, place);
        router.refresh();
      }}
    />
  );
}
