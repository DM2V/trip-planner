"use client";

import { useEffect, useRef, useState } from "react";
import { deleteStop } from "@/app/trips/actions";
import { ConfirmDeleteSheet } from "@/components/trip/ConfirmDeleteSheet";
import { OpenInMapsSheet } from "@/components/trip/OpenInMapsSheet";
import { TrashIcon } from "@/components/ui/icons";
import type { Stop } from "@/types";

const UNDO_WINDOW_MS = 4000;

interface StopRowProps {
  tripId: string;
  stop: Stop;
  position: number;
}

// Plain row, no swipe gesture — the trash icon is always right there, and tapping the name opens
// a Google Maps directions sheet. A custom pointer-tracked swipe kept misreading an ordinary
// vertical scroll as a horizontal drag; a fixed button sidesteps that class of bug entirely.
export function StopRow({ tripId, stop, position }: StopRowProps) {
  const [hidden, setHidden] = useState(false);
  const [undoVisible, setUndoVisible] = useState(false);
  const [mapsSheetOpen, setMapsSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout>>();

  // If the row unmounts (navigated away) before the undo window closes, cancel the pending
  // deletion rather than deleting silently in the background after the user has left.
  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  function handleDelete() {
    setHidden(true);
    setUndoVisible(true);
    undoTimer.current = setTimeout(async () => {
      setUndoVisible(false);
      await deleteStop(tripId, stop.id);
    }, UNDO_WINDOW_MS);
  }

  function undo() {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoVisible(false);
    setHidden(false);
  }

  if (undoVisible) {
    return (
      <div className="flex min-h-[52px] items-center justify-between px-4 py-2.5">
        <span className="text-[0.9375rem] text-[var(--color-label-secondary)]">
          Removed &ldquo;{stop.name}&rdquo;
        </span>
        <button type="button" onClick={undo} className="text-[0.9375rem] font-medium text-[var(--color-accent)]">
          Undo
        </button>
      </div>
    );
  }

  if (hidden) return null;

  return (
    <>
      <div className="flex min-h-[52px] items-center bg-[var(--color-bg-elevated)]">
        <button
          type="button"
          onClick={() => setMapsSheetOpen(true)}
          aria-label={`${stop.name}, open directions in Google Maps`}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left active:bg-[var(--color-fill-secondary)]"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[0.8125rem] font-semibold text-white">
            {position}
          </span>
          <span className="flex-1 truncate text-[1.0625rem]">{stop.name}</span>
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label={`Remove ${stop.name}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center pr-4 text-[var(--color-destructive)] active:opacity-50"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>

      {mapsSheetOpen && (
        <OpenInMapsSheet
          stopName={stop.name}
          lat={stop.lat}
          lng={stop.lng}
          onClose={() => setMapsSheetOpen(false)}
        />
      )}

      {confirmOpen && (
        <ConfirmDeleteSheet
          title={`Delete "${stop.name}"?`}
          confirmLabel="Delete Stop"
          onConfirm={handleDelete}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
