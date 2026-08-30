import { redirect } from "next/navigation";
import { AddStopField } from "@/components/trip/AddStopField";
import { CalculateRouteButton } from "@/components/trip/CalculateRouteButton";
import { ShareTripButton } from "@/components/trip/ShareTripButton";
import { StopList } from "@/components/trip/StopList";
import { MapView, type MapMarker } from "@/components/map/MapView";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";

export default async function TripDetailPage({
  params,
}: {
  params: { tripId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", params.tripId)
    .single();

  if (!trip) redirect("/trips");

  // This page has owner-only actions (add/remove stops, recalculate route). A viewer who saved
  // this trip should land on the read-only share view instead.
  if (trip.owner_id !== user.id) {
    redirect(`/trips/${trip.id}/share?token=${trip.share_token}`);
  }

  const { data: stops } = await supabase
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

  const route = trip.optimized_route;

  return (
    <main className="flex min-h-dvh flex-col">
      <div className="h-[42vh] w-full">
        <MapView markers={markers} routeGeometry={route?.geometry ?? null} />
      </div>

      <PageHeader
        title={trip.name}
        backHref="/trips"
        backLabel="Trips"
        trailing={<ShareTripButton tripId={trip.id} shareToken={trip.share_token} />}
      />

      <div className="flex flex-1 flex-col gap-6 px-4 pb-10">
        <div>
          <p className="text-[0.9375rem] text-[var(--color-label-secondary)]">
            {trip.start_date} — {trip.end_date} · from {trip.origin_label}
          </p>
          {route && (
            <p className="tinted-accent mt-2 inline-block rounded-full px-3 py-1 text-[0.8125rem] font-medium">
              {(route.distanceMeters / 1000).toFixed(1)} km ·{" "}
              {Math.round(route.durationSeconds / 60)} min walking
            </p>
          )}
        </div>

        <AddStopField tripId={trip.id} />

        <StopList tripId={trip.id} stops={stops ?? []} />

        <CalculateRouteButton tripId={trip.id} disabled={!stops || stops.length === 0} />
      </div>
    </main>
  );
}
