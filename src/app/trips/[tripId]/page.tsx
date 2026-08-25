// Phase 2-3: main trip view — map + stop list + "Calculate optimal route" button.
export default function TripDetailPage({
  params,
}: {
  params: { tripId: string };
}) {
  return (
    <main className="flex min-h-dvh flex-col">
      {/* TODO: <MapView tripId={params.tripId} /> + <StopList /> + share button */}
    </main>
  );
}
