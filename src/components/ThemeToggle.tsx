"use client";

import { useEffect, useState } from "react";

type ThemePreference = "system" | "light" | "dark";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
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

// In-app override for the OS-level light/dark preference — most iOS apps just follow the
// system, but some (like this one) also offer a manual switch. Persisted per device.
export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setPreference(stored);
      // The inline <head> script already set data-theme before paint, but it can't touch the
      // theme-color meta tag — sync that here so a persisted override is reflected immediately
      // on load, not just after the next click on this toggle.
      applyTheme(stored);
    }
  }, []);

  return (
    <div className="flex gap-1 rounded-xl bg-[var(--color-fill-secondary)] p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            setPreference(option.value);
            applyTheme(option.value);
          }}
          className={`flex-1 rounded-lg py-1.5 text-[0.8125rem] font-medium transition-colors ${
            preference === option.value
              ? "bg-[var(--color-bg-elevated)] text-[var(--color-label)]"
              : "text-[var(--color-label-secondary)]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
