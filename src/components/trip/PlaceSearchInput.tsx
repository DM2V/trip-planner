"use client";

import { useRef, useState } from "react";
import { SearchIcon } from "@/components/ui/icons";

interface Place {
  label: string;
  lat: number;
  lng: number;
}

interface PlaceSearchInputProps {
  placeholder?: string;
  onSelect: (place: Place) => void | Promise<void>;
}

// Phase 1/2: debounced search box backed by /api/places-search (OpenRouteService Geocoding).
export function PlaceSearchInput({
  placeholder = "Search for a place...",
  onSelect,
}: PlaceSearchInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  function handleChange(value: string) {
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      const response = await fetch(`/api/places-search?q=${encodeURIComponent(value)}`);
      const data = await response.json();
      setSuggestions(data.suggestions ?? []);
      setLoading(false);
    }, 300);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl bg-[var(--color-fill-secondary)] px-3 py-2">
        <SearchIcon className="h-4 w-4 shrink-0 text-[var(--color-label-tertiary)]" />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-[1.0625rem] outline-none placeholder:text-[var(--color-label-tertiary)]"
        />
      </div>
      {loading && (
        <p className="mt-1 px-1 text-[0.8125rem] text-[var(--color-label-tertiary)]">Searching...</p>
      )}
      {error && <p className="mt-1 px-1 text-[0.8125rem] text-[var(--color-destructive)]">{error}</p>}
      {suggestions.length > 0 && (
        <ul className="ios-list absolute z-30 mt-1 w-full overflow-hidden rounded-2xl bg-[var(--color-bg-elevated)] shadow-lg">
          {suggestions.map((place, index) => (
            <li key={index}>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setError(null);
                  setSubmitting(true);
                  try {
                    // Only clear the query/suggestions once the caller's onSelect has actually
                    // succeeded — otherwise a failed addStop (network error, RLS rejection, ...)
                    // clears the search box as if the place had been added, with no feedback.
                    await onSelect(place);
                    setQuery("");
                    setSuggestions([]);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Could not add this place");
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="block min-h-[44px] w-full px-4 py-2.5 text-left text-[1.0625rem] active:bg-[var(--color-fill-secondary)] disabled:opacity-50"
              >
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
