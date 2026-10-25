# Regional evidence and integration ledger

Reviewed October 24, 2026, America/Chicago. Full per-source metadata is in
`src/sources.ts` and displayed on the Data & Sources page. Raw ingestion
provenance, source timestamp and hash are in `data/raw/`.

## Successfully imported

- OSM / Geofabrik Arkansas extract, source timestamp 2026-10-23T20:20:51Z;
  1,777 deduplicated ways, 2,171 processed geometry segments, 845.9 km,
  1,333 accepted candidate groups in the four pilot areas.
- Census TIGERweb county polygons for Benton, Washington, Madison, Carroll.
- Census 119th Congress AR-3 polygon (BAS 2026 layer 4, not the 120th
  Congress layer 0). All pilot candidate centerpoints are inside it.

## Verified primary publications, not raw crash integration

NWARPC adopted its Vision Zero Safety Action Plan June 28, 2023:
https://www.nwarpc.org/transportation/vision-zero-plan/

Appendix B, Descriptive Crash Analysis, uses reported crashes from January 1,
2017 through December 31, 2021 in the NWARPC boundary, including Arkansas and
Missouri. It already uses OSM centerlines, derives intersections and conflates
other roadway attributes. Its Table 18 (printed p.48; PDF p.22) reports:

| Census-defined setting | All reported crashes | Fatal or serious injury (KA) crashes | KA / all reported crashes |
|---|---:|---:|---:|
| Urban |45,806|785|1.71%|
| Rural |13,090|584|4.46%|

These are crash outcome proportions, **not population-based fatality rates,
fatality totals, driving-exposure risks or AR-3 statistics**. Urban/rural
classification uses 2020 Census urban areas. Do not substitute county labels
for urban/rural status. The plan's High Injury Network and project ranking
serve an established regional prioritization role; CurveAudit adds a
reproducible geometry inventory and demonstration/report workflow, not an
unprecedented use of road geometry.

https://www.nwarpc.org/wp-content/uploads/2023/07/NW-Arkansas-Vision-Zero-Plan_APPENDIX_B_Final_web.pdf

Appendix D identifies White Road from West Huntsville Avenue to Elm Springs
Road (project 1-26, printed p.143) and West Huntsville Avenue from Mill Street
to White Road (project 1-33, printed p.144). This establishes corridor context;
it does not prove a particular curve is hazardous or missing a warning sign.
https://www.nwarpc.org/wp-content/uploads/2023/07/NW-Arkansas-Vision-Zero-Plan_APPENDIX_D_Final_web.pdf

## Research-only sources and exact gaps

- ACAT public Experience app opens, but a permitted machine-readable export
  was not established. No crash points, surface/weather attributes or matched
  histories are included.
- Arkansas GIS legacy road-centerline link redirects to the GIS Hub. No state
  centerlines were imported and no OSM positional comparison was completed.
- ARDOT portal reviewed; Appendix B identifies functional-class, traffic
  inventory and linear-speed-zone source families. No reliable speed-zone or
  AADT matching completed. Every official posted speed remains unknown.
- USGS LidarExplorer documents LiDAR/DEM discovery. Pilot tile coverage,
  vintage, resolution and vertical accuracy were not established. No elevation
  or grade was imported. Terrain DEM resolution does not establish banking.
- NHTSA FARS offers annual fatality census query/download access. No county
  2020–2024 calculation with matching population denominators was reproduced.
  The suggested Benton 9.3, Carroll 23.5, Madison 35.8 rates and approximately
  100 annual AR-3 deaths remain unverified and are excluded from the product.
- The complete main Vision Zero PDF exceeded the web extraction tool's size
  limit. Local PDF extraction subsequently verified Action 3-15, printed
  p.47 (PDF p.59): regional crash analysis focusing on curves and hills,
  led by NWARPC with ARDOT and member agencies. Appendix A, printed p.16
  (PDF p.12), verifies the West Huntsville Avenue HIN extent was manually
  extended through the White Road curve to bridge a gap between crash areas.
  This is historical network methodology, not a current sign-deficiency finding.
  https://www.nwarpc.org/wp-content/uploads/2023/07/NW-Arkansas-Vision-Zero-Plan_APPENDIX_A_Final_web.pdf

## Engineering references

Current federal MUTCD verified as 11th Edition with Revision 1, December 2025:
https://mutcd.fhwa.dot.gov/kno_11th_Editionr1.htm

Historical advisory-speed methodology (2011), not current legal criteria:
https://highways.dot.gov/sites/fhwa.dot.gov/files/2022-06/fhwasa1122.pdf

FHWA HFST candidate selection requires broader site evaluation:
https://highways.dot.gov/safety/rwd/keep-vehicles-road/pavement-friction/high-friction-surface-treatment-curve-selection-7

Signing, advisory plaques, chevrons, delineation, shoulder/roadside work and
friction treatments are conditional professional-review topics, never an
automatic legal recommendation from radius alone.
