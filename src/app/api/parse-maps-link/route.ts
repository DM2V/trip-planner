import { NextRequest, NextResponse } from "next/server";

// Hostnames Google actually issues Maps links/redirects from. Fetching a user-supplied URL
// server-side is an SSRF vector, so this only ever follows links on this allowlist — anything
// else is rejected before a request is made.
const ALLOWED_HOSTS = ["google.com", "www.google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl", "g.co"];

function isAllowedGoogleMapsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

// Precise marker coordinates, when Google's "place" page embeds them (most reliable — this is
// the actual pin, not just the map's viewport center).
const MARKER_COORDS_PATTERN = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
// A dropped-pin share (maps.app.goo.gl redirects here for a bare location, with no place name)
// puts the coordinates straight in the path — oddly with a literal "+" before a negative
// longitude, e.g. /maps/search/5.81,+-55.11.
const SEARCH_COORDS_PATTERN = /\/maps\/search\/(-?\d+\.\d+),\+?(-?\d+\.\d+)/;
// Falls back to the viewport center baked into the URL (.../@lat,lng,zoom) or a bare
// "?q=lat,lng" / the documented "?api=1&query=lat,lng" programmatic format.
const VIEWPORT_COORDS_PATTERN = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
const QUERY_COORDS_PATTERN = /[?&](?:q|query)=(-?\d+\.\d+),\s?(-?\d+\.\d+)/;
const PLACE_NAME_PATTERN = /\/maps\/place\/([^/@]+)/;

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractPlace(rawFinalUrl: string, html: string | null): { label: string; lat: number; lng: number } | null {
  const finalUrl = safeDecodeURIComponent(rawFinalUrl);
  const haystack = `${finalUrl} ${html ?? ""}`;
  const coords =
    MARKER_COORDS_PATTERN.exec(haystack) ??
    SEARCH_COORDS_PATTERN.exec(finalUrl) ??
    VIEWPORT_COORDS_PATTERN.exec(haystack) ??
    QUERY_COORDS_PATTERN.exec(finalUrl);
  if (!coords) return null;

  const lat = Number(coords[1]);
  const lng = Number(coords[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const nameMatch = PLACE_NAME_PATTERN.exec(finalUrl);
  const label = nameMatch ? nameMatch[1].replace(/\+/g, " ") : `${lat}, ${lng}`;

  return { label, lat, lng };
}

// Lets a stop be added from a pasted Google Maps link instead of our own (OpenStreetMap-based)
// search, for the places that search can't find at all. `fetch` follows the maps.app.goo.gl /
// goo.gl short-link redirect itself, landing on the full google.com/maps/place/... URL that
// carries the actual coordinates.
export async function GET(request: NextRequest) {
  const link = request.nextUrl.searchParams.get("url");

  if (!link || !isAllowedGoogleMapsUrl(link)) {
    return NextResponse.json({ error: "Please paste a Google Maps link" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(link, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; trip-planner-link-parser/1.0)" },
    });
  } catch {
    return NextResponse.json({ error: "Couldn't reach that link" }, { status: 502 });
  }

  const html = response.ok ? await response.text() : null;
  const place = extractPlace(response.url, html);

  if (!place) {
    return NextResponse.json(
      { error: "Couldn't find a location in that link — try opening the place in Google Maps first, then Share > Copy link" },
      { status: 422 },
    );
  }

  return NextResponse.json({ place });
}
