import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The place-search and Maps-link endpoints spend a shared third-party quota (OpenRouteService's
// free tier) and, for the link parser, make outbound requests on the caller's behalf. Both are
// only ever called from screens that already require a signed-in user, so requiring the session
// here costs legitimate users nothing and stops anyone else from burning that quota by hitting
// the URL directly.
//
// Returns the 401 response to send back, or null when the caller is signed in.
export async function rejectIfSignedOut(): Promise<NextResponse | null> {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();

  if (user) return null;
  return NextResponse.json({ error: "Log in to search for places" }, { status: 401 });
}
