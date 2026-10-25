import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const base = process.argv[2] || "https://curveauditar.vercel.app";
const response = await fetch(base, { redirect: "manual" });
if (response.status !== 200) throw Error(`Homepage HTTP ${response.status}`);
const html = await response.text();
if (!html.includes("CurveAudit AR")) throw Error("Unexpected homepage");
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(
  (m) => m[1],
);
for (const asset of assets) {
  const res = await fetch(base + asset);
  if (!res.ok) throw Error(`Asset ${asset}: ${res.status}`);
}
console.log("HTTPS homepage and", assets.length, "built assets: PASS");
for (const file of [
  "curves.json",
  "roads.json",
  "stats.json",
  "counties.geojson",
  "district.geojson",
  "district-check.json",
]) {
  const res = await fetch(`${base}/data/${file}`);
  if (!res.ok) throw Error(`Data ${file}: ${res.status}`);
  const remote = Buffer.from(await res.arrayBuffer()),
    local = await readFile(`public/data/${file}`),
    sha = (b) => createHash("sha256").update(b).digest("hex");
  if (sha(remote) !== sha(local))
    throw Error(`${file} differs from local source`);
  console.log(file, "SHA-256 match");
}
const release = await fetch(base + "/release.json").then((r) => r.json());
const expected = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
if (release.commit !== expected)
  throw Error(`Deployment ${release.commit} != HEAD ${expected}`);
console.log("Production commit:", release.commit, "PASS");
