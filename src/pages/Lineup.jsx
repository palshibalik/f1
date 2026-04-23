import { useEffect, useState } from "react";

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
  hulkenberg:     "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/hulkenberg.png",
  stroll:         "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/stroll.png",
  bearman:        "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/bearman.png",
  antonelli:      "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/antonelli.png",
  lawson:         "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/lawson.png",
  hadjar:         "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/hadjar.png",
  bortoleto:      "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/bortoleto.png",
  doohan:         "https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/doohan.png",
  colapinto:      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Franco_Colapinto_2024_%28cropped%29.jpg/120px-Franco_Colapinto_2024_%28cropped%29.jpg", // F1 CDN 404
};

const TEAM_COLORS = {
  "McLaren": "#FF8000", "Ferrari": "#E8002D",
  "Red Bull Racing": "#3671C6", "Red Bull": "#3671C6",
  "Mercedes": "#27F4D2", "Aston Martin": "#229971",
  "Alpine F1 Team": "#FF87BC", "Alpine": "#FF87BC",
  "Williams": "#64C4FF",
  "RB F1 Team": "#6692FF", "Racing Bulls": "#6692FF",
  "Haas F1 Team": "#B6BABD", "Haas": "#B6BABD",
  "Kick Sauber": "#52E252", "Sauber": "#52E252",
  "Cadillac": "#FFFFFF",
};

function teamColor(n = "") { return TEAM_COLORS[n] || "#444"; }

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

// ── Grid slot — a single driver box ─────────────────────────────────────────
function GridSlot({ driver, position, isQuali }) {
  const [imgErr, setImgErr] = useState(false);
  if (!driver) return <div style={{ flex: 1 }} />;

  const d      = driver.Driver;
  const team   = driver.Constructors?.[0] || driver.Constructor || {};
  const col    = teamColor(team.name);
  const photo  = DRIVER_IMAGES[d?.driverId];
  const isPole = position === 1;
  const isTop3 = position <= 3;
  const posColors = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
  const posCol = posColors[position] || col;

  const bestTime = driver.Q3 || driver.Q2 || driver.Q1 || driver.Time?.time;
  const qual = driver.Q3 ? "Q3" : driver.Q2 ? "Q2" : driver.Q1 ? "Q1" : null;

  // Shorten lap time for display — strip leading "1:" → just show seconds on mobile
  const shortTime = bestTime
    ? bestTime.replace(/^1:(\d{2}\.\d{3})$/, "$1")
    : null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: isPole ? "12px 8px" : "8px 8px",
      background: isPole
        ? `linear-gradient(135deg, ${col}18 0%, var(--bg-card) 60%)`
        : "var(--bg-card)",
      border: `1px solid ${isPole ? col + "55" : "var(--border)"}`,
      borderTop: `3px solid ${isTop3 ? posCol : col}`,
      flex: 1, minWidth: 0,
      overflow: "hidden",
    }}>
      {/* Position number */}
      <div style={{
        fontFamily: "var(--font-head)",
        fontSize: isPole ? 22 : isTop3 ? 16 : 13,
        fontWeight: 900, color: isTop3 ? posCol : "var(--text-muted)",
        minWidth: isPole ? 30 : 24, lineHeight: 1, flexShrink: 0,
      }}>
        P{position}
      </div>

      {/* Driver photo — hidden on very small screens via inline class */}
      <div className="grid-photo" style={{
        width: isPole ? 44 : 34, height: isPole ? 44 : 34,
        borderRadius: "50%", overflow: "hidden", flexShrink: 0,
        border: `1.5px solid ${col}44`,
        background: `${col}11`,
      }}>
        {photo && !imgErr ? (
          <img src={photo} alt={d?.familyName || ""}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-head)", fontSize: 10,
            fontWeight: 900, color: col }}>
            {d?.code?.slice(0, 2) || "?"}
          </div>
        )}
      </div>

      {/* Driver info */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div style={{
          fontFamily: "var(--font-head)",
          fontSize: isPole ? 14 : 12,
          fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.01em",
          color: "var(--text)", lineHeight: 1,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {d?.code || d?.familyName?.slice(0, 4).toUpperCase()}
        </div>
        <div style={{
          fontSize: 9, color: col, marginTop: 3,
          fontFamily: "var(--font-head)", letterSpacing: "0.04em",
          textTransform: "uppercase", opacity: 0.8,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {team.name?.split(" ")[0] || "—"}
        </div>
      </div>

      {/* Time / car number */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        {isQuali && shortTime ? (
          <>
            <div style={{
              fontFamily: "var(--font-head)", fontSize: isPole ? 11 : 10,
              fontWeight: 700, color: isPole ? col : "var(--text-muted)",
              whiteSpace: "nowrap",
            }}>
              {shortTime}
            </div>
            {qual && (
              <div style={{ fontSize: 8, color: "var(--text-muted)", marginTop: 1,
                fontFamily: "var(--font-head)" }}>
                {qual}
              </div>
            )}
          </>
        ) : (
          <div style={{
            fontFamily: "var(--font-head)", fontSize: isPole ? 14 : 12,
            fontWeight: 900, color: col, opacity: 0.6,
          }}>
            #{d?.permanentNumber || position}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Standings fallback grid (no quali data yet) ───────────────────────────────
function StandingsGrid({ drivers, raceName }) {
  // Pair up drivers: odd positions on left column, even on right (F1 grid stagger)
  const rows = [];
  for (let i = 0; i < drivers.length; i += 2) {
    rows.push([drivers[i], drivers[i + 1]]);
  }

  return (
    <>
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
        borderLeft: "3px solid var(--text-muted)", padding: "10px 18px",
        display: "inline-block", marginBottom: 24 }}>
        <div style={{ fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.18em", textTransform: "uppercase",
          color: "var(--text-muted)", marginBottom: 3 }}>
          Championship Standing · Qualifying Pending
        </div>
        <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 800,
          textTransform: "uppercase", color: "var(--text)" }}>
          {raceName}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="grid-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <GridSlot driver={row[0]} position={rowIdx * 2 + 1} isQuali={false} />
            {row[1]
              ? <GridSlot driver={row[1]} position={rowIdx * 2 + 2} isQuali={false} />
              : <div />
            }
          </div>
        ))}
      </div>
    </>
  );
}

// ── Qualifying grid (actual grid order) ───────────────────────────────────────
function QualiGrid({ results, raceName, isSprint }) {
  // Sort by position ascending
  const sorted = [...results].sort((a, b) => parseInt(a.position) - parseInt(b.position));
  const rows = [];
  for (let i = 0; i < sorted.length; i += 2) {
    rows.push([sorted[i], sorted[i + 1]]);
  }

  return (
    <>
      <div style={{ background: "rgba(225,6,0,0.06)", border: "1px solid rgba(225,6,0,0.2)",
        borderLeft: "3px solid var(--red)", padding: "10px 18px",
        display: "inline-block", marginBottom: 24 }}>
        <div style={{ fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.18em", textTransform: "uppercase",
          color: "var(--red)", marginBottom: 3 }}>
          {isSprint ? "Sprint Grid · Sprint Qualifying" : "Starting Grid · Qualifying Result"}
        </div>
        <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 800,
          textTransform: "uppercase", color: "var(--text)" }}>
          {raceName}
        </div>
      </div>

      {/* Grid layout — on mobile stacks to 1 column, on desktop 2 columns */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="grid-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {/* Left = odd position (P1, P3, P5...) */}
            <GridSlot driver={row[0]} position={rowIdx * 2 + 1} isQuali={true} />
            {/* Right = even position (P2, P4, P6...) */}
            {row[1]
              ? <GridSlot driver={row[1]} position={rowIdx * 2 + 2} isQuali={true} />
              : <div />
            }
          </div>
        ))}
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function LineUp() {
  const [season,        setSeason]        = useState("");
  const [raceName,      setRaceName]      = useState("");
  const [qualiData,     setQualiData]     = useState(null);
  const [standingsGrid, setStandingsGrid] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [isGrid,        setIsGrid]        = useState(false);
  const [isSprint,      setIsSprint]      = useState(false);
  const [lastUpdated,   setLastUpdated]   = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Step 1: Get next race
        let nextRaceData = await fetchJSON("https://api.jolpi.ca/ergast/f1/current/next.json");
        let nextRace = nextRaceData.MRData?.RaceTable?.Races?.[0];

        // If no next race (end of season) fall back to last
        if (!nextRace) {
          const lastData = await fetchJSON("https://api.jolpi.ca/ergast/f1/current/last.json");
          nextRace = lastData.MRData?.RaceTable?.Races?.[0];
        }

        if (!nextRace) {
          setError("No upcoming race data.");
          setLoading(false);
          return;
        }

        setSeason(nextRace.season);
        setRaceName(nextRace.raceName);

        const yr = nextRace.season;
        const rd = nextRace.round;

        // Step 2: Try qualifying for this round
        const [qRes, sRes] = await Promise.allSettled([
          fetchJSON(`https://api.jolpi.ca/ergast/f1/${yr}/${rd}/qualifying.json`),
          fetchJSON(`https://api.jolpi.ca/ergast/f1/${yr}/${rd}/sprint.json`),
        ]);

        const quali  = qRes.status === "fulfilled"
          ? qRes.value.MRData?.RaceTable?.Races?.[0]?.QualifyingResults || []
          : [];
        const sprint = sRes.status === "fulfilled"
          ? sRes.value.MRData?.RaceTable?.Races?.[0]?.SprintResults || []
          : [];

        if (quali.length > 0) {
          setQualiData(quali);
          setIsGrid(true);
          setIsSprint(false);
          setLastUpdated(new Date());
          setLoading(false);
          return;
        }

        if (sprint.length > 0) {
          setQualiData(sprint);
          setIsGrid(true);
          setIsSprint(true);
          setLastUpdated(new Date());
          setLoading(false);
          return;
        }

        // Step 3: Fall back to driver championship standings
        const [dRes] = await Promise.allSettled([
          fetchJSON("https://api.jolpi.ca/ergast/f1/current/driverstandings.json"),
        ]);

        const drivers = dRes.status === "fulfilled"
          ? dRes.value.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || []
          : [];

        if (drivers.length > 0) {
          const season2 = dRes.value.MRData?.StandingsTable?.StandingsLists?.[0]?.season;
          if (season2) setSeason(season2);
        }

        setStandingsGrid(drivers);
        setIsGrid(false);
        setLastUpdated(new Date());
      } catch (e) {
        if (e.message === "RATE_LIMITED") setError("API Rate Limit reached. Please wait...");
        else setError("Failed to load lineup data.");
      } finally {
        setLoading(false);
      }
    }

    load();

    // Auto-refresh every 5 minutes (qualifying data can come in any time)
    const timer = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container">
      <div className="page-subtitle">{season} World Championship</div>
      <h1 className="page-title">
        {isGrid ? "Starting " : "Team "}<span>Line-Up</span>
      </h1>

      {lastUpdated && (
        <div style={{ fontFamily: "var(--font-head)", fontSize: 10, color: "var(--text-muted)",
          letterSpacing: "0.1em", marginBottom: 24, marginTop: -8 }}>
          Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · auto-refreshes every 5 min
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-head)",
          letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 32 }}>
          Loading grid...
        </p>
      ) : error ? (
        <p style={{ color: "var(--red)", fontFamily: "var(--font-head)",
          letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 32 }}>
          {error}
        </p>
      ) : isGrid && qualiData ? (
        <QualiGrid results={qualiData} raceName={raceName} isSprint={isSprint} />
      ) : (
        <StandingsGrid drivers={standingsGrid} raceName={raceName} />
      )}

      <style>{`
        /* Mobile: single column grid, hide photos to save space */
        @media (max-width: 500px) {
          .grid-row {
            grid-template-columns: 1fr !important;
          }
          .grid-photo {
            display: none !important;
          }
        }
        /* Tablet: keep 2 columns but hide photos */
        @media (min-width: 501px) and (max-width: 700px) {
          .grid-photo {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default LineUp;