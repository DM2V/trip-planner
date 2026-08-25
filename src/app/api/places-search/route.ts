import { NextRequest, NextResponse } from "next/server";

const ORS_API_KEY = process.env.ORS_API_KEY;

// Phase 2: proxies to the OpenRouteService Geocoding (autocomplete) endpoint — same API key as
// the optimization route, one less account to manage.
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  // api.openrouteservice.org was shut off on 2026-08-24 in favor of api.heigit.org (unified HeiGIT API).
  const url = new URL("https://api.heigit.org/pelias/v1/autocomplete");
  url.searchParams.set("api_key", ORS_API_KEY ?? "");
  url.searchParams.set("text", query);

  const response = await fetch(url.toString());
  if (!response.ok) {
    return NextResponse.json(
      { error: `OpenRouteService Geocoding API error: ${response.status}` },
      { status: 502 },
    );
  }

  const data = await response.json();
  const suggestions = data.features.map(
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
