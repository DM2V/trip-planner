// MapLibre GL 6 ships its Web Worker as a separate ES module and, by default, finds it through a
// bundler-resolved `new URL(..., import.meta.url)`. Under Next 14's webpack that resolves to the
// *page's own URL*, so every worker the map starts is the HTML of the current route, fails to
// parse, and the map silently never draws a tile or the route line (the canvas still exists, which
// makes it look fine at a glance).
//
// Serving the worker as a plain static file and pointing MapLibre at it with setWorkerUrl()
// (see MapView) takes the bundler out of the picture. It's copied from node_modules on every
// build rather than committed so it can never drift from the installed maplibre-gl version.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs");
const targetDir = join(root, "public", "maplibre");

if (!existsSync(source)) {
  console.error(`copy-maplibre-worker: ${source} not found — did maplibre-gl move its worker file?`);
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });
copyFileSync(source, join(targetDir, "maplibre-gl-worker.mjs"));
console.log("copy-maplibre-worker: public/maplibre/maplibre-gl-worker.mjs updated");
