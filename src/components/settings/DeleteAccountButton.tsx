"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/settings/actions";
import { ConfirmDeleteSheet } from "@/components/trip/ConfirmDeleteSheet";

export function DeleteAccountButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirmOpen(true)}
        className="flex min-h-[52px] w-full items-center justify-center text-[1.0625rem] font-medium text-[var(--color-destructive)] active:bg-[var(--color-fill-secondary)] disabled:opacity-50"
      >
        {isPending ? "Deleting Account..." : "Delete Account"}
      </button>
      {error && <p className="px-4 pb-3 text-[0.8125rem] text-[var(--color-destructive)]">{error}</p>}

      {confirmOpen && (
        <ConfirmDeleteSheet
          title="Delete Account?"
          message="This permanently deletes your account, all your trips, and everything shared from them. This can't be undone."
          confirmLabel="Delete Account"
          onConfirm={() => {
            setError(null);
            startTransition(async () => {
              try {
                const result = await deleteAccount();
                // On success, deleteAccount() redirects server-side — this only runs on failure.
                if (result?.error) setError(result.error);
              } catch {
                // deleteAccount() only converts the expected admin-delete failure into { error };
                // anything else (e.g. a genuinely unexpected throw) lands here instead of as an
                // unhandled rejection with no feedback at all.
                setError("Could not delete your account. Please try again.");
              }
            });
          }}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
