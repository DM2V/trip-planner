"use client";

import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function GoogleLoginButton() {
  const supabase = createClient();

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      onClick={() =>
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        })
      }
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3C33.7 32.3 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 7.1 29.6 5 24 5c-7.6 0-14.1 4.3-17.4 10.6z"
        />
        <path
          fill="#4CAF50"
          d="M24 45c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.6 35.6 26.9 36.5 24 36.5c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.6 40.6 16.2 45 24 45z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.5 5.5C41.4 36 44 30.6 44 24c0-1.4-.1-2.7-.4-3.5z"
        />
      </svg>
      Continue with Google
    </Button>
  );
}
