import { NextRequest, NextResponse } from "next/server";
import { rejectIfSignedOut } from "@/lib/apiAuth";

const ORS_API_KEY = process.env.ORS_API_KEY;

// Phase 2: proxies to the OpenRouteService Geocoding (autocomplete) endpoint — same API key as
// the optimization route, one less account to manage.
export async function GET(request: NextRequest) {
  const signedOut = await rejectIfSignedOut();
  if (signedOut) return signedOut;

  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  // api.openrouteservice.org was shut off on 2026-08-24 in favor of api.heigit.org (unified HeiGIT API).
  const url = new URL("https://api.heigit.org/pelias/v1/autocomplete");
  url.searchParams.set("api_key", ORS_API_KEY ?? "");
  url.searchParams.set("text", query);

  // Bias results toward a reference point (the trip's origin when adding a stop, or the user's
  // location when picking that origin) so a name that matches places in several cities ranks the
  // nearby one first — without this, Pelias only ranks by text relevance and can just as easily
  // surface a same-named place on the other side of the world above the one actually meant.
  const focusLat = request.nextUrl.searchParams.get("focusLat");
  const focusLng = request.nextUrl.searchParams.get("focusLng");
  if (focusLat && focusLng) {
    url.searchParams.set("focus.point.lat", focusLat);
    url.searchParams.set("focus.point.lon", focusLng);
  }

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch {
    // A network-level failure (DNS, timeout, connection reset) would otherwise surface as an
    // unhandled 500 with no usable message for the client to show.
    return NextResponse.json({ error: "Couldn't reach the search service" }, { status: 502 });
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: `OpenRouteService Geocoding API error: ${response.status}` },
      { status: 502 },
    );
  }

  const data = await response.json();
  // Pelias omits `features` entirely on some error shapes rather than returning an empty array.
  const suggestions = (data.features ?? []).map(
    (feature: {
      properties: { label: string };
      geometry: { coordinates: [number, number] };
    }) => ({
      label: feature.properties.label,
      lng: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1],
    }),
  );

  return NextResponse.json({ suggestions });
}
