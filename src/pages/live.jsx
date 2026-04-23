import { useEffect, useState, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE    = "https://api.openf1.org/v1";
const POLL_MS = 5000;   // poll every 5s during live session
const IDLE_MS = 30000;  // poll every 30s when no active session

// ─── Circuit images ───────────────────────────────────────────────────────────
const CIRCUIT_IMAGES = {
  "Bahrain":           "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Bahrain%20carbon.png",
  "Jeddah":            "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Saudi%20Arabia%20carbon.png",
  "Albert Park":       "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Australia%20carbon.png",
  "Suzuka":            "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Japan%20carbon.png",
  "Shanghai":          "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/China%20carbon.png",
  "Miami":             "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Miami%20carbon.png",
  "Imola":             "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Emilia%20Romagna%20carbon.png",
  "Monaco":            "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Monaco%20carbon.png",
  "Montreal":          "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Canada%20carbon.png",
  "Barcelona":         "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Spain%20carbon.png",
  "Spielberg":         "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Austria%20carbon.png",
  "Silverstone":       "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Great%20Britain%20carbon.png",
  "Budapest":          "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Hungary%20carbon.png",
  "Spa-Francorchamps": "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Belgium%20carbon.png",
  "Zandvoort":         "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Netherlands%20carbon.png",
  "Monza":             "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Italy%20carbon.png",
  "Baku":              "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Azerbaijan%20carbon.png",
  "Marina Bay":        "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Singapore%20carbon.png",
  "Austin":            "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/USA%20carbon.png",
  "Mexico City":       "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Mexico%20carbon.png",
  "São Paulo":         "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Brazil%20carbon.png",
  "Las Vegas":         "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Las%20Vegas%20carbon.png",
  "Lusail":            "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Qatar%20carbon.png",
  "Yas Marina":        "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Abu%20Dhabi%20carbon.png",
};

// ─── Tyre data ────────────────────────────────────────────────────────────────
const TYRE = {
  SOFT:         { bg: "#E8002D", label: "S" },
  MEDIUM:       { bg: "#FFF200", label: "M", dark: true },
  HARD:         { bg: "#EBEBEB", label: "H", dark: true },
  INTERMEDIATE: { bg: "#39B54A", label: "I" },
  WET:          { bg: "#0067FF", label: "W" },
  UNKNOWN:      { bg: "#333",    label: "?" },
};

// ─── Flag colors ──────────────────────────────────────────────────────────────
const FLAG_COL = {
  GREEN: "#39B54A", YELLOW: "#FFF200", DOUBLE_YELLOW: "#FFF200", YELLOW_FLAG: "#FFF200",
  RED: "#E10600", SAFETY_CAR: "#FFF200", SAFETY_CAR_ENDING: "#FFF200",
  VIRTUAL_SAFETY_CAR: "#FFF200", VIRTUAL_SAFETY_CAR_ENDING: "#FFF200",
  CHEQUERED: "#fff", BLUE: "#0067FF", BLACK_AND_WHITE: "#aaa", BLACK: "#fff", CLEAR: "#39B54A",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Normalise driver_number to number — OpenF1 is inconsistent (string vs int)
function dn(val) {
  if (val == null) return 0;
  return typeof val === "string" ? parseInt(val, 10) : val;
}

function parseGap(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return val;
  const str = String(val).replace("+", "").trim();
  if (str.toUpperCase().includes("LAP")) return null;
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

function fmtGap(val) {
  if (val === null || val === undefined) return "—";
  if (typeof val === "string") {
    if (val.toUpperCase().includes("LAP")) return val;
    return `+${val.replace("+", "").trim()}`;
  }
  return `+${val.toFixed(3)}`;
}

function fmtSector(sec) {
  if (!sec || sec <= 0) return "—";
  return sec.toFixed(3);
}

function fmtLap(sec) {
  if (!sec || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3).padStart(6, "0");
  return `${m}:${s}`;
}

function fmtLocalTime(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const tz   = Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " ");
  return `${time} (${tz})`;
}

function toHex(col) {
  if (!col) return "#555";
  return col.startsWith("#") ? col : `#${col}`;
}

// Keep latest record per driver (normalised key = number)
function latestByDriverNum(arr) {
  const map = {};
  (arr || []).forEach(item => {
    const k = dn(item.driver_number);
    if (!map[k] || item.date > map[k].date) map[k] = item;
  });
  return map;
}

// ─── TyreBadge ────────────────────────────────────────────────────────────────
function TyreBadge({ compound }) {
  const t = TYRE[compound?.toUpperCase()] || TYRE.UNKNOWN;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 22, height: 22, borderRadius: "50%",
      background: t.bg, color: t.dark ? "#111" : "#fff",
      fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 900, flexShrink: 0,
      boxShadow: `0 0 5px ${t.bg}55`,
    }}>{t.label}</span>
  );
}

function Pill({ label, value, accent }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      background: "var(--bg)", border: "1px solid var(--border)",
      padding: "6px 12px", gap: 2, minWidth: 52,
    }}>
      <span style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 900,
        color: accent || "var(--text)", lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 8, letterSpacing: ".14em", textTransform: "uppercase",
        color: "var(--text-muted)", fontFamily: "var(--font-head)" }}>{label}</span>
    </div>
  );
}

// ─── Weather Bar ──────────────────────────────────────────────────────────────
function WeatherBar({ weather }) {
  if (!weather) return null;
  const w = weather;
  const isWet = !!w.rainfall;
  return (
    <div style={{
      display: "flex", gap: 0, alignItems: "stretch",
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderBottom: "none", flexWrap: "wrap",
      borderLeft: `3px solid ${isWet ? "#0067FF" : "#39B54A"}`,
    }}>
      {[
        { icon: "🌡", label: "Air",   val: `${w.air_temperature ?? "—"}°C`,   accent: (w.air_temperature ?? 0) > 35 ? "#E10600" : null },
        { icon: "🏁", label: "Track", val: `${w.track_temperature ?? "—"}°C`, accent: (w.track_temperature ?? 0) > 50 ? "#E10600" : null },
        { icon: "💧", label: "Humid", val: `${w.humidity ?? "—"}%` },
        { icon: "💨", label: "Wind",  val: w.wind_speed != null ? `${w.wind_speed} m/s` : "—" },
        { icon: "🌧", label: "Rain",  val: isWet ? "YES" : "No", accent: isWet ? "#0067FF" : null },
      ].map(({ icon, label, val, accent }) => (
        <div key={label} style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "7px 13px", borderRight: "1px solid var(--border)",
          fontFamily: "var(--font-head)", fontSize: 11,
          letterSpacing: ".08em", textTransform: "uppercase",
        }}>
          <span style={{ fontSize: 12 }}>{icon}</span>
          <span style={{ color: "var(--text-muted)" }}>{label}</span>
          <span style={{ fontWeight: 800, color: accent || "var(--text)" }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Race Control Feed ────────────────────────────────────────────────────────
function RaceControlFeed({ messages }) {
  const recent  = [...(messages || [])].reverse().slice(0, 12);
  const origLen = (messages || []).length;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{
        padding: "10px 14px", background: "#0a0a0a", borderBottom: "1px solid var(--border)",
        fontFamily: "var(--font-head)", fontSize: 9, fontWeight: 700,
        letterSpacing: ".2em", textTransform: "uppercase", color: "var(--red)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)",
          animation: "pulse-dot 1s ease infinite", display: "inline-block" }} />
        Race Control
        {origLen > 0 && (
          <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 8 }}>
            {origLen} msg{origLen !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      {recent.length === 0 ? (
        <div style={{ padding: "16px", fontSize: 10, color: "var(--text-muted)",
          fontFamily: "var(--font-head)", letterSpacing: ".08em", textTransform: "uppercase" }}>
          No messages yet
        </div>
      ) : recent.map((msg, i) => {
        const flagCol     = FLAG_COL[msg.flag] || "var(--text-muted)";
        const isCritical  = ["RED","SAFETY_CAR","SAFETY_CAR_ENDING","VIRTUAL_SAFETY_CAR",
          "VIRTUAL_SAFETY_CAR_ENDING","CHEQUERED"].includes(msg.flag);
        const isWarn      = ["DOUBLE_YELLOW","YELLOW_FLAG","YELLOW"].includes(msg.flag);
        // Stable key using original message index (not reversed-slice position)
        const msgKey = `msg-${origLen - 1 - i}`;
        return (
          <div key={msgKey} style={{
            display: "flex", gap: 9, alignItems: "flex-start",
            padding: "8px 14px", borderBottom: "1px solid var(--border)",
            background: isCritical
              ? msg.flag === "RED" ? "rgba(225,6,0,.08)"
              : msg.flag === "CHEQUERED" ? "rgba(255,255,255,.04)"
              : "rgba(255,242,0,.05)"
              : isWarn ? "rgba(255,242,0,.03)"
              : "transparent",
          }}>
            {msg.flag && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: flagCol,
                flexShrink: 0, marginTop: 4, boxShadow: isCritical ? `0 0 6px ${flagCol}` : "none" }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, lineHeight: 1.45, wordBreak: "break-word",
                color: isCritical ? "#ddd" : isWarn ? "#ccc" : "var(--text-muted)" }}>
                {msg.message || "—"}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                {msg.lap_number != null && (
                  <span style={{ fontSize: 8, color: "var(--text-muted)",
                    fontFamily: "var(--font-head)", letterSpacing: ".08em" }}>LAP {msg.lap_number}</span>
                )}
                {msg.driver_number != null && (
                  <span style={{ fontSize: 8, color: flagCol, fontFamily: "var(--font-head)" }}>
                    #{dn(msg.driver_number)}
                  </span>
                )}
                {msg.date && (
                  <span style={{ fontSize: 8, color: "#2a2a2a", fontFamily: "var(--font-head)" }}>
                    {new Date(msg.date).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Sector Splits ────────────────────────────────────────────────────────────
function SectorSplits({ lastLap, s1Best, s2Best, s3Best }) {
  const s1 = lastLap?.duration_sector_1;
  const s2 = lastLap?.duration_sector_2;
  const s3 = lastLap?.duration_sector_3;
  if (!s1 && !s2 && !s3) return null;
  const sCol = (val, best) => {
    if (!val || val <= 0) return "var(--text-muted)";
    if (best != null && Math.abs(val - best) < 0.001) return "#c84dff";
    return "#FFD700";
  };
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
      {[["S1", s1, s1Best], ["S2", s2, s2Best], ["S3", s3, s3Best]].map(([lbl, val, best]) => (
        <div key={lbl} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 7, color: "var(--text-muted)", letterSpacing: ".05em" }}>{lbl}</div>
          <div style={{ fontSize: 9, fontWeight: 700, fontFamily: "var(--font-head)", color: sCol(val, best) }}>
            {fmtSector(val)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Timing Row ───────────────────────────────────────────────────────────────
function TimingRow({ pos, driver, interval, lastLap, stint, pitCount, isLeader,
  posChange, isInPit, hasFastestLap, s1Best, s2Best, s3Best,
  isQualifying, showSectors, hasBlueFlag, isRetired }) {

  const teamCol    = toHex(driver?.team_colour) !== "#555" ? toHex(driver?.team_colour) : "#444";
  const compound   = stint?.compound?.toUpperCase() || "UNKNOWN";
  const gapNum     = parseGap(interval?.gap_to_leader);
  const gapDisplay = isLeader ? "LEADER"
    : interval?.gap_to_leader != null ? fmtGap(interval.gap_to_leader)
    : "—";

  // Tyre age on current stint
  const tyreLapsRaw = stint?.lap_start && lastLap?.lap_number
    ? lastLap.lap_number - stint.lap_start + 1 : null;
  const tyreLaps = tyreLapsRaw != null && tyreLapsRaw > 0 ? tyreLapsRaw : null;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "34px 10px 38px 1fr 88px 88px 76px 42px 38px",
      alignItems: "center",
      padding: "0 10px",
      minHeight: showSectors ? 64 : 46,
      background: isRetired ? "rgba(55,55,55,.07)"
        : isInPit   ? "rgba(255,215,0,.05)"
        : isLeader  ? "rgba(225,6,0,.04)"
        : "var(--bg-card)",
      borderBottom: "1px solid var(--border)",
      borderLeft: `3px solid ${isRetired ? "#444" : teamCol}`,
      opacity: isRetired ? 0.5 : 1,
      transition: "background .4s, opacity .4s",
    }}>
      {/* Pos */}
      <span style={{
        fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 900, lineHeight: 1,
        color: isLeader ? "var(--red)" : pos <= 3 ? "var(--gold)" : pos <= 10 ? "var(--text)" : "var(--text-muted)",
      }}>{pos}</span>

      {/* Arrow */}
      <span style={{ fontSize: 8, fontWeight: 900, textAlign: "center",
        color: posChange > 0 ? "#39B54A" : posChange < 0 ? "#E10600" : "transparent" }}>
        {posChange > 0 ? "▲" : posChange < 0 ? "▼" : "●"}
      </span>

      {/* Car no */}
      <span style={{ fontFamily: "var(--font-head)", fontSize: 12, fontWeight: 800,
        color: teamCol, letterSpacing: ".04em" }}>{driver?.driver_number ?? "—"}</span>

      {/* Driver + badges */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 800,
          textTransform: "uppercase", letterSpacing: ".02em", lineHeight: 1.2,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          {driver?.last_name || driver?.name_acronym || "—"}
          {hasFastestLap && (
            <span style={{ fontSize: 7, background: "#c84dff18", border: "1px solid #c84dff44",
              color: "#c84dff", padding: "1px 3px", fontWeight: 900, flexShrink: 0 }}>FL</span>
          )}
          {isRetired && (
            <span style={{ fontSize: 7, background: "rgba(100,100,100,.2)", border: "1px solid #444",
              color: "#888", padding: "1px 3px", fontWeight: 900, flexShrink: 0 }}>OUT</span>
          )}
          {isInPit && !isRetired && (
            <span style={{ fontSize: 7, background: "rgba(255,215,0,.12)", border: "1px solid #FFD70044",
              color: "#FFD700", padding: "1px 3px", fontWeight: 900, flexShrink: 0 }}>PIT</span>
          )}
          {hasBlueFlag && !isRetired && (
            <span style={{ fontSize: 7, background: "rgba(0,103,255,.12)", border: "1px solid #0067FF44",
              color: "#0067FF", padding: "1px 3px", fontWeight: 900, flexShrink: 0 }}>🔵</span>
          )}
        </div>
        <div style={{ fontSize: 8, color: teamCol, letterSpacing: ".06em",
          textTransform: "uppercase", opacity: .7, marginTop: 1 }}>
          {driver?.team_name || ""}
        </div>
        {showSectors && (
          <SectorSplits lastLap={lastLap} s1Best={s1Best} s2Best={s2Best} s3Best={s3Best} />
        )}
      </div>

      {/* Gap / best */}
      <span style={{
        fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700,
        color: isRetired ? "#444" : isLeader ? "var(--red)" : (gapNum !== null && gapNum < 1.0) ? "#39B54A" : "var(--text)",
        letterSpacing: ".02em",
      }}>
        {isRetired ? "OUT"
          : isQualifying ? (lastLap?.lap_duration ? fmtLap(lastLap.lap_duration) : "—")
          : gapDisplay}
      </span>

      {/* Last lap */}
      <span style={{
        fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 600,
        color: hasFastestLap ? "#c84dff" : isInPit ? "#FFD700" : isRetired ? "#444" : "var(--text-mid)",
        letterSpacing: ".02em",
      }}>
        {isInPit ? "IN PIT" : isRetired ? "—" : fmtLap(lastLap?.lap_duration)}
      </span>

      {/* Tyre */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <TyreBadge compound={isRetired ? "UNKNOWN" : compound} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          {stint?.lap_start && (
            <span style={{ fontSize: 8, color: "var(--text-muted)",
              fontFamily: "var(--font-head)", letterSpacing: ".04em" }}>L{stint.lap_start}</span>
          )}
          {tyreLaps != null && (
            <span style={{ fontSize: 7, color: "#444", fontFamily: "var(--font-head)" }}>+{tyreLaps}</span>
          )}
        </div>
      </div>

      {/* Pits */}
      <span style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700,
        color: pitCount > 0 ? "var(--gold)" : "var(--text-muted)", textAlign: "center" }}>
        {pitCount > 0 ? pitCount : "—"}
      </span>

      {/* Lap no */}
      <span style={{ fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 600,
        color: "var(--text-muted)", textAlign: "right" }}>
        {lastLap?.lap_number ?? "—"}
      </span>
    </div>
  );
}

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(isoTarget) {
  const [parts, setParts] = useState(null);
  useEffect(() => {
    if (!isoTarget) { setTimeout(() => setParts(null), 0); return; }
    const targetMs = new Date(isoTarget).getTime();
    if (isNaN(targetMs)) { setTimeout(() => setParts(null), 0); return; }
    function tick() {
      const ms = targetMs - Date.now();
      if (ms <= 0) { setTimeout(() => setParts(null), 0); return; }
      setParts({
        d: Math.floor(ms / 86400000),
        h: Math.floor((ms % 86400000) / 3600000),
        m: Math.floor((ms % 3600000)  / 60000),
        s: Math.floor((ms % 60000)    / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isoTarget]);
  return parts;
}

// ─── No Session ───────────────────────────────────────────────────────────────
function NoSession({ nextRace, nextRaceError, isRaceDay }) {
  const allSessions = nextRace ? [
    { name: "Practice 1",   data: nextRace.FirstPractice },
    { name: "Practice 2",   data: nextRace.SecondPractice },
    { name: "Practice 3",   data: nextRace.ThirdPractice },
    { name: "Sprint Quali", data: nextRace.SprintQualifying },
    { name: "Sprint",       data: nextRace.Sprint },
    { name: "Qualifying",   data: nextRace.Qualifying },
    { name: "Race",         data: { date: nextRace.date, time: nextRace.time } },
  ].filter(s => s.data?.date) : [];

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const sessionsWithTs = allSessions.map(s => {
    // Always append Z to treat as UTC — prevents local-timezone shift
    const timeStr = s.data.time && s.data.time !== "undefined"
      ? s.data.time.replace("Z", "") + "Z"
      : "12:00:00Z";
    const raw = `${s.data.date}T${timeStr}`;
    const ts = new Date(raw).getTime();
    return { ...s, iso: raw, ts: isNaN(ts) ? 0 : ts };
  });

  const nextSess = sessionsWithTs
    .filter(s => s.ts > now)
    .sort((a, b) => a.ts - b.ts)[0] ?? null;

  const cd = useCountdown(nextSess?.iso ?? null);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "50vh", gap: 16, textAlign: "center", padding: "40px 24px" }}>
      <div style={{ fontSize: 48, opacity: .1 }}>🏁</div>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 900,
        textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-muted)" }}>
        No Live Session
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 340, lineHeight: 1.65 }}>
        {isRaceDay ? "A live F1 session is currently in progress. Global API access is restricted by OpenF1 to authenticated users until the session ends. Live timing data will become available here automatically once the session is complete." : "Live timing activates automatically when any F1 session begins."}
      </div>
      {nextRaceError && !isRaceDay && (
        <div style={{ fontSize: 10, color: "#444", fontFamily: "var(--font-head)",
          letterSpacing: ".1em", textTransform: "uppercase" }}>
          Next race data unavailable
        </div>
      )}
      {nextRace && !isRaceDay && (
        <div style={{ marginTop: 16, background: "var(--bg-card)",
          border: "1px solid var(--border)", borderLeft: "3px solid var(--red)",
          padding: "16px 22px", textAlign: "left", minWidth: 280, maxWidth: 360 }}>
          <div style={{ fontSize: 9, fontFamily: "var(--font-head)", fontWeight: 700,
            letterSpacing: ".2em", textTransform: "uppercase", color: "var(--red)", marginBottom: 6 }}>
            Next Race Weekend
          </div>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 19, fontWeight: 900,
            textTransform: "uppercase" }}>{nextRace.raceName}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            {(() => {
              const d = new Date(`${nextRace.date}T12:00:00Z`);
              return isNaN(d.getTime()) ? nextRace.date
                : d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
            })()}
          </div>

          {/* Session list */}
          {sessionsWithTs.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 8, fontFamily: "var(--font-head)", fontWeight: 700,
                letterSpacing: ".2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 5 }}>
                Sessions
              </div>
              {sessionsWithTs.map(s => {
                const isPast = s.ts > 0 && s.ts < now;
                const dtStr  = s.ts > 0
                  ? new Date(s.iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "—";
                return (
                  <div key={s.name} style={{ display: "flex", justifyContent: "space-between",
                    padding: "3px 0", fontSize: 11, opacity: isPast ? 0.32 : 1 }}>
                    <span style={{ fontFamily: "var(--font-head)", fontWeight: isPast ? 400 : 700 }}>{s.name}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{dtStr}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Countdown */}
          {nextSess && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, fontFamily: "var(--font-head)", fontWeight: 700,
                letterSpacing: ".2em", textTransform: "uppercase", color: "#39B54A", marginBottom: 4 }}>
                Next Up · {nextSess.name}
              </div>
              {cd && (
                <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                  {(cd.d > 0
                    ? [["d", cd.d], ["h", cd.h], ["m", cd.m]]
                    : [["h", cd.h], ["m", cd.m], ["s", cd.s]])
                    .map(([unit, val]) => (
                    <div key={unit} style={{ textAlign: "center",
                      background: "var(--bg)", border: "1px solid var(--border)", padding: "5px 9px" }}>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 900,
                        color: "var(--red)", lineHeight: 1 }}>{String(val).padStart(2, "0")}</div>
                      <div style={{ fontSize: 7, color: "var(--text-muted)",
                        letterSpacing: ".1em", textTransform: "uppercase" }}>{unit}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Session Badge ────────────────────────────────────────────────────────────
function SessionBadge({ sessionType }) {
  const colors = {
    Race:                 { bg: "rgba(225,6,0,.15)",    border: "#E10600", text: "#E10600" },
    Qualifying:           { bg: "rgba(255,128,0,.12)",  border: "#FF8000", text: "#FF8000" },
    Sprint:               { bg: "rgba(255,128,0,.12)",  border: "#FF8000", text: "#FF8000" },
    "Sprint Qualifying":  { bg: "rgba(255,215,0,.10)",  border: "#FFD700", text: "#FFD700" },
    "Sprint Shootout":    { bg: "rgba(255,215,0,.10)",  border: "#FFD700", text: "#FFD700" },
    "Practice 1":         { bg: "rgba(57,181,74,.10)",  border: "#39B54A", text: "#39B54A" },
    "Practice 2":         { bg: "rgba(57,181,74,.10)",  border: "#39B54A", text: "#39B54A" },
    "Practice 3":         { bg: "rgba(57,181,74,.10)",  border: "#39B54A", text: "#39B54A" },
  };
  const c = colors[sessionType]
    || (sessionType?.toLowerCase().includes("practice")
      ? { bg: "rgba(57,181,74,.10)", border: "#39B54A", text: "#39B54A" }
      : { bg: "rgba(100,100,100,.10)", border: "#555", text: "#777" });
  return (
    <span style={{ padding: "3px 10px", border: `1px solid ${c.border}`,
      background: c.bg, color: c.text, fontFamily: "var(--font-head)",
      fontSize: 10, fontWeight: 800, letterSpacing: ".15em", textTransform: "uppercase" }}>
      {sessionType}
    </span>
  );
}

// ─── Live Car Tracker ─────────────────────────────────────────────────────────
// LiveCarTracker — shows live positions on the circuit icon without GPS animation.
// GPS tracking removed: the OpenF1 location endpoint is often delayed and the
// lerp animation caused cars to drift to wrong positions. Now draws dots on an
// ellipse layout derived purely from race position order — always accurate.
function LiveCarTracker({ circuitShortName, positionsRef, driversRef, isLiveSession }) {
  const canvasRef      = useRef(null);
  const rafRef         = useRef(null);
  const dotPos         = useRef({});    // last-drawn position for hit-test
  const hoveredRef     = useRef(null);
  const lastStripRef   = useRef(0);
  const lastCountRef   = useRef(0);

  const [tooltip,   setTooltip]   = useState(null);
  const [hoveredDN, setHoveredDN] = useState(null);
  const [carCount,  setCarCount]  = useState(0);
  const [carsState, setCarsState] = useState([]);

  const imgUrl = CIRCUIT_IMAGES[circuitShortName] || null;

  // Single persistent RAF loop — reads positionsRef/driversRef each frame (no GPS)
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    function frame() {
      if (!cv.isConnected) { rafRef.current = requestAnimationFrame(frame); return; }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W   = cv.offsetWidth  || 300;
      const H   = cv.offsetHeight || 280;

      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
        cv.width  = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
      }

      const ctx = cv.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const sortedCars = positionsRef.current || [];
      const dmap       = driversRef.current   || {};
      const n          = Math.max(sortedCars.length, 1);
      const hovDN      = hoveredRef.current;

      // Draw circuit icon as background if available
      // (purely decorative — positions are always ellipse-based)

      sortedCars.forEach((pos, idx) => {
        const dNum     = dn(pos.driver_number);
        const driver   = dmap[dNum];
        const col      = toHex(driver?.team_colour);
        const isLeader = pos.position === 1;
        const isHov    = hovDN === dNum;

        // Place cars around an ellipse in race order
        const angle = -Math.PI / 2 + (idx / n) * Math.PI * 2;
        const x = W * 0.5 + Math.cos(angle) * W * 0.36;
        const y = H * 0.5 + Math.sin(angle) * H * 0.30;

        // Record for hover hit-test
        dotPos.current[dNum] = { x, y, idx, driver, pos };

        const r = isLeader ? 8 : isHov ? 7 : 5;

        // Leader glow
        if (isLeader) {
          const g = ctx.createRadialGradient(x, y, 0, x, y, 22);
          g.addColorStop(0, col + "44");
          g.addColorStop(1, "transparent");
          ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2);
          ctx.fillStyle = g; ctx.fill();
        }

        // Hover ring
        if (isHov) {
          ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2);
          ctx.strokeStyle = col + "77"; ctx.lineWidth = 2; ctx.stroke();
        }

        // Shadow
        ctx.beginPath(); ctx.arc(x + 1, y + 1.5, r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fill();

        // Dot
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();

        // Ring
        ctx.beginPath(); ctx.arc(x, y, r + 2, 0, Math.PI * 2);
        ctx.strokeStyle = col + (isLeader ? "88" : "33");
        ctx.lineWidth = isLeader ? 2 : 1; ctx.stroke();

        // Label for top 3, hovered, or ≤5 cars
        if (idx < 3 || isHov || n <= 5) {
          const acronym = driver?.name_acronym || `${dNum}`;
          ctx.font = "bold 8px 'Barlow Condensed', monospace";
          const tw = ctx.measureText(acronym).width;
          const lx = x + r + 3, ly = y - 7;
          ctx.fillStyle = "rgba(0,0,0,.88)";
          ctx.fillRect(lx, ly, tw + 8, 13);
          ctx.fillStyle = isLeader ? "#FFD700" : isHov ? "#fff" : "#ccc";
          ctx.textAlign = "left";
          ctx.fillText(acronym, lx + 4, ly + 9.5);
        }

        // P1 badge
        if (isLeader) {
          ctx.fillStyle = "rgba(0,0,0,.88)";
          ctx.fillRect(x - r - 20, y - 6, 20, 12);
          ctx.fillStyle = "#E10600";
          ctx.font = "bold 8px monospace";
          ctx.textAlign = "center";
          ctx.fillText("P1", x - r - 10, y + 5);
        }
      });

      // Throttle carsState update to ~1 Hz
      const now2 = performance.now();
      if (sortedCars.length !== lastCountRef.current || now2 - lastStripRef.current > 1000) {
        lastCountRef.current = sortedCars.length;
        lastStripRef.current = now2;
        setCarCount(sortedCars.length);
        setCarsState([...sortedCars]);
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — reads refs each frame

  function handleMouseMove(e) {
    const cv = canvasRef.current; if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let found = null;
    for (const [rawKey, dot] of Object.entries(dotPos.current)) {
      const dx = mx - dot.x, dy = my - dot.y;
      if (dx * dx + dy * dy < 324) { // 18px radius
        found = { dNum: dn(rawKey), dot };
        break;
      }
    }
    if (found) {
      hoveredRef.current = found.dNum;
      setHoveredDN(found.dNum);
      const d = found.dot.driver;
      setTooltip({
        name:    d?.full_name || d?.name_acronym || `#${found.dNum}`,
        acronym: d?.name_acronym || `#${found.dNum}`,
        team:    d?.team_name || "",
        pos:     found.dot.pos?.position ?? found.dot.idx + 1,
        col:     toHex(d?.team_colour),
        x: e.clientX, y: e.clientY,
      });
    } else {
      hoveredRef.current = null;
      setHoveredDN(null);
      setTooltip(null);
    }
  }

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "9px 14px", borderBottom: "1px solid var(--border)", background: "#070707",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: isLiveSession ? "#E10600" : "#333",
            animation: isLiveSession ? "pulse-dot 1s ease infinite" : "none",
            display: "inline-block", flexShrink: 0,
          }} />
          <span style={{ fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 700,
            letterSpacing: ".2em", textTransform: "uppercase",
            color: isLiveSession ? "#E10600" : "#444" }}>Live Tracker</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {circuitShortName && (
            <span style={{ fontFamily: "var(--font-head)", fontSize: 9, color: "var(--text-muted)",
              letterSpacing: ".1em", textTransform: "uppercase" }}>{circuitShortName}</span>
          )}
          {carCount > 0 && (
            <span style={{ fontFamily: "var(--font-head)", fontSize: 9, color: "#333" }}>
              {carCount} cars
            </span>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: "relative", height: 270, background: "#040404" }}>
        {imgUrl && (
          <img src={imgUrl} alt={circuitShortName || "circuit"} style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "contain", padding: 18,
            filter: "brightness(.4) contrast(1.3) saturate(0)",
            mixBlendMode: "lighten", pointerEvents: "none",
          }} />
        )}
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { hoveredRef.current = null; setHoveredDN(null); setTooltip(null); }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
            display: "block", cursor: "crosshair" }}
        />
        {carCount === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
            <div style={{ width: 22, height: 22, border: "2px solid #1a1a1a",
              borderTopColor: "#E10600", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            <span style={{ fontFamily: "var(--font-head)", fontSize: 9, color: "var(--text-muted)",
              letterSpacing: ".15em", textTransform: "uppercase" }}>Awaiting positions…</span>
          </div>
        )}
      </div>

      {/* Mini leaderboard strip */}
      {carsState.length > 0 && (
        <div style={{ display: "flex", overflowX: "auto", borderTop: "1px solid var(--border)",
          background: "#030303", scrollbarWidth: "none" }}>
          {carsState.slice(0, 5).map((pos, idx) => {
            const dNumN = dn(pos.driver_number);
    const d     = (driversRef.current || {})[dNumN];
    const col   = toHex(d?.team_colour);
            const isHov = hoveredDN === dNumN;
            return (
              <div key={dNumN} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "5px 9px", borderRight: "1px solid var(--border)",
                minWidth: 44, gap: 2, flexShrink: 0,
                background: isHov ? `${col}18` : "transparent",
                transition: "background .15s",
              }}>
                <span style={{ fontFamily: "var(--font-head)", fontSize: 8, fontWeight: 900,
                  color: idx === 0 ? "#E10600" : "var(--text-muted)" }}>P{pos.position}</span>
                <div style={{ width: 2, height: 10, background: col, borderRadius: 1 }} />
                <span style={{ fontFamily: "var(--font-head)", fontSize: 8, fontWeight: 700,
                  color: "var(--text-mid)", textTransform: "uppercase" }}>
                  {d?.name_acronym || dNumN}
                </span>
              </div>
            );
          })}
          {carsState.length > 5 && (
            <div style={{ display: "flex", alignItems: "center", padding: "0 10px",
              fontFamily: "var(--font-head)", fontSize: 8, color: "var(--text-muted)", flexShrink: 0 }}>
              +{carsState.length - 5}
            </div>
          )}
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "fixed", left: tooltip.x + 16, top: tooltip.y - 16, zIndex: 9999,
          background: "rgba(4,4,4,.97)", border: `1px solid ${tooltip.col}`,
          borderLeft: `3px solid ${tooltip.col}`, padding: "8px 12px",
          pointerEvents: "none", fontFamily: "var(--font-head)",
          boxShadow: "0 4px 24px rgba(0,0,0,.9)", minWidth: 120,
        }}>
          <div style={{ fontWeight: 900, fontSize: 13, color: tooltip.col,
            textTransform: "uppercase", marginBottom: 3 }}>
            P{tooltip.pos} · {tooltip.acronym}
          </div>
          <div style={{ fontSize: 10, color: "#888", lineHeight: 1.6 }}>{tooltip.name}</div>
          {tooltip.team && (
            <div style={{ fontSize: 9, color: `${tooltip.col}99`, letterSpacing: ".06em",
              textTransform: "uppercase", marginTop: 2 }}>{tooltip.team}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Live Page ───────────────────────────────────────────────────────────
function Live() {
  const [session,       setSession]       = useState(null);
  const [drivers,       setDrivers]       = useState({});
  const [positions,     setPositions]     = useState([]);
  const [intervals,     setIntervals]     = useState({});
  const [laps,          setLaps]          = useState({});
  const [stints,        setStints]        = useState({});
  const [pits,          setPits]          = useState({ counts: {}, inPitNow: new Set() });
  const [raceControl,   setRaceControl]   = useState([]);
  const [weather,       setWeather]       = useState(null);
  const [nextRace,      setNextRace]      = useState(null);
  const [nextRaceError, setNextRaceError] = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [lastUpdate,    setLastUpdate]    = useState(null);
  const [isLive,        setIsLive]        = useState(false);
  const [fastestLap,    setFastestLap]    = useState({ driverNum: null, time: Infinity, sessionKey: null });
  const [showSectors,   setShowSectors]   = useState(false);
  const [apiRestricted, setApiRestricted] = useState(false);

  // Refs — updated directly by fetchAll, read by RAF loop each frame
  const positionsRef = useRef([]);
  const driversRef   = useRef({});

  const isMounted  = useRef(true);
  const inFlight   = useRef(false);
  const isLiveRef  = useRef(false);
  const prevPosMap = useRef({});
  const retryCount = useRef(0);
  const sessionKey = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ── Fetch helper ────────────────────────────────────────────────────────────
  const apiFetch = useCallback(async (url, ms = 12000) => {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), ms);
    try {
      const headers = {};
      const key = import.meta.env.VITE_OPENF1_API_KEY;
      if (key && url.includes("openf1.org")) headers["Authorization"] = `Bearer ${key}`;
      const res = await fetch(url, { signal: ctrl.signal, headers });
      clearTimeout(tid);
      if (!res.ok) {
        if(res.status === 401 || res.status === 403) throw new Error("RESTRICTED_LIVE_API_ACCESS");
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    } catch (e) { clearTimeout(tid); throw e; }
  }, []);

  // ── Next race fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    setNextRaceError(false);
    apiFetch("https://api.jolpi.ca/ergast/f1/current/next.json", 8000)
      .then(d => {
        if (!isMounted.current) return;
        const race = d.MRData?.RaceTable?.Races?.[0] ?? null;
        // End of season fallback
        if (!race) return apiFetch("https://api.jolpi.ca/ergast/f1/current/last.json", 8000)
          .then(d2 => { if (isMounted.current) setNextRace(d2.MRData?.RaceTable?.Races?.[0] ?? null); })
          .catch(() => { if (isMounted.current) setNextRaceError(true); });
        setNextRace(race);
      })
      .catch(() => { if (isMounted.current) setNextRaceError(true); });
  }, [apiFetch]);

  // ── Main fetch ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (inFlight.current) {
      await new Promise(r => setTimeout(r, 600));
      if (inFlight.current) return;
    }
    inFlight.current = true;
    try {
      if (isMounted.current) setError(null);

      // 1. Find the active/most-recent session.
      // Strategy:
      //   a) Query sessions starting in the last 8h — this catches anything from FP1 to Race
      //   b) Among results, prefer a session that is currently OPEN (no date_end, or date_end in future)
      //   c) If nothing is open, pick the one whose date_start is most recent (just ended session)
      //   d) Fallback to session_key=latest if the date query returns nothing
      const now     = Date.now();
      const fromIso = new Date(now - 8 * 3600000).toISOString().slice(0, 19);

      let sess = null;
      let isRestricted = false;
      try {
        const byDate = await apiFetch(
          `${BASE}/sessions?date_start>=${encodeURIComponent(fromIso)}`
        );
        if (byDate?.length) {
          // Sort newest first
          const sorted = [...byDate].sort(
            (a, b) => new Date(b.date_start) - new Date(a.date_start)
          );
          // Prefer an open session (date_end is null or in the future)
          const openSess = sorted.find(s => {
            if (!s.date_end) return true; // null = still running
            return new Date(s.date_end).getTime() > now;
          });
          // Otherwise take the most recently started one (just finished)
          sess = openSess || sorted[0];
        }
      } catch (e) {
        if (e.message === "RESTRICTED_LIVE_API_ACCESS") isRestricted = true;
      }

      // Fallback: session_key=latest
      if (!sess && !isRestricted) {
        try {
          const latest = await apiFetch(`${BASE}/sessions?session_key=latest`);
          sess = latest?.[0] ?? null;
        } catch (e) {
          if (e.message === "RESTRICTED_LIVE_API_ACCESS") isRestricted = true;
        }
      }

      if (isRestricted) {
        sess = { session_type: "Live Session", session_key: "RESTRICTED", date_start: new Date(now - 3600000).toISOString(), date_end: null };
      }

      if (!sess) {
        if (isMounted.current) { setLoading(false); setIsLive(false); isLiveRef.current = false; setApiRestricted(false); }
        return;
      }

      // "active" = within 15 min before start OR up to 4h after start
      // OpenF1's date_end is often unreliable/null during the race.
      const startMs = new Date(sess.date_start).getTime();
      const endMs   = sess.date_end
        ? new Date(sess.date_end).getTime()
        : startMs + 4 * 3600000;
      // Also, if date_end is null, we assume the session is still actively open.
      const isOpenSession = sess.date_end === null || sess.date_end === undefined;
      const active  = isOpenSession || (now >= startMs - 15 * 60000 && now <= endMs + 3600000);

      if (isMounted.current) {
        setSession(sess);
        setIsLive(active);
        isLiveRef.current = active;
        setApiRestricted(isRestricted);
      }

      if (!active) {
        if (isMounted.current) setLoading(false);
        return;
      }

      const sk = sess.session_key;

      // 2. Session change → clear stale state
      if (sk !== sessionKey.current) {
        sessionKey.current = sk;
        // Clear all display state on session change
        if (isMounted.current) {
          setPositions([]);
          setIntervals({});
          setLaps({});
          setStints({});
          setPits({ counts: {}, inPitNow: new Set() });
          setRaceControl([]);
          setWeather(null);
          setFastestLap({ driverNum: null, time: Infinity, sessionKey: sk });
          positionsRef.current = [];
        }
        prevPosMap.current = {};

        // Fetch driver list once per session
        if (!isRestricted) {
          try {
            const driversData = await apiFetch(`${BASE}/drivers?session_key=${sk}`);
            if (isMounted.current && driversData?.length) {
              const map = {};
              driversData.forEach(d => { map[dn(d.driver_number)] = d; });
              setDrivers(map);
              driversRef.current = map;
            }
          } catch (e) { console.warn("Drivers fetch failed:", e.message); }
        }
      }

      // 4. Parallel fetch
      let posR={status:'rejected'}, intR={status:'rejected'}, lapR={status:'rejected'},
          stintR={status:'rejected'}, pitR={status:'rejected'}, rcR={status:'rejected'}, wxR={status:'rejected'};
      
      if (!isRestricted) {
        [posR, intR, lapR, stintR, pitR, rcR, wxR] = await Promise.allSettled([
          apiFetch(`${BASE}/position?session_key=${sk}`),
          apiFetch(`${BASE}/intervals?session_key=${sk}`),
          apiFetch(`${BASE}/laps?session_key=${sk}&lap_number=latest`),
          apiFetch(`${BASE}/stints?session_key=${sk}`),
          apiFetch(`${BASE}/pit?session_key=${sk}`),
          apiFetch(`${BASE}/race_control?session_key=${sk}`),
          apiFetch(`${BASE}/weather?session_key=${sk}`),
        ]);
        if (posR.status === "rejected" && posR.reason?.message === "RESTRICTED_LIVE_API_ACCESS") {
          setIsLive(true);
          setApiRestricted(true);
          setLoading(false);
          inFlight.current = false;
          return;
        }
      }

      if (!isMounted.current) return;

      // ── Positions ──────────────────────────────────────────────────────────
      if (posR.status === "fulfilled" && posR.value?.length) {
        const latest = latestByDriverNum(posR.value);
        const newPos = Object.values(latest).sort((a, b) => a.position - b.position);
        const changes = {};
        newPos.forEach(p => {
          const k    = dn(p.driver_number);
          const prev = prevPosMap.current[k];
          changes[k] = prev != null ? prev - p.position : 0;
          prevPosMap.current[k] = p.position;
        });
        const final = newPos.map(p => ({
          ...p,
          driver_number: dn(p.driver_number),
          _posChange: changes[dn(p.driver_number)] ?? 0,
        }));
        setPositions(final);
        positionsRef.current = final;
      }

      // ── Intervals ──────────────────────────────────────────────────────────
      if (intR.status === "fulfilled" && intR.value?.length) {
        const intMap = {};
        intR.value.forEach(item => {
          const k = dn(item.driver_number);
          if (!intMap[k] || item.date > intMap[k].date) intMap[k] = item;
        });
        setIntervals(intMap);
      }

      // ── Laps + fastest lap ─────────────────────────────────────────────────
      if (lapR.status === "fulfilled" && lapR.value?.length) {
        const latestLaps = {};
        lapR.value.forEach(l => {
          const k = dn(l.driver_number);
          if (!latestLaps[k] || l.lap_number > (latestLaps[k]?.lap_number || 0))
            latestLaps[k] = l;
        });
        setLaps(latestLaps);

        // Accumulate FL with session barrier — prevents old session's FL bleeding in
        const curSK = sk;
        lapR.value.forEach(l => {
          if (l.lap_duration && l.lap_duration > 0 && !l.is_pit_out_lap && l.lap_duration < 200) {
            setFastestLap(prev => {
              // If prev is from a different session, always replace
              if (prev.sessionKey !== curSK) {
                return { driverNum: dn(l.driver_number), time: l.lap_duration, sessionKey: curSK };
              }
              return l.lap_duration < prev.time
                ? { driverNum: dn(l.driver_number), time: l.lap_duration, sessionKey: curSK }
                : prev;
            });
          }
        });
      }

      // ── Stints ─────────────────────────────────────────────────────────────
      if (stintR.status === "fulfilled" && stintR.value?.length) {
        const latestStints = {};
        stintR.value.forEach(s => {
          const k = dn(s.driver_number);
          if (!latestStints[k] || s.stint_number > (latestStints[k]?.stint_number || 0))
            latestStints[k] = s;
        });
        setStints(latestStints);
      }

      // ── Pits — FIX: use /pit endpoint for in-pit detection ─────────────────
      // A car is currently in pits if its latest pit entry has no pit_duration yet.
      // Do NOT use laps[].lap_duration === null (that's true for all cars mid-lap).
      if (pitR.status === "fulfilled" && pitR.value?.length) {
        const counts   = {};
        const latestPit = {};
        pitR.value.forEach(p => {
          const k = dn(p.driver_number);
          counts[k] = (counts[k] || 0) + 1;
          // Keep latest pit entry per driver (highest lap_number)
          if (!latestPit[k] || (p.lap_number ?? 0) > (latestPit[k]?.lap_number ?? 0)) {
            latestPit[k] = p;
          }
        });
        // Car is in pit lane if their most recent pit stop has no duration yet
        const inPitNow = new Set(
          Object.entries(latestPit)
            .filter(([, p]) => p.pit_duration == null)
            .map(([k]) => parseInt(k, 10))
        );
        setPits({ counts, inPitNow });
      }

      // ── Race control ───────────────────────────────────────────────────────
      if (rcR.status === "fulfilled" && rcR.value?.length) {
        setRaceControl(rcR.value);
      }

      // ── Weather ────────────────────────────────────────────────────────────
      if (wxR.status === "fulfilled" && wxR.value?.length) {
        setWeather(wxR.value[wxR.value.length - 1]);
      }

      if (isMounted.current) {
        setLastUpdate(new Date());
        setLoading(false);
        retryCount.current = 0;
        setError(null);
      }
    } catch (err) {
      console.warn("Live fetch error:", err.message);
      retryCount.current++;
      if (retryCount.current >= 3 && isMounted.current) {
        setError("OpenF1 connection issue — retrying…");
      }
      if (isMounted.current) setLoading(false);
    } finally {
      inFlight.current = false; // always reset, even after early returns in try
    }
  }, [apiFetch]);

  // ── Polling loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    let tid = null;
    let cancelled = false;
    async function poll() {
      if (cancelled) return;
      await fetchAll();
      if (cancelled) return;
      const backoff = retryCount.current > 0
        ? Math.min(POLL_MS * Math.pow(2, retryCount.current), 40000)
        : (isLiveRef.current ? POLL_MS : IDLE_MS);
      tid = setTimeout(poll, backoff);
    }
    poll();
    return () => { cancelled = true; if (tid) clearTimeout(tid); };
  }, [fetchAll]);

  // ── Derive flag state ────────────────────────────────────────────────────────
  // Walk newest-first to find current active flag (cleared by GREEN/CLEAR).
  // Also capture the specific message that triggered the current flag —
  // used in banners so the correct context message is shown (not latestRC).
  const { currentFlagState, flagTriggerMsg } = (() => {
    if (!raceControl.length) return { currentFlagState: "GREEN", flagTriggerMsg: null };
    for (let i = raceControl.length - 1; i >= 0; i--) {
      const m = raceControl[i];
      const f = m.flag;
      if (!f) continue;
      if (["CLEAR", "GREEN"].includes(f)) return { currentFlagState: "GREEN", flagTriggerMsg: null };
      if (["RED","SAFETY_CAR","SAFETY_CAR_ENDING",
           "VIRTUAL_SAFETY_CAR","VIRTUAL_SAFETY_CAR_ENDING",
           "CHEQUERED","YELLOW","DOUBLE_YELLOW","YELLOW_FLAG"].includes(f)) {
        return { currentFlagState: f, flagTriggerMsg: m };
      }
    }
    return { currentFlagState: "GREEN", flagTriggerMsg: null };
  })();

  const isRedFlag   = currentFlagState === "RED";
  const isSC        = currentFlagState === "SAFETY_CAR";
  const isSCEnding  = currentFlagState === "SAFETY_CAR_ENDING";
  const isVSC       = currentFlagState === "VIRTUAL_SAFETY_CAR";
  const isVSCEnding = currentFlagState === "VIRTUAL_SAFETY_CAR_ENDING";
  const isChequered = currentFlagState === "CHEQUERED";
  const isYellow    = ["YELLOW","DOUBLE_YELLOW","YELLOW_FLAG"].includes(currentFlagState);

  // DRS status from most recent relevant RC message
  const drsMsg = [...raceControl].reverse().find(m => {
    const u = m.message?.toUpperCase() ?? "";
    return u.includes("DRS ENABLED") || u.includes("DRS DISABLED");
  });
  const drsEnabled = drsMsg
    ? drsMsg.message.toUpperCase().includes("DRS ENABLED")
    : null;

  // ── Derived helpers ────────────────────────────────────────────────────────
  const pitCounts    = pits.counts || {};
  const inPitSet     = pits.inPitNow || new Set();
  const totalPits    = Object.values(pitCounts).reduce((a, b) => a + b, 0);

  const isQualifying = ["Qualifying","Sprint Qualifying","Sprint Shootout","Sprint_Qualifying"]
    .includes(session?.session_type);

  // Retirement detection — FIX: never flag retired during qualifying
  function isDriverRetired(dNum) {
    if (isQualifying) return false;
    const interval = intervals[dNum];
    const lastLap  = laps[dNum];
    return (
      !inPitSet.has(dNum)
      && interval !== undefined
      && interval?.gap_to_leader === null
      && lastLap?.lap_number != null
      && lastLap.lap_number > 1
    );
  }

  // Blue flags — normalise driver_number to number
  const recentRC = raceControl.slice(-60);
  const blueFlagSet = new Set(
    recentRC
      .filter(m => m.flag === "BLUE" && m.driver_number != null)
      .map(m => dn(m.driver_number))
  );

  const leaderLap = positions[0] ? laps[dn(positions[0].driver_number)]?.lap_number : null;

  // Sector bests
  const allLapVals = Object.values(laps);
  const s1Best = allLapVals.reduce((m, l) => l?.duration_sector_1 > 0 && l.duration_sector_1 < m ? l.duration_sector_1 : m, Infinity);
  const s2Best = allLapVals.reduce((m, l) => l?.duration_sector_2 > 0 && l.duration_sector_2 < m ? l.duration_sector_2 : m, Infinity);
  const s3Best = allLapVals.reduce((m, l) => l?.duration_sector_3 > 0 && l.duration_sector_3 < m ? l.duration_sector_3 : m, Infinity);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="container" style={{ paddingTop: 28 }}>

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="page-subtitle" style={{ marginBottom: 6 }}>
            {session ? `${session.location || ""} · ${session.year ?? ""}` : "OpenF1 · Live Timing"}
          </div>
          <h1 className="page-title" style={{ marginBottom: 8 }}>Live <span>Timing</span></h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {session?.session_type && <SessionBadge sessionType={session.session_type} />}
            {session?.circuit_short_name && (
              <span style={{ fontFamily: "var(--font-head)", fontSize: 12,
                color: "var(--text-muted)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                {session.circuit_short_name}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: isLive ? "rgba(57,181,74,.1)" : "var(--bg-card)",
            border: `1px solid ${isLive ? "#39B54A44" : "var(--border)"}`,
            padding: "6px 14px", fontFamily: "var(--font-head)", fontSize: 11,
            fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: isLive ? "#39B54A" : "var(--text-muted)",
              animation: isLive ? "pulse-dot 1s ease infinite" : "none",
              boxShadow: isLive ? "0 0 6px #39B54A" : "none", flexShrink: 0,
            }} />
            {isLive ? "SESSION LIVE" : loading ? "CONNECTING..." : "NO ACTIVE SESSION"}
          </div>
          {lastUpdate && (
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-head)", letterSpacing: ".08em" }}>
              {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              <span style={{ marginLeft: 5, opacity: .4 }}>· {isLive ? `${POLL_MS/1000}s` : `${IDLE_MS/1000}s`} poll</span>
            </div>
          )}
          {isLive && (
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
              fontFamily: "var(--font-head)", fontSize: 10, letterSpacing: ".12em",
              textTransform: "uppercase", color: showSectors ? "#39B54A" : "var(--text-muted)" }}>
              <input type="checkbox" checked={showSectors} onChange={e => setShowSectors(e.target.checked)}
                style={{ accentColor: "#39B54A" }} />
              Sectors
            </label>
          )}
        </div>
      </div>

      {/* Status banners — SC, Red Flag, VSC, Chequered, Yellow, DRS */}
      {(isRedFlag || isSC || isSCEnding || isVSC || isVSCEnding || isChequered || isYellow || drsEnabled !== null) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>

          {isRedFlag && (
            <div style={{ background: "rgba(225,6,0,.12)", border: "1px solid #E10600",
              borderLeft: "4px solid #E10600", padding: "12px 18px",
              display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#E10600",
                animation: "pulse-dot .6s ease infinite", flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 900,
                  letterSpacing: ".06em", textTransform: "uppercase", color: "#E10600" }}>
                  🔴 RED FLAG — SESSION SUSPENDED
                </div>
                {flagTriggerMsg?.message && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                    {flagTriggerMsg.message}
                    {flagTriggerMsg.lap_number != null && ` · Lap ${flagTriggerMsg.lap_number}`}
                  </div>
                )}
              </div>
            </div>
          )}

          {isSC && (
            <div style={{ background: "rgba(255,242,0,.07)", border: "1px solid #FFF200",
              borderLeft: "4px solid #FFF200", padding: "12px 18px",
              display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFF200",
                animation: "pulse-dot .8s ease infinite", flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 900,
                  letterSpacing: ".06em", textTransform: "uppercase", color: "#FFF200" }}>
                  🟡 SAFETY CAR DEPLOYED
                </div>
                {flagTriggerMsg?.message && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                    {flagTriggerMsg.message}
                    {flagTriggerMsg.lap_number != null && ` · Lap ${flagTriggerMsg.lap_number}`}
                  </div>
                )}
              </div>
            </div>
          )}

          {isSCEnding && (
            <div style={{ background: "rgba(255,242,0,.04)", border: "1px solid #FFF20077",
              borderLeft: "4px solid #FFF200", padding: "9px 18px",
              display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFF200", flexShrink: 0 }} />
              <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 800,
                letterSpacing: ".06em", textTransform: "uppercase", color: "#FFF200aa" }}>
                SAFETY CAR ENDING THIS LAP
              </div>
            </div>
          )}

          {isVSC && (
            <div style={{ background: "rgba(255,242,0,.06)", border: "1px solid #FFF20077",
              borderLeft: "4px solid #FFF200", padding: "12px 18px",
              display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFF200",
                animation: "pulse-dot 1s ease infinite", flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 900,
                  letterSpacing: ".06em", textTransform: "uppercase", color: "#FFF200" }}>
                  🟡 VIRTUAL SAFETY CAR
                </div>
                {flagTriggerMsg?.message && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                    {flagTriggerMsg.message}
                    {flagTriggerMsg.lap_number != null && ` · Lap ${flagTriggerMsg.lap_number}`}
                  </div>
                )}
              </div>
            </div>
          )}

          {isVSCEnding && (
            <div style={{ background: "rgba(255,242,0,.04)", border: "1px solid #FFF20055",
              borderLeft: "4px solid #FFF200", padding: "9px 18px",
              display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFF200aa", flexShrink: 0 }} />
              <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 800,
                letterSpacing: ".06em", textTransform: "uppercase", color: "#FFF200aa" }}>
                VIRTUAL SAFETY CAR ENDING
              </div>
            </div>
          )}

          {isChequered && (
            <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid #ffffff33",
              borderLeft: "4px solid #fff", padding: "12px 18px",
              display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18 }}>🏁</span>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 900,
                letterSpacing: ".06em", textTransform: "uppercase", color: "#fff" }}>
                CHEQUERED FLAG — SESSION COMPLETE
              </div>
            </div>
          )}

          {isYellow && (
            <div style={{ background: "rgba(255,242,0,.05)", border: "1px solid #FFF20055",
              borderLeft: "3px solid #FFF200", padding: "8px 18px",
              display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFF200",
                animation: "pulse-dot 1.2s ease infinite", flexShrink: 0 }} />
              <div style={{ fontFamily: "var(--font-head)", fontSize: 12, fontWeight: 800,
                letterSpacing: ".06em", textTransform: "uppercase", color: "#FFF200bb" }}>
                {currentFlagState === "DOUBLE_YELLOW" ? "⚠ DOUBLE YELLOW FLAG" : "⚠ YELLOW FLAG"}
                {flagTriggerMsg?.message && ` — ${flagTriggerMsg.message}`}
              </div>
            </div>
          )}

          {drsEnabled !== null && !isRedFlag && !isSC && !isVSC && (
            <div style={{
              background: drsEnabled ? "rgba(57,181,74,.06)" : "rgba(70,70,70,.05)",
              border: `1px solid ${drsEnabled ? "#39B54A33" : "#44444455"}`,
              borderLeft: `3px solid ${drsEnabled ? "#39B54A" : "#555"}`,
              padding: "6px 16px", display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 900,
                letterSpacing: ".2em", textTransform: "uppercase",
                color: drsEnabled ? "#39B54A" : "#555" }}>
                DRS {drsEnabled ? "ENABLED" : "DISABLED"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(225,6,0,.07)", border: "1px solid #E1060033",
          borderLeft: "3px solid var(--red)", padding: "10px 16px", marginBottom: 14,
          fontFamily: "var(--font-head)", fontSize: 11, letterSpacing: ".1em",
          textTransform: "uppercase", color: "var(--red)" }}>
          ⚠ {error}
        </div>
      )}

      {/* No session */}
      {!loading && !isLive && <NoSession nextRace={nextRace} nextRaceError={nextRaceError} />}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "40vh", gap: 16 }}>
          <div style={{ width: 40, height: 40, border: "3px solid var(--border)",
            borderTopColor: "var(--red)", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
          <div style={{ fontFamily: "var(--font-head)", fontSize: 11, letterSpacing: ".2em",
            textTransform: "uppercase", color: "var(--text-muted)" }}>
            Connecting to OpenF1…
          </div>
        </div>
      )}

      {/* Live content */}
      {!loading && isLive && (
        <>
          {apiRestricted && (
            <div style={{ background: "rgba(255,128,0,.1)", border: "1px solid #FF800055",
              borderLeft: "3px solid #FF8000", padding: "12px 18px", marginBottom: 14,
              display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 18 }}>🔒</span>
              <div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 900,
                  letterSpacing: ".06em", textTransform: "uppercase", color: "#FF8000" }}>
                  OPENF1 LIVE DATA RESTRICTED
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
                  A live F1 session is currently in progress. Global API access is restricted by OpenF1 to authenticated users until the session ends. Live timing data will become available here automatically once the session is complete.
                </div>
              </div>
            </div>
          )}

          {/* Fastest lap banner */}
          {fastestLap.driverNum != null && fastestLap.time < Infinity && (
            <div style={{ background: "rgba(200,77,255,.06)", border: "1px solid rgba(200,77,255,.18)",
              borderLeft: "3px solid #c84dff", padding: "8px 14px", marginBottom: 10,
              display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 900,
                letterSpacing: ".2em", textTransform: "uppercase", color: "#c84dff" }}>⚡ FASTEST LAP</span>
              <span style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 900, color: "#c84dff" }}>
                {drivers[fastestLap.driverNum]?.name_acronym ?? `#${fastestLap.driverNum}`}
              </span>
              <span style={{ fontFamily: "var(--font-head)", fontSize: 13, color: "#c84dff88" }}>
                {fmtLap(fastestLap.time)}
              </span>
              {drivers[fastestLap.driverNum]?.team_name && (
                <span style={{ fontFamily: "var(--font-head)", fontSize: 10,
                  color: "#c84dff44", letterSpacing: ".06em", textTransform: "uppercase" }}>
                  {drivers[fastestLap.driverNum].team_name}
                </span>
              )}
            </div>
          )}

          <div className="live-layout" style={{
            display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start",
          }}>

            {/* Left: timing tower */}
            <div style={{ minWidth: 0 }}>
              <WeatherBar weather={weather} />

              {/* Stat pills */}
              {leaderLap != null && (
                <div style={{ display: "flex", gap: 2, marginBottom: 2, flexWrap: "wrap" }}>
                  <Pill label="Lap"    value={leaderLap}               accent="var(--red)" />
                  <Pill label="Cars"   value={positions.length} />
                  <Pill label="Pits"   value={totalPits}               accent="var(--gold)" />
                  {!isQualifying && <Pill label="In Pit" value={inPitSet.size || "—"} />}
                  {fastestLap.time < Infinity && (
                    <Pill label="FL" value={fmtLap(fastestLap.time)} accent="#c84dff" />
                  )}
                  {(isSC || isVSC) && (
                    <Pill label={isSC ? "SC" : "VSC"} value="ON" accent="#FFF200" />
                  )}
                  {isRedFlag && <Pill label="FLAG" value="RED" accent="#E10600" />}
                </div>
              )}

              {/* Column header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "34px 10px 38px 1fr 88px 88px 76px 42px 38px",
                padding: "6px 10px", background: "#0a0a0a", border: "1px solid var(--border)",
                fontFamily: "var(--font-head)", fontSize: 8, fontWeight: 700,
                letterSpacing: ".15em", textTransform: "uppercase", color: "var(--text-muted)",
              }}>
                <span>Pos</span><span/>
                <span>No.</span>
                <span>{showSectors ? "Driver · S1 / S2 / S3" : "Driver"}</span>
                <span>{isQualifying ? "Best Lap" : "Gap"}</span>
                <span>Last Lap</span>
                <span>Tyre</span>
                <span style={{ textAlign: "center" }}>Pits</span>
                <span style={{ textAlign: "right" }}>Lap</span>
              </div>

              {/* Rows */}
              {positions.length > 0 ? positions.map(pos => {
                const dNum = dn(pos.driver_number);
                return (
                  <TimingRow
                    key={dNum}
                    pos={pos.position}
                    driver={drivers[dNum]}
                    interval={intervals[dNum]}
                    lastLap={laps[dNum]}
                    stint={stints[dNum]}
                    pitCount={pitCounts[dNum] || 0}
                    isLeader={pos.position === 1}
                    posChange={pos._posChange ?? 0}
                    isInPit={inPitSet.has(dNum)}
                    hasFastestLap={fastestLap.driverNum === dNum}
                    hasBlueFlag={blueFlagSet.has(dNum)}
                    s1Best={s1Best < Infinity ? s1Best : null}
                    s2Best={s2Best < Infinity ? s2Best : null}
                    s3Best={s3Best < Infinity ? s3Best : null}
                    isQualifying={isQualifying}
                    showSectors={showSectors}
                    isRetired={isDriverRetired(dNum)}
                  />
                );
              }) : (
                <div style={{ padding: "40px 20px", textAlign: "center",
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  color: "var(--text-muted)", fontFamily: "var(--font-head)",
                  fontSize: 11, letterSpacing: ".15em", textTransform: "uppercase" }}>
                  Waiting for position data…
                </div>
              )}
            </div>

            {/* Right: session info + tracker + race control */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "14px 16px" }}>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 9, fontWeight: 700,
                  letterSpacing: ".2em", textTransform: "uppercase", color: "var(--red)",
                  marginBottom: 10, paddingBottom: 7, borderBottom: "1px solid var(--border)" }}>
                  Session Info
                </div>
                {[
                  { label: "Session",  val: session?.session_type ?? "—" },
                  { label: "Location", val: session?.location ?? "—" },
                  { label: "Country",  val: session?.country_name ?? "—" },
                  { label: "Circuit",  val: session?.circuit_short_name ?? "—" },
                  { label: "Year",     val: session?.year ?? "—" },
                  { label: "Start",    val: fmtLocalTime(session?.date_start) },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between",
                    padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: 9,
                      textTransform: "uppercase", letterSpacing: ".06em" }}>{row.label}</span>
                    <span style={{ fontWeight: 600, textAlign: "right",
                      maxWidth: "62%", fontSize: 11 }}>{row.val}</span>
                  </div>
                ))}
              </div>

              <LiveCarTracker
                circuitShortName={session?.circuit_short_name}
                positionsRef={positionsRef}
                driversRef={driversRef}
                isLiveSession={isLive}
              />

              <RaceControlFeed messages={raceControl} />
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes fadeUp    { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:.3; } }
        @media (max-width: 900px) {
          .live-layout { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .live-layout > div:first-child { overflow-x: auto; }
        }
      `}</style>
    </div>
  );
}

export default Live;