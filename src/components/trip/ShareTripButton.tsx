"use client";

import { useState } from "react";
import { CheckIcon, ShareIcon } from "@/components/ui/icons";

// Only ever rendered floating over the map as its own glass pill (see the trip detail page's
// .map-chrome), which is always light — fixed iOS systemBlue/systemGreen values, not the app's
// own light/dark tokens, same reasoning as the fixed colors in MapView.tsx.
export function ShareTripButton({
  tripId,
  tripName,
  shareToken,
}: {
  tripId: string;
  tripName: string;
  shareToken: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={copied ? "Link copied" : "Share trip"}
        onClick={async () => {
          const url = `${window.location.origin}/trips/${tripId}/share?token=${shareToken}`;

          // navigator.share opens the OS-native share sheet (AirDrop, Messages, Mail, etc. on
          // iOS Safari). Only available in secure contexts and a subset of browsers, and it can
          // also reject for reasons other than the user cancelling (e.g. no share target chosen
          // is fine, but some embedded/in-app browsers report support yet always reject) — in
          // every one of those non-cancel cases we still want the copy-link fallback to fire
          // instead of silently doing nothing.
          if (navigator.share) {
            try {
              await navigator.share({ title: tripName, url });
              return;
            } catch (error) {
              if (error instanceof Error && error.name === "AbortError") return;
            }
          }

          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="map-chrome flex h-11 w-11 items-center justify-center rounded-full text-[#007aff] active:opacity-60"
      >
        {copied ? (
          <CheckIcon className="h-5 w-5 text-[#34c759]" />
        ) : (
          <ShareIcon className="h-5 w-5" />
        )}
      </button>

      {copied && (
        <span className="map-chrome pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.8125rem] font-medium text-[#34c759]">
          Link copied
        </span>
      )}
    </div>
  );
}
