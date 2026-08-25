// Phase 4: read-only view for guests opening the invite link (?token=...).
export default function SharedTripPage({
  params,
  searchParams,
}: {
  params: { tripId: string };
  searchParams: { token?: string };
}) {
  return (
    <main className="flex min-h-dvh flex-col">
      {/* TODO: validate searchParams.token against trip_members, render <MapView readOnly /> */}
    </main>
  );
}
