"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOptimizedRoute } from "@/lib/ors/optimization";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function createTrip(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: trip, error } = await supabase
    .from("trips")
    .insert({
      owner_id: user.id,
      name: formData.get("name") as string,
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      origin_label: formData.get("origin_label") as string,
      origin_lat: Number(formData.get("origin_lat")),
      origin_lng: Number(formData.get("origin_lng")),
    })
    .select()
    .single();

  if (error || !trip) {
    console.error("createTrip failed:", error);
    redirect(`/trips/new?error=${encodeURIComponent(error?.message ?? "Could not create trip")}`);
  }

  redirect(`/trips/${trip.id}`);
}

export async function addStop(
  tripId: string,
  place: { label: string; lat: number; lng: number },
) {
  const supabase = createClient();

  const { error } = await supabase.from("stops").insert({
    trip_id: tripId,
    name: place.label,
    lat: place.lat,
    lng: place.lng,
  });

  if (error) throw new Error(error.message);

  // A previously calculated route no longer matches the stop list — clear it so the map/list
  // don't show a stale route until the user recalculates.
  await supabase.from("trips").update({ optimized_route: null }).eq("id", tripId);

  revalidatePath(`/trips/${tripId}`);
}

export async function deleteStop(tripId: string, stopId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("stops").delete().eq("id", stopId);

  if (error) throw new Error(error.message);

  await supabase.from("trips").update({ optimized_route: null }).eq("id", tripId);

  revalidatePath(`/trips/${tripId}`);
}

// Cascades to the trip's stops and trip_members (ON DELETE CASCADE in 0001_init.sql). RLS's
// "trips: owner has full control" policy is what actually stops a non-owner from doing this —
// this action doesn't check ownership itself.
export async function deleteTrip(tripId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("trips").delete().eq("id", tripId);

  if (error) throw new Error(error.message);

  revalidatePath("/trips");
}

// Called from the public /trips/[tripId]/share page, so the visitor isn't necessarily a trip
// member yet — we verify the share_token ourselves (via the admin client) before writing,
// same authorization the "trips: viewers can read" RLS policy would otherwise provide.
export async function joinSharedTrip(tripId: string, token: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Log in first to save this trip");

  const admin = createAdminClient();

  const { data: trip } = await admin
    .from("trips")
    .select("id")
    .eq("id", tripId)
    .eq("share_token", token)
    .single();

  if (!trip) throw new Error("Invalid share link");

  const { error } = await admin
    .from("trip_members")
    .upsert({ trip_id: tripId, user_id: user.id, role: "viewer" }, { onConflict: "trip_id,user_id" });

  if (error) throw new Error(error.message);

  revalidatePath("/trips");
}

export async function calculateRoute(tripId: string) {
  const supabase = createClient();

  const { data: trip } = await supabase.from("trips").select("*").eq("id", tripId).single();
  if (!trip) throw new Error("Trip not found");

  const { data: stops } = await supabase
    .from("stops")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });

  if (!stops || stops.length === 0) {
    throw new Error("Add at least one stop before calculating a route");
  }

  const route = await getOptimizedRoute(
    { lat: trip.origin_lat, lng: trip.origin_lng },
    stops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
  );

  await supabase.from("trips").update({ optimized_route: route }).eq("id", tripId);

  await Promise.all(
    route.order.map((stopIndex: number, visitPosition: number) =>
      supabase.from("stops").update({ order_index: visitPosition }).eq("id", stops[stopIndex].id),
    ),
  );

  revalidatePath(`/trips/${tripId}`);
}
