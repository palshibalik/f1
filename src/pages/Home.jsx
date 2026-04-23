import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const TEAM_COLORS = {
  "Red Bull Racing": "#3671C6", "Red Bull": "#3671C6",
  "Ferrari": "#E8002D", "Mercedes": "#27F4D2", "McLaren": "#FF8000",
  "Aston Martin": "#229971", "Alpine F1 Team": "#FF87BC", "Alpine": "#FF87BC",
  "Williams": "#64C4FF", "RB F1 Team": "#6692FF", "RB": "#6692FF", "Racing Bulls": "#6692FF",
  "Kick Sauber": "#52E252", "Sauber": "#52E252", "Haas F1 Team": "#B6BABD", "Haas": "#B6BABD",
  "Cadillac": "#FFFFFF",
};

const CIRCUIT_IMAGES = {
  "Bahrain":          "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Bahrain%20carbon.png",
  "Jeddah":           "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Saudi%20Arabia%20carbon.png",
  "Albert Park":      "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Australia%20carbon.png",
  "Suzuka":           "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Japan%20carbon.png",
  "Shanghai":         "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/China%20carbon.png",
  "Miami":            "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Miami%20carbon.png",
  "Imola":            "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Emilia%20Romagna%20carbon.png",
  "Monaco":           "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Monaco%20carbon.png",
  "Montreal":         "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Canada%20carbon.png",
  "Barcelona":        "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Spain%20carbon.png",
  "Spielberg":        "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Austria%20carbon.png",
  "Silverstone":      "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Great%20Britain%20carbon.png",
  "Budapest":         "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Hungary%20carbon.png",
  "Spa-Francorchamps":"https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Belgium%20carbon.png",
  "Zandvoort":        "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Netherlands%20carbon.png",
  "Monza":            "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Italy%20carbon.png",
  "Baku":             "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Azerbaijan%20carbon.png",
  "Marina Bay":       "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Singapore%20carbon.png",
  "Austin":           "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/USA%20carbon.png",
  "Mexico City":      "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Mexico%20carbon.png",
  "São Paulo":        "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Brazil%20carbon.png",
  "Las Vegas":        "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Las%20Vegas%20carbon.png",
  "Lusail":           "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Qatar%20carbon.png",
  "Yas Marina":       "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Abu%20Dhabi%20carbon.png",
};

const CIRCUIT_SHORT_NAME = {
  bahrain:"Bahrain", jeddah:"Jeddah", albert_park:"Albert Park", suzuka:"Suzuka",
  shanghai:"Shanghai", miami:"Miami", imola:"Imola", monaco:"Monaco", villeneuve:"Montreal",
  catalunya:"Barcelona", red_bull_ring:"Spielberg", silverstone:"Silverstone",
  hungaroring:"Budapest", spa:"Spa-Francorchamps", zandvoort:"Zandvoort", monza:"Monza",
  baku:"Baku", marina_bay:"Marina Bay", americas:"Austin", rodriguez:"Mexico City",
  interlagos:"São Paulo", vegas:"Las Vegas", losail:"Lusail", yas_marina:"Yas Marina",
};

const DRIVER_PHOTOS = {
  max_verstappen:{ primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/verstappen.png", fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Max_Verstappen_2022_%28cropped%29.jpg/120px-Max_Verstappen_2022_%28cropped%29.jpg" },
  leclerc:       { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/leclerc.png",    fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Charles_Leclerc_2019.jpg/120px-Charles_Leclerc_2019.jpg" },
  norris:        { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/norris.png",     fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Lando_Norris_2023_%28cropped%29.jpg/120px-Lando_Norris_2023_%28cropped%29.jpg" },
  russell:       { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/russell.png",    fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/George_Russell_%282022%29.jpg/120px-George_Russell_%282022%29.jpg" },
  hamilton:      { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/hamilton.png",   fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Lewis_Hamilton_2016_Malaysia_2.jpg/120px-Lewis_Hamilton_2016_Malaysia_2.jpg" },
  piastri:       { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/piastri.png",    fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Oscar_Piastri_2023.jpg/120px-Oscar_Piastri_2023.jpg" },
  sainz:         { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/sainz.png",      fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Carlos_Sainz_Jr._2022_%28cropped%29.jpg/120px-Carlos_Sainz_Jr._2022_%28cropped%29.jpg" },
  alonso:        { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/alonso.png",     fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Fernando_Alonso_2018.jpg/120px-Fernando_Alonso_2018.jpg" },
  albon:         { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/albon.png",      fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Alex_Albon_2022.jpg/120px-Alex_Albon_2022.jpg" },
  tsunoda:       { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/tsunoda.png",    fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Yuki_Tsunoda_2023.jpg/120px-Yuki_Tsunoda_2023.jpg" },
  hulkenberg:    { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/hulkenberg.png", fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Nico_H%C3%BClkenberg_2023_%28cropped%29.jpg/120px-Nico_H%C3%BClkenberg_2023_%28cropped%29.jpg" },
  stroll:        { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/stroll.png",     fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Lance_Stroll_2022.jpg/120px-Lance_Stroll_2022.jpg" },
  bearman:       { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/bearman.png",    fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Oliver_Bearman_2024_Bahrain_%28cropped%29.jpg/120px-Oliver_Bearman_2024_Bahrain_%28cropped%29.jpg" },
  antonelli:     { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/antonelli.png",  fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Andrea_Kimi_Antonelli_2024_%28cropped%29.jpg/120px-Andrea_Kimi_Antonelli_2024_%28cropped%29.jpg" },
  lawson:        { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/lawson.png",     fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Liam_Lawson_2023.jpg/120px-Liam_Lawson_2023.jpg" },
  hadjar:        { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/hadjar.png",     fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Isack_Hadjar_2023.jpg/120px-Isack_Hadjar_2023.jpg" },
  bortoleto:     { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/bortoleto.png",  fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Gabriel_Bortoleto_2023.jpg/120px-Gabriel_Bortoleto_2023.jpg" },
  doohan:        { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/doohan.png",     fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Jack_Doohan_2023.jpg/120px-Jack_Doohan_2023.jpg" },
  gasly:         { primary:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/gasly.png",      fallback:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Pierre_Gasly_2023.jpg/120px-Pierre_Gasly_2023.jpg" },
  colapinto:     { primary:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Franco_Colapinto_2024_%28cropped%29.jpg/120px-Franco_Colapinto_2024_%28cropped%29.jpg", fallback:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/colapinto.png" }, // F1 CDN 404 — Wikipedia used as primary
};

// ── Session helpers ───────────────────────────────────────────────────────────
const SESSION_DURATION = {
  fp1:3600000, fp2:3600000, fp3:3600000,
  sq:3600000, sprint:5400000,
  quali:4500000,
  race:10800000,
};
const LINEUP_OFFSET_MS = 5 * 60 * 1000; // 5 min before session → show grid

function buildSessionList(race) {
  if (!race) return [];
  const out = [];
  const add = (key, label, dateStr, timeStr) => {
    if (!dateStr) return;
    // Strip any existing Z then re-add — always UTC
    const iso = `${dateStr}T${(timeStr||"00:00:00").replace("Z","")}Z`;
    const ms = new Date(iso).getTime();
    if (!isNaN(ms)) out.push({ key, label, ms, iso });
  };
  add("fp1",    "Practice 1",   race.FirstPractice?.date,    race.FirstPractice?.time);
  add("fp2",    "Practice 2",   race.SecondPractice?.date,   race.SecondPractice?.time);
  add("fp3",    "Practice 3",   race.ThirdPractice?.date,    race.ThirdPractice?.time);
  add("sq",     "Sprint Quali", race.SprintQualifying?.date, race.SprintQualifying?.time);
  add("sprint", "Sprint",       race.Sprint?.date,           race.Sprint?.time);
  add("quali",  "Qualifying",   race.Qualifying?.date,       race.Qualifying?.time);
  add("race",   "Race",         race.date,                   race.time);
  return out.sort((a, b) => a.ms - b.ms);
}

function computePhase(sessionList) {
  if (!sessionList?.length) return { phase:"before", active:null };
  const now = Date.now();
  for (const s of sessionList) {
    const end = s.ms + (SESSION_DURATION[s.key] || 7200000);
    if (now >= s.ms && now <= end) return { phase:"live", active:s };
  }
  for (const s of sessionList) {
    if (now >= s.ms - LINEUP_OFFSET_MS && now < s.ms) return { phase:"lineup", active:s };
  }
  // "after" window: 24h for race, 3h for other sessions
  for (const s of [...sessionList].reverse()) {
    const dur = SESSION_DURATION[s.key] || 7200000;
    const end = s.ms + dur;
    const afterWindow = s.key === "race" ? 24*3600000 : 3*3600000;
    if (now > end && now <= end + afterWindow) return { phase:"after", active:s };
  }
  const next = sessionList.find(s => s.ms > now);
  if (next) return { phase:"before", active:next };
  return { phase:"after", active:sessionList[sessionList.length-1] };
}

// ── Winner persistence ────────────────────────────────────────────────────────
const WINNER_KEY = "f1hq_winner_v2";
function saveWinner(data) {
  try { localStorage.setItem(WINNER_KEY, JSON.stringify({ ...data, savedAt:Date.now() })); } catch { /* ignore */ }
}
function loadWinner() {
  try {
    const raw = localStorage.getItem(WINNER_KEY);
    if (!raw) return null;
    const w = JSON.parse(raw);
    if (Date.now() - w.savedAt > 7*24*3600000) { localStorage.removeItem(WINNER_KEY); return null; }
    return w;
  } catch { return null; }
}
function clearWinnerIfStale(round) {
  try {
    const raw = localStorage.getItem(WINNER_KEY);
    if (!raw) return;
    const w = JSON.parse(raw);
    if (w.round && String(w.round) !== String(round)) localStorage.removeItem(WINNER_KEY);
  } catch { /* ignore */ }
}

// ── Fetch with timeout — prevents infinite loading spinner on slow APIs ───────
async function fetchJSON(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers = {};
    const key = import.meta.env.VITE_OPENF1_API_KEY;
    if (key && url.includes("openf1.org")) headers["Authorization"] = `Bearer ${key}`;
    const res = await fetch(url, { signal: ctrl.signal, headers });
    clearTimeout(tid);
    
    if (res.status === 429) {
      const err = new Error("Rate limit reached");
      err.code = "RATE_LIMITED";
      throw err;
    }

    if (!res.ok) {
      if(res.status === 401 || res.status === 403) throw new Error("RESTRICTED_LIVE_API_ACCESS");
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  } catch (e) {
    clearTimeout(tid);
    throw e;
  }
}

// ── Smart Countdown ───────────────────────────────────────────────────────────
function SmartCountdown({ targetDate, compact = false }) {
  const [tick, setTick] = useState({});
  useEffect(() => {
    function calc() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTick({ value:0, unit:"GO", label:"" }); return; }
      const s = Math.floor(diff/1000);
      const d = Math.floor(s/86400), h = Math.floor(s/3600), m = Math.floor(s/60);
      if (d>=1)      setTick({ value:d, unit:d===1?"DAY":"DAYS",       label:"until session" });
      else if (h>=1) setTick({ value:h, unit:h===1?"HOUR":"HOURS",     label:"until session" });
      else if (m>=1) setTick({ value:m, unit:m===1?"MINUTE":"MINUTES", label:"until session" });
      else           setTick({ value:s, unit:s===1?"SECOND":"SECONDS", label:"until session" });
    }
    calc();
     const id = setInterval(() => { if (new Date(targetDate).getTime() - Date.now() > 0) calc(); else clearInterval(id); }, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!tick.unit) return null;
  if (compact) return (
    <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
      <span style={{ fontFamily:"var(--font-head)", fontSize:22, fontWeight:900, color:"var(--text)" }}>{String(tick.value).padStart(2,"0")}</span>
      <span style={{ fontFamily:"var(--font-head)", fontSize:9, fontWeight:700, letterSpacing:"0.2em", color:"var(--red)", textTransform:"uppercase" }}>{tick.unit}</span>
    </div>
  );
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
      <div style={{ fontFamily:"var(--font-head)", fontSize:"clamp(90px,13vw,148px)", fontWeight:900, lineHeight:1, color:"var(--text)", letterSpacing:"-0.02em", animation:tick.unit==="GO"?"none":"cd-pulse 1s ease infinite" }}>
        {String(tick.value).padStart(tick.value>=100?3:2,"0")}
      </div>
      <div style={{ fontFamily:"var(--font-head)", fontSize:16, fontWeight:700, letterSpacing:"0.35em", textTransform:"uppercase", color:"var(--red)" }}>{tick.unit}</div>
      {tick.label && <div style={{ fontSize:13, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--text-muted)", marginTop:4 }}>{tick.label}</div>}
    </div>
  );
}

// ── Driver Photo ──────────────────────────────────────────────────────────────
function DriverPhoto({ driverId, style }) {
  const sources = DRIVER_PHOTOS[driverId];
  const [src, setSrc] = useState(sources?.primary || null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [prevDriver, setPrevDriver] = useState(driverId);
  if (driverId !== prevDriver) {
    setPrevDriver(driverId);
    setSrc(sources?.primary || null);
    setUsedFallback(false);
  }
  if (!src) return (
    <div style={{ ...style, background:"#111", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ fontSize:18, opacity:0.3 }}>👤</span>
    </div>
  );
  return (
    <img src={src} alt={driverId} style={style}
      onError={() => {
        if (!usedFallback && sources?.fallback) { setUsedFallback(true); setSrc(sources.fallback); }
        else setSrc(null);
      }}
    />
  );
}

// ── Starting Grid ─────────────────────────────────────────────────────────────
function StartingGrid({ qualResults, sessionLabel }) {
  const sorted = [...(qualResults||[])].sort((a,b) => +a.position - +b.position);
  const rows = [];
  for (let i=0; i<sorted.length; i+=2) rows.push([sorted[i], sorted[i+1]]);
  return (
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",borderBottom:"1px solid var(--border)",flexShrink:0,background:"rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#39B54A",animation:"live-dot 1s ease infinite"}} />
          <span style={{fontFamily:"var(--font-head)",fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"#39B54A"}}>
            {sessionLabel || "Starting Grid"}
          </span>
        </div>
        <span style={{fontFamily:"var(--font-head)",fontSize:8,color:"var(--text-muted)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Starting Soon</span>
      </div>
      <div style={{flex:1,overflow:"auto",padding:"2px 0",scrollbarWidth:"none"}}>
        {rows.map(([left,right],ri) => {
          const lTeam = left?.Constructors?.[0]||left?.Constructor||{};
          const rTeam = right?.Constructors?.[0]||right?.Constructor||{};
          const lCol = TEAM_COLORS[lTeam.name]||"#444";
          const rCol = TEAM_COLORS[rTeam.name]||"#222";
          const isPole = ri===0;
          return (
            <div key={ri} style={{display:"flex",gap:1,padding:"0 3px",marginBottom:1}}>
              <div style={{flex:1,display:"flex",alignItems:"center",gap:5,padding:`${isPole?6:4}px 7px`,
                background:isPole?`${lCol}10`:"rgba(255,255,255,0.02)",
                borderLeft:`2px solid ${lCol}`}}>
                {left&&<>
                  <span style={{fontFamily:"var(--font-head)",fontSize:isPole?14:10,fontWeight:900,color:isPole?"#FFD700":"#444",minWidth:18,lineHeight:1}}>{ri*2+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"var(--font-head)",fontSize:isPole?11:9,fontWeight:800,textTransform:"uppercase",color:isPole?"var(--text)":"var(--text-muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {left?.Driver?.code||left?.Driver?.familyName?.slice(0,3).toUpperCase()}
                    </div>
                    {(left?.Q3||left?.Q2||left?.Q1)&&<div style={{fontSize:7,color:"#444",fontFamily:"var(--font-head)"}}>{left.Q3||left.Q2||left.Q1}</div>}
                  </div>
                </>}
              </div>
              <div style={{flex:1,display:"flex",alignItems:"center",gap:5,padding:"4px 7px",marginTop:5,
                background:"rgba(255,255,255,0.015)",borderLeft:`2px solid ${rCol}`}}>
                {right&&<>
                  <span style={{fontFamily:"var(--font-head)",fontSize:10,fontWeight:900,color:"#333",minWidth:18,lineHeight:1}}>{ri*2+2}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"var(--font-head)",fontSize:9,fontWeight:800,textTransform:"uppercase",color:"var(--text-muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {right?.Driver?.code||right?.Driver?.familyName?.slice(0,3).toUpperCase()}
                    </div>
                    {(right?.Q3||right?.Q2||right?.Q1)&&<div style={{fontSize:7,color:"#333",fontFamily:"var(--font-head)"}}>{right.Q3||right.Q2||right.Q1}</div>}
                  </div>
                </>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Live Track View ───────────────────────────────────────────────────────────
function LiveTrackView({ circuitShortName, positions, drivers, intervals, laps, expanded, onExpand, onNavigate, sessionName, apiRestricted, isRaceDay }) {
  const canvasRef    = useRef(null);
  const rafRef       = useRef(null);
  const carPosRef    = useRef({});
  const dotPosRef    = useRef({});
  const [imgLoaded,  setImgLoaded]  = useState(false);
  const [imgFailed,  setImgFailed]  = useState(false);
  const [tooltip,    setTooltip]    = useState(null);
  const imgUrl = CIRCUIT_IMAGES[circuitShortName];

  const sortedCars = useMemo(() => {
    const latest = {};
    (positions||[]).forEach(p => { if (!latest[p.driver_number]||p.date>latest[p.driver_number].date) latest[p.driver_number]=p; });
    return Object.values(latest).sort((a,b)=>a.position-b.position);
  }, [positions]);

  const driverMap = useMemo(() => {
    const m={};(drivers||[]).forEach(d=>{m[d.driver_number]=d;});return m;
  }, [drivers]);

  const latestInterval = useMemo(() => {
    const m={};(intervals||[]).forEach(iv=>{if(!m[iv.driver_number]||iv.date>m[iv.driver_number].date)m[iv.driver_number]=iv;});return m;
  }, [intervals]);

  const latestLap = useMemo(() => {
    const m={};(laps||[]).forEach(l=>{if(!m[l.driver_number]||l.lap_number>m[l.driver_number].lap_number)m[l.driver_number]=l;});return m;
  }, [laps]);

  // Feed fresh data into rAF loop via refs — loop never needs to restart for data updates
  const carsRef   = useRef(sortedCars);
  const dMapRef   = useRef(driverMap);
  useEffect(()=>{carsRef.current=sortedCars;},[sortedCars]);
  useEffect(()=>{dMapRef.current=driverMap;},[driverMap]);

  // Canvas starts as soon as image loads OR errors OR there is no image at all
  const canvasReady = imgLoaded || imgFailed || !imgUrl;

  useEffect(()=>{
    const cv=canvasRef.current; if(!cv||!canvasReady)return;
    function getXYBounds(cars){
      const xs=cars.map(c=>c.x).filter(v=>v!=null),ys=cars.map(c=>c.y).filter(v=>v!=null);
      if(!xs.length)return null;
      return{minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
    }
    function frame(){
      const cars=carsRef.current, dMap=dMapRef.current;
      const dpr=Math.min(window.devicePixelRatio||1,2),W=cv.offsetWidth,H=cv.offsetHeight||220;
      if(cv.width!==W*dpr||cv.height!==H*dpr){cv.width=W*dpr;cv.height=H*dpr;}
      const ctx=cv.getContext("2d");
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
      const n=cars.length||1,bounds=getXYBounds(cars),pad=28;
      const alive=new Set(cars.map(c=>c.driver_number));
      Object.keys(carPosRef.current).forEach(k=>{if(!alive.has(+k))delete carPosRef.current[k];});
      Object.keys(dotPosRef.current).forEach(k=>{if(!alive.has(+k))delete dotPosRef.current[k];});
      cars.forEach((pos,idx)=>{
        const dNum=pos.driver_number,driver=dMap[dNum],col=driver?.team_colour?`#${driver.team_colour}`:"#888";
        let tx,ty;
        if(bounds&&pos.x!=null&&pos.y!=null){
          const bw=bounds.maxX-bounds.minX||1,bh=bounds.maxY-bounds.minY||1;
          const sc=Math.min((W-pad*2)/bw,(H-pad*2)/bh);
          tx=pos.x*sc+pad+(W-pad*2-bw*sc)/2-bounds.minX*sc;
          ty=pos.y*sc+pad+(H-pad*2-bh*sc)/2-bounds.minY*sc;
        }else{
          const a=-Math.PI/2+(idx/n)*Math.PI*2;
          tx=W*.5+Math.cos(a)*W*.32;ty=H*.48+Math.sin(a)*H*.28;
        }
        if(!carPosRef.current[dNum])carPosRef.current[dNum]={x:tx,y:ty};
        carPosRef.current[dNum].x+=(tx-carPosRef.current[dNum].x)*.08;
        carPosRef.current[dNum].y+=(ty-carPosRef.current[dNum].y)*.08;
        const{x,y}=carPosRef.current[dNum];
        dotPosRef.current[dNum]={x,y,idx,driver,pos};
        const isL=idx===0,r=isL?7:5;
        if(isL){const g=ctx.createRadialGradient(x,y,0,x,y,20);g.addColorStop(0,col+"55");g.addColorStop(1,"transparent");ctx.beginPath();ctx.arc(x,y,16,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();}
        ctx.beginPath();ctx.arc(x+1,y+1,r,0,Math.PI*2);ctx.fillStyle="rgba(0,0,0,.7)";ctx.fill();
        ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
        ctx.beginPath();ctx.arc(x,y,r+2,0,Math.PI*2);ctx.strokeStyle=col+"55";ctx.lineWidth=1.5;ctx.stroke();
        if(expanded||idx<3){const a=driver?.name_acronym||`${dNum}`,bw2=a.length*5+6,bx=x+r+2,by=y-5;ctx.fillStyle="rgba(0,0,0,.85)";ctx.fillRect(bx,by,bw2,10);ctx.fillStyle=isL?"#FFD700":"#aaa";ctx.font="bold 7px 'Barlow Condensed',monospace";ctx.textAlign="left";ctx.fillText(a,bx+3,by+8);}
      });
      if(cars[0]){const l=dMap[cars[0].driver_number];if(l){ctx.font="bold 9px 'Barlow Condensed',monospace";ctx.fillStyle="#FFD70099";ctx.textAlign="left";ctx.fillText(`P1 ${l.name_acronym||""}`,8,H-8);}}
      rafRef.current=requestAnimationFrame(frame);
    }
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    rafRef.current=requestAnimationFrame(frame);
    return()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);};
  },[canvasReady,expanded]); // stable — data flows through refs

  function handleMouseMove(e){
    const cv=canvasRef.current;if(!cv)return;
    const rect=cv.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;
    let found=null;
    for(const[dNum,dot]of Object.entries(dotPosRef.current)){
      const dx=mx-dot.x,dy=my-dot.y;
      if(dx*dx+dy*dy<196){found={dNum,dot,px:e.clientX,py:e.clientY};break;}
    }
    if(found){
      const{dNum,dot,px,py}=found,d=dot.driver;
      const iv=latestInterval[+dNum],lp=latestLap[+dNum];
      const gap=iv?.gap_to_leader!=null?(iv.gap_to_leader===0?"Leader":`+${iv.gap_to_leader}s`):"—";
      const spd=lp?.i1_speed||lp?.i2_speed||lp?.st_speed||"—";
      const lapNum=lp?.lap_number||dot.pos?.lap_number||"—";
      setTooltip({name:d?.full_name||d?.name_acronym||dNum,lap:lapNum,speed:spd,gap,col:d?.team_colour?`#${d.team_colour}`:"#888",x:px,y:py});
    }else setTooltip(null);
  }

  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px 6px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"var(--red)",animation:"live-dot 1s ease infinite"}}/>
          <span style={{fontFamily:"var(--font-head)",fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--red)"}}>{sessionName||"Session"} Live</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {sortedCars.length>0&&<span style={{fontFamily:"var(--font-head)",fontSize:9,color:"var(--text-muted)",letterSpacing:"0.1em"}}>{sortedCars.length} cars</span>}
          <button onClick={onExpand} style={{background:"none",border:"1px solid var(--border)",color:"var(--text-muted)",fontFamily:"var(--font-head)",fontSize:8,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",padding:"3px 7px",cursor:"pointer"}}>{expanded?"COLLAPSE":"EXPAND"}</button>
          <button onClick={onNavigate} style={{background:"var(--red)",border:"none",color:"#fff",fontFamily:"var(--font-head)",fontSize:8,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",padding:"3px 7px",cursor:"pointer"}}>FULL LIVE ↗</button>
        </div>
      </div>
      <div style={{flex:1,position:"relative",overflow:"hidden",background:"#050505"}}>
        {imgUrl&&<img src={imgUrl} alt={circuitShortName} onLoad={()=>setImgLoaded(true)} onError={()=>setImgFailed(true)} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",padding:16,filter:"brightness(.55) contrast(1.1) saturate(0)",mixBlendMode:"lighten",pointerEvents:"none"}}/>}
        <canvas ref={canvasRef} onMouseMove={handleMouseMove} onMouseLeave={()=>setTooltip(null)} style={{position:"absolute",inset:0,width:"100%",height:"100%",display:"block",cursor:"crosshair"}}/>
        {sortedCars.length===0&&!apiRestricted&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}><div style={{width:24,height:24,border:"2px solid #222",borderTopColor:"var(--red)",borderRadius:"50%",animation:"spin .8s linear infinite"}}/><span style={{fontFamily:"var(--font-head)",fontSize:9,color:"var(--text-muted)",letterSpacing:"0.15em",textTransform:"uppercase"}}>Fetching positions…</span></div>}
        {sortedCars.length===0&&apiRestricted&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8, textAlign:"center", padding:20, background:"rgba(0,0,0,0.5)"}}><span style={{fontSize:24}}>🔒</span><span style={{fontFamily:"var(--font-head)",fontSize:11,color:"var(--red)",fontWeight:900,letterSpacing:"0.1em",textTransform:"uppercase"}}>{isRaceDay ? "Session is Live" : "Live Data Restricted"}</span><span style={{fontSize:9,color:"var(--text-muted)",lineHeight:1.4}}>{isRaceDay ? "F1 session is currently in progress. API access is restricted until it ends. data will update automatically afterwards." : "OpenF1 API requires authentication during live sessions. Full data loads once session ends."}</span></div>}
        {expanded&&sortedCars.length>0&&<div style={{position:"absolute",right:0,top:0,bottom:0,width:90,background:"rgba(0,0,0,.85)",overflowY:"auto",borderLeft:"1px solid #111"}}>{sortedCars.map((pos,idx)=>{const d=driverMap[pos.driver_number],col=d?.team_colour?`#${d.team_colour}`:"#555";return(<div key={pos.driver_number} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 6px",borderBottom:"1px solid #0a0a0a"}}><span style={{fontFamily:"var(--font-head)",fontSize:10,fontWeight:900,color:idx===0?"var(--red)":"#555",minWidth:16}}>{idx+1}</span><div style={{width:3,height:16,background:col,flexShrink:0}}/><span style={{fontFamily:"var(--font-head)",fontSize:9,fontWeight:700,color:"var(--text-mid)",textTransform:"uppercase"}}>{d?.name_acronym||pos.driver_number}</span></div>);})}</div>}
      </div>
      {tooltip&&<div style={{position:"fixed",left:tooltip.x+14,top:tooltip.y-8,zIndex:9999,background:"rgba(4,4,4,.97)",border:`1px solid ${tooltip.col}`,borderLeft:`3px solid ${tooltip.col}`,padding:"7px 11px",pointerEvents:"none",fontFamily:"var(--font-head)",fontSize:10,lineHeight:1.8,letterSpacing:"0.04em",boxShadow:"0 4px 20px rgba(0,0,0,.9)"}}><div style={{fontWeight:800,color:tooltip.col,textTransform:"uppercase",marginBottom:2}}>{tooltip.name}</div><div style={{color:"#888"}}>Lap <span style={{color:"#ccc"}}>{tooltip.lap}</span></div><div style={{color:"#888"}}>Speed <span style={{color:"#ccc"}}>{tooltip.speed}{tooltip.speed!=="—"?" km/h":""}</span></div><div style={{color:"#888"}}>Gap <span style={{color:tooltip.gap==="Leader"?"#FFD700":"#ccc"}}>{tooltip.gap}</span></div></div>}
    </div>
  );
}

// ── Winner Card ───────────────────────────────────────────────────────────────
function WinnerCard({ winner, nextSessionISO, nextSessionLabel }) {
  const col = TEAM_COLORS[winner.teamName] || "#FFD700";
  const parts = (winner.driverName||"").split(" ");
  const surname=parts[parts.length-1]?.toUpperCase(), forename=parts.slice(0,-1).join(" ")?.toUpperCase();
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:16,background:`radial-gradient(ellipse at 50% 20%, ${col}22 0%, transparent 65%)`}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <div style={{width:24,height:24,background:col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🏆</div>
        <span style={{fontFamily:"var(--font-head)",fontSize:9,fontWeight:700,letterSpacing:"0.35em",textTransform:"uppercase",color:"#FFD700"}}>Race Winner</span>
      </div>
      <div style={{width:80,height:80,borderRadius:"50%",overflow:"hidden",border:`2px solid ${col}`,marginBottom:10,flexShrink:0}}>
        <DriverPhoto driverId={winner.driverId} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
      </div>
      <div style={{textAlign:"center",marginBottom:8}}>
        <div style={{fontFamily:"var(--font-head)",fontSize:10,letterSpacing:"0.2em",color:col+"88",textTransform:"uppercase",lineHeight:1}}>{forename}</div>
        <div style={{fontFamily:"var(--font-head)",fontSize:28,fontWeight:900,color:col,letterSpacing:"0.04em",lineHeight:1}}>{surname}</div>
        <div style={{fontSize:9,color:col+"77",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:3}}>{winner.teamName}</div>
        {winner.raceName&&<div style={{fontSize:8,color:"var(--text-muted)",letterSpacing:"0.08em",textTransform:"uppercase",marginTop:2}}>{winner.raceName}</div>}
      </div>
      {nextSessionISO&&(
        <>
          <div style={{display:"flex",alignItems:"center",gap:8,margin:"8px 0 4px"}}>
            <div style={{width:16,height:1,background:col+"44"}}/>
            {/* fixed: was color:"#222" — invisible on dark theme */}
            <span style={{fontSize:8,color:"var(--text-muted)",letterSpacing:"0.2em",textTransform:"uppercase"}}>{nextSessionLabel||"next session"}</span>
            <div style={{width:16,height:1,background:col+"44"}}/>
          </div>
          <SmartCountdown targetDate={nextSessionISO}/>
        </>
      )}
    </div>
  );
}

// ── Race Phase Widget ─────────────────────────────────────────────────────────
function RacePhaseWidget() {
  const navigate=useNavigate();
  const [phase,        setPhase]        = useState("loading");
  const [sessions,     setSessions]     = useState([]);
  const [activeSession,setActiveSession]= useState(null);
  const [nextRace,     setNextRace]     = useState(null);
  const [qualResults,  setQualResults]  = useState(null);
  const [winner,       setWinner]       = useState(()=>{try{return loadWinner();}catch{return null;}});
  const [expanded,     setExpanded]     = useState(false);
  const [livePositions,setLivePositions]= useState([]);
  const [liveDrivers,  setLiveDrivers]  = useState([]);
  const [liveSession,  setLiveSession]  = useState(null);
  const [liveIntervals,setLiveIntervals]= useState([]);
  const [liveLaps,     setLiveLaps]     = useState([]);
  const [apiRestricted,setApiRestricted]= useState(false);
  const [isRateLimited,setIsRateLimited]= useState(false);
  const visibleRef = useRef(true);
  const mountedRef = useRef(true);
  // Stores the exact ms when the last race ended — used by interval + live poll
  // to reliably detect the 24h post-race window regardless of session list contents
  const lastRaceEndMsRef = useRef(null);

  useEffect(()=>{ mountedRef.current=true; return()=>{mountedRef.current=false;}; },[]);

  useEffect(()=>{
    const h=()=>{visibleRef.current=!document.hidden;};
    document.addEventListener("visibilitychange",h);
    return()=>document.removeEventListener("visibilitychange",h);
  },[]);

  // Fetch winner from OpenF1 — named to avoid variable shadowing
  const fetchOpenF1Winner = useCallback(async(race)=>{
    try{
      const openSessions = await fetchJSON(`https://api.openf1.org/v1/sessions?session_type=Race&year=${race.season}`);
      const latestSess   = openSessions?.[openSessions.length-1];
      if(!latestSess)return;
      const posList      = await fetchJSON(`https://api.openf1.org/v1/position?session_key=${latestSess.session_key}`);
      const latest={};
      (posList||[]).forEach(p=>{if(!latest[p.driver_number]||p.date>latest[p.driver_number].date)latest[p.driver_number]=p;});
      const p1=Object.values(latest).find(p=>p.position===1);
      if(!p1)return;
      const drvList = await fetchJSON(`https://api.openf1.org/v1/drivers?session_key=${latestSess.session_key}&driver_number=${p1.driver_number}`);
      const drv     = drvList?.[0];
      if(!drv)return;
      const acronym  = drv.name_acronym?.toLowerCase();
      const driverId = Object.keys(DRIVER_PHOTOS).find(k=>k.includes(acronym))||acronym;
      const w={driverName:drv.full_name||drv.name_acronym,driverId,teamName:drv.team_name||"",raceName:race.raceName,round:race.round};
      if(!mountedRef.current)return;
      setWinner(w);saveWinner(w);
    }catch(e){console.warn("OpenF1 winner fetch failed:",e);}
  },[]);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(()=>{
    // Hard cap: if init takes >12s for any reason, escape "loading" phase
    const escapeTid = setTimeout(()=>{
      if(mountedRef.current) setPhase(prev => prev==="loading" ? "before" : prev);
    }, 12000);

    async function init(){
      try{
        // Fetch both in parallel — next for upcoming, last for post-race window
        const [nextData, lastData] = await Promise.allSettled([
          fetchJSON("https://api.jolpi.ca/ergast/f1/current/next.json", 6000),
          fetchJSON("https://api.jolpi.ca/ergast/f1/current/last.json", 6000),
        ]);

        const nextRaceData = nextData.status === "fulfilled"
          ? nextData.value?.MRData?.RaceTable?.Races?.[0] : null;
        const lastRaceData = lastData.status === "fulfilled"
          ? lastData.value?.MRData?.RaceTable?.Races?.[0] : null;

        // Check if we are within 24h after the last race ended
        const RACE_DURATION_MS = SESSION_DURATION.race; // 3h
        const lastRaceMs = lastRaceData
          ? new Date(`${lastRaceData.date}T${(lastRaceData.time||"12:00:00").replace("Z","")}Z`).getTime()
          : null;
        const lastRaceEndMs = lastRaceMs ? lastRaceMs + RACE_DURATION_MS : null;
        const msSinceLastRace = lastRaceEndMs ? Date.now() - lastRaceEndMs : Infinity;
        const isPostRaceWindow = msSinceLastRace >= 0 && msSinceLastRace < 24*3600000;

        // Store in ref so interval + live poll can use it without re-running effects
        if (lastRaceEndMs) lastRaceEndMsRef.current = lastRaceEndMs;

        // Use last race data when in post-race window, otherwise use next race
        const race = isPostRaceWindow ? lastRaceData : (nextRaceData || lastRaceData);

        if(!race){if(mountedRef.current)setPhase("before");clearTimeout(escapeTid);return;}
        if(!mountedRef.current)return;

        clearTimeout(escapeTid);
        setNextRace(race);

        // Only clear winner if this is a different round AND we're not in post-race window
        // (prevents clearing winner when next.json rolls over to new race)
        if (!isPostRaceWindow) clearWinnerIfStale(race.round);

        const sessionList = buildSessionList(race);
        setSessions(sessionList);

        // In post-race window: force "after" phase with race session as active
        let p, active;
        if (isPostRaceWindow) {
          p = "after";
          active = sessionList.find(s => s.key === "race") || sessionList[sessionList.length - 1];
        } else {
          const computed = computePhase(sessionList);
          p = computed.phase;
          active = computed.active;
        }
        setPhase(p);
        setActiveSession(active);

        // Fetch quali + sprint results non-blocking (don't await — widget shows immediately)
        Promise.allSettled([
          fetchJSON(`https://api.jolpi.ca/ergast/f1/${race.season}/${race.round}/qualifying.json`),
          fetchJSON(`https://api.jolpi.ca/ergast/f1/${race.season}/${race.round}/sprint.json`),
        ]).then(([qRes,sRes])=>{
          const quali  = qRes.status==="fulfilled" ? qRes.value?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults  : null;
          const sprint = sRes.status==="fulfilled" ? sRes.value?.MRData?.RaceTable?.Races?.[0]?.SprintResults      : null;
          if((quali?.length||sprint?.length)&&mountedRef.current)
            setQualResults({quali:quali||[],sprint:sprint||[]});
        });

        // Winner logic — use lastRaceData we already have, never re-fetch unnecessarily
        if(!loadWinner()){
          // Try sprint first (for current sprint weekend)
          const [sRes] = await Promise.allSettled([
            fetchJSON(`https://api.jolpi.ca/ergast/f1/${race.season}/${race.round}/sprint.json`),
          ]);
          const sprint = sRes.status==="fulfilled" ? sRes.value?.MRData?.RaceTable?.Races?.[0] : null;

          if (sprint?.SprintResults?.[0] && mountedRef.current) {
            const s0 = sprint.SprintResults[0];
            const w = {
              driverName: `${s0.Driver.givenName} ${s0.Driver.familyName}`,
              driverId: s0.Driver.driverId,
              teamName: s0.Constructor.name,
              raceName: `${sprint.raceName} (Sprint)`,
              round: sprint.round
            };
            setWinner(w); saveWinner(w);
          } else if (lastRaceData) {
            // Use the last race results — always fetch results for the lastRaceData round
            try {
              const resultsData = await fetchJSON(
                `https://api.jolpi.ca/ergast/f1/${lastRaceData.season}/${lastRaceData.round}/results.json`, 6000
              );
              const lastRace = resultsData?.MRData?.RaceTable?.Races?.[0];
              if (lastRace?.Results?.[0] && mountedRef.current) {
                const r0 = lastRace.Results[0];
                const w = {
                  driverName: `${r0.Driver.givenName} ${r0.Driver.familyName}`,
                  driverId: r0.Driver.driverId,
                  teamName: r0.Constructor.name,
                  raceName: lastRace.raceName,
                  round: lastRace.round
                };
                setWinner(w); saveWinner(w);
              }
            } catch(e) { console.warn("Winner results fetch:", e); }
          }
        }
      }catch(e){
        console.error("RacePhaseWidget init:",e);
        clearTimeout(escapeTid);
        if(mountedRef.current)setPhase("before");
      }
    }
    init();

    const t=setInterval(()=>{
      // Check post-race window using the authoritative ref set during init
      const endMs = lastRaceEndMsRef.current;
      const msSince = endMs ? Date.now() - endMs : Infinity;
      const inPostRace = msSince >= 0 && msSince < 24*3600000;

      if (inPostRace) {
        // Lock to "after" + race active — don't let computePhase override to "before"
        if (mountedRef.current) {
          setPhase("after");
          setSessions(prev => {
            const raceSession = prev.find(s => s.key === "race");
            if (raceSession) setActiveSession(raceSession);
            return prev;
          });
        }
        return;
      }

      setSessions(prev=>{
        if(!prev.length)return prev;
        const{phase:p,active}=computePhase(prev);
        if(mountedRef.current){
          if(!(isLiveRef2.current && p!=="live")) setPhase(p);
          setActiveSession(active);
        }
        return prev;
      });
    },5000);
    return()=>{ clearInterval(t); clearTimeout(escapeTid); };
  },[fetchOpenF1Winner]);

  // ── Live polling ────────────────────────────────────────────────────────────
  // Runs once after Ergast loads. Uses a ref to track liveness so setPhase()
  // inside the loop doesn't trigger effect restart (which would kill the loop).
  const nextRaceRef=useRef(nextRace);
  useEffect(()=>{nextRaceRef.current=nextRace;},[nextRace]);
  const isLiveRef2=useRef(false); // tracks current live state for timeout calc

  useEffect(()=>{
    // Wait until phase has been determined from Ergast before starting
    if(phase==="loading")return;

    let cancelled=false;
    let tid=null;

    async function poll(){
      if(cancelled||!mountedRef.current||isRateLimited)return;
      try{
        const now=Date.now();
        const cutoff=new Date(now-15000).toISOString();

        const fromIso=new Date(now-8*3600000).toISOString().slice(0,19);

        // Fetch latest session from OpenF1 regardless of Ergast's next race
        // to handle the case where Ergast rolls over to the next race too early
        let sess=null;
        let isRestricted = false;
        try{
          const byDate=await fetchJSON(`https://api.openf1.org/v1/sessions?date_start>=${encodeURIComponent(fromIso)}`);
          if(byDate?.length){
            const sorted=[...byDate].sort((a,b)=>new Date(b.date_start)-new Date(a.date_start));
            const openSess=sorted.find(s=>!s.date_end||new Date(s.date_end).getTime()>now);
            sess=openSess||sorted[0];
          }
        }catch(e){
          if(e.message === "RESTRICTED_LIVE_API_ACCESS") isRestricted = true;
        }
        if(!sess && !isRestricted){
          try{
            const sd=await fetchJSON("https://api.openf1.org/v1/sessions?session_key=latest");
            sess=sd?.[0]||null;
          }catch(e){
            if(e.message === "RESTRICTED_LIVE_API_ACCESS") isRestricted = true;
          }
        }

        if(isRestricted) {
          sess = { session_type: "Live Session", session_key: "RESTRICTED", date_start: new Date(now - 3600000).toISOString(), date_end: null };
        }

        // ── RACE WEEKEND GUARD ──────────────────────────────────────────────
        const nr=nextRaceRef.current;
        let withinRaceWeekend=false;
        if(nr){
          const raceMs2=new Date(nr.date+"T"+(nr.time||"12:00:00Z").replace("Z","")+"Z").getTime();
          const weekendStart=raceMs2-3.5*24*3600000;
          withinRaceWeekend=now>=weekendStart&&now<=raceMs2+4*3600000;
        }

        const sessionOpen=sess&&!sess.date_end;

        // Check post-race window first — if within 24h of last race end, don't interfere with phase
        const endMsCheck = lastRaceEndMsRef.current;
        const msSinceCheck = endMsCheck ? now - endMsCheck : Infinity;
        const inPostRaceCheck = msSinceCheck >= 0 && msSinceCheck < 24*3600000;

        // If we're not in a race weekend according to Ergast AND OpenF1 says the session is closed, back off.
        // But never override "after" phase during the 24h post-race window.
        if(!withinRaceWeekend && !sessionOpen){
          if(mountedRef.current && !inPostRaceCheck) setPhase(prev=>prev==="live"?"before":prev);
          isLiveRef2.current=false;
          if(!cancelled)tid=setTimeout(poll,5*60*1000); // 5-min idle check
          return;
        }

        let posRestricted = false;
        const posData=(sess && !isRestricted)
          ?await fetchJSON(`https://api.openf1.org/v1/position?session_key=${sess.session_key}`).catch(e=>{
            if(e.message === "RESTRICTED_LIVE_API_ACCESS") posRestricted = true;
            return [];
          })
          :[];
        if (posRestricted) isRestricted = true;
        
        if(cancelled||!mountedRef.current)return;

        const positions=posData||[];

        // Ground-truth liveness: session open (no date_end) OR positions very fresh (<3 min)
        const mostRecent=positions.reduce((b,p)=>(!b||p.date>b)?p.date:b,null);
        const posAgeSec=mostRecent?(now-new Date(mostRecent).getTime())/1000:Infinity;
        const isLiveNow=sessionOpen||(posAgeSec<180);

        isLiveRef2.current=isLiveNow;
        if(mountedRef.current){
          setApiRestricted(isRestricted);
          setPhase(prev=>{
            if(isLiveNow&&prev!=="live")return"live";
            if(!isLiveNow&&prev==="live")return"after"; // session just ended → show winner
            // Don't override "after" to anything else during post-race window
            const endMs2 = lastRaceEndMsRef.current;
            const msSince2 = endMs2 ? Date.now() - endMs2 : Infinity;
            if(prev==="after" && msSince2 >= 0 && msSince2 < 24*3600000) return "after";
            return prev;
          });
        }

        if(sess&&mountedRef.current){
          setLiveSession(sess);
          if(isLiveNow && !isRestricted){
            const[drvData,lapData,intData,locData]=await Promise.all([
              fetchJSON(`https://api.openf1.org/v1/drivers?session_key=${sess.session_key}`).catch(()=>[]),
              fetchJSON(`https://api.openf1.org/v1/laps?session_key=${sess.session_key}&lap_number=latest`).catch(()=>[]),
              fetchJSON(`https://api.openf1.org/v1/intervals?session_key=${sess.session_key}`).catch(()=>[]),
              fetchJSON(`https://api.openf1.org/v1/location?session_key=${sess.session_key}&date>=${encodeURIComponent(cutoff)}`).catch(()=>[]),
            ]);
            if(cancelled||!mountedRef.current)return;
            if(drvData?.length)setLiveDrivers(drvData);
            if(lapData?.length)setLiveLaps(lapData);
            if(intData?.length)setLiveIntervals(intData);

            const nr=nextRaceRef.current;
            if(sess.session_type==="Race"&&positions.length&&nr&&!loadWinner())
              fetchOpenF1Winner(nr);

            const locMap={};
            (locData||[]).forEach(l=>{
              const k=l.driver_number;
              if(!locMap[k]||l.date>locMap[k].date)locMap[k]=l;
            });
            setLivePositions(positions.map(p=>{
              const loc=locMap[p.driver_number];
              return loc?{...p,x:loc.x,y:loc.y}:p;
            }));
          } else {
            setLivePositions(positions);
          }
        }
        if (mountedRef.current) setIsRateLimited(false);
      }catch(e){
        if(e.code === "RATE_LIMITED") {
          if (mountedRef.current) setIsRateLimited(true);
        }
        console.warn("Live poll:",e.message);
      }

      if(!cancelled){
        tid=setTimeout(poll,isLiveRef2.current?2000:15000);
      }
    }

    poll();
    return()=>{cancelled=true;if(tid)clearTimeout(tid);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[phase==="loading",fetchOpenF1Winner]); // only restart when loading→loaded transition

  // ── Derived values ──────────────────────────────────────────────────────────
  const circuitId   = nextRace?.Circuit?.circuitId;
  const circuitName = CIRCUIT_SHORT_NAME[circuitId]||liveSession?.circuit_short_name;

  const nextUpSession = useMemo(()=>{
    if(!sessions.length)return null;
    const now=Date.now();
    return sessions.find(s=>s.ms>now)||null;
  },[sessions]);

  const gridResults = useMemo(()=>{
    if(!qualResults)return null;
    if(activeSession?.key==="sprint"&&qualResults.sprint?.length)return qualResults.sprint;
    return qualResults.quali?.length?qualResults.quali:null;
  },[qualResults,activeSession]);

  // ── Navigation logic ─────────────────────────────────────────────────────────
  // After race, wait 24h then redirect to /drivers; otherwise /next-race
  const raceEndMsForNav = lastRaceEndMsRef.current;
  const hoursAfterRace = raceEndMsForNav ? (Date.now() - raceEndMsForNav) / 3600000 : null;
  const postRaceExpired = hoursAfterRace !== null && hoursAfterRace >= 24;
  const clickDest =
    phase==="live" ? "/live" :
    (phase==="after" && activeSession?.key==="race" && postRaceExpired) ? "/drivers" :
    "/next-race";

  // ── Render ──────────────────────────────────────────────────────────────────
  if(phase==="loading")return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%"}}>
      <div style={{width:24,height:24,border:"2px solid #1a1a1a",borderTopColor:"var(--red)",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    </div>
  );

  if(phase==="live")return(
    // Live view has its own internal buttons; outer wrapper click → /live
    <div onClick={()=>navigate("/live")} style={{height:"100%",cursor:"pointer"}}>
      <LiveTrackView
        circuitShortName={circuitName}
        positions={livePositions} drivers={liveDrivers}
        intervals={liveIntervals} laps={liveLaps}
        apiRestricted={apiRestricted}
        expanded={expanded}
        onExpand={e=>{e.stopPropagation();setExpanded(v=>!v);}}
        onNavigate={()=>navigate("/live")}
        sessionName={liveSession?.session_name||activeSession?.label}
      />
    </div>
  );

  if(phase==="lineup")return(
    <div onClick={()=>navigate("/next-race")} style={{height:"100%",cursor:"pointer"}}>
      {gridResults
        ?<StartingGrid qualResults={gridResults} sessionLabel={`${activeSession?.label||"Session"} Grid`}/>
        :(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12}}>
            <div style={{fontFamily:"var(--font-head)",fontSize:10,fontWeight:700,letterSpacing:"0.25em",textTransform:"uppercase",color:"var(--red)"}}>
              {activeSession?.label||"Session"} Starting Soon
            </div>
            {activeSession?.iso&&<SmartCountdown targetDate={activeSession.iso}/>}
          </div>
        )
      }
    </div>
  );

  if(phase==="after"){
    // Race winner card — show for full 24h after race ends
    if(winner && activeSession?.key==="race") {
      // nextUpSession may be null if sessions are for the just-finished race
      // In that case use the first session of the next calendar race as countdown target
      const countdownTarget = nextUpSession || null;
      return(
        <div onClick={()=>navigate(clickDest)} style={{height:"100%",cursor:"pointer"}}>
          <WinnerCard
            winner={winner}
            nextSessionISO={countdownTarget?.iso || null}
            nextSessionLabel={countdownTarget ? `Next: ${countdownTarget.label}` : "Next Race"}
          />
        </div>
      );
    }
    // Non-race session just ended — click → /next-race
    return(
      <div onClick={()=>navigate("/next-race")} style={{display:"flex",flexDirection:"column",height:"100%",cursor:"pointer"}}>
        <div style={{padding:"12px 14px 0",flexShrink:0}}>
          <div style={{fontFamily:"var(--font-head)",fontSize:10,fontWeight:700,letterSpacing:"0.3em",textTransform:"uppercase",color:"#39B54A",textAlign:"center"}}>
            {activeSession?.label||"Session"} Complete ✓
          </div>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
          {nextUpSession?(
            <>
              <div style={{fontFamily:"var(--font-head)",fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--text-muted)"}}>
                Next: {nextUpSession.label}
              </div>
              <SmartCountdown targetDate={nextUpSession.iso}/>
            </>
          ):(
            <div style={{fontFamily:"var(--font-head)",fontSize:12,color:"var(--text-muted)",letterSpacing:"0.1em"}}>
              {nextRace?.raceName||"Weekend Complete"}
            </div>
          )}
        </div>
      </div>
    );
  }

  // "before" — show race name + next single session countdown
  const target = activeSession || nextUpSession;
  return(
    <div
      onClick={()=>navigate("/next-race")}
      style={{display:"flex",flexDirection:"column",height:"100%",cursor:"pointer"}}
      title="View Next Race details"
    >
      <div style={{padding:"12px 14px 0",flexShrink:0}}>
        {/* Race name */}
        <div style={{fontFamily:"var(--font-head)",fontSize:12,fontWeight:700,letterSpacing:"0.3em",textTransform:"uppercase",color:"var(--text-muted)",textAlign:"center"}}>
          {nextRace?nextRace.raceName:"Loading…"}
        </div>
        {/* Next session label */}
        {target&&(
          <div style={{fontFamily:"var(--font-head)",fontSize:9,fontWeight:600,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--red)",textAlign:"center",marginTop:4}}>
            {target.label}
          </div>
        )}
      </div>
      {/* Big countdown */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {target?.iso
          ?<SmartCountdown targetDate={target.iso}/>
          :<div style={{width:20,height:20,border:"2px solid #1a1a1a",borderTopColor:"var(--red)",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
        }
      </div>
      {/* Round / Country / Date footer */}
      {nextRace&&(
        <div style={{display:"flex",justifyContent:"space-around",padding:"10px 8px 12px",borderTop:"1px solid var(--border)",flexShrink:0}}>
          {[
            ["Round",   nextRace.round],
            ["Circuit", nextRace.Circuit?.Location?.country],
            ["Date",    new Date(nextRace.date+"T00:00:00Z").toLocaleDateString("en-GB",{day:"numeric",month:"short"})],
          ].map(([k,v])=>(
            <div key={k} style={{textAlign:"center"}}>
              <div style={{fontSize:10,color:"var(--text-muted)",letterSpacing:"0.1em",textTransform:"uppercase"}}>{k}</div>
              <div style={{fontFamily:"var(--font-head)",fontSize:18,fontWeight:800,color:"var(--text-mid)",marginTop:2}}>{v||"—"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────
function Home(){
  const[si,setSi]=useState(null);

  useEffect(()=>{
    async function loadSi(){
      try{
        // Two parallel calls — next race for year/round, standings for driver count
        const[nextRes,standRes]=await Promise.allSettled([
          fetchJSON("https://api.jolpi.ca/ergast/f1/current/next.json"),
          fetchJSON("https://api.jolpi.ca/ergast/f1/current/driverstandings.json"),
        ]);

        let year=new Date().getFullYear(), currentRound=0, totalRounds="—", driverCount=20;

        if(nextRes.status==="fulfilled"){
          const nr=nextRes.value?.MRData?.RaceTable?.Races?.[0];
          if(nr){
            year=nr.season;
            // rounds completed = next race's round number minus 1
            currentRound=Math.max(0,parseInt(nr.round,10)-1);
          }
        }

        if(standRes.status==="fulfilled"){
          const sd=standRes.value?.MRData;
          const standings=sd?.StandingsTable?.StandingsLists?.[0];
          if(standings){
            driverCount=standings.DriverStandings?.length||20;
            year=standings.season||year;
            // standings.round = last completed round (more accurate than next-1)
            if(standings.round)currentRound=parseInt(standings.round,10);
          }
        }

        // Get total rounds from schedule — limit=1 is enough, total is in MRData
        fetchJSON("https://api.jolpi.ca/ergast/f1/current.json?limit=1")
          .then(d=>{
            const total=parseInt(d?.MRData?.total,10);
            if(!isNaN(total)&&total>0)setSi(prev=>prev?{...prev,totalRounds:total}:null);
          }).catch(()=>{});

        setSi({year,totalRounds,currentRound,driverCount});
      }catch(e){
        console.warn("Home si error:",e);
        setSi({year:new Date().getFullYear(),totalRounds:"—",currentRound:"—",driverCount:20});
      }
    }
    loadSi();
  },[]);

  const cards=[
    {num:"01",to:"/next-race",          title:"Next Race",          desc:"Countdown, circuit map, session schedule and race day details for the upcoming Grand Prix."},
    {num:"02",to:"/drivers",            title:"Driver Standings",   desc:"Full championship table with points, wins, and team color indicators."},
    {num:"03",to:"/driver-performance", title:"Driver Performance", desc:`Deep-dive charts — points progression, quali vs race deltas, and tyre performance for every ${si?.year??""} driver.`},
    {num:"04",to:"/lineup",             title:"Starting Grid",      desc:"Live qualifying grid with Q1/Q2/Q3 times and the official starting order for the next race."},
    {num:"05",to:"/strategy",           title:"Strategy",           desc:"Tyre degradation models, pit window analysis, and race pace data to plan or predict race strategy."},
    {num:"06",to:"/live",               title:"Live Timing",        desc:"Real-time lap times, gaps, tyre data and race control feed during sessions."},
  ];

  return(
    <div className="container">
      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:32,alignItems:"start",marginBottom:32}} className="home-hero-row">
        {/* LEFT */}
        <div className="home-hero" style={{marginBottom:0,display:"block",minHeight:120}}>
          <div className="home-hero-eyebrow" style={{fontSize:14,letterSpacing:"0.25em",marginBottom:8,display:"block"}}>
            {si?`${si.year} Season`:"Current Season"} · Live Data
          </div>
          <h1 className="home-headline" style={{fontSize:"clamp(64px,8vw,112px)",fontWeight:900,lineHeight:0.92,letterSpacing:"-0.02em",margin:"12px 0 16px"}}>
            <span className="outline">YOUR</span><br />
            FORMULA{" "}
            <span className="red">ONE</span>{" "}
            
          </h1>
          <p className="home-desc" style={{fontSize:16,lineHeight:1.7,color:"var(--text-muted)",maxWidth:520,marginTop:12}}>
            Your race weekend command center. Live standings, countdown timers,
            session schedules, and circuit data — all in one place.
          </p>
        </div>
        {/* RIGHT — clickable widget box */}
        <div
          style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderTop:"3px solid var(--red)",borderRadius:10,overflow:"hidden",display:"flex",flexDirection:"column",height:300,position:"relative",marginTop:52,transition:"box-shadow .2s,border-color .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 0 0 1px var(--red)";}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";}}
        >
          <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0,background:"radial-gradient(circle, rgba(255,255,255,.04) 1px, transparent 1px)",backgroundSize:"20px 20px"}}/>
          <div style={{flex:1,position:"relative",zIndex:1,display:"flex",flexDirection:"column"}}>
            <RacePhaseWidget/>
          </div>
        </div>
      </div>

      {si&&(
        <div style={{display:"flex",gap:"clamp(16px,4vw,48px)",alignItems:"center",padding:"16px 0 20px",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",marginBottom:48,flexWrap:"wrap",justifyContent:"space-between"}}>
          {[
            [si.year,              "Season"],
            [`R${si.currentRound}`,"Round"],
            [si.totalRounds,       "Races"],
            [si.driverCount,       "Drivers"],
          ].map(([v,l])=>(
            <div key={l} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:"1 1 0",minWidth:60}}>
              <span style={{fontFamily:"var(--font-head)",fontSize:"clamp(22px,5vw,44px)",fontWeight:900,letterSpacing:"-0.02em",color:"var(--text)",lineHeight:1}}>{v}</span>
              <span style={{fontSize:"clamp(9px,2vw,13px)",letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--text-muted)",fontWeight:600,marginTop:4,textAlign:"center"}}>{l}</span>
            </div>
          ))}
        </div>
      )}

      <div className="section-label" style={{fontSize:12,letterSpacing:"0.4em",marginBottom:24}}>Navigate</div>

      <div className="card-grid">
        {cards.map(card=>(
          <Link to={card.to} className="card" key={card.to}>
            <div className="card-num" style={{fontSize:"clamp(60px,5.5vw,84px)",fontWeight:900,lineHeight:1,letterSpacing:"-0.02em",marginBottom:18,color:"var(--text-muted)"}}>{card.num}</div>
            <h3 style={{fontSize:20,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>{card.title}</h3>
            <p style={{fontSize:14,lineHeight:1.65,color:"var(--text-muted)"}}>{card.desc}</p>
            <span className="card-arrow">↗</span>
          </Link>
        ))}
      </div>

      <style>{`
        @media(max-width:860px){.home-hero-row{grid-template-columns:1fr !important;}}
        @keyframes spin     {to{transform:rotate(360deg);}}
        @keyframes cd-pulse {0%,100%{opacity:1}50%{opacity:.82}}
        @keyframes live-dot {0%,100%{opacity:1}50%{opacity:.25}}
      `}</style>
    </div>
  );
}

export default Home;