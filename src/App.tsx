import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  FileText,
  Info,
  MapPin,
  Navigation,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import MapView from "./MapView";
import Physics from "./Physics";
import Copilot from "./Copilot";
import Report from "./Report";
import Research from "./Research";
import CurveSketch from "./CurveSketch";
import type { Candidate, Stats } from "./types";

type View =
  | "auditor"
  | "copilot"
  | "physics"
  | "impact"
  | "methodology"
  | "sources"
  | "report";

const navigation = [
  { id: "auditor", label: "Auditor" },
  { id: "copilot", label: "Co-Pilot" },
  { id: "physics", label: "Physics" },
  { id: "impact", label: "Local impact" },
  { id: "methodology", label: "Method" },
  { id: "sources", label: "Sources" },
] as const;

const views: string[] = [
  "auditor",
  "copilot",
  "physics",
  "impact",
  "methodology",
  "sources",
  "report",
];

function SignMark() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M20 2 38 20 20 38 2 20Z"
        fill="#f7c600"
        stroke="#13263a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 28.5C15.5 21 24 22 24 14.5M19.5 18.5 24 13.5l4.5 5"
        fill="none"
        stroke="#13263a"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function App() {
  const [view, setView] = useState<View>(() => {
      const v = new URLSearchParams(location.search).get("view");
      return (views.includes(v || "") ? v : "auditor") as View;
    }),
    [curves, setCurves] = useState<Candidate[]>([]),
    [stats, setStats] = useState<Stats | null>(null),
    [selected, setSelected] = useState<Candidate | null>(null),
    [county, setCounty] = useState("All counties"),
    [priority, setPriority] = useState("All priorities"),
    [query, setQuery] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    Promise.all(
      ["/data/curves.json", "/data/stats.json"].map((url) =>
        fetch(url, { signal: abort.signal }).then((r) => {
          if (!r.ok) throw Error(`Could not load ${url}`);
          return r.json();
        }),
      ),
    )
      .then(([data, summary]) => {
        setCurves(data.features);
        setStats(summary);
        setSelected(
          data.features.find(
            (c: Candidate) =>
              c.properties.id ===
              new URLSearchParams(location.search).get("candidate"),
          ) ||
            data.features.find(
              (c: Candidate) =>
                c.properties.pilot === "Eureka Springs" &&
                c.properties.priority === "Higher" &&
                c.properties.radiusM > 90,
            ) ||
            data.features[0],
        );
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => abort.abort();
  }, []);
  const filtered = useMemo(
    () =>
      curves.filter(
        (c) =>
          (county === "All counties" || c.properties.county === county) &&
          (priority === "All priorities" ||
            c.properties.priority === priority) &&
          `${c.properties.name} ${c.properties.ref || ""} ${c.properties.pilot} ${c.properties.id}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [curves, county, priority, query],
  );
  const active =
    filtered.find((c) => c.properties.id === selected?.properties.id) ||
    filtered[0] ||
    null;
  function navigate(v: View) {
    history.replaceState(null, "", v === "auditor" ? "/" : "/?view=" + v);
    setView(v);
    window.scrollTo({ top: 0 });
  }
  function download() {
    const blob = new Blob(
        [
          JSON.stringify(
            { type: "FeatureCollection", features: filtered },
            null,
            2,
          ),
        ],
        { type: "application/geo+json" },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "curveaudit-filtered-candidates.geojson";
    a.click();
    URL.revokeObjectURL(url);
  }
  const dataDate = stats
    ? new Date(stats.processedAt).toLocaleDateString("en-US", {
        timeZone: "America/Chicago",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => navigate("auditor")}
          aria-label="CurveAudit AR home"
        >
          <SignMark />
          <span>
            CurveAudit<span className="brand-ar">AR</span>
          </span>
        </button>
        <nav className="tabs" aria-label="Main navigation">
          {navigation.map(({ id, label }) => (
            <button
              key={id}
              className="tab"
              aria-current={
                view === id || (view === "report" && id === "auditor")
                  ? "page"
                  : undefined
              }
              onClick={() => navigate(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="stamp">
          {stats ? `Data processed ${dataDate}` : "Loading dataset"}
        </div>
      </header>
      <main id="main">
        {error ? (
          <div className="page">
            <h1>The dataset could not load.</h1>
            <p role="alert">{error}</p>
            <button className="button" onClick={() => location.reload()}>
              Retry loading
            </button>
          </div>
        ) : !stats ? (
          <div className="loading" role="status">
            <SignMark />
            <p>Loading the Northwest Arkansas pilot…</p>
          </div>
        ) : view === "auditor" ? (
          <>
            <section className="hero">
              <div className="hero-copy">
                <h1>A closer look at the road ahead.</h1>
                <p className="lead">
                  Screen real Northwest Arkansas road geometry for curves that
                  deserve a field visit, then print a preliminary audit for the
                  ones you pick.
                </p>
                <div className="hero-actions">
                  <button
                    className="button primary"
                    onClick={() =>
                      document
                        .getElementById("inventory")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Explore the inventory <ArrowRight size={18} />
                  </button>
                  <button
                    className="button ghost"
                    onClick={() => navigate("methodology")}
                  >
                    Read the method
                  </button>
                </div>
              </div>
              {active && (
                <figure className="sheet">
                  <CurveSketch key={active.properties.id} candidate={active} />
                  <figcaption>
                    <div>
                      <span>Radius</span>
                      <strong>≈ {active.properties.radiusM} m</strong>
                    </div>
                    <div>
                      <span>Heading change</span>
                      <strong>
                        {active.properties.headingDeg}°{" "}
                        {active.properties.direction.toLowerCase()}
                      </strong>
                    </div>
                    <div>
                      <span>Length</span>
                      <strong>{active.properties.lengthM} m</strong>
                    </div>
                  </figcaption>
                  <div className="sheet-title">
                    <span>{active.properties.name}</span>
                    <span>{active.properties.county} County</span>
                  </div>
                </figure>
              )}
            </section>
            <section className="titleblock" aria-label="Pilot dataset metrics">
              <div>
                <span>Road ways processed</span>
                <strong>{stats.ways.toLocaleString()}</strong>
                <small>{stats.analyzedKm.toLocaleString()} km analyzed</small>
              </div>
              <div>
                <span>Curve candidates</span>
                <strong>{stats.candidates.toLocaleString()}</strong>
                <small>Geometry-based screening</small>
              </div>
              <div>
                <span>Pilot counties</span>
                <strong>
                  {stats.counties.length.toString().padStart(2, "0")}
                </strong>
                <small>Northwest Arkansas</small>
              </div>
              <div>
                <span>Verified speed inputs</span>
                <strong>
                  {stats.verifiedSpeeds.toString().padStart(2, "0")}
                </strong>
                <small>Field evidence needed</small>
              </div>
              <p className="titleblock-foot">
                Pilot areas: Huntsville, Eureka Springs, Springdale and
                Bentonville. Preliminary screening only; professional review
                comes next.
              </p>
            </section>
            <section className="auditor-workspace" id="inventory">
              <div className="section-heading">
                <h2>
                  Explore the curve inventory
                  <span className="count-badge">{filtered.length} shown</span>
                </h2>
                <button className="button ghost small" onClick={download}>
                  <ArrowDownToLine size={16} /> Export GeoJSON
                </button>
              </div>
              <div className="filterbar">
                <label className="search-field">
                  <Search size={18} />
                  <input
                    aria-label="Search roads or places"
                    placeholder="Search a road, place or candidate"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <label className="filter-select">
                  <MapPin size={16} />
                  <select
                    aria-label="County filter"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                  >
                    <option>All counties</option>
                    {stats.counties.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="filter-select">
                  <SlidersHorizontal size={16} />
                  <select
                    aria-label="Priority filter"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option>All priorities</option>
                    {[
                      "Higher",
                      "Moderate",
                      "Lower",
                      "Insufficient evidence",
                    ].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </label>
                {(query ||
                  county !== "All counties" ||
                  priority !== "All priorities") && (
                  <button
                    className="clear-filter"
                    onClick={() => {
                      setQuery("");
                      setCounty("All counties");
                      setPriority("All priorities");
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="map-and-details">
                <MapView
                  curves={filtered}
                  selected={active}
                  onSelect={setSelected}
                />
                <aside
                  className="candidate-panel"
                  aria-label="Selected curve details"
                >
                  {active ? (
                    <>
                      <span
                        className={`priority priority-${active.properties.priority.split(" ")[0].toLowerCase()}`}
                      >
                        <i />
                        {active.properties.priority} review priority
                      </span>
                      <h2>{active.properties.name}</h2>
                      <p className="location">
                        <MapPin size={15} />
                        {active.properties.county} County ·{" "}
                        {active.properties.pilot}
                      </p>
                      <div className="radius">
                        <strong>
                          {active.properties.radiusM}
                          <small>m</small>
                        </strong>
                        <span>
                          Estimated horizontal radius, about{" "}
                          {Math.round(
                            active.properties.radiusM / 0.3048,
                          ).toLocaleString()}{" "}
                          ft, from the OSM centerline
                        </span>
                      </div>
                      <dl className="data-table">
                        <dt>Heading change</dt>
                        <dd>
                          {active.properties.headingDeg}°{" "}
                          {active.properties.direction.toLowerCase()}
                        </dd>
                        <dt>Curve length</dt>
                        <dd>{active.properties.lengthM} m</dd>
                        <dt>Posted speed</dt>
                        <dd>Not verified</dd>
                        <dt>Banking & friction</dt>
                        <dd>Unknown</dd>
                        <dt>Engineering status</dt>
                        <dd>Not field reviewed</dd>
                      </dl>
                      <div className="why-review">
                        <Info size={18} />
                        <div>
                          <strong>Why take a closer look?</strong>
                          <p>{active.properties.rationale}</p>
                        </div>
                      </div>
                      <button
                        className="button primary full"
                        onClick={() => {
                          setSelected(active);
                          navigate("report");
                          history.replaceState(
                            null,
                            "",
                            "/?view=report&candidate=" + active.properties.id,
                          );
                        }}
                      >
                        <FileText size={18} /> Generate preliminary audit
                      </button>
                      <button
                        className="text-link"
                        onClick={() => navigate("copilot")}
                      >
                        <Navigation size={16} /> Try the Co-Pilot demo{" "}
                        <ArrowUpRight size={15} />
                      </button>
                      <a
                        className="source-link"
                        href={`https://www.openstreetmap.org/way/${active.properties.osmId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        OSM way {active.properties.osmId}, source geometry{" "}
                        <ExternalLink size={13} />
                      </a>
                    </>
                  ) : (
                    <div className="empty-state">
                      <Search size={28} />
                      <h3>No matching curves</h3>
                      <p>Try another county, priority or road name.</p>
                    </div>
                  )}
                </aside>
              </div>
              <div className="map-footnote">
                <Info size={16} />
                <span>
                  Priority helps organize field review. It is not a
                  dangerous-road designation or a prediction of a crash.
                </span>
                <button onClick={() => navigate("methodology")}>
                  How it works <ArrowUpRight size={14} />
                </button>
              </div>
              <details className="inventory">
                <summary>
                  Browse all {filtered.length} matching candidates
                </summary>
                <div className="candidate-list">
                  {filtered.map((c) => (
                    <button
                      key={c.properties.id}
                      onClick={() => {
                        setSelected(c);
                        document
                          .querySelector(".map-and-details")
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                      }}
                      className={
                        active?.properties.id === c.properties.id
                          ? "chosen"
                          : ""
                      }
                    >
                      <span>
                        {c.properties.name}
                        <small>
                          {c.properties.county} · {c.properties.id}
                        </small>
                      </span>
                      <span>
                        {c.properties.radiusM} m <ChevronRight size={15} />
                      </span>
                    </button>
                  ))}
                </div>
              </details>
            </section>
            <section className="workflow" aria-label="How a candidate becomes a field visit">
              <h2>From data to a better question</h2>
              <ol>
                <li>
                  <b>1</b>
                  <span>
                    Real road geometry
                    <small>OpenStreetMap centerlines, unaltered</small>
                  </span>
                </li>
                <li>
                  <b>2</b>
                  <span>
                    Transparent screening
                    <small>Radius, heading change and length, in the open</small>
                  </span>
                </li>
                <li>
                  <b>3</b>
                  <span>
                    Professional field review
                    <small>Where engineering judgment takes over</small>
                  </span>
                </li>
              </ol>
            </section>
          </>
        ) : view === "physics" ? (
          <Physics />
        ) : view === "copilot" ? (
          <Copilot curves={curves} initial={selected} />
        ) : view === "report" && selected ? (
          <Report candidate={selected} onBack={() => navigate("auditor")} />
        ) : (
          <Research
            view={view}
            stats={stats}
            curves={curves}
            onExplore={() => navigate("auditor")}
          />
        )}
      </main>
      <footer className="main-footer">
        <span>
          CurveAudit AR is a preliminary screening tool, not an engineering
          study. Open data, clear assumptions, human judgment.
        </span>
        <a
          href="https://github.com/heramn/CurveAuditAR"
          target="_blank"
          rel="noreferrer"
        >
          Open source on GitHub <ExternalLink size={13} />
        </a>
      </footer>
    </>
  );
}
