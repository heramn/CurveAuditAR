import { mkdir, access } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { spawnSync } from "node:child_process";
await mkdir("data/raw", { recursive: true });
await mkdir("public/data", { recursive: true });
const target = "data/raw/arkansas-latest.osm.pbf";
let exists = true;
try {
  await access(target);
} catch {
  exists = false;
}
if (!exists) {
  const url =
    "https://download.geofabrik.de/north-america/us/arkansas-latest.osm.pbf";
  const response = await fetch(url, { signal: AbortSignal.timeout(300000) });
  if (!response.ok) throw Error(`PBF download: HTTP ${response.status}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(target));
  console.log("Downloaded Geofabrik Arkansas PBF");
} else
  console.log(
    "Using cached PBF. Move it aside explicitly to download a newer snapshot.",
  );
const extraction = spawnSync("python", ["scripts/extract-pbf.py"], {
  stdio: "inherit",
});
if (extraction.status !== 0)
  throw Error(
    "Python extraction failed. Install requirements-data.txt with pip.",
  );
await import("./fetch-boundaries.mjs");
console.log(
  "Raw data ready. Run npm run data:process to regenerate the web inventory.",
);
