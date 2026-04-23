"""
F1 2025 Real Data Extractor — for F1 Strategy Lab Simulator
============================================================
SETUP (one time):
    pip install fastf1 pandas numpy

RUN:
    python extract_f1_data.py

This will create a file called `f1_real_data.json` in the same folder.
Paste the contents of that file back into the chat.

It pulls data from the 2025 season races that have already happened.
First run may take 5-10 minutes as FastF1 downloads and caches data.
Subsequent runs are instant (uses local cache).
"""

import fastf1
import fastf1.plotting
import pandas as pd
import numpy as np
import json
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import warnings
warnings.filterwarnings("ignore")

# Enable caching so repeat runs are instant
cache_dir = os.path.join(os.path.dirname(__file__), "f1_cache")
os.makedirs(cache_dir, exist_ok=True)
fastf1.Cache.enable_cache(cache_dir)

print("=" * 60)
print("F1 2025 Real Data Extractor")
print("=" * 60)

# ── Which 2025 races to analyse ──────────────────────────────
# We'll pull all completed 2025 rounds and average across them
# for robust estimates. Update this list as the season progresses.
RACES_2025 = [
    (2025, "Australian Grand Prix"),
    (2025, "Chinese Grand Prix"),
    (2025, "Japanese Grand Prix"),
    (2025, "Bahrain Grand Prix"),
    (2025, "Saudi Arabian Grand Prix"),
    (2025, "Miami Grand Prix"),
    (2025, "Emilia Romagna Grand Prix"),
    (2025, "Monaco Grand Prix"),
    (2025, "Spanish Grand Prix"),
    (2025, "Canadian Grand Prix"),
    (2025, "Austrian Grand Prix"),
    (2025, "British Grand Prix"),
    (2025, "Belgian Grand Prix"),
    (2025, "Hungarian Grand Prix"),
    (2025, "Dutch Grand Prix"),
    (2025, "Italian Grand Prix"),
    (2025, "Azerbaijan Grand Prix"),
    (2025, "Singapore Grand Prix"),
    (2025, "United States Grand Prix"),
    (2025, "Mexican City Grand Prix"),
    (2025, "São Paulo Grand Prix"),
    (2025, "Las Vegas Grand Prix"),
    (2025, "Qatar Grand Prix"),
    (2025, "Abu Dhabi Grand Prix"),
]

# Driver → Team mapping (2025 season)
DRIVER_TEAM_2025 = {
    "NOR": "MCL", "PIA": "MCL",
    "RUS": "MER", "ANT": "MER",
    "VER": "RBR", "TSU": "RBR",
    "LEC": "FER", "HAM": "FER",
    "SAI": "WIL", "ALB": "WIL",
    "HAD": "RBT", "LAW": "RBT",
    "ALO": "AST", "STR": "AST",
    "HUL": "HAA", "BEA": "HAA",
    "BOT": "SAU", "BOR": "SAU",
    "GAS": "ALP", "DOO": "ALP",
}

# ── Data collectors ───────────────────────────────────────────
team_race_pace    = {}   # team_id → list of median race lap times
team_quali_gap    = {}   # team_id → list of quali gaps vs pole
driver_quali_vs_tm= {}   # driver_id → list of quali delta vs teammate
driver_tyre_deg   = {}   # driver_id → tyre deg rates per stint
circuit_data      = {}   # circuit → {baseLap, pitLoss, laps, overtakes}
compound_deg      = {}   # compound → list of measured deg rates

def safe_load(year, gp_name):
    """Load a race session, return None if not available yet."""
    try:
        session = fastf1.get_session(year, gp_name, "R")
        session.load(laps=True, telemetry=False, weather=True, messages=False)
        print(f"  ✓ Loaded: {gp_name} {year}")
        return session
    except Exception as e:
        print(f"  ✗ Skipped: {gp_name} {year} — {str(e)[:60]}")
        return None

def safe_load_quali(year, gp_name):
    try:
        session = fastf1.get_session(year, gp_name, "Q")
        session.load(laps=True, telemetry=False, weather=False, messages=False)
        return session
    except:
        return None

# ── MAIN EXTRACTION LOOP ─────────────────────────────────────
loaded_races = []
for year, gp in RACES_2025:
    print(f"\nProcessing: {gp} {year}")
    race = safe_load(year, gp)
    if race is None:
        continue

    laps = race.laps.copy()
    # Remove safety car laps, pit in/out laps, lap 1 (standing start)
    clean = laps[
        (laps["LapNumber"] > 3) &
        (~laps["TrackStatus"].str.contains("4|5|6|7", na=True)) &  # SC/VSC
        (laps["PitOutTime"].isna()) &
        (laps["PitInTime"].isna()) &
        (laps["LapTime"].notna()) &
        (laps["LapTime"] < pd.Timedelta(seconds=200))
    ].copy()

    if clean.empty:
        print("    No clean laps found, skipping")
        continue

    # Convert lap times to seconds
    clean["LapTimeSec"] = clean["LapTime"].dt.total_seconds()
    clean["FuelCorrected"] = clean["LapTimeSec"] - (
        (race.total_laps - clean["LapNumber"]) * 0.034  # 0.034s/kg fuel correction
    )

    # ── Circuit baseline lap time ─────────────────────────────
    circuit_name = gp.replace(" Grand Prix","").replace(" City","").strip()
    if circuit_name not in circuit_data:
        circuit_data[circuit_name] = {
            "laps": race.total_laps,
            "baseLap_samples": [],
            "pitLoss_samples": [],
            "overtakes": 0,
        }

    # Median fuel-corrected lap = baseline
    median_lap = clean["FuelCorrected"].median()
    circuit_data[circuit_name]["baseLap_samples"].append(float(median_lap))

    # ── Pit stop time loss ────────────────────────────────────
    pit_laps = laps[laps["PitInTime"].notna() & laps["PitOutTime"].notna()].copy()
    if not pit_laps.empty:
        pit_laps["PitDuration"] = (
            pit_laps["PitOutTime"] - pit_laps["PitInTime"]
        ).dt.total_seconds()
        valid_pits = pit_laps[(pit_laps["PitDuration"] > 15) & (pit_laps["PitDuration"] < 60)]
        if not valid_pits.empty:
            # Pit loss = pit duration - typical lap time (what you'd have done without pitting)
            typical_lap = clean["LapTimeSec"].median()
            pit_loss = valid_pits["PitDuration"].median() + typical_lap * 0.0  # just pit service time
            # More accurate: pit loss = pit lap time - typical clean lap
            pit_lap_times = laps[laps["PitInTime"].notna()]["LapTime"].dropna()
            if not pit_lap_times.empty:
                pit_lap_sec = pit_lap_times.dt.total_seconds().median()
                pit_loss_real = pit_lap_sec - typical_lap
                if 10 < pit_loss_real < 50:
                    circuit_data[circuit_name]["pitLoss_samples"].append(float(pit_loss_real))

    # ── Team race pace ────────────────────────────────────────
    for driver, group in clean.groupby("Driver"):
        team = DRIVER_TEAM_2025.get(driver, None)
        if team is None:
            continue
        med = group["FuelCorrected"].median()
        if team not in team_race_pace:
            team_race_pace[team] = []
        team_race_pace[team].append(float(med))

    # ── Tyre degradation per stint ────────────────────────────
    for (driver, stint_num), stint_group in clean.groupby(["Driver", "Stint"]):
        if len(stint_group) < 5:
            continue
        sg = stint_group.sort_values("LapNumber").copy()
        compound = sg["Compound"].iloc[0] if "Compound" in sg.columns else "MEDIUM"
        times = sg["FuelCorrected"].values
        laps_in_stint = np.arange(len(times))
        if len(laps_in_stint) < 5:
            continue
        # Fit linear regression to find deg rate (s/lap)
        try:
            coeffs = np.polyfit(laps_in_stint, times, 1)
            deg_rate = coeffs[0]  # seconds per lap
            if 0.0 < deg_rate < 0.5:  # sanity check — real range 0.03-0.15
                comp_key = compound.upper()[:1] + compound[1:].lower()  # "SOFT" → "Soft"
                if compound not in compound_deg:
                    compound_deg[compound] = []
                compound_deg[compound].append(float(deg_rate))

                driver_id = driver
                if driver_id not in driver_tyre_deg:
                    driver_tyre_deg[driver_id] = []
                driver_tyre_deg[driver_id].append(float(deg_rate))
        except:
            pass

    loaded_races.append(gp)

# ── QUALIFYING DATA ───────────────────────────────────────────
print("\n" + "="*60)
print("Loading qualifying data...")
quali_gaps_per_race = {}  # race → {driver: gap_to_pole}

for year, gp in RACES_2025[:min(len(RACES_2025), len(loaded_races)+2)]:
    quali = safe_load_quali(year, gp)
    if quali is None:
        continue

    q_laps = quali.laps.copy()
    q_laps = q_laps[q_laps["LapTime"].notna()].copy()
    q_laps["LapTimeSec"] = q_laps["LapTime"].dt.total_seconds()

    # Best lap per driver
    best = q_laps.groupby("Driver")["LapTimeSec"].min()
    if best.empty:
        continue

    pole_time = best.min()
    gaps = (best - pole_time).to_dict()

    for driver, gap in gaps.items():
        team = DRIVER_TEAM_2025.get(driver)
        if team is None:
            continue
        if team not in team_quali_gap:
            team_quali_gap[team] = []
        team_quali_gap[team].append(float(gap))

    # Driver vs teammate
    for team_id in set(DRIVER_TEAM_2025.values()):
        team_drivers = [d for d, t in DRIVER_TEAM_2025.items() if t == team_id and d in gaps]
        if len(team_drivers) == 2:
            d1, d2 = team_drivers
            delta = gaps[d1] - gaps[d2]
            if d1 not in driver_quali_vs_tm:
                driver_quali_vs_tm[d1] = []
            if d2 not in driver_quali_vs_tm:
                driver_quali_vs_tm[d2] = []
            driver_quali_vs_tm[d1].append(float(delta))
            driver_quali_vs_tm[d2].append(float(-delta))

# ── ASSEMBLE OUTPUT ───────────────────────────────────────────
print("\n" + "="*60)
print("Assembling extracted data...")

# Normalise team race pace — MCL as baseline (0.0)
if team_race_pace:
    mcl_pace = np.mean(team_race_pace.get("MCL", [0]))
    team_pace_gaps = {}
    for team, paces in team_race_pace.items():
        team_pace_gaps[team] = round(float(np.mean(paces)) - mcl_pace, 4)
else:
    team_pace_gaps = {}

# Normalise team quali gaps — MCL as baseline
if team_quali_gap:
    mcl_quali = np.mean(team_quali_gap.get("MCL", [0]))
    team_quali_gaps_norm = {}
    for team, gaps in team_quali_gap.items():
        team_quali_gaps_norm[team] = round(float(np.mean(gaps)) - mcl_quali, 4)
else:
    team_quali_gaps_norm = {}

# Compound deg rates
compound_deg_final = {}
for compound, rates in compound_deg.items():
    compound_deg_final[compound] = {
        "mean": round(float(np.mean(rates)), 4),
        "median": round(float(np.median(rates)), 4),
        "p25": round(float(np.percentile(rates, 25)), 4),
        "p75": round(float(np.percentile(rates, 75)), 4),
        "n_stints": len(rates),
    }

# Driver tyre management rating (vs average)
avg_deg = float(np.mean([r for rates in driver_tyre_deg.values() for r in rates])) if driver_tyre_deg else 0.05
driver_tyre_mgmt = {}
for driver, rates in driver_tyre_deg.items():
    ratio = float(np.mean(rates)) / avg_deg if avg_deg > 0 else 1.0
    driver_tyre_mgmt[driver] = round(ratio, 4)  # <1.0 = better than avg, >1.0 = worse

# Circuit final data
circuits_final = {}
for circ, data in circuit_data.items():
    base_laps = data["baseLap_samples"]
    pit_losses = data["pitLoss_samples"]
    circuits_final[circ] = {
        "baseLap": round(float(np.mean(base_laps)), 3) if base_laps else None,
        "laps": data["laps"],
        "pitLoss": round(float(np.mean(pit_losses)), 2) if pit_losses else None,
        "n_races": len(base_laps),
    }

# Driver quali pace vs teammate
driver_quali_final = {}
for driver, deltas in driver_quali_vs_tm.items():
    driver_quali_final[driver] = round(float(np.mean(deltas)), 4)

# ── FINAL OUTPUT ──────────────────────────────────────────────
output = {
    "meta": {
        "season": 2025,
        "races_analysed": loaded_races,
        "n_races": len(loaded_races),
        "extraction_notes": "Fuel-corrected (0.034s/kg), SC laps removed, pit in/out laps removed",
    },
    "team_race_pace_gaps": team_pace_gaps,
    "team_quali_gaps": team_quali_gaps_norm,
    "driver_quali_vs_teammate": driver_quali_final,
    "driver_tyre_management": driver_tyre_mgmt,
    "compound_degradation": compound_deg_final,
    "circuits": circuits_final,
    "raw_sample_counts": {
        "team_race_pace_samples": {t: len(v) for t, v in team_race_pace.items()},
        "compound_deg_samples": {c: len(v) for c, v in compound_deg.items()},
    }
}

# Save JSON
out_path = os.path.join(os.path.dirname(__file__), "f1_real_data.json")
with open(out_path, "w") as f:
    json.dump(output, f, indent=2)

print(f"\n✅ Done! Saved to: {out_path}")
print(f"   Races analysed: {len(loaded_races)}")
print(f"   Teams with pace data: {len(team_pace_gaps)}")
print(f"   Compounds with deg data: {len(compound_deg_final)}")
print(f"   Circuits with data: {len(circuits_final)}")
print(f"\n{'='*60}")
print("PASTE THE CONTENTS OF f1_real_data.json BACK INTO THE CHAT")
print("="*60)

# Also print a quick preview
print("\nQUICK PREVIEW:")
print("\nTeam Race Pace Gaps (seconds/lap vs McLaren):")
for team, gap in sorted(team_pace_gaps.items(), key=lambda x: x[1]):
    bar = "█" * int(abs(gap) * 10)
    print(f"  {team:4s}  {gap:+.3f}s  {bar}")

print("\nCompound Degradation (seconds/lap):")
for compound, stats in sorted(compound_deg_final.items()):
    print(f"  {compound:10s}  {stats['median']:.4f}s/lap  (n={stats['n_stints']} stints)")