"use client";

import { useRef, useState } from "react";
import { SearchIcon } from "@/components/ui/icons";
import { extractGoogleMapsUrl } from "@/lib/googleMapsLink";
import type { LatLng } from "@/types";

interface Place {
  label: string;
  lat: number;
  lng: number;
}

interface PlaceSearchInputProps {
  placeholder?: string;
  onSelect: (place: Place) => void | Promise<void>;
  // Biases results toward this point (nearest first) instead of ranking on text match alone — the
  // trip's origin when searching for a stop, say, so a name that exists in several cities doesn't
  // surface a same-named place somewhere else in the world ahead of the one actually meant.
  focus?: LatLng;
}

// Phase 1/2: debounced search box backed by /api/places-search (OpenRouteService Geocoding).
// Also accepts a pasted Google Maps link directly (via /api/parse-maps-link), for the places our
// OpenStreetMap-based search doesn't have at all.
export function PlaceSearchInput({
  placeholder = "Search for a place, or paste a Google Maps link...",
  onSelect,
  focus,
}: PlaceSearchInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingIndex, setSubmittingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  // Debouncing only cancels a *pending* timeout, not a fetch that's already in flight — pasting a
  // link and then quickly typing a normal query starts the (slower) link lookup, then the (faster)
  // text search, and without this the link lookup could still resolve *after* the search and
  // clobber its results with a stale single-place suggestion. Each debounced run captures the
  // current id and checks it's still current before touching state.
  const requestIdRef = useRef(0);

  function handleChange(value: string) {
    setQuery(value);
    setError(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const requestId = ++requestIdRef.current;

    const mapsUrl = extractGoogleMapsUrl(value);
    if (mapsUrl) {
      timeoutRef.current = setTimeout(async () => {
        setLoading(true);
        setSuggestions([]);
        try {
          const response = await fetch(`/api/parse-maps-link?url=${encodeURIComponent(mapsUrl)}`);
          const data = await response.json();
          if (requestIdRef.current !== requestId) return;
          if (!response.ok) {
            setError(data.error ?? "Couldn't read that Google Maps link");
            return;
          }
          setSuggestions([data.place]);
        } catch {
          if (requestIdRef.current !== requestId) return;
          setError("Couldn't reach that link");
        } finally {
          if (requestIdRef.current === requestId) setLoading(false);
        }
      }, 300);
      return;
    }

    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: value });
        if (focus) {
          params.set("focusLat", String(focus.lat));
          params.set("focusLng", String(focus.lng));
        }
        const response = await fetch(`/api/places-search?${params.toString()}`);
        const data = await response.json();
        if (requestIdRef.current !== requestId) return;
        setSuggestions(data.suggestions ?? []);
      } catch {
        if (requestIdRef.current !== requestId) return;
        setError("Couldn't search right now");
      } finally {
        if (requestIdRef.current === requestId) setLoading(false);
      }
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
        <ul className="sheet-material ios-list absolute z-30 mt-1 w-full overflow-hidden rounded-2xl shadow-lg">
          {suggestions.map((place, index) => (
            <li key={index}>
              <button
                type="button"
                disabled={submittingIndex !== null}
                onClick={async () => {
                  setError(null);
                  setSubmittingIndex(index);
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
                    setSubmittingIndex(null);
                  }
                }}
                className="flex min-h-[44px] w-full items-center gap-2 px-4 py-2.5 text-left text-[1.0625rem] active:bg-[var(--color-fill-secondary)] disabled:opacity-50"
              >
                {submittingIndex === index && (
                  <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent text-[var(--color-accent)]" />
                )}
                <span className="min-w-0 flex-1 truncate">
                  {submittingIndex === index ? "Adding..." : place.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
