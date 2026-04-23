// src/pages/About.jsx

const YEAR = new Date().getFullYear();

const FEATURES = [
  { icon: "⏱", label: "Live Timing",         desc: "Real-time positions, gaps, tyre data and lap times during any session." },
  { icon: "🏁", label: "Next Race",           desc: "Countdown to the next session with the full weekend schedule." },
  { icon: "👥", label: "Driver Standings",    desc: "Live championship table with points, wins and team colours." },
  { icon: "🏟", label: "Circuit Guide",       desc: "Track maps, sector info, lap records and race history for every circuit." },
  { icon: "📖", label: "Race Story",          desc: "Auto-generated recap of the latest race — results, pit stops and more." },
  { icon: "🧮", label: "Strategy Lab",        desc: "Simulate race strategies with real tyre degradation and pace data." },
  { icon: "📰", label: "News",                desc: "Latest F1 headlines from Autosport, RaceFans and The Race." },
  { icon: "🗓", label: "Season Calendar",     desc: "All rounds in one view, auto-marked as done, next or upcoming." },
  { icon: "📊", label: "Driver Performance",  desc: "Head-to-head qualifying stats and race pace breakdown per driver." },
  { icon: "⭐", label: "My F1",               desc: "A personalised space that tracks your most-viewed drivers and teams." },
  { icon: "📝", label: "Notes",               desc: "Save race thoughts, predictions and articles for later." },
  { icon: "👔", label: "Driver Lineup",       desc: "The full 2025 grid with driver photos and team info." },
];

function FeatureChip({ icon, label, desc }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderLeft: "3px solid var(--red)",
      padding: "14px 16px",
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{
          fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 800,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: "var(--text)", marginBottom: 4,
        }}>{label}</div>
        <div style={{
          fontSize: 12, lineHeight: 1.6, color: "var(--text-muted)",
        }}>{desc}</div>
      </div>
    </div>
  );
}

function linkStyle() {
  return {
    display: "inline-flex", alignItems: "center", gap: 7,
    fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700,
    letterSpacing: "0.12em", textTransform: "uppercase",
    color: "var(--text-muted)", textDecoration: "none",
    border: "1px solid var(--border)",
    padding: "7px 14px",
    transition: "border-color 0.15s, color 0.15s",
  };
}

function About() {
  return (
    <div className="container">

      {/* ── Page header ── */}
      <div className="page-subtitle">YF1 Dashboard · {YEAR}</div>
      <h1 className="page-title">About <span>YF1</span></h1>

      {/* ── What the app does ── */}
      <div style={{
        border: "1px solid var(--border)", borderTop: "3px solid var(--red)",
        background: "var(--bg-card)", padding: "28px 28px",
        maxWidth: 680, marginBottom: 48,
      }}>
        <div className="section-label" style={{ marginBottom: 14 }}>The App</div>
        <p style={{ fontSize: 15, lineHeight: 1.9, color: "var(--text-muted)", margin: 0 }}>
          YF1 Dashboard is a Formula 1 companion app that brings everything a fan
          needs into one place. Live session timing, race countdowns, driver standings,
          circuit guides, strategy tools, and the latest news — no subscriptions,
          no ads, no sign-up. Just open it and go.
        </p>
      </div>

      {/* ── Features ── */}
      <div className="section-label" style={{ marginBottom: 20 }}>What's Inside</div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 2, marginBottom: 56,
      }}>
        {FEATURES.map(f => <FeatureChip key={f.label} {...f} />)}
      </div>

      {/* ── Project story ── */}
      <div style={{
        border: "1px solid var(--border)", borderTop: "3px solid var(--red)",
        background: "var(--bg-card)", padding: "28px 28px",
        maxWidth: 680, marginBottom: 48,
      }}>
        <div className="section-label" style={{ marginBottom: 14 }}>How It Started</div>
        <p style={{ fontSize: 15, lineHeight: 1.9, color: "var(--text-muted)", margin: "0 0 14px" }}>
          This project started as a small idea to build a dashboard where Formula 1 fans
          could explore race information in a clean and interactive way.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.9, color: "var(--text-muted)", margin: "0 0 14px" }}>
          Instead of jumping between different sites, this dashboard brings together race
          schedules, driver standings, track information, and other tools — all in one place.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.9, color: "var(--text-muted)", margin: 0 }}>
          It's a personal project built by a fan, for fans.
        </p>
      </div>

      {/* ── Creator card ── */}
      <div style={{
        border: "1px solid var(--border)", borderTop: "3px solid var(--red)",
        background: "var(--bg-card)", padding: "28px 28px",
        maxWidth: 680, marginBottom: 40,
      }}>
        <div className="section-label" style={{ marginBottom: 14 }}>The Creator</div>

        <div style={{
          fontFamily: "var(--font-head)", fontSize: "clamp(24px, 4vw, 32px)",
          fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase",
          color: "var(--text)", lineHeight: 1.1,
        }}>
          Shibalik Pal
        </div>
        <div style={{
          fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: "var(--red)", marginTop: 8, marginBottom: 16,
        }}>
          B.Tech Student · 2nd Year
        </div>

        <p style={{
          fontSize: 14, lineHeight: 1.8, color: "var(--text-muted)",
          margin: "0 0 22px",
        }}>
          Still learning, still building — one project at a time.
          YF1 Dashboard is what happens when a love for Formula 1 meets
          curiosity about how things are made.
        </p>

        {/* Social links */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href="https://www.instagram.com/theshibalik"
            target="_blank" rel="noreferrer"
            style={linkStyle()}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#E1306C"; e.currentTarget.style.color = "#E1306C"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            Instagram
          </a>

          <a
            href="https://www.linkedin.com/in/shibalik-pal-3450762a5"
            target="_blank" rel="noreferrer"
            style={linkStyle()}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#0A66C2"; e.currentTarget.style.color = "#0A66C2"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </a>

          <a
            href="https://github.com/codeingwala-sys"
            target="_blank" rel="noreferrer"
            style={linkStyle()}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#fff"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>

          <a
            href="mailto:worldshein@gmail.com"
            style={linkStyle()}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#EA4335"; e.currentTarget.style.color = "#EA4335"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-.9.732-1.636 1.636-1.636h.749L12 10.09l9.615-6.269h.749A1.636 1.636 0 0124 5.457z"/>
            </svg>
            Email
          </a>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <p style={{
        fontSize: 11, color: "#333",
        fontFamily: "var(--font-head)", letterSpacing: "0.08em",
        maxWidth: 680, marginBottom: 0,
      }}>
        © {YEAR} YF1 Dashboard · Not affiliated with Formula 1, FIA or FOM.
        All F1 trademarks belong to their respective owners.
      </p>

    </div>
  );
}

export default About;