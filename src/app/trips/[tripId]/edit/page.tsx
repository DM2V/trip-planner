import { EditTripForm } from "@/components/trip/EditTripForm";
import { ResetShareLinkButton } from "@/components/trip/ResetShareLinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { requireTripOwner } from "@/lib/tripAccess";

export default async function EditTripPage(props: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tripRow } = await supabase
    .from("trips")
    .select("*")
    .eq("id", params.tripId)
    .single();

  // Only the owner has anything to edit here.
  const trip = requireTripOwner(user, tripRow);

  return (
    <main className="flex min-h-dvh flex-col gap-6 pb-10">
      <PageHeader title="Edit Trip" backHref={`/trips/${trip.id}`} backLabel="Trip" />
      <EditTripForm
        tripId={trip.id}
        name={trip.name}
        startDate={trip.start_date}
        endDate={trip.end_date}
        originLabel={trip.origin_label}
        originLat={trip.origin_lat}
        originLng={trip.origin_lng}
        error={searchParams.error}
      />
      <ResetShareLinkButton tripId={trip.id} />
    </main>
  );
}
