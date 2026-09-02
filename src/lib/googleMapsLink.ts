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

// Sharing a place from the Google Maps phone app doesn't always put a bare URL on the clipboard —
// iOS's share sheet commonly yields "<place name>\n<url>", which `new URL()` rejects outright, so
// the paste would silently fall through to being searched as literal text. Pulls the first Maps
// URL back out of whatever surrounding text came with it.
export function extractGoogleMapsUrl(value: string): string | null {
  const trimmed = value.trim();
  if (isGoogleMapsUrl(trimmed)) return trimmed;

  for (const candidate of trimmed.match(/https:\/\/[^\s]+/g) ?? []) {
    // Trailing sentence punctuation is far more likely to be prose than part of the link.
    const cleaned = candidate.replace(/[.,;:!?)\]]+$/, "");
    if (isGoogleMapsUrl(cleaned)) return cleaned;
  }

  return null;
}
