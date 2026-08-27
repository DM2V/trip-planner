import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses Row Level Security entirely. Only for server-side code that has
// already checked authorization itself (e.g. matching a trip's share_token) before querying —
// never for a query built straight from unchecked user input.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
