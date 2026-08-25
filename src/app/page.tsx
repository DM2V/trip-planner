import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Trip Planner</h1>
      <p className="max-w-sm text-slate-400">
        Plan the optimal route to visit your places and share it with friends.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-full bg-slate-50 px-5 py-2 text-sm font-medium text-slate-950"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-full border border-slate-700 px-5 py-2 text-sm font-medium"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
