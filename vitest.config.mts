import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirrors the "@/*" path alias in tsconfig.json.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    globalSetup: ["tests/global-setup.ts"],
    include: ["tests/**/*.test.ts"],
    // Every test that needs a clean `fetch` stub installs its own; this just guarantees one test's
    // stub or mock can't leak into the next.
    restoreMocks: true,
    unstubGlobals: true,
  },
});
