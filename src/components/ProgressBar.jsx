function ProgressBar({ round, total }) {
  const pct = Math.round((round / total) * 100);

  return (
    <div className="progress-section">
      <div className="progress-meta">
        <span className="progress-label">Championship Progress</span>
        <span className="progress-value">{round} / {total} Rounds</span>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: pct + "%" }} />
      </div>

      <div className="rounds-grid" style={{ marginTop: "16px" }}>
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`round-pip ${i < round - 1 ? "done" : i === round - 1 ? "current" : ""}`}
            title={`Round ${i + 1}`}
          />
        ))}
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: "8px",
        fontSize: "10px",
        color: "var(--text-muted)",
        fontFamily: "var(--font-head)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: "600",
      }}>
        <span>Round 1</span>
        <span style={{ color: "white" }}>{pct}% Complete</span>
        <span>Round {total}</span>
      </div>
    </div>
  );
}

export default ProgressBar;