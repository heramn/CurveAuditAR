# CurveAudit AR

**A closer look at the road ahead.** Geometry-first preliminary roadway-curve
screening for Northwest Arkansas, a printable field-review workflow, and a
stationary spoken-warning demonstration.

Production target: https://curveauditar.vercel.app
Repository: https://github.com/heramn/CurveAuditAR
Actual deployment and testing status: [docs/VERIFICATION.md](docs/VERIFICATION.md).

## Features

- Interactive Leaflet auditor with real road geometry, county polygons,
  clickable curves, search, county/priority filters and GeoJSON export.
- **1,333 candidate groups**, **1,777 OSM ways**, **845.9 km** of analyzed
  centerline near Huntsville, Eureka Springs, Springdale and Bentonville.
- Inspectable estimated radius, heading, source direction, class and evidence gaps.
- Printable selected-candidate preliminary audit with vector geometry,
  actual data, professional-review checklist and primary references.
- Stationary Co-Pilot: real source-road approach, moving simulated position,
  changing distance, once-per-run speech request, stop/reset/replay controls.
- Foreground GPS proximity and stationary motion sampling diagnostics.
- Educational physics explorer with explicit hypothetical inputs and validation.
- Local Impact, Methodology, Data & Sources registry, and 16 meaningful tests.

NWARPC already uses road geometry and OSM. The contribution is the integrated,
reproducible inventory, transparent calculations, report workflow and audio
demonstration. No crash reduction or certified speed accuracy is claimed.

## Architecture and setup

Vite + React + TypeScript; Leaflet; proj4; lucide-react; CSS. No backend account,
database, paid API key, environment variables or runtime Overpass query.
Bundled JSON/GeoJSON supplies the app. External tiles and fonts have fallbacks.
Python/osmium extracts public OSM data; Node processes it offline.

Node 22.12+ or 24 LTS recommended. Development was also checked on Node 25.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

## Regenerate geographic data

```sh
python -m pip install -r requirements-data.txt
npm run data:fetch
npm run data:process
npm test
```

First fetch downloads about 100 MB. A cached PBF is reused; move it aside
explicitly to request a newer snapshot. Source timestamp for this release:
**2026-10-23T20:20:51Z**. Extracted October 24, 2026 Central Time.
For exact release reproduction, use the committed pilot JSON extracts and
run only `data:process`. Processing timestamps intentionally change.

The full PBF is ignored by Git. Small pilot subsets, scripts, source timestamp
and hash are committed. No contributor user IDs, names or changesets are extracted.

See [method and uncertainty](docs/METHODOLOGY.md), [regional research](docs/RESEARCH.md),
[licensing](DATA_LICENSE.md), and the full registry in `src/sources.ts`.

## Engineering boundaries

Candidates are geometry groups, not certified physical-curve counts or hazards.
OSM sampling/smoothing can bias radius, miss curves or fragment physical curves.
Research thresholds are uncalibrated. Official speeds, advisory signs, banking,
friction, grade, sight distance, traffic exposure and matched crash histories
are unverified. OSM maxspeed tags are retained as unverified metadata.

No driving speed is computed for actual candidates. Physics Explorer uses
`V = sqrt(15 R_feet (e+f))` with explicit hypothetical assumptions. It is not
an official advisory-speed determination. Treatments require professional
assessment under applicable MUTCD and state/local criteria.

## Privacy and demonstration

Use the demo while stationary. Blue movement is simulated; GPS is unnecessary.
Speech can be unavailable, muted or blocked; text and manual replay remain.
No real driving or physical-device field trial was performed.

GPS/motion permissions are requested only upon activation. Readings remain in
memory; no telemetry or trip history is uploaded or persisted. Stop diagnostics
or leave Co-Pilot to clear readings. CARTO tile and Google Fonts requests share
network address with those providers; tiles also disclose requested map extent.

GPS shows distance to geometry vertices; direction/map matching are unvalidated,
so live GPS alerts are disabled. Sensor rate is observed, not promised 60 Hz.
Motion is not certified banking or a ball-bank measurement. Foreground support
only; background operation alongside navigation apps is not claimed.

## Deployment and CI

Vercel `curveauditar`: Vite; build `npm run build`; output `dist`; install
`npm ci`; branch `main`; no secrets. Actual status is in VERIFICATION.md.
GitHub Actions installs, tests and builds. Source code is MIT; OSM-derived
databases are ODbL, and Census boundaries are public government data.

## Demo and next steps

[90-second script and recording checklist](docs/DEMO.md).

Next: survey validation, parameter sensitivity, authoritative signs/speeds,
matched crash/traffic evidence, intersection modeling, calibrated priorities,
broader AR-3 coverage, physical mobile-browser trials and direction-aware GPS.
