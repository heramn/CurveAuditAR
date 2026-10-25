import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Square,
  RotateCcw,
  Volume2,
  MapPin,
  Activity,
  Navigation,
} from "lucide-react";
import MapView from "./MapView";
import type { Candidate } from "./types";
import { haversine, simulationStep } from "./engineering.mjs";
const message =
  "Curve ahead. Pay attention to posted advisory signs and road conditions.";
function pathInfo(c: Candidate) {
  let path =
    c.properties.approach?.length > 1
      ? c.properties.approach
      : c.geometry.coordinates;
  let distance = 0;
  for (let i = path.length - 1; i > 0; i--) {
    const d = haversine(path[i - 1], path[i]);
    if (distance + d >= 450) {
      const t = (450 - distance) / d,
        a = path[i],
        b = path[i - 1];
      path = [
        [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
        ...path.slice(i),
      ];
      break;
    }
    distance += d;
  }
  let total = 0;
  const cumulative = [0];
  for (let i = 1; i < path.length; i++) {
    total += haversine(path[i - 1], path[i]);
    cumulative.push(total);
  }
  return { path, total, cumulative };
}
export default function Copilot({
  curves,
  initial,
}: {
  curves: Candidate[];
  initial: Candidate | null;
}) {
  const demo = useMemo(
    () =>
      curves.find(
        (c) =>
          c.properties.pilot === "Eureka Springs" && pathInfo(c).total > 350,
      ) ||
      curves.find((c) => pathInfo(c).total > 250) ||
      initial ||
      curves[0],
    [curves, initial],
  );
  const route = useMemo(() => pathInfo(demo), [demo]),
    [running, setRunning] = useState(false),
    [remaining, setRemaining] = useState(route.total),
    [alerted, setAlerted] = useState(false),
    [audio, setAudio] = useState("Ready when you start"),
    [gps, setGps] = useState("Off · permission not requested"),
    [livePos, setLivePos] = useState<number[] | undefined>(),
    [sensor, setSensor] = useState("Off · stationary diagnostics"),
    [motion, setMotion] = useState(""),
    [gpsActive, setGpsActive] = useState(false);
  const speechOnce = useRef(false),
    watch = useRef<number | null>(null),
    motionHandler = useRef<((event: DeviceMotionEvent) => void) | null>(null),
    speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function speak() {
    if (!("speechSynthesis" in window)) {
      setAudio("Speech unavailable · read the warning below");
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.94;
    utterance.onstart = () => setAudio("Speaking warning");
    utterance.onend = () => setAudio("Warning delivered");
    utterance.onerror = () =>
      setAudio("Audio blocked or unavailable · use Replay warning");
    speechSynthesis.speak(utterance);
    setAudio("Warning queued");
    if (speechTimer.current) clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => {
      setAudio((s) =>
        s === "Warning queued"
          ? "Speech did not start · try Replay warning"
          : s,
      );
    }, 3000);
  }
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(),
        elapsed = (now - last) / 1000;
      last = now;
      setRemaining((d) => simulationStep(d, elapsed).remaining);
    }, 100);
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (
      running &&
      remaining <= Math.min(150, route.total * 0.5) &&
      !speechOnce.current
    ) {
      speechOnce.current = true;
      setAlerted(true);
      speak();
    }
    if (running && remaining === 0) setRunning(false);
  }, [remaining, running, route.total]);
  useEffect(
    () => () => {
      if (watch.current !== null)
        navigator.geolocation.clearWatch(watch.current);
      if (motionHandler.current)
        window.removeEventListener("devicemotion", motionHandler.current);
      if (speechTimer.current) clearTimeout(speechTimer.current);
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    },
    [],
  );
  const position = useMemo(() => {
    const progress = route.total - remaining;
    let index = route.cumulative.findIndex((x) => x >= progress);
    if (index < 1) index = 1;
    const a = route.path[index - 1],
      b = route.path[index] || a,
      t =
        (progress - route.cumulative[index - 1]) /
        Math.max(1, route.cumulative[index] - route.cumulative[index - 1]);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }, [remaining, route]);
  function reset() {
    setRunning(false);
    setRemaining(route.total);
    setAlerted(false);
    speechOnce.current = false;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    setAudio("Ready when you start");
  }
  function stop() {
    setRunning(false);
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    setAudio("Paused");
  }
  function toggleGps() {
    if (watch.current !== null) {
      navigator.geolocation.clearWatch(watch.current);
      watch.current = null;
      setGpsActive(false);
      setLivePos(undefined);
      setGps("Off · location cleared");
      return;
    }
    if (!navigator.geolocation) {
      setGps("Geolocation unavailable");
      return;
    }
    setGps("Requesting foreground location…");
    watch.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = [pos.coords.longitude, pos.coords.latitude];
        setLivePos(p);
        setGpsActive(true);
        const nearest = curves
          .map((c) => ({
            c,
            d: Math.min(...c.geometry.coordinates.map((v) => haversine(p, v))),
          }))
          .sort((a, b) => a.d - b.d)[0];
        setGps(
          `±${Math.round(pos.coords.accuracy)} m accuracy · nearest geometry ${Math.round(nearest.d)} m (${nearest.c.properties.name}). Direction not validated; alerts disabled.`,
        );
      },
      (error) => {
        setGps(`Location unavailable: ${error.message}`);
        if (watch.current !== null)
          navigator.geolocation.clearWatch(watch.current);
        watch.current = null;
        setGpsActive(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 },
    );
  }
  async function toggleSensors() {
    if (motionHandler.current) {
      window.removeEventListener("devicemotion", motionHandler.current);
      motionHandler.current = null;
      setSensor("Off · readings cleared");
      setMotion("");
      return;
    }
    try {
      const api = DeviceMotionEvent as typeof DeviceMotionEvent & {
        requestPermission?: () => Promise<string>;
      };
      if (
        api.requestPermission &&
        (await api.requestPermission()) !== "granted"
      ) {
        setSensor("Sensor permission denied");
        return;
      }
      let count = 0,
        start = performance.now(),
        lastUpdate = 0;
      const handler = (e: DeviceMotionEvent) => {
        const a = e.accelerationIncludingGravity;
        if (!a || [a.x, a.y, a.z].every((v) => v === null)) {
          setSensor("No motion readings supplied by this device");
          return;
        }
        count++;
        const now = performance.now();
        if (now - lastUpdate < 500) return;
        lastUpdate = now;
        setSensor(
          `Observed ${((count * 1000) / (now - start)).toFixed(1)} Hz · ${count} events`,
        );
        const r = e.rotationRate;
        setMotion(
          `Acceleration incl. gravity: x ${a.x?.toFixed(2) ?? "—"}, y ${a.y?.toFixed(2) ?? "—"}, z ${a.z?.toFixed(2) ?? "—"} m/s² · rotation α ${r?.alpha?.toFixed(1) ?? "—"}, β ${r?.beta?.toFixed(1) ?? "—"}, γ ${r?.gamma?.toFixed(1) ?? "—"} °/s · timestamp ${e.timeStamp.toFixed(0)} ms`,
        );
      };
      motionHandler.current = handler;
      window.addEventListener("devicemotion", handler);
      setSensor("Listening · waiting for device readings");
    } catch {
      setSensor("Motion API unavailable or permission blocked");
    }
  }
  return (
    <section className="page copilot-page">
      <div className="page-heading">
        <div>
          <h1>Hear the road ahead.</h1>
          <p className="lead">
            A stationary demonstration on real Ozark road geometry.
          </p>
        </div>
        <span className="mode-badge">Simulation, no GPS required</span>
      </div>
      <div className="copilot-grid">
        <div className="copilot-console">
          <div className="console-label">
            <Navigation size={18} /> {demo.properties.name}
            <small>{demo.properties.county} County</small>
          </div>
          <div className="distance">
            <strong data-testid="distance">{Math.round(remaining)}</strong>
            <span>
              meters to curve entry
              <br />
              simulated road distance
            </span>
          </div>
          <div
            className={`audio-warning ${alerted ? "active" : ""}`}
            aria-live="polite"
          >
            <Volume2 size={22} />
            <div>
              <strong>
                {alerted ? "Curve ahead." : "Ready for the next bend."}
              </strong>
              <p>
                {alerted
                  ? message
                  : "Press Start demo. A warning triggers as the simulated position approaches the curve."}
              </p>
            </div>
          </div>
          <div className="progress-track">
            <div style={{ width: `${100 * (1 - remaining / route.total)}%` }} />
          </div>
          <div className="demo-controls">
            <button
              className="button"
              onClick={() => {
                if (remaining === 0) reset();
                setRunning(true);
              }}
              disabled={running}
            >
              <Play size={17} />{" "}
              {remaining === 0 ? "Replay demo" : "Start demo"}
            </button>
            <button className="button ghost" onClick={stop} disabled={!running}>
              <Square size={16} /> Stop
            </button>
            <button
              className="icon-button"
              aria-label="Reset demo"
              onClick={reset}
            >
              <RotateCcw size={18} />
            </button>
          </div>
          <button className="text-link" onClick={speak}>
            <Volume2 size={16} /> Replay warning
          </button>
          <small className="audio-status">Audio: {audio}</small>
          <p className="muted">
            Blue dot = simulated position. Fixed demo pace: 25 m/s, not a
            driving recommendation. Foreground only; use while stationary.
          </p>
        </div>
        <MapView
          curves={[demo]}
          selected={demo}
          onSelect={() => {}}
          position={position}
          focus
        />
      </div>
      <div className="diagnostics">
        <div className="panel">
          <MapPin size={21} />
          <h3>Experimental location</h3>
          <p>{gps}</p>
          {livePos && (
            <small>
              GPS fix: {livePos[1].toFixed(5)}, {livePos[0].toFixed(5)} · not
              the blue simulation dot
            </small>
          )}
          <button className="button ghost" onClick={toggleGps}>
            {gpsActive ? "Stop & clear location" : "Enable GPS diagnostics"}
          </button>
        </div>
        <div className="panel">
          <Activity size={21} />
          <h3>Stationary sensor check</h3>
          <p>{sensor}</p>
          {motion && <small>{motion}</small>}
          <button className="button ghost" onClick={toggleSensors}>
            {motionHandler.current
              ? "Stop sensors"
              : "Enable motion diagnostics"}
          </button>
          <small>
            Phone motion is not measured road banking or a calibrated ball-bank
            reading.
          </small>
        </div>
      </div>
      <p className="privacy-note">
        No account, trip storage or telemetry upload. GPS and sensor readings
        stay in memory and clear when stopped or when you leave this page.
        Browser permissions are requested only when activated.
      </p>
    </section>
  );
}
