import { NextRequest, NextResponse } from "next/server";
import { resolvePostLoginRedirect } from "@/app/trips/actions";
import { createClient } from "@/lib/supabase/server";

// Where every sign-in lands: Google OAuth, and the link from a confirmation email.
//
// This has to be a route handler, not a page. Exchanging the code writes the session cookies, and
// a Server Component render cannot set cookies — lib/supabase/server.ts swallows that failure on
// purpose, because for an ordinary page render the proxy (src/proxy.ts) will refresh the session anyway.
// That reasoning does not hold here: this is the one request where the session is *created*, so
// there is nothing for the proxy to refresh and the sign-in is silently lost.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Also the second pass after /auth/complete establishes a session from the URL fragment.
  if (user) {
    return NextResponse.redirect(new URL(await resolvePostLoginRedirect(), request.url));
  }

  // No session: the tokens may be in the URL fragment, which browsers never send to the server.
  // The fragment rides along with this redirect for a client component to pick up.
  return NextResponse.redirect(new URL("/auth/complete", request.url));
}
