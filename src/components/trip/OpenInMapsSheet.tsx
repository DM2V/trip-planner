"use client";

import { useEffect, useState } from "react";
import { googleMapsDirectionsUrl } from "@/lib/utils";

interface OpenInMapsSheetProps {
  stopName: string;
  lat: number;
  lng: number;
  onClose: () => void;
}

// iOS action-sheet pattern (the same one Safari uses for "Open in Maps" on a tapped address):
// a dimming scrim over a sheet anchored to the bottom, with the destructive-free primary action
// and a separate Cancel row below it.
export function OpenInMapsSheet({ stopName, lat, lng, onClose }: OpenInMapsSheetProps) {
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
        <div className="ios-list overflow-hidden rounded-2xl bg-[var(--color-bg-elevated)] text-center shadow-lg">
          <div className="px-4 py-3">
            <p className="text-[0.8125rem] text-[var(--color-label-secondary)]">Get directions to</p>
            <p className="truncate text-[0.9375rem] font-medium">{stopName}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.open(googleMapsDirectionsUrl(lat, lng), "_blank", "noopener,noreferrer");
              onClose();
            }}
            className="block min-h-[52px] w-full text-[1.0625rem] font-medium text-[var(--color-accent)] active:bg-[var(--color-fill-secondary)]"
          >
            Open in Google Maps
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-2 block min-h-[52px] w-full rounded-2xl bg-[var(--color-bg-elevated)] text-[1.0625rem] font-semibold text-[var(--color-accent)] shadow-lg active:bg-[var(--color-fill-secondary)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
