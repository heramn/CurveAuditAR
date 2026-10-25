# Release verification

Status at initial commit: local production build passed; 16 core/dataset
tests passed. GitHub and production deployment verification are in progress.
This file is updated with confirmed results before final delivery.

## Data and calculations

- Source PBF timestamp 2026-10-23T20:20:51Z; SHA-256 recorded locally.
- 1,333 candidates reconcile with metrics and four pilot subtotals.
- All 1,333 centerpoints fall inside the Census 119th Congress AR-3 polygon.
- Synthetic arc radii 25, 100, 500 and 1000 m; straight/near-collinear,
  duplicates, invalid/missing/short geometry, reversal and irregular spacing pass.
- Unit conversion, valid/invalid/missing physics input and simulation steps pass.

## Local browser observations

- Auditor loads actual data and geographic basemap with attribution.
- Madison + Higher filter gives 14 results; selected data changes appropriately.
- Invalid search shows an empty state; Clear restores the full inventory.
- Generate audit uses the selected Magnetic Drive candidate, CA-12742345-0-157,
  91 m radius, 47° left heading, 90 m length and original OSM way 12742345.

## Not yet verified at this commit

Production hosting, remote commit, continuous deployment, speech playback,
print output and all viewport checks. Physical phone audio, GPS/sensor hardware,
denied-permission behavior on each operating system and field engineering
accuracy cannot be claimed from desktop-only testing.
