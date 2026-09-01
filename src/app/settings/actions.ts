"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Deleting the auth.users row cascades through the DB (profiles -> trips -> stops/trip_members,
// see supabase/migrations/0001_init.sql), so this is the only deletion needed — including trips
// the user shared with others, which disappear for those viewers too.
//
// Server Actions redact thrown error messages in production (see the same fix in
// app/trips/actions.ts's calculateRoute), so failure is returned as data instead of thrown.
export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return { error: "Could not delete your account. Please try again." };
  }

  await supabase.auth.signOut();
  redirect("/login");
}
