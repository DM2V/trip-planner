-- Fixes "infinite recursion detected in policy for relation trips" (Postgres 42P17).
-- Cause: the trips "viewers can read" policy queries trip_members, and the trip_members
-- "owner manages guests" policy queries trips back — a cycle between the two tables' RLS.
-- Fix: move each cross-table check into a SECURITY DEFINER function. Such a function runs
-- with its owner's privileges (the migration author, typically exempt from RLS), so it reads
-- the other table directly instead of re-entering that table's policies.

create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from trip_members
    where trip_members.trip_id = p_trip_id
      and trip_members.user_id = auth.uid()
  );
$$;

create or replace function public.is_trip_owner(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from trips
    where trips.id = p_trip_id
      and trips.owner_id = auth.uid()
  );
$$;

drop policy "trips: viewers can read" on trips;
create policy "trips: viewers can read" on trips
  for select using (is_trip_member(id));

drop policy "stops: viewers can read" on stops;
create policy "stops: viewers can read" on stops
  for select using (is_trip_member(trip_id));

drop policy "trip_members: owner manages guests" on trip_members;
create policy "trip_members: owner manages guests" on trip_members
  for all using (is_trip_owner(trip_id));
