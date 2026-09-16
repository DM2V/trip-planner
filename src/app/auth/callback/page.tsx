import { redirect } from "next/navigation";
import { resolvePostLoginRedirect } from "@/app/trips/actions";
import { createClient } from "@/lib/supabase/server";
import { CompleteSessionFromHash } from "./CompleteSessionFromHash";

// Where every sign-in lands: OAuth (Google), and the link from a confirmation email. Both arrive
// with a ?code= to exchange for a session under the normal PKCE flow. This is a page rather than a
// route handler because the implicit flow delivers the session in the URL fragment instead, which
// never reaches the server and so needs a client component to pick it up — see
// CompleteSessionFromHash.
export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const supabase = createClient();

  if (searchParams.code) {
    // Fails when the code verifier cookie isn't in this browser (signed up on one device, opened
    // the email on another). Not fatal — the fragment path below can still carry a session.
    await supabase.auth.exchangeCodeForSession(searchParams.code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Also the second pass after CompleteSessionFromHash reloads without the fragment: by then the
  // session cookies exist, so this is where that path exits too.
  if (user) redirect(await resolvePostLoginRedirect());

  return <CompleteSessionFromHash />;
}
