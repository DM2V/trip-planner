/** @type {import('next').NextConfig} */
const nextConfig = {
  // MapLibre GL JS isn't safe under Strict Mode's dev-only double mount/unmount — it aborts an
  // in-flight tile request on the simulated unmount, which surfaces as an unhandled AbortError.
  // Production builds only mount once regardless, so this only affects the dev overlay.
  reactStrictMode: false,
};

module.exports = nextConfig;
