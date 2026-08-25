import { createBrowserClient } from "@supabase/ssr";

// Client for browser components ('use client'). Uses the anon key — safe to expose,
// actual access is controlled by the Row Level Security policies on each table.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
