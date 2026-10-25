"use client";

import { useState } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { CheckIcon, ShareIcon } from "@/components/ui/icons";

export function ShareTripButton({
  tripId,
  tripName,
  shareToken,
  // "icon" sits in the title row; "full" is a labelled row for the bottom of the page, where
  // someone who has just calculated a route is at the natural moment to send it to someone.
  // Both share one implementation because the share/clipboard fallback logic below has enough
  // edge cases that a second copy would drift.
  variant = "icon",
}: {
  tripId: string;
  tripName: string;
  shareToken: string;
  variant?: "icon" | "full";
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={variant === "full" ? "relative flex flex-col items-center" : "relative"}>
      <button
        type="button"
        aria-label={copied ? "Link copied" : "Share trip"}
        onClick={async () => {
          setError(false);
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
            } catch (shareError) {
              if (shareError instanceof Error && shareError.name === "AbortError") return;
            }
          }

          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // Clipboard access can be denied outright (permissions policy, an insecure context,
            // some in-app browsers) — this was previously an uncaught rejection with no feedback
            // at all, silently doing nothing from the user's perspective.
            setError(true);
            setTimeout(() => setError(false), 2000);
          }
        }}
        className={
          variant === "full"
            ? buttonClassName("secondary", "w-full")
            : "flex h-11 w-11 shrink-0 items-center justify-center text-(--color-accent) active:opacity-50"
        }
      >
        {copied ? (
          <CheckIcon className="h-5 w-5 text-(--color-success)" />
        ) : (
          <ShareIcon className="h-5 w-5" />
        )}
        {variant === "full" && (copied ? "Link Copied" : "Share This Trip")}
      </button>

      {variant === "full" && !copied && !error && (
        <p className="mt-2 text-center text-[0.8125rem] text-(--color-label-secondary)">
          Anyone with the link can open it — no account needed.
        </p>
      )}

      {/* The full variant says "Link Copied" on the button itself, so the floating confirmation
          would just repeat it; the failure case still needs somewhere to speak. */}
      {copied && variant === "icon" && (
        <span className="tinted-success pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.8125rem] font-medium">
          Link copied
        </span>
      )}

      {error && (
        <span
          className={`tinted-error pointer-events-none whitespace-nowrap rounded-full px-3 py-1.5 text-[0.8125rem] font-medium ${
            variant === "full" ? "mt-2" : "absolute right-0 top-full mt-1"
          }`}
        >
          Couldn&rsquo;t copy link
        </span>
      )}
    </div>
  );
}
