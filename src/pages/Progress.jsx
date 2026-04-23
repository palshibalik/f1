import { useEffect, useState } from "react";
import ProgressBar from "../components/ProgressBar";

async function fetchJSON(url, ms = 8000) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (e) { clearTimeout(tid); throw e; }
}

function Progress() {
  const [race,        setRace]        = useState(null);
  const [totalRounds, setTotalRounds] = useState(null);
  const [season,      setSeason]      = useState("");

  useEffect(() => {
    // Fetch next race for current round + total rounds dynamically
    fetchJSON("https://api.jolpi.ca/ergast/f1/current/next.json")
      .then(d => {
        const r = d?.MRData?.RaceTable?.Races?.[0];
        if (r) { setRace(r); setSeason(r.season); }
      })
      .catch(() => {});

    // Total rounds comes from the season schedule — never hardcoded
    fetchJSON("https://api.jolpi.ca/ergast/f1/current.json?limit=1")
      .then(d => {
        const total = parseInt(d?.MRData?.total, 10);
        if (!isNaN(total) && total > 0) setTotalRounds(total);
      })
      .catch(() => {});
  }, []);

  if (!race) return (
    <div className="container">
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-head)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Loading season data...
      </p>
    </div>
  );

  const currentRound = Number(race.round);
  const total        = totalRounds ?? "—";
  const remaining    = totalRounds ? totalRounds - currentRound : "—";

  return (
    <div className="container">
      <div className="page-subtitle">{season} World Championship</div>
      <h1 className="page-title">Season <span>Progress</span></h1>

      <div style={{ marginTop: "48px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "2px", background: "var(--border)", border: "1px solid var(--border)", marginBottom: "48px" }}>
        {[
          { label: "Current Round",    value: currentRound },
          { label: "Races Remaining",  value: remaining    },
          { label: "Total Rounds",     value: total        },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "var(--bg-card)", padding: "28px 24px" }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: "52px", fontWeight: "900", lineHeight: "1", color: "var(--text)" }}>{value}</div>
            <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: "6px" }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="section-label">Race-by-Race Breakdown</div>
      <ProgressBar round={currentRound} total={totalRounds || 24} />

      <div style={{ marginTop: "48px" }}>
        <div className="section-label">Up Next</div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: "3px solid var(--red)", padding: "20px 24px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--red)", marginBottom: "6px" }}>Round {race.round}</div>
          <div style={{ fontFamily: "var(--font-head)", fontSize: "24px", fontWeight: "800", textTransform: "uppercase" }}>{race.raceName}</div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
            {race.Circuit.Location.locality}, {race.Circuit.Location.country}
            {" · "}
            {new Date(`${race.date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Progress;