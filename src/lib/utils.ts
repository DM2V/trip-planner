export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Formats a route duration as "1h 30m" (Apple/Google Maps style), dropping whichever unit is
// zero instead of showing "0h" or "0m".
export function formatDuration(durationSeconds: number): string {
  const totalMinutes = Math.round(durationSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

// Formats a distance as "350 m" below 1km (a 1-decimal km value would round short legs between
// nearby stops down to "0.0 km" or "0.3 km", both less useful than the actual meter figure), or
// "1.4 km" at or above it.
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Trip dates are plain "YYYY-MM-DD" strings (from a date input, no time/timezone attached).
// `new Date("2026-09-05")` parses that as UTC midnight, which `toLocaleDateString` in a
// timezone behind UTC then renders as the day *before* — parsing the parts directly into a
// local-time Date sidesteps that off-by-one.
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Inclusive day count — a trip with the same start and end date is 1 day, not 0.
export function daysBetweenInclusive(startDate: string, endDate: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.round((parseDateOnly(endDate).getTime() - parseDateOnly(startDate).getTime()) / msPerDay) + 1;
  return Math.max(days, 1);
}

// Rough sightseeing budget per day, since the trip doesn't record actual daily hours (e.g. a
// 9am-7pm day) — stated explicitly wherever this feeds into UI copy, not applied silently.
export const ASSUMED_TOURING_HOURS_PER_DAY = 10;

export interface StopTimeRecommendation {
  feasible: boolean;
  days: number;
  minutesPerStop: number; // meaningful only when feasible
  shortfallMinutes: number; // meaningful only when not feasible
}

// How long the user could reasonably spend at each stop, given the trip's date range and the
// travel time the route already requires — total sightseeing budget (days * assumed hours/day)
// minus travel time, split evenly across the stops. Doesn't decide which stop happens on which
// day, just whether the dates hold up at all and a single recommended dwell time.
export function recommendStopTime(
  startDate: string,
  endDate: string,
  travelDurationSeconds: number,
  stopCount: number,
): StopTimeRecommendation {
  const days = daysBetweenInclusive(startDate, endDate);
  const availableMinutes = days * ASSUMED_TOURING_HOURS_PER_DAY * 60;
  const travelMinutes = travelDurationSeconds / 60;
  const remainingMinutes = availableMinutes - travelMinutes;

  if (remainingMinutes <= 0 || stopCount === 0) {
    return { feasible: false, days, minutesPerStop: 0, shortfallMinutes: Math.abs(remainingMinutes) };
  }

  return { feasible: true, days, minutesPerStop: remainingMinutes / stopCount, shortfallMinutes: 0 };
}

// Formats a trip's date range as "Sep 5 – Sep 6, 2026" — the raw "2026-09-05 — 2026-09-06"
// strings read as data, not as something a person planning a trip would want to read.
export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

// Opens Google Maps' own turn-by-turn directions to a point, by public transit — from wherever
// the visitor currently is, since that's what's actually useful once you're out visiting places,
// not the previous stop in the planned order.
//
// Destination is always lat,lng — not the stop's name/label. An earlier version passed the name
// instead, reasoning that Google would resolve a full "name, street, city" label to its own exact
// POI instead of our geocoder's slightly-off coordinates. That broke once stops could also come
// from a pasted Google Maps link (see /api/parse-maps-link), which only gives a bare place name
// ("Joe's Pizza", "Pebble Beach") with no city — a name that ambiguous, sent to Google with no
// coordinates at all, gets geocoded near the *viewer's current location* instead of the trip's
// city, since Google Maps biases text search results toward wherever you're standing right now.
// A bare coordinate pin is never ambiguous like that, regardless of how far the viewer is from it.
export function googleMapsDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit`;
}

// Opens the place itself rather than a route to it — for looking up what's actually there (photos,
// hours, reviews) without planning a trip to it. Coordinates only, for exactly the same reason as
// the directions URL above: a bare name sent to Google resolves near whoever is looking at it.
export function googleMapsPlaceUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

// Nothing upstream stops a trip being saved with an end date before its start — the date inputs
// have no `min`/cross-field JS validation — and RouteSummary's day-count math would otherwise just
// clamp that to "1 day" and confidently report a stop-time recommendation for a nonsensical range.
export function validateTripDates(startDate: string, endDate: string): string | null {
  if (endDate < startDate) return "End date can't be before the start date";
  return null;
}

// MapLibre throws on a latitude outside ±90, which takes down the whole trip page (and its public
// share view) for as long as that point is saved, so nothing out of range may be stored.
export function isValidCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}
