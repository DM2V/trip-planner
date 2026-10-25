import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { allow } from "@/lib/rateLimit";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-25T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("allow", () => {
  it("lets exactly `limit` calls through per window, then refuses", () => {
    const results = Array.from({ length: 4 }, () => allow("test:limit", 3, 60_000));
    expect(results).toEqual([true, true, true, false]);
  });

  it("keeps separate allowances per key, so one user can't use up another's", () => {
    for (let i = 0; i < 3; i++) allow("test:user-a", 3, 60_000);

    expect(allow("test:user-a", 3, 60_000)).toBe(false);
    expect(allow("test:user-b", 3, 60_000)).toBe(true);
  });

  it("frees capacity as old calls slide out of the window", () => {
    for (let i = 0; i < 3; i++) allow("test:slide", 3, 60_000);
    expect(allow("test:slide", 3, 60_000)).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(allow("test:slide", 3, 60_000)).toBe(true);
  });

  it("doesn't count refused calls, so hammering doesn't extend the lockout", () => {
    for (let i = 0; i < 3; i++) allow("test:hammer", 3, 60_000);
    vi.advanceTimersByTime(30_000);
    for (let i = 0; i < 50; i++) allow("test:hammer", 3, 60_000);

    vi.advanceTimersByTime(30_001);

    expect(allow("test:hammer", 3, 60_000)).toBe(true);
  });
});
