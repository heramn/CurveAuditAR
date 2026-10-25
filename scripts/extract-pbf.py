"""Extract complete OSM ways intersecting four pilot boxes from Geofabrik PBF."""
import json, osmium, datetime, hashlib
from pathlib import Path
pilots=[dict(name='Huntsville',bbox=[35.99,-93.83,36.13,-93.65]),dict(name='Eureka Springs',bbox=[36.32,-93.84,36.44,-93.65]),dict(name='Springdale',bbox=[36.13,-94.24,36.22,-94.08]),dict(name='Bentonville',bbox=[36.30,-94.30,36.40,-94.15])]
class Extract(osmium.SimpleHandler):
 def __init__(self):
  super().__init__();self.data={p['name']:[] for p in pilots}
 def way(self,w):
  if w.tags.get('highway','') not in ['primary','secondary','tertiary','unclassified','trunk','primary_link','secondary_link','tertiary_link','trunk_link']:return
  try: geom=[dict(lat=n.lat,lon=n.lon) for n in w.nodes]
  except osmium.InvalidLocationError:return
  for p in pilots:
   s,west,north,east=p['bbox']
   if any(west<=v['lon']<=east and s<=v['lat']<=north for v in geom):self.data[p['name']].append(dict(type='way',id=w.id,nodes=[n.ref for n in w.nodes],tags=dict(w.tags),geometry=geom,timestamp=str(w.timestamp)))
handler=Extract();handler.apply_file('data/raw/arkansas-latest.osm.pbf',locations=True,idx='flex_mem')
retrieved=datetime.datetime.now(datetime.timezone.utc).isoformat()
reader=osmium.io.Reader('data/raw/arkansas-latest.osm.pbf');header=reader.header();source_timestamp=header.get('osmosis_replication_timestamp');reader.close()
pbf=Path('data/raw/arkansas-latest.osm.pbf')
with pbf.open('rb') as handle:digest=hashlib.file_digest(handle,'sha256').hexdigest()
Path('data/raw/extract-provenance.json').write_text(json.dumps(dict(url='https://download.geofabrik.de/north-america/us/arkansas-latest.osm.pbf',sourceTimestamp=source_timestamp,retrievedAt=retrieved,sha256=digest,bytes=pbf.stat().st_size,license='ODbL 1.0'),indent=2),encoding='utf8')
for p in pilots:
 data=dict(pilot=p,retrievedAt=retrieved,endpoint='https://download.geofabrik.de/north-america/us/arkansas-latest.osm.pbf',elements=handler.data[p['name']])
 Path(f"data/raw/{p['name']}.json").write_text(json.dumps(data),encoding='utf8');print(p['name'],len(data['elements']),'ways')
Path('data/raw/pilots.json').write_text(json.dumps(pilots),encoding='utf8')
