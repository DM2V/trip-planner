// Hostnames Google actually issues Maps links/redirects from. Shared between the client (to
// detect when pasted text should be treated as a link instead of a search query) and the
// /api/parse-maps-link route (where it's also an SSRF allowlist for a server-side fetch of
// user-supplied input) — these used to be two separately maintained copies that could drift
// apart, which for the server-side one is a real security-relevant gap, not just a style nit.
export const GOOGLE_MAPS_HOSTS = ["google.com", "www.google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl", "g.co"];

export function isGoogleMapsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && GOOGLE_MAPS_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}
