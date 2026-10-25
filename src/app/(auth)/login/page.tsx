import Link from "next/link";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { FormRow } from "@/components/ui/FormRow";
import { ListSection } from "@/components/ui/List";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { ClearOfflineCache } from "@/components/auth/ClearOfflineCache";
import { login } from "../actions";

// Fixed text for the ?msg= and ?error= params, which carry keys (Supabase error codes for errors),
// never text to display. Any unrecognised error code gets the generic line.
const MSG: Record<string, string> = {
  "confirm-email": "Almost there — open the confirmation link we just emailed you and you'll be signed straight in.",
  "save-trip": "Log in to save this trip to your list.",
};
const ERRORS: Record<string, string> = {
  invalid_credentials: "Incorrect email or password.",
  email_not_confirmed: "Confirm your email first — open the link we sent you, then log in.",
  over_request_rate_limit: "Too many attempts. Wait a minute and try again.",
};
const GENERIC_ERROR = "Something went wrong — please try again.";

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; msg?: string }>;
}) {
  const searchParams = await props.searchParams;
  const message = searchParams.msg ? (MSG[searchParams.msg] ?? null) : null;
  const error = searchParams.error ? (ERRORS[searchParams.error] ?? GENERIC_ERROR) : null;
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-6 px-4 py-10">
      <ClearOfflineCache />
      <Link href="/" className="-ml-2 flex w-fit items-center gap-0.5 text-[1.0625rem] text-(--color-accent)">
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

      <div className="flex items-center gap-3 text-[0.8125rem] text-(--color-label-tertiary)">
        <div className="h-px flex-1 bg-(--color-separator)" />
        or
        <div className="h-px flex-1 bg-(--color-separator)" />
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
              className="flex-1 bg-transparent text-right text-[1.0625rem] outline-hidden placeholder:text-(--color-label-tertiary)"
            />
          </FormRow>
          <FormRow label="Password" htmlFor="password">
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="flex-1 bg-transparent text-right text-[1.0625rem] outline-hidden placeholder:text-(--color-label-tertiary)"
            />
          </FormRow>
        </ListSection>

        <SubmitButton pendingLabel="Logging in...">Log In</SubmitButton>
      </form>

      <p className="text-center text-[0.9375rem] text-(--color-label-secondary)">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-(--color-accent)">
          Sign up
        </Link>
      </p>
    </main>
  );
}
