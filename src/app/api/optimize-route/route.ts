import { NextRequest, NextResponse } from "next/server";
import { getOptimizedRoute } from "@/lib/ors/optimization";

// Phase 3: receives { origin, stops } and returns the optimal order + geometry from the OpenRouteService Optimization API.
export async function POST(request: NextRequest) {
  const { origin, stops } = await request.json();

  if (!origin || !Array.isArray(stops) || stops.length === 0) {
    return NextResponse.json(
      { error: "origin and stops are required" },
      { status: 400 },
    );
  }

  const route = await getOptimizedRoute(origin, stops);
  return NextResponse.json(route);
}
