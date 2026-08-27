import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";
import type { Trip } from "@/types";

export function TripCard({ trip }: { trip: Trip }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="flex min-h-[60px] items-center gap-3 px-4 py-3 active:bg-[var(--color-fill-secondary)]"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[1.0625rem] font-medium">{trip.name}</p>
        <p className="text-[0.9375rem] text-[var(--color-label-secondary)]">
          {trip.start_date} – {trip.end_date}
        </p>
      </div>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-[var(--color-label-tertiary)]" />
    </Link>
  );
}
