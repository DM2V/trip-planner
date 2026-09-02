"use client";

import { useEffect, useState } from "react";

interface RouteTypeSheetProps {
  onSelect: (roundTrip: boolean) => void;
  onClose: () => void;
}

// Same iOS action-sheet chrome as ConfirmDeleteSheet/OpenInMapsSheet, but offering a real choice
// between two options instead of confirm-or-cancel — asked every time "Calculate Optimal Route"
// is tapped, since the answer can reasonably differ trip to trip (or even calculation to
// calculation, if the user just wants to compare both).
export function RouteTypeSheet({ onSelect, onClose }: RouteTypeSheetProps) {
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
            <p className="truncate text-[0.9375rem] font-medium">Return to your starting point?</p>
            <p className="mt-0.5 text-[0.8125rem] text-[var(--color-label-secondary)]">
              Choose whether the route should end back where you started, or just at the last stop.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(true);
              onClose();
            }}
            className="block min-h-[52px] w-full text-[1.0625rem] font-medium text-[var(--color-accent)] active:bg-[var(--color-fill-secondary)]"
          >
            Yes, round trip
          </button>
          <button
            type="button"
            onClick={() => {
              onSelect(false);
              onClose();
            }}
            className="block min-h-[52px] w-full text-[1.0625rem] font-medium text-[var(--color-accent)] active:bg-[var(--color-fill-secondary)]"
          >
            No, end at the last stop
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
