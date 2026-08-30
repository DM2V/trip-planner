"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { deleteStop } from "@/app/trips/actions";
import { TrashIcon } from "@/components/ui/icons";
import { googleMapsDirectionsUrl } from "@/lib/utils";
import type { Stop } from "@/types";

const REVEAL_WIDTH = 96; // px the reveal panel behind the row occupies when resting open
const COMMIT_DISTANCE = 200; // px of drag that commits a delete outright (a full swipe)
const VELOCITY_COMMIT = 500; // px/s flick speed that commits regardless of distance
const MOVE_THRESHOLD = 10; // px of hysteresis before a press counts as a drag rather than a click
const STALE_VELOCITY_MS = 100; // if the finger held still this long before lifting, ignore the last recorded velocity
const REDUCED_MOTION_FADE_MS = 180;
const UNDO_WINDOW_MS = 4000;
const SPRING = { type: "spring" as const, damping: 30, stiffness: 300 };

// Apple's rubber-band curve (Designing Fluid Interfaces, WWDC18): resistance grows the further
// past the boundary you pull, asymptotically approaching `dimension * constant` rather than
// either stopping dead or following the finger 1:1 forever.
function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

interface SwipeableStopRowProps {
  tripId: string;
  stop: Stop;
  position: number;
}

interface DragState {
  startX: number;
  startValue: number;
  lastX: number;
  lastT: number;
  velocity: number;
  dragging: boolean;
}

// Swipe-to-delete, the emblematic iOS list gesture (Mail, Reminders) — built on raw Pointer
// Events (setPointerCapture, 1:1 tracking, a manual rubber-band past the limit, velocity handoff
// into the release spring) rather than a gesture-recognizer library's `drag` prop, so every part
// of the physics is plain, debuggable code.
export function SwipeableStopRow({ tripId, stop, position }: SwipeableStopRowProps) {
  const prefersReducedMotion = useReducedMotion();
  const rowRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const dragState = useRef<DragState | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [undoVisible, setUndoVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout>>();
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>();
  // handlePointerUp already knows whether this gesture was a drag, but it clears dragState
  // before the browser's own synthesized click fires — remember it here so the click handler
  // can tell a real tap (open directions) apart from the tail end of a swipe.
  const wasDraggingRef = useRef(false);

  // Paint x on the row directly — sidesteps any framework-level style-merging ambiguity.
  useEffect(() => x.on("change", (latest) => {
    if (rowRef.current) rowRef.current.style.transform = `translateX(${latest}px)`;
  }), [x]);

  // If the row unmounts (navigated away) before the undo window closes, cancel the pending
  // deletion rather than deleting silently in the background after the user has left.
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
      await deleteStop(tripId, stop.id);
    }, UNDO_WINDOW_MS);
  }

  function animateOutThenCommit(velocity = 0) {
    if (prefersReducedMotion) {
      // No slide for reduced motion, but a bare instant disappearance is still jarring and
      // gives no completion feedback — cross-fade instead, per the reduced-motion guidance.
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
    // Cancel any in-flight release spring so a re-grab mid-animation hands control back to the
    // finger immediately instead of fighting the animation for the next few frames — interruption
    // only works if input always wins over whatever motion is currently playing.
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
      // Rubber-band: resistance increases the further past the limit you pull.
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

    // The last recorded velocity is only meaningful if the finger was still moving right up to
    // release — if it came to rest and paused before lifting, that stale reading would otherwise
    // misrepresent the actual (zero) intent at release.
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
        ref={rowRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          // A click firing right after a drag is the browser's own click synthesis following
          // the swipe gesture, not a deliberate tap — swallow it once rather than also opening
          // directions.
          if (wasDraggingRef.current) {
            wasDraggingRef.current = false;
            return;
          }
          if (revealed) {
            close();
            return;
          }
          window.open(googleMapsDirectionsUrl(stop.lat, stop.lng), "_blank", "noopener,noreferrer");
        }}
        aria-label={`${stop.name}, open directions in Google Maps`}
        className="relative z-10 flex min-h-[52px] w-full items-center gap-3 bg-[var(--color-bg-elevated)] px-4 py-2.5 text-left active:bg-[var(--color-fill-secondary)]"
        style={
          prefersReducedMotion
            ? { opacity: fadingOut ? 0 : 1, transition: `opacity ${REDUCED_MOTION_FADE_MS}ms ease` }
            : { touchAction: "pan-y", cursor: "grab" }
        }
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[0.8125rem] font-semibold text-white">
          {position}
        </span>
        <span className="flex-1 truncate text-[1.0625rem]">{stop.name}</span>
      </button>
    </div>
  );
}
