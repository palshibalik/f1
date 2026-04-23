import { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";

async function fetchJSON(url, ms = 10000) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  } catch (e) { clearTimeout(tid); throw e; }
}

async function fetchWikiSummary(wikiUrl) {
  if (!wikiUrl) return null;
  const slug = wikiUrl.split("/wiki/")[1];
  if (!slug) return null;
  try {
    const res = await fetch(
      "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(slug),
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (_) { return null; }
}

// -- Circuit facts -------------------------------------------------------------
const CIRCUIT_FACTS = {
  albert_park:   { lapRecord: "1:20.235", lapHolder: "Leclerc (2022)",       firstGP: 1996, laps: 58, length: "5.278 km", corners: 16, drsZones: 4, topSpeed: "326 km/h", type: "Street"    },
  shanghai:      { lapRecord: "1:32.238", lapHolder: "M.Schumacher (2004)",  firstGP: 2004, laps: 56, length: "5.451 km", corners: 16, drsZones: 2, topSpeed: "327 km/h", type: "Permanent" },
  suzuka:        { lapRecord: "1:30.983", lapHolder: "Hamilton (2019)",      firstGP: 1987, laps: 53, length: "5.807 km", corners: 18, drsZones: 2, topSpeed: "319 km/h", type: "Permanent" },
  bahrain:       { lapRecord: "1:31.447", lapHolder: "de la Rosa (2005)",    firstGP: 2004, laps: 57, length: "5.412 km", corners: 15, drsZones: 3, topSpeed: "321 km/h", type: "Permanent" },
  jeddah:        { lapRecord: "1:30.734", lapHolder: "Leclerc (2022)",       firstGP: 2021, laps: 50, length: "6.174 km", corners: 27, drsZones: 3, topSpeed: "342 km/h", type: "Street"    },
  miami:         { lapRecord: "1:29.708", lapHolder: "Verstappen (2023)",    firstGP: 2022, laps: 57, length: "5.412 km", corners: 19, drsZones: 3, topSpeed: "320 km/h", type: "Street"    },
  imola:         { lapRecord: "1:15.484", lapHolder: "Verstappen (2022)",    firstGP: 1980, laps: 63, length: "4.909 km", corners: 19, drsZones: 2, topSpeed: "306 km/h", type: "Permanent" },
  monaco:        { lapRecord: "1:12.909", lapHolder: "Leclerc (2021)",       firstGP: 1950, laps: 78, length: "3.337 km", corners: 19, drsZones: 1, topSpeed: "298 km/h", type: "Street"    },
  villeneuve:    { lapRecord: "1:13.078", lapHolder: "Bottas (2019)",        firstGP: 1978, laps: 70, length: "4.361 km", corners: 14, drsZones: 2, topSpeed: "330 km/h", type: "Street"    },
  catalunya:     { lapRecord: "1:16.330", lapHolder: "Verstappen (2023)",    firstGP: 1991, laps: 66, length: "4.657 km", corners: 16, drsZones: 2, topSpeed: "307 km/h", type: "Permanent" },
  red_bull_ring: { lapRecord: "1:05.619", lapHolder: "Leclerc (2020)",       firstGP: 1970, laps: 71, length: "4.318 km", corners: 10, drsZones: 3, topSpeed: "313 km/h", type: "Permanent" },
  silverstone:   { lapRecord: "1:27.097", lapHolder: "Hamilton (2020)",      firstGP: 1950, laps: 52, length: "5.891 km", corners: 18, drsZones: 2, topSpeed: "330 km/h", type: "Permanent" },
  hungaroring:   { lapRecord: "1:16.627", lapHolder: "Hamilton (2020)",      firstGP: 1986, laps: 70, length: "4.381 km", corners: 14, drsZones: 2, topSpeed: "307 km/h", type: "Permanent" },
  spa:           { lapRecord: "1:46.286", lapHolder: "Bottas (2018)",        firstGP: 1950, laps: 44, length: "7.004 km", corners: 20, drsZones: 2, topSpeed: "357 km/h", type: "Permanent" },
  zandvoort:     { lapRecord: "1:11.097", lapHolder: "Hamilton (2021)",      firstGP: 1952, laps: 72, length: "4.259 km", corners: 14, drsZones: 2, topSpeed: "312 km/h", type: "Permanent" },
  monza:         { lapRecord: "1:21.046", lapHolder: "Barrichello (2004)",   firstGP: 1950, laps: 53, length: "5.793 km", corners: 11, drsZones: 2, topSpeed: "362 km/h", type: "Permanent" },
  baku:          { lapRecord: "1:43.009", lapHolder: "Leclerc (2019)",       firstGP: 2017, laps: 51, length: "6.003 km", corners: 20, drsZones: 2, topSpeed: "351 km/h", type: "Street"    },
  marina_bay:    { lapRecord: "1:35.867", lapHolder: "Leclerc (2023)",       firstGP: 2008, laps: 62, length: "4.940 km", corners: 19, drsZones: 3, topSpeed: "318 km/h", type: "Street"    },
  americas:      { lapRecord: "1:36.169", lapHolder: "Leclerc (2019)",       firstGP: 2012, laps: 56, length: "5.513 km", corners: 20, drsZones: 2, topSpeed: "320 km/h", type: "Permanent" },
  rodriguez:     { lapRecord: "1:17.774", lapHolder: "Bottas (2021)",        firstGP: 1963, laps: 71, length: "4.304 km", corners: 17, drsZones: 3, topSpeed: "365 km/h", type: "Permanent" },
  interlagos:    { lapRecord: "1:10.540", lapHolder: "Bottas (2018)",        firstGP: 1973, laps: 71, length: "4.309 km", corners: 15, drsZones: 2, topSpeed: "325 km/h", type: "Permanent" },
  vegas:         { lapRecord: "1:35.490", lapHolder: "Sainz (2023)",         firstGP: 2023, laps: 50, length: "6.201 km", corners: 17, drsZones: 2, topSpeed: "350 km/h", type: "Street"    },
  losail:        { lapRecord: "1:24.319", lapHolder: "Verstappen (2023)",    firstGP: 2021, laps: 57, length: "5.380 km", corners: 16, drsZones: 2, topSpeed: "322 km/h", type: "Permanent" },
  yas_marina:    { lapRecord: "1:26.103", lapHolder: "Leclerc (2021)",       firstGP: 2009, laps: 58, length: "5.281 km", corners: 16, drsZones: 2, topSpeed: "333 km/h", type: "Permanent" },
  madring:       { lapRecord: "--",       lapHolder: "--",                    firstGP: 2026, laps: "TBC", length: "TBC", corners: "TBC", drsZones: "TBC", topSpeed: "--", type: "Street" },
};

// -- Track icons from F1 CDN ---------------------------------------------------
const CIRCUIT_ICONS = {
  albert_park:   "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Australia%20carbon.png",
  shanghai:      "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/China%20carbon.png",
  suzuka:        "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Japan%20carbon.png",
  bahrain:       "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Bahrain%20carbon.png",
  jeddah:        "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Saudi%20Arabia%20carbon.png",
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
  madring:       "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Spain%20carbon.png",
};

// -- Sector info ---------------------------------------------------------------
const SECTOR_INFO = {
  _default:    [
    { label: "S1", color: "#E10600", character: "Speed",      desc: "Main straight & heavy braking" },
    { label: "S2", color: "#39B54A", character: "Technical",  desc: "Technical corners & chicanes"  },
    { label: "S3", color: "#A855F7", character: "Mixed",      desc: "Mixed high & low speed"        },
  ],
  monaco:      [
    { label: "S1", color: "#E10600", character: "Braking",    desc: "Sainte Devote to Casino" },
    { label: "S2", color: "#39B54A", character: "Tight",      desc: "Mirabeau & Grand Hotel hairpin" },
    { label: "S3", color: "#A855F7", character: "Tunnel",     desc: "Tunnel, chicane & Anthony Noghes" },
  ],
  monza:       [
    { label: "S1", color: "#E10600", character: "Full Speed", desc: "Start line to Curva Grande" },
    { label: "S2", color: "#39B54A", character: "Chicanes",   desc: "Two chicanes in sequence" },
    { label: "S3", color: "#A855F7", character: "Parabolica", desc: "Lesmo, Ascari & Parabolica" },
  ],
  spa:         [
    { label: "S1", color: "#E10600", character: "Eau Rouge",  desc: "La Source, Eau Rouge, Raidillon" },
    { label: "S2", color: "#39B54A", character: "Pouhon",     desc: "Les Combes, Pouhon, Fagnes" },
    { label: "S3", color: "#A855F7", character: "Bus Stop",   desc: "Blanchimont & Bus Stop chicane" },
  ],
  silverstone: [
    { label: "S1", color: "#E10600", character: "Maggots",    desc: "Copse, Maggots, Becketts & Chapel" },
    { label: "S2", color: "#39B54A", character: "Hangar",     desc: "Hangar Straight & Stowe" },
    { label: "S3", color: "#A855F7", character: "Club",       desc: "Vale, Club & final straight" },
  ],
  suzuka:      [
    { label: "S1", color: "#E10600", character: "Esses",      desc: "First curve, S-curves & Dunlop" },
    { label: "S2", color: "#39B54A", character: "Hairpin",    desc: "Hairpin & Spoon curve" },
    { label: "S3", color: "#A855F7", character: "130R",       desc: "130R & Casio chicane" },
  ],
  baku:        [
    { label: "S1", color: "#E10600", character: "Long Back",  desc: "Main straight to Turn 3" },
    { label: "S2", color: "#39B54A", character: "Old Town",   desc: "Narrow castle section" },
    { label: "S3", color: "#A855F7", character: "Waterfront", desc: "Seafront blast to finish" },
  ],
  shanghai:    [
    { label: "S1", color: "#E10600", character: "Hairpin",    desc: "Long back straight & hairpin" },
    { label: "S2", color: "#39B54A", character: "Horseshoe",  desc: "The long swooping horseshoe" },
    { label: "S3", color: "#A855F7", character: "Final",      desc: "Final chicane to start" },
  ],
};

function getSectors(circuitId) {
  return SECTOR_INFO[circuitId] || SECTOR_INFO._default;
}

// -- Sector clip polygons (SVG viewBox 400x300) --------------------------------
// Each entry: [S1_polygon, S2_polygon, S3_polygon]
// Points are absolute SVG coordinates matching the 400x300 viewBox.
// Order MUST match SECTOR_INFO: S1=index 0, S2=index 1, S3=index 2.
const SECTOR_CLIPS = {
  // Albert Park: S1=right half (start/straight/T1), S2=top-left (infield), S3=bottom (back section)
  albert_park:   [
    "220,0 400,0 400,180 280,180 220,120",
    "0,0 220,0 220,120 280,180 0,180",
    "0,180 400,180 400,300 0,300",
  ],
  // Shanghai: S1=right-top (T1 hairpin + back straight), S2=left (horseshoe), S3=bottom (final chicane)
  shanghai:      [
    "200,0 400,0 400,150 200,150",
    "0,0 200,0 200,150 0,150",
    "0,150 400,150 400,300 0,300",
  ],
  // Suzuka: S1=right (esses+dunlop), S2=left (hairpin+spoon), S3=bottom-right (130R+chicane)
  suzuka:        [
    "200,0 400,0 400,170 200,170",
    "0,0 200,0 200,300 0,300",
    "200,170 400,170 400,300 200,300",
  ],
  // Bahrain: S1=right-top, S2=right-bottom, S3=left
  bahrain:       [
    "200,0 400,0 400,150 200,150",
    "200,150 400,150 400,300 200,300",
    "0,0 200,0 200,300 0,300",
  ],
  // Jeddah: S1=right-top (fast), S2=right-bottom (tight), S3=left (long straight)
  jeddah:        [
    "200,0 400,0 400,140 200,140",
    "200,140 400,140 400,300 200,300",
    "0,0 200,0 200,300 0,300",
  ],
  // Miami: S1=right-top, S2=left-top, S3=bottom
  miami:         [
    "200,0 400,0 400,150 200,150",
    "0,0 200,0 200,150 0,150",
    "0,150 400,150 400,300 0,300",
  ],
  // Imola: S1=right-top, S2=left-top, S3=bottom
  imola:         [
    "200,0 400,0 400,135 200,135",
    "0,0 200,0 200,135 0,135",
    "0,135 400,135 400,300 0,300",
  ],
  // Monaco: S1=right (Ste Devote→Casino), S2=left-top (Mirabeau), S3=bottom (Tunnel+chicane)
  monaco:        [
    "220,0 400,0 400,150 220,150",
    "0,0 220,0 220,150 0,150",
    "0,150 400,150 400,300 0,300",
  ],
  // Villeneuve: S1=right-top, S2=left-top, S3=bottom
  villeneuve:    [
    "200,0 400,0 400,150 200,150",
    "0,0 200,0 200,150 0,150",
    "0,150 400,150 400,300 0,300",
  ],
  // Catalunya: S1=top, S2=right-bottom, S3=left-bottom
  catalunya:     [
    "0,0 400,0 400,115 0,115",
    "200,115 400,115 400,300 200,300",
    "0,115 200,115 200,300 0,300",
  ],
  // Red Bull Ring: S1=right-top, S2=right-bottom, S3=left
  red_bull_ring: [
    "220,0 400,0 400,150 220,150",
    "160,150 400,150 400,300 160,300",
    "0,0 220,0 220,300 0,300",
  ],
  // Silverstone: S1=left-top (Copse/Maggots), S2=right (Hangar/Stowe), S3=bottom-left (Club)
  silverstone:   [
    "0,0 200,0 200,150 0,150",
    "200,0 400,0 400,180 200,180",
    "0,150 220,150 220,300 0,300",
  ],
  // Hungaroring: S1=right-top, S2=right-bottom, S3=left
  hungaroring:   [
    "200,0 400,0 400,150 200,150",
    "200,150 400,150 400,300 200,300",
    "0,0 200,0 200,300 0,300",
  ],
  // Spa: S1=right-top (La Source+Eau Rouge), S2=left (Les Combes+Pouhon), S3=bottom (Bus Stop)
  spa:           [
    "200,0 400,0 400,165 200,165",
    "0,0 200,0 200,165 0,165",
    "0,165 400,165 400,300 0,300",
  ],
  // Zandvoort: S1=right-top, S2=left-top, S3=bottom
  zandvoort:     [
    "200,0 400,0 400,150 200,150",
    "0,0 200,0 200,150 0,150",
    "0,150 400,150 400,300 0,300",
  ],
  // Monza: S1=right-top (start→Curva Grande), S2=left-top (chicanes), S3=bottom (Lesmo+Parabolica)
  monza:         [
    "200,0 400,0 400,120 200,120",
    "0,0 200,0 200,120 0,120",
    "0,120 400,120 400,300 0,300",
  ],
  // Baku: S1=top (main straight+T1-T3), S2=middle (old town), S3=bottom (seafront)
  baku:          [
    "0,0 400,0 400,100 0,100",
    "0,100 400,100 400,200 0,200",
    "0,200 400,200 400,300 0,300",
  ],
  // Marina Bay: S1=right, S2=left-top, S3=bottom
  marina_bay:    [
    "200,0 400,0 400,150 200,150",
    "0,0 200,0 200,150 0,150",
    "0,150 400,150 400,300 0,300",
  ],
  // Americas (COTA): S1=right-top, S2=right-bottom, S3=left
  americas:      [
    "200,0 400,0 400,135 200,135",
    "200,135 400,135 400,300 200,300",
    "0,0 200,0 200,300 0,300",
  ],
  // Rodriguez (Mexico): S1=right, S2=left-top, S3=bottom
  rodriguez:     [
    "200,0 400,0 400,150 200,150",
    "0,0 200,0 200,150 0,150",
    "0,150 400,150 400,300 0,300",
  ],
  // Interlagos: S1=right-top, S2=left-top, S3=bottom (Juncao straight)
  interlagos:    [
    "200,0 400,0 400,135 200,135",
    "0,0 200,0 200,135 0,135",
    "0,135 400,135 400,300 0,300",
  ],
  // Las Vegas: S1=top (main strip), S2=middle (infield), S3=bottom (return)
  vegas:         [
    "0,0 400,0 400,90 0,90",
    "0,90 400,90 400,205 0,205",
    "0,205 400,205 400,300 0,300",
  ],
  // Losail: S1=right, S2=left, S3=bottom
  losail:        [
    "200,0 400,0 400,150 200,150",
    "0,0 200,0 200,150 0,150",
    "0,150 400,150 400,300 0,300",
  ],
  // Yas Marina: S1=right, S2=left-top, S3=bottom
  yas_marina:    [
    "200,0 400,0 400,150 200,150",
    "0,0 200,0 200,150 0,150",
    "0,150 400,150 400,300 0,300",
  ],
};

// -- Stat pill -----------------------------------------------------------------
function StatPill({ label, value, accent }) {
  return (
    <div style={{ flex: "1 1 150px", padding: "18px 20px", background: "rgba(255,255,255,0.025)", border: "1px solid var(--border)", borderTop: "3px solid " + (accent || "var(--red)") }}>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 900, color: accent || "var(--text)", lineHeight: 1.1 }}>{value || "--"}</div>
    </div>
  );
}

// -- Wikipedia panel -----------------------------------------------------------
function WikiPanel({ wikiUrl }) {
  const [wiki, setWiki]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(function() {
    setWiki(null); setLoading(true); setError(false);
    fetchWikiSummary(wikiUrl)
      .then(function(d) { if (!d) throw new Error("no data"); setWiki(d); })
      .catch(function() { setError(true); })
      .finally(function() { setLoading(false); });
  }, [wikiUrl]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0", fontFamily: "var(--font-head)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
      <div style={{ width: 14, height: 14, border: "2px solid #1a1a1a", borderTopColor: "var(--red)", borderRadius: "50%", animation: "circ-spin .8s linear infinite", flexShrink: 0 }} />
      Loading...
    </div>
  );
  if (error || !wiki) return (
    <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-head)", fontSize: 12, lineHeight: 1.7 }}>Circuit biography not available.</p>
  );
  return (
    <div>
      <p style={{ fontFamily: "var(--font-head)", fontSize: 15, color: "var(--text-muted)", lineHeight: 1.8, margin: 0 }}>{wiki.extract}</p>
      {wiki.content_urls && wiki.content_urls.desktop && (
        <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", fontFamily: "var(--font-head)", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Source: Wikipedia
        </div>
      )}
    </div>
  );
}

// -- Winners panel -------------------------------------------------------------
function WinnersPanel({ circuitId }) {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    setWinners([]); setLoading(true);
    fetchJSON("https://api.jolpi.ca/ergast/f1/circuits/" + circuitId + "/results/1.json?limit=15")
      .then(function(d) {
        var races = (d.MRData && d.MRData.RaceTable && d.MRData.RaceTable.Races) || [];
        setWinners(races.sort(function(a, b) { return parseInt(b.season) - parseInt(a.season); }));
      })
      .catch(function() {})
      .finally(function() { setLoading(false); });
  }, [circuitId]);

  var TEAM_COLORS = {
    "McLaren": "#FF8000", "Ferrari": "#E8002D", "Red Bull Racing": "#3671C6", "Red Bull": "#3671C6",
    "Mercedes": "#27F4D2", "Aston Martin": "#229971", "Alpine F1 Team": "#FF87BC", "Alpine": "#FF87BC",
    "Williams": "#64C4FF", "RB F1 Team": "#6692FF", "Racing Bulls": "#6692FF",
    "Haas F1 Team": "#B6BABD", "Haas": "#B6BABD", "Kick Sauber": "#52E252", "Cadillac": "#CC0000",
  };
  function tc(n) { return TEAM_COLORS[n] || "#555"; }

  if (loading) return <div style={{ fontFamily: "var(--font-head)", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "12px 0" }}>Loading race history...</div>;
  if (!winners.length) return <div style={{ fontFamily: "var(--font-head)", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "12px 0" }}>No race history yet.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {winners.map(function(r, i) {
        var w   = r.Results && r.Results[0];
        var col = tc(w && w.Constructor && w.Constructor.name);
        return (
          <div key={r.season + "-" + r.round} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: i === 0 ? "rgba(255,215,0,0.04)" : "var(--bg-card)", border: "1px solid var(--border)", borderLeft: "3px solid " + (i === 0 ? "#FFD700" : col) }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 900, color: i === 0 ? "#FFD700" : "var(--text-muted)", minWidth: 52, flexShrink: 0 }}>{r.season}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {w && w.Driver && w.Driver.givenName} <span style={{ color: col }}>{w && w.Driver && w.Driver.familyName}</span>
              </div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 12, color: col, letterSpacing: "0.06em", marginTop: 3 }}>{w && w.Constructor && w.Constructor.name}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {w && w.Time && w.Time.time && <div style={{ fontFamily: "var(--font-head)", fontSize: 11, color: "var(--text-muted)" }}>{w.Time.time}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -- Circuit detail expanded panel ---------------------------------------------
function CircuitDetail({ circuit }) {
  const [section, setSection] = useState("history");
  var SECTIONS = [
    { id: "history", label: "Race History" },
    { id: "about",   label: "About Circuit" },
  ];
  return (
    <div style={{ marginTop: 2, border: "1px solid var(--border)", borderTop: "3px solid var(--red)", animation: "circ-fadein .25s ease both" }}>
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "#0a0a0a", overflowX: "auto" }}>
        {SECTIONS.map(function(s) {
          return (
            <button key={s.id} onClick={function() { setSection(s.id); }} style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", padding: "12px 20px", border: "none", cursor: "pointer", background: "transparent", whiteSpace: "nowrap", color: section === s.id ? "var(--text)" : "var(--text-muted)", borderBottom: "2px solid " + (section === s.id ? "var(--red)" : "transparent"), transition: "all .15s" }}>
              {s.label}
            </button>
          );
        })}
      </div>
      <div style={{ padding: "24px 20px" }}>
        {section === "history" && (
          <div>
            <div className="section-label" style={{ marginBottom: 16 }}>Race Winners at {circuit.circuitName}</div>
            <WinnersPanel circuitId={circuit.circuitId} />
          </div>
        )}
        {section === "about" && (
          <div>
            <div className="section-label" style={{ marginBottom: 16 }}>Circuit Biography</div>
            <WikiPanel wikiUrl={circuit.url} />
          </div>
        )}
      </div>
    </div>
  );
}

// -- Sector split percentages [s1End%, s2End%] --------------------------------
const SECTOR_SPLITS = {
  bahrain:       [33, 66], jeddah:        [33, 66], albert_park:   [40, 70],
  suzuka:        [35, 68], shanghai:      [45, 75], miami:         [33, 66],
  imola:         [38, 70], monaco:        [40, 72], villeneuve:    [33, 66],
  catalunya:     [38, 70], red_bull_ring: [40, 72], silverstone:   [38, 70],
  hungaroring:   [35, 68], spa:           [42, 72], zandvoort:     [38, 70],
  monza:         [35, 68], baku:          [33, 66], marina_bay:    [40, 70],
  americas:      [38, 70], rodriguez:     [35, 68], interlagos:    [40, 70],
  vegas:         [33, 66], losail:        [38, 70], yas_marina:    [40, 70],
};

// -- SectorTrack ---------------------------------------------------------------
function SectorTrack({ circuitId, sectors }) {
  var src    = CIRCUIT_ICONS[circuitId];
  var splits = SECTOR_SPLITS[circuitId] || [33, 66];
  var pcts   = [splits[0], splits[1] - splits[0], 100 - splits[1]];
  var COLORS = ["#E10600", "#39B54A", "#A855F7"];

  if (!src) return null;

  return (
    <div style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>

      {/* Clean track image */}
      <div style={{ background: "#050505", borderRadius: "6px 6px 0 0",
        overflow: "hidden", boxShadow: "0 0 30px rgba(0,0,0,0.8)" }}>
        <img src={src} alt={circuitId} style={{
          display: "block", width: "100%", height: "auto",
          filter: "brightness(1.1) contrast(1.05)",
        }} />
      </div>

      {/* Lap progress bar — represents one full lap split into sectors */}
      <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a",
        borderTop: "none", borderRadius: "0 0 6px 6px", padding: "12px 14px 14px" }}>

        {/* Label row */}
        <div style={{ display: "flex", marginBottom: 6 }}>
          {pcts.map(function(pct, i) {
            var sec = sectors[i];
            var col = COLORS[i];
            return (
              <div key={i} style={{ flex: pct, minWidth: 0, paddingRight: i < 2 ? 4 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontFamily: "var(--font-head)", fontSize: 11,
                    fontWeight: 900, color: col, letterSpacing: "0.08em",
                    textTransform: "uppercase" }}>
                    {sec ? sec.label : "S"+(i+1)}
                  </span>
                  <span style={{ fontFamily: "var(--font-head)", fontSize: 9,
                    color: col+"88", letterSpacing: "0.04em", textTransform: "uppercase",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {sec ? sec.character : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar — one continuous bar, 3 coloured segments */}
        <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 2 }}>
          {pcts.map(function(pct, i) {
            var col = COLORS[i];
            return (
              <div key={i} style={{
                flex: pct,
                background: col,
                borderRadius: i === 0 ? "4px 0 0 4px" : i === 2 ? "0 4px 4px 0" : 0,
                boxShadow: "0 0 6px " + col + "88",
              }} />
            );
          })}
        </div>

        {/* Distance markers */}
        <div style={{ display: "flex", marginTop: 5 }}>
          {pcts.map(function(pct, i) {
            var col = COLORS[i];
            return (
              <div key={i} style={{ flex: pct, minWidth: 0 }}>
                <span style={{ fontFamily: "var(--font-head)", fontSize: 8,
                  color: "#333", letterSpacing: "0.04em" }}>
                  {i === 0 ? "START" : i === 1 ? Math.round(splits[0])+"%": Math.round(splits[1])+"%"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// -- Track modal ---------------------------------------------------------------
function TrackModal({ circuitId, circuitName, facts, onClose }) {
  var sectors   = getSectors(circuitId);
  var typeColor = facts.type === "Street" ? "#FF8000" : facts.type === "Permanent" ? "#39B54A" : "#6692FF";

  useEffect(function() {
    document.body.style.overflow = "hidden";
    return function() { document.body.style.overflow = ""; };
  }, []);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
    }}>
      <div onClick={function(e) { e.stopPropagation(); }} style={{
        position: "relative", width: "min(920px, 100%)", maxHeight: "90vh", overflowY: "auto",
        background: "#080808", border: "1px solid #333", borderTop: "3px solid var(--red)",
        animation: "circ-fadein .2s ease both", flexShrink: 0,
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, zIndex: 10, width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-head)" }}>X</button>

        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: typeColor, background: typeColor + "18", padding: "3px 10px" }}>{facts.type || "Circuit"}</span>
            {facts.firstGP && <span style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", padding: "3px 10px" }}>Since {facts.firstGP}</span>}
          </div>
          <div style={{ fontFamily: "var(--font-head)", fontSize: "clamp(22px,4vw,34px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 1.05, letterSpacing: "0.02em" }}>{circuitName}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px" }} className="track-modal-body">
          <div style={{ background: "#060606", padding: "24px 20px 20px", borderRight: "1px solid var(--border)" }}>
            <SectorTrack circuitId={circuitId} sectors={sectors} />
            <div style={{ display: "flex", gap: 16, marginTop: 14, justifyContent: "center", flexWrap: "wrap" }}>
              {sectors.map(function(s) {
                return (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 24, height: 5, background: s.color, borderRadius: 3, boxShadow: "0 0 6px " + s.color + "88" }} />
                    <span style={{ fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 800, color: s.color, letterSpacing: "0.1em" }}>{s.label}</span>
                    <span style={{ fontFamily: "var(--font-head)", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.character}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>Sector Breakdown</div>
            {sectors.map(function(s) {
              return (
                <div key={s.label} style={{ padding: "14px 16px", marginBottom: 2, background: s.color + "0d", border: "1px solid var(--border)", borderLeft: "4px solid " + s.color }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                    <div style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1, minWidth: 28 }}>{s.label}</div>
                    <div style={{ fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: s.color, background: s.color + "22", padding: "2px 8px" }}>{s.character}</div>
                  </div>
                  <div style={{ fontFamily: "var(--font-head)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>{s.desc}</div>
                </div>
              );
            })}

            <div style={{ borderTop: "1px solid var(--border)", margin: "16px 0" }} />
            <div style={{ fontFamily: "var(--font-head)", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>Circuit Data</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[
                { label: "Length",     value: facts.length,          color: "#3671C6" },
                { label: "Laps",       value: String(facts.laps),    color: "#FF8000" },
                { label: "Corners",    value: String(facts.corners), color: "#A855F7" },
                { label: "Top Speed",  value: facts.topSpeed,        color: "#E10600" },
                { label: "DRS Zones",  value: String(facts.drsZones),color: "#39B54A" },
                { label: "Lap Record", value: facts.lapRecord,       color: "#FFD700" },
                { label: "Record By",  value: facts.lapHolder,       color: "#FFD700" },
              ].map(function(row) {
                return (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)", borderLeft: "2px solid " + row.color + "44" }}>
                    <span style={{ fontFamily: "var(--font-head)", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{row.label}</span>
                    <span style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 900, color: row.color }}>{row.value || "--"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <style>{".track-modal-body { } @media (max-width:650px) { .track-modal-body { grid-template-columns: 1fr !important; } }"}</style>
      </div>
    </div>
  );
}

// -- Circuit image (clickable) -------------------------------------------------
function CircuitImage({ circuitId, circuitName, facts }) {
  const [open, setOpen] = useState(false);
  var src = CIRCUIT_ICONS[circuitId];
  if (!src) return null;

  return (
    <div>
      <div onClick={function() { setOpen(true); }} title="Click for full circuit details" style={{ cursor: "pointer", flexShrink: 0, position: "relative", width: 300, height: 210, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={src} alt={circuitName} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(1.15) contrast(1.1)", opacity: 0.95, transition: "opacity .15s, transform .2s" }}
          onMouseEnter={function(e) { e.currentTarget.style.opacity="1"; e.currentTarget.style.transform="scale(1.05)"; }}
          onMouseLeave={function(e) { e.currentTarget.style.opacity="0.95"; e.currentTarget.style.transform="scale(1)"; }}
          onError={function(e) { e.currentTarget.parentElement.style.display="none"; }}
        />
        <div style={{ position: "absolute", bottom: 6, right: 6, fontFamily: "var(--font-head)", fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", background: "rgba(0,0,0,0.5)", padding: "2px 6px", pointerEvents: "none" }}>TAP TO EXPAND</div>
      </div>
      {open && ReactDOM.createPortal(
        <TrackModal key={circuitId} circuitId={circuitId} circuitName={circuitName} facts={facts} onClose={function() { setOpen(false); }} />,
        document.body
      )}
    </div>
  );
}

// -- Circuit Card --------------------------------------------------------------
function CircuitCard({ circuit, raceInfo, isNextRace }) {
  const [expanded, setExpanded] = useState(false);
  var facts = CIRCUIT_FACTS[circuit.circuitId] || {};

  return (
    <div style={{ animation: "circ-fadein .2s ease both" }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "3px solid " + (isNextRace ? "var(--red)" : "#333"), padding: "22px 24px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {isNextRace && <span style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--red)", background: "rgba(225,6,0,0.1)", padding: "4px 12px" }}>NEXT RACE</span>}
          {raceInfo && <span style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", padding: "4px 12px" }}>Round {raceInfo.round} . {raceInfo.season}</span>}
          {facts.firstGP && <span style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", padding: "4px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>Since {facts.firstGP}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: "clamp(26px,5vw,42px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 1.05, letterSpacing: "0.02em", marginBottom: 8 }}>{circuit.circuitName}</div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em" }}>{circuit.Location.locality}, {circuit.Location.country}</div>
            {raceInfo && <div style={{ marginTop: 10, fontFamily: "var(--font-head)", fontSize: 14, color: "var(--red)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{raceInfo.raceName}</div>}
          </div>
          <CircuitImage circuitId={circuit.circuitId} circuitName={circuit.circuitName} facts={facts} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginTop: 20 }}>
          <StatPill label="Circuit Length" value={facts.length}                           accent="var(--red)" />
          <StatPill label="Race Laps"      value={facts.laps ? String(facts.laps) : null} accent="#FF8000"    />
          <StatPill label="Lap Record"     value={facts.lapRecord}                        accent="#FFD700"    />
          <StatPill label="Record Holder"  value={facts.lapHolder}                        accent="#FFD700"    />
          {raceInfo && <StatPill label="Race Date" value={new Date(raceInfo.date + "T" + (raceInfo.time || "12:00:00Z")).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} accent="var(--text-muted)" />}
        </div>
        <button onClick={function() { setExpanded(function(e) { return !e; }); }} style={{ marginTop: 16, padding: "10px 20px", background: expanded ? "rgba(225,6,0,0.08)" : "rgba(255,255,255,0.03)", border: "1px solid " + (expanded ? "rgba(225,6,0,0.3)" : "var(--border)"), color: expanded ? "var(--red)" : "var(--text-muted)", fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-block", transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .2s" }}>&#9658;</span>
          {expanded ? "Close Details" : "Read More"}
        </button>
      </div>
      {expanded && <CircuitDetail circuit={circuit} raceInfo={raceInfo} facts={facts} />}
    </div>
  );
}

// -- Main page -----------------------------------------------------------------
function Circuit() {
  const [allCircuits, setAllCircuits] = useState([]);
  const [raceMap,     setRaceMap]     = useState({});
  const [nextCircuit, setNextCircuit] = useState(null);
  const [selected,    setSelected]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(false);
  const [searchTerm,  setSearchTerm]  = useState("");
  const [dropOpen,    setDropOpen]    = useState(false);

  useEffect(function() {
    fetchJSON("https://api.jolpi.ca/ergast/f1/current.json?limit=100")
      .then(function(d) {
        var races = (d.MRData && d.MRData.RaceTable && d.MRData.RaceTable.Races) || [];
        var seen = {}, circuits = [], map = {};
        races.forEach(function(r) {
          var cid = r.Circuit.circuitId;
          map[cid] = { round: r.round, season: r.season, raceName: r.raceName, date: r.date, time: r.time };
          if (!seen[cid]) { seen[cid] = true; circuits.push(r.Circuit); }
        });
        setAllCircuits(circuits);
        setRaceMap(map);
        var now  = Date.now();
        var next = races.find(function(r) { return new Date(r.date + "T" + (r.time || "12:00:00Z")).getTime() > now; });
        var nCid = (next && next.Circuit.circuitId) || (races.length && races[races.length - 1].Circuit.circuitId);
        setNextCircuit(nCid);
        setSelected(nCid);
      })
      .catch(function() { setError(true); })
      .finally(function() { setLoading(false); });
  }, []);

  var selectedCircuit = allCircuits.find(function(c) { return c.circuitId === selected; });
  var filtered = allCircuits.filter(function(c) {
    var q = searchTerm.toLowerCase();
    return c.circuitName.toLowerCase().includes(q) || c.Location.country.toLowerCase().includes(q) || c.Location.locality.toLowerCase().includes(q);
  });

  function handleSelect(cid) { setSelected(cid); setDropOpen(false); setSearchTerm(""); }

  if (loading) return <div className="container"><p style={{ color: "var(--text-muted)", fontFamily: "var(--font-head)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Loading circuits...</p></div>;
  if (error)   return <div className="container"><p style={{ color: "var(--red)", fontFamily: "var(--font-head)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Failed to load circuit data.</p></div>;

  var selRace = selected ? raceMap[selected] : null;

  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <div className="page-subtitle">{(selRace && selRace.season) || new Date().getFullYear()} World Championship</div>
      <h1 className="page-title">Circuit <span>Guide</span></h1>

      <div style={{ marginBottom: 28, maxWidth: 520, position: "relative" }}>
        <div style={{ fontFamily: "var(--font-head)", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Select Circuit</div>
        <button onClick={function() { setDropOpen(function(o) { return !o; }); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", background: "var(--bg-card)", border: "1px solid " + (dropOpen ? "var(--red)" : "var(--border)"), borderLeft: "3px solid " + (dropOpen ? "var(--red)" : "var(--border)"), cursor: "pointer", transition: "all .15s", textAlign: "left" }}>
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 800, textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.03em" }}>{selectedCircuit ? selectedCircuit.circuitName : "Choose a circuit"}</div>
            {selectedCircuit && <div style={{ fontFamily: "var(--font-head)", fontSize: 10, color: "var(--text-muted)", marginTop: 2, letterSpacing: "0.06em" }}>{selectedCircuit.Location.locality}, {selectedCircuit.Location.country}{selRace ? " . Round " + selRace.round : ""}</div>}
          </div>
          <span style={{ fontFamily: "var(--font-head)", fontSize: 10, color: "var(--text-muted)", transform: dropOpen ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>&#9660;</span>
        </button>

        {dropOpen && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, background: "#0c0c0c", border: "1px solid var(--border)", borderTop: "2px solid var(--red)", maxHeight: 340, overflowY: "auto", boxShadow: "0 16px 40px rgba(0,0,0,0.8)" }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "#0c0c0c", zIndex: 1 }}>
              <input autoFocus value={searchTerm} onChange={function(e) { setSearchTerm(e.target.value); }} placeholder="Search circuits, countries..." style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-head)", fontSize: 12, letterSpacing: "0.06em", outline: "none", boxSizing: "border-box" }} />
            </div>
            {filtered.length === 0
              ? <div style={{ padding: "16px 14px", fontFamily: "var(--font-head)", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>No circuits match</div>
              : filtered.map(function(c) {
                var race  = raceMap[c.circuitId];
                var isSel = c.circuitId === selected;
                var isNxt = c.circuitId === nextCircuit;
                return (
                  <button key={c.circuitId} onClick={function() { handleSelect(c.circuitId); }} style={{ width: "100%", padding: "11px 14px", background: isSel ? "rgba(225,6,0,0.08)" : "transparent", border: "none", borderBottom: "1px solid var(--border)", borderLeft: "3px solid " + (isSel ? "var(--red)" : "transparent"), cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, transition: "background .1s" }}
                    onMouseEnter={function(e) { if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={function(e) { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: isSel ? "var(--red)" : "var(--text)", letterSpacing: "0.03em" }}>
                        {c.circuitName}{isNxt && <span style={{ marginLeft: 8, fontSize: 9, color: "var(--red)", fontWeight: 700, letterSpacing: "0.12em" }}>NEXT</span>}
                      </div>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{c.Location.locality}, {c.Location.country}</div>
                    </div>
                    {race && <span style={{ fontFamily: "var(--font-head)", fontSize: 10, color: isSel ? "var(--red)" : "#444", fontWeight: 700, letterSpacing: "0.08em", flexShrink: 0 }}>R{race.round}</span>}
                  </button>
                );
              })
            }
          </div>
        )}
      </div>

      {dropOpen && <div onClick={function() { setDropOpen(false); setSearchTerm(""); }} style={{ position: "fixed", inset: 0, zIndex: 99 }} />}

      {selectedCircuit && <CircuitCard key={selected} circuit={selectedCircuit} raceInfo={selRace} isNextRace={selected === nextCircuit} />}

      <style>{`
        @keyframes circ-spin   { to { transform: rotate(360deg); } }
        @keyframes circ-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

export default Circuit;