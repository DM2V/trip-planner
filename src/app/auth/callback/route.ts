import { NextRequest, NextResponse } from "next/server";
import { resolvePostLoginRedirect } from "@/app/trips/actions";
import { createClient } from "@/lib/supabase/server";

// OAuth (Google, etc.) redirects here with a ?code= param after the provider login screen.
// Exchanging it for a session is what actually logs the user in.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(await resolvePostLoginRedirect(), request.url));
}
