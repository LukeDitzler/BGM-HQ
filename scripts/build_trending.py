"""
BGM Internal Analysis — build_trending.py
==========================================
Data sources:
  - nfl_data_py  : weekly player stats (snap%, target share, air yards)
  - nflreadpy    : rosters (birth_date, depth chart), draft picks, contracts
  - FantasyCalc  : dynasty trade values

Run:
    pip install nfl_data_py nflreadpy pandas numpy requests
    python scripts/build_trending.py
"""

import json
import os
import warnings
from datetime import datetime, date

import numpy as np
import nfl_data_py as nfl
import pandas as pd
import requests

warnings.filterwarnings("ignore")

# Try importing nflreadpy — used for rosters, draft, contracts
try:
    import nflreadpy as nflr
    HAS_NFLR = True
except ImportError:
    HAS_NFLR = False
    print("  Note: nflreadpy not installed. Run: pip install nflreadpy")
    print("  Continuing without roster/draft/contract enrichment.")

SEASONS = [2023, 2024, 2025]

def sanitize(obj):
    """Recursively replace NaN/Inf with None so json.dump produces valid JSON."""
    if isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize(v) for v in obj]
    if isinstance(obj, float):
        if obj != obj or obj == float('inf') or obj == float('-inf'):  # NaN or Inf check
            return None
        return obj
    return obj
POSITIONS = ["QB", "WR", "RB", "TE"]

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(ROOT, "public")
os.makedirs(PUBLIC_DIR, exist_ok=True)
TRENDING_PATH = os.path.join(PUBLIC_DIR, "trending.json")
FC_HISTORY_PATH = os.path.join(PUBLIC_DIR, "fc_history.json")

print("=" * 60)
print(f"BGM Internal Analysis — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
print("=" * 60)


# ══════════════════════════════════════════════════════════════════════════════
# 1. WEEKLY STATS — nfl_data_py
# ══════════════════════════════════════════════════════════════════════════════

WANTED_COLS = [
    "season", "week", "season_type",
    "player_id", "player_name", "position", "recent_team",
    "targets", "receptions", "receiving_yards", "receiving_tds",
    "air_yards", "racr", "target_share", "air_yards_share", "wopr",
    "carries", "rushing_yards", "rushing_tds",
    "completions", "attempts", "passing_yards", "passing_tds", "interceptions",
    "dakota", "snap_share",
    "receiving_epa", "rushing_epa", "passing_epa",
]

def load_weekly_stats(seasons):
    print("\n[1/4] Loading weekly player stats (nfl_data_py)...")
    frames = []
    for yr in seasons:
        try:
            df = nfl.import_weekly_data([yr])
            keep = [c for c in WANTED_COLS if c in df.columns]
            frames.append(df[keep].copy())
            print(f"    ✓ {yr}: {len(df):,} rows")
        except Exception as e:
            print(f"    ✗ {yr}: skipped ({str(e)[:70]})")
    if not frames:
        raise RuntimeError("No weekly data loaded.")
    df = pd.concat(frames, ignore_index=True)
    df = df[df.get("season_type", pd.Series(["REG"]*len(df))) == "REG"].copy()
    df = df[df["position"].isin(POSITIONS)].copy()
    for col in WANTED_COLS:
        if col not in df.columns:
            df[col] = np.nan
    print(f"    Total: {len(df):,} rows, seasons: {sorted(df['season'].unique())}")
    return df


# ══════════════════════════════════════════════════════════════════════════════
# 2. ROSTERS + DRAFT + CONTRACTS — nflreadpy
# ══════════════════════════════════════════════════════════════════════════════

def load_roster_data(seasons):
    """Birth date, depth chart, team — from nflreadpy.load_rosters."""
    if not HAS_NFLR:
        return pd.DataFrame()
    print("[2/4] Loading roster data (nflreadpy)...")
    try:
        df = nflr.load_rosters(seasons=seasons).to_pandas()
        # Standardise ID column
        id_col = next((c for c in ["gsis_id", "player_id"] if c in df.columns), None)
        if id_col and id_col != "player_id":
            df = df.rename(columns={id_col: "player_id"})
        keep = [c for c in ["player_id", "season", "birth_date", "years_exp",
                             "depth_chart_position", "depth_chart_order",
                             "position", "team", "status"] if c in df.columns]
        df = df[keep].copy()
        df = df[df.get("position", pd.Series(POSITIONS * len(df))).isin(POSITIONS)]
        # Most recent per player
        df = df.sort_values("season", ascending=False).drop_duplicates("player_id", keep="first")
        print(f"    ✓ {len(df):,} roster records")
        return df
    except Exception as e:
        print(f"    ✗ Roster load failed: {e}")
        return pd.DataFrame()


def load_draft_data():
    """Draft round, pick number, overall pick — from nflreadpy.load_draft_picks."""
    if not HAS_NFLR:
        return pd.DataFrame()
    print("[2b] Loading draft data (nflreadpy)...")
    try:
        df = nflr.load_draft_picks(seasons=list(range(2000, 2026))).to_pandas()
        id_col = next((c for c in ["gsis_id", "player_id"] if c in df.columns), None)
        if not id_col:
            return pd.DataFrame()
        if id_col != "player_id":
            df = df.rename(columns={id_col: "player_id"})
        df = df[df["position"].isin(POSITIONS)].copy()
        # Overall pick number — use existing or compute from round+pick
        if "pick" in df.columns:
            df = df.rename(columns={"pick": "draft_pick_overall"})
        elif "draft_pick_num" in df.columns:
            df = df.rename(columns={"draft_pick_num": "draft_pick_overall"})
        else:
            df["draft_pick_overall"] = np.nan
        keep = [c for c in ["player_id", "draft_pick_overall", "round", "draft_round"] if c in df.columns]
        df = df[keep].drop_duplicates("player_id", keep="first")
        # Normalise round column name
        for col in ["draft_round", "round"]:
            if col in df.columns and "draft_round" not in df.columns:
                df = df.rename(columns={col: "draft_round"})
        print(f"    ✓ {len(df):,} draft records")
        return df
    except Exception as e:
        print(f"    ✗ Draft load failed: {e}")
        return pd.DataFrame()


def load_contract_data():
    """Contract years, APY, guaranteed — from nflreadpy.load_contracts."""
    if not HAS_NFLR:
        return pd.DataFrame()
    print("[3/4] Loading contract data (nflreadpy)...")
    try:
        df = nflr.load_contracts().to_pandas()
        df = df[df["position"].isin(POSITIONS)].copy()
        # Use gsis_id as player_id
        if "gsis_id" in df.columns:
            df = df.rename(columns={"gsis_id": "player_id"})
        elif "player_id" not in df.columns:
            print("    ✗ No player ID column in contracts")
            return pd.DataFrame()
        # Birth date from contracts if available
        if "date_of_birth" in df.columns and "birth_date" not in df.columns:
            df = df.rename(columns={"date_of_birth": "birth_date"})
        keep = [c for c in ["player_id", "player", "position", "team", "is_active",
                             "year_signed", "years", "value", "apy", "guaranteed",
                             "apy_cap_pct", "draft_year", "draft_round", "draft_overall",
                             "birth_date"] if c in df.columns]
        df = df[keep].copy()
        df = df.dropna(subset=["year_signed"]).copy()
        df = df.sort_values("year_signed", ascending=False).drop_duplicates("player_id", keep="first")
        print(f"    ✓ {len(df):,} active contracts")
        return df
    except Exception as e:
        print(f"    ✗ Contract load failed: {e}")
        return pd.DataFrame()


# ══════════════════════════════════════════════════════════════════════════════
# 3. SEASON AGGREGATES
# ══════════════════════════════════════════════════════════════════════════════

def aggregate_season(weekly_df):
    print("[4/4 pre] Aggregating to season level...")
    games = weekly_df.groupby(["player_id", "season"]).size().reset_index(name="games_played")

    sum_cols = ["targets","receptions","receiving_yards","receiving_tds","air_yards",
                "carries","rushing_yards","rushing_tds","attempts","completions",
                "passing_yards","passing_tds","interceptions",
                "receiving_epa","rushing_epa","passing_epa"]
    mean_cols = ["target_share","air_yards_share","snap_share","wopr","racr","dakota"]

    agg = {}
    for c in sum_cols:
        if c in weekly_df.columns: agg[c] = "sum"
    for c in mean_cols:
        if c in weekly_df.columns: agg[c] = "mean"

    grp = [c for c in ["player_id","player_name","position","recent_team","season"]
           if c in weekly_df.columns]
    season_df = weekly_df.groupby(grp, as_index=False).agg(agg)
    season_df = season_df.merge(games, on=["player_id","season"], how="left")

    for raw, pg in [("targets","targets_per_game"),("carries","carries_per_game"),
                    ("attempts","attempts_per_game"),("receiving_yards","receiving_yards_per_game"),
                    ("rushing_yards","rushing_yards_per_game"),("passing_yards","passing_yards_per_game")]:
        if raw in season_df.columns:
            season_df[pg] = season_df[raw] / season_df["games_played"].clip(lower=1)

    return season_df


# ══════════════════════════════════════════════════════════════════════════════
# 4. SCORING FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════

def opportunity_score(row):
    pos = row.get("position", "")
    snap = float(row.get("snap_share") or 0)
    if pos == "QB":
        att_pg = float(row.get("attempts_per_game") or 0)
        epa = float(row.get("passing_epa") or 0)
        return snap * 0.4 + min(att_pg / 35, 1.0) * 0.4 + min(max(epa, -100), 500) / 500 * 0.2
    elif pos in ("WR", "TE"):
        tgt = float(row.get("target_share") or 0)
        air = float(row.get("air_yards_share") or 0)
        wopr = float(row.get("wopr") or 0)
        return tgt * 0.35 + air * 0.25 + snap * 0.25 + min(wopr, 1.0) * 0.15
    elif pos == "RB":
        cpg = float(row.get("carries_per_game") or 0)
        tgt = float(row.get("target_share") or 0)
        return snap * 0.35 + min(cpg / 18, 1.0) * 0.45 + tgt * 0.20
    return snap


def draft_capital_score(pick_overall):
    if pick_overall is None:
        return 0
    try:
        pick = float(np.real(np.array(pick_overall)).item())
        if np.isnan(pick) or pick <= 0:
            return 0
        score = 100.0 * (1.0 - (pick - 1.0) / 255.0) ** 1.5
        return max(0.0, round(float(score), 1))
    except Exception:
        return 0


def contract_commitment_score(contract_row):
    if not contract_row:
        return 30  # unknown = neutral
    years = float(contract_row.get("years") or 1)
    guaranteed = float(contract_row.get("guaranteed") or 0)
    return round(min(guaranteed / 50_000_000, 1.0) * 60 + min(years / 4, 1.0) * 40, 1)


def depth_chart_score(order):
    if pd.isna(order) or order is None:
        return 25
    return {1: 100, 2: 60, 3: 25}.get(int(order), 5)


def age_dynasty_score(birth_date, position):
    if not birth_date or (isinstance(birth_date, float) and np.isnan(birth_date)):
        return 40
    try:
        if isinstance(birth_date, str):
            bd = datetime.strptime(str(birth_date)[:10], "%Y-%m-%d").date()
        elif hasattr(birth_date, 'date'):
            bd = birth_date.date()
        else:
            bd = birth_date
        age = (date.today() - bd).days / 365.25
    except Exception:
        return 40
    multi = {"WR": 1.0, "TE": 0.85, "QB": 0.90, "RB": 0.70}.get(position, 0.80)
    return min(100, round(max(0, (32 - age) * multi) / 20 * 100, 1))


def trajectory_score(player_id, season_df):
    avail = sorted(season_df["season"].unique())
    if len(avail) < 2:
        return 50
    cur = season_df[(season_df["player_id"] == player_id) & (season_df["season"] == avail[-1])]
    prev = season_df[(season_df["player_id"] == player_id) & (season_df["season"] == avail[-2])]
    if cur.empty or prev.empty:
        return 50
    delta = opportunity_score(cur.iloc[0].to_dict()) - opportunity_score(prev.iloc[0].to_dict())
    return round(min(100, max(0, 50 + delta * 80)), 1)


# ══════════════════════════════════════════════════════════════════════════════
# 5. FANTASYCALC
# ══════════════════════════════════════════════════════════════════════════════

def fetch_fc_values():
    print("[4/4] Fetching FantasyCalc values...")
    try:
        data = requests.get(
            "https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=1&numTeams=12&ppr=0.5",
            timeout=15
        ).json()
        fc_map = {}
        for d in data:
            sid = d.get("player", {}).get("sleeperId")
            if not sid:
                continue
            fc_map[sid] = {
                "fcValue": d.get("value"),
                "fcOverallRank": d.get("overallRank"),
                "fcPosRank": d.get("positionRank"),
                "fcPos": d.get("player", {}).get("position"),
                "fcName": d.get("player", {}).get("name"),
                "fcTeam": d.get("player", {}).get("maybeTeam"),
                "fcAge": round(d["player"]["maybeAge"], 1) if d.get("player", {}).get("maybeAge") else None,
                "fcYoe": d.get("player", {}).get("maybeYoe"),
                "trend30Day": d.get("trend30Day", 0),
            }
        print(f"    ✓ {len(fc_map):,} FC values loaded")
        return fc_map
    except Exception as e:
        print(f"    ✗ FC fetch failed: {e}")
        return {}


def update_fc_history(fc_map):
    today = date.today().isoformat()
    history = {}
    if os.path.exists(FC_HISTORY_PATH):
        try:
            with open(FC_HISTORY_PATH) as f:
                history = json.load(f)
        except Exception:
            history = {}
    if today not in history:
        history[today] = {sid: {"v": d["fcValue"], "r": d["fcOverallRank"]} for sid, d in fc_map.items()}
        with open(FC_HISTORY_PATH, "w") as f:
            json.dump(history, f)
        print(f"    ✓ FC history snapshot saved for {today} ({len(fc_map)} players)")
    else:
        print(f"    FC history: already have {today}")
    return history


def fc_history_trend(player_id, history):
    dates = sorted(history.keys())
    snapshots = [{"date": d, "value": history[d][player_id]["v"]}
                 for d in dates if player_id in history[d] and history[d][player_id].get("v")]
    if not snapshots:
        return {}
    today_val = snapshots[-1]["value"]
    result = {"snapshots": len(snapshots), "currentValue": today_val}
    today_dt = datetime.strptime(snapshots[-1]["date"], "%Y-%m-%d")
    for days, key in [(30, "change30d"), (60, "change60d"), (90, "change90d")]:
        cutoff = (today_dt - pd.Timedelta(days=days)).strftime("%Y-%m-%d")
        older = [s for s in snapshots if s["date"] <= cutoff]
        if older:
            result[key] = today_val - older[-1]["value"]
    return result


# ══════════════════════════════════════════════════════════════════════════════
# 6. BUILD FINAL RECORDS
# ══════════════════════════════════════════════════════════════════════════════

def build_records(season_df, roster_df, draft_df, contract_df, fc_map, fc_history):
    avail = sorted(season_df["season"].unique())
    latest = season_df[season_df["season"] == avail[-1]].copy()
    # Include players missing from latest season (injury etc.)
    if len(avail) >= 2:
        fallback = season_df[
            (season_df["season"] == avail[-2]) &
            (~season_df["player_id"].isin(set(latest["player_id"])))
        ].copy()
        latest = pd.concat([latest, fallback], ignore_index=True)

    # Build lookup dicts for O(1) access
    roster_lookup = {}
    if not roster_df.empty and "player_id" in roster_df.columns:
        for _, r in roster_df.iterrows():
            roster_lookup[str(r["player_id"])] = r.to_dict()

    draft_lookup = {}
    if not draft_df.empty and "player_id" in draft_df.columns:
        for _, r in draft_df.iterrows():
            draft_lookup[str(r["player_id"])] = r.to_dict()

    contract_lookup = {}
    if not contract_df.empty and "player_id" in contract_df.columns:
        for _, r in contract_df.iterrows():
            contract_lookup[str(r["player_id"])] = r.to_dict()

    records = []
    for _, row in latest.iterrows():
        pid = str(row["player_id"])
        pos = row.get("position", "")
        name = row.get("player_name", pid)

        if pos not in POSITIONS:
            continue
        if (row.get("games_played") or 0) < 3:
            continue

        r_row = roster_lookup.get(pid, {})
        d_row = draft_lookup.get(pid, {})
        c_row = contract_lookup.get(pid, {})

        # Birth date: prefer roster, fall back to contract
        birth_date = r_row.get("birth_date") or c_row.get("birth_date")

        fc = fc_map.get(pid, {})
        fc_hist = fc_history_trend(pid, fc_history)

        opp = opportunity_score(row.to_dict())
        traj = trajectory_score(row["player_id"], season_df)

        # Draft capital — prefer draft data, fall back to contract draft_overall
        pick_overall = d_row.get("draft_pick_overall") or c_row.get("draft_overall")
        dc = draft_capital_score(pick_overall)

        cc = contract_commitment_score(c_row or None)
        dcs = depth_chart_score(r_row.get("depth_chart_order"))
        age_s = age_dynasty_score(birth_date, pos)
        org = round(dc * 0.35 + cc * 0.35 + dcs * 0.30, 1)

        bgm_score = round(opp * 100 * 0.35 + traj * 0.25 + org * 0.25 + age_s * 0.15, 1)

        fc_rank = fc.get("fcOverallRank")
        fc_norm = max(0, round((1 - (fc_rank - 1) / 300) * 100, 1)) if fc_rank else None
        gap = round(bgm_score - fc_norm, 1) if fc_norm is not None else None

        # Season history for sparklines
        season_history = []
        for _, hr in season_df[season_df["player_id"] == row["player_id"]].sort_values("season").iterrows():
            season_history.append({
                "season": int(hr["season"]),
                "games": int(hr.get("games_played") or 0),
                "targetShare": round(float(hr.get("target_share") or 0), 3),
                "snapShare": round(float(hr.get("snap_share") or 0), 3),
                "airYardsShare": round(float(hr.get("air_yards_share") or 0), 3),
                "oppScore": round(opportunity_score(hr.to_dict()) * 100, 1),
            })

        record = {
            "playerId": pid,
            "name": str(name),
            "position": pos,
            "team": str(row.get("recent_team", "")),
            "status": str(r_row.get("status", "")),
            "birthDate": str(birth_date)[:10] if birth_date else None,
            "ageScore": age_s,
            "season": int(row.get("season", avail[-1])),
            "gamesPlayed": int(row.get("games_played") or 0),
            # Opportunity rates
            "snapSharePct": round(float(row.get("snap_share") or 0) * 100, 1),
            "targetSharePct": round(float(row.get("target_share") or 0) * 100, 1),
            "airYardsSharePct": round(float(row.get("air_yards_share") or 0) * 100, 1),
            "wopr": round(float(row.get("wopr") or 0), 3),
            # Position-specific
            **({ "targetsPg": round(float(row.get("targets_per_game") or 0), 1),
                 "recYdsPg": round(float(row.get("receiving_yards_per_game") or 0), 1) }
               if pos in ("WR", "TE") else {}),
            **({ "carriesPg": round(float(row.get("carries_per_game") or 0), 1),
                 "rushYdsPg": round(float(row.get("rushing_yards_per_game") or 0), 1),
                 "targetsPg": round(float(row.get("targets_per_game") or 0), 1) }
               if pos == "RB" else {}),
            **({ "attPg": round(float(row.get("attempts_per_game") or 0), 1),
                 "passYdsPg": round(float(row.get("passing_yards_per_game") or 0), 1) }
               if pos == "QB" else {}),
            # Org commitment
            "draftPickOverall": int(pick_overall) if pick_overall and not pd.isna(pick_overall) else None,
            "draftCapitalScore": dc,
            "depthChartOrder": int(r_row["depth_chart_order"]) if r_row.get("depth_chart_order") and not pd.isna(r_row.get("depth_chart_order")) else None,
            "depthChartScore": dcs,
            "contractYears": float(c_row["years"]) if c_row.get("years") else None,
            "contractGuaranteed": float(c_row["guaranteed"]) if c_row.get("guaranteed") else None,
            "contractApy": float(c_row["apy"]) if c_row.get("apy") else None,
            "contractScore": cc,
            "orgScore": org,
            # Scores
            "trajectoryScore": traj,
            "opportunityScore": round(opp * 100, 1),
            "bgmScore": bgm_score,
            # FC
            "fcValue": fc.get("fcValue", 0) or 0,
            "fcOverallRank": fc_rank,
            "fcPosRank": fc.get("fcPosRank"),
            "fcNormScore": fc_norm,
            "bgmVsFcGap": gap,
            "fcTrend30d": fc.get("trend30Day"),
            "fcHistory": fc_hist,
            "seasonHistory": season_history,
        }
        records.append(record)

    return records


# ══════════════════════════════════════════════════════════════════════════════
# 7. MAIN
# ══════════════════════════════════════════════════════════════════════════════

def main():
    weekly = load_weekly_stats(SEASONS)
    season_df = aggregate_season(weekly)

    roster_df = load_roster_data(SEASONS) if HAS_NFLR else pd.DataFrame()
    draft_df = load_draft_data() if HAS_NFLR else pd.DataFrame()
    contract_df = load_contract_data() if HAS_NFLR else pd.DataFrame()

    fc_map = fetch_fc_values()
    fc_history = update_fc_history(fc_map)

    print("\nBuilding player records...")
    records = build_records(season_df, roster_df, draft_df, contract_df, fc_map, fc_history)

    records.sort(key=lambda x: x["bgmScore"], reverse=True)
    for i, r in enumerate(records):
        r["bgmRank"] = i + 1

    pos_counters = {}
    for r in records:
        pos = r["position"]
        pos_counters[pos] = pos_counters.get(pos, 0) + 1
        r["bgmPosRank"] = pos_counters[pos]

    output = {
        "generated": datetime.now().isoformat(),
        "seasons": [int(s) for s in sorted(weekly["season"].unique())],
        "playerCount": len(records),
        "players": records,
    }
    with open(TRENDING_PATH, "w") as f:
        json.dump(sanitize(output), f)

    print(f"\n✓ {len(records)} players → {TRENDING_PATH}")
    print(f"✓ FC history: {len(fc_history)} snapshots")

    buys = sorted([r for r in records if (r.get("bgmVsFcGap") or 0) > 10],
                  key=lambda x: -x["bgmVsFcGap"])[:5]
    sells = sorted([r for r in records if (r.get("bgmVsFcGap") or 0) < -10],
                   key=lambda x: x["bgmVsFcGap"])[:5]

    if buys:
        print("\n── Top BGM Buy Signals ──")
        for r in buys:
            print(f"  {r['name']:25s} {r['position']} | BGM {r['bgmScore']:.0f} | gap +{r['bgmVsFcGap']:.0f}")
    if sells:
        print("\n── Top BGM Sell Signals ──")
        for r in sells:
            print(f"  {r['name']:25s} {r['position']} | BGM {r['bgmScore']:.0f} | gap {r['bgmVsFcGap']:.0f}")

    print("\n" + "=" * 60)
    print("Next: git add public/trending.json public/fc_history.json")
    print("      git commit -m 'Update BGM trending data' && git push")
    print("=" * 60)


if __name__ == "__main__":
    main()