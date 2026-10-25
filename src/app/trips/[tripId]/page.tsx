import Link from "next/link";
import { AddStopField } from "@/components/trip/AddStopField";
import { CalculateRouteButton } from "@/components/trip/CalculateRouteButton";
import { RouteMap } from "@/components/trip/RouteMap";
import { RouteProfileProvider } from "@/components/trip/RouteProfileContext";
import { RouteSummary } from "@/components/trip/RouteSummary";
import { ShareTripButton } from "@/components/trip/ShareTripButton";
import { StopList } from "@/components/trip/StopList";
import { TripInfoRows } from "@/components/trip/TripInfoRows";
import { type MapMarker } from "@/components/map/MapView";
import { ChevronLeftIcon, EditIcon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/server";
import { requireTripOwner } from "@/lib/tripAccess";
import type { OptimizedRoutes } from "@/lib/ors/optimization";

export default async function TripDetailPage(props: {
  params: Promise<{ tripId: string }>;
}) {
  const params = await props.params;
  const supabase = await createClient();

  // The stops query only depends on params.tripId (already known from the URL), not on the trip
  // row or the resolved user, so it's fired concurrently with the auth check and trip fetch
  // instead of waiting on them — same three round trips, just no longer serialized. Any of the
  // redirects below simply discard whichever of these results goes unused.
  const [
    {
      data: { user },
    },
    { data: tripRow },
    { data: stops },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("trips").select("*").eq("id", params.tripId).single(),
    supabase
      .from("stops")
      .select("*")
      .eq("trip_id", params.tripId)
      .order("order_index", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
  ]);

  // Owner-only: this page has actions a viewer can't take (add/remove stops, recalculate).
  const trip = requireTripOwner(user, tripRow);

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
        <div className="relative h-[42vh] w-full">
          <RouteMap markers={markers} />

          <div className="absolute inset-x-0 top-0 z-10 flex items-center px-3 pt-3">
            <Link
              href="/trips"
              className="map-chrome flex min-h-[44px] items-center gap-0.5 rounded-full py-2 pl-3 pr-4 text-[1.0625rem] text-[#007aff]"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              Trips
            </Link>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-4">
          <div className="flex flex-col gap-1">
            {/* Only the title itself shares this row with the edit/share buttons — the buttons'
                own column reserves that width for the row's full height, so anything else placed
                in the same row (dates, origin, the route summary's text) would be squeezed into a
                narrower column than the screen actually has room for below the buttons. Everything
                that isn't the title goes on its own full-width row instead. */}
            <div className="flex items-start justify-between gap-2">
              <h1 className="min-w-0 flex-1 text-[1.75rem] font-bold tracking-tight">{trip.name}</h1>
              <div className="flex shrink-0 items-center">
                <Link
                  href={`/trips/${trip.id}/edit`}
                  aria-label="Edit trip"
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--color-accent)] active:opacity-50"
                >
                  <EditIcon className="h-5 w-5" />
                </Link>
                <ShareTripButton tripId={trip.id} tripName={trip.name} shareToken={trip.share_token} />
              </div>
            </div>
            <TripInfoRows startDate={trip.start_date} endDate={trip.end_date} originLabel={trip.origin_label} />
            <RouteSummary startDate={trip.start_date} endDate={trip.end_date} stopCount={(stops ?? []).length} />
          </div>

          <AddStopField tripId={trip.id} origin={{ lat: trip.origin_lat, lng: trip.origin_lng }} />

          <StopList
            tripId={trip.id}
            stops={stops ?? []}
            originLabel={trip.origin_label}
            originLat={trip.origin_lat}
            originLng={trip.origin_lng}
          />

          <CalculateRouteButton tripId={trip.id} disabled={!stops || stops.length === 0} />

          {/* Sharing is the only way this app reaches anyone new, and the icon in the title row is
              easy to miss. Once a route exists the trip is actually worth sending, so that's where
              the invitation belongs. */}
          {routes && (
            <ShareTripButton
              tripId={trip.id}
              tripName={trip.name}
              shareToken={trip.share_token}
              variant="full"
            />
          )}
        </div>
      </main>
    </RouteProfileProvider>
  );
}
