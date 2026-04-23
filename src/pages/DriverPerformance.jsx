import { useEffect, useState, useMemo } from "react";

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

const TEAM_COLORS = {
  "McLaren":"#FF8000","Ferrari":"#E8002D","Red Bull Racing":"#3671C6","Red Bull":"#3671C6",
  "Mercedes":"#27F4D2","Aston Martin":"#229971","Alpine F1 Team":"#FF87BC","Alpine":"#FF87BC",
  "Williams":"#64C4FF","RB F1 Team":"#6692FF","Racing Bulls":"#6692FF",
  "Haas F1 Team":"#B6BABD","Haas":"#B6BABD","Kick Sauber":"#52E252","Sauber":"#52E252",
  "Cadillac":"#CC0000","Cadillac F1 Team":"#CC0000",
};
const DRIVER_IMAGES = {
  max_verstappen:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/verstappen.png",
  leclerc:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/leclerc.png",
  norris:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/norris.png",
  russell:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/russell.png",
  hamilton:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/hamilton.png",
  gasly:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/gasly.png",
  piastri:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/piastri.png",
  sainz:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/sainz.png",
  alonso:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/alonso.png",
  albon:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/albon.png",
  tsunoda:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/tsunoda.png",
  hulkenberg:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/hulkenberg.png",
  stroll:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/stroll.png",
  bearman:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/bearman.png",
  antonelli:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/antonelli.png",
  lawson:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/lawson.png",
  hadjar:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/hadjar.png",
  bortoleto:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/bortoleto.png",
  doohan:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/doohan.png",
  colapinto:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Franco_Colapinto_2024_%28cropped%29.jpg/120px-Franco_Colapinto_2024_%28cropped%29.jpg",
  perez:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/perez.png",
  bottas:"https://media.formula1.com/content/dam/fom-website/drivers/2025Drivers/bottas.png",
};

function teamColor(n) { return TEAM_COLORS[n || ""] || "#E10600"; }
function driverPhoto(id) { return DRIVER_IMAGES[id] || null; }
function posColor(p, col) {
  if (!p || p === "R") return "#E10600";
  const n = parseInt(p);
  if (n === 1) return "#FFD700";
  if (n <= 3)  return "#C0C0C0";
  if (n <= 10) return col;
  return "rgba(255,255,255,0.2)";
}
function ratingColor(r) {
  if (r === null || r === undefined) return "#444";
  if (r >= 8.5) return "#FFD700";
  if (r >= 7)   return "#39B54A";
  if (r >= 5)   return "#FF8000";
  if (r >= 3)   return "#E10600";
  return "#555";
}
function ratingLabel(r) {
  if (!r && r !== 0) return "—";
  if (r >= 9)   return "MASTERCLASS";
  if (r >= 8)   return "EXCELLENT";
  if (r >= 7)   return "STRONG";
  if (r >= 5.5) return "DECENT";
  if (r >= 4)   return "AVERAGE";
  if (r >= 2.5) return "POOR";
  return "DNF";
}
function calcRating(result, qualiPos) {
  if (!result) return null;
  const pos = result.position;
  const status = (result.status || "").toLowerCase();
  const isDNF = pos === "R" || status.includes("retired") || status.includes("accident") || status.includes("collision");
  if (isDNF) return 1.5;
  const posN = parseInt(pos);
  const pts  = parseFloat(result.points || 0);
  const qp   = qualiPos ? parseInt(qualiPos) : null;
  const delta = (qp && !isNaN(posN)) ? (qp - posN) : 0;
  const fl   = result.FastestLap && result.FastestLap.rank === "1" ? 0.5 : 0;
  const posScore = posN === 1 ? 6 : posN === 2 ? 5.2 : posN === 3 ? 4.4
    : posN <= 10 ? Math.max(1.2, 4.4 - (posN - 3) * 0.4)
    : Math.max(0.2, 1.2 - (posN - 10) * 0.1);
  const ptsScore   = Math.min((pts / 25) * 2.5, 2.5);
  const deltaScore = Math.max(-0.5, Math.min(1, delta * 0.15));
  return Math.min(10, Math.max(0, parseFloat((posScore + ptsScore + deltaScore + fl).toFixed(1))));
}

// ── Circular Arc Ring ─────────────────────────────────────────────────────────
function ArcRing({ pct, color, size, stroke, label, value, sub }) {
  const sz = size || 84;
  const st = stroke || 7;
  const r  = (sz - st) / 2;
  const circ = 2 * Math.PI * r;
  const safePct = Math.min(Math.max(pct || 0, 0), 100);
  const dash = circ * (safePct / 100);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, flex:"1 1 80px" }}>
      <div style={{ position:"relative", width:sz, height:sz }}>
        <svg width={sz} height={sz} style={{ transform:"rotate(-90deg)", position:"absolute", top:0, left:0 }}>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={st} />
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth={st}
            strokeDasharray={dash + " " + (circ - dash)} strokeLinecap="round"
            style={{ transition:"stroke-dasharray 1s ease", filter: safePct > 0 ? ("drop-shadow(0 0 5px " + color + "77)") : "none" }} />
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div style={{ fontFamily:"var(--font-head)", fontSize:sz * 0.26, fontWeight:900, color:"var(--text)", lineHeight:1 }}>{value}</div>
          {sub && <div style={{ fontFamily:"var(--font-head)", fontSize:sz * 0.11, color:color, marginTop:1, fontWeight:700 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ fontFamily:"var(--font-head)", fontSize:9, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--text-muted)", textAlign:"center" }}>{label}</div>
    </div>
  );
}

// ── Performance Rating Line Chart ─────────────────────────────────────────────
function RatingLineChart({ data, color }) {
  if (!data || !data.length) return null;
  const W = 560, H = 200, pL = 32, pR = 50, pT = 28, pB = 32;
  const iW = W - pL - pR;
  const iH = H - pT - pB;
  const points = data.map(function(d, i) {
    return {
      x: pL + (i / Math.max(data.length - 1, 1)) * iW,
      y: pT + iH - (d.rating / 10) * iH,
      d: d,
    };
  });
  var lineParts = points.map(function(p, i) { return (i === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1); });
  var lineD = lineParts.join(" ");
  var last = points[points.length - 1];
  var areaD = lineD + " L" + last.x.toFixed(1) + "," + (pT + iH).toFixed(1) + " L" + pL + "," + (pT + iH).toFixed(1) + " Z";
  var gradId = "rg" + color.replace(/[^a-z0-9]/gi, "");
  var avgR = data.reduce(function(s, d) { return s + d.rating; }, 0) / data.length;
  var avgY = pT + iH - (avgR / 10) * iH;
  var zoneData = [
    { y1: pT + iH - (4 / 10) * iH, y0: pT + iH, fill:"rgba(225,6,0,0.05)" },
    { y1: pT + iH - (6.5 / 10) * iH, y0: pT + iH - (4 / 10) * iH, fill:"rgba(255,128,0,0.05)" },
    { y1: pT + iH - (8 / 10) * iH, y0: pT + iH - (6.5 / 10) * iH, fill:"rgba(57,181,74,0.04)" },
    { y1: pT, y0: pT + iH - (8 / 10) * iH, fill:"rgba(255,215,0,0.05)" },
  ];
  var gridValues = [0, 2, 4, 6, 8, 10];
  var zoneLabels = [
    { y: pT + iH - (9 / 10) * iH, label:"Excellent", c:"#FFD700" },
    { y: pT + iH - (7.2 / 10) * iH, label:"Strong", c:"#39B54A" },
    { y: pT + iH - (5 / 10) * iH, label:"Average", c:"#FF8000" },
    { y: pT + iH - (2 / 10) * iH, label:"Poor", c:"#E10600" },
  ];
  return (
    <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
      <svg viewBox={"0 0 " + W + " " + H} style={{ minWidth:280, width:"100%", overflow:"visible" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {zoneData.map(function(z, i) {
          return <rect key={i} x={pL} y={z.y1} width={iW} height={z.y0 - z.y1} fill={z.fill} />;
        })}
        {gridValues.map(function(v) {
          var y = pT + iH - (v / 10) * iH;
          return (
            <g key={v}>
              <line x1={pL} y1={y} x2={pL + iW} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={pL - 4} y={y + 4} textAnchor="end" fill="#444" fontSize="9" fontFamily="var(--font-head)">{v}</text>
            </g>
          );
        })}
        {zoneLabels.map(function(z) {
          return <text key={z.label} x={pL + iW + 4} y={z.y + 4} fill={z.c} fontSize="8" fontFamily="var(--font-head)" opacity="0.7">{z.label}</text>;
        })}
        <line x1={pL} y1={avgY} x2={pL + iW} y2={avgY} stroke={color} strokeWidth="1" strokeDasharray="6 3" opacity="0.5" />
        <text x={pL + 4} y={avgY - 4} fill={color} fontSize="8" fontFamily="var(--font-head)" opacity="0.8">{"avg " + avgR.toFixed(1)}</text>
        <path d={areaD} fill={"url(#" + gradId + ")"} />
        <path d={lineD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(function(p, i) {
          var rc = ratingColor(p.d.rating);
          var isGreat = p.d.rating >= 8.5;
          var dotR = isGreat ? 9 : 7;
          var innerR = isGreat ? 5 : 3.5;
          var labelY = p.y - (isGreat ? 16 : 14);
          var ratingFontSize = isGreat ? 10 : 8;
          return (
            <g key={i}>
              {isGreat && <circle cx={p.x} cy={p.y} r="12" fill={rc} fillOpacity="0.12" />}
              <circle cx={p.x} cy={p.y} r={dotR} fill="var(--bg-card)" stroke={rc} strokeWidth={isGreat ? 2 : 1.5} />
              <circle cx={p.x} cy={p.y} r={innerR} fill={rc} style={{ filter: isGreat ? ("drop-shadow(0 0 6px " + rc + ")") : "none" }} />
              <text x={p.x} y={labelY} textAnchor="middle" fill={rc} fontSize={ratingFontSize} fontFamily="var(--font-head)" fontWeight="900" opacity="0.9">{p.d.rating}</text>
              {p.d.rating >= 9 && <text x={p.x} y={p.y - 26} textAnchor="middle" fill="#FFD700" fontSize="10" fontFamily="var(--font-head)" fontWeight="900">{"★"}</text>}
              {i % 2 === 0 && <text x={p.x} y={H - 5} textAnchor="middle" fill="#333" fontSize="8" fontFamily="var(--font-head)">{"R" + p.d.round}</text>}
            </g>
          );
        })}
      </svg>
      <div style={{ display:"flex", gap:12, marginTop:8, flexWrap:"wrap" }}>
        {[
          { c:"#FFD700", l:"8.5-10 Excellent" },
          { c:"#39B54A", l:"7-8.5 Strong"     },
          { c:"#FF8000", l:"5-7 Average"       },
          { c:"#E10600", l:"0-5 Poor / DNF"    },
        ].map(function(z) {
          return (
            <div key={z.l} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:z.c, flexShrink:0 }} />
              <span style={{ fontFamily:"var(--font-head)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase" }}>{z.l}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Cumulative Points Chart ───────────────────────────────────────────────────
function PointsChart({ data, color }) {
  if (!data || !data.length) return null;
  const W = 560, H = 160, pL = 40, pR = 16, pT = 16, pB = 32;
  const iW = W - pL - pR;
  const iH = H - pT - pB;
  const maxPts = Math.max.apply(null, data.map(function(d) { return d.cum; }));
  const safeMax = maxPts || 1;
  const pts = data.map(function(d, i) {
    return {
      x: pL + (i / Math.max(data.length - 1, 1)) * iW,
      y: pT + iH - (d.cum / safeMax) * iH,
      d: d,
    };
  });
  var lineParts = pts.map(function(p, i) { return (i === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1); });
  var lineD = lineParts.join(" ");
  var last = pts[pts.length - 1];
  var areaD = lineD + " L" + last.x.toFixed(1) + "," + (pT + iH).toFixed(1) + " L" + pL + "," + (pT + iH).toFixed(1) + " Z";
  var gid = "pg" + color.replace(/[^a-z0-9]/gi, "");
  var milestones = [50, 100, 150, 200, 250, 300].filter(function(m) { return m <= safeMax; });
  return (
    <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
      <svg viewBox={"0 0 " + W + " " + H} style={{ minWidth:280, width:"100%", overflow:"visible" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="60%" stopColor={color} stopOpacity="0.07" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {milestones.map(function(m) {
          var y = pT + iH - (m / safeMax) * iH;
          return (
            <g key={m}>
              <line x1={pL} y1={y} x2={pL + iW} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={pL - 4} y={y + 4} textAnchor="end" fill="#444" fontSize="9" fontFamily="var(--font-head)">{m}</text>
            </g>
          );
        })}
        <path d={areaD} fill={"url(#" + gid + ")"} />
        <path d={lineD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(function(p, i) {
          var isWin = p.d.pts >= 25;
          var spikeH = Math.min((p.d.pts / 25) * 20, 20);
          var spikeColor = isWin ? "#FFD700" : p.d.pts > 0 ? color : "#222";
          return (
            <g key={i}>
              <line x1={p.x} y1={pT + iH} x2={p.x} y2={pT + iH + spikeH} stroke={spikeColor} strokeWidth={isWin ? 2.5 : 1.5} strokeOpacity={p.d.pts > 0 ? 0.8 : 0.2} />
              {isWin && <circle cx={p.x} cy={pT + iH + spikeH + 2} r="3" fill="#FFD700" />}
              <circle cx={p.x} cy={p.y} r={isWin ? 6 : 4} fill={isWin ? "#FFD700" : (p.d.pts > 0 ? color : "var(--bg-card)")} stroke={isWin ? "#FFD700" : color} strokeWidth="1.5" style={{ filter: isWin ? "drop-shadow(0 0 5px #FFD700)" : "none" }} />
              {i % 2 === 0 && <text x={p.x} y={H - 2} textAnchor="middle" fill="#333" fontSize="8" fontFamily="var(--font-head)">{"R" + p.d.round}</text>}
            </g>
          );
        })}
      </svg>
      <div style={{ display:"flex", gap:10, marginTop:6, flexWrap:"wrap" }}>
        {[
          { c:"#FFD700", l:"Win (gold spike)" },
          { c:color,     l:"Points finish"     },
          { c:"rgba(255,255,255,0.2)", l:"No points" },
        ].map(function(z) {
          return (
            <div key={z.l} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:z.c }} />
              <span style={{ fontFamily:"var(--font-head)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase" }}>{z.l}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Scatter: Race vs Qualifying ───────────────────────────────────────────────
function ScatterChart({ raceData, qualiData, color }) {
  if (!raceData || !raceData.length) return null;
  const W = 560, H = 190, pL = 34, pR = 12, pT = 12, pB = 30;
  const iW = W - pL - pR;
  const iH = H - pT - pB;
  const n  = raceData.length;
  var qm = {};
  qualiData.forEach(function(r) { qm[r.round] = r.QualifyingResults && r.QualifyingResults[0] ? r.QualifyingResults[0].position : null; });
  var gridPos = [1, 5, 10, 15, 20];
  var legendItems = [
    { c:"#FFD700", b:null, l:"Win" },
    { c:"#C0C0C0", b:null, l:"Podium" },
    { c:color,     b:null, l:"Points" },
    { c:"rgba(255,255,255,0.3)", b:null, l:"Outside pts" },
    { c:"#E10600", b:null, l:"DNF" },
    { c:"transparent", b:"rgba(255,255,255,0.3)", l:"Grid pos" },
  ];
  return (
    <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
      <svg viewBox={"0 0 " + W + " " + H} style={{ minWidth:280, width:"100%", overflow:"visible" }} preserveAspectRatio="none">
        <rect x={pL} y={pT} width={iW} height={(9 / 19) * iH} fill="rgba(57,181,74,0.04)" />
        <text x={pL + 2} y={pT + (9 / 19) * iH - 3} fill="rgba(57,181,74,0.3)" fontSize="8" fontFamily="var(--font-head)">POINTS ZONE</text>
        {gridPos.map(function(pos) {
          var y = pT + ((pos - 1) / 19) * iH;
          var isSpecial = pos === 10;
          return (
            <g key={pos}>
              <line x1={pL} y1={y} x2={pL + iW} y2={y} stroke={isSpecial ? "rgba(57,181,74,0.25)" : "rgba(255,255,255,0.04)"} strokeWidth="1" strokeDasharray={pos === 1 || isSpecial ? "5 3" : "0"} />
              <text x={pL - 4} y={y + 4} textAnchor="end" fill="#333" fontSize="9" fontFamily="var(--font-head)">{"P" + pos}</text>
            </g>
          );
        })}
        {raceData.map(function(r, i) {
          var x    = pL + (i / Math.max(n - 1, 1)) * iW;
          var rPos = r.Results && r.Results[0] ? r.Results[0].position : null;
          var qPos = qm[r.round];
          var isDNF  = rPos === "R" || !rPos;
          var rPosN  = isDNF ? 21 : parseInt(rPos);
          var rY     = isDNF ? pT + iH + 4 : pT + ((Math.min(rPosN, 20) - 1) / 19) * iH;
          var dotCol = posColor(rPos, color);
          var gained = !isDNF && qPos && parseInt(qPos) > rPosN;
          return (
            <g key={r.round}>
              {qPos && !isNaN(parseInt(qPos)) && (function() {
                var qY = pT + ((parseInt(qPos) - 1) / 19) * iH;
                return (
                  <g>
                    <line x1={x} y1={Math.min(rY, qY)} x2={x} y2={Math.max(rY, qY)} stroke={gained ? "rgba(57,181,74,0.35)" : "rgba(225,6,0,0.25)"} strokeWidth="1.5" strokeDasharray="3 2" />
                    <circle cx={x} cy={qY} r="4" fill="transparent" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                  </g>
                );
              })()}
              <circle cx={x} cy={isDNF ? pT + iH : rY} r={rPosN === 1 ? 8 : 5} fill={dotCol} style={{ filter: rPosN === 1 ? "drop-shadow(0 0 7px #FFD700)" : "none" }} />
              {i % 2 === 0 && <text x={x} y={H - 5} textAnchor="middle" fill="#333" fontSize="8" fontFamily="var(--font-head)">{"R" + r.round}</text>}
            </g>
          );
        })}
      </svg>
      <div style={{ display:"flex", gap:12, marginTop:8, flexWrap:"wrap" }}>
        {legendItems.map(function(z) {
          return (
            <div key={z.l} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:z.c, border: z.b ? ("1.5px solid " + z.b) : "none", flexShrink:0 }} />
              <span style={{ fontFamily:"var(--font-head)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase" }}>{z.l}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Points vs Potential Bar ───────────────────────────────────────────────────
function PotentialBar({ raceData, color }) {
  if (!raceData || !raceData.length) return null;
  return (
    <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:6, minWidth:240 }}>
        {raceData.map(function(r) {
          var res    = r.Results && r.Results[0] ? r.Results[0] : null;
          var pts    = res ? parseFloat(res.points || 0) : 0;
          var pos    = res ? res.position : null;
          var isDNF  = pos === "R";
          var isWin  = pos === "1";
          var hasFl  = res && res.FastestLap && res.FastestLap.rank === "1";
          var barCol = isWin ? "#FFD700" : pts > 0 ? color : isDNF ? "#E10600" : "rgba(255,255,255,0.15)";
          var pctEarned = Math.min((pts / 25) * 100, 100);
          var name   = r.raceName.replace(" Grand Prix", "").replace(" GP", "").trim().slice(0, 12);
          return (
            <div key={r.round} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ fontFamily:"var(--font-head)", fontSize:9, color:"var(--text-muted)", minWidth:80, textAlign:"right", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{name}</div>
              <div style={{ flex:1, height:14, borderRadius:3, overflow:"hidden", background:"rgba(255,255,255,0.04)", position:"relative", minWidth:0 }}>
                <div style={{ width: (isDNF ? 8 : Math.max(pctEarned, pts > 0 ? 4 : 0)) + "%", height:"100%", background: isDNF ? "rgba(225,6,0,0.35)" : barCol, transition:"width 0.7s ease", flexShrink:0, boxShadow: isWin ? "inset 0 0 8px rgba(255,215,0,0.4)" : "none" }} />
                {hasFl && (
                  <div style={{ position:"absolute", left:0, top:0, bottom:0, width: pctEarned + "%", background:"repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(168,85,247,0.3) 3px,rgba(168,85,247,0.3) 6px)", pointerEvents:"none" }} />
                )}
              </div>
              <div style={{ fontFamily:"var(--font-head)", fontSize:10, fontWeight:900, minWidth:28, textAlign:"right", color: pts > 0 ? barCol : isDNF ? "#E10600" : "#333" }}>
                {isDNF ? "DNF" : pts > 0 ? pts : "0"}
              </div>
              {hasFl && <div style={{ width:6, height:6, borderRadius:"50%", background:"#A855F7", flexShrink:0, boxShadow:"0 0 4px #A855F7" }} />}
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:12, marginTop:10, flexWrap:"wrap" }}>
        {[
          { c:"#FFD700", l:"Win (full bar)" },
          { c:color,     l:"Points scored"  },
          { c:"rgba(255,255,255,0.04)", l:"Unrealised pts" },
          { c:"#A855F7", l:"Fastest lap"    },
        ].map(function(z) {
          return (
            <div key={z.l} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:7, height:7, background:z.c, flexShrink:0 }} />
              <span style={{ fontFamily:"var(--font-head)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase" }}>{z.l}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Dot Matrix Qualifying Chart ───────────────────────────────────────────────
function DotMatrix({ qualiData, color }) {
  if (!qualiData || !qualiData.length) return null;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {qualiData.map(function(r) {
        var qr  = r.QualifyingResults && r.QualifyingResults[0] ? r.QualifyingResults[0] : null;
        var pos = qr && qr.position ? parseInt(qr.position) : null;
        var dotColor = pos === 1 ? "#FFD700" : pos <= 3 ? "#C0C0C0" : pos <= 10 ? color : "rgba(255,255,255,0.2)";
        var name = r.raceName.replace(" Grand Prix", "").replace(" GP", "").trim().slice(0, 12);
        return (
          <div key={r.round} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ fontFamily:"var(--font-head)", fontSize:9, color:"var(--text-muted)", minWidth:80, textAlign:"right", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{name}</div>
            <div style={{ display:"flex", gap:2, flex:1, minWidth:0, overflow:"hidden" }}>
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(function(dotPos) {
                var isExact = dotPos === pos;
                var isFilled = pos !== null && dotPos <= pos;
                var bg = !pos ? "rgba(255,255,255,0.05)" : isExact ? dotColor : isFilled ? (dotColor + "55") : "rgba(255,255,255,0.04)";
                return (
                  <div key={dotPos} style={{ width:8, height:8, borderRadius:"50%", flexShrink:0, background:bg, boxShadow: isExact ? ("0 0 6px " + dotColor) : "none" }} />
                );
              })}
            </div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:10, fontWeight:800, color:dotColor, minWidth:20, flexShrink:0 }}>{pos ? ("P" + pos) : "—"}</div>
          </div>
        );
      })}
      <div style={{ display:"flex", gap:10, marginTop:6, flexWrap:"wrap" }}>
        {[
          { c:"#FFD700", l:"Pole" },
          { c:"#C0C0C0", l:"Front row" },
          { c:color,     l:"Top 10" },
          { c:"rgba(255,255,255,0.2)", l:"P11+" },
        ].map(function(z) {
          return (
            <div key={z.l} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:z.c }} />
              <span style={{ fontFamily:"var(--font-head)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase" }}>{z.l}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Season Heat Map ───────────────────────────────────────────────────────────
function HeatMap({ raceData, qualiData, sprintMap, ratingData, color }) {
  if (!raceData || !raceData.length) return null;
  var qm = {};
  qualiData.forEach(function(r) { qm[r.round] = r.QualifyingResults && r.QualifyingResults[0] ? r.QualifyingResults[0].position : null; });
  var rm = {};
  ratingData.forEach(function(r) { rm[r.round] = r.rating; });
  var rm_sprint = sprintMap || {};
  var rows = [
    {
      label: "Finish",
      getCell: function(r) {
        var p = r.Results && r.Results[0] ? r.Results[0].position : null;
        if (!p || p === "R") return { v:"DNF", c:"rgba(225,6,0,0.6)", dark:false };
        var n = parseInt(p);
        return { v:"P" + p, c: n === 1 ? "#FFD700" : n <= 3 ? "#C0C0C0" : n <= 10 ? color : "rgba(255,255,255,0.12)", dark: n <= 3 };
      },
    },
    {
      label: "Sprint",
      getCell: function(r) {
        var sp = rm_sprint ? rm_sprint[r.round] : null;
        if (!sp) return { v:"—", c:"rgba(255,255,255,0.04)", dark:false };
        var n = parseInt(sp.position);
        if (sp.position === "R") return { v:"DNF", c:"rgba(225,6,0,0.3)", dark:false };
        return { v:"P" + sp.position, c: n === 1 ? "#FFD700" : n <= 3 ? "#FFD70066" : n <= 8 ? "#FFD70033" : "rgba(255,255,255,0.06)", dark: n <= 3 };
      },
    },
    {
      label: "Quali",
      getCell: function(r) {
        var qp = qm[r.round];
        if (!qp) return { v:"—", c:"#222", dark:false };
        var n = parseInt(qp);
        return { v:"P" + qp, c: n === 1 ? "#FFD700" : n <= 3 ? "#C0C0C0" : n <= 10 ? "#FF8000" : "rgba(255,255,255,0.12)", dark: n <= 3 };
      },
    },
    {
      label: "Points",
      getCell: function(r) {
        var pts  = r.Results && r.Results[0] ? parseFloat(r.Results[0].points || 0) : 0;
        var spts = rm_sprint && rm_sprint[r.round] ? parseFloat(rm_sprint[r.round].points || 0) : 0;
        var tot  = pts + spts;
        return { v: tot > 0 ? tot : "—", c: tot >= 25 ? "#FFD700" : tot > 0 ? color : "rgba(255,255,255,0.06)", dark: tot >= 25 };
      },
    },
    {
      label: "Rating",
      getCell: function(r) {
        var rt = rm[r.round];
        if (!rt && rt !== 0) return { v:"—", c:"#1a1a1a", dark:false };
        return { v: rt, c: ratingColor(rt), dark: rt >= 8.5 };
      },
    },
  ];
  return (
    <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
      <div style={{ minWidth: Math.max(320, raceData.length * 30 + 80) }}>
        <div style={{ display:"flex", marginLeft:64, marginBottom:4 }}>
          {raceData.map(function(r) {
            return <div key={r.round} style={{ flex:"1 0 0", textAlign:"center", fontFamily:"var(--font-head)", fontSize:8, color:"#444" }}>{"R" + r.round}</div>;
          })}
        </div>
        {rows.map(function(row) {
          return (
            <div key={row.label} style={{ display:"flex", alignItems:"stretch", marginBottom:3 }}>
              <div style={{ width:60, fontFamily:"var(--font-head)", fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--text-muted)", display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight:6, flexShrink:0 }}>
                {row.label}
              </div>
              {raceData.map(function(r) {
                var cell = row.getCell(r);
                return (
                  <div key={r.round} style={{ flex:"1 0 0", height:26, background:cell.c, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 1px", borderRadius:2 }}>
                    <span style={{ fontFamily:"var(--font-head)", fontSize:8, fontWeight:900, color: cell.dark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)", letterSpacing:"0.02em" }}>{cell.v}</span>
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

// ── Radar Chart ───────────────────────────────────────────────────────────────
function RadarChart({ stats, color }) {
  var axes = [
    { label:"PACE",    val: stats.wins > 0 ? Math.min(10, 4 + stats.wins * 1.5) : Math.min(10, 2 + (20 - parseFloat(stats.avgPos || 20)) / 2) },
    { label:"QUALI",   val: stats.avgQPos !== "—" ? Math.min(10, (20 - parseFloat(stats.avgQPos)) / 1.9 + 1) : 5 },
    { label:"POINTS",  val: Math.min(10, parseFloat(stats.ptsPerRace) / 2.5) },
    { label:"CONSIST", val: parseFloat(stats.consistency) / 10 },
    { label:"FINISH",  val: parseFloat(stats.finishRate) / 10 },
    { label:"FIGHTS",  val: Math.min(10, 5 + (parseFloat(stats.avgDelta) || 0) * 0.6) },
  ];
  var cx = 110, cy = 110, R = 78, n = axes.length;
  function toXY(i, val) {
    var a = (i / n) * Math.PI * 2 - Math.PI / 2;
    var r2 = (val / 10) * R;
    return [cx + r2 * Math.cos(a), cy + r2 * Math.sin(a)];
  }
  var shapePts = axes.map(function(a, i) { var xy = toXY(i, a.val); return xy[0] + "," + xy[1]; }).join(" ");
  var gridLevels = [2, 4, 6, 8, 10];
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
      <svg viewBox="0 0 220 220" style={{ width:200, height:200, overflow:"visible" }}>
        {gridLevels.map(function(lv) {
          var gpts = axes.map(function(_, i) { var xy = toXY(i, lv); return xy[0] + "," + xy[1]; }).join(" ");
          return <polygon key={lv} points={gpts} fill="none" stroke={lv === 10 ? (color + "33") : "rgba(255,255,255,0.06)"} strokeWidth="1" />;
        })}
        {axes.map(function(a, i) {
          var xy = toXY(i, 10);
          return <line key={i} x1={cx} y1={cy} x2={xy[0]} y2={xy[1]} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
        })}
        <polygon points={shapePts} fill={color + "28"} stroke={color} strokeWidth="2" style={{ filter:"drop-shadow(0 0 6px " + color + "44)" }} />
        {axes.map(function(a, i) {
          var xy = toXY(i, a.val);
          return <circle key={i} cx={xy[0]} cy={xy[1]} r="4" fill={color} style={{ filter:"drop-shadow(0 0 4px " + color + ")" }} />;
        })}
        {axes.map(function(a, i) {
          var angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          var lx = cx + (R + 18) * Math.cos(angle);
          var ly = cy + (R + 18) * Math.sin(angle);
          return <text key={i} x={lx} y={ly + 4} textAnchor="middle" fill={color} fontSize="8" fontFamily="var(--font-head)" fontWeight="700" letterSpacing="0.1em">{a.label}</text>;
        })}
      </svg>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
        {axes.map(function(a) {
          return (
            <div key={a.label} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ fontFamily:"var(--font-head)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.06em" }}>{a.label}</div>
              <div style={{ fontFamily:"var(--font-head)", fontSize:11, fontWeight:900, color:color }}>{a.val.toFixed(1)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Race Timeline Card ────────────────────────────────────────────────────────
function RaceCard({ race, qualiPos, sprintResult, qualiResults, color, rating }) {
  var res    = race.Results && race.Results[0] ? race.Results[0] : null;
  if (!res) return null;
  var pos    = res.position;
  var status = (res.status || "").toLowerCase();
  var isDNF  = pos === "R" || status.includes("retired") || status.includes("accident") || status.includes("collision");
  var posN   = isDNF ? null : parseInt(pos);
  var col    = posColor(pos, color);
  var pts    = parseFloat(res.points || 0);
  var qp     = qualiPos ? parseInt(qualiPos) : null;
  var delta  = (qp && !isDNF && posN) ? (qp - posN) : null;
  var rc     = ratingColor(rating);
  var rl     = ratingLabel(rating);

  // Sprint
  var spPos   = sprintResult ? sprintResult.position : null;
  var spPts   = sprintResult ? parseFloat(sprintResult.points || 0) : 0;
  var spIsDNF = spPos === "R";
  var spCol   = sprintResult ? posColor(spPos, color) : null;

  // Constructor
  var constructor = res.Constructor ? res.Constructor.name : null;

  return (
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderLeft:"3px solid " + (isDNF ? "#E10600" : col), marginBottom:1, overflow:"hidden" }}>
      {/* Main race row */}
      <div
        style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:12, transition:"background 0.15s" }}
        onMouseEnter={function(e) { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
        onMouseLeave={function(e) { e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{ fontFamily:"var(--font-head)", fontSize: posN === 1 ? 26 : isDNF ? 12 : 18, fontWeight:900, color:col, minWidth:46, textAlign:"center", lineHeight:1, flexShrink:0, textShadow: posN === 1 ? "0 0 24px #FFD70066" : "none" }}>
          {isDNF ? "DNF" : "P" + pos}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <div style={{ fontFamily:"var(--font-head)", fontSize:"clamp(11px,2.5vw,13px)", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.04em", color:"var(--text)" }}>
              {race.raceName.replace(" Grand Prix","").replace(" GP","").trim() + " GP"}
            </div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:9, color: col, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>Race</div>
          </div>
          <div style={{ display:"flex", gap:5, marginTop:3, flexWrap:"wrap", alignItems:"center" }}>
            {qp && <span style={{ fontFamily:"var(--font-head)", fontSize:9, color:"var(--text-muted)", background:"rgba(255,128,0,0.1)", padding:"1px 5px", borderRadius:3 }}>{"Q" + qp}</span>}
            {delta !== null && delta !== 0 && (
              <span style={{ fontFamily:"var(--font-head)", fontSize:9, fontWeight:800, color: delta > 0 ? "#39B54A" : "#E10600", background: delta > 0 ? "rgba(57,181,74,0.12)" : "rgba(225,6,0,0.12)", padding:"1px 5px", borderRadius:3 }}>
                {delta > 0 ? ("↑" + delta + " gained") : ("↓" + Math.abs(delta) + " lost")}
              </span>
            )}
            {res.FastestLap && res.FastestLap.rank === "1" && (
              <span style={{ fontFamily:"var(--font-head)", fontSize:9, fontWeight:800, color:"#A855F7", background:"rgba(168,85,247,0.12)", padding:"1px 5px", borderRadius:3 }}>{"⚡ FL"}</span>
            )}
            {isDNF && (
              <span style={{ fontFamily:"var(--font-head)", fontSize:9, color:"#E10600", background:"rgba(225,6,0,0.1)", padding:"1px 5px", borderRadius:3 }}>{res.status || "Retired"}</span>
            )}
            {constructor && (
              <span style={{ fontFamily:"var(--font-head)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.06em" }}>{constructor}</span>
            )}
          </div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0, minWidth:30 }}>
          <div style={{ fontFamily:"var(--font-head)", fontSize: pts >= 25 ? 18 : pts > 0 ? 14 : 11, fontWeight:900, color: pts >= 25 ? "#FFD700" : pts > 0 ? col : "#2a2a2a" }}>
            {pts > 0 ? ("+" + pts) : isDNF ? "—" : "0"}
          </div>
          {pts > 0 && <div style={{ fontFamily:"var(--font-head)", fontSize:8, color:"var(--text-muted)" }}>PTS</div>}
        </div>
        {(rating !== null && rating !== undefined) && (
          <div style={{ textAlign:"center", flexShrink:0, borderLeft:"1px solid var(--border)", paddingLeft:10, minWidth:44 }}>
            <div style={{ fontFamily:"var(--font-head)", fontSize:18, fontWeight:900, color:rc, lineHeight:1, textShadow: rating >= 8.5 ? ("0 0 12px " + rc + "66") : "none" }}>{rating}</div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:7, color:rc, letterSpacing:"0.06em", textTransform:"uppercase", marginTop:1 }}>{rl}</div>
          </div>
        )}
      </div>

      {/* Sprint row — only shown when sprint data exists for this round */}
      {sprintResult && (
        <div style={{ padding:"8px 14px 8px 60px", display:"flex", alignItems:"center", gap:10, background:"rgba(255,215,0,0.03)", borderTop:"1px solid rgba(255,215,0,0.08)" }}>
          <div style={{ fontFamily:"var(--font-head)", fontSize:13, fontWeight:900, color: spIsDNF ? "#E10600" : spCol, minWidth:46, textAlign:"center", lineHeight:1, flexShrink:0 }}>
            {spIsDNF ? "DNF" : "P" + spPos}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"var(--font-head)", fontSize:9, fontWeight:700, color:"#FFD700", letterSpacing:"0.1em", textTransform:"uppercase" }}>Sprint</div>
            {sprintResult.Time && <div style={{ fontFamily:"var(--font-head)", fontSize:9, color:"var(--text-muted)", marginTop:1 }}>{sprintResult.Time.time}</div>}
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontFamily:"var(--font-head)", fontSize:12, fontWeight:900, color: spPts > 0 ? "#FFD700" : "#333" }}>
              {spPts > 0 ? ("+" + spPts) : "0"}
            </div>
            {spPts > 0 && <div style={{ fontFamily:"var(--font-head)", fontSize:8, color:"var(--text-muted)" }}>PTS</div>}
          </div>
        </div>
      )}

      {/* Qualifying row */}
      {qp && (
        <div style={{ padding:"8px 14px 8px 60px", display:"flex", alignItems:"center", gap:10, background:"rgba(255,128,0,0.03)", borderTop:"1px solid rgba(255,128,0,0.07)" }}>
          <div style={{ fontFamily:"var(--font-head)", fontSize:13, fontWeight:900, color:"#FF8000", minWidth:46, textAlign:"center", lineHeight:1, flexShrink:0 }}>
            P{qp}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"var(--font-head)", fontSize:9, fontWeight:700, color:"#FF8000", letterSpacing:"0.1em", textTransform:"uppercase" }}>Qualifying</div>
            {qualiResults && qualiResults.length > 0 && (function() {
              var qr = qualiResults && qualiResults.find ? qualiResults.find(function(r) { return r.round === race.round; }) : null;
              var qres = qr && qr.QualifyingResults && qr.QualifyingResults[0] ? qr.QualifyingResults[0] : null;
              var bestTime = qres ? (qres.Q3 || qres.Q2 || qres.Q1 || null) : null;
              if (!bestTime) return null;
              return <div style={{ fontFamily:"var(--font-head)", fontSize:9, color:"var(--text-muted)", marginTop:1 }}>{bestTime}</div>;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Driver Chip ───────────────────────────────────────────────────────────────
function DriverChip({ driver, isSelected, onClick }) {
  var d     = driver.Driver;
  var team  = driver.Constructors && driver.Constructors[0] ? driver.Constructors[0] : null;
  var col   = teamColor(team ? team.name : "");
  var photo = driverPhoto(d.driverId);
  return (
    <button onClick={onClick} style={{ background: isSelected ? (col + "20") : "var(--bg-card)", border:"1px solid " + (isSelected ? col : "var(--border)"), borderTop:"3px solid " + (isSelected ? col : "transparent"), padding:"8px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:8, transition:"all 0.15s", flex:"1 1 120px", minWidth:0 }}>
      {photo && <img src={photo} alt={d.familyName} style={{ width:32, height:32, objectFit:"cover", objectPosition:"top", borderRadius:2, flexShrink:0, filter: isSelected ? "none" : "grayscale(0.7)" }} onError={function(e) { e.currentTarget.style.display = "none"; }} />}
      <div style={{ minWidth:0, textAlign:"left" }}>
        <div style={{ fontFamily:"var(--font-head)", fontSize:9, fontWeight:700, textTransform:"uppercase", color: isSelected ? col : "var(--text-muted)", lineHeight:1 }}>{(d.givenName || "").charAt(0) + "."}</div>
        <div style={{ fontFamily:"var(--font-head)", fontSize:12, fontWeight:900, textTransform:"uppercase", color: isSelected ? "var(--text)" : "var(--text-muted)", lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.familyName}</div>
        <div style={{ fontFamily:"var(--font-head)", fontSize:9, color: isSelected ? col : "#333", fontWeight:700, marginTop:1 }}>{"P" + driver.position + " · " + driver.points + "pts"}</div>
      </div>
    </button>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function Card({ title, sub, accent, children }) {
  return (
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderTop:"3px solid " + (accent || "var(--red)"), padding:"20px", marginBottom:2 }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontFamily:"var(--font-head)", fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color: accent || "var(--red)" }}>{title}</div>
        {sub && <div style={{ fontFamily:"var(--font-head)", fontSize:11, color:"var(--text-muted)", marginTop:3 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function DriverPerformance() {
  var [allDrivers,   setAllDrivers]   = useState([]);
  var [season,       setSeason]       = useState("");
  var [selectedId,   setSelectedId]   = useState(null);
  var [raceResults,  setRaceResults]  = useState([]);
  var [qualiResults,  setQualiResults]  = useState([]);
  var [sprintResults, setSprintResults] = useState([]);
  var [loading,      setLoading]      = useState(true);
  var [detailLoad,   setDetailLoad]   = useState(false);
  var [error,        setError]        = useState(null);
  var [tab,          setTab]          = useState("overview");

  useEffect(function() {
    fetchJSON("https://api.jolpi.ca/ergast/f1/current/driverstandings.json")
      .then(function(d) {
        var list = d.MRData && d.MRData.StandingsTable && d.MRData.StandingsTable.StandingsLists ? d.MRData.StandingsTable.StandingsLists[0] : null;
        if (list && list.season) setSeason(list.season);
        var drivers = list && list.DriverStandings ? list.DriverStandings : [];
        setAllDrivers(drivers);
        if (drivers.length) setSelectedId(drivers[0].Driver.driverId);
      })
      .catch(function() { setError("Failed to load drivers."); })
      .finally(function() { setLoading(false); });
  }, []);

  useEffect(function() {
    if (!selectedId || !season) return;
    setDetailLoad(true);
    setRaceResults([]);
    setQualiResults([]);
    setSprintResults([]);
    Promise.allSettled([
      fetchJSON("https://api.jolpi.ca/ergast/f1/" + season + "/drivers/" + selectedId + "/results.json?limit=50"),
      fetchJSON("https://api.jolpi.ca/ergast/f1/" + season + "/drivers/" + selectedId + "/qualifying.json?limit=50"),
      fetchJSON("https://api.jolpi.ca/ergast/f1/" + season + "/drivers/" + selectedId + "/sprint.json?limit=50"),
    ]).then(function(results) {
      var rRes = results[0], qRes = results[1], sRes = results[2];
      if (rRes.status === "fulfilled") setRaceResults(rRes.value.MRData && rRes.value.MRData.RaceTable ? (rRes.value.MRData.RaceTable.Races || []) : []);
      if (qRes.status === "fulfilled") setQualiResults(qRes.value.MRData && qRes.value.MRData.RaceTable ? (qRes.value.MRData.RaceTable.Races || []) : []);
      if (sRes.status === "fulfilled") setSprintResults(sRes.value.MRData && sRes.value.MRData.RaceTable ? (sRes.value.MRData.RaceTable.Races || []) : []);
    }).finally(function() { setDetailLoad(false); });
  }, [selectedId, season]);

  var qualiMap = useMemo(function() {
    var m = {};
    qualiResults.forEach(function(r) {
      m[r.round] = r.QualifyingResults && r.QualifyingResults[0] ? r.QualifyingResults[0].position : null;
    });
    return m;
  }, [qualiResults]);

  var sprintMap = useMemo(function() {
    var m = {};
    sprintResults.forEach(function(r) {
      m[r.round] = r.SprintResults && r.SprintResults[0] ? r.SprintResults[0] : null;
    });
    return m;
  }, [sprintResults]);

  var ratings = useMemo(function() {
    return raceResults.map(function(r) {
      var res = r.Results && r.Results[0] ? r.Results[0] : null;
      return { round: r.round, rating: calcRating(res, qualiMap[r.round]) };
    });
  }, [raceResults, qualiMap]);

  var ratingMap = useMemo(function() {
    var m = {};
    ratings.forEach(function(r) { m[r.round] = r.rating; });
    return m;
  }, [ratings]);

  var ratingData = useMemo(function() {
    return ratings.filter(function(r) { return r.rating !== null; }).map(function(r) { return { round: r.round, rating: r.rating }; });
  }, [ratings]);

  var stats = useMemo(function() {
    if (!raceResults.length) return null;
    var results   = raceResults.map(function(r) { return r.Results && r.Results[0] ? r.Results[0] : null; }).filter(Boolean);
    var positions = results.map(function(r) { return r.position; }).filter(function(p) { return p && p !== "R"; });
    var numPos    = positions.map(Number);
    var pointsArr = results.map(function(r) { return parseFloat(r.points || 0); });
    var wins    = numPos.filter(function(p) { return p === 1; }).length;
    var podiums = numPos.filter(function(p) { return p <= 3; }).length;
    var inPts   = numPos.filter(function(p) { return p <= 10; }).length;
    var dnfs    = results.filter(function(r) { return r.position === "R" || (r.status || "").toLowerCase().includes("retired"); }).length;
    var fls     = results.filter(function(r) { return r.FastestLap && r.FastestLap.rank === "1"; }).length;
    var avgPos  = numPos.length ? (numPos.reduce(function(a, b) { return a + b; }, 0) / numPos.length).toFixed(1) : "—";
    var totalPts = pointsArr.reduce(function(a, b) { return a + b; }, 0);
    var races   = raceResults.length;
    var bestPos = numPos.length ? Math.min.apply(null, numPos) : null;
    var finishRate  = races > 0 ? (((races - dnfs) / races) * 100).toFixed(0) : 0;
    var consistency = races > 0 ? ((inPts / races) * 100).toFixed(0) : 0;
    var ptsPerRace  = races > 0 ? (totalPts / races).toFixed(1) : "0";
    var qPos    = qualiResults.map(function(r) { return r.QualifyingResults && r.QualifyingResults[0] ? parseInt(r.QualifyingResults[0].position) : NaN; }).filter(function(n) { return !isNaN(n); });
    var avgQPos = qPos.length ? (qPos.reduce(function(a, b) { return a + b; }, 0) / qPos.length).toFixed(1) : "—";
    var poles   = qualiResults.filter(function(r) { return r.QualifyingResults && r.QualifyingResults[0] && r.QualifyingResults[0].position === "1"; }).length;
    var deltas  = raceResults.map(function(r) {
      var qp = qualiMap[r.round];
      var rp = r.Results && r.Results[0] ? r.Results[0].position : null;
      if (!qp || !rp || rp === "R") return null;
      return parseInt(qp) - parseInt(rp);
    }).filter(function(d) { return d !== null; });
    var avgDelta = deltas.length ? (deltas.reduce(function(a, b) { return a + b; }, 0) / deltas.length).toFixed(1) : "0";
    var validRatings = ratings.filter(function(r) { return r.rating !== null; }).map(function(r) { return r.rating; });
    var avgRating = validRatings.length ? (validRatings.reduce(function(a, b) { return a + b; }, 0) / validRatings.length).toFixed(1) : "—";
    var cum = 0;
    var cumData = raceResults.map(function(r) {
      var p  = r.Results && r.Results[0] ? parseFloat(r.Results[0].points || 0) : 0;
      var sp = sprintMap[r.round] ? parseFloat(sprintMap[r.round].points || 0) : 0;
      cum += p + sp;
      return { round: r.round, cum: cum, pts: p, sprintPts: sp };
    });
    var sprintWins    = Object.values(sprintMap).filter(function(s) { return s && s.position === "1"; }).length;
    var sprintPodiums = Object.values(sprintMap).filter(function(s) { return s && parseInt(s.position) <= 3; }).length;
    var totalSprintPts = Object.values(sprintMap).reduce(function(a, s) { return a + (s ? parseFloat(s.points || 0) : 0); }, 0);
    return { wins, podiums, inPts, dnfs, fastestLaps:fls, avgPos, totalPts, races, bestPos, finishRate, consistency, ptsPerRace, avgQPos, poles, avgDelta, avgRating, cumData, sprintWins, sprintPodiums, totalSprintPts };
  }, [raceResults, qualiResults, qualiMap, sprintMap, ratings]);

  var sel   = allDrivers.find(function(d) { return d.Driver.driverId === selectedId; });
  var team  = sel && sel.Constructors && sel.Constructors[0] ? sel.Constructors[0] : null;
  var color = teamColor(team ? team.name : "");
  var photo = driverPhoto(selectedId);

  if (loading) return (
    <div className="container" style={{ paddingTop:40 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:20, height:20, border:"2px solid #1a1a1a", borderTopColor:"var(--red)", borderRadius:"50%", animation:"dp-spin .8s linear infinite" }} />
        <span style={{ fontFamily:"var(--font-head)", fontSize:11, color:"var(--text-muted)", letterSpacing:"0.15em", textTransform:"uppercase" }}>Loading drivers...</span>
      </div>
      <style>{"@keyframes dp-spin{to{transform:rotate(360deg);}}"}</style>
    </div>
  );
  if (error) return (
    <div className="container" style={{ paddingTop:40 }}>
      <p style={{ color:"var(--red)", fontFamily:"var(--font-head)", letterSpacing:"0.1em", textTransform:"uppercase" }}>{error}</p>
    </div>
  );

  var TABS = [
    { id:"overview", label:"Overview"      },
    { id:"charts",   label:"Charts"        },
    { id:"rating",   label:"Rating"        },
    { id:"timeline", label:"Race by Race"  },
  ];

  return (
    <div className="container" style={{ paddingBottom:52 }}>
      <div className="page-subtitle">{season + " World Championship"}</div>
      <h1 className="page-title">Driver <span>Performance</span></h1>

      <div style={{ display:"flex", flexWrap:"wrap", gap:2, marginBottom:28 }}>
        {allDrivers.map(function(d) {
          return <DriverChip key={d.Driver.driverId} driver={d} isSelected={d.Driver.driverId === selectedId} onClick={function() { setSelectedId(d.Driver.driverId); setTab("overview"); }} />;
        })}
      </div>

      {sel && (
        <div style={{ background:"linear-gradient(130deg," + color + "18 0%,transparent 55%)", border:"1px solid var(--border)", borderTop:"4px solid " + color, padding:"22px 20px", marginBottom:2, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", right:-30, top:-30, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle," + color + "10 0%,transparent 70%)", pointerEvents:"none" }} />
          <div style={{ display:"flex", gap:18, alignItems:"center", flexWrap:"wrap", position:"relative" }}>
            {photo && <img src={photo} alt={sel.Driver.familyName} style={{ width:84, height:84, objectFit:"cover", objectPosition:"top", borderRadius:4, flexShrink:0, border:"2px solid " + color + "44" }} onError={function(e) { e.currentTarget.style.display = "none"; }} />}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"var(--font-head)", fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:color, marginBottom:4 }}>
                {(team ? team.name : "") + " · #" + sel.Driver.permanentNumber}
              </div>
              <div style={{ fontFamily:"var(--font-head)", fontSize:"clamp(20px,5vw,38px)", fontWeight:900, textTransform:"uppercase", lineHeight:1, marginBottom:10 }}>
                {sel.Driver.givenName + " "}<span style={{ color:color }}>{sel.Driver.familyName}</span>
              </div>
              <div style={{ display:"flex", gap:18, flexWrap:"wrap" }}>
                {[
                  { l:"Championship", v:"P" + sel.position },
                  { l:"Points", v:sel.points },
                  { l:"Nationality", v:sel.Driver.nationality },
                ].concat(stats ? [{ l:"Races", v:stats.races }, { l:"Avg Rating", v:stats.avgRating }] : []).map(function(s) {
                  return (
                    <div key={s.l}>
                      <div style={{ fontFamily:"var(--font-head)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.1em", textTransform:"uppercase" }}>{s.l}</div>
                      <div style={{ fontFamily:"var(--font-head)", fontSize:17, fontWeight:900, color: s.l === "Avg Rating" ? ratingColor(parseFloat(s.v)) : color, lineHeight:1.2 }}>{s.v}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", borderBottom:"1px solid var(--border)", background:"var(--bg-card)", marginBottom:2, overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
        {TABS.map(function(t) {
          return (
            <button key={t.id} onClick={function() { setTab(t.id); }} style={{ fontFamily:"var(--font-head)", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"12px 14px", border:"none", cursor:"pointer", background:"transparent", whiteSpace:"nowrap", flexShrink:0, color: tab === t.id ? "var(--text)" : "var(--text-muted)", borderBottom:"2px solid " + (tab === t.id ? color : "transparent"), transition:"all 0.15s" }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {detailLoad && (
        <div style={{ padding:"32px", textAlign:"center", color:"var(--text-muted)", fontFamily:"var(--font-head)", fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", background:"var(--bg-card)", border:"1px solid var(--border)", borderTop:"none" }}>
          Loading performance data...
        </div>
      )}

      {!detailLoad && stats && (
        <div>
          {tab === "overview" && (
            <div>
              <Card title="Season at a Glance" sub={stats.races + " races · " + stats.totalPts + " pts · Avg rating " + stats.avgRating + "/10"} accent={color}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:16, justifyContent:"space-around", paddingBottom:4 }}>
                  <ArcRing pct={(stats.wins / Math.max(stats.races, 1)) * 100} color="#FFD700" size={84} stroke={7} label="Wins" value={stats.wins} sub={((stats.wins / Math.max(stats.races, 1)) * 100).toFixed(0) + "%"} />
                  <ArcRing pct={(stats.podiums / Math.max(stats.races, 1)) * 100} color={color} size={84} stroke={7} label="Podiums" value={stats.podiums} />
                  <ArcRing pct={(stats.inPts / Math.max(stats.races, 1)) * 100} color={color} size={84} stroke={7} label="In Points" value={stats.inPts} sub={stats.consistency + "%"} />
                  <ArcRing pct={(stats.poles / Math.max(qualiResults.length, 1)) * 100} color="#FF8000" size={84} stroke={7} label="Poles" value={stats.poles} />
                  <ArcRing pct={(stats.fastestLaps / Math.max(stats.races, 1)) * 100} color="#A855F7" size={84} stroke={7} label="Fast Laps" value={stats.fastestLaps} />
                  {stats.sprintWins > 0 && <ArcRing pct={(stats.sprintWins / Math.max(stats.races, 1)) * 100} color="#FFD700" size={84} stroke={7} label="Sprint Wins" value={stats.sprintWins} />}
                  {stats.totalSprintPts > 0 && <ArcRing pct={Math.min((stats.totalSprintPts / 58) * 100, 100)} color="#FFD700" size={84} stroke={7} label="Sprint Pts" value={stats.totalSprintPts} />}
                  <ArcRing pct={parseFloat(stats.avgRating) * 10} color={ratingColor(parseFloat(stats.avgRating))} size={84} stroke={7} label="Avg Rating" value={stats.avgRating} sub="/10" />
                </div>
              </Card>
              <Card title="Key Numbers" accent={color}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:2, paddingBottom:4 }}>
                  {[
                    { l:"Best Finish",  v: stats.bestPos ? "P" + stats.bestPos : "—",  c: stats.bestPos === 1 ? "#FFD700" : color },
                    { l:"Avg Race Pos", v: "P" + stats.avgPos,  c: color },
                    { l:"Avg Quali",    v: "P" + stats.avgQPos, c: "#FF8000" },
                    { l:"Pts / Race",   v: stats.ptsPerRace,    c: color },
                    { l:"Finish Rate",  v: stats.finishRate + "%", c: parseInt(stats.finishRate) > 80 ? "#39B54A" : "#E10600" },
                    { l:"Avg Delta",    v: parseFloat(stats.avgDelta) >= 0 ? "+" + stats.avgDelta : stats.avgDelta, c: parseFloat(stats.avgDelta) > 0 ? "#39B54A" : parseFloat(stats.avgDelta) < 0 ? "#E10600" : "#555" },
                    { l:"DNFs",         v: stats.dnfs,           c: stats.dnfs > 3 ? "#E10600" : "rgba(255,255,255,0.4)" },
                    { l:"Consistency",  v: stats.consistency + "%", c: parseInt(stats.consistency) > 60 ? color : "#555" },
                  ].map(function(s) {
                    return (
                      <div key={s.l} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid var(--border)", padding:"12px 10px" }}>
                        <div style={{ fontFamily:"var(--font-head)", fontSize:8, color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>{s.l}</div>
                        <div style={{ fontFamily:"var(--font-head)", fontSize:22, fontWeight:900, color:s.c, lineHeight:1 }}>{s.v}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
              <Card title="Season Skill Radar" sub="Relative strengths across 6 key metrics — shape shows driver profile" accent={color}>
                <div style={{ display:"flex", justifyContent:"center", paddingBottom:8 }}>
                  <RadarChart stats={stats} color={color} />
                </div>
              </Card>
            </div>
          )}

          {tab === "charts" && (
            <div>
              <Card title="Points Trajectory" sub="Smooth line = cumulative total · Spikes below = points per race · Gold spike = win" accent={color}>
                <PointsChart data={stats.cumData} color={color} />
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8, gap:16, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"var(--font-head)", fontSize:11, color:"var(--text-muted)" }}>Total: <span style={{ color:color, fontWeight:900 }}>{stats.totalPts + "pts"}</span></span>
                  <span style={{ fontFamily:"var(--font-head)", fontSize:11, color:"var(--text-muted)" }}>Avg: <span style={{ color:color, fontWeight:900 }}>{stats.ptsPerRace + "pts/race"}</span></span>
                </div>
              </Card>
              <Card title="Qualifying vs Race Positions" sub="Large dot = race finish · Hollow circle = qualifying · Green line = places gained · Red = places lost" accent={color}>
                <ScatterChart raceData={raceResults} qualiData={qualiResults} color={color} />
              </Card>
              <Card title="Points vs Potential" sub="Bar = points scored (max 25) · Empty = unrealised potential · Purple dot = fastest lap" accent={color}>
                <PotentialBar raceData={raceResults} color={color} />
              </Card>
              <Card title="Qualifying — Dot Matrix" sub="Each dot = one grid position P1 to P20 · Bright dot = actual position · Chain shows grid depth" accent="#FF8000">
                <DotMatrix qualiData={qualiResults} color={color} />
              </Card>
              <Card title="Season Heat Map" sub="Colour-coded grid — scan all 4 metrics across every race round at once" accent={color}>
                <HeatMap raceData={raceResults} qualiData={qualiResults} sprintMap={sprintMap} ratingData={ratingData} color={color} />
              </Card>
            </div>
          )}

          {tab === "rating" && (
            <div>
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid var(--border)", borderLeft:"3px solid " + color, padding:"12px 16px", marginBottom:2 }}>
                <div style={{ fontFamily:"var(--font-head)", fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:color, marginBottom:6 }}>How the rating works</div>
                <div style={{ fontFamily:"var(--font-head)", fontSize:11, color:"var(--text-muted)", lineHeight:1.7 }}>
                  Each race scored 0–10 based on: finishing position (main factor), points scored, places gained from qualifying, and a fastest lap bonus (+0.5). DNF = 1.5 regardless of cause.
                </div>
              </div>
              <Card title="Performance Rating — Round by Round" sub={"Avg: " + stats.avgRating + "/10 · Number above each dot = that race's score · ★ = 9+ masterclass"} accent={ratingColor(parseFloat(stats.avgRating))}>
                <RatingLineChart data={ratingData} color={color} />
              </Card>
              <Card title="Rating Distribution" sub="How many races fell into each quality band" accent={color}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, paddingBottom:4 }}>
                  {[
                    { label:"Excellent (8.5-10)", min:8.5, max:11,  c:"#FFD700" },
                    { label:"Strong (7-8.5)",     min:7,   max:8.5, c:"#39B54A" },
                    { label:"Average (5-7)",       min:5,   max:7,   c:"#FF8000" },
                    { label:"Poor / DNF (0-5)",    min:0,   max:5,   c:"#E10600" },
                  ].map(function(b) {
                    var count = ratingData.filter(function(r) { return r.rating >= b.min && r.rating < b.max; }).length;
                    var pct   = ratingData.length ? (count / ratingData.length) * 100 : 0;
                    return (
                      <div key={b.label} style={{ flex:"1 1 130px", background:"rgba(255,255,255,0.025)", border:"1px solid " + b.c + "33", borderTop:"3px solid " + b.c, padding:"14px 12px" }}>
                        <div style={{ fontFamily:"var(--font-head)", fontSize:9, color:"var(--text-muted)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>{b.label}</div>
                        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                          <div style={{ fontFamily:"var(--font-head)", fontSize:28, fontWeight:900, color:b.c, lineHeight:1 }}>{count}</div>
                          <div style={{ fontFamily:"var(--font-head)", fontSize:12, color:b.c, opacity:0.6 }}>{pct.toFixed(0) + "%"}</div>
                        </div>
                        <div style={{ marginTop:8, height:4, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
                          <div style={{ width: pct + "%", height:"100%", background:b.c, borderRadius:2, transition:"width 0.8s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {tab === "timeline" && (
            <Card title="Race by Race Timeline" sub={stats.races + " races · " + stats.wins + " wins · " + stats.podiums + " podiums · " + stats.dnfs + " DNFs · Avg " + stats.avgRating + "/10"} accent={color}>
              <div style={{ display:"flex", flexDirection:"column", gap:2, paddingBottom:4 }}>
                {raceResults.map(function(r) {
                  return <RaceCard key={r.round} race={r} qualiPos={qualiMap[r.round]} sprintResult={sprintMap[r.round]} qualiResults={qualiResults} color={color} rating={ratingMap[r.round]} />;
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {!detailLoad && !stats && !loading && (
        <div style={{ padding:"48px 24px", textAlign:"center", color:"var(--text-muted)", fontFamily:"var(--font-head)", fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase", border:"1px solid var(--border)" }}>
          No race data available yet for this driver this season.
        </div>
      )}

      <style>{"@keyframes dp-spin{to{transform:rotate(360deg);}}"}</style>
    </div>
  );
}

export default DriverPerformance;