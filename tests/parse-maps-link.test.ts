import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The real check reads the Supabase session cookie; here it's just a switch.
const guardApiRequest = vi.fn();
vi.mock("@/lib/apiAuth", () => ({ guardApiRequest: () => guardApiRequest() }));

import { GET } from "@/app/api/parse-maps-link/route";

const SIGNED_IN = null;
const SIGNED_OUT = () => NextResponse.json({ error: "Log in to search for places" }, { status: 401 });

function request(link?: string) {
  const url = new URL("http://localhost/api/parse-maps-link");
  if (link !== undefined) url.searchParams.set("url", link);
  return new NextRequest(url);
}

// Just the parts of a Response the route reads — `new Response()` can't be given a `url`.
function reply(url: string, init: { status?: number; location?: string; html?: string } = {}) {
  const status = init.status ?? 200;
  const headers = new Headers();
  if (init.location) headers.set("location", init.location);
  return {
    url,
    status,
    ok: status >= 200 && status < 300,
    headers,
    text: async () => init.html ?? "",
    json: async () => ({}),
  } as unknown as Response;
}

function stubFetch(...responses: Response[]) {
  const queue = [...responses];
  const fetchMock = vi.fn(async () => {
    const next = queue.shift();
    if (!next) throw new Error("unexpected extra fetch");
    return next;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  guardApiRequest.mockReturnValue(SIGNED_IN);
});

describe("access control", () => {
  it("refuses a signed-out caller before doing any work, so the endpoint can't be used to burn quota", async () => {
    guardApiRequest.mockReturnValue(SIGNED_OUT());
    const fetchMock = stubFetch();

    const response = await GET(request("https://maps.app.goo.gl/abc"));

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a missing or non-Google link without making any request", async () => {
    const fetchMock = stubFetch();

    expect((await GET(request())).status).toBe(400);
    expect((await GET(request("https://evil.example.com/maps?q=1,2"))).status).toBe(400);
    expect((await GET(request("http://maps.google.com/?q=1,2"))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("resolving a link", () => {
  it("reads coordinates and the name straight from a place URL", async () => {
    stubFetch(reply("https://www.google.com/maps/place/Empire+State+Building/@40.7484,-73.9857,17z"));

    const response = await GET(request("https://www.google.com/maps/place/x"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.place).toEqual({ label: "Empire State Building", lat: 40.7484, lng: -73.9857 });
  });

  it("follows a short link's redirects by hand, one hop at a time", async () => {
    const fetchMock = stubFetch(
      reply("https://maps.app.goo.gl/abc", { status: 302, location: "https://www.google.com/maps/place/Central+Park/@40.7829,-73.9654,15z" }),
      reply("https://www.google.com/maps/place/Central+Park/@40.7829,-73.9654,15z"),
    );

    const body = await (await GET(request("https://maps.app.goo.gl/abc"))).json();

    expect(body.place).toMatchObject({ label: "Central Park", lat: 40.7829, lng: -73.9654 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // 'manual' is what makes per-hop validation possible; 'follow' would hand the decision to fetch
    for (const call of fetchMock.mock.calls as unknown as [string, RequestInit][]) {
      expect(call[1].redirect).toBe("manual");
    }
  });

  it("falls back to geocoding the address when a phone-app link carries no coordinates", async () => {
    // The Google Maps app shares ?q=<name>, <street address> with coordinates nowhere at all.
    const fetchMock = stubFetch(
      reply("https://maps.app.goo.gl/abc", {
        status: 302,
        location: "https://www.google.com/maps?q=Sawgrass+Mills,+12801+W+Sunrise+Blvd,+Sunrise,+FL+33323&ftid=0x1",
      }),
      reply("https://www.google.com/maps?q=Sawgrass+Mills,+12801+W+Sunrise+Blvd,+Sunrise,+FL+33323&ftid=0x1", {
        html: "<html>no coordinates in here</html>",
      }),
      {
        ok: true,
        status: 200,
        json: async () => ({
          features: [{ properties: { label: "Sawgrass Mills, Sunrise, FL, USA" }, geometry: { coordinates: [-80.320749, 26.152158] } }],
        }),
      } as unknown as Response,
    );

    const body = await (await GET(request("https://maps.app.goo.gl/abc"))).json();

    expect(body.place).toEqual({ label: "Sawgrass Mills, Sunrise, FL, USA", lat: 26.152158, lng: -80.320749 });
    const geocodeUrl = new URL((fetchMock.mock.calls[2] as unknown as [string])[0]);
    expect(geocodeUrl.pathname).toBe("/pelias/v1/search");
    expect(geocodeUrl.searchParams.get("text")).toBe("Sawgrass Mills, 12801 W Sunrise Blvd, Sunrise, FL 33323");
  });

  it("answers 422 with guidance when no location can be found", async () => {
    stubFetch(reply("https://www.google.com/maps", { html: "<html></html>" }));

    const response = await GET(request("https://www.google.com/maps"));

    expect(response.status).toBe(422);
  });

  it("never returns a point the map can't draw, even if the link spells one out", async () => {
    stubFetch(reply("https://www.google.com/maps/@95.5,10.2,15z", { html: "<html></html>" }));

    const response = await GET(request("https://www.google.com/maps/@95.5,10.2,15z"));

    expect(response.status).toBe(422);
  });
});

describe("SSRF protection on redirects", () => {
  it("refuses to follow a redirect off Google's hosts, and never makes that request", async () => {
    // maps.app.goo.gl is Google-owned but will redirect wherever the link's creator chose.
    const fetchMock = stubFetch(
      reply("https://maps.app.goo.gl/abc", { status: 302, location: "http://169.254.169.254/latest/meta-data/" }),
      reply("http://169.254.169.254/latest/meta-data/", { html: "SECRET" }),
    );

    const response = await GET(request("https://maps.app.goo.gl/abc"));

    expect(response.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("also refuses a redirect to a lookalike host", async () => {
    const fetchMock = stubFetch(
      reply("https://maps.app.goo.gl/abc", { status: 302, location: "https://maps.google.com.evil.com/" }),
    );

    expect((await GET(request("https://maps.app.goo.gl/abc"))).status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up on a redirect loop", async () => {
    const loop = Array.from({ length: 8 }, () =>
      reply("https://maps.app.goo.gl/abc", { status: 302, location: "https://maps.app.goo.gl/abc" }),
    );
    const fetchMock = stubFetch(...loop);

    expect((await GET(request("https://maps.app.goo.gl/abc"))).status).toBe(502);
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(5);
  });
});
