import { ListSection } from "@/components/ui/List";

// Next.js renders this automatically while the shared trip's data fetch resolves — same shape as
// the real page, so nothing jumps once it lands.
export default function SharedTripLoading() {
  return (
    <main className="flex min-h-dvh flex-col">
      <div className="h-[42vh] w-full animate-pulse bg-[var(--color-fill-secondary)]" />

      <header className="nav-material flex h-11 items-center px-4">
        <span className="text-[1.0625rem] font-semibold text-[var(--color-accent)]">Manhattan Project</span>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-4">
        <div className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-fill-secondary)]" />
          <div className="h-7 w-2/3 animate-pulse rounded bg-[var(--color-fill-secondary)]" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--color-fill-secondary)]" />
        </div>

        <ListSection>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex min-h-[60px] items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[var(--color-fill-secondary)]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--color-fill-secondary)]" />
              </div>
            </div>
          ))}
        </ListSection>
      </div>
    </main>
  );
}
