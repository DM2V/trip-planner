// Phase 0: login screen using Supabase Auth (email/password + Google).
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Log in</h1>
      {/* TODO: form wired to supabase.auth.signInWithPassword / signInWithOAuth */}
    </main>
  );
}
