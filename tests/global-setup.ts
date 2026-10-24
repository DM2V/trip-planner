// Runs once before the test workers start, so they all inherit it.
//
// The date helpers exist to avoid an off-by-one-day bug that only appears in a timezone *behind*
// UTC (new Date("2026-09-05") is UTC midnight, which is still Sep 4 in New York). CI machines run
// in UTC, where that bug is invisible and the tests would pass against broken code, so the suite
// pins a zone where it shows.
export default function setup() {
  process.env.TZ = "America/New_York";
}
