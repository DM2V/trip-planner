"use client";

import { useState } from "react";

interface AddStopFormProps {
  onAdd: (query: string) => void;
}

// Phase 1/2: input with autocomplete (via /api/places-search) to add a destination or the starting point.
export function AddStopForm({ onAdd }: AddStopFormProps) {
  const [query, setQuery] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!query.trim()) return;
        onAdd(query.trim());
        setQuery("");
      }}
      className="flex gap-2"
    >
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a place..."
        className="flex-1 rounded-full border border-slate-700 bg-transparent px-4 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-950"
      >
        Add
      </button>
    </form>
  );
}
