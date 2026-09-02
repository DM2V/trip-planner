"use client";

import { googleMapsDirectionsUrl, googleMapsPlaceUrl } from "@/lib/utils";
import { ActionSheet, ActionSheetButton } from "./ActionSheet";

interface OpenInMapsSheetProps {
  stopName: string;
  lat: number;
  lng: number;
  onClose: () => void;
}

// The same iOS action-sheet pattern Safari uses for "Open in Maps" on a tapped address. Offers
// both readings of tapping a stop: looking up what's actually there, and planning how to reach it.
export function OpenInMapsSheet({ stopName, lat, lng, onClose }: OpenInMapsSheetProps) {
  function openInMaps(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <ActionSheet
      onClose={onClose}
      header={<p className="truncate text-[0.9375rem] font-medium">{stopName}</p>}
    >
      <ActionSheetButton onClick={() => openInMaps(googleMapsPlaceUrl(lat, lng))}>
        View Place
      </ActionSheetButton>
      <ActionSheetButton onClick={() => openInMaps(googleMapsDirectionsUrl(lat, lng))}>
        Get Directions
      </ActionSheetButton>
    </ActionSheet>
  );
}
