"use client";

import { useEffect } from "react";

// The service worker keeps pages for offline use (public/sw.js), and those pages hold the
// signed-in person's trips. Logging out, deleting the account and an expired session all end on
// the login page, so this is where they stop being readable to the next person on the device.
export function ClearOfflineCache() {
  useEffect(() => {
    if (!("caches" in window)) return;
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      // Some private-browsing modes refuse access to the cache outright; there is nothing to clear.
      .catch(() => {});
  }, []);

  return null;
}
