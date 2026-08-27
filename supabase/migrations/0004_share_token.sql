-- Each trip gets a stable, unguessable share token so the owner can hand out a read-only link
-- (/trips/[id]/share?token=...) without requiring the viewer to have an account.
alter table trips add column share_token uuid not null default gen_random_uuid();
create unique index trips_share_token_idx on trips (share_token);

-- Superseded by trips.share_token — a single link per trip, not a token per membership row.
alter table trip_members drop column invite_token;
