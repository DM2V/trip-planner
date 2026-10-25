import { copySharedTripNow, requestTripCopyOnSignup } from "@/app/trips/actions";
import { Button } from "@/components/ui/Button";
import { JoinTripButton } from "@/components/trip/JoinTripButton";
import { ReturnToOriginRow } from "@/components/trip/ReturnToOriginRow";
import { RouteLegConnector } from "@/components/trip/RouteLegConnector";
import { RouteMap } from "@/components/trip/RouteMap";
import { RouteProfileProvider } from "@/components/trip/RouteProfileContext";
import { RouteSummary } from "@/components/trip/RouteSummary";
import { SharedStopRow } from "@/components/trip/SharedStopRow";
import { SharedTripTour } from "@/components/trip/SharedTripTour";
import { TripInfoRows } from "@/components/trip/TripInfoRows";
import { type MapMarker } from "@/components/map/MapView";
import { ListSection } from "@/components/ui/List";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { OptimizedRoutes } from "@/lib/ors/optimization";

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
export default async function SharedTripPage(props: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  if (!searchParams.token) return <InvalidLink />;

  const admin = createAdminClient();
  const supabase = await createClient();

  // The stops fetch only depends on params.tripId (not on the trip row), and the auth check is
  // unrelated to either — so all three run concurrently instead of one after another. If the
  // token doesn't match (trip is null), the stops/user results are simply discarded below.
  const [
    { data: trip },
    { data: stops },
    {
      data: { user },
    },
  ] = await Promise.all([
    admin
      .from("trips")
      .select("*")
      .eq("id", params.tripId)
      .eq("share_token", searchParams.token)
      .single(),
    admin
      .from("stops")
      .select("*")
      .eq("trip_id", params.tripId)
      .order("order_index", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  if (!trip) return <InvalidLink />;

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

  const routes: OptimizedRoutes | null = trip.optimized_route;

  return (
    <RouteProfileProvider routes={routes}>
      <main className="flex min-h-dvh flex-col">
        <div data-tour="map" className="h-[42vh] w-full">
          <RouteMap markers={markers} readOnly />
        </div>

        <header className="nav-material flex h-11 items-center px-4">
          <a href={user ? "/trips" : "/"} className="text-[1.0625rem] font-semibold text-[var(--color-accent)]">
            Trip Planner
          </a>
        </header>

        <div className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-4">
          <div data-tour="summary">
            <p className="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--color-label-secondary)]">
              Shared trip
            </p>
            <h1 className="text-[1.75rem] font-bold tracking-tight">{trip.name}</h1>
            <TripInfoRows startDate={trip.start_date} endDate={trip.end_date} originLabel={trip.origin_label} />
            <RouteSummary startDate={trip.start_date} endDate={trip.end_date} stopCount={(stops ?? []).length} />
          </div>

          <div data-tour="stops">
            <ListSection>
              {(stops ?? []).flatMap((stop, index) => [
                <RouteLegConnector key={`${stop.id}-leg`} position={index + 1} />,
                <SharedStopRow key={stop.id} stop={stop} position={index + 1} />,
              ])}
              <RouteLegConnector key="return-leg" position={(stops ?? []).length + 1} />
              <ReturnToOriginRow
                originLabel={trip.origin_label}
                originLat={trip.origin_lat}
                originLng={trip.origin_lng}
                stops={stops ?? []}
              />
            </ListSection>
          </div>

          {user ? (
            <div data-tour="save" className="flex flex-col gap-3">
              <JoinTripButton tripId={trip.id} token={trip.share_token} />
              <form action={copySharedTripNow.bind(null, trip.id, trip.share_token)}>
                <button
                  type="submit"
                  className="w-full text-center text-[0.9375rem] font-medium text-[var(--color-accent)]"
                >
                  Or make your own editable copy
                </button>
              </form>
            </div>
          ) : (
            <div data-tour="save" className="flex flex-col gap-3">
              <form action={requestTripCopyOnSignup.bind(null, trip.id, trip.share_token)}>
                <Button type="submit" className="w-full">
                  Edit Your Own Copy
                </Button>
              </form>
              <p className="text-center text-[0.8125rem] text-[var(--color-label-secondary)]">
                Creates your own copy of this trip to edit freely — the original stays unchanged.
              </p>
              <p className="text-center text-[0.9375rem] text-[var(--color-label-secondary)]">
                Already have an account?{" "}
                <a
                  href={`/login?message=${encodeURIComponent("Log in to save this trip to your list.")}`}
                  className="font-medium text-[var(--color-accent)]"
                >
                  Log in
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Not for the owner checking their own share link — they wrote the trip. */}
        {user?.id !== trip.owner_id && <SharedTripTour hasRoute={Boolean(routes)} />}
      </main>
    </RouteProfileProvider>
  );
}
