"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { deleteTrip } from "@/app/trips/actions";
import { ChevronRightIcon, TrashIcon } from "@/components/ui/icons";
import type { Trip } from "@/types";

const REVEAL_WIDTH = 96; // px the reveal panel behind the card occupies when resting open
const COMMIT_DISTANCE = 200; // px of drag that commits a delete outright (a full swipe)
const VELOCITY_COMMIT = 500; // px/s flick speed that commits regardless of distance
const MOVE_THRESHOLD = 10; // px of hysteresis before a press counts as a drag rather than a click
const STALE_VELOCITY_MS = 100; // if the finger held still this long before lifting, ignore the last recorded velocity
const REDUCED_MOTION_FADE_MS = 180;
const UNDO_WINDOW_MS = 4000;
const SPRING = { type: "spring" as const, damping: 30, stiffness: 300 };

// Apple's rubber-band curve (Designing Fluid Interfaces, WWDC18) — see SwipeableStopRow, which
// this mirrors: same gesture, deleting a trip (cascades its stops) instead of a single stop, and
// tapping opens the trip instead of a directions sheet.
function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

interface DragState {
  startX: number;
  startValue: number;
  lastX: number;
  lastT: number;
  velocity: number;
  dragging: boolean;
}

export function SwipeableTripCard({ trip }: { trip: Trip }) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const dragState = useRef<DragState | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [undoVisible, setUndoVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout>>();
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>();
  const wasDraggingRef = useRef(false);

  useEffect(() => x.on("change", (latest) => {
    if (cardRef.current) cardRef.current.style.transform = `translateX(${latest}px)`;
  }), [x]);

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, []);

  function commitDelete() {
    setUndoVisible(true);
    undoTimer.current = setTimeout(async () => {
      setUndoVisible(false);
      await deleteTrip(trip.id);
    }, UNDO_WINDOW_MS);
  }

  function animateOutThenCommit(velocity = 0) {
    if (prefersReducedMotion) {
      setFadingOut(true);
      fadeTimer.current = setTimeout(() => {
        setHidden(true);
        commitDelete();
      }, REDUCED_MOTION_FADE_MS);
      return;
    }
    animate(x, -400, { ...SPRING, velocity }).then(() => {
      setHidden(true);
      commitDelete();
    });
  }

  function openRevealed(velocity = 0) {
    setRevealed(true);
    animate(x, -REVEAL_WIDTH, { ...SPRING, velocity });
  }

  function close(velocity = 0) {
    setRevealed(false);
    animate(x, 0, { ...SPRING, velocity });
  }

  function undo() {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoVisible(false);
    setHidden(false);
    x.set(0);
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (prefersReducedMotion || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    x.stop();
    dragState.current = {
      startX: e.clientX,
      startValue: x.get(),
      lastX: e.clientX,
      lastT: performance.now(),
      velocity: 0,
      dragging: false,
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const state = dragState.current;
    if (!state) return;

    const dx = e.clientX - state.startX;
    if (!state.dragging) {
      if (Math.abs(dx) < MOVE_THRESHOLD) return;
      state.dragging = true;
    }

    let next = state.startValue + dx;
    if (next < -COMMIT_DISTANCE) {
      const overshoot = -COMMIT_DISTANCE - next;
      next = -COMMIT_DISTANCE - rubberband(overshoot, COMMIT_DISTANCE);
    } else if (next > 0) {
      next = 0;
    }
    x.set(next);

    const now = performance.now();
    const dt = now - state.lastT;
    if (dt > 0) state.velocity = ((e.clientX - state.lastX) / dt) * 1000;
    state.lastX = e.clientX;
    state.lastT = now;
  }

  function handlePointerUp() {
    const state = dragState.current;
    dragState.current = null;
    if (!state?.dragging) return;
    wasDraggingRef.current = true;

    const velocity = performance.now() - state.lastT > STALE_VELOCITY_MS ? 0 : state.velocity;

    const value = x.get();
    if (value < -COMMIT_DISTANCE + 1 || velocity < -VELOCITY_COMMIT) {
      animateOutThenCommit(velocity);
    } else if (value < -REVEAL_WIDTH / 2) {
      openRevealed(velocity);
    } else {
      close(velocity);
    }
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
    <div className="relative overflow-hidden">
      <button
        type="button"
        onClick={() => animateOutThenCommit()}
        aria-hidden={!revealed}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-[var(--color-destructive)] text-white"
        style={{ width: REVEAL_WIDTH }}
      >
        <TrashIcon className="h-5 w-5" />
      </button>

      <button
        type="button"
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (wasDraggingRef.current) {
            wasDraggingRef.current = false;
            return;
          }
          if (revealed) {
            close();
            return;
          }
          router.push(`/trips/${trip.id}`);
        }}
        aria-label={trip.name}
        className="relative z-10 flex min-h-[60px] w-full items-center gap-3 bg-[var(--color-bg-elevated)] px-4 py-3 text-left active:bg-[var(--color-fill-secondary)]"
        style={
          prefersReducedMotion
            ? { opacity: fadingOut ? 0 : 1, transition: `opacity ${REDUCED_MOTION_FADE_MS}ms ease` }
            : { touchAction: "pan-y", cursor: "grab" }
        }
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[1.0625rem] font-medium">{trip.name}</p>
          <p className="text-[0.9375rem] text-[var(--color-label-secondary)]">
            {trip.start_date} – {trip.end_date}
          </p>
        </div>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-[var(--color-label-tertiary)]" />
      </button>
    </div>
  );
}
