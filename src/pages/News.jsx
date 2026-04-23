import { useEffect, useState, useCallback } from "react";

// rss2json.com converts RSS feeds to JSON server-side — completely eliminates
// all CORS proxy issues. No SSL cert problems, no ERR_CERT_AUTHORITY_INVALID,
// no ERR_NAME_NOT_RESOLVED. Free tier: 10,000 req/day, no auth needed.
const RSS2JSON = "https://api.rss2json.com/v1/api.json";

const RSS_FEEDS = [
  { name: "Autosport",  url: "https://www.autosport.com/rss/f1/news/" },
  { name: "RaceFans",   url: "https://www.racefans.net/feed/" },
  { name: "The Race",   url: "https://www.the-race.com/feed/" },
];

async function fetchFeedJSON(feedUrl) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(
      `${RSS2JSON}?rss_url=${encodeURIComponent(feedUrl)}&count=10`,
      { signal: ctrl.signal }
    );
    clearTimeout(tid);
    if (!res.ok) return null;
    const data = await res.json();
    return data.status === "ok" && data.items?.length ? data.items : null;
  } catch {
    clearTimeout(tid);
    return null;
  }
}

function parseItems(items, source) {
  if (!items) return [];
  return items
    .map(item => ({
      title: (item.title || "").replace(/<[^>]*>/g, "").trim(),
      link:  item.link || item.guid || "",
      date:  item.pubDate || "",
      desc:  (item.description || item.content || "")
               .replace(/<[^>]*>/g, "")
               .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
               .replace(/&nbsp;/g, " ").replace(/&#\d+;/g, "").trim().slice(0, 200),
      source,
    }))
    .filter(i => i.title.length > 3);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff) || diff < 0) return "";
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return "Just now";
}

function copyToNotes(text) {
  window.dispatchEvent(new CustomEvent("f1:copy-to-notes", { detail: { text } }));
}

// ── Latest race result ────────────────────────────────────────────────────────
function LatestResult() {
  const [race,    setRace]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    async function fetchLatest() {
      try {
        // 1. Get schedule to find the latest "passed" race
        const schedRes = await fetch("https://api.jolpi.ca/ergast/f1/current.json");
        const schedData = await schedRes.json();
        const races = schedData.MRData.RaceTable.Races || [];
        const now = Date.now();
        // Constant buffer to ensure we catch races that just finished
        const passed = races.filter(r => new Date(r.date + "T23:59:59Z").getTime() <= now + (2 * 86400000));
        const latest = passed[passed.length - 1];
        if (!latest) return;

        // 2. Try fetching Race Results, then Sprint, then Quali
        const [rRes, sRes, qRes] = await Promise.allSettled([
          fetch(`https://api.jolpi.ca/ergast/f1/${latest.season}/${latest.round}/results.json`).then(r => r.json()),
          fetch(`https://api.jolpi.ca/ergast/f1/${latest.season}/${latest.round}/sprint.json`).then(r => r.json()),
          fetch(`https://api.jolpi.ca/ergast/f1/${latest.season}/${latest.round}/qualifying.json`).then(r => r.json()),
        ]);

        const raceResults = rRes.status === "fulfilled" ? rRes.value.MRData?.RaceTable?.Races?.[0] : null;
        const sprintResults = sRes.status === "fulfilled" ? sRes.value.MRData?.RaceTable?.Races?.[0] : null;
        const qualiResults = qRes.status === "fulfilled" ? qRes.value.MRData?.RaceTable?.Races?.[0] : null;

        if (raceResults?.Results?.length) {
          setRace({ ...raceResults, type: "Race" });
        } else if (sprintResults?.SprintResults?.length) {
          setRace({ ...sprintResults, Results: sprintResults.SprintResults, type: "Sprint" });
        } else if (qualiResults?.QualifyingResults?.length) {
          setRace({ ...qualiResults, Results: qualiResults.QualifyingResults, type: "Qualifying" });
        } else {
          // Fallback to previous race if this one has absolutely no results yet
          const prev = passed[passed.length - 2];
          if (prev) {
            const pRes = await fetch(`https://api.jolpi.ca/ergast/f1/${prev.season}/${prev.round}/results.json`);
            const pData = await pRes.json();
            if (pData.MRData?.RaceTable?.Races?.[0]) {
              setRace({ ...pData.MRData.RaceTable.Races[0], type: "Race" });
            }
          }
        }
      } catch (e) {
        if (e.message === "RATE_LIMITED") setError("RATE_LIMITED");
        else setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchLatest();
  }, []);

  if (loading) return (
    <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-head)",
      fontSize: 12, letterSpacing: "0.1em", padding: "16px 0" }}>
      Loading latest result...
    </p>
  );
  if (error || !race) return (
    <p style={{ color: "var(--red)", fontFamily: "var(--font-head)",
      fontSize: 12, letterSpacing: "0.1em", padding: "16px 0" }}>
      {error === "RATE_LIMITED" ? "API Rate Limit. Retrying soon..." : "No recent result data available."}
    </p>
  );

  const top5 = race.Results?.slice(0, 5) || [];
  const posColors = ["var(--gold)", "#C0C0C0", "#CD7F32", "var(--text-muted)", "var(--text-muted)"];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{
          fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 900,
          background: race.type === "Qualifying" ? "var(--red)" : "var(--gold)",
          color: "#fff", padding: "2px 8px", borderRadius: 2, letterSpacing: "0.1em"
        }}>
          LATEST {race.type?.toUpperCase()}
        </span>
        <div style={{ fontFamily: "var(--font-head)", fontSize: 12,
          color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          {race.raceName} · {race.Circuit?.Location?.locality} ·{" "}
          {new Date(race.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {top5.map((r, i) => (
          <div key={r.Driver.driverId} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "10px 16px", background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderLeft: `3px solid ${i === 0 ? "var(--gold)" : "var(--border)"}`,
          }}>
            <span style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 900,
              color: posColors[i], minWidth: 28 }}>
              {r.position}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 800,
                textTransform: "uppercase" }}>
                <span style={{ color: "var(--text-muted)", marginRight: 6, fontSize: 12 }}>
                  {r.Driver.givenName}
                </span>
                {r.Driver.familyName}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {r.Constructor.name}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 800 }}>
                {r.Time?.time || r.status}
              </div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 11,
                color: "var(--gold)", fontWeight: 700 }}>
                {r.points > 0 ? `+${r.points} PTS` : (r.Q3 || r.Q2 || r.Q1 || "")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── News card ─────────────────────────────────────────────────────────────────
function NewsCard({ item, onCopy }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e) {
    e.preventDefault();
    e.stopPropagation();
    const text = `${item.title}\n${item.desc ? item.desc + "\n" : ""}Source: ${item.source} · ${item.link}`;
    onCopy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      padding: "20px 24px", transition: "border-color 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(225,6,0,0.3)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{
          fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 800,
          letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--red)",
          background: "rgba(225,6,0,0.08)", padding: "2px 8px",
        }}>
          {item.source}
        </span>
        <span style={{ fontFamily: "var(--font-head)", fontSize: 10,
          color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          {timeAgo(item.date)}
        </span>
        <button onClick={handleCopy} title="Save to Notes" style={{
          marginLeft: "auto",
          background: copied ? "rgba(57,181,74,0.15)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${copied ? "rgba(57,181,74,0.4)" : "rgba(255,255,255,0.08)"}`,
          color: copied ? "#39B54A" : "var(--text-muted)",
          fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.12em", textTransform: "uppercase",
          padding: "4px 10px", cursor: "pointer", transition: "all 0.2s",
        }}>
          {copied ? "✓ SAVED" : "+ NOTES"}
        </button>
      </div>

      <a href={item.link} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
        <div style={{
          fontFamily: "var(--font-head)", fontSize: "clamp(15px, 2vw, 19px)",
          fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em",
          color: "var(--text)", lineHeight: 1.25, marginBottom: 10,
          transition: "color 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text)"}
        >
          {item.title}
        </div>
      </a>

      {item.desc && (
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
          {item.desc}{item.desc.length >= 200 ? "…" : ""}
        </p>
      )}

      <a href={item.link} target="_blank" rel="noreferrer" style={{
        display: "inline-block", marginTop: 14,
        fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700,
        letterSpacing: "0.14em", textTransform: "uppercase",
        color: "var(--red)", textDecoration: "none",
      }}>
        READ MORE ↗
      </a>
    </div>
  );
}

// ── Main News page ────────────────────────────────────────────────────────────
function News() {
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [filter,   setFilter]   = useState("All");
  const [notifMsg, setNotifMsg] = useState("");

  const handleCopyToNotes = useCallback((text) => {
    copyToNotes(text);
    setNotifMsg("Saved to Notes ✓");
    setTimeout(() => setNotifMsg(""), 2500);
  }, []);

  const loadFeeds = useCallback(async () => {
    setLoading(true);
    setError(false);

    const results = await Promise.allSettled(
      RSS_FEEDS.map(async feed => {
        const items = await fetchFeedJSON(feed.url);
        return parseItems(items, feed.name);
      })
    );

    const all = results.flatMap(r => r.status === "fulfilled" ? r.value : []);
    all.sort((a, b) => new Date(b.date) - new Date(a.date));

    setArticles(all);
    setLoading(false);
    if (all.length === 0) setError(true);
  }, []);

  useEffect(() => { Promise.resolve().then(loadFeeds); }, [loadFeeds]);

  const sources  = ["All", ...RSS_FEEDS.map(f => f.name)];
  const filtered = filter === "All" ? articles : articles.filter(a => a.source === filter);

  return (
    <div className="container">
      <div className="page-subtitle">Latest from the Paddock</div>
      <h1 className="page-title">News & <span>Updates</span></h1>

      {notifMsg && (
        <div style={{
          position: "fixed", bottom: 32, right: 32, zIndex: 999,
          background: "var(--bg-card)", border: "1px solid #39B54A",
          color: "#39B54A", fontFamily: "var(--font-head)", fontSize: 13,
          fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          padding: "12px 20px",
        }}>{notifMsg}</div>
      )}

      {/* Latest race result */}
      <div style={{ marginBottom: 48 }}>
        <div className="section-label">Latest Race Result</div>
        <LatestResult />
      </div>

      {/* Headlines */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12, marginBottom: 4 }}>
        <div className="section-label" style={{ margin: 0 }}>Headlines</div>
        <button onClick={loadFeeds} style={{
          background: "none", border: "1px solid var(--border)",
          color: "var(--text-muted)", fontFamily: "var(--font-head)",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", padding: "5px 12px", cursor: "pointer",
        }}>↻ Refresh</button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 24, marginTop: 16, flexWrap: "wrap" }}>
        {sources.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.14em", textTransform: "uppercase", padding: "6px 14px",
            border: `1px solid ${filter === s ? "var(--red)" : "var(--border)"}`,
            background: filter === s ? "rgba(225,6,0,0.1)" : "transparent",
            color: filter === s ? "var(--red)" : "var(--text-muted)",
            cursor: "pointer", transition: "all 0.15s",
          }}>{s}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-head)",
          letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Loading headlines...
        </p>
      ) : error && articles.length === 0 ? (
        <div>
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-head)",
            fontSize: 13, letterSpacing: "0.08em", marginBottom: 16 }}>
            News feeds temporarily unavailable.
          </p>
          <button onClick={loadFeeds} style={{
            background: "var(--red)", border: "none", color: "#fff",
            fontFamily: "var(--font-head)", fontSize: 12, fontWeight: 800,
            letterSpacing: "0.15em", textTransform: "uppercase",
            padding: "10px 24px", cursor: "pointer",
          }}>Try Again</button>
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-head)",
          fontSize: 13, letterSpacing: "0.08em" }}>
          No articles from {filter} right now.{" "}
          <button onClick={() => setFilter("All")} style={{
            background: "none", border: "none", color: "var(--red)",
            fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 700,
            letterSpacing: "0.08em", cursor: "pointer", textDecoration: "underline",
          }}>Show all</button>
        </p>
      ) : (
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 2 }}>
          {filtered.map((item, i) => (
            <NewsCard key={`${item.source}-${i}`} item={item} onCopy={handleCopyToNotes} />
          ))}
        </div>
      )}
    </div>
  );
}

export default News;