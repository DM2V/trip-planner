// Phase 1: form to create a trip — name, dates, starting point (GPS or address).
export default function NewTripPage() {
  return (
    <main className="flex min-h-dvh flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">New trip</h1>
      {/* TODO: <AddStopForm /> reused for the starting point, then insert into `trips` */}
    </main>
  );
}
