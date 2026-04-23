import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

import f1Logo from "./formula1.png";

// ─── F1 Logo ──────────────────────────────────────────────────────────────────
function F1Logo() {
  return (
    <img
      src={f1Logo}
      alt="Formula 1"
      style={{ height: 45, width: "auto", display: "block", flexShrink: 0, objectFit: "contain" }}
    />
  );
}

// ─── Safe fetch — never throws, treats 404/429 as null ───────────────────────
async function safeFetch(url, ms = 8000) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) return null;
    return res.json();
  } catch {
    clearTimeout(tid);
    return null;
  }
}

// ─── Race-day ticker ──────────────────────────────────────────────────────────
function RaceDayTicker() {
  const [state, setState] = useState(null);

  useEffect(() => {
    async function check() {
      const nextData = await safeFetch("https://api.jolpi.ca/ergast/f1/current/next.json");
      const nextRace = nextData?.MRData?.RaceTable?.Races?.[0];
      if (!nextRace) { setState({ show: false }); return; }

      const now          = new Date();
      const raceStart    = new Date(`${nextRace.date}T${nextRace.time}`);
      const raceEnd      = new Date(raceStart.getTime() + 4 * 3600000);
      const fp1          = nextRace.FirstPractice;
      const weekendStart = fp1
        ? new Date(`${fp1.date}T${fp1.time}`)
        : new Date(raceStart.getTime() - 3 * 86400000);

      if (now < weekendStart || now >= raceEnd) { setState({ show: false }); return; }

      const lastData = await safeFetch("https://api.jolpi.ca/ergast/f1/current/last/results.json");
      const lastRace = lastData?.MRData?.RaceTable?.Races?.[0];

      // Live check — session metadata only, NO date-filtered position query (causes 404)
      let isRaceDay = false;
      if (now >= raceStart && now <= raceEnd) {
        const fromIso  = new Date(now - 8 * 3600000).toISOString().slice(0, 19);
        const sessions = await safeFetch(
          `https://api.openf1.org/v1/sessions?date_start>=${encodeURIComponent(fromIso)}`
        );
        if (sessions?.length) {
          const sorted = [...sessions].sort((a, b) => new Date(b.date_start) - new Date(a.date_start));
          const open   = sorted.find(s => !s.date_end || new Date(s.date_end).getTime() > now);
          isRaceDay    = !!(open?.session_type === "Race");
        }
      }

      setState({ show: true, isRaceDay, nextRace, lastRace });
    }
    check();
  }, []);

  if (!state?.show) return null;

  const { isRaceDay, nextRace, lastRace } = state;
  let items = [];
  if (lastRace?.Results) {
    items = lastRace.Results.slice(0, 10).map(r =>
      `P${r.position}  ${r.Driver.code ?? r.Driver.familyName}  ${r.points}PTS`
    );
    items.unshift(`${lastRace.raceName.toUpperCase()} — LATEST RESULTS`);
  }
  if (isRaceDay) {
    items.unshift(
      `🏁 RACE IS LIVE — ${nextRace.raceName.toUpperCase()}`,
      `ROUND ${nextRace.round} · ${nextRace.Circuit.Location.locality.toUpperCase()}, ${nextRace.Circuit.Location.country.toUpperCase()}`
    );
  }

  return (
    <div style={{
      background: isRaceDay ? "linear-gradient(90deg,#7a0000,#E10600 40%,#7a0000)" : "#130000",
      height: 30, display: "flex", alignItems: "center",
      overflow: "hidden", borderBottom: `1px solid ${isRaceDay ? "#c00" : "#280000"}`,
      position: "relative",
    }}>
      <div style={{
        flexShrink: 0, height: "100%", display: "flex", alignItems: "center",
        padding: "0 16px", background: isRaceDay ? "rgba(0,0,0,0.4)" : "#E10600",
        fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 900,
        letterSpacing: "0.22em", textTransform: "uppercase", gap: 8,
        whiteSpace: "nowrap", zIndex: 2,
      }}>
        {isRaceDay && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", animation: "pulse-red 0.9s ease infinite", flexShrink: 0 }} />}
        {isRaceDay ? "RACE DAY LIVE" : "RACE WEEKEND"}
      </div>
      <div style={{ overflow: "hidden", flex: 1 }}>
        <div style={{ display: "flex", animation: `ticker ${Math.max(items.length * 4, 8)}s linear infinite`, whiteSpace: "nowrap" }}>
          {[...items, ...items].map((item, i) => (
            <span key={i} style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 28px", color: "white", opacity: 0.9 }}>
              <span style={{ opacity: 0.4, marginRight: 10 }}>◆</span>{item}
            </span>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 64, background: `linear-gradient(to left, ${isRaceDay ? "#7a0000" : "#130000"}, transparent)`, pointerEvents: "none" }} />
    </div>
  );
}

// ─── Live session hook ────────────────────────────────────────────────────────
// Detects an active F1 session using only the /sessions endpoint.
// Avoids the date-filtered /position query which returns 404 for ended sessions
// and 429 when polled too frequently.
function useIsSessionLive() {
  const [isLive, setIsLive] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    let tid = null;

    async function check() {
      if (cancelRef.current) return;

      const now     = Date.now();
      const fromIso = new Date(now - 8 * 3600000).toISOString().slice(0, 19);

      // Only query /sessions — never /position with a date filter (causes 404/429)
      const sessions = await safeFetch(
        `https://api.openf1.org/v1/sessions?date_start>=${fromIso}`
      );

      let live = false;
      if (sessions?.length) {
        const sorted  = [...sessions].sort((a, b) => new Date(b.date_start) - new Date(a.date_start));
        const sess    = sorted.find(s => !s.date_end || new Date(s.date_end).getTime() > now)
                        || sorted[0];
        if (sess) {
          const startMs = new Date(sess.date_start).getTime();
          const endMs   = sess.date_end
            ? new Date(sess.date_end).getTime()
            : startMs + 4 * 3600000;
          // Session is live if: no end date yet, OR currently within the time window
          live = !sess.date_end
            ? (now >= startMs && now <= startMs + 6 * 3600000)
            : (now >= startMs - 15 * 60000 && now <= endMs + 3600000);
        }
      }

      if (!cancelRef.current) {
        setIsLive(live);
        // Poll every 30s when live, every 3 min when idle
        tid = setTimeout(check, live ? 30000 : 3 * 60 * 1000);
      }
    }

    check();
    return () => { cancelRef.current = true; if (tid) clearTimeout(tid); };
  }, []);

  return isLive;
}

// ─── Notes badge ──────────────────────────────────────────────────────────────
function useNotesCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    function update() {
      try { setCount(JSON.parse(localStorage.getItem("f1hq_notes_v1") || "[]").length); } catch {}
    }
    update();
    window.addEventListener("f1:copy-to-notes", update);
    return () => window.removeEventListener("f1:copy-to-notes", update);
  }, []);
  return count;
}

// ─── Nav links — matches App.jsx routes exactly ───────────────────────────────
const NAV_LINKS = [
  { to: "/",           label: "Home"       },
  { to: "/race-story", label: "Race Story" },
  { to: "/news",       label: "News"       },
  { to: "/circuit",    label: "Circuit"    },
  { to: "/progress",   label: "Progress"   },
  { to: "/my-f1",      label: "My F1"      },
  // Notes added dynamically below with badge
];

// ─── Main Header ──────────────────────────────────────────────────────────────
function Header() {
  const location    = useLocation();
  const isLivePage  = location.pathname === "/live";
  const sessionLive = useIsSessionLive();
  const notesCount  = useNotesCount();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const allLinks = [
    ...NAV_LINKS,
    { to: "/notes", label: "Notes", badge: notesCount > 0 ? notesCount : null },
  ];

  return (
    <>
      <RaceDayTicker />

      <header className="header">
        <div className="header-container">

          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <F1Logo />
            <span style={{ width: 1, height: 20, background: "var(--border-hot)", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 900, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--text-muted)", lineHeight: 1 }}>
              DASHBOARD
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="nav-desktop">
            {allLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={location.pathname === link.to ? "active" : ""}
                style={{ position: "relative" }}
              >
                {link.label}
                {link.badge != null && (
                  <span style={{
                    position: "absolute", top: 0, right: 0,
                    width: 16, height: 16, borderRadius: "50%",
                    background: "var(--red)", color: "#fff",
                    fontFamily: "var(--font-head)", fontSize: 9, fontWeight: 900,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transform: "translate(4px,-4px)", lineHeight: 1,
                  }}>
                    {link.badge > 9 ? "9+" : link.badge}
                  </span>
                )}
              </Link>
            ))}

            {/* Live pill — only shown when a session is actually live */}
            {sessionLive && (
              <Link to="/live" style={{
                display: "flex", alignItems: "center", gap: 7,
                textDecoration: "none", fontFamily: "var(--font-head)",
                fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", padding: "5px 14px", marginLeft: 8,
                background: isLivePage ? "var(--red)" : "rgba(225,6,0,0.12)",
                border: "1px solid rgba(225,6,0,0.4)",
                color: isLivePage ? "white" : "var(--red)",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", animation: "pulse-red 1s ease infinite", flexShrink: 0, boxShadow: "0 0 4px var(--red)" }} />
                LIVE
              </Link>
            )}
          </nav>

          {/* Hamburger */}
          <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            <span className={`hamburger-bar ${menuOpen ? "open" : ""}`} />
            <span className={`hamburger-bar ${menuOpen ? "open" : ""}`} />
            <span className={`hamburger-bar ${menuOpen ? "open" : ""}`} />
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 199, background: "transparent" }} />
      )}

      {/* Mobile drawer */}
      {menuOpen && (
        <nav className="nav-mobile">
          <button onClick={() => setMenuOpen(false)} style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--text-muted)", width: 32, height: 32,
            cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "rgba(225,6,0,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          >✕</button>

          <div style={{ fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 28px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 8 }}>
            Navigation
          </div>

          {allLinks.map((link, idx) => (
            <Link
              key={link.to}
              to={link.to}
              className={location.pathname === link.to ? "active" : ""}
              onClick={() => setMenuOpen(false)}
              style={{ animationDelay: `${idx * 0.05}s`, position: "relative" }}
            >
              {link.label}
              {link.badge != null && (
                <span style={{ marginLeft: 8, background: "var(--red)", color: "#fff", fontFamily: "var(--font-head)", fontSize: 9, fontWeight: 900, padding: "1px 6px", borderRadius: 10, verticalAlign: "middle" }}>
                  {link.badge > 9 ? "9+" : link.badge}
                </span>
              )}
            </Link>
          ))}

          <Link to="/live" className={`nav-mobile-live${isLivePage ? " active" : ""}`} onClick={() => setMenuOpen(false)}>
            {sessionLive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", animation: "pulse-red 1s ease infinite", flexShrink: 0 }} />}
            LIVE
          </Link>
        </nav>
      )}

      <style>{`
        @keyframes pulse-red { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes ticker    { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      `}</style>
    </>
  );
}

export default Header;