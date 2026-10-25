import { NextResponse } from "next/server";
import { allow } from "@/lib/rateLimit";
import { createClient } from "@/lib/supabase/server";

// The place-search and Maps-link endpoints spend a shared third-party quota (OpenRouteService's
// free tier) and, for the link parser, make outbound requests on the caller's behalf. Both are
// only ever called from screens that already require a signed-in user, so requiring the session
// here costs legitimate users nothing and stops anyone else from burning that quota by hitting
// the URL directly. The rate limit is per user rather than per IP, so people sharing a network
// (a household, an office) don't share one allowance.
//
// Returns the response to send back instead (401 signed out, 429 over the limit), or null when
// the request may go ahead.
export async function guardApiRequest(endpoint: string, perMinute: number): Promise<NextResponse | null> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();

  if (!user) return NextResponse.json({ error: "Log in to search for places" }, { status: 401 });

  if (!allow(`${endpoint}:${user.id}`, perMinute, 60_000)) {
    return NextResponse.json({ error: "Too many requests — wait a moment and try again" }, { status: 429 });
  }
  return null;
}
