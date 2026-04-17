import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Auth middleware ────────────────────────────────────────────────────────────
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid token" });
  req.user = user;
  next();
}

// ── Notes / Watch List (persisted per user in Supabase) ───────────────────────
// The app primarily uses Sleeper's API directly from the client (it's public/read-only).
// This server handles any user-specific persisted data.

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Optional: persist watchlist/rookie board server-side (currently handled client-side)
// You can expand this later to store watchlist and rookie board in Supabase

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`BGM HQ server running on port ${PORT}`));
