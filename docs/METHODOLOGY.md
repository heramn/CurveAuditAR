# Curve geometry screening, v1.0.0

This is an offline reproducible inventory generator, not an advisory-speed
instrument, crash model, survey or finding that a road is unsafe.

## Input and scope

Geofabrik Arkansas OSM PBF source timestamp: **2026-10-23T20:20:51Z**.
Complete ways with at least one vertex in four bounding boxes are extracted:

| Pilot | South | West | North | East |
|---|---:|---:|---:|---:|
| Huntsville |35.99|-93.83|36.13|-93.65|
| Eureka Springs |36.32|-93.84|36.44|-93.65|
| Springdale |36.13|-94.24|36.22|-94.08|
| Bentonville |36.30|-94.30|36.40|-94.15|

Trunk, primary, secondary, tertiary, unclassified, and corresponding selected
link ways are included. Residential streets and many local roads are excluded.
Ways can extend outside a box. This is not complete county or district coverage.
Ways are deduplicated by OSM ID across pilots; the first pilot gets the way.
County assignment uses the candidate midpoint and actual Census polygons.
The 119th Congress district polygon is separately imported and checked:
all 1,333 candidate centerpoints fall within AR-3. Centerpoint membership is
not full geometry clipping. No assumption is made about whole-county membership.

## Processing

1. Preserve way IDs, node IDs, road tags and available source timestamps.
2. Convert WGS84 lon/lat to **EPSG:32615 / UTM Zone 15N**, meters, using proj4.
3. Remove invalid coordinates and consecutive duplicate vertices.
4. Split a way at nodes shared by imported ways. This heuristic can over-split
   attribute boundaries and does not model all intersections or grade separation.
5. Resample at 10 m along the source polyline. Segments too short for the
   40 m chord window do not yield candidates. The final sub-10 m remainder
   is not sampled.
6. Apply one symmetric 1–2–1 weighted smoothing pass to interior samples.
7. For each interior sample, use points 20 m before and after it to calculate
   the circumcircle radius `R = abc/(4A)`. Duplicate, degenerate or nearly
   collinear triples produce Infinity and cannot seed a curve group.
8. Group adjacent, same-signed turns with finite radii 25–650 m and local
   heading change above 0.015 rad. Sign reversals terminate a group.
9. Keep groups with at least 3 samples, at least 60 m support length and
   absolute net heading change ≥18°. Median sample radius represents the group.
10. Export LineString geometry, median/range of radii, source direction,
    heading, length, provenance, explicit missing data, quality and review status.

Left/right describes OSM source order; it reverses for opposite travel.
Reported integer radii are approximate, not survey precision. The sample radius
range is variability, not a statistical confidence interval.

## Research priority thresholds

Apply insufficient evidence first when max/min local radius >4.
Otherwise Higher = median R <150 m and heading ≥35°; Moderate = R <300 m;
Lower = other accepted curves. These are transparent prototype thresholds,
not calibrated risk categories, FHWA rules or evidence of inadequate signing.

## Uncertainty

Resampling cannot restore missing measured detail. Long OSM chords, junctions,
source spacing, vertex artifacts and smoothing can bias the radius. Shared-node
splitting and OSM way boundaries can fragment one physical curve. Candidate
groups have overlapping support windows and are not guaranteed unique physical
curves. No sensitivity analysis or survey validation has been completed.
There is no certified absolute radius error bound. Professionally review the
source geometry before interpreting candidate counts or ranking roads.

## Physics

`V_mph = sqrt(15 * R_feet * (e + f))`; `R_feet = R_meters / 0.3048`.
This is an educational equilibrium relationship. The explorer accepts explicitly
hypothetical nonnegative inputs, bounds e to 0–0.12 and f to 0–0.40, rejects
missing/invalid values and disallows e+f=0. It does not model adverse cross-slope,
changing friction with speed, weather, vehicles, sight distance or surface state.
The production inventory has unknown banking and friction and therefore
does not compute any driving or advisory speed.

## Demonstration

The Co-Pilot selects a real candidate with at least 350 m of upstream source
geometry where available. It uses the last at most 450 m of that geometry,
interpolated by cumulative great-circle length. The blue point advances at
25 m/s purely for a short stationary demonstration. One speech request fires
at 150 m, or half route length on shorter routes. Stop cancels speech and
pauses movement; reset clears the alert latch. Replay is explicit. Audio requires
a foreground supported browser and may be blocked; readable warnings remain.

GPS diagnostics show approximate distance to candidate vertices, not a
map-matched route approach. No direction-validated GPS alert is implemented;
no GPS warnings are emitted. GPS accuracy is shown. Sensor values and observed
event frequency are diagnostics, never road cross-slope or a certified ball-bank.

## Field work required

Validate alignment/radius, signs, sight distance, road ownership, traffic
exposure, cross-slope, pavement friction and matched crash history. Have a
qualified professional apply current MUTCD criteria and state/local standards.
Current official federal publication verified: MUTCD 11th Edition with
Revision 1, December 2025, https://mutcd.fhwa.dot.gov/kno_11th_Editionr1.htm.
