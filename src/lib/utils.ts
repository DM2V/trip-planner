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
