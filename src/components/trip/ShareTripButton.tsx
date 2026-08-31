"use client";

import { useState } from "react";
import { CheckIcon, ShareIcon } from "@/components/ui/icons";

// Only ever rendered floating over the map (see the trip detail page's .map-chrome bar), which is
// always light — fixed iOS systemBlue/systemGreen values, not the app's own light/dark tokens,
// same reasoning as the fixed colors in MapView.tsx.
export function ShareTripButton({ tripId, shareToken }: { tripId: string; shareToken: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-label={copied ? "Link copied" : "Share trip"}
      onClick={async () => {
        const url = `${window.location.origin}/trips/${tripId}/share?token=${shareToken}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex h-11 w-11 items-center justify-center text-[#007aff] active:opacity-60"
    >
      {copied ? (
        <CheckIcon className="h-5 w-5 text-[#34c759]" />
      ) : (
        <ShareIcon className="h-5 w-5" />
      )}
    </button>
  );
}
