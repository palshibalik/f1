import { useEffect, useState } from "react";

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

function buildWeekendSessions(race) {
  if (!race) return [];
  return [
    { type: "Practice",   name: "Practice 1",   data: race.FirstPractice },
    { type: "Practice",   name: "Practice 2",   data: race.SecondPractice },
    { type: "Practice",   name: "Practice 3",   data: race.ThirdPractice },
    { type: "Sprint",     name: "Sprint Quali", data: race.SprintQualifying },
    { type: "Sprint",     name: "Sprint",       data: race.Sprint },
    { type: "Qualifying", name: "Qualifying",   data: race.Qualifying },
    { type: "Race",       name: "Race",         data: { date: race.date, time: race.time } },
  ]
    .filter(s => s.data?.date)
    .map(s => {
      const timeStr = s.data.time ? s.data.time.replace("Z", "") + "Z" : "12:00:00Z";
      return { ...s, iso: `${s.data.date}T${timeStr}` };
    });
}

const typeColors = {
  Practice:   "#39B54A",
  Sprint:     "#FFD700",
  Qualifying: "#FF8000",
  Race:       "var(--red)",
};

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "var(--font-head)", fontSize: 12, fontWeight: 800,
      letterSpacing: "0.15em", textTransform: "uppercase",
      padding: "10px 22px", border: "none", cursor: "pointer",
      background: active ? "var(--red)" : "transparent",
      color: active ? "#fff" : "var(--text-muted)",
      borderBottom: active ? "none" : "2px solid var(--border)",
      transition: "all 0.15s",
    }}>
      {label}
    </button>
  );
}

function Sessions() {
  const [nextRace, setNextRace] = useState(null);
  const [allRaces, setAllRaces] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [tab,      setTab]      = useState("weekend");
  const [season,   setSeason]   = useState("");

  useEffect(() => {
    const p1 = fetchJSON("https://api.jolpi.ca/ergast/f1/current/next.json")
      .then(d => {
        const nr = d.MRData?.RaceTable?.Races?.[0];
        if (!nr) {
          return fetchJSON("https://api.jolpi.ca/ergast/f1/current/last.json")
            .then(d2 => setNextRace(d2.MRData?.RaceTable?.Races?.[0] ?? null));
        }
        setNextRace(nr);
      });

    const p2 = fetchJSON("https://api.jolpi.ca/ergast/f1/current.json?limit=100")
      .then(d => {
        const races = d.MRData?.RaceTable?.Races ?? [];
        if (races.length) {
          // season comes from the API — never hardcoded
          setSeason(races[0].season);
          setAllRaces(races);
        }
      });

    Promise.all([p1, p2])
      .catch(e => {
        if (e?.name === "AbortError") return;
        setError(e.message === "RATE_LIMITED" ? "RATE_LIMITED" : true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (error) return (
    <div className="container">
      <p style={{ color: "var(--red)", fontFamily: "var(--font-head)", fontSize: 16, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {error === "RATE_LIMITED" ? "API Rate Limit reached. Please wait a moment..." : "Failed to load sessions. Please try again."}
      </p>
    </div>
  );

  if (loading) return (
    <div className="container">
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-head)", fontSize: 16, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Loading sessions...
      </p>
    </div>
  );

  const now            = new Date();
  const weekendSessions = buildWeekendSessions(nextRace);
  const nextRaceRound  = nextRace ? parseInt(nextRace.round, 10) : -1;

  return (
    <div className="container">
      {/* Header — season year comes from API */}
      <div className="page-subtitle">{season ? `${season} Season` : "Race Weekend"}</div>
      <h1 className="page-title">
        {tab === "weekend"
          ? <>{nextRace?.raceName} <span>Sessions</span></>
          : <>{season} Season <span>Calendar</span></>}
      </h1>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginTop: 32, marginBottom: 36 }}>
        <Tab label="Weekend Schedule" active={tab === "weekend"} onClick={() => setTab("weekend")} />
        {/* Tab label uses season from API, not hardcoded */}
        <Tab label={season ? `${season} Calendar` : "Season Calendar"} active={tab === "season"} onClick={() => setTab("season")} />
      </div>

      {/* ══════════════════════════════════════════
          TAB A — Weekend Schedule
      ══════════════════════════════════════════ */}
      {tab === "weekend" && (
        <>
          <div className="section-label" style={{ marginBottom: 16 }}>Weekend Programme</div>
          <div className="session-grid">
            {weekendSessions.map((session, i) => {
              const d      = new Date(session.iso);
              const isPast = d < now;
              const col    = typeColors[session.type] || "var(--red)";
              return (
                <div key={i}
                  className={`session-card ${session.name === "Race" ? "race-card" : ""}`}
                  style={{ opacity: isPast ? 0.45 : 1, borderTop: `3px solid ${col}` }}
                >
                  <div className="session-type" style={{ color: col }}>{session.type}</div>
                  <div className="session-name">{session.name}</div>
                  <div className="session-date">
                    {d.toLocaleDateString("en-GB", { day: "numeric" })}
                  </div>
                  <div className="session-month">
                    {d.toLocaleDateString("en-GB", { weekday: "short", month: "long", year: "numeric" })}
                  </div>
                  <div className="session-time">
                    {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} local
                  </div>
                  {isPast && (
                    <div style={{ marginTop: 12, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Completed
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════
          TAB B — Full Season Calendar
      ══════════════════════════════════════════ */}
      {tab === "season" && (
        <>
          <div className="section-label" style={{ marginBottom: 24, fontSize: 17 }}>
            {allRaces.length} Rounds · {season} Formula 1 World Championship
          </div>

          <div style={{ border: "1px solid var(--border)", borderTop: "3px solid var(--red)" }}>
            {allRaces.length === 0 ? (
              <p style={{ padding: "32px 24px", color: "var(--text-muted)", fontFamily: "var(--font-head)", fontSize: 15, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Loading calendar...
              </p>
            ) : allRaces.map(race => {
              const raceISO  = `${race.date}T${race.time ? race.time.replace("Z","") + "Z" : "12:00:00Z"}`;
              const raceDate = new Date(raceISO);
              const round    = parseInt(race.round, 10);
              const isDone   = raceDate < now;
              const isNext   = round === nextRaceRound;
              const isSprint = !!(race.Sprint);

              return (
                <div key={race.round} style={{
                  display: "flex", alignItems: "flex-start",
                  padding: "16px 20px",
                  background: isNext ? "rgba(255,35,35,0.06)" : "transparent",
                  borderLeft: `4px solid ${isNext ? "var(--red)" : "transparent"}`,
                  borderBottom: "1px solid var(--border)",
                  opacity: isDone ? 0.4 : 1,
                  gap: 16,
                }}>

                  {/* Round number */}
                  <div style={{
                    fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 900,
                    color: isDone ? "#252525" : isNext ? "var(--red)" : "var(--text-muted)",
                    letterSpacing: "0.08em", minWidth: 36, flexShrink: 0, paddingTop: 3,
                  }}>
                    {race.round}
                  </div>

                  {/* Race name + location + date all stacked — fills width on mobile */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "var(--font-head)", fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 800,
                      letterSpacing: "0.03em", textTransform: "uppercase",
                      color: isDone ? "#303030" : isNext ? "var(--text)" : "var(--text-muted)",
                      whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.2,
                    }}>
                      {race.raceName}
                    </div>
                    <div style={{
                      fontSize: "clamp(16px, 2vw, 18px)",
                      color: isDone ? "#252525" : "#555",
                      marginTop: 4, fontFamily: "var(--font-head)", letterSpacing: "0.04em",
                      display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                    }}>
                      <span>{race.Circuit.Location.locality}, {race.Circuit.Location.country}</span>
                      {isSprint && (
                        <span style={{
                          fontSize: 13, fontWeight: 800, letterSpacing: "0.15em",
                          color: "#FFD700", background: "#FFD70018", padding: "2px 7px",
                        }}>SPRINT</span>
                      )}
                    </div>
                    {/* Date shown below name — always visible regardless of screen width */}
                    <div style={{
                      fontFamily: "var(--font-head)", fontSize: "clamp(16px, 2vw, 18px)", fontWeight: 700,
                      color: isDone ? "#2a2a2a" : isNext ? "var(--red)" : "#444",
                      letterSpacing: "0.04em", marginTop: 6,
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span>{raceDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {isDone && (
                        <span style={{
                          fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 800,
                          letterSpacing: "0.12em", color: "#303030", background: "#161616", padding: "2px 8px",
                        }}>DONE</span>
                      )}
                      {isNext && !isDone && (
                        <span style={{
                          fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 800,
                          letterSpacing: "0.12em", color: "#fff", background: "var(--red)", padding: "2px 8px",
                        }}>NEXT ▶</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default Sessions;