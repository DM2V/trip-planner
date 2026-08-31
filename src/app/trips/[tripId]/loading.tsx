import { PageHeader } from "@/components/ui/PageHeader";
import { ListSection } from "@/components/ui/List";

// Next.js renders this automatically while a trip's data (and its stops) are being fetched —
// same shape as the real page, so nothing jumps once the data lands.
export default function TripDetailLoading() {
  return (
    <main className="flex min-h-dvh flex-col">
      <div className="h-[42vh] w-full animate-pulse bg-[var(--color-fill-secondary)]" />

      <PageHeader title="" backHref="/trips" backLabel="Trips" />

      <div className="flex flex-1 flex-col gap-6 px-4 pb-10">
        <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--color-fill-secondary)]" />

        <div className="h-11 animate-pulse rounded-xl bg-[var(--color-fill-secondary)]" />

        <ListSection>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex min-h-[52px] items-center gap-3 px-4 py-2.5">
              <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-[var(--color-fill-secondary)]" />
              <div className="h-4 w-1/2 flex-1 animate-pulse rounded bg-[var(--color-fill-secondary)]" />
            </div>
          ))}
        </ListSection>

        <div className="h-11 animate-pulse rounded-2xl bg-[var(--color-fill-secondary)]" />
      </div>
    </main>
  );
}
