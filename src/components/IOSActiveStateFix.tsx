"use client";

import { useEffect } from "react";

// WebKit only applies CSS :active styles on tap if some ancestor has a touchstart listener.
// Without this, every active:opacity-*/active:bg-* press state in the app is silently dead on
// iPhone/iPad — the single biggest "kill latency" miss per Apple's own interface guidelines.
export function IOSActiveStateFix() {
  useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);

  return null;
}
