import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { TripCard } from "@/components/trip/TripCard";
import { ListSection } from "@/components/ui/List";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlusIcon } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/server";

export default async function TripsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="flex min-h-dvh flex-col gap-6 pb-10">
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

        <div className="flex flex-col gap-2">
          <p className="px-1 text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--color-label-secondary)]">
            Appearance
          </p>
          <ThemeToggle />
        </div>

        <form action={logout}>
          <button type="submit" className="text-[0.9375rem] text-[var(--color-destructive)]">
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}
