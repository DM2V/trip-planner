import { JoinTripButton } from "@/components/trip/JoinTripButton";
import { SharedStopRow } from "@/components/trip/SharedStopRow";
import { MapView, type MapMarker } from "@/components/map/MapView";
import { ListSection } from "@/components/ui/List";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/utils";

function InvalidLink() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-[1.0625rem] text-[var(--color-label-secondary)]">
        This share link is invalid or has expired.
      </p>
    </main>
  );
}

// Public, token-gated read-only view — no login required to see the route. Uses the admin
// client since an anonymous or non-member visitor wouldn't pass the trips/stops RLS policies.
export default async function SharedTripPage({
  params,
  searchParams,
}: {
  params: { tripId: string };
  searchParams: { token?: string };
}) {
  if (!searchParams.token) return <InvalidLink />;

  const admin = createAdminClient();

  const { data: trip } = await admin
    .from("trips")
    .select("*")
    .eq("id", params.tripId)
    .eq("share_token", searchParams.token)
    .single();

  if (!trip) return <InvalidLink />;

  const { data: stops } = await admin
    .from("stops")
    .select("*")
    .eq("trip_id", params.tripId)
    .order("order_index", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const markers: MapMarker[] = [
    { lat: trip.origin_lat, lng: trip.origin_lng, label: trip.origin_label, variant: "origin" },
    ...(stops ?? []).map((stop, index) => ({
      lat: stop.lat,
      lng: stop.lng,
      label: stop.name,
      variant: "stop" as const,
      order: index + 1,
    })),
  ];

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-dvh flex-col">
      <div className="h-[42vh] w-full">
        <MapView markers={markers} routeGeometry={trip.optimized_route?.geometry ?? null} readOnly />
      </div>

      <header className="nav-material flex h-11 items-center px-4">
        <a href={user ? "/trips" : "/"} className="text-[1.0625rem] font-semibold text-[var(--color-accent)]">
          Trip Planner
        </a>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-4">
        <div>
          <p className="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--color-label-secondary)]">
            Shared trip
          </p>
          <h1 className="text-[1.75rem] font-bold tracking-tight">{trip.name}</h1>
          <p className="text-[0.9375rem] text-[var(--color-label-secondary)]">
            {trip.start_date} — {trip.end_date} · from {trip.origin_label}
          </p>
          {trip.optimized_route && (
            <p className="tinted-accent mt-2 inline-block rounded-full px-3 py-1 text-[0.8125rem] font-medium">
              {(trip.optimized_route.distanceMeters / 1000).toFixed(1)} km ·{" "}
              {formatDuration(trip.optimized_route.durationSeconds)} driving
            </p>
          )}
        </div>

        <ListSection>
          {(stops ?? []).map((stop, index) => (
            <SharedStopRow key={stop.id} stop={stop} position={index + 1} />
          ))}
        </ListSection>

        {user ? (
          <JoinTripButton tripId={trip.id} token={trip.share_token} />
        ) : (
          <p className="text-[0.9375rem] text-[var(--color-label-secondary)]">
            <a
              href={`/login?message=${encodeURIComponent("Log in to save this trip to your list.")}`}
              className="font-medium text-[var(--color-accent)]"
            >
              Log in
            </a>{" "}
            to save this trip to your list.
          </p>
        )}
      </div>
    </main>
  );
}
