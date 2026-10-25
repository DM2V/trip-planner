"use server";

import { redirect } from "next/navigation";
import { resolvePostLoginRedirect } from "@/app/trips/actions";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(await resolvePostLoginRedirect());
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // The confirmation link signs them in on arrival (see app/auth/callback) — telling them to come
  // back and log in sent people to a login form they didn't need, right at the point where most
  // first-time visitors were already dropping off.
  redirect(
    `/login?message=${encodeURIComponent(
      "Almost there — open the confirmation link we just emailed you and you'll be signed straight in.",
    )}`,
  );
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
