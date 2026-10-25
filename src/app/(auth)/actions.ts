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

  // Only Supabase's error code travels in the URL; the page turns it into fixed text, so a
  // crafted link can't put words of its own on the login screen.
  if (error) redirect(`/login?error=${error.code ?? "unexpected"}`);

  redirect(await resolvePostLoginRedirect());
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) redirect(`/signup?error=${error.code ?? "unexpected"}`);

  // The confirmation link signs them in on arrival (see app/auth/callback).
  redirect("/login?msg=confirm-email");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
