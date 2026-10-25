"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  describeUnreachablePoint,
  getOptimizedRoute,
  getRouteForSequence,
  UnroutableCoordinateError,
  type OptimizedRoutes,
} from "@/lib/ors/optimization";
import type { LatLng } from "@/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validateTripDates } from "@/lib/utils";

export async function createTrip(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const dateError = validateTripDates(startDate, endDate);
  if (dateError) redirect("/trips/new?error=invalid-dates");

  const { data: trip, error } = await supabase
    .from("trips")
    .insert({
      owner_id: user.id,
      name: formData.get("name") as string,
      start_date: startDate,
      end_date: endDate,
      origin_label: formData.get("origin_label") as string,
      origin_lat: Number(formData.get("origin_lat")),
      origin_lng: Number(formData.get("origin_lng")),
    })
    .select()
    .single();

  if (error || !trip) {
    console.error("createTrip failed:", error);
    redirect("/trips/new?error=save-failed");
  }

  redirect(`/trips/${trip.id}`);
}

export async function updateTrip(tripId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("origin_lat, origin_lng")
    .eq("id", tripId)
    .single();
  if (!trip) redirect("/trips");

  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const dateError = validateTripDates(startDate, endDate);
  if (dateError) redirect(`/trips/${tripId}/edit?error=invalid-dates`);

  const originLat = Number(formData.get("origin_lat"));
  const originLng = Number(formData.get("origin_lng"));
  // A changed origin invalidates any calculated route (every leg and the geometry itself were
  // computed from the old one) — same reasoning as clearing it when a stop is added or removed.
  const originChanged = originLat !== trip.origin_lat || originLng !== trip.origin_lng;

  const { error } = await supabase
    .from("trips")
    .update({
      name: formData.get("name") as string,
      // Dates don't affect travel time between stops, so unlike the origin they don't need to
      // invalidate any calculated route — the stop-time recommendation (see RouteSummary) is
      // derived from the dates at render time, not baked into the stored route.
      start_date: startDate,
      end_date: endDate,
      origin_label: formData.get("origin_label") as string,
      origin_lat: originLat,
      origin_lng: originLng,
      ...(originChanged ? { optimized_route: null } : {}),
    })
    .eq("id", tripId);

  if (error) {
    redirect(`/trips/${tripId}/edit?error=save-failed`);
  }

  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function addStop(
  tripId: string,
  place: { label: string; lat: number; lng: number },
) {
  const supabase = await createClient();

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
  const supabase = await createClient();
  const { error } = await supabase.from("stops").delete().eq("id", stopId);

  if (error) throw new Error(error.message);

  await supabase.from("trips").update({ optimized_route: null }).eq("id", tripId);

  revalidatePath(`/trips/${tripId}`);
}

// Cascades to the trip's stops and trip_members (ON DELETE CASCADE in 0001_init.sql). RLS's
// "trips: owner has full control" policy is what actually stops a non-owner from doing this —
// this action doesn't check ownership itself.
export async function deleteTrip(tripId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("trips").delete().eq("id", tripId);

  if (error) throw new Error(error.message);

  revalidatePath("/trips");
}

// Cuts off everyone who currently has access through sharing. A share link is a bearer secret —
// anyone who has it can open the trip — so without this there was no way to take back a link that
// had been forwarded further than intended.
//
// Two separate doors need closing, and rotating the token alone only closes one: the link itself
// (share_token) and the people who pressed "Save to My Trips" (trip_members rows), who read the
// trip through RLS and would keep seeing it, and be handed the new token on their next visit.
//
// Ownership is enforced by RLS on both writes ("owner has full control" / "owner manages
// guests"), and the explicit owner_id filter on the update makes a non-owner's call a clean no-op
// rather than relying on that alone. Returns data, not a throw, per the Server Action error
// redaction note above calculateRoute.
export async function resetShareLink(tripId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Log in again to do this" };

  const { data: updated, error } = await supabase
    .from("trips")
    .update({ share_token: crypto.randomUUID() })
    .eq("id", tripId)
    .eq("owner_id", user.id)
    .select("id");

  if (error || !updated || updated.length === 0) {
    console.error("resetShareLink: token rotation failed", error);
    return { error: "Could not reset the share link. Please try again." };
  }

  // After the token is rotated: even if this second step failed, the old link is already dead,
  // which is the part that matters most. Say so rather than reporting a total failure.
  const { error: membersError } = await supabase
    .from("trip_members")
    .delete()
    .eq("trip_id", tripId)
    .eq("role", "viewer");

  if (membersError) {
    console.error("resetShareLink: removing saved viewers failed", membersError);
    revalidatePath(`/trips/${tripId}`);
    return {
      error:
        "The old link no longer works, but we couldn't remove people who had already saved this trip. Try again.",
    };
  }

  revalidatePath(`/trips/${tripId}`);
  return {};
}

// Called from the public /trips/[tripId]/share page, so the visitor isn't necessarily a trip
// member yet — we verify the share_token ourselves (via the admin client) before writing,
// same authorization the "trips: viewers can read" RLS policy would otherwise provide.
export async function joinSharedTrip(tripId: string, token: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  // The share-token lookup doesn't depend on the resolved user, so it runs alongside the auth
  // check instead of after it; if the caller isn't logged in, the lookup result is just discarded.
  const [
    {
      data: { user },
    },
    { data: trip },
  ] = await Promise.all([
    supabase.auth.getUser(),
    admin.from("trips").select("id").eq("id", tripId).eq("share_token", token).single(),
  ]);

  if (!user) throw new Error("Log in first to save this trip");

  if (!trip) throw new Error("Invalid share link");

  const { error } = await admin
    .from("trip_members")
    .upsert({ trip_id: tripId, user_id: user.id, role: "viewer" }, { onConflict: "trip_id,user_id" });

  if (error) throw new Error(error.message);

  revalidatePath("/trips");
}

// "Save to My Trips" above only ever grants "viewer" access to the *original* trip (the DB's
// role check constraint only allows 'owner' | 'viewer' — there's no 'editor'), and the trip/edit
// pages redirect anyone who isn't the owner to the read-only share view regardless of
// trip_members role. So the only way for someone else to actually edit a shared trip is a real
// copy — a new trips row (fresh id, fresh share_token) they own, with the stops duplicated under
// it. Returns the new trip's id, or null if the current user isn't logged in or the token is bad.
export async function copySharedTrip(tripId: string, token: string): Promise<string | null> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Admin client: the copying user isn't a member of the original trip, so this mirrors the same
  // token-gated read the public share page itself relies on.
  const [{ data: original }, { data: originalStops }] = await Promise.all([
    admin.from("trips").select("*").eq("id", tripId).eq("share_token", token).single(),
    admin.from("stops").select("*").eq("trip_id", tripId),
  ]);
  if (!original) return null;

  const { data: newTrip, error: tripError } = await supabase
    .from("trips")
    .insert({
      owner_id: user.id,
      name: original.name,
      start_date: original.start_date,
      end_date: original.end_date,
      origin_label: original.origin_label,
      origin_lat: original.origin_lat,
      origin_lng: original.origin_lng,
      // Still valid to copy as-is: same stops, same order, same origin, so the same
      // distances/legs/geometry apply until the new owner changes any of that themselves.
      optimized_route: original.optimized_route,
    })
    .select("id")
    .single();
  if (tripError || !newTrip) return null;

  if (originalStops && originalStops.length > 0) {
    const { error: stopsError } = await supabase.from("stops").insert(
      originalStops.map((stop) => ({
        trip_id: newTrip.id,
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        order_index: stop.order_index,
      })),
    );
    if (stopsError) {
      // The trip row exists but is empty — roll it back so the user doesn't land on a blank trip.
      console.error("copySharedTrip: stops insert failed, rolling back trip:", stopsError);
      await supabase.from("trips").delete().eq("id", newTrip.id);
      return null;
    }
  }

  revalidatePath("/trips");
  return newTrip.id;
}

// For a visitor who's already logged in: copy immediately, no detour through signup.
export async function copySharedTripNow(tripId: string, token: string) {
  const newTripId = await copySharedTrip(tripId, token);
  if (!newTripId) {
    redirect(`/trips/${tripId}/share?token=${token}&error=copy-failed`);
  }
  redirect(`/trips/${newTripId}`);
}

// A visitor with no account yet can't copy the trip until they're actually logged in, and this
// project requires email confirmation (see signup(), (auth)/actions.ts) — there's no session at
// all right when they sign up, only later when they come back and log in, possibly after
// clicking the emailed confirmation link in between. A cookie is what survives that whole detour
// (query params would need to be threaded through every redirect in the chain, including
// Supabase's own confirmation-link redirect, which this app doesn't control); resolvePostLoginRedirect
// below is what actually consumes it, from both the password-login action and the OAuth callback.
const PENDING_TRIP_COPY_COOKIE = "pending_trip_copy";

export async function requestTripCopyOnSignup(tripId: string, token: string) {
  (await cookies()).set(PENDING_TRIP_COPY_COOKIE, JSON.stringify({ tripId, token }), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60, // an hour is plenty to sign up, confirm by email, and log back in
    path: "/",
  });
  redirect("/signup?msg=copy-trip");
}

// Called right after a successful login — both the password form (auth)/actions.ts and the OAuth
// callback route — so a pending copy request gets fulfilled regardless of which one the visitor
// used to actually log in.
export async function resolvePostLoginRedirect(): Promise<string> {
  const store = await cookies();
  const pending = store.get(PENDING_TRIP_COPY_COOKIE)?.value;
  if (!pending) return "/trips";

  store.delete(PENDING_TRIP_COPY_COOKIE);
  try {
    const { tripId, token } = JSON.parse(pending) as { tripId: string; token: string };
    const newTripId = await copySharedTrip(tripId, token);
    if (newTripId) return `/trips/${newTripId}`;
  } catch (err) {
    console.error("resolvePostLoginRedirect: failed to copy pending shared trip:", err);
  }
  return "/trips";
}

// Next.js redacts any error thrown from a Server Action in production (see
// https://github.com/vercel/next.js/issues/71101) — so failures here are returned as data
// instead, or the caller only ever sees a generic, unhelpful message.
export async function calculateRoute(tripId: string, roundTrip: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();

  // The stops query only depends on tripId, not on the trip row, so it runs concurrently with the
  // trip fetch instead of waiting on it. If the trip turns out not to exist, the stops result is
  // simply discarded below.
  const [{ data: trip }, { data: stops }] = await Promise.all([
    supabase.from("trips").select("*").eq("id", tripId).single(),
    supabase
      .from("stops")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true }),
  ]);

  if (!trip) return { error: "Trip not found" };

  if (!stops || stops.length === 0) {
    return { error: "Add at least one stop before calculating a route" };
  }

  const origin = { lat: trip.origin_lat, lng: trip.origin_lng };

  let driving: Awaited<ReturnType<typeof getOptimizedRoute>> | null = null;

  try {
    // Driving picks the visiting order (it's the default view); walking then reuses that exact
    // order via a plain Directions call instead of re-optimizing, so the two profiles never
    // disagree on which stop comes next — only on how long each leg takes.
    driving = await getOptimizedRoute(
      origin,
      stops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
      "driving-car",
      roundTrip,
    );

    // Only append the origin as a closing waypoint for a round trip — same choice driving's
    // start/end above just made — so ORS Directions' segments come back with one extra leg (the
    // return trip) for free when it applies, no separate call needed either way.
    const orderedStops = driving!.order.map((stopIndex: number) => stops[stopIndex]);
    const walkingWaypoints = [
      origin,
      ...orderedStops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
      ...(roundTrip ? [origin] : []),
    ];

    // Walking failing shouldn't block saving the driving route that already succeeded — e.g. an
    // origin far enough out (an airport, say) can have a perfectly good driving route with no
    // walkable path at all, which ORS reports as its own "no route between these points" error
    // (distinct from UnroutableCoordinateError's "can't snap this one point to the network").
    // Walking is just omitted from the saved route in that case, not treated as a failure.
    let walking = null;
    try {
      walking = await getRouteForSequence(walkingWaypoints, "foot-walking");
    } catch (walkingError) {
      console.error("calculateRoute: walking leg failed, saving driving-only route:", walkingError);
    }

    const routes: OptimizedRoutes = {
      "driving-car": {
        distanceMeters: driving.distanceMeters,
        durationSeconds: driving.durationSeconds,
        geometry: driving.geometry,
        legs: driving.legs,
      },
      ...(walking ? { "foot-walking": walking } : {}),
    };

    await supabase.from("trips").update({ optimized_route: routes }).eq("id", tripId);
  } catch (err) {
    if (err instanceof UnroutableCoordinateError) {
      const place = describeUnreachablePoint({ lat: err.lat, lng: err.lng }, origin, stops);
      return {
        error: `Can't calculate a route — ${place} isn't reachable by road (it may be on an island, or otherwise disconnected from the road network). Try removing it and recalculating.`,
      };
    }
    // Next.js's Server Action redaction (see comment above) means this is the only place this
    // ever gets logged — without it, a failure here is completely invisible from the outside.
    console.error("calculateRoute failed:", err);
    return { error: "Could not calculate the route. Please try again in a moment." };
  }

  // Order index updates are best-effort and run after the route is already saved — a failure here
  // only affects the visual ordering of stops in the list (the optimized_route already has the
  // correct sequence). Running them outside the try block means a transient DB error won't report
  // a fake "route failed" to the user when the route was in fact saved successfully.
  if (driving) {
    await Promise.all(
      driving.order.map((stopIndex: number, visitPosition: number) =>
        supabase.from("stops").update({ order_index: visitPosition }).eq("id", stops[stopIndex].id),
      ),
    );
  }

  revalidatePath(`/trips/${tripId}`);
  return {};
}
