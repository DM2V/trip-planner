import Link from "next/link";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { ListSection } from "@/components/ui/List";

// Next.js renders this automatically while the trip + stops fetch resolves — same shape as the
// real page, so nothing jumps once it lands.
export default function TripDetailLoading() {
  return (
    <main className="flex min-h-dvh flex-col">
      <div className="relative h-[42vh] w-full animate-pulse bg-(--color-fill-secondary)">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center px-3 pt-3">
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
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-7 w-2/3 animate-pulse rounded-sm bg-(--color-fill-secondary)" />
            <div className="h-4 w-1/2 animate-pulse rounded-sm bg-(--color-fill-secondary)" />
          </div>
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-(--color-fill-secondary)" />
        </div>

        <div className="h-11 animate-pulse rounded-xl bg-(--color-fill-secondary)" />

        <ListSection>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex min-h-[60px] items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-(--color-fill-secondary)" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded-sm bg-(--color-fill-secondary)" />
              </div>
            </div>
          ))}
        </ListSection>

        <div className="h-11 animate-pulse rounded-2xl bg-(--color-fill-secondary)" />
      </div>
    </main>
  );
}
