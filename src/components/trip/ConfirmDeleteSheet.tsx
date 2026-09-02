"use client";

import { ActionSheet, ActionSheetButton } from "./ActionSheet";

interface ConfirmDeleteSheetProps {
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

// A destructive confirmation: the primary action reads in the destructive color instead of the
// accent, per Apple's HIG for a "this can't be undone from the dialog itself" choice.
export function ConfirmDeleteSheet({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}: ConfirmDeleteSheetProps) {
  return (
    <ActionSheet
      onClose={onClose}
      header={
        <>
          <p className="truncate text-[0.9375rem] font-medium">{title}</p>
          {message && (
            <p className="mt-0.5 text-[0.8125rem] text-[var(--color-label-secondary)]">{message}</p>
          )}
        </>
      }
    >
      <ActionSheetButton
        tone="destructive"
        onClick={() => {
          onConfirm();
          onClose();
        }}
      >
        {confirmLabel}
      </ActionSheetButton>
    </ActionSheet>
  );
}
