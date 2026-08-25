import Link from "next/link";

// Phase 1: list of the authenticated user's trips, read from Supabase (`trips` where owner_id = user.id).
export default function TripsPage() {
  return (
    <main className="flex min-h-dvh flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My trips</h1>
        <Link
          href="/trips/new"
          className="rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-950"
        >
          + New trip
        </Link>
      </div>
      {/* TODO: <TripCard /> for each trip */}
    </main>
  );
}
