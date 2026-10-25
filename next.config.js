// Content Security Policy. Everything the app legitimately loads is listed here, so anything
// else — an injected script tag, a request to some exfiltration host, the app embedded in
// someone else's page — is refused by the browser even if a bug let it through.
//
// What each non-obvious entry is for:
//  - script/style 'unsafe-inline': Next.js emits inline bootstrap scripts and the theme script in
//    layout.tsx runs before first paint; MapLibre and Tailwind-driven components set inline
//    styles. Removing these needs per-request nonces, which Next only supports by opting every
//    page into dynamic rendering. Kept deliberately — this policy's value is in the other
//    directives (framing, plugins, where requests may go), not in blocking inline script.
//  - worker-src/child-src blob: MapLibre parses tiles in a Web Worker it creates from a blob URL
//    (older Safari reads child-src for workers).
//  - CARTO hosts: the basemap style JSON comes from basemaps.cartocdn.com, vector tiles, glyphs
//    and sprites from its subdomains. A wildcard doesn't match the bare host, so both are listed.
//  - Supabase: REST/auth over https and realtime over wss, on the project's own subdomain.
const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : "*.supabase.co";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com",
  `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST} https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com`,
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // frame-ancestors above covers modern browsers; this is the same rule for older ones.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Share links carry a secret in the query string. Browsers already default to this, but being
  // explicit means a future change of default can't start leaking it to third-party hosts.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // geolocation stays allowed for this origin: "New Trip" offers to start from where you are.
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // MapLibre GL JS isn't safe under Strict Mode's dev-only double mount/unmount — it aborts an
  // in-flight tile request on the simulated unmount, which surfaces as an unhandled AbortError.
  // Production builds only mount once regardless, so this only affects the dev overlay.
  reactStrictMode: false,

  // Our Server Actions only receive form fields (email, password, short text) — well under 64 KB.
  // Setting this explicitly prevents the 1 MB default from becoming an attack surface if a future
  // action accidentally accepts arbitrary input.
  experimental: {
    serverActions: {
      bodySizeLimit: "64kb",
    },
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
