-- Minimal public profile, 1:1 with auth.users (managed by Supabase Auth).
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  origin_label text not null,
  origin_lat double precision not null,
  origin_lng double precision not null,
  optimized_route jsonb,
  created_at timestamptz not null default now()
);

create table stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  order_index int,
  created_at timestamptz not null default now()
);

create table trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  user_id uuid references profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'viewer')),
  invite_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

-- Row Level Security: every table is locked down by default until the policies below open it up.
alter table profiles enable row level security;
alter table trips enable row level security;
alter table stops enable row level security;
alter table trip_members enable row level security;

create policy "profiles: read own profile" on profiles
  for select using (auth.uid() = id);

create policy "profiles: update own profile" on profiles
  for update using (auth.uid() = id);

create policy "trips: owner has full control" on trips
  for all using (auth.uid() = owner_id);

create policy "trips: viewers can read" on trips
  for select using (
    exists (
      select 1 from trip_members
      where trip_members.trip_id = trips.id
        and trip_members.user_id = auth.uid()
    )
  );

create policy "stops: access if you have access to the trip" on stops
  for all using (
    exists (
      select 1 from trips
      where trips.id = stops.trip_id and trips.owner_id = auth.uid()
    )
  );

create policy "stops: viewers can read" on stops
  for select using (
    exists (
      select 1 from trip_members
      where trip_members.trip_id = stops.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

create policy "trip_members: owner manages guests" on trip_members
  for all using (
    exists (
      select 1 from trips
      where trips.id = trip_members.trip_id and trips.owner_id = auth.uid()
    )
  );

create policy "trip_members: a member can see themselves" on trip_members
  for select using (auth.uid() = user_id);
