import { describe, expect, it, vi } from "vitest";

// Next's redirect() never returns; it throws to unwind the render. Mirror that so a test can tell
// "redirected" from "carried on".
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

import { requireTripOwner } from "@/lib/tripAccess";

const trip = { id: "trip-1", owner_id: "owner-1", share_token: "token-abc", name: "Weekend" };

describe("requireTripOwner", () => {
  it("sends a signed-out visitor to log in", () => {
    expect(() => requireTripOwner(null, trip)).toThrow("REDIRECT:/login");
  });

  it("sends anyone to their trip list when the trip doesn't exist", () => {
    expect(() => requireTripOwner({ id: "owner-1" }, null)).toThrow("REDIRECT:/trips");
    expect(() => requireTripOwner({ id: "owner-1" }, undefined)).toThrow("REDIRECT:/trips");
  });

  it("checks sign-in before existence, so a signed-out visitor can't probe which trip ids exist", () => {
    expect(() => requireTripOwner(null, null)).toThrow("REDIRECT:/login");
  });

  it("sends a non-owner to the read-only share view, carrying the token", () => {
    expect(() => requireTripOwner({ id: "someone-else" }, trip)).toThrow(
      "REDIRECT:/trips/trip-1/share?token=token-abc",
    );
  });

  it("returns the trip itself to its owner, fully typed", () => {
    const result = requireTripOwner({ id: "owner-1" }, trip);
    expect(result).toBe(trip);
    expect(result.name).toBe("Weekend");
  });
});
