"use client";

import { ActionSheet, ActionSheetButton } from "./ActionSheet";

interface RouteTypeSheetProps {
  onSelect: (roundTrip: boolean) => void;
  onClose: () => void;
}

// Offers a real choice between two options instead of confirm-or-cancel — asked every time
// "Calculate Optimal Route" is tapped, since the answer can reasonably differ trip to trip (or
// even calculation to calculation, if the user just wants to compare both).
export function RouteTypeSheet({ onSelect, onClose }: RouteTypeSheetProps) {
  return (
    <ActionSheet
      onClose={onClose}
      header={
        <>
          <p className="truncate text-[0.9375rem] font-medium">Return to your starting point?</p>
          <p className="mt-0.5 text-[0.8125rem] text-[var(--color-label-secondary)]">
            Choose whether the route should end back where you started, or just at the last stop.
          </p>
        </>
      }
    >
      <ActionSheetButton
        onClick={() => {
          onSelect(true);
          onClose();
        }}
      >
        Yes, round trip
      </ActionSheetButton>
      <ActionSheetButton
        onClick={() => {
          onSelect(false);
          onClose();
        }}
      >
        No, end at the last stop
      </ActionSheetButton>
    </ActionSheet>
  );
}
