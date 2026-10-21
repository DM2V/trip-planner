"use client";

import { useState, useTransition } from "react";
import { resetShareLink } from "@/app/trips/actions";
import { ConfirmDeleteSheet } from "@/components/trip/ConfirmDeleteSheet";
import { ListSection } from "@/components/ui/List";

const FOOTER =
  "Anyone with your current link, and anyone who saved this trip, loses access. Share the trip again afterwards to give people the new link.";

export function ResetShareLinkButton({ tripId }: { tripId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <div className="px-4">
      <ListSection footer={done ? "Done — the old link no longer works." : FOOTER}>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setDone(false);
            setConfirmOpen(true);
          }}
          className="flex min-h-[52px] w-full items-center justify-center text-[1.0625rem] font-medium text-[var(--color-destructive)] active:bg-[var(--color-fill-secondary)] disabled:opacity-50"
        >
          {isPending ? "Resetting..." : "Reset Share Link"}
        </button>
      </ListSection>
      {error && <p className="px-4 pt-2 text-[0.8125rem] text-[var(--color-destructive)]">{error}</p>}

      {confirmOpen && (
        <ConfirmDeleteSheet
          title="Reset share link?"
          message="The current link stops working and people who saved this trip lose access. This can't be undone."
          confirmLabel="Reset Link"
          onConfirm={() => {
            setError(null);
            startTransition(async () => {
              try {
                const result = await resetShareLink(tripId);
                if (result.error) setError(result.error);
                else setDone(true);
              } catch {
                setError("Could not reset the share link. Please try again.");
              }
            });
          }}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
