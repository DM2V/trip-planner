import { createRequire } from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);

// next.config.js reads the environment when it is loaded, so each case needs a fresh load.
async function loadHeaders(supabaseUrl?: string) {
  if (supabaseUrl === undefined) vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  else vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  delete require.cache[require.resolve("../next.config.js")];
  const config = require("../next.config.js");
  const rules = await config.headers();
  const rule = rules.find((r: { source: string }) => r.source === "/:path*");
  const headers: Record<string, string> = {};
  for (const { key, value } of rule.headers) headers[key] = value;
  return headers;
}

function directives(csp: string) {
  const map: Record<string, string[]> = {};
  for (const part of csp.split(";")) {
    const [name, ...values] = part.trim().split(/\s+/);
    if (name) map[name] = values;
  }
  return map;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("security headers", () => {
  it("are applied to every route", async () => {
    const headers = await loadHeaders("https://abc.supabase.co");
    expect(Object.keys(headers)).toEqual(
      expect.arrayContaining([
        "Content-Security-Policy",
        "X-Frame-Options",
        "X-Content-Type-Options",
        "Referrer-Policy",
        "Permissions-Policy",
      ]),
    );
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("keep geolocation, which the New Trip screen uses, and nothing else powerful", async () => {
    const policy = (await loadHeaders("https://abc.supabase.co"))["Permissions-Policy"];
    expect(policy).toContain("geolocation=(self)");
    expect(policy).toContain("camera=()");
    expect(policy).toContain("microphone=()");
  });
});

describe("Content-Security-Policy", () => {
  async function csp(supabaseUrl = "https://abc.supabase.co") {
    return directives((await loadHeaders(supabaseUrl))["Content-Security-Policy"]);
  }

  it("forbids framing, plugins and a rewritten base URL", async () => {
    const policy = await csp();
    expect(policy["frame-ancestors"]).toEqual(["'none'"]);
    expect(policy["object-src"]).toEqual(["'none'"]);
    expect(policy["base-uri"]).toEqual(["'self'"]);
    expect(policy["default-src"]).toEqual(["'self'"]);
  });

  it("never allows eval", async () => {
    const policy = await csp();
    for (const values of Object.values(policy)) expect(values).not.toContain("'unsafe-eval'");
  });

  it("lets MapLibre run its blob: web workers, without which the map draws nothing", async () => {
    const policy = await csp();
    expect(policy["worker-src"]).toEqual(expect.arrayContaining(["'self'", "blob:"]));
  });

  it("lists the CARTO basemap both bare and wildcarded, since a wildcard doesn't match the bare host", async () => {
    const policy = await csp();
    for (const directive of ["connect-src", "img-src"]) {
      expect(policy[directive]).toContain("https://basemaps.cartocdn.com");
      expect(policy[directive]).toContain("https://*.basemaps.cartocdn.com");
    }
  });

  it("allows Supabase on the project's own host, over https and wss", async () => {
    const policy = await csp("https://abc123.supabase.co");
    expect(policy["connect-src"]).toContain("https://abc123.supabase.co");
    expect(policy["connect-src"]).toContain("wss://abc123.supabase.co");
  });

  it("falls back to any Supabase project when the URL isn't set at build time", async () => {
    const policy = directives((await loadHeaders(undefined))["Content-Security-Policy"]);
    expect(policy["connect-src"]).toContain("https://*.supabase.co");
  });

  it("doesn't open script-src to other origins", async () => {
    const scripts = (await csp())["script-src"];
    expect(scripts.filter((value) => value.startsWith("http"))).toEqual([]);
  });
});
