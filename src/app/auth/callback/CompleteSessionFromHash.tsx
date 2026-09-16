"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Supabase can deliver a session two ways. The PKCE flow puts a ?code= in the query, which the
// server can read and exchange — that's the normal path and it never reaches this component. The
// implicit flow instead puts the tokens in the URL *fragment*, which browsers never send to the
// server, so no amount of server-side code can see them. That happens when the code verifier
// cookie isn't available to match the code — most commonly when someone signs up on one device
// and opens the confirmation email on another.
//
// Reading the fragment here and handing it to setSession writes the same auth cookies the server
// exchange would have, so reloading without the fragment lands on an ordinary logged-in request.
export function CompleteSessionFromHash() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setFailed(true);
      return;
    }

    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setFailed(true);
          return;
        }
        // Same URL minus the fragment: the server request that follows now carries the session
        // cookies, so the page above redirects onward the same way it would after a ?code=
        // exchange — including honouring a pending shared-trip copy.
        window.location.replace(window.location.pathname);
      })
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[1.0625rem] text-[var(--color-label-secondary)]">
          This sign-in link has expired or has already been used.
        </p>
        <a href="/login" className="text-[1.0625rem] font-semibold text-[var(--color-accent)]">
          Go to log in
        </a>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      <p className="text-[1.0625rem] text-[var(--color-label-secondary)]">Signing you in...</p>
    </main>
  );
}
