export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Opens Google Maps' own turn-by-turn directions to a point, walking by default (this app is
// built around walkable trips) — from wherever the visitor currently is, since that's what's
// actually useful once you're out visiting places, not the previous stop in the planned order.
export function googleMapsDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}
