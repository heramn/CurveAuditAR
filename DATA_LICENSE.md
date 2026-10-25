# Geographic data attribution

Road geometry and derived curve inventory: © OpenStreetMap contributors,
available under the Open Database License (ODbL) 1.0:
https://www.openstreetmap.org/copyright
https://opendatacommons.org/licenses/odbl/1-0/

The OSM-derived data in `data/raw/{Huntsville,Eureka Springs,Springdale,Bentonville}.json`
and `public/data/{roads,curves}.json` is distributed under ODbL 1.0.
Geofabrik provides the Arkansas extract:
https://download.geofabrik.de/north-america/us/arkansas.html

The full PBF is ignored by Git; four permitted public pilot subsets,
processing scripts, source timestamps and a source SHA-256 are included.
No OSM contributor names, user IDs or changeset identifiers are extracted.

County and district reference geography: U.S. Census Bureau TIGERweb,
public government data. Source service URLs and retrieval timestamps are
in `data/raw/*-provenance.json`.

Basemap tiles: © OpenStreetMap contributors, © CARTO.
https://carto.com/attributions
Tile access requires connectivity and is subject to provider terms.
The map's locally bundled roads and curve overlays remain available if tiles fail.

External research publications are cited and linked, not redistributed as
application-owned datasets. No individual crash database is included.
