# Global stats backend — design

Date: 2026-08-19

## Purpose

Cosmodle is a static, client-only Vite/React app today (see `src/lib/statistics.ts`, `src/lib/gameState.ts`) — personal stats (streak, win rate, guess distribution) are computed entirely from `localStorage`. There is no way to know how many people play, aggregate win rates, or global guess distribution, and personal stats don't survive a cache clear or new device.

This adds a minimal backend so:
- Site owner can see aggregate stats (total players, plays today, win rate, guess distribution).
- Players get a public stats page showing those aggregates (Wordle-style).
- Personal stats sync server-side under an anonymous per-browser UUID, surviving a cache clear.

No accounts, no auth for players. Aggregate data only — no individual player identities exposed publicly.

## Architecture

Cloudflare Pages Functions (`functions/api/*.ts`) + D1, added to the same Pages project that already hosts the static build. No new deploy target, no separate service.

## Schema

Single table, one row per player per day — everything else (streaks, totals, win rate, distribution) is derived from it via SQL aggregates on read. No cached counters table, so nothing can drift out of sync with raw data. Traffic volume is small (indie daily game), so query-on-read is cheap enough.

```sql
CREATE TABLE results (
  uuid TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  won INTEGER NOT NULL,
  guess_count INTEGER NOT NULL,
  hints_used INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (uuid, day_number)
);
```

## Endpoints

- **`POST /api/result`** — body `{uuid, dayNumber, won, guessCount, hintsUsed}`.
  - Validates `dayNumber` is within ±1 of the server's own computed current day number (same math as `daysSinceEpoch` in `src/lib/dailyObject.ts`, against `LAUNCH_DATE`) and `guessCount` is 1-7. Rejects anything outside that range.
  - `INSERT OR IGNORE` — the `(uuid, day_number)` primary key dedupes replayed/duplicate submissions.
  - Returns that player's derived stats (`gamesPlayed`, `wins`, `currentStreak`, `longestStreak`, `guessDistribution`) computed from their full row history.

- **`GET /api/player/:uuid`** — same derived-stats shape as above, for hydrating stats on load or a new device.

- **`GET /api/stats`** — global aggregates: `totalPlayers` (`COUNT(DISTINCT uuid)`), `playedToday` (`COUNT(DISTINCT uuid) WHERE day_number = today`), `winRate`, global `guessDistribution`. Served with a short `Cache-Control` since it's a full-table scan.

## Client integration

- On first load, generate `crypto.randomUUID()` and store it in `localStorage` as `celestial:playerId`.
- In `statistics.ts`, `recordDailyResult()` fires `POST /api/result` after writing local stats (fire-and-forget, non-blocking). On success, overwrite local `Statistics` with the server's response so the device stays in sync. On failure (offline), the existing local-only behavior is the fallback — no change to today's offline experience.
- `StatsPanel` fetches `GET /api/player/:uuid` on mount to reconcile (e.g. new device, cache cleared mid-streak); falls back silently to the local cache on error, no loading state.
- New `GlobalStatsPanel` (section or tab in the existing stats modal) fetches `GET /api/stats` and renders total players, played today, win rate, and a global guess-distribution bar chart, reusing the bar styling already in `StatsPanel`.

## Infra setup

- Requires creating a real D1 database (`wrangler d1 create cosmodle`) and a `wrangler.toml` binding — a cloud resource, confirm with the user before running.
- `functions/api/*.ts` developed/tested locally via `wrangler pages dev --local` against a local D1 sqlite instance, no cloud calls needed in the dev loop.

## Testing

- Unit tests (vitest, same pattern as `statistics.test.ts`) for the derive-stats logic (streak calculation from a row history).
- Manual check: play a day, confirm the row lands in D1, confirm `/api/stats` numbers update, confirm a second "device" (same UUID pasted into localStorage) shows the synced streak.

## Out of scope

- Accounts/auth of any kind.
- Individual player leaderboards or exposing per-player identity publicly.
- Full global streak-distribution histogram (deferred — `/api/stats` covers totals/win-rate/guess-distribution only; can be added later if wanted).
