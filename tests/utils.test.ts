import { describe, expect, it } from "vitest";
import {
  daysBetweenInclusive,
  formatDateRange,
  formatDistance,
  formatDuration,
  googleMapsDirectionsUrl,
  googleMapsPlaceUrl,
  isValidCoordinate,
  parseDateOnly,
  recommendStopTime,
  validateTripDates,
} from "@/lib/utils";

describe("formatDuration", () => {
  it("drops whichever unit is zero instead of showing 0h or 0m", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(5400)).toBe("1h 30m");
    expect(formatDuration(45 * 60)).toBe("45m");
  });

  it("rounds to the nearest minute", () => {
    expect(formatDuration(29)).toBe("0m");
    expect(formatDuration(31)).toBe("1m");
    expect(formatDuration(59 * 60 + 40)).toBe("1h");
  });
});

describe("formatDistance", () => {
  it("shows whole meters below a kilometre, where a 1-decimal km would round short legs to 0.0", () => {
    expect(formatDistance(680)).toBe("680 m");
    expect(formatDistance(999.4)).toBe("999 m");
  });

  it("shows one decimal of km from 1000 m up", () => {
    expect(formatDistance(1000)).toBe("1.0 km");
    expect(formatDistance(15_300)).toBe("15.3 km");
  });
});

describe("date handling", () => {
  it("parses a date-only string as local time, not UTC (the off-by-one-day bug)", () => {
    // new Date("2026-09-05") is UTC midnight, which renders as Sep 4 anywhere behind UTC.
    const date = parseDateOnly("2026-09-05");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(5);
  });

  it("counts a trip inclusively and never below one day", () => {
    expect(daysBetweenInclusive("2026-09-05", "2026-09-05")).toBe(1);
    expect(daysBetweenInclusive("2026-09-05", "2026-09-06")).toBe(2);
    expect(daysBetweenInclusive("2026-09-05", "2026-09-12")).toBe(8);
    // an inverted range is clamped here; validateTripDates is what rejects it up front
    expect(daysBetweenInclusive("2026-09-10", "2026-09-05")).toBe(1);
  });

  it("formats a range the way a person would read it", () => {
    expect(formatDateRange("2026-09-05", "2026-09-06")).toBe("Sep 5 – Sep 6, 2026");
    expect(formatDateRange("2026-12-30", "2027-01-02")).toBe("Dec 30 – Jan 2, 2027");
  });
});

describe("validateTripDates", () => {
  it("accepts a same-day or forward range", () => {
    expect(validateTripDates("2026-09-05", "2026-09-05")).toBeNull();
    expect(validateTripDates("2026-09-05", "2026-09-06")).toBeNull();
    expect(validateTripDates("2026-12-30", "2027-01-02")).toBeNull();
  });

  it("rejects an end date before the start date", () => {
    expect(validateTripDates("2026-09-10", "2026-09-05")).toBe("End date can't be before the start date");
    expect(validateTripDates("2027-01-01", "2026-12-31")).not.toBeNull();
  });
});

describe("isValidCoordinate", () => {
  it("accepts real-world coordinates, including the extremes", () => {
    expect(isValidCoordinate(40.7484, -73.9857)).toBe(true);
    expect(isValidCoordinate(-90, 180)).toBe(true);
    expect(isValidCoordinate(0, 0)).toBe(true);
  });

  it("rejects anything the map can't draw", () => {
    expect(isValidCoordinate(95.1, 10)).toBe(false);
    expect(isValidCoordinate(10, -180.5)).toBe(false);
    expect(isValidCoordinate(Number.NaN, 0)).toBe(false);
    expect(isValidCoordinate(0, Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("recommendStopTime", () => {
  it("splits the sightseeing budget left after travel evenly across the stops", () => {
    // 3 days x 10h = 1800 min, minus 4h of travel = 1560 min, over 6 stops
    const result = recommendStopTime("2026-10-10", "2026-10-12", 4 * 3600, 6);
    expect(result).toMatchObject({ feasible: true, days: 3, minutesPerStop: 260, shortfallMinutes: 0 });
  });

  it("reports how far over budget the travel alone is when the dates can't hold it", () => {
    // 1 day = 600 min, travel is 11h = 660 min
    const result = recommendStopTime("2026-10-10", "2026-10-10", 11 * 3600, 3);
    expect(result).toMatchObject({ feasible: false, days: 1, minutesPerStop: 0, shortfallMinutes: 60 });
  });

  it("is not feasible with no stops, rather than dividing by zero", () => {
    expect(recommendStopTime("2026-10-10", "2026-10-12", 0, 0).feasible).toBe(false);
  });
});

describe("Google Maps URLs", () => {
  it("always address a place by coordinates, never by name", () => {
    // A bare name sent to Google resolves near wherever the viewer is standing, not the trip's city.
    expect(googleMapsDirectionsUrl(40.7484, -73.9857)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=40.7484,-73.9857&travelmode=transit",
    );
    expect(googleMapsPlaceUrl(40.7484, -73.9857)).toBe(
      "https://www.google.com/maps/search/?api=1&query=40.7484,-73.9857",
    );
  });
});

describe("test environment", () => {
  it("runs in a timezone behind UTC, the only place the date-parsing bug is visible", () => {
    expect(new Date(2026, 0, 1).getTimezoneOffset()).toBeGreaterThan(0);
    // the trap the helper avoids: a bare ISO date string is UTC midnight, i.e. the previous local day
    expect(new Date("2026-09-05").getDate()).toBe(4);
  });
});
