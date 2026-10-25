import type { Candidate } from "./types";

const W = 440,
  H = 300,
  PAD = 52;

function niceMeters(maxM: number) {
  const steps = [10, 20, 25, 50, 100, 200, 250, 500, 1000];
  let pick = steps[0];
  for (const s of steps) if (s <= maxM) pick = s;
  return pick;
}

/** Plan-sheet drawing of a candidate's real centerline, drawn to scale. */
export default function CurveSketch({ candidate }: { candidate: Candidate }) {
  const p = candidate.properties,
    coords = candidate.geometry.coordinates,
    cos = Math.cos((p.center[1] * Math.PI) / 180),
    xs = coords.map((c) => c[0] * cos),
    ys = coords.map((c) => c[1]),
    minX = Math.min(...xs),
    minY = Math.min(...ys),
    dx = Math.max(Math.max(...xs) - minX, 1e-9),
    dy = Math.max(Math.max(...ys) - minY, 1e-9),
    scale = Math.min((W - 2 * PAD) / dx, (H - 2 * PAD) / dy),
    offX = (W - dx * scale) / 2,
    offY = (H - dy * scale) / 2,
    pts = coords.map((_, i) => [
      offX + (xs[i] - minX) * scale,
      H - offY - (ys[i] - minY) * scale,
    ]),
    d = "M" + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L"),
    pxPerMeter = scale / 111320,
    barMeters = niceMeters(110 / pxPerMeter),
    barPx = barMeters * pxPerMeter,
    start = pts[0],
    end = pts[pts.length - 1],
    label = (q: number[], text: string) => {
      const right = q[0] < W / 2;
      return (
        <text
          x={q[0] + (right ? 12 : -12)}
          y={q[1] + (q[1] < H / 2 ? 22 : -12)}
          textAnchor={right ? "start" : "end"}
          className="sketch-label"
        >
          {text}
        </text>
      );
    };
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Centerline of ${p.name}, drawn to scale with north up`}
    >
      <defs>
        <pattern id="sketch-grid" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M22 0H0V22" fill="none" className="sketch-gridline" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#sketch-grid)" />
      <path d={d} className="sketch-edge" pathLength={1} />
      <path d={d} className="sketch-road" pathLength={1} />
      <path d={d} className="sketch-center" />
      {[start, end].map((q, i) => (
        <circle key={i} cx={q[0]} cy={q[1]} r="5" className="sketch-node" />
      ))}
      {label(start, "PC")}
      {label(end, "PT")}
      <g transform={`translate(24 ${H - 26})`}>
        <path d={`M0 0H${barPx.toFixed(1)}M0 -5V5M${barPx.toFixed(1)} -5V5`} className="sketch-scale" />
        <text x="0" y="-10" className="sketch-label">
          {barMeters} m
        </text>
      </g>
      <g transform={`translate(${W - 30} 22)`}>
        <path d="M0 18V-6M-6 4 0 -6 6 4" className="sketch-scale" />
        <text x="0" y="34" textAnchor="middle" className="sketch-label">
          N
        </text>
      </g>
    </svg>
  );
}
