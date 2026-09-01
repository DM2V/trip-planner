"use client";

import { useState } from "react";
import { updateTrip } from "@/app/trips/actions";
import { PlaceSearchInput } from "@/components/trip/PlaceSearchInput";
import { FormRow } from "@/components/ui/FormRow";
import { ListSection } from "@/components/ui/List";
import { SubmitButton } from "@/components/ui/SubmitButton";

interface EditTripFormProps {
  tripId: string;
  name: string;
  originLabel: string;
  originLat: number;
  originLng: number;
  error?: string;
}

// Same field shapes as the "New Trip" form (trips/new/page.tsx), pre-filled — a search-and-select
// origin field can't show "the current value" the way a text input can, so the resolved label is
// echoed back below the search box instead, same as on creation.
export function EditTripForm({ tripId, name, originLabel, originLat, originLng, error }: EditTripFormProps) {
  const [origin, setOrigin] = useState({ label: originLabel, lat: originLat, lng: originLng });
  const updateTripWithId = updateTrip.bind(null, tripId);

  return (
    <form action={updateTripWithId} className="flex flex-col gap-6 px-4">
      {error && <p className="tinted-error rounded-2xl px-4 py-3 text-[0.9375rem]">{error}</p>}

      <ListSection>
        <FormRow label="Name" htmlFor="name">
          <input
            id="name"
            name="name"
            defaultValue={name}
            required
            className="flex-1 bg-transparent text-right text-[1.0625rem] outline-none placeholder:text-[var(--color-label-tertiary)]"
          />
        </FormRow>
      </ListSection>

      <div className="flex flex-col gap-2">
        <p className="px-4 text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--color-label-secondary)]">
          Starting point
        </p>
        <PlaceSearchInput placeholder="Hotel, address..." onSelect={setOrigin} />
        <p className="px-1 text-[0.8125rem] text-[var(--color-label-secondary)]">Starting from: {origin.label}</p>
      </div>

      <input type="hidden" name="origin_label" value={origin.label} />
      <input type="hidden" name="origin_lat" value={origin.lat} />
      <input type="hidden" name="origin_lng" value={origin.lng} />

      <SubmitButton pendingLabel="Saving...">Save Changes</SubmitButton>
    </form>
  );
}
