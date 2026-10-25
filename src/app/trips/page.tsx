import Link from "next/link";
import { redirect } from "next/navigation";
import { TabBar } from "@/components/TabBar";
import { TripCard } from "@/components/trip/TripCard";
import { ListSection } from "@/components/ui/List";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlusIcon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/server";

export default async function TripsPage() {
  const supabase = await createClient();

  // The trips query doesn't reference the resolved user object — RLS scopes it to the current
  // session automatically — so it's fired alongside the auth check instead of waiting on it. If
  // the user turns out to be logged out, the trips result (empty under RLS anyway) is discarded.
  const [
    {
      data: { user },
    },
    { data: trips },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("trips").select("*").order("created_at", { ascending: false }),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-dvh flex-col gap-6 pb-24">
      <PageHeader
        title="Trips"
        large
        trailing={
          <Link
            href="/trips/new"
            className="chrome-pill flex min-h-[44px] shrink-0 items-center gap-1 rounded-full py-2 pl-3 pr-4 text-[1.0625rem] text-[var(--color-accent)]"
          >
            <PlusIcon className="h-5 w-5" />
            New Trip
          </Link>
        }
      />

      <div className="flex flex-col gap-4 px-4">
        {trips && trips.length > 0 ? (
          <ListSection>
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </ListSection>
        ) : (
          <p className="px-1 text-[0.9375rem] text-[var(--color-label-secondary)]">
            No trips yet — tap + to create your first one.
          </p>
        )}
      </div>

      <TabBar />
    </main>
  );
}
