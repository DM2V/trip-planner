import Link from "next/link";
import { AppMark } from "@/components/ui/AppMark";
import { buttonClassName } from "@/components/ui/Button";

// A public trip anyone can open without an account, so the landing page can show the product
// working instead of only describing it. Read from the environment rather than hardcoded so the
// demo can be swapped without a code change — and if it isn't configured, the link simply doesn't
// render rather than sending anyone to a dead "invalid link" page.
const DEMO_TRIP_ID = process.env.NEXT_PUBLIC_DEMO_TRIP_ID;
const DEMO_TRIP_TOKEN = process.env.NEXT_PUBLIC_DEMO_TRIP_TOKEN;

const POINTS = [
  "Orders your stops to cut total travel time, from real roads — not straight lines",
  "Tells you how long you can spend at each stop across your dates",
  "Share a link — no account needed to open it",
];

export default function HomePage() {
  const demoHref =
    DEMO_TRIP_ID && DEMO_TRIP_TOKEN
      ? `/trips/${DEMO_TRIP_ID}/share?token=${DEMO_TRIP_TOKEN}`
      : null;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-7 px-6 py-12 text-center">
      <AppMark />

      <div className="flex flex-col gap-2">
        <h1 className="text-[1.75rem] font-bold tracking-tight">Trip Planner</h1>
        <p className="max-w-xs text-[1.0625rem] text-[var(--color-label-secondary)]">
          Plan the best order to visit your places, and share it with friends.
        </p>
      </div>

      <ul className="flex w-full max-w-xs flex-col gap-2.5 text-left">
        {POINTS.map((point) => (
          <li key={point} className="flex gap-2.5 text-[0.9375rem] leading-snug">
            <span aria-hidden="true" className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
            <span className="text-[var(--color-label-secondary)]">{point}</span>
          </li>
        ))}
      </ul>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {demoHref && (
          <Link href={demoHref} className={buttonClassName("primary", "w-full")}>
            See an Example Trip
          </Link>
        )}
        <Link
          href="/signup"
          className={buttonClassName(demoHref ? "secondary" : "primary", "w-full")}
        >
          Sign Up
        </Link>
        <p className="text-[0.9375rem] text-[var(--color-label-secondary)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--color-accent)]">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
