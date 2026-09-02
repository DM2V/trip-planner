"use client";

import { useEffect, useState } from "react";

// Shown once per browser. A visitor who dismissed it shouldn't meet it again on every trip
// someone sends them, so the flag is deliberately not scoped to the trip id.
const STORAGE_KEY = "manhattan-project:shared-tour-seen";
// Breathing room between the highlighted element and the edge of the cut-out.
const SPOTLIGHT_PADDING = 8;
// Below this much room under the element, the card goes above it instead.
const MIN_SPACE_BELOW = 260;

interface TourStep {
  target: string;
  title: string;
  body: string;
}

// The optimized ordering and the per-stop time estimate only exist once a route has been
// calculated. A trip can be shared before that, so the copy can't promise either unconditionally.
function buildSteps(hasRoute: boolean): TourStep[] {
  return [
    {
      target: "summary",
      title: "Someone shared this trip with you",
      body: hasRoute
        ? "This is what they planned — the dates it covers, where it starts from, and roughly how long you'd get at each stop."
        : "This is what they planned — the dates it covers and where it starts from.",
    },
    {
      target: "map",
      title: hasRoute ? "The whole route" : "The whole trip",
      body: hasRoute
        ? "Every stop, ordered to keep total travel time down — worked out from real roads rather than straight lines."
        : "Every stop on the trip, pinned on the map.",
    },
    {
      target: "stops",
      title: "Tap any stop",
      body: "You can open it in Google Maps two ways: view the place itself for photos, hours and reviews, or get directions to it.",
    },
    {
      target: "save",
      title: "Make it your own",
      body: "Save your own copy to add, remove or reorder stops however you like. The trip you were sent stays exactly as it is.",
    },
  ];
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function targetElement(step: TourStep): Element | null {
  return document.querySelector(`[data-tour="${step.target}"]`);
}

export function SharedTripTour({ hasRoute }: { hasRoute: boolean }) {
  // Which steps actually have something to point at — the save/copy area differs between a
  // logged-in visitor and an anonymous one.
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // Private browsing or blocked site data — showing the tour is the safer failure.
    }
    if (seen) return;

    setSteps(buildSteps(hasRoute).filter((step) => targetElement(step)));
  }, [hasRoute]);

  const step = steps[index];

  // Re-measures every frame rather than on scroll/resize events. The page has a map that settles
  // after load, smooth-scrolls between steps, and reflows as images and fonts land — an event-based
  // approach leaves the cut-out visibly lagging behind its element through all of that.
  useEffect(() => {
    if (!step) return;

    let frame = 0;
    function measure() {
      const element = targetElement(step);
      if (element) {
        const next = element.getBoundingClientRect();
        setRect((previous) =>
          previous &&
          previous.top === next.top &&
          previous.left === next.left &&
          previous.width === next.width &&
          previous.height === next.height
            ? previous
            : { top: next.top, left: next.left, width: next.width, height: next.height },
        );
      }
      frame = requestAnimationFrame(measure);
    }

    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [step]);

  useEffect(() => {
    if (!step) return;
    targetElement(step)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step]);

  useEffect(() => {
    if (!step) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") finish();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  function finish() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Not being able to remember it is better than not being able to dismiss it.
    }
    setSteps([]);
    setIndex(0);
  }

  if (!step || !rect) return null;

  const isLast = index === steps.length - 1;
  const spaceBelow = window.innerHeight - (rect.top + rect.height);
  const cardBelow = spaceBelow >= MIN_SPACE_BELOW;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Shared trip tour">
      {/* Swallows taps on the page underneath so the tour can't be half-navigated away from. */}
      <div className="absolute inset-0" onClick={() => (isLast ? finish() : setIndex(index + 1))} />

      {/* The dimming is the ring around this box, not a layer over it — an enormous spread shadow
          darkens everything outside while leaving the element itself untouched and legible. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-xl transition-all duration-300 ease-out"
        style={{
          top: rect.top - SPOTLIGHT_PADDING,
          left: rect.left - SPOTLIGHT_PADDING,
          width: rect.width + SPOTLIGHT_PADDING * 2,
          height: rect.height + SPOTLIGHT_PADDING * 2,
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.68)",
        }}
      />

      <div
        className="absolute left-1/2 w-[min(21rem,calc(100vw-2rem))] -translate-x-1/2 transition-all duration-300 ease-out"
        style={
          cardBelow
            ? { top: rect.top + rect.height + SPOTLIGHT_PADDING + 12 }
            : { top: Math.max(16, rect.top - SPOTLIGHT_PADDING - 12 - 200) }
        }
      >
        <div className="sheet-material rounded-2xl px-4 py-4 shadow-lg">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {steps.map((_, dot) => (
              <span
                key={dot}
                className={`h-1.5 rounded-full transition-all ${
                  dot === index ? "w-4 bg-[var(--color-accent)]" : "w-1.5 bg-[var(--color-fill-secondary)]"
                }`}
              />
            ))}
          </div>

          <p className="mt-3 text-[1.0625rem] font-semibold">{step.title}</p>
          <p className="mt-1 text-[0.9375rem] leading-snug text-[var(--color-label-secondary)]">{step.body}</p>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={finish}
              className="min-h-[44px] px-1 text-[0.9375rem] text-[var(--color-label-secondary)]"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => (isLast ? finish() : setIndex(index + 1))}
              className="min-h-[44px] rounded-full bg-[var(--color-accent)] px-5 text-[0.9375rem] font-semibold text-white"
            >
              {isLast ? "Got it" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
