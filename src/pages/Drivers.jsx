import { useEffect, useState } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TEAM_COLORS = {
  "Red Bull Racing":  "#3671C6",
  "Red Bull":         "#3671C6",
  "Ferrari":          "#E8002D",
  "Mercedes":         "#27F4D2",
  "McLaren":          "#FF8000",
  "Aston Martin":     "#229971",
  "Alpine F1 Team":   "#FF87BC",
  "Alpine":           "#FF87BC",
  "Williams":         "#64C4FF",
  "RB F1 Team":       "#6692FF",
  "RB":               "#6692FF",
  "Racing Bulls":     "#6692FF",
  "Kick Sauber":      "#52E252",
  "Sauber":           "#52E252",
  "Haas F1 Team":     "#B6BABD",
  "Haas":             "#B6BABD",
  "Cadillac":         "#FFFFFF",
  "Cadillac F1 Team": "#FFFFFF",
};

const DRIVER_IMAGES = {
  max_verstappen: "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/verstappen.png",
  leclerc:        "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/leclerc.png",
  norris:         "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/norris.png",
  russell:        "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/russell.png",
  hamilton:       "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/hamilton.png",
  gasly:          "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/gasly.png",
  piastri:        "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/piastri.png",
  sainz:          "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/sainz.png",
  alonso:         "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/alonso.png",
  albon:          "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/albon.png",
  tsunoda:        "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/tsunoda.png",
  ocon:           "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/ocon.png",
  hulkenberg:     "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/hulkenberg.png",
  stroll:         "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/stroll.png",
  bearman:        "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/bearman.png",
  antonelli:      "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/antonelli.png",
  lawson:         "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/lawson.png",
  hadjar:         "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/hadjar.png",
  bortoleto:      "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/bortoleto.png",
  doohan:         "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/doohan.png",
  colapinto:      "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/colapinto.png",
};

const PLACEHOLDER = "https://placehold.co/44x44/141414/666?text=F1";

function teamColor(name) {
  return TEAM_COLORS[name] || "#444444";
}

function driverPhoto(id) {
  return DRIVER_IMAGES[id] || PLACEHOLDER;
}

// ─── Driver Detail Modal ──────────────────────────────────────────────────────

function DriverModal({ driver, onClose, season }) {
  const d      = driver.Driver;
  const team   = driver.Constructors?.[0];
  const color  = teamColor(team?.name);
  const photo  = driverPhoto(d.driverId);
  const dob    = new Date(d.dateOfBirth);
  const [now]  = useState(() => Date.now());
  const age    = Math.floor((now - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const [history, setHistory] = useState(null);
  const [qualiHistory, setQualiHistory] = useState(null);
  const [sprintHistory, setSprintHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch last 5 results (Race, Quali, Sprint) for this driver in the current season context
    Promise.allSettled([
      fetch(`https://api.jolpi.ca/ergast/f1/${season}/drivers/${d.driverId}/results.json?limit=5`).then(r => r.json()),
      fetch(`https://api.jolpi.ca/ergast/f1/${season}/drivers/${d.driverId}/qualifying.json?limit=5`).then(r => r.json()),
      fetch(`https://api.jolpi.ca/ergast/f1/${season}/drivers/${d.driverId}/sprint.json?limit=5`).then(r => r.json()),
    ]).then(([rRes, qRes, sRes]) => {
      if (rRes.status === "fulfilled") {
        setHistory((rRes.value.MRData?.RaceTable?.Races || []).reverse());
      }
      if (qRes.status === "fulfilled") {
        setQualiHistory((qRes.value.MRData?.RaceTable?.Races || []).reverse());
      }
      if (sRes.status === "fulfilled") {
        const sprintRaces = sRes.value.MRData?.RaceTable?.Races || [];
        setSprintHistory(sprintRaces.reverse());
      }
    })
    .finally(() => setLoading(false));
  }, [d.driverId]);

  // Prevent background scroll without moving the page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const stats = [
    { label: "Position",      val: `P${driver.position}` },
    { label: "Points",        val: driver.points },
    { label: "Wins",          val: driver.wins },
    { label: "Age",           val: `${age} yrs` },
    { label: "Nationality",   val: d.nationality },
    { label: "Date of Birth", val: dob.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) },
  ];

  return (
    <div className="driver-modal-overlay" onClick={onClose}>
      <div
        className="driver-modal"
        style={{ borderTop: `3px solid ${color}` }}
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div
          className="driver-modal-header"
          style={{ background: `linear-gradient(120deg, ${color}22 0%, transparent 65%)` }}
        >
          <img
            src={photo}
            alt={`${d.givenName} ${d.familyName}`}
            className="driver-modal-photo"
            onError={e => { e.currentTarget.src = PLACEHOLDER; }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.2em", textTransform: "uppercase",
              color: color, marginBottom: 5,
            }}>
              {team?.name ?? "—"} · #{d.permanentNumber ?? driver.position}
            </div>
            <div style={{
              fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 900,
              textTransform: "uppercase", lineHeight: 1.05,
            }}>
              {d.givenName}{" "}
              <span style={{ color }}>{d.familyName}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 5, letterSpacing: "0.06em" }}>
              {d.nationality}
            </div>
          </div>

          <button className="driver-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Stats */}
        <div className="driver-modal-stats">
          {stats.map(({ label, val }) => (
            <div key={label} className="driver-modal-stat">
              <div className="driver-modal-stat-label">{label}</div>
              <div className="driver-modal-stat-val">{val}</div>
            </div>
          ))}
        </div>

        {/* Recent Performance */}
        <div style={{ padding: "0 28px 24px" }}>
          <div className="section-label" style={{ marginBottom: 16, fontSize: 10 }}>Recent Performance</div>
          {loading ? (
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-head)" }}>
              Loading performance data...
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Race History */}
              <div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Race Results</div>
                {!history?.length ? (
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>No race data.</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {history.map(r => {
                      const pos = r.Results[0].position;
                      return (
                        <div key={r.round} title={`${r.raceName}: P${pos}`} style={{
                          width: 32, height: 32, background: "var(--bg-card)", border: "1px solid var(--border)",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900,
                          color: pos === "1" ? "var(--gold)" : parseInt(pos) <= 3 ? "#C0C0C0" : "var(--text-mid)",
                          borderRadius: 2
                        }}>
                          {pos}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quali & Sprint History */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Qualifying</div>
                  {!qualiHistory?.length ? (
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>No data</div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {qualiHistory.map(r => (
                        <div key={r.round} title={r.raceName} style={{
                          width: 24, height: 24, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800,
                          color: r.QualifyingResults[0].position === "1" ? "var(--red)" : "var(--text-muted)", borderRadius: 2
                        }}>
                          {r.QualifyingResults[0].position}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Sprint</div>
                  {!sprintHistory?.length ? (
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>No data</div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {sprintHistory.map(r => (
                        <div key={r.round} title={r.raceName} style={{
                          width: 24, height: 24, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800,
                          color: parseInt(r.SprintResults[0].points) > 0 ? "var(--gold)" : "var(--text-muted)", borderRadius: 2
                        }}>
                          {r.SprintResults[0].position}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wikipedia */}
        {d.url && (
          <div style={{ padding: "0 28px 24px" }}>
            <a
              href={d.url}
              target="_blank"
              rel="noreferrer"
              className="driver-modal-link"
              style={{ color, border: `1px solid ${color}44`, display: "block", textAlign: "center" }}
            >
              View Full Profile ↗
            </a>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Drivers Tab ─────────────────────────────────────────────────────────────

function DriversTab({ drivers, onSelect }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? drivers : drivers.slice(0, 10);

  return (
    <>
      <div className="standings-header">
        <span>Pos</span>
        <span>Driver</span>
        <span style={{ textAlign: "left" }}>Team</span>
        <span>Points</span>
        <span>Wins</span>
      </div>

      {visible.map((driver, idx) => {
        const d      = driver.Driver;
        const team   = driver.Constructors?.[0];
        const color  = teamColor(team?.name);
        const photo  = driverPhoto(d.driverId);
        const isTop3 = parseInt(driver.position, 10) <= 3;

        return (
          <div
            key={d.driverId}
            className="driver-row"
            style={{
              borderLeftColor: color,
              cursor: "pointer",
              animationDelay: `${idx * 0.04}s`,
              background: `linear-gradient(90deg, ${color}20 0%, ${color}08 26%, var(--bg-card) 52%)`,
            }}
            onClick={() => onSelect(driver)}
          >
            <span className={`driver-pos${isTop3 ? " top3" : ""}`}>
              {driver.position}
            </span>

            <div className="driver-cell">
              <img
                src={photo}
                alt={d.familyName}
                className="driver-img"
                onError={e => { e.currentTarget.src = PLACEHOLDER; }}
              />
              <div>
                <div className="driver-firstname">{d.givenName}</div>
                <div className="driver-lastname">{d.familyName}</div>
              </div>
            </div>

            <div className="driver-team" style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
              {team?.name ?? "—"}
            </div>

            <span className="driver-points" style={{ color: isTop3 ? "var(--text)" : "var(--text-mid)", position: "relative" }}>
              {driver.points}
              {driver.isInjected && (
                <span style={{ 
                  position: "absolute", top: -8, right: -12, fontSize: 8, 
                  color: "var(--gold)", fontWeight: 900, letterSpacing: "0.05em"
                }}>LIVE</span>
              )}
            </span>

            <span className="driver-wins" style={{ color: parseInt(driver.wins, 10) > 0 ? "var(--gold)" : "var(--text-muted)" }}>
              {driver.wins}
            </span>
          </div>
        );
      })}

      {drivers.length > 10 && (
        <button className="show-all-btn" onClick={() => setShowAll(s => !s)}>
          {showAll ? "Show Top 10 ▲" : `Show All ${drivers.length} Drivers ▼`}
        </button>
      )}
    </>
  );
}

// ─── Constructors Tab ─────────────────────────────────────────────────────────

function ConstructorsTab({ constructors }) {
  const leaderPts = parseFloat(constructors[0]?.points ?? 1) || 1;

  return (
    <>
      <div className="standings-header" style={{ gridTemplateColumns: "52px 1fr 160px 100px 80px" }}>
        <span>Pos</span>
        <span>Constructor</span>
        <span>Nationality</span>
        <span>Points</span>
        <span>Wins</span>
      </div>

      {constructors.map((c, idx) => {
        const color  = teamColor(c.Constructor?.name);
        const isTop3 = parseInt(c.position, 10) <= 3;
        const pct    = Math.min((parseFloat(c.points) / leaderPts) * 100, 100);

        return (
          <div key={c.Constructor.constructorId}>
            <div
              className="constructor-row"
              style={{
                borderLeftColor: color,
                animationDelay: `${idx * 0.04}s`,
                background: `linear-gradient(90deg, ${color}20 0%, ${color}08 26%, var(--bg-card) 52%)`,
              }}
            >
              <span className={`driver-pos${isTop3 ? " top3" : ""}`}>
                {c.position}
              </span>

              <div style={{ textAlign: "left" }}>
                <div className="driver-lastname">{c.Constructor.name}</div>
              </div>

              <span className="driver-team" style={{ textAlign: "left" }}>{c.Constructor.nationality}</span>

              <span className="driver-points" style={{ color: isTop3 ? "var(--text)" : "var(--text-mid)" }}>
                {c.points}
              </span>

              <span className="driver-wins" style={{ color: parseInt(c.wins, 10) > 0 ? "var(--gold)" : "var(--text-muted)" }}>
                {c.wins}
              </span>
            </div>

            {/* Points bar */}
            <div className="constructor-points-bar-wrap" style={{ borderLeftColor: color }}>
              <div
                className="constructor-points-bar-fill"
                style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}55` }}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

function WeekendResultsTab({ data }) {
  if (!data?.quali && !data?.sprint && !data?.sprintPending) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-head)" }}>
        NO WEEKEND DATA AVAILABLE
      </div>
    );
  }

  // Show sprint column if: it is a sprint weekend AND either data arrived OR still pending
  const showSprint = data.isSprint && (data.sprint || data.sprintPending);
  const cols = showSprint ? "1fr 1fr" : "1fr";

  return (
    <div style={{ animation: "fadeUp 0.3s ease both" }}>
      <div style={{ marginTop: 32, marginBottom: 16, borderLeft: "3px solid var(--red)", paddingLeft: 16 }}>
        <div style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700, color: "var(--red)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          LATEST WEEKEND · {data.raceName}
          {showSprint && <span style={{ marginLeft: 12, color: "#FFD700" }}>SPRINT WEEKEND</span>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 32 }} className="weekend-grid-mobile">
        {/* Qualifying */}
        <div>
          <div className="section-label" style={{ marginBottom: 16 }}>Qualifying Grid</div>
          {!data.quali ? (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Qualifying data not yet available.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {data.quali.slice(0, 20).map(r => {
                const col = teamColor(r.Constructor.name);
                return (
                  <div key={r.Driver.driverId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: `3px solid ${col}` }}>
                    <span style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 900, color: r.position === "1" ? "var(--red)" : "var(--text-muted)", minWidth: 20 }}>{r.position}</span>
                    <span style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 800, textTransform: "uppercase", flex: 1 }}>{r.Driver.code || r.Driver.familyName}</span>
                    <span style={{ fontFamily: "var(--font-head)", fontSize: 11, color: "var(--text-muted)" }}>{r.Q3 || r.Q2 || r.Q1 || "—"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sprint — shown on sprint weekends; pending state when Jolpica hasn't published yet */}
        {showSprint && (
          <div>
            <div className="section-label" style={{ marginBottom: 16, color: "#FFD700" }}>Sprint Classification</div>
            {data.sprintPending ? (
              <div style={{ padding: "24px 0", color: "var(--text-muted)", fontFamily: "var(--font-head)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 14, height: 14, border: "2px solid var(--border)", borderTopColor: "#FFD700", borderRadius: "50%", animation: "spin .8s linear infinite", flexShrink: 0 }} />
                Results being published...
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {data.sprint.map((r, i) => {
                  const col = teamColor(r.Constructor.name);
                  return (
                    <div key={r.Driver.driverId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: `3px solid ${col}` }}>
                      <span style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 900, color: i < 3 ? "var(--gold)" : "var(--text-muted)", minWidth: 20 }}>{r.position}</span>
                      <span style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 800, textTransform: "uppercase", flex: 1 }}>{r.Driver.code || r.Driver.familyName}</span>
                      <span style={{ fontFamily: "var(--font-head)", fontSize: 11, color: "var(--gold)", fontWeight: 700 }}>+{r.points} PTS</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 800px) {
          .weekend-grid-mobile { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function Drivers() {
  const [drivers,      setDrivers]      = useState([]);
  const [constructors, setConstructors] = useState([]);
  const [season,       setSeason]       = useState(new Date().getFullYear());
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [tab,          setTab]          = useState("drivers");
  const [selected,     setSelected]     = useState(null);
  const [isSynced,     setIsSynced]     = useState(false);
  const [debugInfo,    setDebugInfo]    = useState(null);
  const [weekendData,  setWeekendData]  = useState({ quali: null, sprint: null, sprintPending: false, isSprint: false, raceName: null });

  useEffect(() => {
    const ctrl = new AbortController();
    const fetchWithTimeout = (url) => {
      const tid = setTimeout(() => ctrl.abort(), 8000);
      return fetch(url, { signal: ctrl.signal })
        .then(r => { 
          clearTimeout(tid); 
          if (r.status === 429) {
            const err = new Error("Rate limit");
            err.code = "RATE_LIMITED";
            throw err;
          }
          if (!r.ok) throw new Error(`HTTP ${r.status}`); 
          return r.json(); 
        })
        .catch(e => { clearTimeout(tid); throw e; });
    };

    async function loadStandings() {
      try {
        // Fetch standings + full season schedule together
        const [dData, cData, schedData] = await Promise.all([
          fetchWithTimeout("https://api.jolpi.ca/ergast/f1/current/driverstandings.json"),
          fetchWithTimeout("https://api.jolpi.ca/ergast/f1/current/constructorstandings.json"),
          fetchWithTimeout("https://api.jolpi.ca/ergast/f1/current.json?limit=100"),
        ]);

        const dList = dData.MRData.StandingsTable.StandingsLists[0];
        const cList = cData.MRData.StandingsTable.StandingsLists[0];
        const standingsRound = parseInt(dList?.round || 0);
        const allRaces = schedData.MRData?.RaceTable?.Races || [];
        if (dList?.season) setSeason(dList.season);

        let finalDrivers = dList?.DriverStandings ?? [];
        let finalConstructors = cList?.ConstructorStandings ?? [];

        // Find the active weekend by time — the round whose first session has started
        // but whose race hasn't finished yet (+ 3h), or the most recent past weekend.
        const now = Date.now();
        const roundWindows = allRaces.map(race => {
          const sessions = [race.FirstPractice, race.SprintQualifying, race.SecondPractice,
            race.ThirdPractice, race.Sprint, race.Qualifying].filter(Boolean);
          const earliest = sessions.reduce((min, s) => {
            const t = new Date(`${s.date}T${s.time || "12:00:00Z"}`).getTime();
            return t < min ? t : min;
          }, Infinity);
          const raceMs = new Date(`${race.date}T${race.time || "12:00:00Z"}`).getTime();
          return {
            round: race.round, raceName: race.raceName, season: race.season,
            earliestMs: isFinite(earliest) ? earliest : raceMs,
            raceMs, isSprint: !!race.Sprint,
          };
        });

        // Active = weekend started AND race window not over, else most recent started
        let activeRound = roundWindows.find(
          rw => now >= rw.earliestMs - 30 * 60000 && now <= rw.raceMs + 3 * 3600000
        );
        if (!activeRound) {
          const started = roundWindows.filter(rw => now > rw.earliestMs);
          if (started.length) activeRound = started[started.length - 1];
        }

        if (!activeRound) {
          setDrivers(finalDrivers); setConstructors(finalConstructors); setIsSynced(true);
          return;
        }

        // Fetch qualifying always; only fetch sprint if this is a sprint weekend
        const promises = [
          fetchWithTimeout(`https://api.jolpi.ca/ergast/f1/${activeRound.season}/${activeRound.round}/qualifying.json`),
        ];
        if (activeRound.isSprint) {
          promises.push(fetchWithTimeout(`https://api.jolpi.ca/ergast/f1/${activeRound.season}/${activeRound.round}/sprint.json`));
        }

        const settled = await Promise.allSettled(promises);
        const qData = settled[0]?.status === "fulfilled" ? settled[0].value.MRData?.RaceTable?.Races?.[0] : null;
        const sData = activeRound.isSprint && settled[1]?.status === "fulfilled" ? settled[1].value.MRData?.RaceTable?.Races?.[0] : null;

        // Sprint may be empty because Jolpica lags hours behind after a session ends.
        // Use "pending" flag so the tab shows a waiting state rather than disappearing.
        const sprintResults = sData?.SprintResults || null;
        const sprintPending = activeRound.isSprint && !sprintResults;

        const wData = {
          quali:         qData?.QualifyingResults || null,
          sprint:        sprintResults,
          sprintPending: sprintPending,
          raceName:      qData?.raceName || sData?.raceName || activeRound.raceName,
          isSprint:      activeRound.isSprint,
        };

        setWeekendData(wData);
        setDebugInfo({ round: activeRound.round, standings: standingsRound });

        // Inject sprint points if sprint done but not yet reflected in official standings
        if (wData.sprint?.length && parseInt(activeRound.round) > standingsRound) {
          finalDrivers = finalDrivers.map(d => {
            const sItem = wData.sprint.find(sr => sr.Driver.driverId === d.Driver.driverId);
            if (sItem) return { ...d, points: (parseFloat(d.points) + parseFloat(sItem.points)).toString(), isInjected: true };
            return d;
          }).sort((a, b) => parseFloat(b.points) - parseFloat(a.points));

          finalConstructors = finalConstructors.map(c => {
            const sItems = wData.sprint.filter(sr => sr.Constructor.constructorId === c.Constructor.constructorId);
            const sPts = sItems.reduce((acc, cur) => acc + parseFloat(cur.points), 0);
            return { ...c, points: (parseFloat(c.points) + sPts).toString(), isInjected: true };
          }).sort((a, b) => parseFloat(b.points) - parseFloat(a.points));
        }

        setDrivers(finalDrivers);
        setConstructors(finalConstructors);
        setIsSynced(true);

      } catch (e) {
        if (e?.name === "AbortError") return;
        if (e.code === "RATE_LIMITED") setError("RATE_LIMITED");
        else setError("Failed to load standings. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadStandings();
    return () => ctrl.abort();
  }, []);

  if (loading) return (
    <div className="container">
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-head)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Loading standings...
      </p>
    </div>
  );

  if (error) return (
    <div className="container">
      <p style={{ color: "var(--red)", fontFamily: "var(--font-head)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {error}
      </p>
    </div>
  );

  return (
    <div className="container">

      <div className="page-subtitle">{season} World Championship</div>
      <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {tab === "drivers"
          ? <><span>Driver</span> Standings</>
          : <><span>Constructor</span> Standings</>
        }
        {isSynced && (
          <span style={{ 
            fontSize: 10, background: "rgba(57,181,74,0.15)", color: "#39B54A", 
            padding: "4px 10px", borderRadius: 2, letterSpacing: "0.1em", fontWeight: 800
          }}>
            SYNCED
          </span>
        )}
      </h1>

      {/* Tab switcher */}
      <div className="drivers-tabs" style={{ marginTop: 28 }}>
        <button
          className={`drivers-tab-btn${tab === "drivers" ? " active" : ""}`}
          onClick={() => setTab("drivers")}
        >
          Drivers
        </button>
        <button
          className={`drivers-tab-btn${tab === "constructors" ? " active" : ""}`}
          onClick={() => setTab("constructors")}
        >
          Constructors
        </button>
        {(weekendData?.quali || weekendData?.sprint || weekendData?.sprintPending) && (
          <button
            className={`drivers-tab-btn${tab === "weekend" ? " active" : ""}`}
            onClick={() => setTab("weekend")}
          >
            Weekend Results
            {weekendData?.isSprint && weekendData?.sprint && (
              <span style={{ marginLeft: 6, fontSize: 9, color: "#FFD700", fontWeight: 900, letterSpacing: "0.1em" }}>SPRINT</span>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      {tab === "drivers"      && <DriversTab      drivers={drivers}           onSelect={setSelected} />}
      {tab === "constructors" && <ConstructorsTab  constructors={constructors} />}
      {tab === "weekend"      && <WeekendResultsTab data={weekendData} />}

      {/* Modal */}
      {selected && <DriverModal driver={selected} onClose={() => setSelected(null)} season={season} />}

      {/* Debug Footer */}
      {debugInfo && (
        <div style={{ marginTop: 64, borderTop: "1px solid var(--border)", padding: "20px 0", opacity: 0.3 }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 10, letterSpacing: "0.1em", color: "var(--text-muted)" }}>
            STANDINGS ROUND: {debugInfo.standings} · LATEST EVENT ROUND: {debugInfo.round} · SEASON: {season}
          </div>
        </div>
      )}

    </div>
  );
}

export default Drivers;