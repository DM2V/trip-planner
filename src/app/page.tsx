import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-accent)]">
        <div className="h-8 w-8 rounded-full bg-white" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-[1.75rem] font-bold tracking-tight">Manhattan Project</h1>
        <p className="max-w-xs text-[1.0625rem] text-[var(--color-label-secondary)]">
          Plan the optimal route to visit your places and share it with friends.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link href="/login" className={buttonClassName("primary", "w-full")}>
          Log In
        </Link>
        <Link href="/signup" className={buttonClassName("secondary", "w-full")}>
          Sign Up
        </Link>
      </div>
    </main>
  );
}
