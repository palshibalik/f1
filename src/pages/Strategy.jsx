import { useEffect, useState, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// 2026 F1 DATA
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// 2026 F1 DATA — New regulations, 11 teams, pace based on early 2026 results
// Mercedes led R1 (new regs suit them). McLaren slight step back. Newey/Aston improved.
// Cadillac brand new. Audi (ex-Sauber) still building. All pts reset to 0.
// Pace gaps tightened at top — 5 teams within 0.6s/lap for competitive races.
// ═══════════════════════════════════════════════════════════════════════════════
const TEAMS = {
  MER: { name:"Mercedes",     short:"MER", col:"#00D2BE", racePace:0.000, qualiGap:0.000, pts2026:0, engine:"Mercedes"   },
  FER: { name:"Ferrari",      short:"FER", col:"#E8002D", racePace:0.120, qualiGap:0.110, pts2026:0, engine:"Ferrari"    },
  MCL: { name:"McLaren",      short:"MCL", col:"#FF8000", racePace:0.220, qualiGap:0.190, pts2026:0, engine:"Mercedes"   },
  RBR: { name:"Red Bull",     short:"RBR", col:"#3671C6", racePace:0.310, qualiGap:0.230, pts2026:0, engine:"Honda RBPT" },
  AST: { name:"Aston Martin", short:"AMR", col:"#358C75", racePace:0.420, qualiGap:0.370, pts2026:0, engine:"Honda RBPT" },
  HAA: { name:"Haas",         short:"HAA", col:"#B6BABD", racePace:0.530, qualiGap:0.460, pts2026:0, engine:"Ferrari"    },
  WIL: { name:"Williams",     short:"WIL", col:"#64C4FF", racePace:0.620, qualiGap:0.540, pts2026:0, engine:"Mercedes"   },
  RBT: { name:"Racing Bulls", short:"RBT", col:"#6692FF", racePace:0.700, qualiGap:0.610, pts2026:0, engine:"Honda RBPT" },
  ALP: { name:"Alpine",       short:"ALP", col:"#FF87BC", racePace:0.820, qualiGap:0.700, pts2026:0, engine:"Mercedes"   },
  AUD: { name:"Audi",         short:"AUD", col:"#C00000", racePace:0.920, qualiGap:0.800, pts2026:0, engine:"Audi"       },
  CAD: { name:"Cadillac",     short:"CAD", col:"#FFFFFF", racePace:1.050, qualiGap:0.940, pts2026:0, engine:"Ferrari"    },
};

const DRIVERS = [
  // Mercedes — strong new-reg package, RUS leads, ANT rapid sophomore
  { id:"RUS", name:"George Russell",    num:63, team:"MER", driverRating:-0.090, tyreMgmt:0.84, pts2026:0 },
  { id:"ANT", name:"Kimi Antonelli",    num:12, team:"MER", driverRating:+0.090, tyreMgmt:0.91, pts2026:0 },
  // Ferrari — competitive, HAM bedded in yr2, LEC still slightly quicker
  { id:"LEC", name:"Charles Leclerc",   num:16, team:"FER", driverRating:-0.075, tyreMgmt:0.90, pts2026:0 },
  { id:"HAM", name:"Lewis Hamilton",    num:44, team:"FER", driverRating:+0.075, tyreMgmt:0.87, pts2026:0 },
  // McLaren — reigning champs, slight reg step back, NOR #1 as champion
  { id:"NOR", name:"Lando Norris",      num:1,  team:"MCL", driverRating:-0.060, tyreMgmt:0.88, champion2025:true, pts2026:0 },
  { id:"PIA", name:"Oscar Piastri",     num:81, team:"MCL", driverRating:+0.060, tyreMgmt:0.89, pts2026:0 },
  // Red Bull — Adrian Newey gone, VER still elite but car step back
  { id:"VER", name:"Max Verstappen",    num:3,  team:"RBR", driverRating:-0.165, tyreMgmt:0.82, pts2026:0 },
  { id:"HAD", name:"Isack Hadjar",      num:6,  team:"RBR", driverRating:+0.165, tyreMgmt:0.97, pts2026:0 },
  // Aston Martin — Newey-designed car, ALO motivated, potential dark horse
  { id:"ALO", name:"Fernando Alonso",   num:14, team:"AST", driverRating:-0.140, tyreMgmt:0.85, pts2026:0 },
  { id:"STR", name:"Lance Stroll",      num:18, team:"AST", driverRating:+0.140, tyreMgmt:0.98, pts2026:0 },
  // Haas — solid midfield, OCO experienced, BEA sophomore
  { id:"OCO", name:"Esteban Ocon",      num:31, team:"HAA", driverRating:-0.050, tyreMgmt:0.92, pts2026:0 },
  { id:"BEA", name:"Oliver Bearman",    num:87, team:"HAA", driverRating:+0.050, tyreMgmt:0.93, pts2026:0 },
  // Williams — SAI/ALB proven combo, 5th place target
  { id:"SAI", name:"Carlos Sainz",      num:55, team:"WIL", driverRating:-0.065, tyreMgmt:0.93, pts2026:0 },
  { id:"ALB", name:"Alexander Albon",   num:23, team:"WIL", driverRating:+0.065, tyreMgmt:0.92, pts2026:0 },
  // Racing Bulls — LAW experienced, LIN only rookie on grid
  { id:"LAW", name:"Liam Lawson",       num:30, team:"RBT", driverRating:-0.055, tyreMgmt:0.96, pts2026:0 },
  { id:"LIN", name:"Arvid Lindblad",    num:41, team:"RBT", driverRating:+0.055, tyreMgmt:1.02, pts2026:0 },
  // Alpine — GAS leads, COL sophomore, Mercedes power unit upgrade
  { id:"GAS", name:"Pierre Gasly",      num:10, team:"ALP", driverRating:-0.070, tyreMgmt:0.93, pts2026:0 },
  { id:"COL", name:"Franco Colapinto",  num:43, team:"ALP", driverRating:+0.070, tyreMgmt:0.97, pts2026:0 },
  // Audi — HUL leads new project, BOR promising Brazilian talent
  { id:"HUL", name:"Nico Hulkenberg",   num:27, team:"AUD", driverRating:-0.045, tyreMgmt:0.91, pts2026:0 },
  { id:"BOR", name:"Gabriel Bortoleto", num:5,  team:"AUD", driverRating:+0.045, tyreMgmt:0.96, pts2026:0 },
  // Cadillac — new team, experienced duo but starting from scratch
  { id:"PER", name:"Sergio Perez",      num:11, team:"CAD", driverRating:-0.035, tyreMgmt:0.94, pts2026:0 },
  { id:"BOT", name:"Valtteri Bottas",   num:77, team:"CAD", driverRating:+0.035, tyreMgmt:0.95, pts2026:0 },
];

// F1 points table (P1–P10)
const POINTS_TABLE = [25,18,15,12,10,8,6,4,2,1];

const TRACKS = {
  australia:   { name:"Australia",     city:"Melbourne",   baseLap:90.861,  laps:57, fuel:110, pitLoss:23.2, overtakingFactor:0.30, drsZones:2, compound:["C3","C4","C5"], evolution:0.018, trackWidth:0.45 },
  bahrain:     { name:"Bahrain",       city:"Sakhir",      baseLap:97.520,  laps:57, fuel:108, pitLoss:22.5, overtakingFactor:0.75, drsZones:3, compound:["C1","C2","C3"], evolution:0.025, trackWidth:0.75 },
  jeddah:      { name:"Saudi Arabia",  city:"Jeddah",      baseLap:93.645,  laps:50, fuel:98,  pitLoss:24.1, overtakingFactor:0.45, drsZones:3, compound:["C2","C3","C4"], evolution:0.020, trackWidth:0.55 },
  miami:       { name:"Miami",         city:"Miami",       baseLap:91.278,  laps:57, fuel:105, pitLoss:22.8, overtakingFactor:0.50, drsZones:3, compound:["C3","C4","C5"], evolution:0.022, trackWidth:0.60 },
  imola:       { name:"Emilia Romagna",city:"Imola",       baseLap:80.334,  laps:63, fuel:100, pitLoss:22.0, overtakingFactor:0.35, drsZones:2, compound:["C2","C3","C4"], evolution:0.016, trackWidth:0.40 },
  monaco:      { name:"Monaco",        city:"Monte Carlo", baseLap:76.213,  laps:78, fuel:95,  pitLoss:26.0, overtakingFactor:0.05, drsZones:1, compound:["C4","C5","C6"], evolution:0.012, trackWidth:0.15 },
  spain:       { name:"Spain",         city:"Barcelona",   baseLap:79.875,  laps:66, fuel:110, pitLoss:22.3, overtakingFactor:0.40, drsZones:2, compound:["C1","C2","C3"], evolution:0.020, trackWidth:0.50 },
  canada:      { name:"Canada",        city:"Montreal",    baseLap:75.364,  laps:70, fuel:100, pitLoss:23.5, overtakingFactor:0.80, drsZones:2, compound:["C3","C4","C5"], evolution:0.022, trackWidth:0.80 },
  austria:     { name:"Austria",       city:"Spielberg",   baseLap:69.515,  laps:70, fuel:95,  pitLoss:21.5, overtakingFactor:0.70, drsZones:3, compound:["C3","C4","C5"], evolution:0.020, trackWidth:0.70 },
  silverstone: { name:"Britain",       city:"Silverstone", baseLap:102.352, laps:52, fuel:105, pitLoss:22.0, overtakingFactor:0.55, drsZones:2, compound:["C1","C2","C3"], evolution:0.018, trackWidth:0.65 },
  hungary:     { name:"Hungary",       city:"Budapest",    baseLap:81.131,  laps:70, fuel:105, pitLoss:22.5, overtakingFactor:0.30, drsZones:2, compound:["C2","C3","C4"], evolution:0.016, trackWidth:0.35 },
  spa:         { name:"Belgium",       city:"Spa",         baseLap:107.232, laps:44, fuel:115, pitLoss:23.1, overtakingFactor:0.65, drsZones:2, compound:["C1","C2","C3"], evolution:0.016, trackWidth:0.70 },
  zandvoort:   { name:"Netherlands",   city:"Zandvoort",   baseLap:74.623,  laps:72, fuel:100, pitLoss:22.8, overtakingFactor:0.25, drsZones:2, compound:["C1","C2","C3"], evolution:0.015, trackWidth:0.30 },
  monza:       { name:"Italy",         city:"Monza",       baseLap:82.658,  laps:53, fuel:100, pitLoss:23.8, overtakingFactor:0.60, drsZones:2, compound:["C2","C3","C4"], evolution:0.018, trackWidth:0.65 },
  baku:        { name:"Azerbaijan",    city:"Baku",        baseLap:105.232, laps:51, fuel:105, pitLoss:24.5, overtakingFactor:0.70, drsZones:2, compound:["C3","C4","C5"], evolution:0.018, trackWidth:0.65 },
  singapore:   { name:"Singapore",     city:"Singapore",   baseLap:96.820,  laps:62, fuel:110, pitLoss:25.5, overtakingFactor:0.35, drsZones:3, compound:["C3","C4","C5"], evolution:0.014, trackWidth:0.40 },
  austin:      { name:"United States", city:"Austin",      baseLap:99.230,  laps:56, fuel:110, pitLoss:23.0, overtakingFactor:0.55, drsZones:3, compound:["C2","C3","C4"], evolution:0.020, trackWidth:0.65 },
  mexico:      { name:"Mexico",        city:"Mexico City", baseLap:81.485,  laps:71, fuel:105, pitLoss:23.5, overtakingFactor:0.45, drsZones:3, compound:["C1","C2","C3"], evolution:0.018, trackWidth:0.55 },
  brazil:      { name:"Brazil",        city:"São Paulo",   baseLap:73.669,  laps:71, fuel:100, pitLoss:22.5, overtakingFactor:0.75, drsZones:2, compound:["C3","C4","C5"], evolution:0.022, trackWidth:0.75 },
  lasvegas:    { name:"Las Vegas",     city:"Las Vegas",   baseLap:95.299,  laps:50, fuel:100, pitLoss:23.8, overtakingFactor:0.60, drsZones:3, compound:["C3","C4","C5"], evolution:0.016, trackWidth:0.65 },
  qatar:       { name:"Qatar",         city:"Lusail",      baseLap:85.416,  laps:57, fuel:105, pitLoss:22.0, overtakingFactor:0.50, drsZones:3, compound:["C1","C2","C3"], evolution:0.020, trackWidth:0.60 },
  abudhabi:    { name:"Abu Dhabi",     city:"Yas Marina",  baseLap:88.681,  laps:58, fuel:105, pitLoss:22.5, overtakingFactor:0.45, drsZones:3, compound:["C1","C2","C3"], evolution:0.018, trackWidth:0.55 },
  suzuka:      { name:"Japan",         city:"Suzuka",      baseLap:92.285,  laps:53, fuel:105, pitLoss:22.6, overtakingFactor:0.25, drsZones:2, compound:["C1","C2","C3"], evolution:0.015, trackWidth:0.30 },
  china:       { name:"China",         city:"Shanghai",    baseLap:96.768,  laps:56, fuel:108, pitLoss:23.0, overtakingFactor:0.55, drsZones:2, compound:["C2","C3","C4"], evolution:0.020, trackWidth:0.60 },
};

// TYRE COMPOUNDS
const COMPOUNDS = {
  C1: { name:"Hard",        role:"Hard",   col:"#FFFFFF", delta: 0.00, degradation:0.0390, cliffAt:0.74, maxLife:65, warmupLaps:4, optTempLo:90, optTempHi:115, thermalSens:0.018 },
  C2: { name:"Hard",        role:"Hard",   col:"#DDDDDD", delta: 0.00, degradation:0.0432, cliffAt:0.72, maxLife:60, warmupLaps:3, optTempLo:88, optTempHi:112, thermalSens:0.020 },
  C3: { name:"Medium",      role:"Medium", col:"#FFD700", delta:-0.40, degradation:0.0520, cliffAt:0.68, maxLife:45, warmupLaps:2, optTempLo:85, optTempHi:108, thermalSens:0.025 },
  C4: { name:"Medium",      role:"Medium", col:"#FFA500", delta:-0.78, degradation:0.0572, cliffAt:0.65, maxLife:36, warmupLaps:2, optTempLo:82, optTempHi:105, thermalSens:0.028 },
  C5: { name:"Soft",        role:"Soft",   col:"#E8002D", delta:-1.25, degradation:0.0848, cliffAt:0.58, maxLife:28, warmupLaps:1, optTempLo:80, optTempHi:100, thermalSens:0.035 },
  C6: { name:"Soft",        role:"Soft",   col:"#FF4488", delta:-1.65, degradation:0.1050, cliffAt:0.50, maxLife:20, warmupLaps:1, optTempLo:78, optTempHi:98,  thermalSens:0.040 },
  I:  { name:"Intermediate",role:"Inter",  col:"#39B54A", delta: 3.50, degradation:0.0300, cliffAt:0.85, maxLife:50, warmupLaps:2, optTempLo:50, optTempHi:80,  thermalSens:0.010 },
  W:  { name:"Wet",         role:"Wet",    col:"#0067FF", delta: 8.00, degradation:0.0150, cliffAt:0.90, maxLife:60, warmupLaps:3, optTempLo:30, optTempHi:60,  thermalSens:0.008 },
};



// Returns the event-relative tyre name: hardest=Hard, middle=Medium, softest=Soft
// This is how Pirelli labels them at each race (C1 might be "Hard" at Bahrain but "Medium" elsewhere)
function relName(compoundKey, trackKey) {
  const allocation = TRACKS[trackKey]?.compound || [];
  const idx = allocation.indexOf(compoundKey);
  if (idx === 0) return "Hard";
  if (idx === 1) return "Medium";
  if (idx === 2) return "Soft";
  // Wet tyres keep their absolute names
  if (compoundKey === "I") return "Intermediate";
  if (compoundKey === "W") return "Wet";
  // Fallback for compounds not in allocation
  return COMPOUNDS[compoundKey]?.name || compoundKey;
}

const TEAM_STRATEGY = {
  MER: { preferLong:true,  aggression:0.7, prefStart:"Medium", stops:1 },
  FER: { preferLong:false, aggression:0.9, prefStart:"Soft",   stops:1 },
  MCL: { preferLong:true,  aggression:0.6, prefStart:"Medium", stops:1 },
  RBR: { preferLong:false, aggression:0.8, prefStart:"Medium", stops:1 },
  AST: { preferLong:true,  aggression:0.5, prefStart:"Hard",   stops:1 },
  HAA: { preferLong:false, aggression:0.8, prefStart:"Soft",   stops:2 },
  WIL: { preferLong:true,  aggression:0.4, prefStart:"Hard",   stops:1 },
  RBT: { preferLong:false, aggression:0.7, prefStart:"Medium", stops:1 },
  ALP: { preferLong:false, aggression:0.6, prefStart:"Medium", stops:1 },
  AUD: { preferLong:true,  aggression:0.4, prefStart:"Medium", stops:1 },
  CAD: { preferLong:true,  aggression:0.3, prefStart:"Hard",   stops:2 },
};

const CIRCUIT_PATHS = {
  australia:   { pts:[[.16,-.88],[.4,-.82],[.56,-.66],[.62,-.46],[.56,-.28],[.42,-.18],[.28,-.2],[.18,-.34],[.2,-.5],[.32,-.6],[.46,-.54],[.52,-.4],[.5,-.22],[.4,-.1],[.28,-.02],[.14,-.06],[.04,-.16],[0,-.3],[-.08,-.44],[-.22,-.52],[-.38,-.5],[-.5,-.36],[-.52,-.18],[-.42,-.04],[-.28,.06],[-.14,.1],[-.04,.02],[-.02,-.1],[-.06,-.26],[.04,-.4],[.14,-.54],[.18,-.68]], pitOff:0.055 },
  bahrain:     { pts:[[.35,-.85],[.58,-.78],[.72,-.6],[.78,-.38],[.75,-.15],[.65,.05],[.52,.18],[.46,.35],[.5,.55],[.58,.72],[.48,.84],[.28,.88],[.08,.82],[-.08,.68],[-.12,.48],[-.02,.28],[.08,.1],[.06,-.08],[-.04,-.2],[-.18,-.22],[-.3,-.14],[-.42,-.02],[-.44,.16],[-.38,.32],[-.24,.42],[-.1,.38],[-.06,.22],[-.14,.08],[-.28,.04],[-.44,.1],[-.56,.28],[-.58,.5],[-.5,.68],[-.32,.8],[-.1,.8],[.08,.72],[.18,.55],[.12,.35],[.02,.18],[.06,-.02],[.18,-.18],[.26,-.38],[.28,-.62],[.24,-.78]], pitOff:0.055 },
  jeddah:      { pts:[[-.02,-.9],[.18,-.82],[.38,-.7],[.54,-.52],[.62,-.28],[.6,-.04],[.5,.18],[.34,.35],[.14,.46],[-.04,.44],[-.18,.34],[-.22,.18],[-.18,.04],[-.08,-.1],[-.02,-.24],[-.08,-.4],[-.16,-.56],[-.06,-.7]], pitOff:0.05 },
  miami:       { pts:[[-.06,-.88],[.18,-.82],[.4,-.7],[.56,-.52],[.62,-.28],[.58,-.04],[.46,.16],[.28,.3],[.06,.34],[-.14,.28],[-.28,.14],[-.3,-.02],[-.2,-.16],[-.08,-.26],[-.02,-.4],[-.1,-.58],[-.16,-.72]], pitOff:0.055 },
  imola:       { pts:[[-.04,-.9],[.2,-.85],[.44,-.75],[.62,-.58],[.7,-.36],[.68,-.12],[.58,.1],[.4,.28],[.18,.36],[-.04,.32],[-.16,.18],[-.1,.02],[.04,-.12],[.08,-.28],[.02,-.44],[-.1,-.58],[-.24,-.72]], pitOff:0.05 },
  monaco:      { pts:[[.16,-.88],[.4,-.82],[.56,-.66],[.62,-.46],[.56,-.28],[.42,-.18],[.28,-.2],[.18,-.34],[.2,-.5],[.32,-.6],[.46,-.54],[.52,-.4],[.5,-.22],[.4,-.1],[.28,-.02],[.14,-.06],[.04,-.16],[0,-.3],[-.08,-.44],[-.22,-.52],[-.38,-.5],[-.5,-.36],[-.52,-.18],[-.42,-.04],[-.28,.06],[-.14,.1],[-.04,.02],[-.02,-.1],[-.06,-.26],[.04,-.4],[.14,-.54],[.18,-.68]], pitOff:0.06 },
  spain:       { pts:[[-.88,.02],[-.72,.2],[-.52,.26],[-.32,.2],[-.16,.06],[-.1,-.12],[-.18,-.32],[-.4,-.44],[-.62,-.42],[-.74,-.26],[-.72,-.04],[-.58,.08],[-.38,.04],[-.22,-.06],[-.16,-.22],[-.22,-.4],[-.08,-.6],[.1,-.74],[.34,-.78],[.58,-.72],[.74,-.56],[.8,-.32],[.78,-.06],[.7,.16],[.54,.3],[.28,.36],[.02,.34],[-.14,.22],[-.22,.1],[-.88,.02]], pitOff:0.05 },
  canada:      { pts:[[-.04,-.9],[.2,-.85],[.44,-.75],[.62,-.58],[.7,-.36],[.68,-.12],[.58,.1],[.4,.28],[.18,.36],[-.04,.32],[-.16,.18],[-.1,.02],[.04,-.12],[.08,-.28],[.02,-.44],[-.1,-.58],[-.24,-.72]], pitOff:0.05 },
  austria:     { pts:[[.02,-.9],[.28,-.82],[.5,-.66],[.64,-.44],[.66,-.2],[.56,.02],[.38,.18],[.16,.24],[-.06,.2],[-.2,.08],[-.24,-.08],[-.16,-.24],[-.04,-.32],[.06,-.42],[.06,-.6],[-.04,-.76]], pitOff:0.05 },
  silverstone: { pts:[[-.04,-.9],[.2,-.88],[.44,-.8],[.64,-.62],[.74,-.4],[.74,-.14],[.64,.1],[.46,.3],[.26,.38],[.06,.32],[-.04,.18],[.02,.04],[.14,-.06],[.2,-.2],[.16,-.36],[.04,-.42],[-.14,-.38],[-.24,-.24],[-.24,-.08],[-.14,.06],[-.04,.12],[-.06,.26],[-.18,.36],[-.36,.38],[-.52,.3],[-.64,.18],[-.72,.02],[-.7,-.18],[-.6,-.38],[-.42,-.56],[-.22,-.7]], pitOff:0.05 },
  hungary:     { pts:[[.02,-.9],[.26,-.82],[.46,-.66],[.58,-.44],[.6,-.2],[.5,.02],[.34,.18],[.12,.26],[-.1,.22],[-.24,.1],[-.3,-.06],[-.22,-.22],[-.1,-.34],[-.02,-.48],[-.08,-.64],[-.16,-.78]], pitOff:0.05 },
  spa:         { pts:[[-.14,-.9],[.1,-.84],[.34,-.72],[.46,-.52],[.44,-.32],[.3,-.18],[.12,-.14],[0,-.24],[-.02,-.44],[.1,-.62],[.28,-.72],[.44,-.68],[.54,-.5],[.52,-.32],[.4,-.18],[.24,-.1],[.08,-.1],[-.04,-.2],[-.08,-.38],[0,-.56],[.12,-.66],[.28,-.66],[.42,-.56],[.46,-.38],[.44,-.2],[.34,-.08],[.16,.02],[0,.06],[-.2,.06],[-.38,.16],[-.5,.3],[-.52,.52],[-.42,.66],[-.22,.78],[.02,.82],[.2,.8],[.38,.68],[.44,.5],[.4,.3],[.28,.18],[.1,.1],[-.12,.08],[-.3,.0],[-.4,-.1],[-.36,-.26],[-.22,-.4],[-.18,-.56],[-.22,-.74]], pitOff:0.05 },
  zandvoort:   { pts:[[.02,-.9],[.26,-.82],[.46,-.66],[.6,-.44],[.62,-.2],[.52,.02],[.36,.2],[.16,.28],[-.04,.24],[-.18,.12],[-.22,-.04],[-.14,-.18],[-.02,-.24],[.1,-.18],[.16,-.04],[.12,.1],[.02,.2],[-.1,.22],[-.22,.14],[-.3,-.02],[-.28,-.2],[-.16,-.36],[-.04,-.5],[.04,-.64],[.04,-.78]], pitOff:0.05 },
  monza:       { pts:[[-.02,-.9],[.3,-.88],[.58,-.8],[.78,-.62],[.86,-.38],[.84,-.12],[.76,.12],[.6,.35],[.38,.52],[.14,.58],[.02,.52],[.06,.36],[.18,.24],[.2,.08],[.1,-.04],[-.02,-.02],[-.1,.1],[-.08,.26],[.0,.4],[-.06,.54],[-.2,.6],[-.38,.56],[-.54,.44],[-.62,.26],[-.6,.06],[-.5,-.08],[-.38,-.14],[-.28,-.08],[-.18,-.02],[-.1,-.12],[-.12,-.28],[-.18,-.42],[-.1,-.56],[-.04,-.72]], pitOff:0.05 },
  baku:        { pts:[[-.02,-.9],[.22,-.82],[.44,-.7],[.6,-.5],[.64,-.26],[.56,-.02],[.42,.16],[.22,.28],[0,.3],[-.18,.22],[-.28,.06],[-.24,-.12],[-.12,-.26],[-.02,-.4],[-.04,-.58],[-.1,-.74]], pitOff:0.05 },
  singapore:   { pts:[[.12,-.88],[.36,-.8],[.54,-.64],[.64,-.42],[.62,-.18],[.5,.04],[.32,.2],[.1,.26],[-.1,.22],[-.24,.1],[-.3,-.06],[-.22,-.22],[-.1,-.32],[-.02,-.44],[-.06,-.6],[-.14,-.74],[-.02,-.84]], pitOff:0.06 },
  austin:      { pts:[[.02,-.9],[.26,-.82],[.46,-.66],[.6,-.44],[.62,-.2],[.52,.02],[.36,.2],[.14,.28],[-.08,.24],[-.22,.1],[-.28,-.06],[-.2,-.22],[-.08,-.32],[.02,-.44],[.0,-.62],[-.08,-.76]], pitOff:0.05 },
  mexico:      { pts:[[-.04,-.9],[.2,-.82],[.42,-.68],[.58,-.48],[.64,-.24],[.58,0],[.44,.18],[.22,.3],[0,.32],[-.2,.26],[-.34,.1],[-.36,-.08],[-.26,-.24],[-.12,-.36],[-.04,-.52],[-.08,-.7]], pitOff:0.05 },
  brazil:      { pts:[[.02,-.9],[.26,-.82],[.46,-.66],[.58,-.44],[.6,-.2],[.5,.02],[.34,.18],[.12,.26],[-.1,.22],[-.24,.1],[-.3,-.06],[-.22,-.22],[-.1,-.32],[-.02,-.44],[-.06,-.6],[-.14,-.76]], pitOff:0.05 },
  lasvegas:    { pts:[[-.04,-.9],[.2,-.84],[.42,-.72],[.58,-.54],[.64,-.3],[.58,-.06],[.44,.12],[.22,.24],[0,.26],[-.2,.2],[-.32,.04],[-.3,-.14],[-.18,-.28],[-.06,-.4],[-.06,-.58],[-.12,-.74]], pitOff:0.05 },
  qatar:       { pts:[[.02,-.9],[.26,-.82],[.46,-.66],[.6,-.44],[.62,-.2],[.52,.02],[.36,.2],[.14,.28],[-.08,.24],[-.22,.1],[-.28,-.06],[-.2,-.22],[-.08,-.32],[.02,-.44],[.0,-.62],[-.08,-.76]], pitOff:0.05 },
  abudhabi:    { pts:[[.16,-.88],[.4,-.82],[.56,-.66],[.62,-.46],[.56,-.28],[.42,-.18],[.28,-.2],[.18,-.34],[.2,-.5],[.32,-.6],[.46,-.54],[.52,-.4],[.5,-.22],[.4,-.1],[.28,-.02],[.14,-.06],[.04,-.16],[0,-.3],[-.08,-.44],[-.22,-.52],[-.38,-.5],[-.5,-.36],[-.52,-.18],[-.42,-.04],[-.28,.06],[-.14,.1],[-.04,.02],[-.02,-.1],[-.06,-.26],[.04,-.4],[.14,-.54],[.18,-.68]], pitOff:0.055 },
  suzuka:      { pts:[[.02,-.9],[.26,-.82],[.46,-.66],[.6,-.44],[.62,-.2],[.52,.02],[.36,.2],[.16,.28],[-.04,.24],[-.18,.12],[-.22,-.04],[-.14,-.18],[-.02,-.24],[.1,-.18],[.16,-.04],[.12,.1],[.02,.2],[-.1,.22],[-.22,.14],[-.3,-.02],[-.28,-.2],[-.16,-.36],[-.04,-.5],[.04,-.64],[.04,-.78]], pitOff:0.05 },
  china:       { pts:[[-.04,-.9],[.2,-.85],[.44,-.75],[.62,-.58],[.7,-.36],[.68,-.12],[.58,.1],[.4,.28],[.18,.36],[-.04,.32],[-.16,.18],[-.1,.02],[.04,-.12],[.08,-.28],[.02,-.44],[-.1,-.58],[-.24,-.72]], pitOff:0.05 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GEOMETRY UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════
function buildSpline(raw, n = 800) {
  const out = [], len = raw.length, steps = Math.ceil(n / len);
  for (let i = 0; i < len; i++) {
    const p0=raw[(i-1+len)%len],p1=raw[i],p2=raw[(i+1)%len],p3=raw[(i+2)%len];
    for (let s = 0; s < steps; s++) {
      const t=s/steps,t2=t*t,t3=t2*t;
      out.push([
        .5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
        .5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3),
      ]);
    }
  }
  return out;
}
function makeMap(spline, W, H, pad = 38) {
  const xs=spline.map(p=>p[0]),ys=spline.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const sc=Math.min((W-pad*2)/(maxX-minX),(H-pad*2)/(maxY-minY));
  const ox=pad+(W-pad*2-(maxX-minX)*sc)/2-minX*sc;
  const oy=pad+(H-pad*2-(maxY-minY)*sc)/2-minY*sc;
  return { toCanvas:(nx,ny)=>[nx*sc+ox,ny*sc+oy] };
}
function splinePt(spline, frac) {
  const n=spline.length,fi=((frac%1)+1)%1*n;
  const i=Math.floor(fi)%n,j=(i+1)%n,f=fi-Math.floor(fi);
  return [spline[i][0]+(spline[j][0]-spline[i][0])*f,spline[i][1]+(spline[j][1]-spline[i][1])*f];
}
function buildPitPath(spline, pitOff) {
  const n=spline.length,count=Math.floor(n*0.13),si=Math.floor(n*0.87),pts=[];
  for (let k=0;k<=count;k++) {
    const idx=(si+k)%n,nxt=(idx+1)%n;
    const [x,y]=spline[idx],[nx,ny]=spline[nxt];
    const dx=nx-x,dy=ny-y,l=Math.sqrt(dx*dx+dy*dy)||1;
    pts.push([x-dy/l*pitOff,y+dx/l*pitOff]);
  }
  return pts;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETERMINISTIC HASH
// ═══════════════════════════════════════════════════════════════════════════════
// raceSeed is mixed into all hash calls so re-running same config gives different results
let _raceSeed = 1;
function setRaceSeed(s) { _raceSeed = (s || 1) & 0xFFFF; }

function driverHash(driverId, seed) {
  let h = ((seed ^ (_raceSeed * 2654435761)) >>> 0) & 0xFFFFFF;
  for (let c of String(driverId)) h = (h * 31 + c.charCodeAt(0)) & 0xFFFFFF;
  return ((h * 9301 + 49297) % 233574) / 233574;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOUND HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function getCompoundKey(trackKey, role) {
  const T = TRACKS[trackKey];
  if (!T) return role === "Soft" ? "C5" : role === "Medium" ? "C3" : "C1";
  const compounds = T.compound;
  if (role === "Hard")   return compounds[0];
  if (role === "Medium") return compounds[1];
  return compounds[2];
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYRE TEMPERATURE MODEL — fixed: stabilizes after warmup, thermal accumulation
// ═══════════════════════════════════════════════════════════════════════════════
function calcTyreTemp(C, stintLap, pushMode, inDirtyAir, isSC, accumulatedHeatDamage) {
  // Temp rises quickly in warmup laps then stabilizes at a plateau
  // Real F1: typically 3-6 laps to reach working range, then stable
  const warmupPhase = Math.min(1.0, stintLap / (C.warmupLaps + 2));
  const baseOperating = (C.optTempLo + C.optTempHi) / 2; // midpoint of optimal window
  
  // Temperature builds to operating plateau, not infinitely
  const baseTemp = C.optTempLo * 0.6 + baseOperating * warmupPhase * 0.4 + 
                   warmupPhase * (baseOperating - C.optTempLo * 0.6);
  
  const pushBoost    = pushMode   ? (C.optTempHi - baseOperating) * 0.7  : 0;
  const saveReduction= !pushMode  ? (baseOperating - C.optTempLo) * 0.4  : 0;
  const dirtyPenalty = inDirtyAir ? 8 : 0; // aero-induced balance change heats tyres
  const scCool       = isSC       ? -20 : 0;
  // Accumulated heat damage from previous overheating (permanent degradation)
  const heatBias     = (accumulatedHeatDamage || 0) * 5;

  const temp = Math.min(145, Math.max(25, baseTemp + pushBoost - saveReduction + dirtyPenalty + scCool + heatBias));
  return temp;
}

function tempPenalty(C, temp) {
  if (temp < C.optTempLo) return (C.optTempLo - temp) * 0.09; // cold tyre — graining risk
  if (temp > C.optTempHi) return (temp - C.optTempHi) * 0.14; // overheating — blistering
  return 0;
}

// Returns multiplier for degradation rate based on temperature
function thermalDegMultiplier(C, temp) {
  if (temp <= C.optTempHi) return 1.0;
  // Above optimal: exponential thermal degradation increase (permanent rubber damage)
  const overTemp = temp - C.optTempHi;
  return 1.0 + overTemp * C.thermalSens;
}

function tempColor(temp) {
  if (temp < 70)  return "#4fc3f7";
  if (temp < 85)  return "#81d4fa";
  if (temp < 105) return "#39B54A";
  if (temp < 120) return "#FFD700";
  return "#E8002D";
}

// ═══════════════════════════════════════════════════════════════════════════════
// RIVAL STRATEGY BUILDER
// ═══════════════════════════════════════════════════════════════════════════════
function buildRivalStints(teamId, trackKey, driverId) {
  const T = TRACKS[trackKey];
  const strat = TEAM_STRATEGY[teamId] || TEAM_STRATEGY.MCL;
  const L = T.laps;
  const softKey  = getCompoundKey(trackKey, "Soft");
  const medKey   = getCompoundKey(trackKey, "Medium");
  const hardKey  = getCompoundKey(trackKey, "Hard");

  const seed = driverId || teamId;
  const h1 = driverHash(seed, trackKey.charCodeAt(0) * 17 + 3);
  const h2 = driverHash(seed, trackKey.charCodeAt(0) * 31 + 7);
  const h3 = driverHash(seed, (trackKey.charCodeAt(1) || 99) * 13 + 11);

  const teamDrivers = DRIVERS.filter(d => d.team === teamId);
  const driverIdx   = teamDrivers.findIndex(d => d.id === driverId);
  const flipStart   = driverIdx === 1;

  const allStops = strat.stops === 2 || h1 < 0.20;

  if (allStops) {
    const p1Base = Math.round(11 + h1 * 8);
    const p1     = Math.min(p1Base, L - 22);
    const p2Base = Math.round(p1 + 14 + h2 * 12);
    const p2     = Math.min(p2Base, L - 8);
    const s1 = flipStart ? medKey  : softKey;
    const s2 = medKey;
    const s3 = flipStart ? softKey : hardKey;
    return [
      { compound: s1, laps: p1 },
      { compound: s2, laps: p2 - p1 },
      { compound: s3, laps: L - p2 },
    ];
  }

  let prefComp;
  if (flipStart) {
    prefComp = strat.prefStart === "Soft"   ? medKey :
               strat.prefStart === "Medium" ? (h3 > 0.5 ? softKey : hardKey) :
               medKey;
  } else {
    prefComp = strat.prefStart === "Soft"   ? softKey :
               strat.prefStart === "Medium" ? medKey   : hardKey;
  }

  let comp2;
  if (prefComp === hardKey)       comp2 = medKey;
  else if (prefComp === softKey)  comp2 = (h2 > 0.6 ? hardKey : medKey);
  else                            comp2 = h2 > 0.5 ? hardKey : softKey;

  let minPit, maxPit;
  if (prefComp === hardKey)       { minPit=25; maxPit=45; }
  else if (prefComp === softKey)  { minPit=8;  maxPit=22; }
  else                            { minPit=15; maxPit=35; }

  const lapScale = L / 57;
  minPit = Math.round(minPit * lapScale);
  maxPit = Math.round(maxPit * lapScale);
  // Ensure 2nd stint is at least 20 laps — prevents ultra-late stops on long-lap tracks
  maxPit = Math.min(maxPit, L - 20);
  const pitLap  = Math.round(minPit + h3 * (maxPit - minPit));
  const clamped = Math.min(Math.max(pitLap, 8), L - 8);
  return [
    { compound: prefComp, laps: clamped },
    { compound: comp2,    laps: L - clamped },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAP 1 CHAOS — realistic first lap position shuffles
// ═══════════════════════════════════════════════════════════════════════════════
function simulateLapOneChaos(carInputs, trackKey) {
  // Returns array of additional gap seconds added to cumTime after lap 1
  // Simulates: wheelspin, T1 incidents, battles into first corner
  const T = TRACKS[trackKey];
  const n = carInputs.length;
  const chaos = Array(n).fill(0);
  
  carInputs.forEach((car, idx) => {
    const gridPos = car.gridPos; // 1-indexed
    
    // Reaction time variation: 0.15–0.45s, slightly worse for midfield
    const reactionSeed = driverHash(car.driver.id, 555);
    const reactionTime = 0.15 + reactionSeed * 0.30;
    
    // Wheelspin/launch: top teams better launches, more variation in midfield
    const launchSeed = driverHash(car.driver.id, 666);
    const teamLaunchBonus = TEAMS[car.driver.team]?.racePace < 0.4 ? 0 : 0.08;
    const launchPenalty = launchSeed * (0.5 + teamLaunchBonus);
    
    // First corner incident risk: higher for midfield
    // Monaco, Imola, Jeddah have high T1 incident rate
    const incidentTrackFactor = T.trackWidth < 0.4 ? 2.5 : T.trackWidth < 0.6 ? 1.5 : 1.0;
    const incidentSeed = driverHash(car.driver.id, 777 + gridPos);
    const incidentRisk = (gridPos > 10 ? 0.12 : gridPos > 5 ? 0.07 : 0.03) * incidentTrackFactor;
    const incidentPenalty = incidentSeed < incidentRisk ? (1.5 + incidentSeed * 8.0) : 0;
    
    // Slipstream opportunity for P4-P10 at high-speed tracks
    const slipstreamGain = T.overtakingFactor > 0.6 && gridPos >= 4 && gridPos <= 10
      ? driverHash(car.driver.id, 888) * 0.8
      : 0;
    
    chaos[idx] = reactionTime + launchPenalty + incidentPenalty - slipstreamGain;
  });
  
  return chaos;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SIMULATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
function simulateRace(trackKey, allCarInputs, scLap, weather, weatherChangeLap) {
  const T        = TRACKS[trackKey];
  const fuelBurn = T.fuel / T.laps;
  const baseLap  = T.baseLap;

  // Build stint schedule per car
  const carBounds = allCarInputs.map(car => {
    let cur = 1;
    return car.stints.map(s => {
      const b = { ...s, start: cur, end: cur + s.laps - 1 };
      cur += s.laps;
      return b;
    });
  });

  // Race state
  const cumTimes   = allCarInputs.map(c => c.startGap);
  const lapResults = allCarInputs.map(() => []);
  
  // Per-car accumulated thermal damage (persistent heat damage to rubber)
  const accHeatDamage = allCarInputs.map(() => 0);
  
  // Per-car DNF status — populated immediately below
  const dnfLap = allCarInputs.map(() => null);

  // DNF probability per car — ~8% total DNF rate across field like real F1
  // Higher risk for lower teams; user car is protected from DNF
  const teamReliability = {
    MER:0.97, FER:0.96, MCL:0.96, RBR:0.95, AST:0.94,
    HAA:0.93, WIL:0.93, RBT:0.92, ALP:0.91,
    AUD:0.88, // new PU, teething issues expected
    CAD:0.86, // brand new team, significant reliability risk
  };
  allCarInputs.forEach((car, ci) => {
    if (car.isUser) return; // user car never DNFs
    const rel = teamReliability[car.driver.team] || 0.93;
    const roll = driverHash(car.driver.id, 12345);
    if (roll > rel) {
      const lapRoll = driverHash(car.driver.id, 99999);
      dnfLap[ci] = Math.max(3, Math.floor(lapRoll * T.laps));
    }
  });

  // Whether each car has reacted to user pit (for reactive undercut)
  const hasReactedToUserPit = allCarInputs.map(() => false);
  const userPittedOnLap = { lap: null };

  // Driver personality constants — per circuit (some drivers excel at specific tracks)
  const charOffset = allCarInputs.map(car => {
    const base = (driverHash(car.driver.id, 7777) - 0.5) * 0.08;
    const circuitAffinity = (driverHash(car.driver.id, trackKey.charCodeAt(0) * 53 + 19) - 0.5) * 0.06;
    return base + circuitAffinity;
  });

  // Lap 1 chaos
  const lap1Chaos = simulateLapOneChaos(allCarInputs, trackKey);

  // Track rubber: non-linear buildup, circuit-specific, rain resets
  // evolution factor per track already defined
  let trackRubber = 0; // accumulated grip improvement in seconds
  
  // Effective weather per lap (handles mid-race transitions)
  function getWeather(lap) {
    if (!weatherChangeLap || lap < weatherChangeLap) return weather;
    // After weather change: transition over 3 laps
    if (lap < weatherChangeLap + 3) return "inter";
    return weather === "dry" ? "wet" : "dry"; // flip
  }

  const pushThisLap = allCarInputs.map(car => car.pushMode);
  // SC state — tracks which cars have bunched
  let scBunchDone = false;

  for (let lap = 1; lap <= T.laps; lap++) {
    const effectiveWeather = getWeather(lap);
    const isSC  = !!(scLap && lap >= scLap  && lap <= scLap + 3);
    const isVSC = !!(scLap && lap === scLap + 4);
    
    // Rain resets track rubber
    if (effectiveWeather !== "dry") {
      trackRubber = 0;
    } else {
      // Non-linear rubber buildup: fast early, diminishing returns
      // Real F1: track can improve by 0.5-1.5s over a race
      const maxRubber = 1.2 * T.evolution / 0.020; // scale by track evolution factor
      const rubberRate = T.evolution * Math.exp(-lap / (T.laps * 0.4)); // exponential decay of improvement rate
      trackRubber = Math.min(maxRubber, trackRubber + rubberRate);
    }

    // Race order by cumulative time
    const activeCars = allCarInputs.map((_, ci) => ci).filter(ci => dnfLap[ci] === null || dnfLap[ci] >= lap);
    const order = activeCars.sort((a, b) => cumTimes[a] - cumTimes[b]);

    // ── SAFETY CAR BUNCHING — compress the field ────────────────────────────
    // On first SC lap, bunch everyone up behind the leader
    if (isSC && !scBunchDone && lap === scLap) {
      scBunchDone = true;
      const leaderTime = cumTimes[order[0]];
      // Real F1 SC queue: ~0.65s per car gap → P20 ~13s behind leader
      order.forEach((ci, rank) => {
        if (rank === 0) return;
        const naturalGap = cumTimes[ci] - leaderTime;
        // Cars within 1 lap compress to queue; cars more than ~1 lap behind lap down
        if (naturalGap < baseLap * 0.85) {
          const queueGap = rank * 0.65;
          cumTimes[ci] = leaderTime + queueGap;
        }
        // Cars more than 1 lap down stay lapped — don't compress them
      });
    }

    // Dynamic push decision for rivals — reactive strategy
    allCarInputs.forEach((car, ci) => {
      if (dnfLap[ci] !== null && dnfLap[ci] < lap) return;
      if (car.isUser) { pushThisLap[ci] = car.pushMode; return; }
      const rank = order.indexOf(ci);
      const gapAhead  = rank > 0  ? cumTimes[ci] - cumTimes[order[rank-1]] : 99;
      const gapBehind = rank < order.length-1 ? cumTimes[order[rank+1]] - cumTimes[ci] : 99;
      const bounds    = carBounds[ci];
      const stint     = bounds.find(b => lap >= b.start && lap <= b.end);
      const wearFrac  = stint ? (lap - stint.start) / (COMPOUNDS[stint.compound]?.maxLife || 40) : 0;
      pushThisLap[ci] = gapBehind < 1.5 || gapAhead < 1.5 || wearFrac < 0.15 || lap > T.laps - 8;
    });

    // STEP 1: Base lap time per car
    const rawTimes = allCarInputs.map((car, ci) => {
      if (dnfLap[ci] !== null && dnfLap[ci] <= lap) return baseLap + 9999; // retired
      
      const bounds = carBounds[ci];
      const stint  = bounds.find(b => lap >= b.start && lap <= b.end);
      if (!stint) return baseLap + 60;

      // Weather compound override
      const originalCompound = stint.compound;
      let cKey = originalCompound;
      if (effectiveWeather === "wet")   cKey = "W";
      else if (effectiveWeather === "inter") cKey = "I";
      // Transition lap penalty: only fires if driver is on SLICKS during wet weather
      // Tapers: worst on first wet lap (15s), reducing each lap as driver adjusts lines
      const onSlicks = originalCompound !== "W" && originalCompound !== "I";
      const lapsIntoChange = weatherChangeLap ? lap - weatherChangeLap : -1;
      const weatherChangePenalty = weatherChangeLap && lapsIntoChange >= 0 && lapsIntoChange <= 2
        && effectiveWeather !== "dry" && onSlicks
        ? (3 - lapsIntoChange) / 3 * 15.0 : 0;

      const C        = COMPOUNDS[cKey] || COMPOUNDS.C3;
      const stintLap = lap - stint.start;
      const wearFrac = stintLap / C.maxLife;
      const pushing  = pushThisLap[ci];

      // Tyre temperature (now stabilizes, doesn't keep rising)
      const rank       = order.indexOf(ci);
      const aheadGap   = rank > 0 ? Math.max(0, cumTimes[ci] - cumTimes[order[Math.max(0,rank-1)]]) : 99;
      const inDirtyAir = aheadGap < 2.0 && rank > 0;
      const tyreTemp   = calcTyreTemp(C, stintLap, pushing, inDirtyAir, isSC, accHeatDamage[ci]);
      
      // Accumulate heat damage when running above optimal temp (permanent degradation)
      if (tyreTemp > C.optTempHi + 5) {
        accHeatDamage[ci] += (tyreTemp - C.optTempHi - 5) * 0.001;
      }

      // Thermal degradation multiplier (permanent heat damage to rubber)
      const thermDegMult = thermalDegMultiplier(C, tyreTemp);
      
      // Linear degradation: tyreMgmt and push/save are independent multipliers
      // tyreMgmt < 1 = gentle on tyres; push/save is a separate tactical choice
      const effDeg = C.degradation * (1 + accHeatDamage[ci] * 2.0);
      const pushDegMult = pushing ? 1.30 : 0.55;
      const baseDeg = effDeg * stintLap * thermDegMult;
      const degWithMgmt = baseDeg * car.driver.tyreMgmt * pushDegMult;

      // Cliff: exponential after tyre life threshold
      // tyreMgmt scales cliff too — better managers genuinely delay/soften the cliff
      const cliffFactor = wearFrac > C.cliffAt
        ? Math.pow((wearFrac - C.cliffAt) / (1 - C.cliffAt), 2.2) * 5.2 * car.driver.tyreMgmt : 0;

      // Warmup
      const warmup = stintLap < C.warmupLaps && stintLap > 0
        ? (C.warmupLaps - stintLap) * 0.55 * (1 - stintLap / C.warmupLaps) : 0;

      // Fuel & track
      const fuelLoad    = Math.max(0, T.fuel - lap * fuelBurn);
      const fuelPenalty = fuelLoad * 0.0355;
      
      // Track rubber improvement (non-linear, resets with rain)
      const gripGain = trackRubber;

      // Safety car
      if (isSC) {
        const scSpread = (driverHash(car.driver.id, lap * 13) - 0.5) * 0.4;
        return baseLap + 26.0 + scSpread;
      }

      // VSC
      if (isVSC) {
        const vscSpread = (driverHash(car.driver.id, lap * 17) - 0.5) * 0.6;
        return baseLap + 6.0 + vscSpread;
      }

      const savePacePenalty = pushing ? 0.0 : 0.35;

      // Two independent noise sources — slightly wider in 2026 new-reg era
      const n1 = driverHash(car.driver.id, lap * 29 + 3);
      const n2 = driverHash(car.driver.id, lap * 53 + ci * 17 + 11);
      const noise = (n1 - 0.5) * 0.52 + (n2 - 0.5) * 0.28;

      // Minor incidents
      const incRoll = driverHash(car.driver.id, lap * 127 + 41);
      const incPen  = incRoll < 0.015 ? 0.3 + incRoll * 100 : 0;
      
      // Lap 1 chaos penalty
      const l1Pen = lap === 1 ? lap1Chaos[ci] : 0;

      // NOTE: tempPenalty is NOT added here — applied once in STEP 4 only
      const raw = baseLap
        + car.teamPace
        + car.driver.driverRating
        + charOffset[ci]
        + C.delta
        + degWithMgmt
        + cliffFactor
        + warmup
        + fuelPenalty
        - gripGain
        + noise
        + savePacePenalty
        + incPen
        + l1Pen
        + weatherChangePenalty;

      return Math.max(raw, baseLap * 0.940);
    });

    // STEP 2: Traffic — FIXED overtake model
    // Separates: (a) track-width physical constraint, (b) pace advantage
    const adjustedTimes   = [...rawTimes];
    const overtookThisLap = new Set();

    for (let rankIdx = 1; rankIdx < order.length; rankIdx++) {
      const ci      = order[rankIdx];
      const aheadCi = order[rankIdx - 1];

      if (overtookThisLap.has(ci) || overtookThisLap.has(aheadCi)) continue;
      if (dnfLap[ci] !== null && dnfLap[ci] <= lap) continue;
      if (dnfLap[aheadCi] !== null && dnfLap[aheadCi] <= lap) continue;

      const gap = Math.max(0, cumTimes[ci] - cumTimes[aheadCi]);
      if (gap > 3.0) continue;

      const drsEligible = gap < 1.0 && !isSC && !isVSC;
      // DRS gives 0.10-0.18s/lap depending on zones and circuit (Monza > Monaco)
      const drsBoost    = drsEligible ? T.drsZones * 0.115 * (T.overtakingFactor + 0.3) : 0;

      // Dirty air: aero turbulence behind car ahead
      const dirtyAirPen = gap < 2.0 && !isSC
        ? (1.0 - gap / 2.0) * 0.20 : 0;

      // Net pace advantage per lap
      const paceDelta = rawTimes[aheadCi] - rawTimes[ci];
      const netAdv    = paceDelta + drsBoost;

      if (netAdv > 0.05) {
        // ── OVERTAKE PROBABILITY — two separate constraints ──────────────
        
        // 1. PHYSICAL SPACE: Can the attacking car actually get alongside?
        //    This is purely track width. Monaco = almost never regardless of pace.
        //    Formula: narrower track = much harder to find space
        const physicalSpaceProb = Math.min(0.95, T.trackWidth * 0.9 + (drsEligible ? 0.15 : 0));
        
        // 2. PACE ADVANTAGE: Does the attacking car actually have enough speed?
        //    If netAdv > 0.5s/lap, they WILL pass eventually — question is this lap.
        //    If netAdv > 1.0s/lap (e.g. lapped car scenario), almost certain.
        const paceProb = Math.min(0.95, 
          netAdv < 0.15 ? netAdv * 1.5 :   // small advantage: low probability
          netAdv < 0.5  ? 0.22 + netAdv * 0.6 : // medium: moderate
          netAdv < 1.0  ? 0.52 + netAdv * 0.3 : // large: high
          0.85                               // massive: near-certain
        );
        
        // Combined probability: BOTH constraints must be satisfied
        // Monaco: physicalSpace=0.08, so even with huge pace advantage, rarely passes
        // Monza: physicalSpace=0.65, DRS makes it very likely with pace advantage
        const prob = physicalSpaceProb * paceProb;
        
        const seed = driverHash(ci * 113 + lap * 7, aheadCi * 79 + lap * 13);

        if (seed < prob) {
          const margin       = 0.05 + (seed / Math.max(prob, 0.01)) * 0.20;
          const aheadNewCum  = cumTimes[aheadCi] + adjustedTimes[aheadCi];
          const targetCiCum  = aheadNewCum - margin;
          const neededLap    = targetCiCum - cumTimes[ci];
          if (neededLap >= baseLap * 0.940) {
            adjustedTimes[ci]       = neededLap;
            adjustedTimes[aheadCi] += 0.08 + (1 - seed) * 0.08;
            overtookThisLap.add(ci);
            overtookThisLap.add(aheadCi);
          } else {
            adjustedTimes[ci] += dirtyAirPen;
          }
        } else {
          // Failed attempt — dirty air loss and slight hesitation
          adjustedTimes[ci] += dirtyAirPen + 0.04;
        }
      } else {
        adjustedTimes[ci] += dirtyAirPen;
      }
    }

    // STEP 3: Reactive rival strategy — rivals respond to user pit
    // If user pitted last lap, rivals close to user in position will cover it
    if (userPittedOnLap.lap === lap - 1) {
      allCarInputs.forEach((car, ci) => {
        if (car.isUser || hasReactedToUserPit[ci]) return;
        if (dnfLap[ci] !== null && dnfLap[ci] <= lap) return;
        
        const rank = order.indexOf(ci);
        const userCi = allCarInputs.findIndex(c => c.isUser);
        const userRank = order.indexOf(userCi);
        
        // Rivals 1-3 positions ahead or behind the user consider reacting
        if (Math.abs(rank - userRank) > 4) return;
        
        const bounds = carBounds[ci];
        const stint  = bounds.find(b => lap >= b.start && lap <= b.end);
        if (!stint) return;
        
        const C = COMPOUNDS[stint.compound] || COMPOUNDS.C3;
        const wearFrac = (lap - stint.start) / C.maxLife;
        
        // React if tyres are >35% worn and they're close to user
        // Team aggression affects willingness to react
        const strat = TEAM_STRATEGY[car.driver.team] || TEAM_STRATEGY.MCL;
        const reactRoll = driverHash(car.driver.id, lap * 37 + 555);
        const reactThresh = strat.aggression * 0.6 + (wearFrac > 0.5 ? 0.25 : 0);
        
        if (reactRoll < reactThresh && wearFrac > 0.30) {
          hasReactedToUserPit[ci] = true;
          // Force pit this lap by ending current stint here
          const stintIdx = bounds.indexOf(stint);
          if (stintIdx >= 0 && stintIdx < bounds.length - 1) {
            bounds[stintIdx] = { ...bounds[stintIdx], end: lap, laps: lap - bounds[stintIdx].start + 1 };
            // Update downstream stints — use clamped laps so cur never overshoots T.laps
            let cur = lap + 1;
            for (let si = stintIdx + 1; si < bounds.length; si++) {
              const remaining = T.laps - cur + 1;
              const clampedLaps = Math.min(bounds[si].laps, remaining);
              bounds[si] = { ...bounds[si], start: cur, end: Math.min(cur + clampedLaps - 1, T.laps), laps: clampedLaps };
              cur += clampedLaps; // advance by clamped, not original
            }
          }
        }
      });
    }

    // STEP 4: Pit stops, DNFs, final lap data
    allCarInputs.forEach((car, ci) => {
      // Check DNF
      if (dnfLap[ci] !== null && dnfLap[ci] === lap) {
        // Car retires — give massive time penalty
        cumTimes[ci] += baseLap * 100;
        lapResults[ci].push({
          lap, lapTime: 9999, cumTime: cumTimes[ci], compound: "DNF",
          wearFraction: 0, fuelLoad: 0, isPit: false, isSC, isVSC,
          hasCliff: false, degradation: 0, tyreTemp: 0, inDirtyAir: false,
          gapAhead: 0, pushing: false, dnf: true,
        });
        return;
      }

      const bounds = carBounds[ci];
      const stint  = bounds.find(b => lap >= b.start && lap <= b.end);
      if (!stint) return;

      let cKey = effectiveWeather === "wet" ? "W" : effectiveWeather === "inter" ? "I" : stint.compound;
      const C        = COMPOUNDS[cKey] || COMPOUNDS.C3;
      const stintLap = lap - stint.start;
      const wearFrac = stintLap / C.maxLife;
      const fuelLoad = Math.max(0, T.fuel - lap * fuelBurn);
      const isPit    = lap === stint.end && stint !== bounds[bounds.length - 1];
      const cliffFactor = wearFrac > C.cliffAt
        ? Math.pow((wearFrac - C.cliffAt) / (1 - C.cliffAt), 2.2) * 5.2 : 0;

      // SC opportunity pit — smarter decision (checks if pit actually helps)
      let rivalForcedPit = false;
      if (!car.isUser && isSC && lap <= (scLap + 1) && wearFrac > 0.40 && !isPit) {
        const rank     = order.indexOf(ci);
        const gapAhead = rank > 0 ? cumTimes[ci] - cumTimes[order[rank-1]] : 99;
        const scPitRoll = driverHash(car.driver.id, lap * 23 + 99);
        const strat = TEAM_STRATEGY[car.driver.team] || TEAM_STRATEGY.MCL;
        // More worn tyres + aggressive team + manageable gap = more likely to pit
        const pitThresh = 0.30 + strat.aggression * 0.30 + (wearFrac - 0.40) * 0.50;
        if (scPitRoll < pitThresh && gapAhead < 20) rivalForcedPit = true;
      }

      const rank     = order.indexOf(ci);
      const aheadGap = rank > 0 ? Math.max(0, cumTimes[ci] - cumTimes[order[rank-1]]) : 99;
      const inDirtyAir = aheadGap < 2.0 && rank > 0;
      const tyreTemp   = calcTyreTemp(C, stintLap, pushThisLap[ci], inDirtyAir, isSC, accHeatDamage[ci]);
      const tempPen    = tempPenalty(C, tyreTemp);

      let lapTime = adjustedTimes[ci];
      if (!isSC && !isVSC) lapTime += tempPen;
      if (isVSC) lapTime += 4.2;
      lapTime = Math.max(lapTime, baseLap * 0.940);

      // Track user pit for rival reactions
      if ((isPit || rivalForcedPit) && car.isUser) {
        userPittedOnLap.lap = lap;
      }

      if (isPit || rivalForcedPit) {
        // Pit crew performance varies: ±0.6s (real F1 range is ~0.3-0.8s variation)
        const pitVar = (driverHash(car.driver.id, lap * 11) - 0.5) * 1.2;
        lapTime += T.pitLoss + pitVar;

        if (rivalForcedPit && !isPit) {
          const curStintIdx = bounds.indexOf(stint);
          if (curStintIdx >= 0) {
            bounds[curStintIdx] = { ...bounds[curStintIdx], end: lap, laps: lap - bounds[curStintIdx].start + 1 };
          }
          const nextKey = getCompoundKey(trackKey, wearFrac > 0.7 ? "Hard" : "Medium");
          bounds.push({ compound: nextKey, start: lap+1, end: T.laps, laps: T.laps-lap });
        }
      }

      cumTimes[ci] += lapTime;
      lapResults[ci].push({
        lap,
        lapTime:      +lapTime.toFixed(3),
        cumTime:      +cumTimes[ci].toFixed(2),
        compound:     cKey,
        wearFraction: +wearFrac.toFixed(3),
        fuelLoad:     +fuelLoad.toFixed(1),
        isPit:        isPit || rivalForcedPit,
        isSC, isVSC,
        hasCliff:     cliffFactor > 0.3,
        degradation:  +(cliffFactor + C.degradation * stintLap).toFixed(3),
        tyreTemp:     +tyreTemp.toFixed(0),
        inDirtyAir,
        gapAhead:     +aheadGap.toFixed(3),
        pushing:      pushThisLap[ci],
        dnf:          false,
        heatDamage:   +accHeatDamage[ci].toFixed(3),
      });
    });
  }

  return lapResults;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNDERCUT CALCULATOR — uses actual sim data for realistic delta calculation
// ═══════════════════════════════════════════════════════════════════════════════
function calcUndercut(trackKey, userCar, rivalCar, pitLap) {
  const T = TRACKS[trackKey];
  if (!userCar || !rivalCar || pitLap <= 1) return null;

  const lapIdx = pitLap - 2; // current lap data index (0-based)
  const userLd   = userCar.laps[lapIdx];
  const rivalLd  = rivalCar.laps[lapIdx];
  if (!userLd || !rivalLd) return null;

  const gapBefore = rivalLd.cumTime - userLd.cumTime; // positive = rival is ahead

  // What compound would user pit onto? Respect track's available compounds
  const currentCompound = userLd.compound;
  const currentRole     = COMPOUNDS[currentCompound]?.role || "Medium";
  const trackCompounds  = TRACKS[trackKey]?.compound || ["C3","C4","C5"];
  // Try to pit onto a faster compound, but only if available at this track
  const wantRole = currentRole === "Soft" ? "Medium" : currentRole === "Hard" ? "Medium" : "Soft";
  const freshCompoundKey = getCompoundKey(trackKey, wantRole);
  // Verify it's in the track's available compounds; fallback to Medium
  const resolvedFreshKey = trackCompounds.includes(freshCompoundKey)
    ? freshCompoundKey
    : getCompoundKey(trackKey, "Medium");
  const freshC   = COMPOUNDS[resolvedFreshKey] || COMPOUNDS.C3;
  const currentC = COMPOUNDS[currentCompound]  || COMPOUNDS.C3;

  // Fresh tyre pace benefit: delta between compounds + worn tyre degradation
  // More realistic: accounts for actual wear state of current tyres
  const currentWear     = userLd.wearFraction || 0;
  const wornTyreExtra   = currentWear > currentC.cliffAt
    ? Math.pow((currentWear - currentC.cliffAt) / (1 - currentC.cliffAt), 2.2) * 3.5 : 0;
  const basePaceBenefit = (freshC.delta - currentC.delta) * -1; // fresh soft vs worn medium = more benefit
  const actualBenefit   = Math.max(0.3, Math.min(3.5, basePaceBenefit + wornTyreExtra + currentWear * 1.2));

  // Pit loss (track specific + variance)
  const pitLoss = T.pitLoss;

  // Laps to recover the pit stop time delta
  // Each lap on fresh tyres, user gains `actualBenefit` over rival (who is on worn tyres)
  const lapsToRecover = pitLoss / actualBenefit;
  const remainingLaps = TRACKS[trackKey].laps - pitLap;
  
  // Net effect: did the undercut work?
  // If lapsToRecover < remainingLaps, user comes out ahead
  const gapAfterPit   = gapBefore + pitLoss - actualBenefit * Math.min(5, remainingLaps);
  const success       = gapAfterPit < 0;
  const lapsNeeded    = success ? 0 : Math.ceil(Math.abs(gapAfterPit) / actualBenefit);

  return {
    gapBefore:      +gapBefore.toFixed(3),
    pitLoss:        +pitLoss.toFixed(1),
    freshBenefit:   +actualBenefit.toFixed(2),
    gapAfter:       +gapAfterPit.toFixed(3),
    freshCompound:  resolvedFreshKey,
    currentWear:    +(currentWear * 100).toFixed(0),
    remainingLaps,
    lapsToRecover:  +lapsToRecover.toFixed(1),
    success,
    lapsNeeded,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY COMPARISON
// ═══════════════════════════════════════════════════════════════════════════════
function buildLapTimings(cars, LAPS) {
  return Array.from({ length: LAPS }, (_, i) => {
    const lap = i + 1, idx = i;
    const anyPit    = cars.some(c => c.laps[idx]?.isPit);
    const anySC     = cars.some(c => c.laps[idx]?.isSC);
    const isStart   = lap <= 3;
    const isLast    = lap === LAPS;
    const isLast5   = lap >= LAPS - 4 && !isLast;
    const times     = cars.map(c => c.laps[idx]?.cumTime || 99999).sort((a, b) => a - b);
    const isBattle  = times.length > 1 && (times[1] - times[0]) < 1.5;
    if (isLast)   return 12000;
    if (anyPit)   return 8000;
    if (isStart)  return 7000;
    if (isLast5)  return 6000;
    if (isBattle) return 5500;
    if (anySC)    return 5000;
    return 3500;
  });
}

function buildGrid(trackKey, weather) {
  // quali noise mixes in _raceSeed so grid changes between seeds
  // wet weather amplifies spread (wet quali = bigger surprises)
  // 2026 new regs: larger qualifying variance — teams still finding the car's limits
  const wetMult = weather === "wet" ? 3.5 : weather === "inter" ? 1.8 : 1.0;
  const regUncertainty = 1.4; // new regs mean bigger qualifying swings
  return DRIVERS.map(d => {
    const team = TEAMS[d.team];
    const seed = driverHash(d.id, trackKey.charCodeAt(0) + _raceSeed * 97);
    const noise = (seed - 0.5) * 0.32 * wetMult * regUncertainty;
    const qualiTime = TRACKS[trackKey].baseLap + team.qualiGap + d.driverRating + noise;
    return { driver: d, team, qualiTime };
  }).sort((a, b) => a.qualiTime - b.qualiTime);
}

function balanceStints(arr, total) {
  if (!arr.length) return [{ compound: "C3", laps: total }];
  const c = arr.map(s => ({ ...s }));
  const sum = c.reduce((a, s) => a + s.laps, 0);
  if (sum !== total) c[c.length-1].laps = Math.max(1, c[c.length-1].laps + (total - sum));
  return c;
}
function setStintCompound(arr, idx, compound) {
  return arr.map((s, i) => i === idx ? { ...s, compound } : { ...s });
}

// eslint-disable-next-line no-unused-vars
function setPitLapBetween(stints, idx, newPitLap, total) {
  const c = stints.map(s => ({ ...s }));
  const stintStart    = stints.slice(0, idx).reduce((a, s) => a + s.laps, 0) + 1;
  const stintAfterEnd = stints.slice(0, idx + 2).reduce((a, s) => a + s.laps, 0);
  const clamped = Math.min(Math.max(newPitLap, stintStart + 1), stintAfterEnd - 1);
  c[idx].laps     = clamped - stintStart + 1;
  c[idx + 1].laps = stintAfterEnd - clamped;
  return c;
}
function addPitStop(arr, total, trackKey) {
  const last = arr[arr.length - 1];
  if (last.laps < 4) return arr;
  const h = Math.floor(last.laps / 2);
  const medComp = trackKey ? getCompoundKey(trackKey, "Medium") : "C3";
  return balanceStints([...arr.slice(0, -1), { ...last, laps: last.laps - h }, { compound: medComp, laps: h }], total);
}
function removePitStop(arr, idx, total) {
  if (arr.length <= 1) return arr;
  const copy = arr.map(s => ({ ...s }));
  const mergeInto = idx < arr.length - 1 ? idx + 1 : idx - 1;
  copy[mergeInto] = { ...copy[mergeInto], laps: copy[mergeInto].laps + copy[idx].laps };
  return balanceStints(copy.filter((_, i) => i !== idx), total);
}

function fmtLap(s) {
  if (!s || isNaN(s) || s > 999) return "--:--.---";
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${sec < 10 ? "0" : ""}${sec.toFixed(3)}`;
}
function fmtRaceTime(s) {
  if (!s) return "--:--";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}:${m < 10?"0":""}${m}:${sec < 10?"0":""}${sec.toFixed(1)}`;
  return `${m}:${sec < 10?"0":""}${sec.toFixed(1)}`;
}
function fmtGap(gap) {
  if (gap <= 0) return "LEAD";
  if (gap >= 60) return `+${Math.floor(gap/60)} LAP`;
  return `+${gap.toFixed(3)}s`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE STANDINGS
// ═══════════════════════════════════════════════════════════════════════════════
function LiveStandings({ allCars, scrubLap, LAPS, showLabels, setShowLabels, ACC }) {
  const CARD_H    = 34;
  const CARD_GAP  = 2;
  const SHOW      = 8;

  const prevRankRef = useRef({});
  const animRef     = useRef({});
  const [, setTick] = useState(0);
  const rafRef      = useRef(null);

  const idx      = Math.max(0, scrubLap - 1);
  const sorted   = [...allCars]
    .filter(c => !c.laps[idx]?.dnf)
    .sort((a, b) => (a.laps[idx]?.cumTime || 9999) - (b.laps[idx]?.cumTime || 9999))
    .slice(0, SHOW);
  const leaderTime = sorted[0]?.laps[idx]?.cumTime || 0;

  useEffect(() => {
    const now = performance.now();
    sorted.forEach((car, newRank) => {
      const oldRank = prevRankRef.current[car.id];
      if (oldRank === undefined) { prevRankRef.current[car.id] = newRank; return; }
      if (oldRank !== newRank) {
        const fromOffset = (oldRank - newRank) * (CARD_H + CARD_GAP);
        animRef.current[car.id] = { from: fromOffset, start: now, dur: 420 };
        prevRankRef.current[car.id] = newRank;
      }
    });

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const hasAnim = Object.keys(animRef.current).length > 0;
    if (!hasAnim) return;
    function step(ts) {
      const alive = Object.entries(animRef.current).filter(([, a]) => ts - a.start < a.dur);
      if (alive.length === 0) { animRef.current = {}; return; }
      setTick(t => t + 1);
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrubLap]);

  const [now] = useState(() => performance.now());
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <div style={{ fontSize:10, letterSpacing:".2em", textTransform:"uppercase", color:"#999" }}>
          STANDINGS — L{scrubLap}/{LAPS}
        </div>
        <label style={{ fontSize:11, color:"#888", cursor:"pointer", display:"flex", gap:4, alignItems:"center" }}>
          <input type="checkbox" checked={showLabels} onChange={e=>setShowLabels(e.target.checked)} style={{accentColor:ACC}}/>
          Labels
        </label>
      </div>

      <div style={{ position:"relative", height: SHOW * (CARD_H + CARD_GAP), overflow:"hidden" }}>
        {sorted.map((car, rank) => {
          const ld  = car.laps[idx];
          const gap = ld ? ld.cumTime - leaderTime : 0;
          const C   = COMPOUNDS[ld?.compound] || COMPOUNDS.C3;
          const hasDRS = gap < 1.0 && gap > 0 && rank > 0;
          const posCol = rank === 0 ? "#FFD700" : rank <= 2 ? "#aaa" : rank <= 9 ? "#555" : "#222";

          const anim = animRef.current[car.id];
          let translateY = rank * (CARD_H + CARD_GAP);
          if (anim) {
            const elapsed = now - anim.start;
            const progress = Math.min(1, elapsed / anim.dur);
            const eased    = easeOut(progress);
            const remaining = anim.from * (1 - eased);
            translateY += remaining;
            if (progress >= 1) delete animRef.current[car.id];
          }

          const justMoved = anim && (now - anim.start) < 600;
          const flashCol  = justMoved
            ? (anim.from > 0 ? "rgba(57,181,74,.12)" : "rgba(225,6,0,.10)")
            : car.isUser ? `${car.col}0e` : "transparent";

          return (
            <div key={car.id} style={{
              position: "absolute", left: 0, right: 0, height: CARD_H, top: 0,
              transform: `translateY(${translateY}px)`,
              display: "flex", alignItems: "center", gap: 6, padding: "0 8px",
              background: flashCol,
              border: `1px solid ${car.isUser ? car.col+"44" : "#333"}`,
              boxSizing: "border-box", willChange: "transform",
            }}>
              <div style={{ fontSize:12, fontWeight:900, color:posCol, minWidth:24, lineHeight:1 }}>P{rank+1}</div>
              <div style={{ width:3, alignSelf:"stretch", background:car.col, flexShrink:0, borderRadius:1 }}/>
              <div style={{ flex:1, overflow:"hidden" }}>
                <div style={{ fontSize:11, fontWeight:700, color: car.isUser?"#f0f0f0":"#aaa",
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {car.name?.split(" ").pop()}
                </div>
                {ld?.isPit && (
                  <div style={{ fontSize:9, color:"#e10600", fontWeight:900, letterSpacing:".1em" }}>IN PIT</div>
                )}
              </div>
              <div style={{ textAlign:"right", minWidth:52 }}>
                <div style={{ fontSize:11, fontWeight:700, color: gap===0?"#FFD700": hasDRS?"#39B54A":"#333" }}>
                  {fmtGap(gap)}
                </div>
                {hasDRS && <div style={{ fontSize:9, color:"#39B54A", fontWeight:900, letterSpacing:".08em" }}>DRS</div>}
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, flexShrink:0 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:ld?.compound==="DNF"?"#333":C.col, boxShadow:`0 0 4px ${C.col}88` }}/>
                {ld?.tyreTemp && (
                  <div style={{ width:6, height:6, borderRadius:"50%", background:tempColor(ld.tyreTemp), opacity:.8 }}/>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RACE MAP
// ═══════════════════════════════════════════════════════════════════════════════
function RaceMap({ trackKey, simData, showLabels, finishZoom }) {
  const canvasRef = useRef(null);
  const cacheRef  = useRef({ key: null, spline: null, pitPts: null });
  const rafRef    = useRef(null);
  const sRef      = useRef(null);
  const zoomRef   = useRef({ scale: 1 });
  const zoomTargetRef = useRef({ scale: 1 });

  const winner = simData?.cars
    ? [...simData.cars].filter(c => !c.laps[c.laps.length-1]?.dnf)
        .sort((a,b)=>(a.laps[a.laps.length-1]?.cumTime||0)-(b.laps[b.laps.length-1]?.cumTime||0))[0]
    : null;

  useEffect(() => {
    if (simData) sRef.current = { ...simData, startTime: null, cumMs: null, _pos: {}, _lastTs: null };
  }, [simData]);

  useEffect(() => {
    zoomTargetRef.current = finishZoom ? { scale: 4.2 } : { scale: 1 };
  }, [finishZoom]);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function ensureCache() {
      if (cacheRef.current.key !== trackKey) {
        const cp = CIRCUIT_PATHS[trackKey] || CIRCUIT_PATHS.bahrain;
        const spline = buildSpline(cp.pts, 800);
        cacheRef.current = { key: trackKey, spline, pitPts: buildPitPath(spline, cp.pitOff) };
      }
    }

    function drawTrack(ctx, toCanvas) {
      const { spline, pitPts } = cacheRef.current;
      ctx.beginPath();
      spline.forEach(([x,y],i)=>{const[cx,cy]=toCanvas(x,y);i===0?ctx.moveTo(cx,cy):ctx.lineTo(cx,cy);});
      ctx.closePath();
      ctx.strokeStyle="rgba(255,140,0,.08)"; ctx.lineWidth=32; ctx.lineJoin="round"; ctx.stroke();
      ctx.beginPath();
      spline.forEach(([x,y],i)=>{const[cx,cy]=toCanvas(x,y);i===0?ctx.moveTo(cx,cy):ctx.lineTo(cx,cy);});
      ctx.closePath();
      ctx.strokeStyle="rgba(0,0,0,.5)"; ctx.lineWidth=24; ctx.stroke();
      ctx.beginPath();
      spline.forEach(([x,y],i)=>{const[cx,cy]=toCanvas(x,y);i===0?ctx.moveTo(cx,cy):ctx.lineTo(cx,cy);});
      ctx.closePath();
      ctx.strokeStyle="#252525"; ctx.lineWidth=19; ctx.stroke();
      ctx.beginPath();
      spline.forEach(([x,y],i)=>{const[cx,cy]=toCanvas(x,y);i===0?ctx.moveTo(cx,cy):ctx.lineTo(cx,cy);});
      ctx.closePath();
      ctx.strokeStyle="rgba(255,255,255,.08)"; ctx.lineWidth=5; ctx.stroke();
      if (pitPts.length > 1) {
        ctx.beginPath();
        pitPts.forEach(([x,y],i)=>{const[cx,cy]=toCanvas(x,y);i===0?ctx.moveTo(cx,cy):ctx.lineTo(cx,cy);});
        ctx.strokeStyle="#120f00"; ctx.lineWidth=14; ctx.stroke();
        ctx.beginPath();
        pitPts.forEach(([x,y],i)=>{const[cx,cy]=toCanvas(x,y);i===0?ctx.moveTo(cx,cy):ctx.lineTo(cx,cy);});
        ctx.strokeStyle="#FFD70055"; ctx.lineWidth=1.5; ctx.setLineDash([4,6]); ctx.stroke(); ctx.setLineDash([]);
      }
      const sp = cacheRef.current.spline;
      const [sx0,sy0]=toCanvas(sp[0][0],sp[0][1]),[sx1,sy1]=toCanvas(sp[1][0],sp[1][1]);
      const sdx=sx1-sx0,sdy=sy1-sy0,sl=Math.sqrt(sdx*sdx+sdy*sdy)||1;
      const px=-sdy/sl*16,py=sdx/sl*16;
      ctx.beginPath(); ctx.moveTo(sx0-px,sy0-py); ctx.lineTo(sx0+px,sy0+py);
      ctx.strokeStyle="#ffffff88"; ctx.lineWidth=2.5; ctx.stroke();
    }

    const PIT_ENTRY = 0.87;

    function frame(ts) {
      const S = sRef.current;
      const W = cv.offsetWidth, H = cv.offsetHeight || 440;
      if (cv.width !== W*dpr || cv.height !== H*dpr) { cv.width=W*dpr; cv.height=H*dpr; }
      const ctx = cv.getContext("2d");
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.clearRect(0,0,W,H);
      ensureCache();
      const { spline, pitPts } = cacheRef.current;
      const baseMap = makeMap(spline, W, H, 38);

      const zt = zoomTargetRef.current, zc = zoomRef.current;
      zc.scale += (zt.scale - zc.scale) * 0.055;
      let toCanvas;
      if (Math.abs(zc.scale - 1) > 0.02) {
        const [sfx,sfy] = baseMap.toCanvas(spline[0][0], spline[0][1]);
        const s = zc.scale;
        toCanvas = (nx,ny)=>{ const[bx,by]=baseMap.toCanvas(nx,ny); return[(bx-sfx)*s+W/2,(by-sfy)*s+H/2]; };
      } else { zc.scale=1; toCanvas=baseMap.toCanvas; }

      drawTrack(ctx, toCanvas);

      if (!S?.cars) { rafRef.current=requestAnimationFrame(frame); return; }

      if (!S.cumMs) {
        S.cumMs = [0];
        for (let i=0;i<S.lapMs.length;i++) S.cumMs.push(S.cumMs[i]+S.lapMs[i]);
      }
      if (!S.startTime) { S.startTime = ts; S._lastTs = ts; }
      const rawDt = ts - S._lastTs;
      S._lastTs   = ts;
      const dtMs  = Math.min(rawDt, 50);

      const elapsed   = ts - S.startTime;
      const totalMs   = S.cumMs[S.cumMs.length-1];
      const clamped   = Math.min(elapsed, totalMs);
      const done      = elapsed >= totalMs;

      let globalLap = S.lapMs.length;
      for (let i=1; i<S.cumMs.length; i++) {
        if (clamped < S.cumMs[i]) { globalLap=i; break; }
      }
      if (!S._lastLap || S._lastLap !== globalLap) {
        S._lastLap = globalLap;
        S.onLapChange?.(globalLap, done);
      }
      if (done && !S._doneFired) { S._doneFired=true; S.onDone?.(); }

      const lapIdx = Math.min(globalLap-1, S.cars[0].laps.length-1);

      const leaderLd  = S.cars.filter(c=>!c.laps[lapIdx]?.dnf).reduce((best,c)=>{
        const t=c.laps[lapIdx]?.cumTime||Infinity; return t<(best?.laps[lapIdx]?.cumTime||Infinity)?c:best;
      }, S.cars[0]);
      const leaderLapSec = leaderLd.laps[lapIdx]?.lapTime || TRACKS[trackKey].baseLap;
      const lapMs    = S.lapMs[lapIdx] || 3500;
      const fracPerMs = 1.0 / lapMs;

      const sorted = [...S.cars].filter(c=>!c.laps[lapIdx]?.dnf).sort((a,b)=>
        (a.laps[lapIdx]?.cumTime||Infinity)-(b.laps[lapIdx]?.cumTime||Infinity)
      );

      if (!S._pos) S._pos = {};
      S.cars.forEach((car) => {
        const ld = car.laps[lapIdx] || car.laps[car.laps.length-1];
        if (!ld || ld.dnf) return;

        if (!S._pos[car.id]) {
          const gapSec  = Math.max(0, (car.laps[0]?.cumTime||0) - (sorted[0]?.laps[0]?.cumTime||0));
          const initFrac = Math.max(0, 1 - gapSec / Math.max(leaderLapSec, 60));
          S._pos[car.id] = { frac: initFrac % 1, inPit: false, pitT: 0, cx: 0, cy: 0 };
        }
        const p = S._pos[car.id];

        const rank      = sorted.findIndex(c=>c.id===car.id);
        const isPitLap  = !!ld.isPit;

        if (!p.inPit && isPitLap && p.frac >= PIT_ENTRY - 0.05 && p.frac < PIT_ENTRY + 0.08) {
          p.inPit = true; p.pitT = 0;
        }
        if (p.inPit && p.pitT >= 0.99) {
          p.inPit = false; p.frac = 0.03; p.pitT = 0;
        }

        if (p.inPit) {
          p.pitT = Math.min(0.99, p.pitT + dtMs / lapMs);
        } else {
          const myLapSec   = ld.lapTime || leaderLapSec;
          const speedRatio = Math.min(1.05, Math.max(0.5, leaderLapSec / myLapSec));
          p.frac = (p.frac + fracPerMs * dtMs * speedRatio) % 1;
        }

        let nx, ny;
        if (p.inPit && pitPts.length > 1) {
          const pi  = Math.min(pitPts.length-2, Math.floor(p.pitT * (pitPts.length-1)));
          const pf  = p.pitT * (pitPts.length-1) - pi;
          nx = pitPts[pi][0] + (pitPts[pi+1][0]-pitPts[pi][0]) * pf;
          ny = pitPts[pi][1] + (pitPts[pi+1][1]-pitPts[pi][1]) * pf;
        } else {
          [nx, ny] = splinePt(spline, p.frac);
        }
        const [rawCx, rawCy] = toCanvas(nx, ny);
        if (!p.cx && !p.cy) { p.cx = rawCx; p.cy = rawCy; }
        p.cx += (rawCx - p.cx) * 0.35;
        p.cy += (rawCy - p.cy) * 0.35;
        const [cx, cy] = [p.cx, p.cy];

        const gapSecs = Math.max(0, (ld.cumTime||0) - (sorted[0]?.laps[lapIdx]?.cumTime||0));
        const r = car.isUser ? 6 : 4;

        if (car.isUser) {
          const g=ctx.createRadialGradient(cx,cy,0,cx,cy,26);
          g.addColorStop(0,car.col+"55"); g.addColorStop(1,"transparent");
          ctx.beginPath(); ctx.arc(cx,cy,16,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        }
        if (rank>0 && gapSecs<1.0 && gapSecs>0) {
          const g=ctx.createRadialGradient(cx,cy,0,cx,cy,18);
          g.addColorStop(0,"#00ff8822"); g.addColorStop(1,"transparent");
          ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        }
        if (p.inPit) {
          const g=ctx.createRadialGradient(cx,cy,0,cx,cy,16);
          g.addColorStop(0,"#FFD70033"); g.addColorStop(1,"transparent");
          ctx.beginPath(); ctx.arc(cx,cy,10,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        }

        ctx.beginPath(); ctx.arc(cx+2,cy+2,r,0,Math.PI*2); ctx.fillStyle="rgba(0,0,0,.6)"; ctx.fill();
        ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle=car.col; ctx.fill();
        if (car.isUser) { ctx.beginPath(); ctx.arc(cx,cy,r+1.5,0,Math.PI*2); ctx.strokeStyle="#ffffffdd"; ctx.lineWidth=1.4; ctx.stroke(); }
        const tyreTemp = ld.tyreTemp || 95;
        ctx.beginPath(); ctx.arc(cx,cy,r+3,0,Math.PI*2);
        ctx.strokeStyle=tempColor(tyreTemp)+"99"; ctx.lineWidth=1.2; ctx.stroke();

        const posCol = rank===0?"#FFD700":rank<=2?"#C0C0C0":rank<=9?"#fff":"#444";
        ctx.fillStyle="rgba(0,0,0,.88)"; ctx.fillRect(cx+r+1,cy-4,14,9);
        ctx.fillStyle=posCol; ctx.font=`bold 6px 'Barlow Condensed',monospace`;
        ctx.textAlign="left"; ctx.fillText(`P${rank+1}`,cx+r+2,cy+3);
        if (showLabels && rank < 12) {
          ctx.fillStyle=car.col; ctx.font=`600 6px 'Barlow Condensed',sans-serif`;
          ctx.fillText(car.driverCode, cx+r+16, cy+3);
        }
        const compData = COMPOUNDS[ld.compound]||COMPOUNDS.C3;
        ctx.beginPath(); ctx.arc(cx-r-3,cy,2.5,0,Math.PI*2);
        ctx.fillStyle=compData.col; ctx.fill();
        ctx.strokeStyle="rgba(0,0,0,.6)"; ctx.lineWidth=0.6; ctx.stroke();
      });

      ctx.textAlign="left";
      rafRef.current=requestAnimationFrame(frame);
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(frame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [trackKey, simData, showLabels]);

  return (
    <div style={{ position:"relative", height:440, background:"#141414", borderRadius:6, overflow:"hidden", border:"1px solid #2e2e2e" }} className="race-map-h">
      <canvas ref={canvasRef} style={{ display:"block", width:"100%", height:"100%" }}/>
      {finishZoom && winner && (
        <div style={{
          position:"absolute", top:0, left:0, right:0, bottom:0,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          pointerEvents:"none",
          background:`radial-gradient(ellipse at center, ${winner.col}18 0%, transparent 70%)`,
        }}>
          {/* Chequered stripe top */}
          <div style={{
            position:"absolute", top:0, left:0, right:0, height:4,
            background:`repeating-linear-gradient(90deg,#fff 0px,#fff 12px,#000 12px,#000 24px)`,
            opacity:.7,
          }}/>

          {/* Main winner card */}
          <div style={{
            background:"rgba(4,4,4,.96)",
            borderTop:`3px solid ${winner.col}`,
            borderBottom:`3px solid ${winner.col}`,
            borderLeft:`1px solid ${winner.col}33`,
            borderRight:`1px solid ${winner.col}33`,
            padding:"20px 52px 18px",
            textAlign:"center",
            boxShadow:`0 0 100px ${winner.col}44, inset 0 0 60px ${winner.col}08`,
            animation:"fadeInDown .5s cubic-bezier(.22,1,.36,1), finishPulse 3s ease-in-out infinite",
            minWidth:260,
          }}>
            {/* P1 badge */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:10 }}>
              <div style={{ width:32, height:32, background:winner.col, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:900, color:"#000", lineHeight:1 }}>P1</span>
              </div>
              <div style={{ fontSize:10, letterSpacing:".4em", color:"#FFD700", textTransform:"uppercase", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}>
                Race Winner
              </div>
            </div>

            {/* Driver full name — split surname big */}
            {(() => {
              const parts = winner.name.split(" ");
              const surname = parts[parts.length - 1].toUpperCase();
              const forename = parts.slice(0, -1).join(" ").toUpperCase();
              return (
                <>
                  <div style={{ fontSize:11, letterSpacing:".25em", color:winner.col+"99", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, lineHeight:1, marginBottom:2 }}>
                    {forename}
                  </div>
                  <div style={{ fontSize:46, fontWeight:900, color:winner.col, letterSpacing:".04em", fontFamily:"'Barlow Condensed',sans-serif", lineHeight:.92, marginBottom:8 }}>
                    {surname}
                  </div>
                </>
              );
            })()}

            {/* Team bar */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <div style={{ width:24, height:2, background:winner.col }}/>
              <div style={{ fontSize:10, letterSpacing:".2em", color:winner.col+"bb", textTransform:"uppercase", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}>
                {winner.teamName}
              </div>
              <div style={{ width:24, height:2, background:winner.col }}/>
            </div>
          </div>

          {/* Chequered stripe bottom */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0, height:4,
            background:`repeating-linear-gradient(90deg,#fff 0px,#fff 12px,#000 12px,#000 24px)`,
            opacity:.7,
          }}/>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAP CHART
// ═══════════════════════════════════════════════════════════════════════════════
function GapChart({ allCars, scrubLap }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv=ref.current; if (!cv||!allCars.length) return;
    const dpr=window.devicePixelRatio||1;
    cv.width=cv.offsetWidth*dpr; cv.height=130*dpr;
    const ctx=cv.getContext("2d"); ctx.scale(dpr,dpr);
    const W=cv.offsetWidth,H=130,P={t:12,r:64,b:22,l:12};
    ctx.clearRect(0,0,W,H);
    const user=allCars.find(c=>c.isUser); if (!user) return;
    const n=user.laps.length;
    const xS=i=>P.l+(i/(n-1||1))*(W-P.l-P.r);
    const rivals=allCars.filter(c=>!c.isUser&&!c.laps[n-1]?.dnf);
    const allGaps=rivals.flatMap(car=>car.laps.map((l,i)=>l.cumTime-(user.laps[i]?.cumTime||l.cumTime)));
    const flat=allGaps.filter(g=>Math.abs(g)<120); if (!flat.length) return;
    const lo=Math.min(...flat)-3,hi=Math.max(...flat)+3;
    const yS=v=>P.t+(1-(v-lo)/(hi-lo))*(H-P.t-P.b);

    ctx.strokeStyle="rgba(255,255,255,.08)"; ctx.lineWidth=1;
    [-30,-20,-10,0,10,20,30].forEach(v=>{
      if (v<lo||v>hi) return;
      ctx.beginPath(); ctx.moveTo(P.l,yS(v)); ctx.lineTo(W-P.r,yS(v)); ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,.5)"; ctx.font="6px monospace"; ctx.textAlign="right";
      ctx.fillText(v===0?"±0":v>0?`+${v}`:v,P.l-1,yS(v)+2);
    });

    ctx.strokeStyle="rgba(255,255,255,.18)"; ctx.lineWidth=1.5; ctx.setLineDash([4,6]);
    ctx.beginPath(); ctx.moveTo(P.l,yS(0)); ctx.lineTo(W-P.r,yS(0)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle="rgba(255,255,255,.7)"; ctx.font="bold 7px sans-serif"; ctx.textAlign="left";
    ctx.fillText("YOU",W-P.r+3,yS(0)+3);

    rivals.slice(0,8).forEach(car=>{
      const gaps=car.laps.map((l,i)=>l.cumTime-(user.laps[i]?.cumTime||l.cumTime));
      ctx.beginPath();
      gaps.forEach((g,i)=>i===0?ctx.moveTo(xS(i),yS(g)):ctx.lineTo(xS(i),yS(g)));
      ctx.strokeStyle=car.col+"cc"; ctx.lineWidth=1.4; ctx.lineJoin="round"; ctx.stroke();
      const lastG=gaps[gaps.length-1];
      if (lastG>lo && lastG<hi) {
        ctx.fillStyle=car.col; ctx.font="bold 6px sans-serif";
        ctx.fillText(car.driverCode,W-P.r+3,yS(lastG)+3);
      }
    });

    if (scrubLap>0&&scrubLap<=n) {
      ctx.strokeStyle="rgba(255,255,255,.35)"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(xS(scrubLap-1),P.t); ctx.lineTo(xS(scrubLap-1),H-P.b); ctx.stroke();
    }
    ctx.fillStyle="rgba(255,255,255,.55)"; ctx.font="6px monospace"; ctx.textAlign="center";
    for (let i=0;i<n;i+=Math.floor(n/6)) ctx.fillText(`L${i+1}`,xS(i),H-4);
  }, [allCars, scrubLap]);
  return <canvas ref={ref} style={{ display:"block", width:"100%", height:130 }}/>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYRE TEMPERATURE GAUGE
// ═══════════════════════════════════════════════════════════════════════════════
function TyreGauge({ temp, compound }) {
  const C = COMPOUNDS[compound] || COMPOUNDS.C3;
  const pct = Math.min(100, Math.max(0, (temp - 30) / 110 * 100));
  const col = tempColor(temp);
  const isOpt = temp >= C.optTempLo && temp <= C.optTempHi;
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:10, color:"#999", letterSpacing:".15em", textTransform:"uppercase", marginBottom:4 }}>TYRE TEMP</div>
      <div style={{ position:"relative", width:40, height:40, margin:"0 auto" }}>
        <svg width={40} height={40} style={{ transform:"rotate(-90deg)" }}>
          <circle cx={20} cy={20} r={15} fill="none" stroke="#111" strokeWidth={5}/>
          <circle cx={20} cy={20} r={15} fill="none" stroke={col} strokeWidth={5}
            strokeDasharray={`${pct * 0.942} 94.2`} strokeLinecap="round"
            style={{ transition:"stroke-dasharray .5s ease, stroke .5s ease" }}/>
        </svg>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", fontSize:11, fontWeight:900, color:col }}>{temp}°</div>
      </div>
      <div style={{ fontSize:10, marginTop:3, color: isOpt?"#39B54A":"#e10600", fontWeight:700 }}>
        {isOpt ? "OPTIMAL" : temp < C.optTempLo ? "COLD" : "HOT"}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNDERCUT CALCULATOR PANEL — updated with real-data calculations
// ═══════════════════════════════════════════════════════════════════════════════
function UndercutPanel({ allCars, scrubLap, trackKey }) {
  const [targetId, setTargetId] = useState(null);
  const userCar  = allCars.find(c => c.isUser);
  const rivals   = allCars.filter(c => !c.isUser && !c.laps[scrubLap-1]?.dnf);
  const lapIdx   = Math.max(0, scrubLap - 1);

  const aheadRivals = rivals.filter(r => {
    const rT = r.laps[lapIdx]?.cumTime || 9999;
    const uT = userCar?.laps[lapIdx]?.cumTime || 0;
    return rT < uT && (uT - rT) < 8.0;
  }).sort((a, b) => (b.laps[lapIdx]?.cumTime||0) - (a.laps[lapIdx]?.cumTime||0));

  const target = aheadRivals.find(r => r.id === targetId) || aheadRivals[0];
  const calc   = target ? calcUndercut(trackKey, userCar, target, scrubLap) : null;

  return (
    <div>
      <div style={{ fontSize:12, color:"#bbb", letterSpacing:".2em", textTransform:"uppercase", marginBottom:8 }}>⚡ UNDERCUT CALCULATOR</div>
      {aheadRivals.length === 0 ? (
        <div style={{ fontSize:10, color:"#888", fontStyle:"italic" }}>No rivals within undercut range (8s ahead)</div>
      ) : (
        <>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:10 }}>
            {aheadRivals.slice(0, 4).map(r => (
              <button key={r.id} onClick={() => setTargetId(r.id)} style={{
                padding:"4px 10px", fontSize:10, fontWeight:700,
                background: (targetId||aheadRivals[0]?.id)===r.id ? `${r.col}22` : "#0d0d0d",
                border:`1px solid ${(targetId||aheadRivals[0]?.id)===r.id ? r.col : "#1a1a1a"}`,
                color:(targetId||aheadRivals[0]?.id)===r.id ? r.col : "#444",
                cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
              }}>{r.driverCode}</button>
            ))}
          </div>
          {calc && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
              {[
                ["GAP NOW",    calc.gapBefore>0?`+${calc.gapBefore.toFixed(2)}s`:`${calc.gapBefore.toFixed(2)}s`, calc.gapBefore>0?"#e10600":"#39B54A"],
                ["PIT LOSS",   `${calc.pitLoss}s`,     "#888"],
                ["TYRE GAIN",  `${calc.freshBenefit}s/L`, "#FFD700"],
                ["WEAR NOW",   `${calc.currentWear}%`, calc.currentWear>70?"#e10600":calc.currentWear>45?"#FFD700":"#39B54A"],
                ["LAPS LEFT",  calc.remainingLaps,     "#555"],
                ["GAP AFTER",  calc.gapAfter>0?`+${calc.gapAfter.toFixed(2)}s`:`${calc.gapAfter.toFixed(2)}s`, calc.success?"#39B54A":"#e10600"],
              ].map(([k, v, c]) => (
                <div key={k} style={{ background:"#1e1e1e", padding:"5px 7px", border:"1px solid #2e2e2e", textAlign:"center" }}>
                  <div style={{ fontSize:9, color:"#999", letterSpacing:".12em" }}>{k}</div>
                  <div style={{ fontSize:13, fontWeight:900, color:c, marginTop:2 }}>{v}</div>
                </div>
              ))}
              <div style={{ gridColumn:"1/-1", padding:"6px 8px", background: calc.success ? "#39B54A11" : "#e1060011", border:`1px solid ${calc.success?"#39B54A22":"#e1060022"}`, textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:900, color:calc.success?"#39B54A":"#e10600" }}>
                  {calc.success
                    ? `✓ UNDERCUT WORKS — Recovers in ~${calc.lapsToRecover.toFixed(1)} laps`
                    : `✗ Need ${calc.lapsNeeded} more laps to recover pit delta`}
                </div>
                <div style={{ fontSize:10, color:"#999", marginTop:2 }}>
                  → Fresh {calc.freshCompound} vs worn {allCars.find(c=>c.isUser)?.laps[lapIdx]?.compound}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY COMPARISON
// ═══════════════════════════════════════════════════════════════════════════════
function StrategyComparison({ stints, trackKey, altStints, altLabel }) {
  if (!altStints) return null;
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
      {[["YOUR STRATEGY", stints], [altLabel || "RIVAL STRATEGY", altStints]].map(([label, sts], si) => (
        <div key={si} style={{ background:"#222222", border:"1px solid #2e2e2e", padding:"8px 10px" }}>
          <div style={{ fontSize:11, color:"#bbb", letterSpacing:".2em", marginBottom:6 }}>{label}</div>
          <div style={{ display:"flex", height:6, borderRadius:2, overflow:"hidden", gap:1 }}>
            {sts.map((s, i) => {
              const C = COMPOUNDS[s.compound] || COMPOUNDS.C3;
              return <div key={i} style={{ flex:s.laps, background:C.col, opacity:.85 }}/>;
            })}
          </div>
          <div style={{ marginTop:6 }}>
            {sts.map((s,i)=>{ const C=COMPOUNDS[s.compound]||COMPOUNDS.C3; return (
              <div key={i} style={{ fontSize:12, color:"#aaa", display:"flex", justifyContent:"space-between", marginTop:2 }}>
              <span style={{ color:C.col }}>{s.compound} {relName(s.compound, trackKey)}</span>
                <span>{s.laps} laps</span>
              </div>
            );})}
          </div>
          <div style={{ fontSize:12, color:"#999", marginTop:4 }}>{sts.length-1} stop{sts.length>2?"s":""}</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STINT EDITOR
// ═══════════════════════════════════════════════════════════════════════════════
function StintEditor({ stints, trackKey, onUpdate, total }) {
  const T = TRACKS[trackKey];
  const dryCompounds = T.compound;
  // Display names are relative to the track's allocation:
  // hardest compound = HARD, middle = MEDIUM, softest = SOFT
  // This matches how Pirelli labels them at each event
  const RELATIVE_NAMES = ["HARD", "MEDIUM", "SOFT"];
  const dryRoles = dryCompounds.map((_, ri) => RELATIVE_NAMES[ri] || RELATIVE_NAMES[2]);
  const wetCompounds = [{ key:"I", short:"INTER" },{ key:"W", short:"WET" }];
  const ACC = "#FF8000";

  const cumLaps = [];
  let cum = 0;
  stints.forEach(s => { cum += s.laps; cumLaps.push(cum); });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
      {stints.map((s, idx) => {
        const C          = COMPOUNDS[s.compound] || COMPOUNDS.C3;
        const stintStart = cumLaps[idx-1] ? cumLaps[idx-1]+1 : 1;
        const stintEnd   = cumLaps[idx];
        const overLife   = s.laps > C.maxLife;
        const wearPct    = Math.min(100, Math.round(s.laps / C.maxLife * 100));
        const nearLimit  = !overLife && wearPct >= 80;
        const isLast     = idx === stints.length - 1;
        const sliderMin  = stintStart + 1;
        const sliderMax  = Math.max(sliderMin + 1, stintStart + s.laps + (stints[idx+1]?.laps || 0) - 2);

        return (
          <div key={idx}>
            <div style={{
              background:"#1e1e1e",
              border:`1px solid ${overLife?"#e1060033":nearLimit?"#FFD70033":"#1a1a1a"}`,
              borderBottom: isLast ? undefined : "none",
              padding:"13px 13px 11px",
            }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:11 }}>
                <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                  <div style={{ width:4, height:28, borderRadius:2, background:C.col, flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:15, fontWeight:900, color:"#f0f0f0", letterSpacing:".06em", lineHeight:1 }}>STINT {idx+1}</div>
                    <div style={{ fontSize:12, color:"#999", marginTop:3 }}>Laps {stintStart} – {stintEnd}</div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:overLife?"#e10600":nearLimit?"#FFD700":"#555" }}>
                      {s.laps} / {C.maxLife} laps
                    </div>
                    <div style={{ width:72, height:4, background:"#333", borderRadius:2, overflow:"hidden", marginTop:4 }}>
                      <div style={{ width:`${wearPct}%`, height:"100%", borderRadius:2, background:overLife?"#e10600":nearLimit?"#FFD700":"#39B54A", transition:"width .3s, background .3s" }}/>
                    </div>
                    {overLife && <div style={{ fontSize:10, color:"#e10600", fontWeight:700, marginTop:2 }}>⚠ OVER LIMIT</div>}
                    {nearLimit && <div style={{ fontSize:10, color:"#FFD700", fontWeight:700, marginTop:2 }}>⚡ PUSHING LIFE</div>}
                  </div>
                  {stints.length > 1 && (
                    <button onClick={() => onUpdate(removePitStop(stints, idx, total))}
                      style={{ background:"transparent", border:"1px solid #2e2e2e", color:"#999", cursor:"pointer", fontSize:13, lineHeight:1, padding:"5px 9px", transition:"all .12s", borderRadius:2 }}
                      onMouseOver={e=>{ e.currentTarget.style.borderColor="#e10600"; e.currentTarget.style.color="#e10600"; }}
                      onMouseOut={e=>{ e.currentTarget.style.borderColor="#1e1e1e"; e.currentTarget.style.color="#333"; }}>✕</button>
                  )}
                </div>
              </div>

              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, color:"#888", letterSpacing:".18em", textTransform:"uppercase", marginBottom:6 }}>DRY COMPOUNDS</div>
                <div style={{ display:"flex", gap:5 }}>
                  {dryCompounds.map((ck, ri) => {
                    const Cc = COMPOUNDS[ck] || COMPOUNDS.C3;
                    const isActive = s.compound === ck;
                    const isDark = ck==="C1"||ck==="C2";
                    return (
                      <button key={ck} onClick={() => onUpdate(setStintCompound(stints, idx, ck))} style={{
                        flex:1, padding:"10px 4px", cursor:"pointer",
                        fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, transition:"all .12s",
                        border:`2px solid ${isActive ? Cc.col : "#1e1e1e"}`,
                        background: isActive ? Cc.col : "#0d0d0d",
                        color: isActive ? (isDark?"#111":"#fff") : "#383838",
                        borderRadius:3,
                        boxShadow: isActive ? `0 0 14px ${Cc.col}55` : "none",
                      }}>
                        <div style={{ fontSize:15, lineHeight:1 }}>{ck}</div>
                        <div style={{ fontSize:10, marginTop:3, opacity:.85 }}>{dryRoles[ri]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize:10, color:"#888", letterSpacing:".18em", textTransform:"uppercase", marginBottom:6 }}>WET WEATHER</div>
                <div style={{ display:"flex", gap:5 }}>
                  {wetCompounds.map(({ key:ck, short }) => {
                    const Cc = COMPOUNDS[ck];
                    const isActive = s.compound === ck;
                    return (
                      <button key={ck} onClick={() => onUpdate(setStintCompound(stints, idx, ck))} style={{
                        flex:1, padding:"10px 4px", cursor:"pointer",
                        fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, transition:"all .12s",
                        border:`2px solid ${isActive ? Cc.col : "#1e1e1e"}`,
                        background: isActive ? Cc.col : "#0d0d0d",
                        color: isActive ? "#fff" : "#383838",
                        borderRadius:3,
                        boxShadow: isActive ? `0 0 14px ${Cc.col}55` : "none",
                      }}>
                        <div style={{ fontSize:15, lineHeight:1 }}>{ck}</div>
                        <div style={{ fontSize:10, marginTop:3, opacity:.85 }}>{short}</div>
                      </button>
                    );
                  })}
                  <div style={{ flex:1 }}/>
                </div>
              </div>
            </div>

            {!isLast && (
              <div style={{ background:"#1a1a1a", border:"1px solid #2e2e2e", borderTop:"none", padding:"11px 13px 13px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:9 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:11, height:11, borderRadius:"50%", background:"#e10600", boxShadow:"0 0 9px #e1060099", flexShrink:0 }}/>
                    <div style={{ fontSize:14, fontWeight:900, color:"#e10600", letterSpacing:".08em" }}>PIT STOP</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:24, fontWeight:900, color:"#fff", lineHeight:1 }}>LAP {cumLaps[idx]}</div>
                    <div style={{ fontSize:11, color:"#888", marginTop:1 }}>of {total} laps</div>
                  </div>
                </div>

                <div style={{ position:"relative", paddingBottom:20 }}>
                  <input type="range"
                    min={sliderMin} max={sliderMax} value={cumLaps[idx]}
                    onChange={e => onUpdate(setPitLapBetween(stints, idx, +e.target.value, total))}
                    style={{ width:"100%", accentColor:"#e10600" }}
                  />
                  <div style={{ position:"absolute", bottom:2, left:0, right:0, display:"flex", justifyContent:"space-between", pointerEvents:"none" }}>
                    {[sliderMin, Math.round((sliderMin+sliderMax)/2), sliderMax].map(v => (
                      <div key={v} style={{ fontSize:10, color:"#888", fontWeight:700 }}>L{v}</div>
                    ))}
                  </div>
                </div>

                <div style={{ display:"flex", gap:5 }}>
                  {[["OPEN",`L${sliderMin}`,"#1e1e1e","#2a2a2a"],["PIT LAP",`L${cumLaps[idx]}`,"#e1060022","#e10600"],["CLOSE",`L${sliderMax}`,"#1e1e1e","#2a2a2a"]].map(([lbl,val,bg,col])=>(
                    <div key={lbl} style={{ flex:1, background:"#222222", border:`1px solid ${bg}`, padding:"6px 8px", textAlign:"center", borderRadius:2 }}>
                      <div style={{ fontSize:12, color:"#888", letterSpacing:".12em" }}>{lbl}</div>
                      <div style={{ fontSize:14, fontWeight:900, color:col, marginTop:2 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {stints.length < 3 && (
        <button onClick={() => onUpdate(addPitStop(stints, total, trackKey))}
          style={{
            width:"100%", padding:"12px", background:"transparent", border:"1px dashed #1e1e1e",
            color:"#888", cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
            fontSize:12, fontWeight:700, letterSpacing:".2em", textTransform:"uppercase",
            marginTop:6, transition:"all .15s", borderRadius:2,
          }}
          onMouseOver={e=>{ e.currentTarget.style.borderColor="#333"; e.currentTarget.style.color="#555"; }}
          onMouseOut={e=>{ e.currentTarget.style.borderColor="#1e1e1e"; e.currentTarget.style.color="#282828"; }}>
          + ADD PIT STOP
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAP TIME CHART
// ═══════════════════════════════════════════════════════════════════════════════
function LapChart({ cars, scrubLap }) {
  const ref = useRef(null);
  useEffect(()=>{
    const cv=ref.current; if (!cv||!cars.length) return;
    const dpr=window.devicePixelRatio||1;
    cv.width=cv.offsetWidth*dpr; cv.height=120*dpr;
    const ctx=cv.getContext("2d"); ctx.scale(dpr,dpr);
    const W=cv.offsetWidth,H=120,P={t:10,r:10,b:18,l:30};
    ctx.clearRect(0,0,W,H);
    const allTimes = cars.flatMap(c=>c.laps.map(l=>l.lapTime)).filter(t=>t<300&&t>0);
    if (!allTimes.length) return;
    const lo=Math.min(...allTimes)-1, hi=Math.max(...allTimes)+1;
    const n=cars[0].laps.length;
    const xS=i=>P.l+(i/(n-1||1))*(W-P.l-P.r);
    const yS=v=>P.t+(1-(v-lo)/(hi-lo))*(H-P.t-P.b);

    ctx.strokeStyle="rgba(255,255,255,.08)"; ctx.lineWidth=1;
    for (let v=Math.ceil(lo);v<=hi;v+=5) {
      ctx.beginPath(); ctx.moveTo(P.l,yS(v)); ctx.lineTo(W-P.r,yS(v)); ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,.55)"; ctx.font="6px monospace";
      ctx.textAlign="right"; ctx.fillText(fmtLap(v),P.l-2,yS(v)+2);
    }

    cars.slice(0,5).forEach(car=>{
      let prevCompound = null, segStart = 0;
      car.laps.forEach((l,i)=>{
        if (l.compound !== prevCompound || i === car.laps.length-1) {
          if (prevCompound !== null) {
            const C = COMPOUNDS[prevCompound]||COMPOUNDS.C3;
            ctx.beginPath();
            for (let j=segStart;j<=i;j++) {
              const t=car.laps[j]?.lapTime;
              if (t&&t<300) j===segStart?ctx.moveTo(xS(j),yS(t)):ctx.lineTo(xS(j),yS(t));
            }
            ctx.strokeStyle = car.isUser ? C.col : C.col+"55";
            ctx.lineWidth = car.isUser ? 2 : 1;
            ctx.lineJoin="round"; ctx.stroke();
          }
          prevCompound = l.compound; segStart = i;
        }
      });
      car.laps.forEach((l,i)=>{
        if (l.isPit) {
          ctx.beginPath(); ctx.moveTo(xS(i),P.t); ctx.lineTo(xS(i),H-P.b);
          ctx.strokeStyle=car.isUser?"#e10600":"#e1060033"; ctx.lineWidth=car.isUser?1.5:1;
          ctx.setLineDash([2,4]); ctx.stroke(); ctx.setLineDash([]);
        }
      });
    });

    if (scrubLap>0&&scrubLap<=n) {
      ctx.strokeStyle="rgba(255,255,255,.4)"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(xS(scrubLap-1),P.t); ctx.lineTo(xS(scrubLap-1),H-P.b); ctx.stroke();
    }
    ctx.textAlign="left";
  },[cars,scrubLap]);
  return <canvas ref={ref} style={{ display:"block", width:"100%", height:120 }}/>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAMPIONSHIP POINTS IMPACT
// ═══════════════════════════════════════════════════════════════════════════════
function calcChampionshipImpact(finalTimes) {
  // Points each driver earns from this race result
  const racePoints = {};
  let pointsPos = 0;
  finalTimes.forEach(c => {
    if (!c.dnf) {
      pointsPos++;
      if (pointsPos <= 10) racePoints[c.id] = POINTS_TABLE[pointsPos - 1];
      else racePoints[c.id] = 0;
    } else {
      racePoints[c.id] = 0;
    }
  });

  // Build before/after standings
  const standings = DRIVERS.map(d => ({
    id: d.id, name: d.name, team: d.team,
    ptsBefore: d.pts2026 || 0,
    ptsAfter: (d.pts2026 || 0) + (racePoints[d.id] || 0),
    racePoints: racePoints[d.id] || 0,
  }));

  standings.sort((a, b) => b.ptsBefore - a.ptsBefore);
  standings.forEach((s, i) => { s.posBefore = i + 1; });
  standings.sort((a, b) => b.ptsAfter - a.ptsAfter);
  standings.forEach((s, i) => { s.posAfter = i + 1; });

  return standings;
}

function ChampionshipPanel({ raceResult, selDriver }) {
  const standings = calcChampionshipImpact(raceResult.finalTimes, selDriver);
  const userStanding = standings.find(s => s.id === selDriver);
  const leader = standings[0];
  const driverData = DRIVERS.find(d => d.id === selDriver);
  const teamCol = TEAMS[driverData?.team]?.col || "#FF8000";

  const posChange = userStanding ? userStanding.posBefore - userStanding.posAfter : 0;

  return (
    <div>
      {/* User summary */}
      {userStanding && (
        <div style={{ padding:"12px 14px", background:`${teamCol}0c`, border:`1px solid ${teamCol}22`, marginBottom:10 }}>
          <div style={{ fontSize:10, letterSpacing:".2em", color:"#999", textTransform:"uppercase", marginBottom:8 }}>CHAMPIONSHIP IMPACT</div>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, color:"#999", letterSpacing:".1em" }}>BEFORE</div>
              <div style={{ fontSize:28, fontWeight:900, color:"#bbb", lineHeight:1 }}>P{userStanding.posBefore}</div>
              <div style={{ fontSize:11, color:"#bbb" }}>{userStanding.ptsBefore} pts</div>
            </div>
            <div style={{ flex:1, textAlign:"center" }}>
              <div style={{ fontSize:posChange > 0 ? 28 : posChange < 0 ? 28 : 18, fontWeight:900,
                color: posChange > 0 ? "#39B54A" : posChange < 0 ? "#e10600" : "#555", lineHeight:1 }}>
                {posChange > 0 ? `▲${posChange}` : posChange < 0 ? `▼${Math.abs(posChange)}` : "—"}
              </div>
              <div style={{ fontSize:10, color:teamCol, fontWeight:700, marginTop:3 }}>
                +{userStanding.racePoints} pts
              </div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, color:"#999", letterSpacing:".1em" }}>AFTER</div>
              <div style={{ fontSize:28, fontWeight:900, color:teamCol, lineHeight:1 }}>P{userStanding.posAfter}</div>
              <div style={{ fontSize:11, color:teamCol+"aa" }}>{userStanding.ptsAfter} pts</div>
            </div>
          </div>
          {leader.id !== selDriver && (
            <div style={{ fontSize:11, color:"#999", textAlign:"center" }}>
              Gap to <span style={{ color: TEAMS[DRIVERS.find(d=>d.id===leader.id)?.team]?.col || "#fff" }}>{leader.id}</span>
              : <span style={{ color:"#aaa", fontWeight:700 }}>-{leader.ptsAfter - userStanding.ptsAfter} pts</span>
            </div>
          )}
          {leader.id === selDriver && (
            <div style={{ fontSize:11, color:"#FFD700", textAlign:"center", fontWeight:700 }}>🏆 CHAMPIONSHIP LEADER</div>
          )}
        </div>
      )}

      {/* Top 8 standings */}
      <div style={{ fontSize:10, letterSpacing:".2em", color:"#999", textTransform:"uppercase", marginBottom:6 }}>DRIVERS' STANDINGS AFTER RACE</div>
      {standings.slice(0, 8).map((s, i) => {
        const isUser = s.id === selDriver;
        const col = TEAMS[s.team]?.col || "#888";
        const moved = s.posAfter - s.posBefore; // negative = gained positions
        return (
          <div key={s.id} style={{
            display:"flex", alignItems:"center", gap:8, padding:"5px 8px", marginBottom:2,
            background: isUser ? `${col}0d` : "transparent",
            border: `1px solid ${isUser ? col+"22" : "transparent"}`,
          }}>
            <div style={{ fontSize:12, fontWeight:900, color: i===0?"#FFD700":i<=2?"#888":"#333", minWidth:22 }}>P{i+1}</div>
            <div style={{ width:3, height:14, borderRadius:1, background:col, flexShrink:0 }}/>
            <div style={{ flex:1, fontSize:11, fontWeight:700, color:isUser?"#ccc":"#444" }}>{s.name.split(" ").pop()}</div>
            <div style={{ fontSize:10, color:"#bbb", minWidth:22, textAlign:"center" }}>
              {s.racePoints > 0 && <span style={{ color: i===0?"#FFD700":col+"cc" }}>+{s.racePoints}</span>}
            </div>
            <div style={{ fontSize:12, fontWeight:900, color:isUser?col:"#444", minWidth:42, textAlign:"right" }}>{s.ptsAfter}</div>
            <div style={{ fontSize:10, minWidth:16, textAlign:"right",
              color: moved < 0 ? "#39B54A" : moved > 0 ? "#e10600" : "#333" }}>
              {moved < 0 ? `▲${-moved}` : moved > 0 ? `▼${moved}` : "·"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST-RACE DEBRIEF
// ═══════════════════════════════════════════════════════════════════════════════
function GapEvolutionChart({ allCars }) {
  const ref = useRef(null);

  function draw() {
    const cv = ref.current; if (!cv || !allCars.length) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = cv.offsetWidth * dpr; cv.height = 200 * dpr;
    const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    const W = cv.offsetWidth, H = 200, P = { t:14, r:70, b:22, l:36 };
    ctx.clearRect(0, 0, W, H);

    const leader = allCars.find(c => !c.laps[c.laps.length-1]?.dnf) ||
      [...allCars].sort((a,b) => (a.laps[a.laps.length-1]?.cumTime||9999)-(b.laps[b.laps.length-1]?.cumTime||9999))[0];
    if (!leader) return;

    const n = leader.laps.length;
    const xS = i => P.l + (i / (n - 1 || 1)) * (W - P.l - P.r);

    const rivals = allCars.filter(c => !c.laps[n-1]?.dnf);
    const gaps = rivals.map(car =>
      car.laps.map((l, i) => {
        const ref2 = leader.laps[i]?.cumTime || 0;
        return l.cumTime - ref2;
      })
    );
    const flat = gaps.flat().filter(g => Math.abs(g) < 120 && g >= 0);
    if (!flat.length) return;
    const hi = Math.min(Math.max(...flat) + 3, 90), lo = -2;
    const yS = v => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);

    // Grid
    [0, 10, 20, 30, 45, 60].forEach(v => {
      if (v > hi) return;
      ctx.strokeStyle = v === 0 ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.04)";
      ctx.lineWidth = v === 0 ? 1.5 : 1;
      ctx.beginPath(); ctx.moveTo(P.l, yS(v)); ctx.lineTo(W - P.r, yS(v)); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.2)"; ctx.font = "6px monospace"; ctx.textAlign = "right";
      ctx.fillText(v === 0 ? "LEAD" : `+${v}s`, P.l - 2, yS(v) + 2);
    });

    // SC zones
    allCars[0].laps.forEach((l, i) => {
      if (l.isSC || l.isVSC) {
        const x1 = xS(i), x2 = xS(Math.min(i + 1, n - 1));
        ctx.fillStyle = l.isSC ? "rgba(255,215,0,.05)" : "rgba(255,215,0,.03)";
        ctx.fillRect(x1, P.t, x2 - x1, H - P.t - P.b);
      }
    });

    // Lines per rival
    rivals.forEach((car, ri) => {
      const g = gaps[ri];
      if (!g) return;
      const isUser = car.isUser;
      ctx.beginPath();
      g.forEach((v, i) => {
        if (v < 0 || v > hi + 5) return;
        const x = xS(i), y = yS(Math.min(v, hi));
        i === 0 || g[i-1] < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = isUser ? car.col : car.col + "55";
      ctx.lineWidth = isUser ? 2.2 : 1.2;
      ctx.lineJoin = "round"; ctx.stroke();

      // Label at end
      const last = g[g.length - 1];
      if (last >= 0 && last <= hi) {
        ctx.fillStyle = isUser ? car.col : car.col + "bb";
        ctx.font = isUser ? "bold 7px monospace" : "6px monospace";
        ctx.textAlign = "left";
        ctx.fillText(car.driverCode, W - P.r + 3, yS(last) + 2);
      }
    });

    // DNF markers - dotted line to retirement lap
    allCars.filter(c => c.laps[c.laps.length-1]?.dnf).forEach(car => {
      const dnfIdx = car.laps.findIndex(l => l.dnf);
      if (dnfIdx <= 0) return;
      const g = car.laps.slice(0, dnfIdx).map((l, i) => {
        const refT = leader.laps[i]?.cumTime || 0;
        return l.cumTime - refT;
      });
      ctx.beginPath();
      g.forEach((v, i) => {
        if (v < 0 || v > hi + 5) return;
        const x = xS(i), y = yS(Math.min(v, hi));
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = car.col + "33";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      // ✕ at DNF point
      const lastV = g[g.length - 1];
      if (lastV >= 0 && lastV <= hi) {
        const x = xS(dnfIdx - 1), y = yS(Math.min(lastV, hi));
        ctx.fillStyle = car.col + "88";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText("✕", x, y - 3);
      }
    });

    // Lap labels
    ctx.fillStyle = "rgba(255,255,255,.15)"; ctx.font = "6px monospace"; ctx.textAlign = "center";
    for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 8)))
      ctx.fillText(`L${i+1}`, xS(i), H - 4);
  }

  useEffect(() => {
    draw();
    const cv = ref.current; if (!cv) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(cv);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCars]);

  return <canvas ref={ref} style={{ display:"block", width:"100%", height:200 }}/>;
}

function DebriefTab({ allCars, raceResult, selDriver, trackKey, normStints, LAPS, pushMode }) {
  const T = TRACKS[trackKey];
  if (!allCars.length || !raceResult) return (
    <div style={{ padding:"40px 0", textAlign:"center", fontSize:12, color:"#777", fontStyle:"italic" }}>
      Run a race first to see the debrief.
    </div>
  );

  const userCar = allCars.find(c => c.isUser);
  // Stint-by-stint analysis for each car
  function getStintStats(car) {
    const stintGroups = [];
    let curCompound = null, stintStart = 0, laps = [];
    car.laps.forEach((l, i) => {
      if (l.dnf) return;
      if (l.compound !== curCompound) {
        if (curCompound !== null && laps.length > 0) {
          const valid = laps.filter(t => t > 0 && t < 200);
          stintGroups.push({
            compound: curCompound,
            startLap: stintStart + 1,
            endLap: i,
            laps: laps.length,
            avgLap: valid.length ? valid.reduce((a,b)=>a+b,0)/valid.length : 0,
            minLap: valid.length ? Math.min(...valid) : 0,
            hasPit: laps.some((_,j) => car.laps[stintStart+j]?.isPit),
          });
        }
        curCompound = l.compound; stintStart = i; laps = [];
      }
      laps.push(l.lapTime);
    });
    if (curCompound && laps.length) {
      const valid = laps.filter(t => t > 0 && t < 200);
      stintGroups.push({ compound: curCompound, startLap: stintStart+1, endLap: car.laps.length, laps: laps.length,
        avgLap: valid.length ? valid.reduce((a,b)=>a+b,0)/valid.length : 0, minLap: valid.length ? Math.min(...valid) : 0 });
    }
    return stintGroups;
  }

  const userStints = userCar ? getStintStats(userCar) : [];
  const LBL2 = { fontSize:10, letterSpacing:".2em", textTransform:"uppercase", color:"#999" };
  const CARD2 = { background:"#1c1c1c", border:"1px solid #2e2e2e", padding:14, marginBottom:8 };
  const teamCol = TEAMS[DRIVERS.find(d=>d.id===selDriver)?.team]?.col || "#FF8000";

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }} className="debrief-grid">
      {/* LEFT: Gap evolution + verdict */}
      <div>
        <div style={CARD2}>
          <div style={{...LBL2, marginBottom:8}}>GAP EVOLUTION — ALL LAPS</div>
          <GapEvolutionChart allCars={allCars} LAPS={LAPS}/>
          <div style={{ marginTop:6, fontSize:10, color:"#777", fontStyle:"italic" }}>
            Leader = zero line · SC/VSC zones highlighted
          </div>
        </div>

        {/* Strategy verdict */}
        <div style={CARD2}>
          <div style={{...LBL2, marginBottom:10}}>STRATEGY VERDICT</div>
          {(() => {
            const pos = raceResult.userFinishPos;
            const stops = normStints.length - 1;
            // eslint-disable-next-line no-unused-vars
            const avgField = allCars.filter(c=>!c.laps[c.laps.length-1]?.dnf).length / 2;
            const verdict = pos === 1 ? { col:"#FFD700", icon:"🏆", title:"OPTIMAL STRATEGY", msg:`P${pos} — Perfect execution. ${stops}-stop was the right call.` }
              : pos <= 3  ? { col:"#39B54A", icon:"✓",  title:"STRONG STRATEGY",  msg:`P${pos} finish. ${stops}-stop strategy well executed.` }
              : pos <= 10 ? { col:teamCol,   icon:"·",  title:"POINTS STRATEGY",  msg:`P${pos}. ${stops} stops. Some time lost${stops > 1 ? " — consider 1-stop" : " — push harder next time"}.` }
              :             { col:"#e10600", icon:"✗",  title:"STRATEGY REVIEW",  msg:`P${pos}. ${pushMode?"Pushing harder wore tyres faster. Consider saving mode.":"Track position was an issue. Earlier pit could help."}` };
            return (
              <div style={{ padding:"10px 12px", background:`${verdict.col}08`, border:`1px solid ${verdict.col}22` }}>
                <div style={{ fontSize:14, fontWeight:900, color:verdict.col, letterSpacing:".06em", marginBottom:6 }}>
                  {verdict.icon} {verdict.title}
                </div>
                <div style={{ fontSize:12, color:"#bbb", lineHeight:1.6 }}>{verdict.msg}</div>
                <div style={{ marginTop:8, display:"flex", gap:8 }}>
                  {normStints.map((s,i)=>{ const C=COMPOUNDS[s.compound]||COMPOUNDS.C3; return (
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:4 }}>
                      <div style={{ width:7,height:7,borderRadius:"50%",background:C.col }}/>
                      <span style={{ fontSize:10,color:"#bbb" }}>{s.compound}·{s.laps}L</span>
                    </div>
                  );})}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* RIGHT: Stint breakdown + championship */}
      <div>
        {/* User stint breakdown */}
        {userStints.length > 0 && (
          <div style={CARD2}>
            <div style={{...LBL2, marginBottom:8}}>YOUR STINT BREAKDOWN</div>
            {userStints.map((s, i) => {
              const C = COMPOUNDS[s.compound] || COMPOUNDS.C3;
              return (
                <div key={i} style={{ marginBottom:i < userStints.length-1 ? 8 : 0, padding:"8px 10px", background:"#1a1a1a", border:"1px solid #2a2a2a" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                    <div style={{ width:3, height:20, borderRadius:1, background:C.col, flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <span style={{ fontSize:12, fontWeight:900, color:C.col }}>{s.compound} {relName(s.compound, trackKey)}</span>
                      <span style={{ fontSize:11, color:"#999", marginLeft:6 }}>L{s.startLap}–L{s.endLap} ({s.laps} laps)</span>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4 }}>
                    {[
                      ["AVG LAP", fmtLap(s.avgLap), "#555"],
                      ["BEST LAP", fmtLap(s.minLap), "#39B54A"],
                      ["DEG/LAP", s.avgLap && s.minLap ? `+${(s.avgLap - s.minLap).toFixed(2)}s` : "—", "#FFD700"],
                    ].map(([k,v,c])=>(
                      <div key={k} style={{ background:"#1e1e1e", padding:"4px 6px", border:"1px solid #2a2a2a" }}>
                        <div style={{ fontSize:8, color:"#888", letterSpacing:".15em" }}>{k}</div>
                        <div style={{ fontSize:12, fontWeight:900, color:c, marginTop:1 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Championship impact */}
        <div style={CARD2}>
          <ChampionshipPanel raceResult={raceResult} selDriver={selDriver}/>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD STORAGE
// ═══════════════════════════════════════════════════════════════════════════════
const LB_KEY = "f1_v4_lb";
async function loadLB() { try { const r=await window.storage.get(LB_KEY); return r?JSON.parse(r.value):[]; } catch { return []; }}
async function saveLB(b) { try { await window.storage.set(LB_KEY,JSON.stringify(b.slice(0,50))); } catch { /* ignore */ } }

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function F1StrategyLab() {
  const [tab,          setTab]         = useState("build");
  const [trackKey,     setTrackKey]    = useState("bahrain");
  const [weather,      setWeather]     = useState("dry");
  const [scLap,        setScLap]       = useState(0);
  const [weatherChangeLap, setWeatherChangeLap] = useState(0); // mid-race weather
  const [showLabels,   setShowLabels]  = useState(true);
  const [selDriver,    setSelDriver]   = useState("NOR");
  const [pushMode,     setPushMode]    = useState(true);
  const [myStints,     setMyStints]    = useState([{ compound:"C3", laps:28 },{ compound:"C1", laps:29 }]);

  const [allCars,      setAllCars]     = useState([]);
  const [simData,      setSimData]     = useState(null);
  const [scrubLap,     setScrubLap]    = useState(0);
  const [running,      setRunning]     = useState(false);
  const [, setHasRun] = useState(false);
  const [events,       setEvents]      = useState([]);
  const [raceSeed,     setRaceSeed_]   = useState(1);
  const [userPos,      setUserPos]     = useState(null);
  const [speedLabel,   setSpeedLabel]  = useState("");
  const [finishZoom,   setFinishZoom]  = useState(false);
  const [gridOrder,    setGridOrder]   = useState([]);
  const [leaderboard,  setLeaderboard] = useState([]);
  const [lbName,       setLbName]      = useState("");
  const [submitted,    setSubmitted]   = useState(false);
  const [raceResult,   setRaceResult]  = useState(null);
  const [buildSubTab,  setBuildSubTab] = useState("strategy");
  const [undercutOpen, setUndercutOpen] = useState(true);
  const [commsOpen,    setCommsOpen]   = useState(true);
  const [raceSubTab,   setRaceSubTab]  = useState("map");
  const eventsRef = useRef([]);

  const driverData = DRIVERS.find(d => d.id === selDriver) || DRIVERS[0];
  const teamData   = TEAMS[driverData.team];
  const T = TRACKS[trackKey], LAPS = T.laps;

  useEffect(() => {
    const T2 = TRACKS[trackKey];
    const med  = getCompoundKey(trackKey, "Medium");
    const hard = getCompoundKey(trackKey, "Hard");
    const h = Math.floor(T2.laps / 2);
    setMyStints(balanceStints([{ compound:med,laps:h },{ compound:hard,laps:T2.laps-h }], T2.laps));
    setGridOrder(buildGrid(trackKey, weather));
  }, [trackKey, weather]);

  // Rebuild grid preview when seed changes
  useEffect(() => {
    setRaceSeed(raceSeed);
    setGridOrder(buildGrid(trackKey, weather));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceSeed]);

  useEffect(() => { loadLB().then(setLeaderboard); }, []);

  const normStints = balanceStints(myStints, LAPS);
  const userCar    = allCars.find(c => c.isUser);
  const curLap     = userCar?.laps[Math.max(0, scrubLap-1)];

  // Nearest rival: different team, P1 in standings by pts2026 relative to user
  const userDriver = DRIVERS.find(d => d.id === selDriver);
  const rivalDriver = DRIVERS
    .filter(d => d.team !== userDriver?.team)
    .sort((a, b) => Math.abs(a.pts2026 - (userDriver?.pts2026||0)) - Math.abs(b.pts2026 - (userDriver?.pts2026||0)))[0]
    || DRIVERS.find(d => d.id !== selDriver);
  const rivalStints = buildRivalStints(rivalDriver?.team || "RBR", trackKey, rivalDriver?.id || "VER");

  function runSim() {
    setRaceSeed(raceSeed); // apply seed to global hash function
    const sc = scLap || null;
    const grid = buildGrid(trackKey, weather);
    eventsRef.current = [];

    const carInputs = DRIVERS.map((d) => {
      const team = TEAMS[d.team];
      const isUser = d.id === selDriver;
      const stints = isUser ? normStints : buildRivalStints(d.team, trackKey, d.id);
      const gridPos = grid.findIndex(g => g.driver.id === d.id);
      const pos = gridPos;

      // ── FIXED start gap calculation ───────────────────────────────────────
      // P1 gets 0 gap. Gaps grow realistically with some randomness.
      // Real F1: P2 typically 0.2-0.5s behind at start, P20 ~6-10s behind (before lap 1)
      // After lap 1 with the chaos model, gaps spread further.
      let startGap;
      if (pos === 0)      startGap = 0;
      else if (pos <= 2)  startGap = pos * 0.25 + driverHash(d.id, 101) * 0.15;
      else if (pos <= 5)  startGap = 0.5 + (pos - 2) * 0.35 + driverHash(d.id, 102) * 0.20;
      else if (pos <= 10) startGap = 1.55 + (pos - 5) * 0.42 + driverHash(d.id, 103) * 0.25;
      else                startGap = 3.65 + (pos - 10) * 0.48 + driverHash(d.id, 104) * 0.30;

      return {
        id: d.id, driver: d, teamPace: team.racePace, isUser, stints,
        pushMode: isUser ? pushMode : (team.aggression > 0.6),
        gridPos: gridPos + 1, startGap,
      };
    });

    const lapResults = simulateRace(trackKey, carInputs, sc, weather, weatherChangeLap || null);

    const cars = carInputs.map((ci, idx) => ({
      id: ci.id, driverCode: ci.id, name: DRIVERS.find(d=>d.id===ci.id)?.name||ci.id,
      teamName: TEAMS[ci.driver.team]?.name, col: TEAMS[ci.driver.team]?.col,
      isUser: ci.isUser, stints: ci.stints, laps: lapResults[idx], gridPos: ci.gridPos,
      pushMode: ci.pushMode,
    }));

    // Filter out DNFs for final result (partial race time)
    const finalTimes = cars.map(c=>{
      const lastLap = c.laps[c.laps.length-1];
      return { id:c.id, name:c.name, col:c.col, time:lastLap?.cumTime||9999, teamName:c.teamName, dnf:lastLap?.dnf||false };
    }).sort((a,b)=>{
      if (a.dnf && !b.dnf) return 1;
      if (!a.dnf && b.dnf) return -1;
      return a.time-b.time;
    });
    const userFinishPos = finalTimes.findIndex(c=>c.id===selDriver)+1;
    setRaceResult({ finalTimes, userFinishPos, winner:finalTimes[0] });

    const lapMs = buildLapTimings(cars, T.laps);
    let lastEvLap = 0;

    let lastBattlePair = "";
    const sd = {
      cars, lapMs, LAPS: T.laps,
      onLapChange: (lap, done) => {
        setScrubLap(lap);
        const idx = Math.min(lap-1, cars[0].laps.length-1);
        const uT = cars.find(c=>c.isUser)?.laps[idx]?.cumTime || 0;
        // Guard: only compute position if user has valid lap data
        const pos = uT > 0
          ? cars.filter(c=>!c.isUser&&!c.laps[idx]?.dnf&&(c.laps[idx]?.cumTime||0)<uT).length+1
          : null;
        if (pos !== null) setUserPos(pos);
        const anyPit = cars.some(c=>c.laps[idx]?.isPit);
        const anySC  = cars.some(c=>c.laps[idx]?.isSC);
        const isVSCLap = cars.some(c=>c.laps[idx]?.isVSC);
        const times2 = cars.filter(c=>!c.laps[idx]?.dnf).map(c=>c.laps[idx]?.cumTime||99999).sort((a,b)=>a-b);
        const battle = times2.length>1 && (times2[1]-times2[0])<1.5;
        const anyDNF = cars.some(c=>c.laps[idx]?.dnf);

        if (done)               setSpeedLabel("🏁 FINISHED");
        else if (lap===T.laps)  { setSpeedLabel("🏁 FINAL LAP"); setFinishZoom(true); }
        else if (anyPit)        setSpeedLabel("🔴 PIT STOP");
        else if (lap<=3)        setSpeedLabel("🚦 RACE START");
        else if (lap>=T.laps-4) setSpeedLabel("🏁 FINAL LAPS");
        else if (battle)        setSpeedLabel("⚔️ BATTLE");
        else if (anySC)         setSpeedLabel("🟡 SAFETY CAR");
        else if (isVSCLap)      setSpeedLabel("🟡 VIRTUAL SC");
        else if (anyDNF)        setSpeedLabel("🚨 RETIREMENT");
        else                    setSpeedLabel(`▶ LAP ${lap}/${T.laps}`);

        if (lap > lastEvLap) {
          lastEvLap = lap;
          const evs = [];
          if (lap===1) evs.push(`🚦 LIGHTS OUT — ${T.name.toUpperCase()} GRAND PRIX`);
          cars.forEach(car=>{
            const ld=car.laps[idx]; if(!ld) return;
            if (ld.dnf) { evs.push(`🚨 ${car.driverCode} — RETIREMENT L${lap}`); return; }
            if (ld.isPit) {
              let cumL = 0, nextComp = "?";
              for (const st of car.stints) {
                cumL += st.laps;
                if (cumL > lap) { nextComp = relName(st.compound, trackKey); break; }
              }
              evs.push(`🔴 ${car.driverCode} — BOX BOX BOX [L${lap}] → ${nextComp}`);
            }
            if (ld.isSC && !car.laps[idx-1]?.isSC) evs.push(`🟡 SAFETY CAR DEPLOYED — L${lap} — Field bunching`);
            if (ld.isVSC && !car.laps[idx-1]?.isVSC) {
              // VSC pit window advisory
              const userLd = cars.find(c=>c.isUser)?.laps[idx];
              if (userLd && !userLd.isPit) {
                const vscPitSaving = T.pitLoss - (T.pitLoss * 0.38); // VSC reduces effective pit loss ~38%
                evs.push(`🟡 VIRTUAL SC — L${lap} — PIT WINDOW OPEN: saves ~${vscPitSaving.toFixed(1)}s vs green`);
              } else {
                evs.push(`🟡 VIRTUAL SAFETY CAR — L${lap}`);
              }
            }
            if (ld.hasCliff && car.isUser) evs.push(`⚠ TYRE CLIFF — ${car.driverCode} consider pitting L${lap}`);
            if (ld.inDirtyAir && car.isUser && !car.laps[idx-1]?.inDirtyAir) evs.push(`💨 DIRTY AIR — ${car.driverCode} stuck in traffic`);
            if (ld.heatDamage > 0.2 && car.isUser) evs.push(`🔥 HEAT DAMAGE — Tyres degrading faster than normal`);
          });
          if (battle) {
            const top2=[...cars].filter(c=>c.laps[idx]&&!c.laps[idx].dnf).sort((a,b)=>a.laps[idx].cumTime-b.laps[idx].cumTime).slice(0,2);
            if (top2.length===2) {
              const pairKey = [top2[0].driverCode, top2[1].driverCode].sort().join("v");
              // Only log battle when pair changes, not every lap
              if (pairKey !== lastBattlePair) {
                lastBattlePair = pairKey;
                evs.push(`⚔ ${top2[0].driverCode} vs ${top2[1].driverCode} — BATTLE FOR POSITION`);
              }
            }
          } else {
            lastBattlePair = "";
          }
          if (lap===T.laps) evs.push("🏁 CHEQUERED FLAG!");
          if (evs.length) { eventsRef.current=[...evs,...eventsRef.current].slice(0,18); setEvents([...eventsRef.current]); }
        }
      },
      onDone: ()=>{ setRunning(false); setFinishZoom(true); },
    };

    setAllCars(cars);
    setHasRun(true);
    setScrubLap(0);
    setEvents([]);
    eventsRef.current=[];
    setSubmitted(false);
    setFinishZoom(false);
    setSpeedLabel("🚦 RACE START");
    setUserPos(null);
    setSimData(sd);
    setRunning(true);
    setTab("race");
    setRaceSubTab("map");
  }

  async function submitScore() {
    if (!lbName.trim() || !raceResult || running) return;
    const raceTime = userCar?.laps[LAPS-1]?.cumTime ?? null;
    if (!raceTime) return; // race not fully complete
    const entry = {
      name: lbName.trim(), track: T.name, driver: selDriver,
      team: teamData.name, pos: raceResult.userFinishPos,
      time: raceTime, stops: normStints.length - 1,
      push: pushMode, ts: new Date().getTime(),
    };
    const lb = await loadLB();
    lb.push(entry);
    lb.sort((a,b) => a.pos - b.pos || (a.time||9999) - (b.time||9999));
    await saveLB(lb);
    setLeaderboard(lb);
    setSubmitted(true);
  }

  const uniqueKeys = new Set(normStints.map(s => s.compound));
  const invalidStrategy = weather==="dry" && normStints.length > 1 && uniqueKeys.size < 2;

  const BG   = "#141414";
  const CARD = { background:"#1c1c1c", border:"1px solid #2e2e2e", padding:14, marginBottom:2 };
  const LBL  = { fontSize:10, letterSpacing:".2em", textTransform:"uppercase", color:"#999" };
  const ACC  = "#FF8000";

  const tabStyle = (active) => ({
    padding:"8px 14px", background:"transparent",
    border:"none", borderBottom:`2px solid ${active?ACC:"transparent"}`,
    color:active?"#fff":"#777", cursor:"pointer",
    fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700,
    letterSpacing:".2em", textTransform:"uppercase", transition:"all .15s",
  });
  const subTabStyle = (active, col=ACC) => ({
    padding:"5px 12px", background:active?`${col}14`:"transparent",
    border:`1px solid ${active?col:"#141414"}`,
    color:active?col:"#999", cursor:"pointer",
    fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700,
    letterSpacing:".15em", textTransform:"uppercase", transition:"all .12s",
  });

  return (
    <div style={{ background:BG, minHeight:"100vh", color:"#ccc", fontFamily:"'Barlow Condensed',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:#141414}
        ::-webkit-scrollbar-thumb{background:#3a3a3a}
        @keyframes fadeInDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes finishPulse{0%,100%{box-shadow:0 0 20px rgba(255,215,0,.15)}50%{box-shadow:0 0 80px rgba(255,215,0,.55)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        select option{background:#1c1c1c;color:#ddd;}
        select optgroup{color:#999;font-style:normal;}
        .runbtn{
          width:100%;padding:14px;background:${ACC};border:none;color:#000;cursor:pointer;
          font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:900;
          letter-spacing:.25em;text-transform:uppercase;transition:all .2s;
          position:relative;overflow:hidden;
        }
        .runbtn:hover{transform:translateY(-1px);box-shadow:0 4px 24px ${ACC}44;}
        .runbtn:disabled{background:#222;color:#666;cursor:default;transform:none;box-shadow:none;}
        input[type=range]{-webkit-appearance:none;height:2px;background:#333;outline:none;width:100%;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;background:${ACC};border-radius:50%;cursor:pointer;box-shadow:0 0 6px ${ACC}55;}
        .card-hover{transition:border-color .15s;}
        .card-hover:hover{border-color:#222!important;}
        .evt{animation:slideIn .2s ease both;}
        @media(max-width:900px){
          .build-grid{grid-template-columns:1fr!important;}
          .race-grid{grid-template-columns:1fr!important;}
          .result-grid{grid-template-columns:1fr!important;}
          .debrief-grid{grid-template-columns:1fr!important;}
          .race-map-h{height:280px!important;}
          .tab-bar{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
          .tab-bar::-webkit-scrollbar{display:none;}
          .sub-tabs{overflow-x:auto;scrollbar-width:none;padding-bottom:2px;}
          .sub-tabs::-webkit-scrollbar{display:none;}
          .header-right{display:none!important;}
          .build-right-col{margin-top:0!important;}
        }
        @media(max-width:600px){
          .outer-pad{padding:8px!important;}
          .race-map-h{height:220px!important;}
          .standings-inner{overflow-x:auto;}
        }
      `}</style>

      {/* HEADER */}
      <div style={{
        borderBottom:"1px solid #2a2a2a", padding:"10px 20px 10px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"linear-gradient(180deg, #1e1e1e 0%, #141414 100%)",
      }}>
        <div>
          <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
            <span style={{ fontSize:24, fontWeight:900, letterSpacing:".06em", color:"#fff", lineHeight:1 }}>F1 STRATEGY LAB</span>
            <span style={{ fontSize:13, fontWeight:900, color:ACC, letterSpacing:".1em" }}>2025</span>
          </div>
          <div style={{ fontSize:10, color:"#888", letterSpacing:".25em", textTransform:"uppercase", marginTop:2 }}>
            THERMAL TYRES · SC BUNCHING · REACTIVE RIVALS · DNF MODEL · LAP 1 CHAOS · REAL OVERTAKE PHYSICS
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {running && <div style={{ fontSize:10, fontWeight:700, color:ACC, letterSpacing:".12em", animation:"pulse 1.2s infinite" }}>● LIVE</div>}
          <div style={{ fontSize:10, fontWeight:700, color:running?ACC:"#1a1a1a", letterSpacing:".08em" }}>{speedLabel}</div>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ borderBottom:"1px solid #2a2a2a", paddingLeft:20, display:"flex", gap:0, background:"#1a1a1a" }} className="tab-bar">
        {[["build","BUILD"],["race","BROADCAST"],["result","RESULTS"],["debrief","DEBRIEF"],["lb","LEADERBOARD"]].map(([v,l])=>(
          <button key={v} style={tabStyle(tab===v)} onClick={()=>setTab(v)}>{l}</button>
        ))}
        <div style={{ flex:1 }}/>
        <div style={{ display:"flex", alignItems:"center", paddingRight:20, gap:8 }} className="header-right">
          <div style={{ width:8, height:8, borderRadius:"50%", background:teamData.col, flexShrink:0 }}/>
          <span style={{ fontSize:12, color:"#999", letterSpacing:".1em" }}>{driverData.id}</span>
          <span style={{ fontSize:12, color:"#666" }}>·</span>
          <span style={{ fontSize:12, color:"#999", letterSpacing:".1em" }}>{T.name.toUpperCase()}</span>
        </div>
      </div>

      <div style={{ padding:"14px 20px", maxWidth:1200, margin:"0 auto" }} className="outer-pad">

        {/* BUILD TAB */}
        {tab === "build" && (
          <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:16 }} className="build-grid">
            <div>
              {/* Driver */}
              <div style={{...CARD}} className="card-hover">
                <div style={{...LBL,marginBottom:8}}>DRIVER — 2025 LINEUP</div>
                <select value={selDriver} onChange={e=>setSelDriver(e.target.value)} style={{
                  width:"100%",padding:"9px 10px",background:"#1e1e1e",border:"1px solid #2e2e2e",
                  color:"#e0e0e0",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",
                  fontSize:13,fontWeight:700,outline:"none",appearance:"none",
                }}>
                  {Object.entries(TEAMS).map(([tid,team])=>(
                    <optgroup key={tid} label={`${team.name} (${team.pts2026}pts)`}>
                      {DRIVERS.filter(d=>d.team===tid).map(d=>(
                        <option key={d.id} value={d.id}>#{d.num} {d.name}{d.champion2025?" 🏆":""}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:`${teamData.col}0c`, border:`1px solid ${teamData.col}18` }}>
                  <div style={{ width:3, alignSelf:"stretch", background:teamData.col, borderRadius:1, flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:16, fontWeight:900, color:teamData.col, lineHeight:1.1 }}>{driverData.name}</div>
                    <div style={{ fontSize:11, color:"#999", marginTop:2 }}>{teamData.name} · #{driverData.num} · {teamData.engine}</div>
                    <div style={{ marginTop:5, display:"flex", gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:10, color:"#888", letterSpacing:".12em" }}>TYRE MGMT</div>
                        <div style={{ height:3, background:"#333", borderRadius:1, marginTop:2, overflow:"hidden" }}>
                          <div style={{ width:`${Math.max(5,Math.min(100,(2-driverData.tyreMgmt)*100))}%`, height:"100%", background:driverData.tyreMgmt<1?"#39B54A":"#e10600" }}/>
                        </div>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:10, color:"#888", letterSpacing:".12em" }}>RACE PACE</div>
                        <div style={{ height:3, background:"#333", borderRadius:1, marginTop:2, overflow:"hidden" }}>
                          <div style={{ width:`${Math.max(5,Math.min(100,100-(teamData.racePace/3)*100))}%`, height:"100%", background:ACC }}/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div style={{...CARD}} className="card-hover">
                <div style={{...LBL,marginBottom:8}}>CONDITIONS</div>
                <div style={{ display:"flex", gap:4, marginBottom:10 }}>
                  {[["dry","☀ DRY"],["inter","🌦 INTER"],["wet","🌧 WET"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setWeather(v)} style={{
                      flex:1, padding:"8px 4px",
                      background:weather===v?`${ACC}14`:"#0d0d0d",
                      border:`1px solid ${weather===v?ACC:"#161616"}`,
                      color:weather===v?"#ddd":"#2a2a2a",
                      cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontSize:10,fontWeight:700,transition:"all .12s",
                    }}>{l}</button>
                  ))}
                </div>

                {/* Mid-race weather change */}
                <div style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                    <div style={{...LBL}}>MID-RACE WEATHER CHANGE</div>
                    <button onClick={()=>setWeatherChangeLap(v => v > 0 ? 0 : 5)} style={{
                      padding:"2px 8px", background:weatherChangeLap>0?"#4fc3f711":"transparent",
                      border:`1px solid ${weatherChangeLap>0?"#4fc3f7":"#1e1e1e"}`,
                      color:weatherChangeLap>0?"#4fc3f7":"#333", cursor:"pointer",
                      fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700,
                    }}>{weatherChangeLap>0 ? "ON" : "OFF"}</button>
                  </div>
                  {weatherChangeLap > 0 && (
                    <>
                      <input type="range" min={5} max={LAPS-5} value={weatherChangeLap} onChange={e=>setWeatherChangeLap(+e.target.value)}/>
                      <div style={{ fontSize:12, color:"#4fc3f7", marginTop:4 }}>
                        🌦 Rain from lap {weatherChangeLap} — wrong tyres = +15s/lap
                      </div>
                    </>
                  )}
                  {weatherChangeLap === 0 && (
                    <div style={{ fontSize:11, color:"#666" }}>No mid-race weather change</div>
                  )}
                </div>

                {/* Push / Save */}
                <div style={{ marginBottom:10 }}>
                  <div style={{...LBL,marginBottom:6}}>DRIVING MODE</div>
                  <div style={{ display:"flex", gap:4 }}>
                    {[[true,"⚡ PUSH"],[false,"🌿 SAVE"]].map(([v,l])=>(
                      <button key={String(v)} onClick={()=>setPushMode(v)} style={{
                        flex:1, padding:"7px 4px", textAlign:"center",
                        background:pushMode===v?(v?"#e1060011":"#39B54A11"):"#0d0d0d",
                        border:`1px solid ${pushMode===v?(v?"#e10600":"#39B54A"):"#161616"}`,
                        color:pushMode===v?(v?"#e10600":"#39B54A"):"#2a2a2a",
                        cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontSize:10,fontWeight:700,transition:"all .12s",
                      }}>{l}</button>
                    ))}
                  </div>
                  <div style={{ fontSize:11, color:"#777", marginTop:4 }}>
                    {pushMode ? "Push: faster but +30% wear, more heat damage" : "Save: −45% wear, tyres last longer, less heat"}
                  </div>
                </div>

                <div style={{...LBL,marginBottom:6}}>SAFETY CAR — LAP {scLap>0?scLap:"NONE"}</div>
                <input type="range" min={0} max={LAPS-5} value={scLap} onChange={e=>setScLap(+e.target.value)}/>
                <div style={{ fontSize:12, color:scLap>0?"#FFD700":"#1e1e1e", marginTop:4, marginBottom:10 }}>
                  {scLap>0?`SC Lap ${scLap} — bunches field, rivals may pit`:"No safety car"}
                </div>

                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                  <div style={{...LBL}}>RACE SEED — {raceSeed}</div>
                  <button onClick={()=>setRaceSeed_(s => (s % 20) + 1)} style={{
                    padding:"3px 10px", background:"transparent", border:"1px solid #2e2e2e",
                    color:"#999", cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
                    fontSize:10, fontWeight:700, letterSpacing:".1em",
                  }}>REROLL</button>
                </div>
                <input type="range" min={1} max={20} value={raceSeed} onChange={e=>setRaceSeed_(+e.target.value)}/>
                <div style={{ fontSize:11, color:"#777", marginTop:4 }}>
                  Different seed = different DNFs, overtakes &amp; battles
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div>
              <div style={{ display:"flex", gap:4, marginBottom:12 }}>
                {[["strategy","STRATEGY"],["circuit","CIRCUIT"],["grid","GRID"]].map(([v,l])=>(
                  <button key={v} style={subTabStyle(buildSubTab===v)} onClick={()=>setBuildSubTab(v)}>{l}</button>
                ))}
              </div>

              {buildSubTab==="strategy" && (
                <>
                  <div style={{...CARD,marginBottom:8}} className="card-hover">
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div style={{...LBL}}>MY STRATEGY — {LAPS} LAPS</div>
                      {invalidStrategy && <div style={{ fontSize:11, color:"#e10600", fontWeight:700 }}>⚠ USE 2 COMPOUNDS</div>}
                    </div>
                    <StintEditor stints={normStints} trackKey={trackKey} onUpdate={setMyStints} total={LAPS}/>
                    <div style={{ marginTop:10, padding:"8px 10px", background:"#1a1a1a", border:"1px solid #2a2a2a" }}>
                      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                        {normStints.map((s,i)=>{ const C=COMPOUNDS[s.compound]||COMPOUNDS.C3; return (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <div style={{ width:8,height:8,borderRadius:"50%",background:C.col }}/>
                            <span style={{ fontSize:10,color:"#bbb" }}>{s.compound} · {s.laps}L</span>
                          </div>
                        );})}
                        <span style={{ fontSize:12,color:"#999",marginLeft:"auto" }}>
                          {normStints.length-1} stop{normStints.length>2?"s":""} · ~{((normStints.length-1)*T.pitLoss).toFixed(0)}s pit time
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{...CARD}} className="card-hover">
                    <div style={{...LBL,marginBottom:8}}>STRATEGY vs RIVAL (RBR)</div>
                    <StrategyComparison stints={normStints} trackKey={trackKey} total={LAPS} altStints={rivalStints} altLabel="RED BULL"/>
                  </div>
                </>
              )}

              {buildSubTab==="circuit" && (
                <div style={{...CARD}} className="card-hover">
                  <div style={{...LBL,marginBottom:10}}>CIRCUIT SELECT — {Object.keys(TRACKS).length} VENUES</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:3 }}>
                    {Object.entries(TRACKS).map(([k,t])=>(
                      <button key={k} onClick={()=>setTrackKey(k)} style={{
                        padding:"8px 4px",fontSize:12,fontWeight:700,cursor:"pointer",
                        background:trackKey===k?`${ACC}14`:"#0a0a0a",
                        border:`1px solid ${trackKey===k?ACC:"#141414"}`,
                        color:trackKey===k?"#ddd":"#333",
                        fontFamily:"'Barlow Condensed',sans-serif",transition:"all .12s",
                        textAlign:"center",lineHeight:1.4,
                      }}>
                        <div style={{ fontSize:9 }}>{t.name}</div>
                        <div style={{ fontSize:10,color:trackKey===k?"#555":"#222" }}>{t.city}</div>
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop:10, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                    {[
                      ["LAP",fmtLap(T.baseLap)],
                      ["LAPS",LAPS],
                      ["FUEL",`${T.fuel}kg`],
                      ["PIT LOSS",`${T.pitLoss}s`],
                      ["DRS ZONES",T.drsZones],
                      ["OVERTAKE",T.overtakingFactor>0.6?"HIGH":T.overtakingFactor>0.3?"MED":"LOW"],
                      ["COMPOUNDS",T.compound.join("/")],
                      ["EVOLUTION",`${(T.evolution*100).toFixed(1)}s`],
                    ].map(([k,v])=>(
                      <div key={k} style={{ background:"#1a1a1a",border:"1px solid #2a2a2a",padding:"6px 8px" }}>
                        <div style={{ fontSize:10,color:"#888",letterSpacing:".15em" }}>{k}</div>
                        <div style={{ fontSize:12,fontWeight:900,color:"#bbb",marginTop:2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {buildSubTab==="grid" && (
                <div style={{...CARD}} className="card-hover">
                  <div style={{...LBL,marginBottom:8}}>QUALIFYING GRID — {T.name}</div>
                  <div style={{ maxHeight:360, overflowY:"auto" }}>
                    {gridOrder.map((g,i)=>{
                      const isUser=g.driver.id===selDriver;
                      return (
                        <div key={g.driver.id} style={{
                          display:"flex",alignItems:"center",gap:8,padding:"5px 8px",marginBottom:2,
                          background:isUser?`${teamData.col}0c`:"transparent",
                          border:`1px solid ${isUser?teamData.col+"22":"transparent"}`,
                        }}>
                          <div style={{ fontSize:11,fontWeight:900,color:i===0?"#FFD700":i<=2?"#999":i<=9?"#444":"#222",minWidth:22 }}>P{i+1}</div>
                          <div style={{ width:3,height:16,borderRadius:1,background:g.team.col,flexShrink:0 }}/>
                          <div style={{ flex:1,fontSize:11,fontWeight:700,color:isUser?"#fff":"#555" }}>{g.driver.name}</div>
                          <div style={{ fontSize:11,color:"#888" }}>{g.team.short}</div>
                          <div style={{ fontSize:12,color:"#999",minWidth:60,textAlign:"right" }}>
                            {i===0?"POLE":`+${(g.qualiTime-gridOrder[0].qualiTime).toFixed(3)}s`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button className="runbtn" onClick={runSim} disabled={invalidStrategy} style={{ marginTop:12 }}>
                {invalidStrategy ? "⚠ INVALID STRATEGY — FIX COMPOUNDS" : `▶ SIMULATE — ${T.name.toUpperCase()} GP`}
              </button>
            </div>
          </div>
        )}

        {/* RACE BROADCAST TAB */}
        {tab === "race" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:16 }} className="race-grid">
            <div>
              <div style={{ display:"flex", gap:4, marginBottom:10 }} className="sub-tabs">
                {[["map","TRACK MAP"],["laps","LAP TIMES"],["gaps","GAP CHART"]].map(([v,l])=>(
                  <button key={v} style={subTabStyle(raceSubTab===v)} onClick={()=>setRaceSubTab(v)}>{l}</button>
                ))}
              </div>

              {raceSubTab==="map" && (
                <RaceMap trackKey={trackKey} simData={simData} showLabels={showLabels} finishZoom={finishZoom} scrubLap={scrubLap}/>
              )}
              {raceSubTab==="laps" && allCars.length > 0 && (
                <div style={{ background:"#141414",border:"1px solid #2e2e2e",borderRadius:4,padding:12 }}>
                  <div style={{...LBL,marginBottom:8}}>LAP TIME TRACE — Compound segments · Pit markers</div>
                  <LapChart cars={allCars.slice(0,6)} scrubLap={scrubLap}/>
                  <div style={{ marginTop:8, display:"flex", gap:10, flexWrap:"wrap" }}>
                    {allCars.slice(0,6).map(c=>(
                      <div key={c.id} style={{ display:"flex",alignItems:"center",gap:4 }}>
                        <div style={{ width:6,height:6,borderRadius:"50%",background:c.col }}/>
                        <span style={{ fontSize:11,color:c.isUser?"#ccc":"#444" }}>{c.driverCode}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {raceSubTab==="gaps" && allCars.length > 0 && (
                <div style={{ background:"#141414",border:"1px solid #2e2e2e",borderRadius:4,padding:12 }}>
                  <div style={{...LBL,marginBottom:8}}>GAP TO YOU (SECONDS)</div>
                  <GapChart allCars={allCars} scrubLap={scrubLap}/>
                </div>
              )}

              {allCars.length > 0 && (
                <LiveStandings allCars={allCars} scrubLap={scrubLap} LAPS={LAPS} showLabels={showLabels} setShowLabels={setShowLabels} ACC={ACC}/>
              )}
            </div>

            {/* SIDEBAR */}
            <div>
              {curLap && (
                <div style={{...CARD,marginBottom:8}}>
                  <div style={{...LBL,marginBottom:8}}>TELEMETRY</div>
                  <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:30,fontWeight:900,color:ACC,lineHeight:1 }}>
                        {curLap.isPit?"PIT":fmtLap(curLap.lapTime>200?curLap.lapTime-T.pitLoss:curLap.lapTime)}
                      </div>
                      <div style={{ fontSize:11,color:"#888",marginTop:1 }}>LAST LAP</div>
                    </div>
                    <TyreGauge temp={curLap.tyreTemp||95} compound={curLap.compound}/>
                  </div>
                  <div style={{ marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:4 }}>
                    {[
                      ["POS",     userPos?`P${userPos}`:"—",                    "#FFD700"],
                      ["COMPOUND",curLap.compound,                               (COMPOUNDS[curLap.compound]||COMPOUNDS.C3).col],
                      ["WEAR",    `${(curLap.wearFraction*100).toFixed(0)}%`,    curLap.hasCliff?"#e10600":curLap.wearFraction>0.6?"#FFD700":"#39B54A"],
                      ["FUEL",    `${curLap.fuelLoad.toFixed(1)}kg`,             "#888"],
                      ["DEG",     `+${curLap.degradation.toFixed(2)}s`,          curLap.degradation>1.5?"#e10600":"#555"],
                      ["HEAT DMG",curLap.heatDamage>0.1?`${(curLap.heatDamage*100).toFixed(0)}%`:"NONE", curLap.heatDamage>0.2?"#e10600":"#39B54A"],
                    ].map(([k,v,c])=>(
                      <div key={k} style={{ background:"#222222",padding:"5px 7px",border:"1px solid #2a2a2a" }}>
                        <div style={{ fontSize:6,color:"#888",letterSpacing:".2em",textTransform:"uppercase" }}>{k}</div>
                        <div style={{ fontSize:13,fontWeight:900,color:c,marginTop:2,lineHeight:1 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {curLap.inDirtyAir && (
                    <div style={{ marginTop:6,padding:"4px 8px",background:"#ffffff04",border:"1px solid #ffffff0a",fontSize:12,color:"#888" }}>
                      💨 DIRTY AIR — aero turbulence affecting balance
                    </div>
                  )}
                </div>
              )}

              {allCars.length > 0 && (
                <div style={{...CARD,marginBottom:8,padding:0,overflow:"hidden"}}>
                  <button onClick={()=>setUndercutOpen(o=>!o)} style={{
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    width:"100%",padding:"10px 14px",background:"transparent",border:"none",
                    color:"#bbb",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",
                    fontSize:10,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",
                  }}>
                    ⚡ UNDERCUT CALCULATOR
                    <span style={{color:"#888",fontSize:10}}>{undercutOpen?"▲":"▼"}</span>
                  </button>
                  {undercutOpen && (
                    <div style={{padding:"0 14px 14px"}}>
                      <UndercutPanel allCars={allCars} scrubLap={scrubLap} trackKey={trackKey} selDriver={selDriver}/>
                    </div>
                  )}
                </div>
              )}

              {/* VSC PIT WINDOW ADVISOR */}
              {allCars.length > 0 && (() => {
                const idx = Math.max(0, scrubLap - 1);
                const userLd = allCars.find(c=>c.isUser)?.laps[idx];
                const isVSCActive = userLd?.isVSC;
                const isSCActive = userLd?.isSC;
                if (!isVSCActive && !isSCActive) return null;
                const T2 = TRACKS[trackKey];
                // Under VSC, pit loss is ~38% lower due to reduced delta time
                // Under SC, pit loss is ~55% lower (field already bunched)
                const reductionPct = isSCActive ? 0.55 : 0.38;
                const effectivePitLoss = T2.pitLoss * (1 - reductionPct);
                const normalPitLoss = T2.pitLoss;
                const saving = normalPitLoss - effectivePitLoss;
                const wearPct = userLd ? Math.round(userLd.wearFraction * 100) : 0;
                const lapsLeft = LAPS - scrubLap;
                const worthIt = wearPct > 25 && lapsLeft > 8;
                const col = isSCActive ? "#FFD700" : "#4fc3f7";
                return (
                  <div style={{ ...CARD, marginBottom:8, borderColor:`${col}33`, background:`${col}05` }}>
                    <div style={{ fontSize:10, letterSpacing:".2em", color:col, textTransform:"uppercase", marginBottom:8, fontWeight:700 }}>
                      {isSCActive ? "🟡 SAFETY CAR" : "🟡 VIRTUAL SC"} — PIT WINDOW
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:8 }}>
                      {[
                        ["NORMAL PIT LOSS", `${normalPitLoss.toFixed(1)}s`, "#555"],
                        ["NOW PIT LOSS",    `${effectivePitLoss.toFixed(1)}s`, col],
                        ["YOU SAVE",        `~${saving.toFixed(1)}s`, "#39B54A"],
                        ["TYRE WEAR",       `${wearPct}%`, wearPct > 50 ? "#e10600" : "#FFD700"],
                      ].map(([k,v,c])=>(
                        <div key={k} style={{ background:"#222222", padding:"5px 8px", border:"1px solid #2a2a2a" }}>
                          <div style={{ fontSize:8, color:"#888", letterSpacing:".15em" }}>{k}</div>
                          <div style={{ fontSize:13, fontWeight:900, color:c, marginTop:1 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding:"6px 8px", background: worthIt ? "#39B54A11" : "#e1060011", border:`1px solid ${worthIt ? "#39B54A22" : "#e1060022"}`, fontSize:11, fontWeight:900, color: worthIt ? "#39B54A" : "#e10600" }}>
                      {worthIt
                        ? `✓ PIT NOW — ${saving.toFixed(1)}s saved vs green lap stop`
                        : `✗ STAY OUT — ${lapsLeft <= 8 ? "too few laps remaining" : "tyres still fresh"}`}
                    </div>
                  </div>
                );
              })()}

              {(() => {
                return (
                  <div style={{...CARD,padding:0,overflow:"hidden"}}>
                    <button onClick={()=>setCommsOpen(o=>!o)} style={{
                      display:"flex",alignItems:"center",justifyContent:"space-between",
                      width:"100%",padding:"10px 14px",background:"transparent",border:"none",
                      color:"#999",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",
                      fontSize:10,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",
                    }}>
                      RACE COMMS
                      <span style={{color:"#888",fontSize:10}}>{commsOpen?"▲":"▼"}</span>
                    </button>
                    {commsOpen && (
                      <div style={{padding:"0 14px 14px"}}>
                        {events.length===0&&<div style={{ fontSize:12,color:"#666",fontStyle:"italic" }}>Waiting for race start…</div>}
                        {events.map((e,i)=>(
                          <div key={i} className="evt" style={{
                            fontSize:12,color:i===0?"#e0e0e0":"#aaa",padding:"4px 0",
                            borderBottom:"1px solid #2a2a2a",lineHeight:1.5,
                            animationDelay:`${i*0.03}s`,
                          }}>{e}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* RESULTS TAB */}
        {tab === "result" && !raceResult && (
          <div style={{ padding:"60px 0", textAlign:"center", color:"#777", fontSize:13, fontStyle:"italic" }}>
            No race data yet — go to BUILD and simulate a race first.
          </div>
        )}
        {tab === "result" && raceResult && (
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }} className="result-grid">
            <div>
              {/* ── Winner hero ─────────────────────────────────────── */}
              {(() => {
                const w = raceResult.winner;
                if (!w || w.dnf) return null;
                const parts = w.name.split(" ");
                const surname  = parts[parts.length - 1].toUpperCase();
                const forename = parts.slice(0, -1).join(" ");
                return (
                  <div style={{
                    marginBottom: 8,
                    background: `linear-gradient(135deg, ${w.col}14 0%, #080808 60%)`,
                    border: `1px solid ${w.col}44`,
                    borderLeft: `4px solid ${w.col}`,
                    padding: "14px 18px",
                    display: "flex", alignItems: "center", gap: 16,
                  }}>
                    {/* P1 box */}
                    <div style={{
                      width: 52, height: 52, background: w.col, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:900, color:"#000", lineHeight:1 }}>P1</span>
                    </div>

                    {/* Name block */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize:9, letterSpacing:".3em", color:"#FFD700", textTransform:"uppercase",
                        fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, marginBottom:1 }}>
                        🏁 Race Winner
                      </div>
                      <div style={{ fontSize:9, letterSpacing:".15em", color: w.col+"99",
                        textTransform:"uppercase", fontFamily:"'Barlow Condensed',sans-serif", marginBottom:1 }}>
                        {forename}
                      </div>
                      <div style={{ fontSize:32, fontWeight:900, color: w.col,
                        fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:".04em", lineHeight:.95 }}>
                        {surname}
                      </div>
                      <div style={{ fontSize:10, color: w.col+"88", marginTop:3,
                        letterSpacing:".1em", textTransform:"uppercase" }}>
                        {w.teamName}
                      </div>
                    </div>

                    {/* Race time */}
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:8, letterSpacing:".2em", color:"#999", textTransform:"uppercase", marginBottom:2 }}>Time</div>
                      <div style={{ fontSize:14, fontWeight:900, color: w.col+"cc",
                        fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:".04em" }}>
                        {fmtRaceTime(w.time)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{...CARD}}>
                <div style={{...LBL,marginBottom:10}}>RACE RESULT — {T.name.toUpperCase()} GP</div>
                <div style={{ maxHeight:500,overflowY:"auto" }}>
                  {raceResult.finalTimes.map((c,i)=>{
                    const isUser=c.id===selDriver;
                    const gap=c.time-raceResult.finalTimes.find(x=>!x.dnf)?.time;
                    const isWinner = i===0 && !c.dnf;
                    const isPodium = i<=2 && !c.dnf;
                    return (
                      <div key={c.id} style={{
                        display:"flex",alignItems:"center",gap:8,padding:"7px 8px",marginBottom:2,
                        background: isWinner ? `${c.col}10` : isUser?"#ffffff07":"transparent",
                        border:`1px solid ${isWinner ? c.col+"33" : isUser?"#ffffff11":"transparent"}`,
                        borderLeft: isWinner ? `3px solid ${c.col}` : isPodium ? `2px solid ${c.col}55` : `2px solid transparent`,
                        opacity: c.dnf ? 0.35 : 1,
                      }}>
                        <div style={{
                          fontSize: isWinner?15:13, fontWeight:900, minWidth:30,
                          color: c.dnf?"#e10600" : isWinner?"#FFD700" : i===1?"#aaa" : i===2?"#cd7f32" : i<=9?"#444":"#1e1e1e",
                        }}>
                          {c.dnf?"DNF":`P${i+1}`}
                        </div>
                        <div style={{ width:3, height:isWinner?24:18, borderRadius:1, background:c.col, flexShrink:0 }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{
                            fontSize: isWinner?13:12, fontWeight: isWinner?800:700,
                            color: isUser?"#fff" : isWinner?"#ddd" : "#555",
                            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                          }}>{c.name}</div>
                          <div style={{ fontSize:10, color: isWinner ? c.col+"99" : "#222" }}>{c.teamName}</div>
                        </div>
                        <div style={{ fontSize:10, color: isWinner?"#FFD700":"#333", textAlign:"right", flexShrink:0 }}>
                          {c.dnf ? "DNF" : isWinner ? fmtRaceTime(c.time) : `+${gap.toFixed(3)}s`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <div style={{ ...CARD,borderColor:teamData.col+"33",background:`${teamData.col}07`,marginBottom:8 }}>
                <div style={{...LBL,marginBottom:10}}>YOUR PERFORMANCE</div>
                <div style={{ display:"flex",alignItems:"baseline",gap:12,marginBottom:6 }}>
                  <div style={{ fontSize:60,fontWeight:900,color:teamData.col,lineHeight:1 }}>P{raceResult.userFinishPos}</div>
                  <div>
                    <div style={{ fontSize:14,fontWeight:700,color:teamData.col+"cc" }}>
                      {raceResult.userFinishPos===1?"RACE WINNER 🏆":raceResult.userFinishPos<=3?"PODIUM FINISH":raceResult.userFinishPos<=10?"POINTS FINISH ✅":"Outside Points"}
                    </div>
                    <div style={{ fontSize:12,color:"#999",marginTop:4 }}>{driverData.name} · {teamData.name}</div>
                  </div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10 }}>
                  {[
                    ["RACE TIME",  fmtRaceTime(userCar?.laps[LAPS-1]?.cumTime||0)],
                    ["GAP TO WIN", raceResult.userFinishPos===1?"WINNER":`+${((userCar?.laps[LAPS-1]?.cumTime||0)-(raceResult.finalTimes.find(x=>!x.dnf)?.time||0)).toFixed(3)}s`],
                    ["PIT STOPS",  normStints.length-1],
                    ["DRIVE MODE", pushMode?"PUSH":"SAVE"],
                  ].map(([k,v])=>(
                    <div key={k} style={{ background:`${teamData.col}0a`,padding:"6px 8px",border:`1px solid ${teamData.col}18` }}>
                      <div style={{ fontSize:10,color:"#999",letterSpacing:".15em" }}>{k}</div>
                      <div style={{ fontSize:14,fontWeight:900,color:teamData.col+"cc",marginTop:2 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{...LBL,marginBottom:6}}>STRATEGY USED</div>
                <div style={{ display:"flex",height:6,borderRadius:2,overflow:"hidden",gap:1,marginBottom:6 }}>
                  {normStints.map((s,i)=>{ const C=COMPOUNDS[s.compound]||COMPOUNDS.C3; return <div key={i} style={{ flex:s.laps,background:C.col,opacity:.9 }}/>; })}
                </div>
                {normStints.map((s,i)=>{ const C=COMPOUNDS[s.compound]||COMPOUNDS.C3; return (
                  <div key={i} style={{ display:"flex",gap:8,alignItems:"center",marginBottom:3 }}>
                    <div style={{ width:8,height:8,borderRadius:"50%",background:C.col }}/>
                    <span style={{ fontSize:10,color:"#bbb" }}>{s.compound} {relName(s.compound, trackKey)} — {s.laps} laps</span>
                  </div>
                );})}
              </div>

              <div style={CARD}>
                <ChampionshipPanel raceResult={raceResult} selDriver={selDriver}/>
              </div>

              <div style={CARD}>
                <div style={{...LBL,marginBottom:8}}>SUBMIT TO LEADERBOARD</div>
                {submitted?(
                  <div style={{ fontSize:12,color:"#39B54A",fontWeight:700 }}>✓ Score submitted!</div>
                ):(
                  <div style={{ display:"flex",gap:6 }}>
                    <input value={lbName} onChange={e=>setLbName(e.target.value)} placeholder="Your name…"
                      style={{ flex:1,padding:"8px 10px",background:"#1e1e1e",border:"1px solid #2e2e2e",color:"#ccc",fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,outline:"none" }}
                      onKeyDown={e=>e.key==="Enter"&&submitScore()}
                    />
                    <button onClick={submitScore} disabled={running || !raceResult} style={{
                      padding:"8px 14px", background: (running||!raceResult) ? "#111" : ACC,
                      border:"none", color: (running||!raceResult) ? "#2a2a2a" : "#000",
                      cursor: (running||!raceResult) ? "default" : "pointer",
                      fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:900,
                      transition:"all .15s",
                    }}>SUBMIT</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DEBRIEF TAB */}
        {tab === "debrief" && (
          <DebriefTab
            allCars={allCars}
            raceResult={raceResult}
            selDriver={selDriver}
            trackKey={trackKey}
            normStints={normStints}
            LAPS={LAPS}
            pushMode={pushMode}
          />
        )}

        {/* LEADERBOARD TAB */}
        {tab === "lb" && (
          <div style={{ maxWidth:800 }}>
            <div style={CARD}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                <div style={{...LBL}}>ALL-TIME LEADERBOARD</div>
                <div style={{ fontSize:12,color:"#888" }}>{leaderboard.length} entries</div>
              </div>
              {leaderboard.length===0?(
                <div style={{ fontSize:12,color:"#777",fontStyle:"italic",padding:"20px 0",textAlign:"center" }}>No entries yet. Run a race and submit your time!</div>
              ):leaderboard.map((e,i)=>(
                <div key={`${e.name}-${e.ts}`} style={{ display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:"1px solid #2a2a2a" }}>
                  <div style={{ fontSize:22,fontWeight:900,color:i===0?"#FFD700":i<=2?"#888":"#222",minWidth:34,textAlign:"center" }}>#{i+1}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14,fontWeight:700,color:"#bbb" }}>{e.name}</div>
                    <div style={{ fontSize:11,color:"#888",marginTop:2 }}>{e.driver} · {e.team} · {e.track} · {e.push?"PUSH":"SAVE"}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:16,fontWeight:900,color:e.pos===1?"#FFD700":e.pos<=3?"#888":"#444" }}>P{e.pos}</div>
                    <div style={{ fontSize:11,color:"#888",marginTop:1 }}>{e.time ? fmtRaceTime(e.time) : "—"}</div>
                    <div style={{ fontSize:10,color:"#777" }}>{e.stops} stop{e.stops!==1?"s":""}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}