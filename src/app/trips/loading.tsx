import { TabBar } from "@/components/TabBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListSection } from "@/components/ui/List";

// Next.js renders this automatically while the trips list is being fetched — same shape as the
// real list, so nothing jumps once the data lands. This is also the PWA's start_url, so it's the
// very first thing shown when opening the app from the home screen — the spinner in place of the
// "New Trip" pill (not yet interactive anyway) doubles as that launch moment's loading cue.
export default function TripsLoading() {
  return (
    <main className="flex min-h-dvh flex-col gap-6 pb-24">
      <PageHeader
        title="Trips"
        large
        trailing={
          <span className="h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
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

      <TabBar />
    </main>
  );
}
