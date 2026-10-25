import Link from "next/link";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { FormRow } from "@/components/ui/FormRow";
import { ListSection } from "@/components/ui/List";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { login } from "../actions";

// Fixed messages keyed by the ?msg= and ?error= query params. Never rendered from raw URL text.
const MSG: Record<string, string> = {
  "confirm-email": "Almost there — open the confirmation link we just emailed you and you'll be signed straight in.",
};
const ERRORS: Record<string, string> = {
  credentials: "Incorrect email or password.",
  generic: "Something went wrong — please try again.",
};

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; msg?: string }>;
}) {
  const searchParams = await props.searchParams;
  const message = searchParams.msg ? (MSG[searchParams.msg] ?? null) : null;
  const error = searchParams.error ? (ERRORS[searchParams.error] ?? null) : null;
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-6 px-4 py-10">
      <Link href="/" className="-ml-2 flex w-fit items-center gap-0.5 text-[1.0625rem] text-[var(--color-accent)]">
        <ChevronLeftIcon className="h-5 w-5" />
        Back
      </Link>

      <h1 className="text-center text-[1.75rem] font-bold tracking-tight">Welcome back</h1>

      {message && (
        <p className="tinted-success rounded-2xl px-4 py-3 text-[0.9375rem]">{message}</p>
      )}
      {error && (
        <p className="tinted-error rounded-2xl px-4 py-3 text-[0.9375rem]">{error}</p>
      )}

      <GoogleLoginButton />

      <div className="flex items-center gap-3 text-[0.8125rem] text-[var(--color-label-tertiary)]">
        <div className="h-px flex-1 bg-[var(--color-separator)]" />
        or
        <div className="h-px flex-1 bg-[var(--color-separator)]" />
      </div>

      <form action={login} className="flex flex-col gap-4">
        <ListSection>
          <FormRow label="Email" htmlFor="email">
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@email.com"
              className="flex-1 bg-transparent text-right text-[1.0625rem] outline-none placeholder:text-[var(--color-label-tertiary)]"
            />
          </FormRow>
          <FormRow label="Password" htmlFor="password">
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="flex-1 bg-transparent text-right text-[1.0625rem] outline-none placeholder:text-[var(--color-label-tertiary)]"
            />
          </FormRow>
        </ListSection>

        <SubmitButton pendingLabel="Logging in...">Log In</SubmitButton>
      </form>

      <p className="text-center text-[0.9375rem] text-[var(--color-label-secondary)]">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-[var(--color-accent)]">
          Sign up
        </Link>
      </p>
    </main>
  );
}
