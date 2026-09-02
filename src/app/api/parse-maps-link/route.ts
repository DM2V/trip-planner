import { NextRequest, NextResponse } from "next/server";
import { isGoogleMapsUrl } from "@/lib/googleMapsLink";

const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 8000;
const USER_AGENT = "Mozilla/5.0 (compatible; trip-planner-link-parser/1.0)";

// Precise marker coordinates, when Google's "place" page embeds them (most reliable — this is
// the actual pin, not just the map's viewport center). Only ever appears in the page body.
const MARKER_COORDS_PATTERN = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
// A dropped-pin share (maps.app.goo.gl redirects here for a bare location, with no place name)
// puts the coordinates straight in the path — oddly with a literal "+" before a negative
// longitude, e.g. /maps/search/5.81,+-55.11. URL-only, no page body needed.
const SEARCH_COORDS_PATTERN = /\/maps\/search\/(-?\d+\.\d+),\+?(-?\d+\.\d+)/;
// Falls back to the viewport center baked into the URL (.../@lat,lng,zoom) or a bare
// "?q=lat,lng" / the documented "?api=1&query=lat,lng" programmatic format. URL-only.
const VIEWPORT_COORDS_PATTERN = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
const QUERY_COORDS_PATTERN = /[?&](?:q|query)=(-?\d+\.\d+),\s?(-?\d+\.\d+)/;
const PLACE_NAME_PATTERN = /\/maps\/place\/([^/@]+)/;
// Sharing from the Google Maps *phone app* produces a link that carries no coordinates anywhere —
// not in the URL, not in the page body — only "?q=<name>, <street address>". Nothing above can
// resolve it, so the address itself gets geocoded as a last resort.
const QUERY_ADDRESS_PATTERN = /[?&](?:q|query)=([^&]+)/;

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function placeFromUrlOnly(rawUrl: string): { label: string; lat: number; lng: number } | null {
  const url = safeDecodeURIComponent(rawUrl);
  const coords = SEARCH_COORDS_PATTERN.exec(url) ?? VIEWPORT_COORDS_PATTERN.exec(url) ?? QUERY_COORDS_PATTERN.exec(url);
  if (!coords) return null;

  const lat = Number(coords[1]);
  const lng = Number(coords[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const nameMatch = PLACE_NAME_PATTERN.exec(url);
  const label = nameMatch ? nameMatch[1].replace(/\+/g, " ") : `${lat}, ${lng}`;
  return { label, lat, lng };
}

function placeFromPage(rawUrl: string, html: string): { label: string; lat: number; lng: number } | null {
  const url = safeDecodeURIComponent(rawUrl);
  const coords = MARKER_COORDS_PATTERN.exec(`${url} ${html}`);
  if (!coords) return null;

  const lat = Number(coords[1]);
  const lng = Number(coords[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const nameMatch = PLACE_NAME_PATTERN.exec(url);
  const label = nameMatch ? nameMatch[1].replace(/\+/g, " ") : `${lat}, ${lng}`;
  return { label, lat, lng };
}

// Last resort for a link shared from the phone app, which carries only a "?q=<name>, <address>".
// Unlike geocoding a bare place name — which is ambiguous enough that it used to resolve near
// whoever was *looking* at the link rather than the place meant — what Google puts here is a full
// street address (with city, state and ZIP), so it resolves on its own without a focus point.
// Uses Pelias /search rather than /autocomplete: /autocomplete is built for partial input and
// returns nothing at all for a complete address like this one.
async function placeFromAddressLookup(
  rawUrl: string,
): Promise<{ label: string; lat: number; lng: number } | null> {
  const match = QUERY_ADDRESS_PATTERN.exec(rawUrl);
  if (!match) return null;

  const address = safeDecodeURIComponent(match[1].replace(/\+/g, " ")).trim();
  if (address.length < 3) return null;

  const url = new URL("https://api.heigit.org/pelias/v1/search");
  url.searchParams.set("api_key", process.env.ORS_API_KEY ?? "");
  url.searchParams.set("text", address);
  url.searchParams.set("size", "1");

  try {
    const response = await fetch(url.toString(), { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) return null;

    const data = await response.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    const [lng, lat] = feature.geometry.coordinates;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { label: feature.properties.label ?? address, lat, lng };
  } catch {
    return null;
  }
}

// Follows redirects itself (redirect: "manual") instead of letting fetch do it, re-checking each
// hop's host against the same allowlist as the initial URL. Without this, a goo.gl/maps.app.goo.gl
// link — both legitimately Google-owned shorteners whose redirect target isn't restricted to
// "safe" destinations by Google itself — could be crafted to redirect to an internal address
// (e.g. a cloud metadata endpoint), and `fetch(url, { redirect: "follow" })` would have silently
// walked our server right into it after only the first hop was ever validated.
async function fetchFollowingAllowedRedirects(startUrl: string): Promise<Response> {
  let currentUrl = startUrl;

  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    const response = await fetch(currentUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT },
    });

    if (response.status < 300 || response.status >= 400) return response;

    const location = response.headers.get("location");
    if (!location) return response;

    const nextUrl = new URL(location, currentUrl).toString();
    if (!isGoogleMapsUrl(nextUrl)) {
      throw new Error(`Redirect target isn't an allowed Google Maps host: ${nextUrl}`);
    }
    currentUrl = nextUrl;
  }

  throw new Error("Too many redirects");
}

// Lets a stop be added from a pasted Google Maps link instead of our own (OpenStreetMap-based)
// search, for the places that search can't find at all.
export async function GET(request: NextRequest) {
  const link = request.nextUrl.searchParams.get("url");

  if (!link || !isGoogleMapsUrl(link)) {
    return NextResponse.json({ error: "Please paste a Google Maps link" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetchFollowingAllowedRedirects(link);
  } catch {
    return NextResponse.json({ error: "Couldn't reach that link" }, { status: 502 });
  }

  // Most links (a dropped pin, or the documented lat/lng query formats) resolve from the final
  // URL alone — only a "place" page's exact marker coordinates require reading the body, so that
  // slower request only happens when it's actually needed. A link shared from the phone app has
  // coordinates in neither, and falls through to geocoding the address it does carry.
  const place =
    placeFromUrlOnly(response.url) ??
    (response.ok ? placeFromPage(response.url, await response.text()) : null) ??
    (await placeFromAddressLookup(response.url));

  if (!place) {
    return NextResponse.json(
      { error: "Couldn't find a location in that link — try opening the place in Google Maps first, then Share > Copy link" },
      { status: 422 },
    );
  }

  return NextResponse.json({ place });
}
