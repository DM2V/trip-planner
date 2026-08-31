import { PageHeader } from "@/components/ui/PageHeader";
import { ListSection } from "@/components/ui/List";
import { PlusIcon } from "@/components/ui/icons";

// Next.js renders this automatically while the trips list is being fetched — same shape as the
// real list, so nothing jumps once the data lands.
export default function TripsLoading() {
  return (
    <main className="flex min-h-dvh flex-col gap-6 pb-10">
      <PageHeader
        title="Trips"
        large
        trailing={
          <span className="chrome-pill flex min-h-[44px] shrink-0 items-center gap-1 rounded-full py-2 pl-3 pr-4 text-[1.0625rem] text-[var(--color-accent)]">
            <PlusIcon className="h-5 w-5" />
            New Trip
          </span>
        }
      />

      <div className="flex flex-col gap-4 px-4">
        <ListSection>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex min-h-[60px] items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--color-fill-secondary)]" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--color-fill-secondary)]" />
              </div>
            </div>
          ))}
        </ListSection>
      </div>
    </main>
  );
}
