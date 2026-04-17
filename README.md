# 🏈 BGM HQ — Big Green Machine Dynasty Headquarters

A private, invite-only franchise dashboard pulling live data from your Sleeper dynasty league. Built with React + Vite + Supabase, deployed on Vercel.

---

## Prerequisites

Make sure you have these installed before starting:
- **Node.js** (v18 or later) — https://nodejs.org
- **Git** — https://git-scm.com
- A **GitHub** account — https://github.com
- A **Supabase** account (free) — https://supabase.com
- A **Vercel** account (free) — https://vercel.com

---

## Part 1 — Local Setup

### Step 1: Get the project onto your machine

```bash
cd bgm-hq
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Install dependencies
```bash
npm install
```
Installs React, Vite, Supabase client, Express, and everything else. Takes ~30 seconds.

### Step 3: Create your environment file
```bash
cp .env.example .env
```
Leave this open — you'll fill in the values in Part 2.

---

## Part 2 — Supabase Setup (Auth)

Supabase handles your login system. Nobody can access the app without an account you've manually created.

### Step 1: Create a Supabase project
1. Go to https://supabase.com and sign in
2. Click **New Project**
3. Name it `bgm-hq`, set a database password, pick a region near you
4. Click **Create new project** — takes ~1 minute

### Step 2: Get your API keys
1. In your project dashboard → **Settings** (gear icon, bottom-left) → **API**
2. Copy three things:
   - **Project URL** — e.g. `https://abcdefghijkl.supabase.co`
   - **anon public** key — long string under "Project API keys"
   - **service_role** key — click "Reveal" (keep this secret — server-side only)

3. Fill in your `.env`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 3: Configure auth settings
1. **Authentication** (left sidebar) → **Settings**
2. Under **User Signups**: turn off **"Enable sign ups"** — prevents self-registration
3. Under **Email Auth**: turn off **"Confirm email"** — simplifies the invite flow
4. Click **Save**

### Step 4: Create your own account
1. **Authentication → Users → Add user → Create new user**
2. Enter your email and a password → **Create user**

### Step 5: Invite other users
Repeat Step 4 for each person you want to give access. Share their temporary password with them directly.

> No database tables needed — Sleeper data comes from their public API, and the watch list / rookie board live in localStorage for now.

---

## Part 3 — Run Locally

```bash
npm run dev
```

Starts two things simultaneously:
- **Vite** at http://localhost:5173 — React frontend
- **Express** at http://localhost:3001 — backend API

Open http://localhost:5173, click **Enter HQ**, and log in with your Supabase credentials.

---

## Part 4 — Deploy to Vercel

### Step 1: Push to GitHub
```bash
# Create a new repo at github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/bgm-hq.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel
1. Go to https://vercel.com → **Add New → Project**
2. Find your `bgm-hq` GitHub repo → **Import**
3. On the configure screen, Vercel should auto-detect Vite. Leave defaults as-is.
4. **Don't deploy yet** — do Step 3 first

### Step 3: Add environment variables
In the same configure screen, scroll to **Environment Variables** and add all four:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_URL` | Your Supabase project URL (same) |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |

### Step 4: Deploy
Click **Deploy**. Builds in ~60 seconds. You'll get a live URL like `https://bgm-hq-abc123.vercel.app`.

---

## Part 5 — Updating the App

Any time you change code locally:
```bash
git add .
git commit -m "describe your change"
git push
```
Vercel auto-detects the push and redeploys in ~60 seconds.

---

## League Configuration

At the top of `src/App.jsx`:

```js
const LEAGUE_IDS = {
  2024: "1099477523693473792",
  2025: "1182397104202231808",
  2026: "1314366510466076672",
};
const SLEEPER_USERNAME = "LukeWickham";
const CURRENT_YEAR = 2025;   // ← bump this each season
```

Each August when a new Sleeper league is created, add the new ID here and update `CURRENT_YEAR`.

---

## App Tabs

| Tab | What it does |
|-----|-------------|
| **Home** | Franchise header, current matchup score, full league standings |
| **Roster** | Starters / bench / taxi / IR — position, team, age, experience, injury status |
| **Watch List** | Personal trade board — search any player, tag BUY / WATCH / SELL, add notes |
| **Rookie Draft** | Your ranking board — tiers, target rounds, scouting notes, drag to reorder |
| **League History** | All-time records across seasons + season-by-season breakdown per manager |

---

## Troubleshooting

**"Invalid API key" on login** — double-check `.env` values match Supabase Settings → API exactly. No trailing spaces.

**Blank screen after login** — open DevTools (F12) → Console. Most likely a wrong Supabase URL (needs the `https://` prefix).

**Players loading slowly** — the Sleeper `/players/nfl` endpoint is ~5MB. Normal on first load. If it consistently errors, check the Network tab.

**"Unauthorized" locally** — make sure both Vite and Express started (you should see both in terminal output). Port 3001 may be in use — kill other processes or change the port in `server.js`.

**Vercel build fails** — check build logs in Vercel dashboard. Common fixes: verify all 4 env vars are set, and set Node.js version to 18 in Vercel → Project Settings → General.# BGM-HQ
