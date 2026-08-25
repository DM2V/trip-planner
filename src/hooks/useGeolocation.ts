"use client";

import { useState } from "react";
import type { LatLng } from "@/types";

interface GeolocationState {
  position: LatLng | null;
  error: string | null;
  loading: boolean;
}

// Phase 1: gets the user's current location as the default starting point.
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false,
  });

  const request = () => {
    if (!navigator.geolocation) {
      setState({ position: null, error: "Geolocation is not supported", loading: false });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
          loading: false,
        }),
      (err) => setState({ position: null, error: err.message, loading: false }),
    );
  };

  return { ...state, request };
}
