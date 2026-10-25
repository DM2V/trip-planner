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
  startDate: string;
  endDate: string;
  originLabel: string;
  originLat: number;
  originLng: number;
  error?: string;
}

// Same field shapes as the "New Trip" form (trips/new/page.tsx), pre-filled — a search-and-select
// origin field can't show "the current value" the way a text input can, so the resolved label is
// echoed back below the search box instead, same as on creation.
export function EditTripForm({
  tripId,
  name,
  startDate,
  endDate,
  originLabel,
  originLat,
  originLng,
  error,
}: EditTripFormProps) {
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
            className="flex-1 bg-transparent text-right text-[1.0625rem] outline-hidden placeholder:text-(--color-label-tertiary)"
          />
        </FormRow>
        <FormRow label="Starts" htmlFor="start_date">
          <input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={startDate}
            required
            className="flex-1 bg-transparent text-right text-[1.0625rem] outline-hidden [&::-webkit-datetime-edit]:justify-end"
          />
        </FormRow>
        <FormRow label="Ends" htmlFor="end_date">
          <input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={endDate}
            required
            className="flex-1 bg-transparent text-right text-[1.0625rem] outline-hidden [&::-webkit-datetime-edit]:justify-end"
          />
        </FormRow>
      </ListSection>

      <div className="flex flex-col gap-2">
        <p className="px-4 text-[0.8125rem] font-medium uppercase tracking-wide text-(--color-label-secondary)">
          Starting point
        </p>
        {/* Biased toward the origin being replaced — changing a starting point almost always means
            picking a different place in the same city, and without this an ambiguous name ("Central
            Park", "Chinatown") ranks a same-named place in another state first. */}
        <PlaceSearchInput placeholder="Hotel, address..." onSelect={setOrigin} focus={origin} />
        <p className="px-1 text-[0.8125rem] text-(--color-label-secondary)">Starting from: {origin.label}</p>
      </div>

      <input type="hidden" name="origin_label" value={origin.label} />
      <input type="hidden" name="origin_lat" value={origin.lat} />
      <input type="hidden" name="origin_lng" value={origin.lng} />

      <SubmitButton pendingLabel="Saving...">Save Changes</SubmitButton>
    </form>
  );
}
