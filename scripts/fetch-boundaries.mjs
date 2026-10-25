import {writeFile} from 'node:fs/promises';
for(const [file,service,where]of [
 ['counties','State_County/MapServer/1',"STATE='05' AND NAME IN ('Benton County','Washington County','Madison County','Carroll County')"],
 ['district','Legislative/MapServer/4',"STATE='05' AND CD119='03'"]
]){const url=`https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/${service}/query?`+new URLSearchParams({where,outFields:'*',returnGeometry:'true',geometryPrecision:'5',outSR:'4326',f:'geojson'});const res=await fetch(url,{signal:AbortSignal.timeout(60000)});const data=await res.json();if(!data.features?.length)throw Error(JSON.stringify(data).slice(0,1000));await writeFile(`data/raw/${file}.geojson`,JSON.stringify(data));await writeFile(`public/data/${file}.geojson`,JSON.stringify(data));await writeFile(`data/raw/${file}-provenance.json`,JSON.stringify({url,retrievedAt:new Date().toISOString()},null,2));console.log(file,data.features.length);}
