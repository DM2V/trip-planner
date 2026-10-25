"use client";

import { useEffect, useState, type ReactNode } from "react";

interface ActionSheetProps {
  header: ReactNode;
  children: ReactNode;
  onClose: () => void;
}

// iOS action-sheet chrome shared by RouteTypeSheet/ConfirmDeleteSheet/OpenInMapsSheet: a dimming
// scrim over a sheet anchored to the bottom, with a fade/slide-in on mount, Escape-to-close, and a
// separate Cancel row below the sheet itself. Callers only supply the header content and the
// action button(s) — see ActionSheetButton below.
export function ActionSheet({ header, children, onClose }: ActionSheetProps) {
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
        <div className="sheet-material ios-list overflow-hidden rounded-2xl text-center shadow-lg">
          <div className="px-4 py-3">{header}</div>
          {children}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="sheet-material mt-2 block min-h-[52px] w-full rounded-2xl text-[1.0625rem] font-semibold text-(--color-accent) shadow-lg active:bg-(--color-fill-secondary)"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface ActionSheetButtonProps {
  tone?: "accent" | "destructive";
  onClick: () => void;
  children: ReactNode;
}

export function ActionSheetButton({ tone = "accent", onClick, children }: ActionSheetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block min-h-[52px] w-full text-[1.0625rem] font-medium active:bg-(--color-fill-secondary) ${
        tone === "destructive" ? "text-(--color-destructive)" : "text-(--color-accent)"
      }`}
    >
      {children}
    </button>
  );
}
