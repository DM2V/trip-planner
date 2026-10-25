import Link from "next/link";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { FormRow } from "@/components/ui/FormRow";
import { ListSection } from "@/components/ui/List";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { signup } from "../actions";

// Fixed text for the ?msg= and ?error= params, which carry keys (Supabase error codes for errors),
// never text to display. Any unrecognised error code gets the generic line.
const MSGS: Record<string, string> = {
  "copy-trip": "Create an account to get your own editable copy of this trip.",
};
const ERRORS: Record<string, string> = {
  user_already_exists: "An account with that email already exists. Log in instead.",
  email_exists: "An account with that email already exists. Log in instead.",
  weak_password: "Password must be at least 6 characters.",
  email_address_invalid: "That email address isn't valid.",
  over_email_send_rate_limit: "We can't send more confirmation emails right now. Try again in a little while.",
  over_request_rate_limit: "Too many attempts. Wait a minute and try again.",
};
const GENERIC_ERROR = "Something went wrong — please try again.";

export default async function SignupPage(props: {
  searchParams: Promise<{ error?: string; msg?: string }>;
}) {
  const searchParams = await props.searchParams;
  const message = searchParams.msg ? (MSGS[searchParams.msg] ?? null) : null;
  const error = searchParams.error ? (ERRORS[searchParams.error] ?? GENERIC_ERROR) : null;
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-6 px-4 py-10">
      <Link href="/" className="-ml-2 flex w-fit items-center gap-0.5 text-[1.0625rem] text-(--color-accent)">
        <ChevronLeftIcon className="h-5 w-5" />
        Back
      </Link>

      <h1 className="text-center text-[1.75rem] font-bold tracking-tight">Create account</h1>

      {message && (
        <p className="tinted-accent rounded-2xl px-4 py-3 text-[0.9375rem]">{message}</p>
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

      <form action={signup} className="flex flex-col gap-4">
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
              minLength={6}
              placeholder="••••••••"
              className="flex-1 bg-transparent text-right text-[1.0625rem] outline-hidden placeholder:text-(--color-label-tertiary)"
            />
          </FormRow>
        </ListSection>

        <SubmitButton pendingLabel="Signing up...">Sign Up</SubmitButton>
      </form>

      <p className="text-center text-[0.9375rem] text-(--color-label-secondary)">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-(--color-accent)">
          Log in
        </Link>
      </p>
    </main>
  );
}
