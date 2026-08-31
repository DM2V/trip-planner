import Link from "next/link";
import { ListSection } from "@/components/ui/List";
import { ChevronLeftIcon } from "@/components/ui/icons";

// Next.js renders this automatically while a trip's data (and its stops) are being fetched —
// same shape as the real page, so nothing jumps once the data lands.
export default function TripDetailLoading() {
  return (
    <main className="flex min-h-dvh flex-col">
      <div className="relative h-[42vh] w-full animate-pulse bg-[var(--color-fill-secondary)]">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 pt-3">
          <Link
            href="/trips"
            className="map-chrome flex min-h-[44px] items-center gap-0.5 rounded-full py-2 pl-3 pr-4 text-[1.0625rem] text-[#007aff]"
          >
            <ChevronLeftIcon className="h-5 w-5" />
            Trips
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-4">
        <div className="h-7 w-2/3 animate-pulse rounded bg-[var(--color-fill-secondary)]" />

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
