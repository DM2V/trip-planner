"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { deleteTrip } from "@/app/trips/actions";
import { ConfirmDeleteSheet } from "@/components/trip/ConfirmDeleteSheet";
import { ChevronRightIcon, TrashIcon } from "@/components/ui/icons";
import { formatDateRange } from "@/lib/utils";
import type { Trip } from "@/types";

const UNDO_WINDOW_MS = 4000;

// Plain row, no swipe gesture — see StopRow for why. The trash icon opens a confirmation sheet
// first (deleting a whole trip cascades its stops, so it warrants an explicit "are you sure?"),
// then the same undo window as a stop delete runs as an extra safety net.
export function TripCard({ trip }: { trip: Trip }) {
  const [hidden, setHidden] = useState(false);
  const [undoVisible, setUndoVisible] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
      await deleteTrip(trip.id);
    }, UNDO_WINDOW_MS);
  }

  function undo() {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoVisible(false);
    setHidden(false);
  }

  if (undoVisible) {
    return (
      <div className="flex min-h-[60px] items-center justify-between px-4 py-3">
        <span className="text-[0.9375rem] text-[var(--color-label-secondary)]">
          Removed &ldquo;{trip.name}&rdquo;
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
      <div className="flex min-h-[60px] items-center bg-[var(--color-bg-elevated)]">
        <Link
          href={`/trips/${trip.id}`}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 active:bg-[var(--color-fill-secondary)]"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[1.0625rem] font-medium">{trip.name}</p>
            <p className="text-[0.9375rem] text-[var(--color-label-secondary)]">
              {formatDateRange(trip.start_date, trip.end_date)}
            </p>
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-[var(--color-label-tertiary)]" />
        </Link>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label={`Delete ${trip.name}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center pr-4 text-[var(--color-destructive)] active:opacity-50"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>

      {confirmOpen && (
        <ConfirmDeleteSheet
          title={`Delete "${trip.name}"?`}
          message="This also deletes all of its stops. You'll have a few seconds to undo right after."
          confirmLabel="Delete Trip"
          onConfirm={handleDelete}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
