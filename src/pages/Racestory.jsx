import { useEffect, useState } from "react";

async function fetchJSON(url, ms = 8000) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
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

const TEAM_COLORS = {
  McLaren: "#FF8000", Ferrari: "#E8002D", "Red Bull": "#3671C6",
  Mercedes: "#27F4D2", "Aston Martin": "#358C75", Alpine: "#FF87BC",
  Williams: "#64C4FF", "RB F1 Team": "#6692FF", "Racing Bulls": "#6692FF",
  Haas: "#B6BABD", "Kick Sauber": "#52E252", Sauber: "#52E252",
  Cadillac: "#FFFFFF",
};
function teamColor(name = "") {
  for (const [k, v] of Object.entries(TEAM_COLORS)) {
    if (name.includes(k)) return v;
  }
  return "#666";
}

function copyToNotes(text) {
  window.dispatchEvent(new CustomEvent("f1:copy-to-notes", { detail: { text } }));
}

function buildNarrative(race, results, pits, quali, sprint, driverStandings) {
  if (!race) return null;
  const lines = [];
  const yr = race.season;
  const circuit = race.Circuit?.circuitName || "this historic track";
  const locality = race.Circuit?.Location?.locality || "the region";

  // 1. Championship Context (Pre-race/Weekend Opener)
  const intro = `The ${yr} Formula 1 season headed to ${locality} for the ${race.raceName}. `;
  if (driverStandings?.length > 0 && race.round > 1) {
    const leader = driverStandings[0];
    const second = driverStandings[1];
    lines.push(intro + `Teams arrived at ${circuit} with ${leader.Driver.familyName} leading the championship by ${parseInt(leader.points) - parseInt(second.points)} points over ${second.Driver.familyName}.`);
  } else {
    lines.push(intro + `As the ${race.round === "1" ? "season opener" : "weekend began"}, the paddock was filled with anticipation for the battles ahead at ${circuit}.`);
  }

  // 2. Qualifying Story
  if (quali?.length) {
    const pole = quali[0];
    const p2 = quali[1];
    lines.push(`Qualifying delivered a thrilling session where ${pole.Driver.givenName} ${pole.Driver.familyName} secured pole position for ${pole.Constructor.name}${p2 ? `, narrowly beating ${p2.Driver.familyName}` : ""}. Their lap of ${pole.Q3 || pole.Q2 || pole.Q1 || "—"} set the standard for the field.`);
  } else {
    lines.push("The initial practice sessions saw teams focused on long-run pace and tire degradation, critical factors for success at this venue.");
  }

  // 3. Sprint Story (optional weekend feature)
  if (sprint?.length) {
    const sWinner = sprint[0];
    lines.push(`The Sprint session added another layer of complexity to the weekend. ${sWinner.Driver.givenName} ${sWinner.Driver.familyName} showed superb race craft to take the sprint win, earning 8 valuable points and further building their momentum.`);
  }

  // 4. Main Race Narrative
  if (results?.length) {
    const winner = results[0];
    const podium = results.slice(0, 3);
    const dnfs = results.filter(r => r.status !== "Finished" && !r.status.startsWith("+"));
    const fastest = results.find(r => r.FastestLap?.rank === "1");

    const pitMap = {};
    (pits || []).forEach(p => {
      if (!pitMap[p.driverId]) pitMap[p.driverId] = [];
      pitMap[p.driverId].push(p);
    });

    const winnerPits = pitMap[winner.Driver.driverId] || [];
    const strategy = winnerPits.length === 0 ? "no-stop" : winnerPits.length === 1 ? "one-stop" : `${winnerPits.length}-stop`;

    lines.push(`On Sunday, the Grand Prix unfolded with ${winner.Driver.familyName} starting strong and never looking back. They executed a clinical ${strategy} strategy to secure a dominant victory for ${winner.Constructor.name}.`);

    if (podium.length >= 3) {
      lines.push(`The podium was completed by ${podium[1].Driver.familyName} and ${podium[2].Driver.familyName}, who survived a race of attrition and tactical gambles to bring home a trophy.`);
    }

    if (fastest) {
      lines.push(`The technical nature of the track was highlighted by ${fastest.Driver.familyName}, who pushed to the limit to set the fastest lap (${fastest.FastestLap.Time?.time || "—"}).`);
    }

    if (dnfs.length > 0) {
      const dnfCount = dnfs.length;
      lines.push(`It was a difficult day for some, with ${dnfCount} driver${dnfCount > 1 ? "s" : ""} failing to see the checkered flag. Notable retirements included ${dnfs.slice(0, 2).map(r => r.Driver.familyName).join(" and ")}.`);
    }

    lines.push(`As the dust settles at ${circuit}, ${winner.Driver.familyName} leaves as the big winner. The championship battle now intensifies as the teams prepare for the next round.`);
  } else {
    lines.push(`With the main Grand Prix still on the horizon, the pressure is on the engineers and drivers to finalize their race strategies. The outcome remains uncertain, promising a dramatic conclusion to the ${race.raceName}.`);
  }

  return lines;
}

// ── Qualifying tab ────────────────────────────────────────────────────────────
function QualifyingPanel({ quali, sprint }) {
  const [view, setView] = useState("quali");

  // Reset to "quali" whenever the race changes (sprint may not exist for new race)
  useEffect(() => {
    setTimeout(() => setView("quali"), 0);
  }, [quali, sprint]);

  // Resolve active data — if view is "sprint" but sprint is empty/null, fall back to quali
  const data = (view === "sprint" && sprint?.length) ? sprint : (quali?.length ? quali : null);

  if (!quali?.length && !sprint?.length) {
    return (
      <div style={{ padding: "24px 28px", color: "var(--text-muted)", fontFamily: "var(--font-head)",
        fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        No qualifying data available for this race.
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {quali?.length > 0 && (
          <button onClick={() => setView("quali")} style={{
            fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            padding: "6px 16px", cursor: "pointer",
            border: `1px solid ${view === "quali" ? "var(--red)" : "var(--border)"}`,
            background: view === "quali" ? "rgba(225,6,0,0.1)" : "transparent",
            color: view === "quali" ? "var(--red)" : "var(--text-muted)",
          }}>Qualifying</button>
        )}
        {sprint?.length > 0 && (
          <button onClick={() => setView("sprint")} style={{
            fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            padding: "6px 16px", cursor: "pointer",
            border: `1px solid ${view === "sprint" ? "#FFD700" : "var(--border)"}`,
            background: view === "sprint" ? "rgba(255,215,0,0.08)" : "transparent",
            color: view === "sprint" ? "#FFD700" : "var(--text-muted)",
          }}>Sprint</button>
        )}
      </div>

      {/* Grid visual — staggered left/right like real F1 grid */}
      <div className="section-label" style={{ marginBottom: 12 }}>
        {view === "sprint" ? "Sprint Grid" : "Starting Grid"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {Array.from({ length: Math.ceil((data?.length || 0) / 2) }, (_, rowIdx) => {
          const left  = data[rowIdx * 2];
          const right = data[rowIdx * 2 + 1];
          return (
            <div key={rowIdx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              {[left, right].map((r, side) => {
                if (!r) return <div key={side} />;
                const pos = parseInt(r.position);
                const col = teamColor(r.Constructor?.name || "");
                const isPole = pos === 1;
                const bestTime = r.Q3 || r.Q2 || r.Q1 || r.Time?.time || "—";
                return (
                  <div key={side} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", background: "var(--bg-card)",
                    border: `1px solid ${isPole ? col + "44" : "var(--border)"}`,
                    borderLeft: side === 0 ? `3px solid ${col}` : "1px solid var(--border)",
                    borderRight: side === 1 ? `3px solid ${col}` : "1px solid var(--border)",
                  }}>
                    <span style={{
                      fontFamily: "var(--font-head)", fontSize: isPole ? 20 : 14,
                      fontWeight: 900, color: isPole ? col : "var(--text-muted)", minWidth: 28,
                    }}>
                      {pos}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 800,
                        textTransform: "uppercase", color: "var(--text)" }}>
                        {r.Driver?.code || r.Driver?.familyName}
                      </div>
                      <div style={{ fontSize: 10, color: col, marginTop: 2,
                        fontFamily: "var(--font-head)", letterSpacing: "0.06em" }}>
                        {r.Constructor?.name?.replace("F1 Team", "").replace("Racing", "").trim()}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700,
                        color: isPole ? col : "var(--text-muted)" }}>
                        {bestTime}
                      </div>
                      {r.Q3 && <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>Q3</div>}
                      {!r.Q3 && r.Q2 && <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>Q2</div>}
                      {!r.Q3 && !r.Q2 && r.Q1 && <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>Q1</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Constructor standings panel ───────────────────────────────────────────────
function ConstructorPanel({ constructors }) {
  if (!constructors?.length) {
    return (
      <div style={{ padding: "24px 28px", color: "var(--text-muted)", fontFamily: "var(--font-head)",
        fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        No constructor data available.
      </div>
    );
  }
  const leader = parseFloat(constructors[0]?.points || 1);
  return (
    <div style={{ padding: "24px 28px" }}>
      <div className="section-label" style={{ marginBottom: 16 }}>Constructor Standings</div>
      {constructors.map((c, i) => {
        const col = teamColor(c.Constructor?.name || "");
        const pct = Math.min(100, (parseFloat(c.points) / leader) * 100);
        const isTop3 = i < 3;
        return (
          <div key={c.Constructor.constructorId} style={{ marginBottom: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 16px", background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderLeft: `3px solid ${col}`,
            }}>
              <span style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 900,
                color: isTop3 ? col : "var(--text-muted)", minWidth: 28 }}>
                {c.position}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 800,
                  textTransform: "uppercase", color: "var(--text)" }}>
                  {c.Constructor.name}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                  {c.Constructor.nationality}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 900,
                  color: isTop3 ? col : "var(--text)" }}>
                  {c.points}
                </div>
                <div style={{ fontSize: 10, color: "var(--gold)", fontFamily: "var(--font-head)" }}>
                  {parseInt(c.wins) > 0 ? `${c.wins}W` : ""}
                </div>
              </div>
            </div>
            {/* Points bar */}
            <div style={{ height: 3, background: "var(--border)", marginTop: 1 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: col,
                boxShadow: `0 0 6px ${col}55`, transition: "width 0.6s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function RaceStory() {
  const [races,         setRaces]         = useState([]);
  const [selected,      setSelected]      = useState(null);
  const [results,       setResults]       = useState(null);
  const [pits,          setPits]          = useState(null);
  const [quali,         setQuali]         = useState(null);
  const [sprintResults, setSprintResults] = useState(null);
  const [constructors,  setConstructors]  = useState(null);
  const [driverStandings, setDriverStandings] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [loadingRace,   setLoadingRace]   = useState(false);
  const [season,        setSeason]        = useState("");
  const [copied,        setCopied]        = useState(false);
  const [activeTab,     setActiveTab]     = useState("story"); // story | quali | constructors

  // Load full season schedule to discover all races (even those without results yet)
  useEffect(() => {
    fetchJSON("https://api.jolpi.ca/ergast/f1/current.json")
      .then(d => {
        const list = d.MRData?.RaceTable?.Races || [];
        if (list.length) {
          setSeason(list[0].season);
          // Only show races that have happened (date <= now)
          const nowMs = Date.now();
          const filtered = list.filter(r => new Date(r.date + "T23:59:59Z").getTime() <= nowMs + (2 * 86400000));
          const reversed = [...filtered].reverse();
          setRaces(reversed);
          setSelected(reversed[0]); // Default to the most recent (last happened)
        }
      })
      .catch(e => {
        if (e.message === "RATE_LIMITED") setError("API rate limit reached. Retrying in 30s...");
        else setError("Failed to load races.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Load selected race data
  useEffect(() => {
    if (!selected) return;
    setTimeout(() => {
      setLoadingRace(true);
      setResults(null);
      setPits(null);
      setQuali(null);
      setSprintResults(null);
    }, 0);

    const yr = selected.season;
    const rd = selected.round;

    Promise.allSettled([
      fetchJSON(`https://api.jolpi.ca/ergast/f1/${yr}/${rd}/results.json`),
      fetchJSON(`https://api.jolpi.ca/ergast/f1/${yr}/${rd}/pitstops.json`),
      fetchJSON(`https://api.jolpi.ca/ergast/f1/${yr}/${rd}/qualifying.json`),
      fetchJSON(`https://api.jolpi.ca/ergast/f1/${yr}/${rd}/sprint.json`),
    ]).then(([rRes, pRes, qRes, sRes]) => {
      if (rRes.status === "fulfilled") {
        setResults(rRes.value.MRData?.RaceTable?.Races?.[0]?.Results || []);
      }
      if (pRes.status === "fulfilled") {
        setPits(pRes.value.MRData?.RaceTable?.Races?.[0]?.PitStops || []);
      }
      if (qRes.status === "fulfilled") {
        setQuali(qRes.value.MRData?.RaceTable?.Races?.[0]?.QualifyingResults || []);
      }
      if (sRes.status === "fulfilled") {
        setSprintResults(sRes.value.MRData?.RaceTable?.Races?.[0]?.SprintResults || []);
      }
    }).catch(e => {
      console.error("Race data fetch error:", e);
    }).finally(() => setLoadingRace(false));
  }, [selected]);

  // Load current standings (always fresh)
  useEffect(() => {
    Promise.allSettled([
      fetchJSON("https://api.jolpi.ca/ergast/f1/current/constructorstandings.json"),
      fetchJSON("https://api.jolpi.ca/ergast/f1/current/driverstandings.json"),
    ]).then(([cRes, dRes]) => {
      if (cRes.status === "fulfilled") {
        setConstructors(cRes.value.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || []);
      }
      if (dRes.status === "fulfilled") {
        setDriverStandings(dRes.value.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || []);
      }
    }).catch(() => {});
  }, []);

  const narrative = buildNarrative(selected, results, pits, quali, sprintResults, driverStandings);

  function handleCopy() {
    if (!narrative || !selected) return;
    const text = `${selected.raceName} — Race Story\n\n${narrative.join("\n\n")}\n\nRound ${selected.round} · ${selected.season} Season`;
    copyToNotes(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tabs = [
    { id: "story",        label: "Race Story" },
    { id: "quali",        label: "Qualifying" },
    { id: "constructors", label: "Constructors" },
  ];

  return (
    <div className="container">
      <div className="page-subtitle">{season} Season</div>
      <h1 className="page-title">Race <span>Story</span></h1>

      {loading ? (
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-head)",
          letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 32 }}>
          Loading races...
        </p>
      ) : races.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-head)",
          letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 32 }}>
          No completed races yet this season.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 2,
          marginTop: 32, alignItems: "start" }} className="race-story-grid">

          {/* Race selector */}
          <div style={{ border: "1px solid var(--border)", borderTop: "3px solid var(--red)",
            background: "var(--bg-card)" }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)",
              padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
              Select Race
            </div>
            {races.map(r => {
              const isActive = selected?.round === r.round;
              return (
                <button key={r.round} onClick={() => { setSelected(r); setActiveTab("story"); }}
                  style={{
                    width: "100%", textAlign: "left",
                    background: isActive ? "rgba(225,6,0,0.08)" : "transparent",
                    border: "none", borderBottom: "1px solid var(--border)",
                    borderLeft: isActive ? "3px solid var(--red)" : "3px solid transparent",
                    padding: "12px 16px", cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.12em", color: isActive ? "var(--red)" : "var(--text-muted)",
                    marginBottom: 4 }}>
                    ROUND {r.round}
                  </div>
                  <div style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 800,
                    textTransform: "uppercase", color: isActive ? "var(--text)" : "var(--text-muted)",
                    lineHeight: 1.2 }}>
                    {r.raceName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    {new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Story panel */}
          <div>
            {loadingRace ? (
              <div style={{ padding: "48px 32px", color: "var(--text-muted)",
                fontFamily: "var(--font-head)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Loading race data...
              </div>
            ) : selected ? (
              <div style={{ border: "1px solid var(--border)", borderTop: "3px solid var(--red)" }}>

                {/* Race header */}
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)",
                  background: "var(--bg-card)" }}>
                  <div style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.2em", color: "var(--red)", marginBottom: 6 }}>
                    ROUND {selected.round} · {new Date(selected.date).toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </div>
                  <div style={{ fontFamily: "var(--font-head)", fontSize: "clamp(22px, 3vw, 32px)",
                    fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                    {selected.raceName}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                    {selected.Circuit?.circuitName} · {selected.Circuit?.Location?.locality},{" "}
                    {selected.Circuit?.Location?.country}
                  </div>
                  <button onClick={handleCopy} style={{
                    marginTop: 16,
                    background: copied ? "rgba(57,181,74,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${copied ? "rgba(57,181,74,0.4)" : "rgba(255,255,255,0.08)"}`,
                    color: copied ? "#39B54A" : "var(--text-muted)",
                    fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    padding: "7px 16px", cursor: "pointer", transition: "all 0.2s",
                  }}>
                    {copied ? "✓ SAVED TO NOTES" : "+ SAVE TO NOTES"}
                  </button>
                </div>

                {/* Tab bar */}
                <div style={{ display: "flex", borderBottom: "1px solid var(--border)",
                  background: "var(--bg-card)" }}>
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                      fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700,
                      letterSpacing: "0.14em", textTransform: "uppercase",
                      padding: "12px 20px", border: "none", cursor: "pointer",
                      background: "transparent",
                      color: activeTab === t.id ? "var(--red)" : "var(--text-muted)",
                      borderBottom: `2px solid ${activeTab === t.id ? "var(--red)" : "transparent"}`,
                      transition: "all 0.15s",
                    }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* STORY TAB */}
                {activeTab === "story" && (
                  <>
                    {/* Narrative Story */}
                    {narrative ? (
                      <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)" }}>
                        {/* Pending Alert inside story if no results yet */}
                        {!results?.length && (
                          <div style={{ padding: "16px 20px", background: "rgba(225,6,0,0.05)",
                            borderLeft: "4px solid var(--red)", marginBottom: 24 }}>
                            <div style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 900,
                              letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--red)", marginBottom: 4 }}>
                              Race In Progress / Results Pending
                            </div>
                            <p style={{ fontSize: 13, color: "var(--text-mid)", margin: 0 }}>
                              The full Grand Prix story is still being written. Below is the summary of the weekend so far.
                            </p>
                          </div>
                        )}

                        <div className="section-label" style={{ marginBottom: 16 }}>Weekend Story</div>
                        {narrative.map((line, i) => (
                          <p key={i} style={{ fontSize: 15, lineHeight: 1.75,
                            color: "var(--text-mid)", marginBottom: 12,
                            fontFamily: "var(--font-body)" }}>
                            {line}
                          </p>
                        ))}

                        {/* Scannable Highlights */}
                        {(quali?.length > 0 || results?.length > 0) && (
                          <div style={{ marginTop: 32, padding: "20px 24px", background: "var(--bg-card)",
                            border: "1px solid var(--border)", borderRadius: 4 }}>
                            <div style={{ fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 900,
                              letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)", marginBottom: 16 }}>
                              Weekend Highlights
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                              {quali?.[0] && (
                                <div>
                                  <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Pole Position</div>
                                  <div style={{ fontSize: 14, fontWeight: 800 }}>{quali[0].Driver.familyName}</div>
                                </div>
                              )}
                              {sprintResults?.[0] && (
                                <div>
                                  <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Sprint Winner</div>
                                  <div style={{ fontSize: 14, fontWeight: 800 }}>{sprintResults[0].Driver.familyName}</div>
                                </div>
                              )}
                              {results?.[0] && (
                                <div>
                                  <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>GP Winner</div>
                                  <div style={{ fontSize: 14, fontWeight: 800 }}>{results[0].Driver.familyName}</div>
                                </div>
                              )}
                              {results?.length > 0 && results.find(r => r.FastestLap?.rank === "1") && (
                                <div>
                                  <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Fastest Lap</div>
                                  <div style={{ fontSize: 14, fontWeight: 800 }}>{results.find(r => r.FastestLap?.rank === "1").Driver.familyName}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: "24px 28px", color: "var(--text-muted)",
                        fontFamily: "var(--font-head)", letterSpacing: "0.1em",
                        textTransform: "uppercase", fontSize: 12 }}>
                        No weekend story available for this round.
                      </div>
                    )}

                    {/* Podium */}
                    {results?.length >= 3 && (
                      <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)" }}>
                        <div className="section-label">Podium</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                          {results.slice(0, 3).map((r, i) => {
                            const col = teamColor(r.Constructor.name);
                            return (
                              <div key={r.Driver.driverId} style={{
                                background: "var(--bg-card)", border: "1px solid var(--border)",
                                borderTop: `3px solid ${i === 0 ? "var(--gold)" : col}`,
                                padding: "18px 16px", textAlign: "center",
                              }}>
                                <div style={{ fontFamily: "var(--font-head)", fontSize: 32,
                                  fontWeight: 900, color: i === 0 ? "var(--gold)" : "var(--text-muted)" }}>
                                  P{i + 1}
                                </div>
                                <div style={{ fontFamily: "var(--font-head)", fontSize: 16,
                                  fontWeight: 800, textTransform: "uppercase", marginTop: 6 }}>
                                  {r.Driver.familyName}
                                </div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4,
                                  fontFamily: "var(--font-head)", letterSpacing: "0.06em" }}>
                                  {r.Constructor.name}
                                </div>
                                <div style={{ fontSize: 12, color: i === 0 ? "var(--gold)" : "var(--text-muted)",
                                  marginTop: 8, fontFamily: "var(--font-head)", fontWeight: 700 }}>
                                  {r.Time?.time || r.status} · {r.points} PTS
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Full classification */}
                    {results?.length > 0 && (
                      <div style={{ padding: "24px 28px" }}>
                        <div className="section-label">Full Classification</div>
                        <div style={{ border: "1px solid var(--border)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 60px 50px",
                            padding: "8px 16px", borderBottom: "1px solid var(--border)",
                            background: "var(--bg-card)" }}>
                            {["POS", "DRIVER", "TEAM", "TIME", "PTS"].map(h => (
                              <div key={h} style={{ fontFamily: "var(--font-head)", fontSize: 9,
                                fontWeight: 700, letterSpacing: "0.18em", color: "var(--text-muted)" }}>
                                {h}
                              </div>
                            ))}
                          </div>
                          {results.map((r, i) => {
                            const col = teamColor(r.Constructor.name);
                            const isDNF = r.status !== "Finished" && !r.status.startsWith("+");
                            return (
                              <div key={r.Driver.driverId} style={{
                                display: "grid", gridTemplateColumns: "40px 1fr 1fr 60px 50px",
                                padding: "10px 16px", borderBottom: "1px solid var(--border)",
                                opacity: isDNF ? 0.4 : 1, alignItems: "center",
                              }}>
                                <div style={{ fontFamily: "var(--font-head)", fontSize: 16,
                                  fontWeight: 900, color: i < 3 ? "var(--gold)" : "var(--text-muted)" }}>
                                  {r.position}
                                </div>
                                <div style={{ fontFamily: "var(--font-head)", fontSize: 14,
                                  fontWeight: 800, textTransform: "uppercase" }}>
                                  <span style={{ color: "var(--text-muted)", marginRight: 5, fontSize: 12 }}>
                                    {r.Driver.givenName[0]}.
                                  </span>
                                  {r.Driver.familyName}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <div style={{ width: 6, height: 6, borderRadius: "50%",
                                    background: col, flexShrink: 0 }} />
                                  <span style={{ fontFamily: "var(--font-head)", fontSize: 11,
                                    color: "var(--text-muted)", textTransform: "uppercase" }}>
                                    {r.Constructor.name.replace("F1 Team", "").replace("Racing", "").trim()}
                                  </span>
                                </div>
                                <div style={{ fontFamily: "var(--font-head)", fontSize: 12,
                                  color: isDNF ? "var(--red)" : "var(--text-muted)" }}>
                                  {isDNF ? "DNF" : r.Time?.time || r.status}
                                </div>
                                <div style={{ fontFamily: "var(--font-head)", fontSize: 14,
                                  fontWeight: 800 }}>{r.points}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* QUALIFYING TAB */}
                {activeTab === "quali" && (
                  <QualifyingPanel quali={quali} sprint={sprintResults} />
                )}

                {/* CONSTRUCTORS TAB */}
                {activeTab === "constructors" && (
                  <ConstructorPanel constructors={constructors} />
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .race-story-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default RaceStory;