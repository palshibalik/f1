import { useEffect, useState } from "react";
import TrackMap from "../components/TrackMap";

async function fetchJSON(url, ms = 8000) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) {
      if (res.status === 429) throw new Error("RATE_LIMITED");
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  } catch (e) { clearTimeout(tid); throw e; }
}

function buildSessions(race) {
  if (!race) return [];
  const add = (name, type, data) => {
    if (!data?.date) return null;
    const timeStr = data.time ? data.time.replace("Z", "") + "Z" : "12:00:00Z";
    const iso = `${data.date}T${timeStr}`;
    const ms  = new Date(iso).getTime();
    return isNaN(ms) ? null : { name, type, iso, ms };
  };
  return [
    add("Practice 1",   "Practice",   race.FirstPractice),
    add("Practice 2",   "Practice",   race.SecondPractice),
    add("Practice 3",   "Practice",   race.ThirdPractice),
    add("Sprint Quali", "Sprint",     race.SprintQualifying),
    add("Sprint",       "Sprint",     race.Sprint),
    add("Qualifying",   "Qualifying", race.Qualifying),
    add("Race",         "Race",       { date: race.date, time: race.time }),
  ].filter(Boolean).sort((a, b) => a.ms - b.ms);
}

const SESSION_DURATION = { Race: 10800000, Qualifying: 4500000, Sprint: 5400000, Practice: 3600000 };
const TYPE_COLORS      = { Race: "var(--red)", Qualifying: "#FF8000", Sprint: "#FFD700", Practice: "#39B54A" };

// ── Session countdown card ────────────────────────────────────────────────────
function SessionCard({ session, isNext, round, season }) {
  const [now, setNow]       = useState(() => Date.now());
  const [results, setResults] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const dur = SESSION_DURATION[session.type] || 3600000;
    if (now > session.ms + dur && !results && round && season) {
      const type = session.type === "Qualifying" ? "qualifying"
        : session.name === "Sprint" ? "sprint" : null;
      if (type) {
        fetchJSON(`https://api.jolpi.ca/ergast/f1/${season}/${round}/${type}.json`)
          .then(d => {
            const list = type === "qualifying"
              ? d.MRData?.RaceTable?.Races?.[0]?.QualifyingResults
              : d.MRData?.RaceTable?.Races?.[0]?.SprintResults;
            if (list?.length) setResults(list.slice(0, 3));
          })
          .catch(() => {});
      }
    }
  }, [now, session, results, round, season]);

  const dur    = SESSION_DURATION[session.type] || 3600000;
  const isLive = now >= session.ms && now <= session.ms + dur;
  const isDone = now > session.ms + dur;
  const col    = TYPE_COLORS[session.type] || "var(--red)";

  function fmt() {
    if (isLive) return "LIVE";
    if (isDone) {
      const ms = now - (session.ms + dur);
      const d  = Math.floor(ms / 86400000);
      const h  = Math.floor(ms / 3600000);
      const m  = Math.floor(ms / 60000);
      if (d > 0) return `${d}d ago`;
      if (h > 0) return `${h}h ago`;
      if (m > 0) return `${m}m ago`;
      return "Ended";
    }
    const s  = Math.floor((session.ms - now) / 1000);
    const d  = Math.floor(s / 86400);
    const h  = Math.floor(s / 3600) % 24;
    const m  = Math.floor(s / 60) % 60;
    const sc = s % 60;
    if (d >= 1) return `${d}d ${String(h).padStart(2, "0")}h`;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sc).padStart(2, "0")}`;
  }

  return (
    <div style={{
      flex: "1 1 120px", minWidth: 0,
      padding: "12px 10px",
      background: isLive ? `${col}14` : isNext ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)",
      border: `1px solid ${isLive || isNext ? col + "55" : "var(--border)"}`,
      borderTop: `3px solid ${isDone ? "#1a1a1a" : col}`,
      opacity: isDone ? 0.35 : 1,
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{
        fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 800,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: isDone ? "#2a2a2a" : col,
        display: "flex", alignItems: "center", gap: 5,
      }}>
        {isLive && <span style={{ width: 5, height: 5, borderRadius: "50%", background: col,
          display: "inline-block", animation: "pulse-dot 1s ease infinite", flexShrink: 0 }} />}
        {session.name}
      </div>

      <div style={{
        fontFamily: "var(--font-head)", fontSize: "clamp(16px,3.5vw,26px)",
        fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1,
        color: isLive ? col : isDone ? "#1a1a1a" : isNext ? "var(--text)" : "var(--text-muted)",
        animation: (isLive || isNext) && !isDone ? "cd-pulse 1s ease infinite" : "none",
      }}>
        {fmt()}
      </div>

      {results?.length > 0 && (
        <div style={{ marginTop: 6, padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {results.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, lineHeight: 1.5 }}>
              <span style={{ color: i === 0 ? "var(--gold)" : "var(--text-muted)", fontWeight: 700, fontFamily: "var(--font-head)" }}>
                P{i + 1} {r.Driver?.code || r.Driver?.familyName?.substring(0, 3).toUpperCase()}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: 9 }}>
                {r.Q3 || r.Q2 || r.Q1 || r.Time?.time || ""}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{
        fontFamily: "var(--font-head)", fontSize: 9, fontWeight: 600,
        letterSpacing: "0.04em", color: isDone ? "#1a1a1a" : "var(--text-muted)",
        marginTop: "auto", lineHeight: 1.4,
      }}>
        {new Date(session.iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
        <br />
        {new Date(session.iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

// ── Season Calendar Row ───────────────────────────────────────────────────────
function CalendarRow({ race, isNext }) {
  const raceISO  = `${race.date}T${race.time ? race.time.replace("Z","")+"Z" : "12:00:00Z"}`;
  const raceDate = new Date(raceISO);
  const isDone   = raceDate < new Date();
  const isSprint = !!race.Sprint;

  return (
    <div style={{
      display: "flex", alignItems: "flex-start",
      padding: "16px 20px", gap: 16,
      background: isNext ? "rgba(225,6,0,0.06)" : "transparent",
      borderLeft: `4px solid ${isNext ? "var(--red)" : "transparent"}`,
      borderBottom: "1px solid var(--border)",
      opacity: isDone ? 0.4 : 1,
    }}>
      <div style={{
        fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 900,
        color: isDone ? "#252525" : isNext ? "var(--red)" : "var(--text-muted)",
        letterSpacing: "0.08em", minWidth: 36, flexShrink: 0, paddingTop: 3,
      }}>
        {race.round}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-head)", fontSize: "clamp(18px,3vw,24px)", fontWeight: 800,
          letterSpacing: "0.03em", textTransform: "uppercase", lineHeight: 1.2,
          color: isDone ? "#303030" : isNext ? "var(--text)" : "var(--text-muted)",
        }}>
          {race.raceName}
        </div>
        <div style={{
          fontSize: "clamp(13px,1.8vw,15px)", color: isDone ? "#252525" : "#555",
          marginTop: 4, fontFamily: "var(--font-head)", letterSpacing: "0.04em",
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        }}>
          <span>{race.Circuit.Location.locality}, {race.Circuit.Location.country}</span>
          {isSprint && (
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em",
              color: "#FFD700", background: "#FFD70018", padding: "2px 7px" }}>SPRINT</span>
          )}
        </div>
        <div style={{
          fontFamily: "var(--font-head)", fontSize: "clamp(13px,1.8vw,15px)", fontWeight: 700,
          color: isDone ? "#2a2a2a" : isNext ? "var(--red)" : "#444",
          letterSpacing: "0.04em", marginTop: 5,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span>{raceDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
          {isDone && <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
            color: "#303030", background: "#161616", padding: "2px 8px" }}>DONE</span>}
          {isNext && !isDone && <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
            color: "#fff", background: "var(--red)", padding: "2px 8px" }}>NEXT ▶</span>}
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
function NextRace() {
  const [race,        setRace]        = useState(null);
  const [allRaces,    setAllRaces]    = useState([]);
  const [totalRounds, setTotalRounds] = useState(24);
  const [season,      setSeason]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [tab,         setTab]         = useState("weekend");
  const [now,         setNow]         = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const p1 = fetchJSON("https://api.jolpi.ca/ergast/f1/current/next.json")
      .then(d => {
        const r = d.MRData?.RaceTable?.Races?.[0];
        if (!r) return fetchJSON("https://api.jolpi.ca/ergast/f1/current/last.json")
          .then(d2 => setRace(d2.MRData?.RaceTable?.Races?.[0] ?? null));
        setRace(r);
      });

    const p2 = fetchJSON("https://api.jolpi.ca/ergast/f1/current.json?limit=100")
      .then(d => {
        const races = d.MRData?.RaceTable?.Races ?? [];
        if (races.length) {
          setSeason(races[0].season);
          setTotalRounds(races.length);
          setAllRaces(races);
        }
      });

    Promise.all([p1, p2])
      .catch(e => setError(e.message === "RATE_LIMITED" ? "RATE_LIMITED" : true))
      .finally(() => setLoading(false));
  }, []);

  if (error) return (
    <div className="container">
      <p style={{ color: "var(--red)", fontFamily: "var(--font-head)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {error === "RATE_LIMITED" ? "API Rate Limit reached — please wait a moment." : "Failed to load race data."}
      </p>
    </div>
  );

  if (loading) return (
    <div className="container">
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-head)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Loading race data...
      </p>
    </div>
  );

  if (!race) return (
    <div className="container">
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-head)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        No upcoming race data available.
      </p>
    </div>
  );

  const sessions       = buildSessions(race);
  const raceISO        = `${race.date}T${race.time.replace("Z","")+"Z"}`;
  const raceMs         = new Date(raceISO).getTime();
  const RACE_DUR       = 3 * 3600000;
  const liveSession    = sessions.find(s => now >= s.ms && now <= s.ms + (SESSION_DURATION[s.type] || 3600000));
  const nextSessionIdx = sessions.findIndex(s => now < s.ms + (SESSION_DURATION[s.type] || 3600000));
  const diffDays       = Math.floor((raceMs - now) / 86400000);
  const nextRaceRound  = parseInt(race.round, 10);

  let statusLabel = "Upcoming";
  if (liveSession)                                statusLabel = `${liveSession.name} Live`;
  else if (now > raceMs + RACE_DUR)               statusLabel = "Weekend Complete";
  else if (now >= (sessions[0]?.ms ?? raceMs))    statusLabel = "Race Weekend";
  else if (diffDays <= 0)                         statusLabel = "Race Day";
  else if (diffDays === 1)                        statusLabel = "Race Tomorrow";
  else if (diffDays <= 3)                         statusLabel = "This Weekend";

  return (
    <div className="container">
      <div className="page-subtitle">Round {race.round} · {season} Season</div>
      <h1 className="race-name">
        {tab === "weekend" ? race.raceName : <>{season} Season <span>Calendar</span></>}
      </h1>

      <div className={`race-status-badge ${liveSession ? "" : "upcoming"}`}>
        {liveSession && <span className="race-status-dot" />}
        {statusLabel}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--border)", margin: "24px 0 0" }}>
        {[
          { key: "weekend",  label: "Weekend Schedule" },
          { key: "calendar", label: season ? `${season} Calendar` : "Season Calendar" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            fontFamily: "var(--font-head)", fontSize: 12, fontWeight: 800,
            letterSpacing: "0.15em", textTransform: "uppercase",
            padding: "10px 22px", border: "none", cursor: "pointer",
            background: tab === t.key ? "var(--red)" : "transparent",
            color: tab === t.key ? "#fff" : "var(--text-muted)",
            borderBottom: tab === t.key ? "none" : "2px solid transparent",
            transition: "all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ WEEKEND TAB ══════════════════════════════════════════════════════ */}
      {tab === "weekend" && (
        <>
          {/* Session countdown cards */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 2, margin: "24px 0 32px" }}>
            {sessions.map((session, idx) => (
              <SessionCard
                key={session.name}
                session={session}
                isNext={idx === nextSessionIdx}
                round={race.round}
                season={race.season}
              />
            ))}
          </div>

          {/* Track map + race details */}
          <div className="nr-layout">
            <div className="nr-map">
              <TrackMap circuitId={race.Circuit.circuitId} />
            </div>
            <div className="nr-info">
              <div className="race-info-card">
                <h4>Race Details</h4>
                {[
                  { label: "Circuit",   val: race.Circuit.circuitName },
                  { label: "Location",  val: `${race.Circuit.Location.locality}, ${race.Circuit.Location.country}` },
                  { label: "Race Date", val: new Date(raceISO).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) },
                  { label: "Race Time", val: new Date(raceISO).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
                  { label: "Round",     val: `${race.round} / ${totalRounds}` },
                ].map(row => (
                  <div key={row.label} className="race-info-row">
                    <span className="race-info-key">{row.label}</span>
                    <span className="race-info-val">{row.val}</span>
                  </div>
                ))}
              </div>

              <div className="race-info-card" style={{ marginTop: 12 }}>
                <h4>Weekend Schedule</h4>
                {sessions.map(s => {
                  const dur    = SESSION_DURATION[s.type] || 3600000;
                  const isLive = now >= s.ms && now <= s.ms + dur;
                  const isDone = now > s.ms + dur;
                  const col    = TYPE_COLORS[s.type] || "var(--red)";
                  return (
                    <div key={s.name} className="race-info-row" style={{ opacity: isDone ? 0.35 : 1 }}>
                      <span className="race-info-key" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {isLive && <span style={{ width: 5, height: 5, borderRadius: "50%",
                          background: col, animation: "pulse-dot 1s ease infinite", flexShrink: 0 }} />}
                        <span style={{ color: col }}>{s.name}</span>
                      </span>
                      <span className="race-info-val" style={{ fontSize: 11 }}>
                        {new Date(s.iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                        {" · "}
                        {new Date(s.iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══ CALENDAR TAB ═════════════════════════════════════════════════════ */}
      {tab === "calendar" && (
        <>
          <div className="section-label" style={{ margin: "28px 0 20px" }}>
            {allRaces.length} Rounds · {season} Formula 1 World Championship
          </div>
          <div style={{ border: "1px solid var(--border)", borderTop: "3px solid var(--red)" }}>
            {allRaces.map(r => (
              <CalendarRow
                key={r.round}
                race={r}
                isNext={parseInt(r.round, 10) === nextRaceRound}
              />
            ))}
          </div>
        </>
      )}

      <style>{`
        .nr-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 700px) {
          .nr-layout { grid-template-columns: 1fr; }
          .nr-map    { order: 2; }
          .nr-info   { order: 1; }
        }
        @keyframes cd-pulse  { 0%,100%{opacity:1} 50%{opacity:.85} }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.25} }
      `}</style>
    </div>
  );
}

export default NextRace;