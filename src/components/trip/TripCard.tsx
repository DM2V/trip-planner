import Link from "next/link";
import type { Trip } from "@/types";

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="block rounded-xl border border-slate-800 p-4"
    >
      <p className="font-medium">{trip.name}</p>
      <p className="text-sm text-slate-400">
        {trip.start_date} — {trip.end_date}
      </p>
    </Link>
  );
}
