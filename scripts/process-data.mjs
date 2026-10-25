import { readFile, writeFile, mkdir } from "node:fs/promises";
import proj4 from "proj4";
import {
  resample,
  circumradius,
  headingChange,
  cleanPoints,
} from "../src/engineering.mjs";
const projection = "+proj=utm +zone=15 +datum=WGS84 +units=m +no_defs";
const toXY = (p) => proj4("EPSG:4326", projection, p),
  toLL = (p) => proj4(projection, "EPSG:4326", p);
const pilots = JSON.parse(await readFile("data/raw/pilots.json", "utf8"));
const counties = JSON.parse(
  await readFile("data/raw/counties.geojson", "utf8"),
);
function inRing(p, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
function countyOf(p) {
  for (const f of counties.features) {
    const polygons =
      f.geometry.type === "Polygon"
        ? [f.geometry.coordinates]
        : f.geometry.coordinates;
    if (
      polygons.some(
        (poly) =>
          inRing(p, poly[0]) && !poly.slice(1).some((r) => inRing(p, r)),
      )
    )
      return f.properties.NAME.replace(" County", "");
  }
  return "Outside pilot counties";
}
const features = [],
  roads = [],
  seen = new Set();
let length = 0,
  segments = 0;
const dates = [];
for (const pilot of pilots) {
  const raw = JSON.parse(await readFile(`data/raw/${pilot.name}.json`, "utf8"));
  dates.push(raw.retrievedAt);
  const nodeCounts = new Map();
  for (const w of raw.elements)
    for (const id of new Set(w.nodes ?? []))
      nodeCounts.set(id, (nodeCounts.get(id) ?? 0) + 1);
  for (const way of raw.elements) {
    if (seen.has(way.id)) continue;
    seen.add(way.id);
    if (
      !way.geometry ||
      way.geometry.some(
        (p) => !Number.isFinite(p.lon) || !Number.isFinite(p.lat),
      )
    )
      continue;
    const ll = way.geometry.map((p) => [p.lon, p.lat]);
    const xy = cleanPoints(ll.map(toXY));
    if (xy.length < 3) continue;
    const chunks = [];
    let start = 0;
    for (let i = 1; i < ll.length - 1; i++) {
      if ((nodeCounts.get(way.nodes?.[i]) ?? 0) > 1) {
        chunks.push(ll.slice(start, i + 1));
        start = i;
      }
    }
    chunks.push(ll.slice(start));
    roads.push({
      type: "Feature",
      properties: {
        osmId: way.id,
        name: way.tags?.name || way.tags?.ref || "Unnamed road",
        pilot: pilot.name,
      },
      geometry: { type: "LineString", coordinates: ll },
    });
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const original = cleanPoints(chunks[chunkIndex].map(toXY));
      if (original.length < 3) continue;
      for (let i = 1; i < original.length; i++)
        length += Math.hypot(
          original[i][0] - original[i - 1][0],
          original[i][1] - original[i - 1][1],
        );
      segments++;
      const samples = resample(original, 10);
      if (samples.length < 9) continue;
      // Symmetric 1-2-1 smoothing attenuates vertex noise; 40 m chords reduce piecewise-linear artifacts.
      const pts = samples.map((p, i) =>
        i === 0 || i === samples.length - 1
          ? p
          : [
              (samples[i - 1][0] + 2 * p[0] + samples[i + 1][0]) / 4,
              (samples[i - 1][1] + 2 * p[1] + samples[i + 1][1]) / 4,
            ],
      );
      let group = [];
      const flush = () => {
        if (group.length < 3) {
          group = [];
          return;
        }
        const indices = group.map((g) => g.i),
          rs = group.map((g) => g.r).sort((a, b) => a - b),
          radius = rs[Math.floor(rs.length / 2)],
          s = Math.max(0, indices[0] - 2),
          end = Math.min(pts.length - 1, indices.at(-1) + 2),
          coords = pts.slice(s, end + 1).map(toLL);
        let angle = 0;
        for (let i = s + 1; i < end; i++)
          angle += headingChange(pts[i - 1], pts[i], pts[i + 1]);
        const degrees = Math.abs((angle * 180) / Math.PI),
          curveLength = (end - s) * 10;
        const center = coords[Math.floor(coords.length / 2)];
        if (
          degrees >= 18 &&
          curveLength >= 60 &&
          radius >= 25 &&
          radius <= 650
        ) {
          const spread = rs.at(-1) / rs[0],
            quality =
              spread > 3
                ? "Variable curvature — inspect geometry"
                : "OSM estimate — field validation needed";
          const priority =
            spread > 4
              ? "Insufficient evidence"
              : radius < 150 && degrees >= 35
                ? "Higher"
                : radius < 300
                  ? "Moderate"
                  : "Lower";
          const tags = way.tags ?? {};
          features.push({
            type: "Feature",
            properties: {
              id: `CA-${way.id}-${chunkIndex}-${s}`,
              osmId: way.id,
              name: tags.name || tags.ref || "Unnamed road",
              ref: tags.ref ?? null,
              county: countyOf(center),
              pilot: pilot.name,
              center,
              radiusM: Math.round(radius),
              headingDeg: Math.round(degrees),
              direction: angle > 0 ? "Left" : "Right",
              lengthM: curveLength,
              classification: tags.highway,
              priority,
              quality,
              surface: tags.surface ?? null,
              oneway: tags.oneway ?? null,
              bridge: tags.bridge ?? null,
              tunnel: tags.tunnel ?? null,
              osmMaxspeed: tags.maxspeed ?? null,
              postedSpeed: null,
              speedProvenance: tags.maxspeed
                ? "OSM tag only; not verified against an official speed zone"
                : "No speed tag or official speed match",
              grade: null,
              banking: null,
              friction: null,
              elevation: "Not integrated",
              crashContext: "No crash records matched to this candidate",
              reviewStatus: "Not field reviewed",
              source: "OpenStreetMap contributors",
              retrievedAt: raw.retrievedAt,
              sourceTimestamp: way.timestamp ?? null,
              rationale: `Estimated radius ${Math.round(radius)} m; ${Math.round(degrees)}° heading change. Geometry-only research thresholds; no verified sign, banking, friction or crash evidence.`,
              radiusRangeM: [Math.round(rs[0]), Math.round(rs.at(-1))],
              approach: ll.slice(
                Math.max(0, Math.floor(ll.length / 2) - 8),
                Math.floor(ll.length / 2) + 8,
              ),
            },
            geometry: { type: "LineString", coordinates: coords },
          });
        }
        group = [];
      };
      for (let i = 2; i < pts.length - 2; i++) {
        const r = circumradius(pts[i - 2], pts[i], pts[i + 2]),
          turn = headingChange(pts[i - 2], pts[i], pts[i + 2]);
        if (r >= 25 && r <= 650 && Math.abs(turn) > 0.015) {
          if (group.length && Math.sign(turn) !== Math.sign(group.at(-1).turn))
            flush();
          group.push({ i, r, turn });
        } else flush();
      }
      flush();
    }
  }
}
features.sort((a, b) => a.properties.radiusM - b.properties.radiusM);
for (const feature of features) {
  const road = roads.find(
    (r) => r.properties.osmId === feature.properties.osmId,
  );
  const entry = feature.geometry.coordinates[0];
  let nearest = 0,
    best = Infinity;
  road.geometry.coordinates.forEach((p, i) => {
    const d = Math.hypot(p[0] - entry[0], p[1] - entry[1]);
    if (d < best) {
      best = d;
      nearest = i;
    }
  });
  feature.properties.approach = [
    ...road.geometry.coordinates.slice(0, nearest),
    entry,
  ];
}
const stats = {
  processedAt: new Date().toISOString(),
  sourceRetrieval: dates,
  ways: roads.length,
  segments,
  analyzedKm: Math.round(length / 100) / 10,
  candidates: features.length,
  counties: [...new Set(features.map((f) => f.properties.county))],
  verifiedSpeeds: 0,
  integratedSources: 3,
  pilots: pilots.map((p) => ({
    ...p,
    candidates: features.filter((f) => f.properties.pilot === p.name).length,
  })),
  methodVersion: "1.0.0",
};
const district = JSON.parse(
  await readFile("data/raw/district.geojson", "utf8"),
);
const polygons =
  district.features[0].geometry.type === "Polygon"
    ? [district.features[0].geometry.coordinates]
    : district.features[0].geometry.coordinates;
const inside = features.filter((f) =>
  polygons.some(
    (poly) =>
      inRing(f.properties.center, poly[0]) &&
      !poly.slice(1).some((r) => inRing(f.properties.center, r)),
  ),
).length;
await writeFile(
  "public/data/district-check.json",
  JSON.stringify({
    congress: 119,
    inside,
    total: features.length,
    method: "candidate centerpoint in polygon, not curve clipping",
  }),
);
await mkdir("public/data", { recursive: true });
for (const [name, data] of Object.entries({
  curves: { type: "FeatureCollection", features },
  roads: { type: "FeatureCollection", features: roads },
  stats,
})) {
  await writeFile(`public/data/${name}.json`, JSON.stringify(data));
}
console.log(stats);
