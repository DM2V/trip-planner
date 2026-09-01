import { redirect } from "next/navigation";
import { EditTripForm } from "@/components/trip/EditTripForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";

export default async function EditTripPage({
  params,
  searchParams,
}: {
  params: { tripId: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: trip } = await supabase.from("trips").select("*").eq("id", params.tripId).single();
  if (!trip) redirect("/trips");

  // Only the owner has anything to edit here — a viewer landing on this URL gets sent back to
  // their read-only view instead, same redirect the trip detail page itself uses.
  if (trip.owner_id !== user.id) {
    redirect(`/trips/${trip.id}/share?token=${trip.share_token}`);
  }

  return (
    <main className="flex min-h-dvh flex-col gap-6 pb-10">
      <PageHeader title="Edit Trip" backHref={`/trips/${trip.id}`} backLabel="Trip" />
      <EditTripForm
        tripId={trip.id}
        name={trip.name}
        originLabel={trip.origin_label}
        originLat={trip.origin_lat}
        originLng={trip.origin_lng}
        error={searchParams.error}
      />
    </main>
  );
}
