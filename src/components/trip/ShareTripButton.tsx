"use client";

import { useState } from "react";
import { CheckIcon, ShareIcon } from "@/components/ui/icons";

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
      className="flex h-11 w-11 items-center justify-center text-[var(--color-accent)] active:opacity-60"
    >
      {copied ? (
        <CheckIcon className="h-5 w-5 text-[var(--color-success)]" />
      ) : (
        <ShareIcon className="h-5 w-5" />
      )}
    </button>
  );
}
