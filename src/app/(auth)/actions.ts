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
    // Use a fixed key, not the raw Supabase message, so the URL can't be crafted to show arbitrary text.
    const key = error.message.toLowerCase().includes("invalid") ? "credentials" : "generic";
    redirect(`/login?error=${key}`);
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
    const msg = error.message.toLowerCase();
    const key = msg.includes("already") || msg.includes("registered")
      ? "email-taken"
      : msg.includes("password")
      ? "weak-password"
      : "generic";
    redirect(`/signup?error=${key}`);
  }

  // The confirmation link signs them in on arrival (see app/auth/callback).
  redirect("/login?msg=confirm-email");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
