"use client";

import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/ui/icons";

type ThemePreference = "system" | "light" | "dark";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function applyTheme(preference: ThemePreference) {
  if (preference === "system") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem("theme");
  } else {
    document.documentElement.setAttribute("data-theme", preference);
    localStorage.setItem("theme", preference);
  }

  // Keep the browser chrome (address bar / status bar) color in sync with the forced theme too.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      preference === "dark" ||
        (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "#000000"
        : "#f2f2f7",
    );
  }
}

// Fixed light/dark swatch colors, not the app's own theme tokens — this has to depict what each
// mode literally looks like regardless of which one is currently active, the same reasoning as
// the fixed colors in MapView.tsx.
function ThemePreviewSwatch({ variant }: { variant: ThemePreference }) {
  if (variant === "system") {
    return (
      <div className="flex h-full w-full">
        <div className="flex h-full w-1/2 flex-col gap-1 bg-[#f2f2f7] p-2">
          <div className="h-1.5 w-full rounded-full bg-[#c7c7cc]" />
          <div className="h-1.5 w-2/3 rounded-full bg-[#d1d1d6]" />
        </div>
        <div className="flex h-full w-1/2 flex-col gap-1 bg-[#1c1c1e] p-2">
          <div className="h-1.5 w-full rounded-full bg-[#48484a]" />
          <div className="h-1.5 w-2/3 rounded-full bg-[#3a3a3c]" />
        </div>
      </div>
    );
  }

  const light = variant === "light";
  return (
    <div className="flex h-full w-full flex-col gap-1 p-2" style={{ background: light ? "#f2f2f7" : "#1c1c1e" }}>
      <div className="h-1.5 w-full rounded-full" style={{ background: light ? "#c7c7cc" : "#48484a" }} />
      <div className="h-1.5 w-2/3 rounded-full" style={{ background: light ? "#d1d1d6" : "#3a3a3c" }} />
      <div className="h-1.5 w-1/2 rounded-full" style={{ background: light ? "#d1d1d6" : "#3a3a3c" }} />
    </div>
  );
}

// In-app override for the OS-level light/dark preference — most iOS apps just follow the
// system, but some (like this one) also offer a manual switch. Persisted per device. Modeled on
// Settings > Display & Brightness's own appearance picker: a small live preview of each mode
// beats reading plain text labels.
export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage only exists in the browser; reading it during render would mismatch the server HTML
      setPreference(stored);
      // The inline <head> script already set data-theme before paint, but it can't touch the
      // theme-color meta tag — sync that here so a persisted override is reflected immediately
      // on load, not just after the next click on this toggle.
      applyTheme(stored);
    }
  }, []);

  return (
    <div className="grid grid-cols-3 gap-3">
      {OPTIONS.map((option) => {
        const selected = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setPreference(option.value);
              applyTheme(option.value);
            }}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className={`relative h-14 w-full overflow-hidden rounded-xl border-2 transition-colors ${
                selected ? "border-(--color-accent)" : "border-transparent"
              }`}
            >
              <ThemePreviewSwatch variant={option.value} />
              {selected && (
                <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-(--color-accent) text-white">
                  <CheckIcon className="h-2.5 w-2.5" />
                </span>
              )}
            </div>
            <span
              className={`text-[0.8125rem] font-medium ${
                selected ? "text-(--color-label)" : "text-(--color-label-secondary)"
              }`}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
