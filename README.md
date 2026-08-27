# Trip Planner

Mobile-first web app (PWA) that calculates the optimal route between multiple places on a trip,
saves it, and shares it (read-only) with friends.

## Stack

- Next.js + TypeScript + Tailwind CSS
- Motion (spring-based gestures — swipe-to-delete)
- MapLibre GL JS + CARTO basemaps (no API key required, free minimalist tiles)
- OpenRouteService Optimization API (solves the optimal stop order) + Geocoding API (place search) —
  one free API key, email signup only, no credit card
- Supabase (Postgres + Auth + Row Level Security)

## Local setup

1. Install Node.js LTS (18+): https://nodejs.org
2. `npm install`
3. `cp .env.example .env.local` and fill in the keys:
   - Supabase: Project Settings → API Keys (`anon key`, `service_role key`) and
     Integrations → Data API (`Project URL`)
   - OpenRouteService: sign up at openrouteservice.org/dev/#/signup (email only) → Dashboard → API key
4. Apply the schema: paste the contents of each file in `supabase/migrations/` (in order,
   `0001_init.sql` through the highest-numbered one) into the SQL Editor of your Supabase project
   (or use `supabase db push` if you have the CLI installed). Skipping the later migrations leaves
   signup, viewing shared trips, and the share feature itself broken.
5. `npm run dev` → http://localhost:3000

## Key security

- `NEXT_PUBLIC_*` variables ship to the browser — they're safe to expose because actual data
  access is controlled by Row Level Security in Postgres, not by the secrecy of the key.
- `SUPABASE_SERVICE_ROLE_KEY` must **never** get the `NEXT_PUBLIC_` prefix or be used outside of
  one-off server-side admin tasks — it bypasses RLS entirely.
- `ORS_API_KEY` also has no `NEXT_PUBLIC_` prefix on purpose — unlike Mapbox's public tokens,
  OpenRouteService keys aren't meant to be restricted by domain, so all calls go through the
  `/api/places-search` route and the `calculateRoute` server action instead of straight from
  the browser.
- `.env.local` is in `.gitignore`. Never commit an `.env` file with real values; always use
  `.env.example` as the template in the repo.

## Structure

```
src/
  app/            Routes (App Router): auth, trips, API routes
  components/     UI by domain: map/, trip/, ui/
  lib/            Supabase client and OpenRouteService optimization call
  types/          Shared types (Trip, Stop, TripMember)
  hooks/          React hooks (geolocation, etc.)
supabase/
  migrations/     SQL schema + Row Level Security policies
```

## Roadmap

See the phase plan from the project conversation. Summary:

0. Account setup + scaffold (this commit)
1. Trip and stop CRUD
2. Map and place search integration
3. Optimal route calculation
4. Trip sharing (read-only link)
5. Visual polish + PWA + deploy to Vercel
