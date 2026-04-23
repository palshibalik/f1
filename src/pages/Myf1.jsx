/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";

// ── Behaviour tracking ─────────────────────────────────────────────────────
const STORE_KEY = "f1hq_myf1_behaviour";

function loadBehaviour() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch { return {}; }
}

function saveBehaviour(data) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export function trackEvent(type, value) {
  // Call this from other pages: trackEvent("driver", "VER") or trackEvent("news", "headline text")
  const b = loadBehaviour();
  if (!b[type]) b[type] = {};
  b[type][value] = (b[type][value] || 0) + 1;
  b._lastSeen = Date.now();
  saveBehaviour(b);
}

function topItem(obj) {
  if (!obj || !Object.keys(obj).length) return null;
  return Object.entries(obj).sort((a, b) => b[1] - a[1])[0][0];
}

// ── Driver full names map ──────────────────────────────────────────────────
const DRIVER_NAMES = {
  VER: "Max Verstappen", NOR: "Lando Norris", PIA: "Oscar Piastri",
  LEC: "Charles Leclerc", HAM: "Lewis Hamilton", RUS: "George Russell",
  SAI: "Carlos Sainz", ALO: "Fernando Alonso", TSU: "Yuki Tsunoda",
  HAD: "Isack Hadjar", LAW: "Liam Lawson", ANT: "Kimi Antonelli",
  GAS: "Pierre Gasly", DOO: "Jack Doohan", STR: "Lance Stroll",
  ALB: "Alexander Albon", HUL: "Nico Hulkenberg", BEA: "Oliver Bearman",
  OCO: "Esteban Ocon", BOT: "Valtteri Bottas",
};

const TEAM_COLORS = {
  McLaren: "#FF8000", Ferrari: "#E8002D", "Red Bull": "#3671C6",
  Mercedes: "#27F4D2", "Aston Martin": "#358C75", Alpine: "#FF87BC",
  Williams: "#64C4FF", "RB F1 Team": "#6692FF", Haas: "#B6BABD",
  Kick: "#52E252", Sauber: "#52E252",
};

function teamColor(name = "") {
  for (const [k, v] of Object.entries(TEAM_COLORS)) {
    if (name.includes(k)) return v;
  }
  return "#666";
}

async function fetchJSON(url, ms = 8000) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);
    if (res.status === 429) {
      const err = new Error("Rate limit reached");
      err.code = "RATE_LIMITED";
      throw err;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (e) { clearTimeout(tid); throw e; }
}

// ── Stat box ──────────────────────────────────────────────────────────────
function StatBox({ label, value, sub, color }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: `3px solid ${color || "var(--red)"}`, padding: "20px 20px" }}>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-head)", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, color: color || "var(--text)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-head)", letterSpacing: "0.06em" }}>{sub}</div>}
    </div>
  );
}

function MyF1() {
  const behaviour = loadBehaviour();
  const totalEvents = Object.values(behaviour).filter(v => typeof v === "object").reduce((acc, obj) => acc + Object.values(obj).reduce((s, n) => s + n, 0), 0);
  const hasEnoughData = totalEvents >= 3;

  const inferredDriver = topItem(behaviour.driver);
  const inferredCircuit = topItem(behaviour.circuit);

  const [season, setSeason] = useState(() => new Date().getFullYear().toString());
  const [driverStanding, setDriverStanding] = useState(null);
  const [teamStanding, setTeamStanding] = useState(null);
  const [driverResults, setDriverResults] = useState([]);

  // Manual pick if no inferred driver
  const [manualDriver, setManualDriver] = useState(() => {
    try { return localStorage.getItem("f1hq_myf1_manual") || ""; } catch { return ""; }
  });

  const activeDriver = inferredDriver || manualDriver;
  const activeName = activeDriver ? (DRIVER_NAMES[activeDriver] || activeDriver) : null;
  const [loading, setLoading] = useState(!!activeDriver);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!activeDriver) return;

    setLoading(true);
    setError(null);

    fetchJSON("https://api.jolpi.ca/ergast/f1/current/driverStandings.json")
      .then(d => {
        const list = d.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
        const s = d.MRData?.StandingsTable?.StandingsLists?.[0]?.season || String(new Date().getFullYear());
        setSeason(s);

        const lowerActive = activeDriver.toLowerCase();
        const found = list.find(s => s.Driver.code === activeDriver || s.Driver.driverId.toLowerCase().includes(lowerActive));
        setDriverStanding(found || null);
        
        if (found) {
          const team = found.Constructors?.[0]?.name;
          fetchJSON(`https://api.jolpi.ca/ergast/f1/${s}/constructorStandings.json`)
            .then(cd => {
              const cList = cd.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];
              const ct = cList.find(c => c.Constructor.name === team || (found.Constructors?.[0]?.constructorId && c.Constructor.constructorId === found.Constructors[0].constructorId));
              setTeamStanding(ct || null);
            }).catch(() => {});

          // Fetch last 5 race results AND sprints for this driver
          Promise.allSettled([
            fetchJSON(`https://api.jolpi.ca/ergast/f1/${s}/results.json?limit=100`),
            fetchJSON(`https://api.jolpi.ca/ergast/f1/${s}/sprint.json?limit=100`)
          ]).then(([rRes, sRes]) => {
            const races   = rRes.status === "fulfilled" ? (rRes.value.MRData?.RaceTable?.Races || []) : [];
            const sprints = sRes.status === "fulfilled" ? (sRes.value.MRData?.RaceTable?.Races || []) : [];
            
            const results = [];
            
            // Add GP results
            races.forEach(race => {
              const r = race.Results?.find(res => res.Driver.code === activeDriver || res.Driver.driverId.toLowerCase().includes(lowerActive));
              if (r) results.push({ 
                type: "GP",
                race: race.raceName, 
                round: parseInt(race.round), 
                date: race.date, 
                position: r.position, 
                points: r.points, 
                status: r.status, 
                grid: r.grid, 
                timestamp: new Date(race.date + (race.time ? ("T" + race.time) : "")).getTime()
              });
            });

            // Add Sprint results
            sprints.forEach(race => {
              const r = race.SprintResults?.find(res => res.Driver.code === activeDriver || res.Driver.driverId.toLowerCase().includes(lowerActive));
              if (r) results.push({ 
                type: "Sprint",
                race: race.raceName, 
                round: parseInt(race.round), 
                date: race.date, 
                position: r.position, 
                points: r.points, 
                status: r.status, 
                grid: r.grid,
                timestamp: new Date(race.date + (race.time ? ("T" + race.time) : "")).getTime() + 1 // Ensure sorted after Quali/before Race
              });
            });

            setDriverResults(results.sort((a, b) => b.timestamp - a.timestamp).slice(0, 8));
          });
        }
      })
      .catch(e => {
        if (e.code === "RATE_LIMITED") setError("RATE_LIMITED");
        else setError("Error loading data.");
      })
      .finally(() => setLoading(false));
  }, [activeDriver]);

  const DRIVER_LIST = Object.entries(DRIVER_NAMES);

  return (
    <div className="container">
      <div className="page-subtitle">{season} Season · Personal</div>
      <h1 className="page-title">My <span>F1</span></h1>

      {/* ── How it works ── */}
      <div style={{ background: "rgba(225,6,0,0.04)", border: "1px solid rgba(225,6,0,0.15)", borderLeft: "3px solid var(--red)", padding: "14px 20px", marginBottom: 32 }}>
        <div style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "var(--red)", marginBottom: 4 }}>HOW THIS WORKS</div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
          This page learns from how you use the app — which drivers, circuits and pages you visit most — and builds your personal F1 view automatically. The more you explore, the more personalised it becomes.
          {!hasEnoughData && " Keep browsing to unlock your full profile."}
        </p>
      </div>

      {!hasEnoughData && !manualDriver ? (
        /* ── Not enough data yet: manual pick ── */
        <div>
          <div className="section-label">Choose Your Driver To Get Started</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 2 }}>
            {DRIVER_LIST.map(([code, name]) => (
              <button key={code} onClick={() => {
                localStorage.setItem("f1hq_myf1_manual", code);
                setManualDriver(code);
              }} style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                padding: "14px 16px", cursor: "pointer", textAlign: "left",
                transition: "border-color 0.15s, background 0.15s",
                fontFamily: "var(--font-head)",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(225,6,0,0.4)"; e.currentTarget.style.background = "rgba(225,6,0,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-card)"; }}
              >
                <div style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", color: "var(--red)" }}>{code}</div>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--text)", marginTop: 4 }}>{name.split(" ")[1]}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{name.split(" ")[0]}</div>
              </button>
            ))}
          </div>
        </div>
      ) : loading ? (
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-head)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Loading your profile...</p>
      ) : error ? (
        <div style={{ padding: "40px", background: "var(--bg-card)", border: "1px solid var(--border)", textAlign: "center", borderRadius: "12px" }}>
          {error === "RATE_LIMITED" ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⏱️</div>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, color: "var(--red)", fontSize: 20 }}>API RATE LIMIT REACHED</div>
              <p style={{ color: "var(--text-muted)", marginTop: 8 }}>Please wait a moment before trying again.</p>
            </>
          ) : (
            <div style={{ color: "var(--red)", fontFamily: "var(--font-head)" }}>{error}</div>
          )}
        </div>
      ) : (
        <>
          {/* ── Inferred profile banner ── */}
          {inferredDriver && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "3px solid var(--red)", padding: "16px 20px", marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--red)", animation: "pulse-red 1.5s ease infinite" }} />
              <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Based on your activity · Following <span style={{ color: "var(--text)" }}>{activeName}</span>
              </div>
              <button onClick={() => {
                localStorage.removeItem("f1hq_myf1_manual");
                setManualDriver("");
                const b = loadBehaviour();
                delete b.driver;
                saveBehaviour(b);
                window.location.reload();
              }} style={{
                marginLeft: "auto", background: "none", border: "1px solid var(--border)",
                color: "var(--text-muted)", fontFamily: "var(--font-head)", fontSize: 10,
                fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                padding: "5px 12px", cursor: "pointer",
              }}>
                RESET
              </button>
            </div>
          )}

          {/* ── Driver stats ── */}
          {driverStanding ? (
            <>
              <div className="section-label">Your Driver · {activeName}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, marginBottom: 32 }}>
                <StatBox label="Championship" value={`P${driverStanding.position}`} sub="Current standing" color="var(--red)" />
                <StatBox label="Points" value={driverStanding.points} sub={`${season} Season`} />
                <StatBox label="Wins" value={driverStanding.wins} sub="This season" color="var(--gold)" />
                <StatBox label="Team" value={driverStanding.Constructors?.[0]?.name?.replace("F1 Team","").replace("Racing","").trim() || "—"} sub="Constructor" color={teamColor(driverStanding.Constructors?.[0]?.name || "")} />
              </div>
            </>
          ) : (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "24px", marginBottom: 32, color: "var(--text-muted)", fontFamily: "var(--font-head)", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 13 }}>
              No standings data found for {activeName}. They may not have scored points yet this season.
            </div>
          )}

          {/* ── Team standing ── */}
          {teamStanding && (
            <>
              <div className="section-label">Your Team · {teamStanding.Constructor.name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, marginBottom: 32 }}>
                <StatBox label="Constructor Champ." value={`P${teamStanding.position}`} sub="Current standing" color={teamColor(teamStanding.Constructor.name)} />
                <StatBox label="Team Points" value={teamStanding.points} sub={`${season} Season`} />
                <StatBox label="Team Wins" value={teamStanding.wins} sub="This season" color="var(--gold)" />
              </div>
            </>
          )}

          {/* ── Last 8 results ── */}
          {driverResults.length > 0 && (
            <>
              <div className="section-label">Recent Results · {activeName}</div>
              <div style={{ border: "1px solid var(--border)", borderTop: "3px solid var(--red)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 40px 48px 50px", padding: "8px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-card2)" }}>
                  {["RD", "RACE", "GRD", "POS", "PTS"].map(h => (
                    <div key={h} style={{ fontFamily: "var(--font-head)", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "var(--text-muted)" }}>{h}</div>
                  ))}
                </div>
                {driverResults.map((r, i) => {
                  const isDNF = r.status !== "Finished" && !r.status.startsWith("+");
                  const posNum = parseInt(r.position);
                  const posColor = posNum <= 3 ? "var(--gold)" : posNum <= 10 ? "var(--text)" : "var(--text-muted)";
                  return (
                    <div key={i} style={{
                      display: "grid", gridTemplateColumns: "32px 1fr 40px 48px 50px",
                      padding: "12px 16px", borderBottom: "1px solid var(--border)",
                      alignItems: "center", opacity: isDNF ? 0.5 : 1,
                      position: "relative"
                    }}>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 800, color: "var(--text-muted)" }}>{r.round}</div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 800, textTransform: "uppercase" }}>{r.race.replace(" Grand Prix", "").replace(" City", "")}</span>
                          {r.type === "Sprint" && <span style={{ fontFamily: "var(--font-head)", fontSize: 8, fontWeight: 900, background: "var(--gold)", color: "#000", padding: "1px 4px", borderRadius: 2 }}>SPRINT</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                      </div>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 13, color: "var(--text-muted)" }}>P{r.grid}</div>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 900, color: isDNF ? "var(--red)" : posColor }}>
                        {isDNF ? "DNF" : `P${r.position}`}
                      </div>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800 }}>{r.points}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Your activity insights ── */}
          <div style={{ marginTop: 40 }}>
            <div className="section-label">Your Season Activity</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              <StatBox label="Events Tracked" value={totalEvents} sub="App interactions" />
              {inferredCircuit && <StatBox label="Fav Circuit" value={inferredCircuit.replace(" Grand Prix", "")} sub="Most visited" color="#FF8000" />}
              <StatBox label="Driver" value={activeDriver || "—"} sub={activeName || "Not set"} color="var(--red)" />
            </div>
          </div>

          {/* Change driver */}
          <div style={{ marginTop: 32 }}>
            <div className="section-label">Change Driver</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 2 }}>
              {DRIVER_LIST.map(([code, name]) => (
                <button key={code} onClick={() => {
                  localStorage.setItem("f1hq_myf1_manual", code);
                  setManualDriver(code);
                  const b = loadBehaviour();
                  if (!b.driver) b.driver = {};
                  b.driver[code] = (b.driver[code] || 0) + 5;
                  saveBehaviour(b);
                  window.location.reload();
                }} style={{
                  background: code === activeDriver ? "rgba(225,6,0,0.1)" : "var(--bg-card)",
                  border: `1px solid ${code === activeDriver ? "rgba(225,6,0,0.4)" : "var(--border)"}`,
                  padding: "10px 12px", cursor: "pointer", textAlign: "left",
                  fontFamily: "var(--font-head)", transition: "all 0.15s",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 900, textTransform: "uppercase", color: code === activeDriver ? "var(--red)" : "var(--text-muted)" }}>{code}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{name.split(" ").pop()}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes pulse-red { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(225,6,0,0.6)} 50%{opacity:.5;box-shadow:0 0 0 4px rgba(225,6,0,0)} }`}</style>
    </div>
  );
}

export default MyF1;