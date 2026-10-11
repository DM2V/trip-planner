import { redirect } from "next/navigation";

type OwnedTrip = { id: string; owner_id: string; share_token: string };

// The same three rules guard both owner-only trip screens (the detail page and the edit form):
// be signed in, have the trip exist, and own it — a viewer who saved someone else's trip gets
// their read-only share view instead of a dead end. Kept in one place so the two screens can't
// drift into disagreeing about who is allowed to see what.
//
// Takes the already-fetched rows rather than fetching them, because the two callers load them
// differently (the detail page fetches user, trip and stops concurrently). Returns the trip so
// the caller gets it back non-null — every branch here ends in redirect(), which returns never.
export function requireTripOwner<T extends OwnedTrip>(
  user: { id: string } | null,
  trip: T | null | undefined,
): T {
  if (!user) redirect("/login");
  if (!trip) redirect("/trips");
  if (trip.owner_id !== user.id) {
    redirect(`/trips/${trip.id}/share?token=${trip.share_token}`);
  }
  return trip;
}
