import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { Candidate } from "./types";
const colors: Record<string, string> = {
  Higher: "#c93f0b",
  Moderate: "#e0a800",
  Lower: "#25778a",
  "Insufficient evidence": "#7a8794",
};
export default function MapView({
  curves,
  selected,
  onSelect,
  position,
  focus = false,
}: {
  curves: Candidate[];
  selected: Candidate | null;
  onSelect: (c: Candidate) => void;
  position?: number[];
  focus?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    overlays = useRef<L.LayerGroup | null>(null),
    marker = useRef<L.CircleMarker | null>(null);
  const [tileError, setTileError] = useState(false);
  const callback = useRef(onSelect);
  callback.current = onSelect;
  useEffect(() => {
    if (!container.current) return;
    const m = L.map(container.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([36.23, -93.98], 9);
    map.current = m;
    L.control.zoom({ position: "bottomright" }).addTo(m);
    L.control
      .scale({ imperial: true, metric: true, position: "bottomleft" })
      .addTo(m);
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · <a href="https://www.openstreetmap.org/fixthemap">Report map issue</a>',
        maxZoom: 19,
      },
    ).addTo(m);
    tiles.on("tileerror", () => setTileError(true));
    overlays.current = L.layerGroup().addTo(m);
    const abort = new AbortController();
    fetch("/data/counties.geojson", { signal: abort.signal })
      .then((r) => r.json())
      .then((data) => {
        if (map.current)
          L.geoJSON(data, {
            style: {
              color: "#566676",
              weight: 1,
              dashArray: "5 7",
              fillOpacity: 0.025,
            },
            interactive: false,
          }).addTo(m);
      })
      .catch(() => {});
    fetch("/data/roads.json", { signal: abort.signal })
      .then((r) => r.json())
      .then((data) => {
        if (map.current) {
          const roads = L.geoJSON(data, {
            style: { color: "#8d9ba8", weight: 1.8, opacity: 0.7 },
            interactive: false,
          }).addTo(m);
          roads.bringToBack();
        }
      })
      .catch(() => {});
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(container.current);
    return () => {
      abort.abort();
      resize.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const layer = overlays.current;
    if (!layer) return;
    layer.clearLayers();
    curves.forEach((c) => {
      const p = c.properties,
        active = p.id === selected?.properties.id;
      const line = L.polyline(
        c.geometry.coordinates.map(([x, y]) => [y, x] as L.LatLngTuple),
        {
          color: active ? "#13263a" : colors[p.priority],
          weight: active ? 8 : 4,
          opacity: 1,
        },
      ).addTo(layer);
      line.on("click", () => callback.current(c));
      line.bindTooltip(`${p.name} · ~${p.radiusM} m radius`);
      const dot = L.circleMarker([p.center[1], p.center[0]], {
        radius: active ? 7 : 4,
        color: active ? "#13263a" : "#fff",
        weight: active ? 3 : 1.5,
        fillColor: colors[p.priority],
        fillOpacity: 1,
      }).addTo(layer);
      dot.on("click", () => callback.current(c));
      dot.bindTooltip(`${p.name} · ${p.priority} review priority`);
    });
  }, [curves, selected]);
  useEffect(() => {
    if (selected && map.current)
      map.current.flyTo(
        [selected.properties.center[1], selected.properties.center[0]],
        focus ? 15 : 13,
        { duration: 0.7 },
      );
  }, [selected, focus]);
  useEffect(() => {
    if (!map.current) return;
    if (position) {
      if (!marker.current)
        marker.current = L.circleMarker([position[1], position[0]], {
          radius: 9,
          color: "#fff",
          weight: 3,
          fillColor: "#1c5f7d",
          fillOpacity: 1,
        }).addTo(map.current);
      else marker.current.setLatLng([position[1], position[0]]);
    } else {
      marker.current?.remove();
      marker.current = null;
    }
  }, [position]);
  return (
    <div className="map-shell">
      <div
        ref={container}
        className="map"
        aria-label="Interactive map of Northwest Arkansas roadway curve candidates"
      />
      <div className="map-tag">
        Real road geometry
      </div>
      {tileError && (
        <div className="tile-error">
          Basemap unavailable. Imported roads and curve geometry remain
          interactive.
        </div>
      )}
      <div className="map-legend">
        {Object.entries(colors).map(([name, color]) => (
          <span key={name}>
            <i style={{ background: color }} />
            {name === "Insufficient evidence" ? "Uncertain" : name}
          </span>
        ))}
        <small>Field-review priority · not crash risk</small>
      </div>
    </div>
  );
}
