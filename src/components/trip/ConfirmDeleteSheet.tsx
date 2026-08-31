"use client";

import { useEffect, useState } from "react";

interface ConfirmDeleteSheetProps {
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

// Same iOS action-sheet chrome as OpenInMapsSheet, but for a destructive confirmation: the
// primary action reads in the destructive color instead of the accent, per Apple's HIG for a
// "this can't be undone from the dialog itself" choice.
export function ConfirmDeleteSheet({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}: ConfirmDeleteSheetProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      />

      <div
        className={`relative z-10 w-full max-w-md px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] transition-all duration-200 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="sheet-material ios-list overflow-hidden rounded-2xl text-center shadow-lg">
          <div className="px-4 py-3">
            <p className="truncate text-[0.9375rem] font-medium">{title}</p>
            {message && (
              <p className="mt-0.5 text-[0.8125rem] text-[var(--color-label-secondary)]">{message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="block min-h-[52px] w-full text-[1.0625rem] font-medium text-[var(--color-destructive)] active:bg-[var(--color-fill-secondary)]"
          >
            {confirmLabel}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="sheet-material mt-2 block min-h-[52px] w-full rounded-2xl text-[1.0625rem] font-semibold text-[var(--color-accent)] shadow-lg active:bg-[var(--color-fill-secondary)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
