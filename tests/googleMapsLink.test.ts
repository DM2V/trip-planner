import { describe, expect, it } from "vitest";
import { extractGoogleMapsUrl, isGoogleMapsUrl } from "@/lib/googleMapsLink";

describe("isGoogleMapsUrl", () => {
  it.each([
    "https://maps.app.goo.gl/MibyypixVFUwGBSs9?g_st=ic",
    "https://www.google.com/maps/place/Empire+State+Building/@40.7484,-73.9857,17z",
    "https://maps.google.com/?q=40.7484,-73.9857",
    "https://goo.gl/maps/abc123",
  ])("accepts %s", (url) => {
    expect(isGoogleMapsUrl(url)).toBe(true);
  });

  // This is the SSRF allowlist for a server-side fetch of user input, so the rejections matter more.
  it.each([
    ["plain http", "http://maps.google.com/?q=1,2"],
    ["another host", "https://evil.example.com/maps?q=1,2"],
    ["a lookalike suffix", "https://maps.google.com.evil.com/?q=1,2"],
    ["a lookalike prefix", "https://evilgoogle.com/maps"],
    ["credentials that make a trusted name the userinfo, not the host", "https://maps.google.com@evil.com/"],
    ["an internal address", "https://169.254.169.254/latest/meta-data"],
    ["localhost", "https://localhost:3000/"],
    ["a non-URL", "not a url"],
    ["an empty string", ""],
  ])("rejects %s", (_label, url) => {
    expect(isGoogleMapsUrl(url)).toBe(false);
  });
});

describe("extractGoogleMapsUrl", () => {
  const LINK = "https://maps.app.goo.gl/MibyypixVFUwGBSs9?g_st=ic";

  it("returns a bare link, trimmed", () => {
    expect(extractGoogleMapsUrl(LINK)).toBe(LINK);
    expect(extractGoogleMapsUrl(`  ${LINK}\n`)).toBe(LINK);
  });

  it("pulls the link out of the 'name, newline, link' text iOS's share sheet produces", () => {
    expect(extractGoogleMapsUrl(`Sawgrass Mills\n${LINK}`)).toBe(LINK);
  });

  it("pulls it out of a sentence and drops trailing punctuation that belongs to the prose", () => {
    expect(extractGoogleMapsUrl(`Mira esto ${LINK}.`)).toBe(LINK);
    expect(extractGoogleMapsUrl(`(${LINK})`)).toBe(LINK);
  });

  it("skips a non-Maps link to find the Maps one", () => {
    expect(extractGoogleMapsUrl(`https://example.com/x and also ${LINK}`)).toBe(LINK);
  });

  it("returns null when there is no Maps link at all", () => {
    expect(extractGoogleMapsUrl("Central Park")).toBeNull();
    expect(extractGoogleMapsUrl("https://evil.example.com/maps?q=1,2")).toBeNull();
    expect(extractGoogleMapsUrl("")).toBeNull();
  });
});
