import {
  ArrowRight,
  ArrowUpRight,
  Database,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Candidate, Stats } from "./types";
import { sources } from "./sources";
export default function Research({
  view,
  stats,
  curves,
  onExplore,
}: {
  view: string;
  stats: Stats;
  curves: Candidate[];
  onExplore: () => void;
}) {
  const [district, setDistrict] = useState("");
  const [regional, setRegional] = useState<{
    period: string;
    url: string;
    geography: string;
    rows: {
      setting: string;
      reportedCrashes: number;
      fatalOrSeriousInjuryCrashes: number;
    }[];
  } | null>(null);
  useEffect(() => {
    fetch("/data/regional-context.json")
      .then((r) => (r.ok ? r.json() : null))
      .then(setRegional)
      .catch(() => {});
    fetch("/data/district-check.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d)
          setDistrict(
            `${d.inside} of ${d.total} candidate centerpoints fall inside the imported 119th Congress AR-3 polygon.`,
          );
      })
      .catch(() => {});
  }, []);
  if (view === "sources")
    return (
      <section className="page research-page">
        <div className="eyebrow">EVIDENCE YOU CAN INSPECT</div>
        <h1>
          Open data.
          <br />
          <em>Nothing invented.</em>
        </h1>
        <p className="lead">
          An honest ledger of what powers the application, what we verified, and
          what still needs work.
        </p>
        <div className="source-summary">
          <span>
            <Database size={18} />
            {sources.filter((s) => s.status === "Imported").length} imported
            datasets
          </span>
          <span>
            <ShieldCheck size={18} />
            {
              sources.filter((s) => s.status === "Verified publication").length
            }{" "}
            publication references
          </span>
          <span>
            <Layers size={18} />
            {
              sources.filter((s) => s.status.includes("not integrated")).length
            }{" "}
            sources researched only
          </span>
        </div>
        <div className="source-cards">
          {sources.map((s) => (
            <details className="source-card" key={s.name}>
              <summary>
                <span
                  className={`source-status ${s.status === "Imported" ? "imported" : ""}`}
                >
                  {s.status}
                </span>
                <h3>{s.name}</h3>
                <p>{s.publisher}</p>
                <ArrowUpRight size={18} />
              </summary>
              <div className="source-body">
                <a href={s.url} target="_blank" rel="noreferrer">
                  Open primary source <ArrowUpRight size={14} />
                </a>
                <dl>
                  {[
                    ["Source date", s.date],
                    ["Retrieval date", s.retrieved],
                    ["Coverage", s.coverage],
                    ["Format", s.format],
                    ["License / use", s.license],
                    ["Fields used", s.fields],
                    ["Limitations", s.limitations],
                    ["Local provenance", s.path],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </details>
          ))}
        </div>
        <p className="privacy-note">
          Basemap: © OpenStreetMap contributors. Tiles are external requests;
          the browser sends its network address and requested map extent to the
          tile provider. No GPS histories or motion readings are uploaded by
          CurveAudit.
        </p>
      </section>
    );
  if (view === "methodology")
    return (
      <section className="page research-page">
        <div className="eyebrow">UNDER THE HOOD / METHOD V1.0.0</div>
        <h1>
          From a line on a map
          <br />
          <em>to a question worth asking.</em>
        </h1>
        <p className="lead">
          Reproducible geometric screening, with the uncertainty kept in view.
        </p>
        <div className="method-steps">
          {[
            [
              "Import & preserve",
              "Complete OSM road ways intersecting four pilot bounding boxes are extracted from the Geofabrik Arkansas PBF. Original way IDs, node IDs, tags and available timestamps are retained. Only trunk, primary, secondary, tertiary, unclassified and their selected links are included. This is not a complete road inventory.",
            ],
            [
              "Project & split",
              "Coordinates are projected to UTM Zone 15N (EPSG:32615), in meters. Invalid points and duplicates are removed. Shared OSM node IDs identify boundaries for splitting ways; this is a conservative topology heuristic, not a complete grade-separated intersection model.",
            ],
            [
              "Resample & estimate",
              "Centerlines are resampled every 10 m and smoothed with a symmetric 1–2–1 average. A three-point circumcircle uses points 20 m on either side of the center. R = abc / 4A. Nearly collinear and degenerate triangles return no finite radius.",
            ],
            [
              "Group & screen",
              "Same-direction adjacent samples with radii 25–650 m are grouped. Candidates require at least three samples, 60 m length and 18° net heading change. Median sampled radius represents the curve. Variable-radius groups may receive insufficient-evidence status.",
            ],
            [
              "Prioritize transparently",
              "Higher: median radius below 150 m and heading change ≥35°. Moderate: radius below 300 m. Lower: remaining accepted curves. Insufficient evidence: largest-to-smallest sampled radius ratio >4. These are prototype research thresholds, not FHWA risk categories.",
            ],
            [
              "Bring a professional into the loop",
              "Survey radius, cross-slope and sight distance. Inventory signs and roadside conditions. Match official speed, friction, traffic and crash data. Only then assess treatments using engineering judgment and applicable standards.",
            ],
          ].map(([title, text], i) => (
            <article key={title}>
              <span>{(i + 1).toString().padStart(2, "0")}</span>
              <div>
                <h2>{title}</h2>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="notice">
          <strong>What the algorithm cannot tell you</strong>
          <p>
            OSM vertices are not surveyed pavement points. Resampling does not
            create new measured detail. Smoothing can bias radius. Junctions,
            sparse geometry, transitions and short ways can produce artifacts or
            missed curves. Counts depend on extraction, splitting and
            thresholds. Left/right follows source order. No crash probability,
            missing-sign conclusion or driving-speed determination is made.
          </p>
        </div>
        <a
          className="button"
          href="https://github.com/heramn/CurveAuditAR/blob/main/docs/METHODOLOGY.md"
          target="_blank"
          rel="noreferrer"
        >
          Inspect the method & tests <ArrowUpRight size={16} />
        </a>
      </section>
    );
  const max = Math.max(...stats.pilots.map((p) => p.candidates));
  return (
    <section className="page research-page">
      <div className="eyebrow">LOCAL IMPACT / NORTHWEST ARKANSAS</div>
      <h1>
        Small communities.
        <br />
        <em>Connected by winding roads.</em>
      </h1>
      <p className="lead">
        A practical inventory for four pilot areas, built to complement the
        region’s existing safety work.
      </p>
      <div className="impact-grid">
        <article className="panel">
          <span className="eyebrow">OUR ACTUAL DATASET</span>
          <h2>{stats.analyzedKm.toLocaleString()} km of analyzed centerline</h2>
          <p>
            Complete ways intersecting four boxes can extend beyond the boxes.
            Counts describe this extracted subset, not all roads in each county.
          </p>
          <div
            className="bar-chart"
            role="img"
            aria-label="Curve candidate counts by pilot area"
          >
            {stats.pilots.map((p) => (
              <div key={p.name}>
                <span>{p.name}</span>
                <div>
                  <i style={{ width: `${(100 * p.candidates) / max}%` }} />
                </div>
                <strong>{p.candidates}</strong>
              </div>
            ))}
          </div>
          <p className="chart-note">
            Geometry candidates · not crashes or proven hazards
            <br />
            Processed{" "}
            {new Date(stats.processedAt).toLocaleDateString("en-US", {
              timeZone: "America/Chicago",
            })}{" "}
            Central · OSM / Geofabrik
          </p>
        </article>
        <article className="impact-story">
          <span className="eyebrow">BUILDING ON LOCAL WORK</span>
          <h2>
            A new layer for
            <br />a shared mission.
          </h2>
          <p>
            NWARPC adopted its Vision Zero Safety Action Plan on June 28, 2023.
            Its Appendix B examines reported crashes from 2017–2021 within the
            regional planning boundary, including Arkansas and Missouri.
          </p>
          <p>
            Action 3-15 calls for regional analysis of crashes on curves and
            hills. The geometry inventory could help scope field investigations
            alongside that established work.
          </p>
          <p>
            That study already uses OSM centerlines and considers infrastructure
            context. CurveAudit adds a reproducible curve inventory, inspectable
            assumptions, a printable review workflow and a stationary audio
            demonstration.
          </p>
          <a
            className="text-link"
            href="https://www.nwarpc.org/transportation/vision-zero-plan/"
            target="_blank"
            rel="noreferrer"
          >
            Read the regional plan <ArrowUpRight size={15} />
          </a>
        </article>
      </div>
      {regional && (
        <article className="panel regional-evidence">
          <span className="eyebrow">
            PUBLISHED REGIONAL CONTEXT / 2017–2021
          </span>
          <h2>Rural crashes had a larger serious-outcome share.</h2>
          <p>
            NWARPC’s historical study reports fatal or serious injury (KA)
            outcomes in {regional.period}. This compares outcomes among reported
            crashes, not the risk per trip or per resident.
          </p>
          <div
            className="outcome-bars"
            role="img"
            aria-label="Share of reported crashes involving fatal or serious injury: urban 1.71 percent, rural 4.46 percent, NWARPC study area 2017 to 2021"
          >
            {regional.rows.map((row) => {
              const percent =
                (100 * row.fatalOrSeriousInjuryCrashes) / row.reportedCrashes;
              return (
                <div key={row.setting}>
                  <span>{row.setting}</span>
                  <div>
                    <i style={{ width: `${(percent / 5) * 100}%` }} />
                  </div>
                  <strong>{percent.toFixed(2)}%</strong>
                  <small>
                    {row.fatalOrSeriousInjuryCrashes.toLocaleString()} KA /{" "}
                    {row.reportedCrashes.toLocaleString()} reported crashes
                  </small>
                </div>
              );
            })}
          </div>
          <p className="chart-note">
            {regional.geography}. Urban/rural uses 2020 Census areas. Historical
            proportions do not establish that any selected curve caused a crash.
          </p>
          <a
            className="text-link"
            href={regional.url}
            target="_blank"
            rel="noreferrer"
          >
            Inspect Appendix B, Table 18, printed page 48{" "}
            <ArrowUpRight size={14} />
          </a>
        </article>
      )}
      <div className="impact-facts">
        <div>
          <strong>{curves.length}</strong>
          <span>Screened curve candidates</span>
        </div>
        <div>
          <strong>
            {curves.filter((c) => c.properties.osmMaxspeed).length}
          </strong>
          <span>With unverified OSM speed tags</span>
        </div>
        <div>
          <strong>0</strong>
          <span>With verified banking or friction</span>
        </div>
      </div>
      <div className="panel coverage-panel">
        <h2>Local coverage, precisely stated.</h2>
        <p>
          The current release covers pilot corridors near Huntsville, Eureka
          Springs, Springdale and Bentonville in Madison, Carroll, Washington
          and Benton counties. Census county polygons assign candidate
          locations. {district}
        </p>
        <p>
          The imported 119th Congress district polygon provides a geographic
          reference. Crawford, Sebastian and a full AR-3 inventory are future
          work. The pilot does not assume whole counties equal the congressional
          district.
        </p>
      </div>
      <div className="notice">
        <strong>A local example of why geometry needs human review</strong>
        <p>
          The plan’s Appendix A says the historical West Huntsville Avenue High
          Injury Network extent was manually extended through the White Road
          curve to connect adjacent crash areas. That documents a network-method
          refinement, not a current finding about curve signs.
        </p>
        <a
          className="text-link"
          href="https://www.nwarpc.org/wp-content/uploads/2023/07/NW-Arkansas-Vision-Zero-Plan_APPENDIX_A_Final_web.pdf#page=12"
          target="_blank"
          rel="noreferrer"
        >
          Inspect the source, printed page 16 <ArrowUpRight size={14} />
        </a>
      </div>
      <div className="notice">
        <strong>Why there isn’t a county fatality-rate chart here</strong>
        <p>
          The proposed 2020–2024 county rates and annual AR-3 death count have
          not been reproduced with verified fatality totals and matching
          population denominators. They are excluded. Candidate counts cannot
          establish that one community is more dangerous than another.
        </p>
      </div>
      <button className="button" onClick={onExplore}>
        Explore the actual inventory <ArrowRight size={16} />
      </button>
    </section>
  );
}
