"use client";

import { use, useState } from "react";
import { createTrip } from "@/app/trips/actions";
import { PlaceSearchInput } from "@/components/trip/PlaceSearchInput";
import { FormRow } from "@/components/ui/FormRow";
import { ListSection } from "@/components/ui/List";
import { PageHeader } from "@/components/ui/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { LocationIcon } from "@/components/ui/icons";
import { useGeolocation } from "@/hooks/useGeolocation";

// Times Square — fallback origin if the user picks neither a search result nor their GPS location.
const DEFAULT_ORIGIN = { label: "Times Square, New York", lat: 40.758, lng: -73.9855 };

export default function NewTripPage(props: { searchParams: Promise<{ error?: string }> }) {
  // Next 16 hands client pages their search params as a Promise; use() unwraps it.
  const searchParams = use(props.searchParams);
  const [origin, setOrigin] = useState<{ label: string; lat: number; lng: number } | null>(null);
  const geolocation = useGeolocation();

  const resolvedOrigin = origin
    ? origin
    : geolocation.position
      ? { label: "Current location", ...geolocation.position }
      : DEFAULT_ORIGIN;

  return (
    <main className="flex min-h-dvh flex-col gap-6 pb-10">
      <PageHeader title="New Trip" backHref="/trips" backLabel="Trips" />

      <form action={createTrip} className="flex flex-col gap-6 px-4">
        {searchParams.error && (
          <p className="tinted-error rounded-2xl px-4 py-3 text-[0.9375rem]">{searchParams.error}</p>
        )}

        <ListSection>
          <FormRow label="Name" htmlFor="name">
            <input
              id="name"
              name="name"
              required
              placeholder="Weekend in NYC"
              className="flex-1 bg-transparent text-right text-[1.0625rem] outline-none placeholder:text-[var(--color-label-tertiary)]"
            />
          </FormRow>
          <FormRow label="Starts" htmlFor="start_date">
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              className="flex-1 bg-transparent text-right text-[1.0625rem] outline-none"
            />
          </FormRow>
          <FormRow label="Ends" htmlFor="end_date">
            <input
              id="end_date"
              name="end_date"
              type="date"
              required
              className="flex-1 bg-transparent text-right text-[1.0625rem] outline-none"
            />
          </FormRow>
        </ListSection>

        <div className="flex flex-col gap-2">
          <p className="px-4 text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--color-label-secondary)]">
            Starting point
          </p>
          <PlaceSearchInput
            placeholder="Hotel, address..."
            onSelect={setOrigin}
            focus={geolocation.position ?? undefined}
          />
          <button
            type="button"
            onClick={geolocation.request}
            className="flex min-h-[44px] w-fit items-center gap-2 px-1 text-[1.0625rem] text-[var(--color-accent)]"
          >
            <LocationIcon className="h-5 w-5" />
            {geolocation.loading ? "Locating..." : "Use current location"}
          </button>
          <p className="px-1 text-[0.8125rem] text-[var(--color-label-secondary)]">
            Starting from: {resolvedOrigin.label}
          </p>
        </div>

        <input type="hidden" name="origin_label" value={resolvedOrigin.label} />
        <input type="hidden" name="origin_lat" value={resolvedOrigin.lat} />
        <input type="hidden" name="origin_lng" value={resolvedOrigin.lng} />

        <SubmitButton pendingLabel="Creating...">Create Trip</SubmitButton>
      </form>
    </main>
  );
}
