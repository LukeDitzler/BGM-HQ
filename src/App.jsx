import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Config ────────────────────────────────────────────────────────────────────
const LEAGUE_IDS = {
  2024: "1099477523693473792",
  2025: "1182397104202231808",
  2026: "1314366510466076672",
};
const SLEEPER_USERNAME = "LukeWickham";
const CURRENT_YEAR = 2025;
const CURRENT_LEAGUE_ID = LEAGUE_IDS[CURRENT_YEAR];

// ── Design Tokens — BGM Green & White ────────────────────────────────────────
const C = {
  bg: "#080f09",           // near-black with a green undertone
  surface: "#0d1a0f",      // deep forest surface
  surfaceHigh: "#122016",  // slightly lifted surface
  border: "#1e3324",       // dark green border
  borderLight: "#2a4733",  // lighter green border
  text: "#eef5ee",         // off-white with green tint
  muted: "#5a7a62",        // muted green-grey
  mutedLight: "#8aaa92",   // lighter muted green
  accent: "#3ecf5e",       // vivid BGM green
  accentDim: "#2a9944",    // deeper green for hover/dim
  accentGlow: "rgba(62,207,94,0.10)",
  white: "#f0f7f0",        // clean white (used for hero text)
  green: "#3ecf5e",        // positive / active (same as accent)
  red: "#f87171",          // injury / negative
  blue: "#60a5fa",         // informational
};

// ── Sleeper API helpers ───────────────────────────────────────────────────────
const SLEEPER = "https://api.sleeper.app/v1";
async function sleeperFetch(path) {
  const res = await fetch(`${SLEEPER}${path}`);
  if (!res.ok) throw new Error(`Sleeper API error: ${path}`);
  return res.json();
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const card = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 4,
  padding: "20px 24px",
};

const statBox = {
  background: C.surfaceHigh,
  border: `1px solid ${C.border}`,
  borderRadius: 4,
  padding: "14px 18px",
};

const tabBtn = (active) => ({
  background: "transparent",
  border: "none",
  borderBottom: `2px solid ${active ? C.accent : "transparent"}`,
  color: active ? C.accent : C.muted,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontFamily: "'DM Mono', monospace",
  padding: "12px 20px",
  cursor: "pointer",
  transition: "all 0.15s",
  whiteSpace: "nowrap",
});

const badge = (color = C.accent) => ({
  display: "inline-block",
  background: `${color}22`,
  color: color,
  border: `1px solid ${color}44`,
  borderRadius: 3,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  padding: "2px 7px",
  fontFamily: "'DM Mono', monospace",
  textTransform: "uppercase",
});

const posColor = (pos) => {
  const map = { QB: "#f87171", RB: "#4ade80", WR: "#60a5fa", TE: "#fb923c", K: "#a78bfa", DEF: "#94a3b8", FLEX: C.accent };
  return map[pos] || C.muted;
};

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inp = {
    width: "100%", padding: "10px 14px", background: C.surfaceHigh,
    border: `1px solid ${C.border}`, borderRadius: 4, color: C.text,
    fontSize: 14, fontFamily: "'DM Mono', monospace", outline: "none",
    boxSizing: "border-box",
  };

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else onClose();
    setLoading(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 40, width: 360, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 18, background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer" }}>×</button>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: C.accent, letterSpacing: "0.05em", marginBottom: 6 }}>BIG GREEN MACHINE</div>
        <div style={{ fontSize: 12, color: C.muted, fontFamily: "'DM Mono', monospace", marginBottom: 28 }}>AUTHORIZED ACCESS ONLY</div>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Email</div>
            <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Password</div>
            <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div style={{ color: C.red, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            background: C.accent, color: C.bg, border: "none", borderRadius: 4,
            padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em",
            textTransform: "uppercase", marginTop: 6,
          }}>{loading ? "Signing in…" : "Enter HQ"}</button>
        </form>
      </div>
    </div>
  );
}

// ── Loading Spinner ───────────────────────────────────────────────────────────
function Spinner({ label = "Loading…" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 16 }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 11, color: C.muted, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>{label}</div>
    </div>
  );
}

// ── HOME TAB ──────────────────────────────────────────────────────────────────
function HomeTab({ leagueData, rosters, users, myRoster, myUser, nflState }) {
  const [matchups, setMatchups] = useState([]);
  const [loadingMatchups, setLoadingMatchups] = useState(true);

  const week = nflState?.week || 1;
  const season = nflState?.season || CURRENT_YEAR;

  useEffect(() => {
    if (!week) return;
    sleeperFetch(`/league/${CURRENT_LEAGUE_ID}/matchups/${week}`)
      .then(setMatchups)
      .catch(() => setMatchups([]))
      .finally(() => setLoadingMatchups(false));
  }, [week]);

  if (!myRoster || !leagueData) return <Spinner label="Loading franchise data…" />;

  const myMatchup = matchups.find(m => m.roster_id === myRoster.roster_id);
  const opponentMatchup = myMatchup ? matchups.find(m => m.matchup_id === myMatchup.matchup_id && m.roster_id !== myRoster.roster_id) : null;
  const opponentRoster = opponentMatchup ? rosters.find(r => r.roster_id === opponentMatchup.roster_id) : null;
  const opponentUser = opponentRoster ? users.find(u => u.user_id === opponentRoster.owner_id) : null;

  const wins = myRoster.settings?.wins ?? 0;
  const losses = myRoster.settings?.losses ?? 0;
  const ties = myRoster.settings?.ties ?? 0;
  const pf = myRoster.settings?.fpts ? parseFloat(`${myRoster.settings.fpts}.${myRoster.settings.fpts_decimal ?? 0}`).toFixed(1) : "—";
  const pa = myRoster.settings?.fpts_against ? parseFloat(`${myRoster.settings.fpts_against}.${myRoster.settings.fpts_against_decimal ?? 0}`).toFixed(1) : "—";

  // Standings rank
  const sorted = [...rosters].sort((a, b) => {
    const wa = a.settings?.wins ?? 0, wb = b.settings?.wins ?? 0;
    if (wb !== wa) return wb - wa;
    const pfA = parseFloat(`${a.settings?.fpts ?? 0}.${a.settings?.fpts_decimal ?? 0}`);
    const pfB = parseFloat(`${b.settings?.fpts ?? 0}.${b.settings?.fpts_decimal ?? 0}`);
    return pfB - pfA;
  });
  const rank = sorted.findIndex(r => r.roster_id === myRoster.roster_id) + 1;
  const totalTeams = rosters.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Franchise header */}
      <div style={{ ...card, background: "linear-gradient(135deg, #0d1a0f 0%, #122016 100%)", borderColor: C.accentDim, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: C.accentGlow, borderRadius: "50%", filter: "blur(60px)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.accentDim, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Dynasty Franchise · {season} Season</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 42, fontWeight: 800, color: C.text, letterSpacing: "-0.01em", lineHeight: 1 }}>BIG GREEN MACHINE</div>
          <div style={{ fontSize: 13, color: C.muted, fontFamily: "'DM Mono', monospace", marginTop: 6 }}>{leagueData.name}</div>
          <div style={{ display: "flex", gap: 24, marginTop: 20, flexWrap: "wrap" }}>
            {[
              { label: "Record", value: ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}` },
              { label: "Points For", value: pf },
              { label: "Points Against", value: pa },
              { label: "League Rank", value: `#${rank} / ${totalTeams}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: C.accent, lineHeight: 1.2 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current matchup */}
      <div>
        <SectionHeader label={`Week ${week} Matchup`} />
        {loadingMatchups ? <Spinner label="Loading matchup…" /> : !myMatchup ? (
          <div style={{ ...statBox, color: C.muted, fontSize: 13, fontFamily: "'DM Mono', monospace" }}>No active matchup data.</div>
        ) : (
          <div style={{ ...card, display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 20, alignItems: "center" }}>
            <TeamMatchupSide user={myUser} roster={myRoster} matchup={myMatchup} align="left" isMe />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.muted, letterSpacing: "0.1em" }}>VS</div>
            </div>
            <TeamMatchupSide user={opponentUser} roster={opponentRoster} matchup={opponentMatchup} align="right" />
          </div>
        )}
      </div>

      {/* League standings snapshot */}
      <div>
        <SectionHeader label="League Standings" />
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["#", "Team", "W", "L", "PF", "PA"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textAlign: h === "Team" ? "left" : "right", fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((roster, i) => {
                const u = users.find(u => u.user_id === roster.owner_id);
                const teamName = u?.metadata?.team_name || u?.display_name || "Unknown";
                const isMe = roster.roster_id === myRoster.roster_id;
                const rpf = parseFloat(`${roster.settings?.fpts ?? 0}.${roster.settings?.fpts_decimal ?? 0}`).toFixed(1);
                const rpa = parseFloat(`${roster.settings?.fpts_against ?? 0}.${roster.settings?.fpts_against_decimal ?? 0}`).toFixed(1);
                return (
                  <tr key={roster.roster_id} style={{ borderBottom: `1px solid ${C.border}`, background: isMe ? C.accentGlow : "transparent" }}>
                    <td style={{ padding: "9px 16px", color: C.muted, textAlign: "right" }}>{i + 1}</td>
                    <td style={{ padding: "9px 16px", color: isMe ? C.accent : C.text, fontWeight: isMe ? 700 : 400 }}>{teamName}{isMe && <span style={{ ...badge(), marginLeft: 8, fontSize: 9 }}>BGM</span>}</td>
                    <td style={{ padding: "9px 16px", color: C.green, textAlign: "right" }}>{roster.settings?.wins ?? 0}</td>
                    <td style={{ padding: "9px 16px", color: C.red, textAlign: "right" }}>{roster.settings?.losses ?? 0}</td>
                    <td style={{ padding: "9px 16px", color: C.text, textAlign: "right" }}>{rpf}</td>
                    <td style={{ padding: "9px 16px", color: C.muted, textAlign: "right" }}>{rpa}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TeamMatchupSide({ user, roster, matchup, align, isMe }) {
  const teamName = user?.metadata?.team_name || user?.display_name || "Unknown";
  const pts = matchup ? parseFloat(`${matchup.points ?? 0}`).toFixed(2) : "—";
  return (
    <div style={{ textAlign: align }}>
      <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: isMe ? C.accent : C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{isMe ? "◆ YOUR TEAM" : "OPPONENT"}</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: C.text }}>{teamName}</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 40, fontWeight: 800, color: isMe ? C.accent : C.text, lineHeight: 1.1 }}>{pts}</div>
      <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: C.muted }}>pts</div>
    </div>
  );
}

// ── ROSTER TAB ────────────────────────────────────────────────────────────────
function RosterTab({ myRoster, allPlayers, nflState }) {
  const [view, setView] = useState("starters");

  if (!myRoster || !allPlayers) return <Spinner label="Loading roster…" />;

  const starters = myRoster.starters || [];
  const allOnRoster = myRoster.players || [];
  const bench = allOnRoster.filter(id => !starters.includes(id));
  const taxi = myRoster.taxi || [];
  const ir = myRoster.reserve || [];

  const group = view === "starters" ? starters
    : view === "bench" ? bench
    : view === "taxi" ? taxi
    : ir;

  const enrichPlayer = (id, slotPos = null) => {
    const p = allPlayers[id];
    if (!p) return { id, name: id, pos: "?", team: "FA", age: "—", exp: "—", injStatus: null, slot: slotPos };
    return {
      id,
      name: `${p.first_name || ""} ${p.last_name || ""}`.trim(),
      pos: p.position || "?",
      team: p.team || "FA",
      age: p.age || "—",
      exp: p.years_exp !== undefined ? p.years_exp : "—",
      injStatus: p.injury_status || null,
      slot: slotPos,
      college: p.college || "—",
      number: p.number,
    };
  };

  const players = group.map((id, i) => enrichPlayer(id, view === "starters" ? id : null));
  const posOrder = ["QB", "RB", "WR", "TE", "K", "DEF"];
  const sorted = [...players].sort((a, b) => {
    const ai = posOrder.indexOf(a.pos), bi = posOrder.indexOf(b.pos);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const views = [
    { id: "starters", label: "Starters" },
    { id: "bench", label: "Bench" },
    { id: "taxi", label: "Taxi Squad" },
    { id: "ir", label: "IR" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {views.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            background: "transparent", border: "none",
            borderBottom: `2px solid ${view === v.id ? C.accent : "transparent"}`,
            color: view === v.id ? C.accent : C.muted,
            fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "10px 18px", cursor: "pointer",
          }}>{v.label} <span style={{ color: C.muted, fontWeight: 400 }}>({
            v.id === "starters" ? starters.length
            : v.id === "bench" ? bench.length
            : v.id === "taxi" ? taxi.length
            : ir.length
          })</span></button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div style={{ ...statBox, color: C.muted, fontSize: 13, fontFamily: "'DM Mono', monospace" }}>No players in this group.</div>
      ) : (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Pos", "Player", "Team", "Age", "Exp", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textAlign: "left", fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surfaceHigh}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ ...badge(posColor(p.pos)) }}>{p.pos}</span>
                  </td>
                  <td style={{ padding: "10px 16px", color: C.text, fontWeight: 600 }}>
                    {p.name}
                    {p.number && <span style={{ color: C.muted, fontWeight: 400, marginLeft: 6 }}>#{p.number}</span>}
                  </td>
                  <td style={{ padding: "10px 16px", color: C.mutedLight }}>{p.team}</td>
                  <td style={{ padding: "10px 16px", color: C.mutedLight }}>{p.age}</td>
                  <td style={{ padding: "10px 16px", color: p.exp === 0 ? C.green : C.mutedLight }}>
                    {p.exp === 0 ? "Rookie" : p.exp === "—" ? "—" : `Yr ${p.exp + 1}`}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    {p.injStatus ? (
                      <span style={{ ...badge(p.injStatus === "Out" || p.injStatus === "IR" ? C.red : C.accent) }}>{p.injStatus}</span>
                    ) : (
                      <span style={{ color: C.green, fontSize: 10, letterSpacing: "0.06em" }}>Active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── WATCH LIST TAB ────────────────────────────────────────────────────────────
function WatchListTab({ allPlayers, myRoster }) {
  const [watchList, setWatchList] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bgm_watchlist") || "[]"); } catch { return []; }
  });
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    localStorage.setItem("bgm_watchlist", JSON.stringify(watchList));
  }, [watchList]);

  useEffect(() => {
    if (!search || !allPlayers) { setSearchResults([]); return; }
    const q = search.toLowerCase();
    const results = Object.entries(allPlayers)
      .filter(([, p]) => {
        const name = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase();
        return name.includes(q) && p.active;
      })
      .slice(0, 8)
      .map(([id, p]) => ({ id, ...p }));
    setSearchResults(results);
  }, [search, allPlayers]);

  const addToWatchList = (player, signal, note) => {
    if (watchList.find(w => w.id === player.id)) return;
    setWatchList(prev => [...prev, {
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
      pos: player.position,
      team: player.team || "FA",
      age: player.age,
      signal,
      note,
      addedAt: new Date().toISOString(),
    }]);
    setSearch("");
    setSearchResults([]);
  };

  const removeFromList = (id) => setWatchList(prev => prev.filter(w => w.id !== id));
  const updateSignal = (id, signal) => setWatchList(prev => prev.map(w => w.id === id ? { ...w, signal } : w));
  const updateNote = (id, note) => setWatchList(prev => prev.map(w => w.id === id ? { ...w, note } : w));

  const myPlayerIds = new Set(myRoster?.players || []);
  const filtered = filter === "all" ? watchList
    : filter === "buy" ? watchList.filter(w => w.signal === "BUY")
    : filter === "sell" ? watchList.filter(w => w.signal === "SELL")
    : watchList.filter(w => w.signal === "WATCH");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ ...card, background: C.surfaceHigh, borderColor: C.accentDim }}>
        <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.accent, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Add Player to Watch List</div>
        <div style={{ position: "relative" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search player name…"
            style={{
              width: "100%", padding: "10px 14px", background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 4, color: C.text,
              fontSize: 13, fontFamily: "'DM Mono', monospace", outline: "none",
              boxSizing: "border-box",
            }}
          />
          {searchResults.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, zIndex: 10, marginTop: 2 }}>
              {searchResults.map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surfaceHigh}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ ...badge(posColor(p.position)) }}>{p.position}</span>
                    <span style={{ color: C.text, fontSize: 13, fontFamily: "'DM Mono', monospace" }}>{p.first_name} {p.last_name}</span>
                    <span style={{ color: C.muted, fontSize: 11 }}>{p.team || "FA"}</span>
                    {myPlayerIds.has(p.id) && <span style={{ ...badge(C.green), fontSize: 9 }}>ON ROSTER</span>}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["BUY", "WATCH", "SELL"].map(sig => (
                      <button key={sig} onClick={() => addToWatchList(p, sig, "")} style={{
                        background: sig === "BUY" ? `${C.green}22` : sig === "SELL" ? `${C.red}22` : `${C.accent}22`,
                        color: sig === "BUY" ? C.green : sig === "SELL" ? C.red : C.accent,
                        border: `1px solid ${sig === "BUY" ? C.green : sig === "SELL" ? C.red : C.accent}44`,
                        borderRadius: 3, fontSize: 10, fontWeight: 700, padding: "3px 8px",
                        cursor: "pointer", fontFamily: "'DM Mono', monospace",
                      }}>{sig}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {["all", "buy", "watch", "sell"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? (f === "buy" ? C.green : f === "sell" ? C.red : f === "watch" ? C.accent : C.accent) + "22" : "transparent",
            color: filter === f ? (f === "buy" ? C.green : f === "sell" ? C.red : C.accent) : C.muted,
            border: `1px solid ${filter === f ? (f === "buy" ? C.green : f === "sell" ? C.red : C.accent) : C.border}44`,
            borderRadius: 3, fontSize: 10, fontWeight: 700, padding: "5px 12px",
            cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase",
          }}>{f === "all" ? `All (${watchList.length})` : `${f.toUpperCase()} (${watchList.filter(w => w.signal === f.toUpperCase()).length})`}</button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 11, color: C.muted, fontFamily: "'DM Mono', monospace" }}>
          Your personal trade board — tag and annotate players
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...statBox, color: C.muted, fontSize: 13, fontFamily: "'DM Mono', monospace", textAlign: "center", padding: 40 }}>
          No players in this view. Search above to add players to your watch list.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(w => (
            <WatchListCard key={w.id} item={w} onRemove={removeFromList} onSignalChange={updateSignal} onNoteChange={updateNote} myPlayerIds={myPlayerIds} />
          ))}
        </div>
      )}
    </div>
  );
}

function WatchListCard({ item, onRemove, onSignalChange, onNoteChange, myPlayerIds }) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(item.note || "");
  const sigColor = item.signal === "BUY" ? C.green : item.signal === "SELL" ? C.red : C.accent;

  return (
    <div style={{ ...card, borderLeft: `3px solid ${sigColor}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ ...badge(posColor(item.pos)) }}>{item.pos}</span>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
              {item.name}
              {myPlayerIds.has(item.id) && <span style={{ ...badge(C.green), fontSize: 9 }}>ON YOUR ROSTER</span>}
            </div>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted, marginTop: 2 }}>
              {item.team} · Age {item.age}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {["BUY", "WATCH", "SELL"].map(sig => (
            <button key={sig} onClick={() => onSignalChange(item.id, sig)} style={{
              background: item.signal === sig ? `${sig === "BUY" ? C.green : sig === "SELL" ? C.red : C.accent}22` : "transparent",
              color: item.signal === sig ? (sig === "BUY" ? C.green : sig === "SELL" ? C.red : C.accent) : C.muted,
              border: `1px solid ${item.signal === sig ? (sig === "BUY" ? C.green : sig === "SELL" ? C.red : C.accent) + "44" : C.border}`,
              borderRadius: 3, fontSize: 10, fontWeight: 700, padding: "4px 10px",
              cursor: "pointer", fontFamily: "'DM Mono', monospace",
            }}>{sig}</button>
          ))}
          <button onClick={() => onRemove(item.id)} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 16, cursor: "pointer", padding: "0 4px" }}>×</button>
        </div>
      </div>
      {editing ? (
        <div style={{ marginTop: 12 }}>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Notes, reasoning, trade targets…"
            style={{ width: "100%", background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, fontSize: 12, fontFamily: "'DM Mono', monospace", padding: "8px 12px", resize: "vertical", minHeight: 60, boxSizing: "border-box", outline: "none" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button onClick={() => { onNoteChange(item.id, note); setEditing(false); }} style={{ background: C.accent, color: C.bg, border: "none", borderRadius: 3, fontSize: 11, fontWeight: 700, padding: "5px 14px", cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>Save</button>
            <button onClick={() => { setNote(item.note || ""); setEditing(false); }} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 3, fontSize: 11, padding: "5px 14px", cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 10, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: item.note ? C.mutedLight : C.muted, fontStyle: item.note ? "normal" : "italic" }}>
            {item.note || "No notes yet — click to add your analysis"}
          </div>
          <button onClick={() => setEditing(true)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 3, fontSize: 10, padding: "4px 10px", cursor: "pointer", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>Edit Note</button>
        </div>
      )}
    </div>
  );
}

// ── ROOKIE DRAFT TAB ──────────────────────────────────────────────────────────
function RookieDraftTab({ allPlayers }) {
  const [rookies, setRookies] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bgm_rookies") || "[]"); } catch { return []; }
  });
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [sortBy, setSortBy] = useState("rank");

  useEffect(() => {
    localStorage.setItem("bgm_rookies", JSON.stringify(rookies));
  }, [rookies]);

  useEffect(() => {
    if (!search || !allPlayers) { setSearchResults([]); return; }
    const q = search.toLowerCase();
    const results = Object.entries(allPlayers)
      .filter(([, p]) => {
        const name = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase();
        return name.includes(q) && (p.years_exp === 0 || p.years_exp === null);
      })
      .slice(0, 8)
      .map(([id, p]) => ({ id, ...p }));
    setSearchResults(results);
  }, [search, allPlayers]);

  const addRookie = (player) => {
    if (rookies.find(r => r.id === player.id)) return;
    const newRookie = {
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
      pos: player.position,
      team: player.team || "UND",
      college: player.college || "—",
      age: player.age || "—",
      myRank: rookies.length + 1,
      tier: "2",
      note: "",
      targetRound: "",
    };
    setRookies(prev => [...prev, newRookie]);
    setSearch("");
    setSearchResults([]);
  };

  const updateRookie = (id, field, value) => setRookies(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  const removeRookie = (id) => setRookies(prev => prev.filter(r => r.id !== id).map((r, i) => ({ ...r, myRank: i + 1 })));
  const moveRookie = (id, dir) => {
    setRookies(prev => {
      const idx = prev.findIndex(r => r.id === id);
      if ((dir === -1 && idx === 0) || (dir === 1 && idx === prev.length - 1)) return prev;
      const newArr = [...prev];
      [newArr[idx], newArr[idx + dir]] = [newArr[idx + dir], newArr[idx]];
      return newArr.map((r, i) => ({ ...r, myRank: i + 1 }));
    });
  };

  const tierColors = { "1": C.accent, "2": C.blue, "3": C.green, "4": C.muted };
  const sorted = sortBy === "rank" ? [...rookies].sort((a, b) => a.myRank - b.myRank)
    : sortBy === "pos" ? [...rookies].sort((a, b) => a.pos.localeCompare(b.pos) || a.myRank - b.myRank)
    : [...rookies].sort((a, b) => a.tier.localeCompare(b.tier) || a.myRank - b.myRank);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 280, ...card, background: C.surfaceHigh, borderColor: C.accentDim }}>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.accent, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Add Rookie to Board</div>
          <div style={{ position: "relative" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search rookie name…"
              style={{ width: "100%", padding: "10px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, fontSize: 13, fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box" }}
            />
            {searchResults.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, zIndex: 10, marginTop: 2 }}>
                {searchResults.map(p => (
                  <div key={p.id} onClick={() => addRookie(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.surfaceHigh}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span style={{ ...badge(posColor(p.position)) }}>{p.position}</span>
                    <span style={{ color: C.text, fontSize: 13, fontFamily: "'DM Mono', monospace" }}>{p.first_name} {p.last_name}</span>
                    <span style={{ color: C.muted, fontSize: 11 }}>{p.college || "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 10, color: C.muted, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>Sort:</div>
          {["rank", "pos", "tier"].map(s => (
            <button key={s} onClick={() => setSortBy(s)} style={{ background: sortBy === s ? C.accentGlow : "transparent", color: sortBy === s ? C.accent : C.muted, border: `1px solid ${sortBy === s ? C.accentDim : C.border}`, borderRadius: 3, fontSize: 10, fontWeight: 700, padding: "5px 12px", cursor: "pointer", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Tier legend */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[["1", "Elite"], ["2", "Starter"], ["3", "Depth/Flier"], ["4", "Deep Stash"]].map(([t, label]) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: tierColors[t] }} />
            <span>Tier {t}: {label}</span>
          </div>
        ))}
      </div>

      {rookies.length === 0 ? (
        <div style={{ ...statBox, color: C.muted, fontSize: 13, fontFamily: "'DM Mono', monospace", textAlign: "center", padding: 40 }}>
          No rookies on your board yet. Search above to build your 2025 rookie rankings.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sorted.map((r) => (
            <RookieCard key={r.id} rookie={r} onUpdate={updateRookie} onRemove={removeRookie} onMove={moveRookie} tierColors={tierColors} />
          ))}
        </div>
      )}
    </div>
  );
}

function RookieCard({ rookie, onUpdate, onRemove, onMove, tierColors }) {
  const [editNote, setEditNote] = useState(false);
  const [note, setNote] = useState(rookie.note || "");

  return (
    <div style={{ ...card, borderLeft: `3px solid ${tierColors[rookie.tier] || C.muted}`, display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 36 }}>
        <button onClick={() => onMove(rookie.id, -1)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>▲</button>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: C.accent, lineHeight: 1 }}>#{rookie.myRank}</div>
        <button onClick={() => onMove(rookie.id, 1)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>▼</button>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ ...badge(posColor(rookie.pos)) }}>{rookie.pos}</span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: C.text }}>{rookie.name}</span>
          <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted }}>{rookie.college} · {rookie.team}</span>
        </div>
        {editNote ? (
          <div>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Scouting notes, comps, concerns…"
              style={{ width: "100%", background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, fontSize: 12, fontFamily: "'DM Mono', monospace", padding: "7px 10px", resize: "vertical", minHeight: 50, boxSizing: "border-box", outline: "none" }}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <button onClick={() => { onUpdate(rookie.id, "note", note); setEditNote(false); }} style={{ background: C.accent, color: C.bg, border: "none", borderRadius: 3, fontSize: 10, fontWeight: 700, padding: "4px 12px", cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>Save</button>
              <button onClick={() => { setNote(rookie.note || ""); setEditNote(false); }} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 3, fontSize: 10, padding: "4px 12px", cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div onClick={() => setEditNote(true)} style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: rookie.note ? C.mutedLight : C.muted, fontStyle: rookie.note ? "normal" : "italic", cursor: "pointer" }}>
            {rookie.note || "Click to add scouting notes…"}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Tier</div>
          <select value={rookie.tier} onChange={e => onUpdate(rookie.id, "tier", e.target.value)}
            style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 3, color: tierColors[rookie.tier], fontSize: 12, fontFamily: "'DM Mono', monospace", padding: "4px 8px", cursor: "pointer", outline: "none" }}>
            {["1", "2", "3", "4"].map(t => <option key={t} value={t} style={{ color: C.text }}>T{t}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Target Rd</div>
          <input value={rookie.targetRound} onChange={e => onUpdate(rookie.id, "targetRound", e.target.value)}
            placeholder="1.01…"
            style={{ width: 64, background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 3, color: C.text, fontSize: 12, fontFamily: "'DM Mono', monospace", padding: "4px 8px", outline: "none" }}
          />
        </div>
        <button onClick={() => onRemove(rookie.id)} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 16, cursor: "pointer", marginTop: 18 }}>×</button>
      </div>
    </div>
  );
}

// ── LEAGUE HISTORY TAB ────────────────────────────────────────────────────────
function LeagueHistoryTab({ rosters, users }) {
  const [view, setView] = useState("standings");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [allSeasonData, setAllSeasonData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllSeasons() {
      setLoading(true);
      const results = {};
      for (const [year, leagueId] of Object.entries(LEAGUE_IDS)) {
        try {
          const [leagueInfo, leagueRosters, leagueUsers] = await Promise.all([
            sleeperFetch(`/league/${leagueId}`),
            sleeperFetch(`/league/${leagueId}/rosters`),
            sleeperFetch(`/league/${leagueId}/users`),
          ]);
          results[year] = { leagueInfo, rosters: leagueRosters, users: leagueUsers };
        } catch (e) {
          console.error(`Failed to fetch ${year}:`, e);
        }
      }
      setAllSeasonData(results);
      setLoading(false);
    }
    fetchAllSeasons();
  }, []);

  if (loading) return <Spinner label="Loading league history…" />;

  // Build all-time records per owner (keyed by display_name as stable identifier)
  const ownerMap = {}; // display_name -> { wins, losses, ties, pf, pa, seasons }
  for (const [year, data] of Object.entries(allSeasonData)) {
    if (!data) continue;
    for (const roster of data.rosters) {
      const user = data.users.find(u => u.user_id === roster.owner_id);
      if (!user) continue;
      const key = user.display_name;
      const teamName = user.metadata?.team_name || user.display_name;
      if (!ownerMap[key]) ownerMap[key] = { displayName: key, teamName, wins: 0, losses: 0, ties: 0, pf: 0, pa: 0, seasons: [] };
      const w = roster.settings?.wins ?? 0;
      const l = roster.settings?.losses ?? 0;
      const t = roster.settings?.ties ?? 0;
      const pf = parseFloat(`${roster.settings?.fpts ?? 0}.${roster.settings?.fpts_decimal ?? 0}`);
      const pa = parseFloat(`${roster.settings?.fpts_against ?? 0}.${roster.settings?.fpts_against_decimal ?? 0}`);
      ownerMap[key].wins += w;
      ownerMap[key].losses += l;
      ownerMap[key].ties += t;
      ownerMap[key].pf += pf;
      ownerMap[key].pa += pa;
      ownerMap[key].seasons.push({ year, wins: w, losses: l, pf, pa });
    }
  }

  const owners = Object.values(ownerMap).sort((a, b) => {
    const wpA = a.wins / (a.wins + a.losses || 1);
    const wpB = b.wins / (b.wins + b.losses || 1);
    return wpB - wpA;
  });

  // Build H2H matrix from matchups (we'd need to fetch all matchups — for now show per-season summaries)
  const years = Object.keys(LEAGUE_IDS).sort();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}` }}>
        {[
          { id: "standings", label: "All-Time Records" },
          { id: "seasons", label: "Season by Season" },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            background: "transparent", border: "none",
            borderBottom: `2px solid ${view === v.id ? C.accent : "transparent"}`,
            color: view === v.id ? C.accent : C.muted,
            fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "10px 18px", cursor: "pointer",
          }}>{v.label}</button>
        ))}
      </div>

      {view === "standings" && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Rank", "Manager", "W", "L", "Win%", "Total PF", "Total PA", "Seasons"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textAlign: h === "Manager" ? "left" : "right", fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {owners.map((o, i) => {
                const wp = ((o.wins / (o.wins + o.losses || 1)) * 100).toFixed(1);
                return (
                  <tr key={o.displayName} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.surfaceHigh}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    onClick={() => setSelectedTeam(selectedTeam === o.displayName ? null : o.displayName)}>
                    <td style={{ padding: "10px 16px", color: C.muted, textAlign: "right" }}>{i + 1}</td>
                    <td style={{ padding: "10px 16px", color: C.text, fontWeight: 600 }}>
                      {o.teamName}
                      <div style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}>@{o.displayName}</div>
                    </td>
                    <td style={{ padding: "10px 16px", color: C.green, textAlign: "right" }}>{o.wins}</td>
                    <td style={{ padding: "10px 16px", color: C.red, textAlign: "right" }}>{o.losses}</td>
                    <td style={{ padding: "10px 16px", color: C.accent, textAlign: "right", fontWeight: 700 }}>{wp}%</td>
                    <td style={{ padding: "10px 16px", color: C.text, textAlign: "right" }}>{o.pf.toFixed(1)}</td>
                    <td style={{ padding: "10px 16px", color: C.muted, textAlign: "right" }}>{o.pa.toFixed(1)}</td>
                    <td style={{ padding: "10px 16px", color: C.muted, textAlign: "right" }}>{o.seasons.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {selectedTeam && (() => {
            const o = ownerMap[selectedTeam];
            if (!o) return null;
            return (
              <div style={{ padding: "20px 24px", borderTop: `1px solid ${C.border}`, background: C.surfaceHigh }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: C.accent, marginBottom: 12 }}>{o.teamName} — Year by Year</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {o.seasons.map(s => (
                    <div key={s.year} style={{ ...statBox, minWidth: 120, textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: C.muted, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>{s.year}</div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: C.text, marginTop: 4 }}>{s.wins}–{s.losses}</div>
                      <div style={{ fontSize: 10, color: C.muted, fontFamily: "'DM Mono', monospace" }}>{s.pf.toFixed(1)} PF</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {view === "seasons" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {years.map(year => {
            const data = allSeasonData[year];
            if (!data) return <div key={year} style={{ color: C.muted, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>No data for {year}</div>;
            const sorted = [...data.rosters].sort((a, b) => (b.settings?.wins ?? 0) - (a.settings?.wins ?? 0));
            return (
              <div key={year}>
                <SectionHeader label={`${year} Season`} />
                <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        {["#", "Team", "W", "L", "PF", "PA"].map(h => (
                          <th key={h} style={{ padding: "9px 14px", color: C.muted, fontWeight: 600, textAlign: h === "Team" ? "left" : "right", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((roster, i) => {
                        const u = data.users.find(u => u.user_id === roster.owner_id);
                        const name = u?.metadata?.team_name || u?.display_name || "Unknown";
                        const pf = parseFloat(`${roster.settings?.fpts ?? 0}.${roster.settings?.fpts_decimal ?? 0}`).toFixed(1);
                        const pa = parseFloat(`${roster.settings?.fpts_against ?? 0}.${roster.settings?.fpts_against_decimal ?? 0}`).toFixed(1);
                        return (
                          <tr key={roster.roster_id} style={{ borderBottom: `1px solid ${C.border}` }}
                            onMouseEnter={e => e.currentTarget.style.background = C.surfaceHigh}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "9px 14px", color: C.muted, textAlign: "right" }}>{i + 1}</td>
                            <td style={{ padding: "9px 14px", color: C.text }}>{name}</td>
                            <td style={{ padding: "9px 14px", color: C.green, textAlign: "right" }}>{roster.settings?.wins ?? 0}</td>
                            <td style={{ padding: "9px 14px", color: C.red, textAlign: "right" }}>{roster.settings?.losses ?? 0}</td>
                            <td style={{ padding: "9px 14px", color: C.text, textAlign: "right" }}>{pf}</td>
                            <td style={{ padding: "9px 14px", color: C.muted, textAlign: "right" }}>{pa}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function SectionHeader({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", fontWeight: 700, color: C.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function BGMApp() {
  const [tab, setTab] = useState("home");
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  // Sleeper data
  const [leagueData, setLeagueData] = useState(null);
  const [rosters, setRosters] = useState([]);
  const [users, setUsers] = useState([]);
  const [allPlayers, setAllPlayers] = useState(null);
  const [nflState, setNflState] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Load Sleeper data once authed
  useEffect(() => {
    if (!session) return;
    async function loadData() {
      try {
        const [ld, rs, us, ns] = await Promise.all([
          sleeperFetch(`/league/${CURRENT_LEAGUE_ID}`),
          sleeperFetch(`/league/${CURRENT_LEAGUE_ID}/rosters`),
          sleeperFetch(`/league/${CURRENT_LEAGUE_ID}/users`),
          sleeperFetch(`/state/nfl`),
        ]);
        setLeagueData(ld);
        setRosters(rs);
        setUsers(us);
        setNflState(ns);

        // Players is large — load separately
        const players = await sleeperFetch(`/players/nfl`);
        setAllPlayers(players);
        setDataLoaded(true);
      } catch (e) {
        console.error("Failed to load Sleeper data:", e);
        setDataLoaded(true);
      }
    }
    loadData();
  }, [session]);

  const myUser = users.find(u => u.display_name === SLEEPER_USERNAME);
  const myRoster = myUser ? rosters.find(r => r.owner_id === myUser.user_id) : null;

  const tabs = [
    { id: "home", label: "Home" },
    { id: "roster", label: "Roster" },
    { id: "watchlist", label: "Watch List" },
    { id: "rookiedraft", label: "Rookie Draft" },
    { id: "history", label: "League History" },
  ];

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", background: C.bg, minHeight: "100vh", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Barlow+Condensed:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; width: 100%; }
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #14161a; color: #f0f0ec; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        input::placeholder { color: ${C.muted}; }
        textarea::placeholder { color: ${C.muted}; }
      `}</style>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.surface, padding: "0 4vw", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 800, color: C.accent, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            🏈 BGM HQ
          </div>
          {session && (
            <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={tabBtn(tab === t.id)}>{t.label}</button>
              ))}
            </div>
          )}
        </div>
        <div>
          {session ? (
            <button onClick={() => supabase.auth.signOut()} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 4, padding: "5px 14px", fontSize: 11, fontFamily: "'DM Mono', monospace", cursor: "pointer", letterSpacing: "0.06em" }}>Sign Out</button>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background: C.accent, color: C.bg, border: "none", borderRadius: 4, padding: "7px 18px", fontSize: 12, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase" }}>Log In</button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 4vw" }}>
        {!session ? (
          <div style={{ textAlign: "center", padding: "120px 0" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 64, fontWeight: 800, color: C.white, letterSpacing: "-0.01em", lineHeight: 1 }}>BIG GREEN</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 64, fontWeight: 800, color: C.accent, letterSpacing: "-0.01em", lineHeight: 1 }}>MACHINE</div>
            <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: C.muted, letterSpacing: "0.15em", marginTop: 16, textTransform: "uppercase" }}>Dynasty Franchise Headquarters</div>
            <button onClick={() => setShowAuth(true)} style={{ background: C.accent, color: C.bg, border: "none", borderRadius: 4, padding: "14px 36px", fontSize: 14, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", cursor: "pointer", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 32, boxShadow: `0 0 32px ${C.accentGlow}` }}>Enter HQ</button>
          </div>
        ) : !dataLoaded ? (
          <Spinner label="Pulling franchise data from Sleeper…" />
        ) : (
          <>
            {tab === "home" && <HomeTab leagueData={leagueData} rosters={rosters} users={users} myRoster={myRoster} myUser={myUser} nflState={nflState} />}
            {tab === "roster" && <RosterTab myRoster={myRoster} allPlayers={allPlayers} nflState={nflState} />}
            {tab === "watchlist" && <WatchListTab allPlayers={allPlayers} myRoster={myRoster} />}
            {tab === "rookiedraft" && <RookieDraftTab allPlayers={allPlayers} />}
            {tab === "history" && <LeagueHistoryTab rosters={rosters} users={users} />}
          </>
        )}
      </div>
    </div>
  );
}