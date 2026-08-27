import type { OptimizedRoute } from "@/lib/ors/optimization";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Trip {
  id: string;
  owner_id: string;
  name: string;
  start_date: string;
  end_date: string;
  origin_label: string;
  origin_lat: number;
  origin_lng: number;
  optimized_route: OptimizedRoute | null;
  share_token: string;
  created_at: string;
}

export interface Stop {
  id: string;
  trip_id: string;
  name: string;
  lat: number;
  lng: number;
  order_index: number | null;
}

export type TripMemberRole = "owner" | "viewer";

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string | null;
  role: TripMemberRole;
}
