import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Client for Server Components / Route Handlers. Uses the anon key + the user's session cookies,
// so it still respects RLS. SUPABASE_SERVICE_ROLE_KEY is not used here — see lib/supabase/admin.ts
// for the narrow, explicitly-authorized cases (e.g. share links) where RLS is bypassed on purpose.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render, which can't set cookies — safe to
            // ignore because the middleware below refreshes the session on every request.
          }
        },
      },
    },
  );
}
