"use client";

import { googleMapsDirectionsUrl } from "@/lib/utils";
import { ActionSheet, ActionSheetButton } from "./ActionSheet";

interface OpenInMapsSheetProps {
  stopName: string;
  lat: number;
  lng: number;
  onClose: () => void;
}

// The same iOS action-sheet pattern Safari uses for "Open in Maps" on a tapped address.
export function OpenInMapsSheet({ stopName, lat, lng, onClose }: OpenInMapsSheetProps) {
  return (
    <ActionSheet
      onClose={onClose}
      header={
        <>
          <p className="text-[0.8125rem] text-[var(--color-label-secondary)]">Get directions to</p>
          <p className="truncate text-[0.9375rem] font-medium">{stopName}</p>
        </>
      }
    >
      <ActionSheetButton
        onClick={() => {
          window.open(googleMapsDirectionsUrl(lat, lng), "_blank", "noopener,noreferrer");
          onClose();
        }}
      >
        Open in Google Maps
      </ActionSheetButton>
    </ActionSheet>
  );
}
