"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Supabase can deliver a session two ways. The PKCE flow puts a ?code= in the query, which the
// server exchanges in /auth/callback — that's the normal path and it never reaches this component.
// The implicit flow instead puts the tokens in the URL *fragment*, which browsers never send to
// the server, so no amount of server-side code can see them. That's what arrives when no code
// verifier cookie is available to match a code — most commonly when someone signs up on one
// device and opens the confirmation email on another.
//
// Handing those tokens to setSession from the browser writes the same auth cookies the server
// exchange would have, after which /auth/callback can finish the sign-in normally.
//
// It does NOT do that on arrival. Anyone can sign up for their own account, copy the tokens from
// their own session into a link like /auth/complete#access_token=…, and send it to someone else;
// if opening it silently called setSession, the victim would end up signed in as the attacker and
// might type their trips into the attacker's account without noticing. So the session is only
// created after the person sees which account it is and confirms. For the legitimate case — your
// own confirmation email — that's one tap on your own address.

interface PendingSession {
  accessToken: string;
  refreshToken: string;
  email: string | null;
}

// The email is read from the token's payload only to *show* it. Nothing here trusts it: the
// session that actually gets created is whatever Supabase validates the tokens to belong to.
function emailFromAccessToken(accessToken: string): string | null {
  try {
    const payload = accessToken.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const email = (JSON.parse(json) as { email?: unknown }).email;
    return typeof email === "string" ? email : null;
  } catch {
    return null;
  }
}

export function CompleteSessionFromHash() {
  const [pending, setPending] = useState<PendingSession | null>(null);
  const [failed, setFailed] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    // Tokens in the address bar end up in history and screenshots; they're in memory from here.
    window.history.replaceState(null, "", window.location.pathname);

    if (!accessToken || !refreshToken) {
      setFailed(true);
      return;
    }

    setPending({ accessToken, refreshToken, email: emailFromAccessToken(accessToken) });
  }, []);

  async function confirm() {
    if (!pending) return;
    setWorking(true);

    try {
      const { error } = await createClient().auth.setSession({
        access_token: pending.accessToken,
        refresh_token: pending.refreshToken,
      });
      if (error) throw error;

      // Back to the callback, now that the session cookies exist: it sees the session and
      // redirects onward exactly as it would after a ?code= exchange, including honouring a
      // pending shared-trip copy.
      window.location.replace("/auth/callback");
    } catch {
      setWorking(false);
      setPending(null);
      setFailed(true);
    }
  }

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

  if (!pending) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex max-w-xs flex-col gap-2">
        <h1 className="text-[1.5rem] font-bold tracking-tight">Finish signing in</h1>
        <p className="text-[1.0625rem] text-[var(--color-label-secondary)]">
          {pending.email ? (
            <>
              You&rsquo;re about to sign in as{" "}
              <span className="break-all font-medium text-[var(--color-label)]">{pending.email}</span>.
            </>
          ) : (
            "You're about to sign in to your account."
          )}
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={confirm}
          disabled={working}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-[var(--color-accent)] px-4 text-[1.0625rem] font-semibold text-white transition-opacity active:opacity-70 disabled:opacity-35"
        >
          {working ? "Signing in..." : "Continue"}
        </button>
        <a href="/login" className="text-[0.9375rem] text-[var(--color-label-secondary)]">
          That&rsquo;s not me
        </a>
        <p className="text-[0.8125rem] text-[var(--color-label-secondary)]">
          If you didn&rsquo;t expect this, don&rsquo;t continue &mdash; someone may have sent you a link to
          their account.
        </p>
      </div>
    </main>
  );
}
