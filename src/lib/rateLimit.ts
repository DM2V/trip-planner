// Per-instance in-memory sliding-window rate limiter. Each Vercel function instance tracks its
// own window independently, so the effective limit across a deployment may be higher than the
// numbers here. That's acceptable: the goal is to slow down a single abusive session, not to
// enforce a hard global cap. A hard cap would need an external store (Redis / KV).
//
// Keyed by user ID (from the Supabase session), so one user can't exhaust another's quota.

interface Window {
  timestamps: number[];
}

const store = new Map<string, Window>();

// Remove entries that haven't been touched in more than windowMs to avoid unbounded growth.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const cutoff = Date.now() - CLEANUP_INTERVAL_MS;
  for (const [key, win] of store) {
    if ((win.timestamps.at(-1) ?? 0) < cutoff) store.delete(key);
  }
}, CLEANUP_INTERVAL_MS).unref?.();

/**
 * Returns true if the request is within the allowed rate, false if it should be rejected.
 * @param key      Opaque identifier (e.g. user ID + endpoint name).
 * @param limit    Maximum number of requests allowed in `windowMs`.
 * @param windowMs Sliding window duration in milliseconds.
 */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  let win = store.get(key);
  if (!win) {
    win = { timestamps: [] };
    store.set(key, win);
  }

  // Drop timestamps outside the current window.
  win.timestamps = win.timestamps.filter((t) => t > cutoff);

  if (win.timestamps.length >= limit) return false;

  win.timestamps.push(now);
  return true;
}
