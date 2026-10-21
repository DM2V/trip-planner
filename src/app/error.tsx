"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonClassName } from "@/components/ui/Button";

// Shown when something throws while rendering a page, instead of Next's generic "Application
// error: a server-side exception has occurred". This renders inside the root layout, so the app's
// normal styles apply.
//
// There is no error-tracking service behind this app, so `digest` is the only thread back to what
// actually happened: Next stamps the same id on the server-side log line for this failure, and
// showing it lets a user quote something that can be found with `vercel logs`.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex max-w-xs flex-col gap-2">
        <h1 className="text-[1.5rem] font-bold tracking-tight">Something went wrong</h1>
        <p className="text-[1.0625rem] text-[var(--color-label-secondary)]">
          We couldn&rsquo;t load this page. Your trips are safe &mdash; try again, or head back to your list.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button onClick={reset} className="w-full">
          Try Again
        </Button>
        <Link href="/trips" className={buttonClassName("secondary", "w-full")}>
          Go to My Trips
        </Link>
      </div>

      {error.digest && (
        <p className="text-[0.75rem] text-[var(--color-label-secondary)]">Reference: {error.digest}</p>
      )}
    </main>
  );
}
