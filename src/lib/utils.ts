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

// Opens Google Maps' own turn-by-turn directions to a point, by public transit — from wherever
// the visitor currently is, since that's what's actually useful once you're out visiting places,
// not the previous stop in the planned order.
//
// destinationName is the full label from our geocoder (OpenStreetMap-based), which usually
// includes the place name and street address — e.g. "Katz's Delicatessen, 205 E Houston St, New
// York, NY". Passing that as the destination lets Google resolve it against its own places
// database, instead of dropping a raw pin at our geocoder's lat/lng, which frequently sits a
// short distance from where Google's own data has the same place.
export function googleMapsDirectionsUrl(destinationName: string, lat: number, lng: number) {
  const destination = destinationName || `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=transit`;
}
