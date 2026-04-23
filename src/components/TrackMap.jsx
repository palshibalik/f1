// Official F1 track icons from media.formula1.com
// Keyed by Ergast circuitId — these URLs are used by F1's own website
const CIRCUIT_IMAGES = {
  bahrain:       "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Bahrain%20carbon.png",
  jeddah:        "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Saudi%20Arabia%20carbon.png",
  albert_park:   "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Australia%20carbon.png",
  suzuka:        "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Japan%20carbon.png",
  shanghai:      "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/China%20carbon.png",
  miami:         "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Miami%20carbon.png",
  imola:         "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Emilia%20Romagna%20carbon.png",
  monaco:        "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Monaco%20carbon.png",
  villeneuve:    "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Canada%20carbon.png",
  catalunya:     "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Spain%20carbon.png",
  red_bull_ring: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Austria%20carbon.png",
  silverstone:   "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Great%20Britain%20carbon.png",
  hungaroring:   "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Hungary%20carbon.png",
  spa:           "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Belgium%20carbon.png",
  zandvoort:     "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Netherlands%20carbon.png",
  monza:         "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Italy%20carbon.png",
  baku:          "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Azerbaijan%20carbon.png",
  marina_bay:    "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Singapore%20carbon.png",
  americas:      "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/USA%20carbon.png",
  rodriguez:     "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Mexico%20carbon.png",
  interlagos:    "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Brazil%20carbon.png",
  vegas:         "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Las%20Vegas%20carbon.png",
  losail:        "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Qatar%20carbon.png",
  yas_marina:    "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Abu%20Dhabi%20carbon.png",
};

function TrackMap({ circuitId }) {
  const imgUrl = CIRCUIT_IMAGES[circuitId];

  return (
    <div className="track-map">
      <h4>Circuit Layout</h4>
      <div style={{
        position: "relative",
        background: "#060606",
        border: "1px solid var(--border)",
        padding: "24px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "220px",
      }}>
        {imgUrl ? (
          <>
            <img
              src={imgUrl}
              alt={`${circuitId} layout`}
              style={{
                width: "100%",
                maxWidth: "460px",
                display: "block",
              }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div style={{
              display: "none",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-head)",
              fontSize: "12px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}>
              <span style={{ fontSize: "28px", opacity: 0.25 }}>🏁</span>
              Map unavailable
            </div>
          </>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-head)",
            fontSize: "12px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            <span style={{ fontSize: "28px", opacity: 0.25 }}>🏁</span>
            Circuit map not available
          </div>
        )}
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "50px",
          background: "linear-gradient(to top, rgba(225,6,0,0.05), transparent)",
          pointerEvents: "none",
        }} />
      </div>
    </div>
  );
}

export default TrackMap;