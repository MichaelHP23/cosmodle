# Global Stats Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Cloudflare Pages Functions + D1 backend so Cosmodle can track anonymous per-player streaks server-side and show a public global stats page (total players, win rate, guess distribution).

**Architecture:** Cloudflare Pages Functions (`functions/api/*.ts`) added to the existing static Pages project, backed by a D1 table of one row per player-per-day. All derived numbers (streaks, totals, win rate, distribution) are computed on read from that raw table — no cached counters. Client generates a random UUID on first load, stored in `localStorage`, sent with every result. No accounts, no auth.

**Tech Stack:** Cloudflare Pages Functions, Cloudflare D1 (SQLite), Wrangler CLI, existing React 19 + TypeScript + Vite + Vitest stack.

**Spec:** `docs/superpowers/specs/2026-08-19-global-stats-backend-design.md`

## Global Constraints

- No accounts or auth of any kind — player identity is a random `crypto.randomUUID()` in `localStorage`.
- No individual player identity or per-player data is ever exposed in a public response — `/api/stats` returns aggregates only.
- Day numbering epoch is `LAUNCH_DATE = new Date(2026, 7, 18)` (Aug 18, 2026), matching `src/lib/dailyObject.ts`. Day 1 = launch date. Server-side day-number validation allows ±1 day of drift (client uses local calendar day, server uses UTC calendar day).
- `MAX_GUESSES = 7` and `MAX_HINTS = 3` (from `src/lib/gameState.ts`) are the bounds for guess-count validation and streak eligibility, respectively. Do not hardcode different values.
- Server sync is fire-and-forget and must never block gameplay UI. On network failure, existing local-only behavior is the fallback — no error shown to the player.
- Hydrating stats from the server must never regress a player's locally-displayed stats (a pre-existing local player with no server rows yet must keep seeing their local stats, not get wiped to zero).

---

## Task 1: Infra scaffolding — wrangler.toml, D1 migration, functions tsconfig

**Files:**
- Create: `wrangler.toml`
- Create: `migrations/0001_create_results.sql`
- Create: `functions/tsconfig.json`
- Modify: `package.json` (add `wrangler`, `@cloudflare/workers-types` devDependencies; add `dev:api` and `typecheck:functions` scripts)

**Interfaces:**
- Produces: D1 binding named `DB` (used by every Function in later tasks via `interface Env { DB: D1Database }`), and a `results` table with columns `uuid, day_number, won, guess_count, hints_used, created_at`.

- [ ] **Step 1: Install dependencies**

```bash
npm install -D wrangler @cloudflare/workers-types
```

- [ ] **Step 2: Write the migration**

Create `migrations/0001_create_results.sql`:

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

- [ ] **Step 3: Create the D1 database (requires user confirmation)**

This creates a real cloud resource in the user's Cloudflare account. Stop and confirm with the user before running it, even if the rest of this plan is being executed autonomously.

```bash
npx wrangler d1 create cosmodle
```

Copy the `database_id` from the command output for the next step.

- [ ] **Step 4: Write wrangler.toml**

Create `wrangler.toml` (fill in the real `database_id` from Step 3):

```toml
name = "cosmodle"
pages_build_output_dir = "dist"
compatibility_date = "2026-08-19"

[[d1_databases]]
binding = "DB"
database_name = "cosmodle"
database_id = "REPLACE_WITH_DATABASE_ID_FROM_STEP_3"
```

- [ ] **Step 5: Apply the migration locally and remotely**

```bash
npx wrangler d1 migrations apply cosmodle --local
npx wrangler d1 migrations apply cosmodle --remote
```

Expected: both report the `0001_create_results.sql` migration applied.

- [ ] **Step 6: Verify the local table exists**

```bash
npx wrangler d1 execute cosmodle --local --command "SELECT name FROM sqlite_master WHERE type='table'"
```

Expected: output includes `results`.

- [ ] **Step 7: Write functions/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "es2023",
    "lib": ["ES2023"],
    "types": ["@cloudflare/workers-types"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts"]
}
```

- [ ] **Step 8: Add package.json scripts**

Modify `package.json` `scripts` block to add:

```json
"dev:api": "wrangler pages dev --proxy 5173 -- npm run dev",
"typecheck:functions": "tsc --noEmit -p functions/tsconfig.json"
```

- [ ] **Step 9: Commit**

```bash
git add wrangler.toml migrations/0001_create_results.sql functions/tsconfig.json package.json package-lock.json
git commit -m "chore: scaffold D1 database and Pages Functions infra"
```

---

## Task 2: Extract pure statistics core and history-derivation logic

**Files:**
- Create: `src/lib/statisticsCore.ts`
- Create: `src/lib/statisticsCore.test.ts`
- Modify: `src/lib/statistics.ts`

**Interfaces:**
- Produces: `Statistics` type, `DailyResult` type (`{ dayNumber: number; won: boolean; guessCount: number; hintsUsed: number }`), `ZERO_STATISTICS`, `applyResult(previous: Statistics, dayNumber: number, won: boolean, guessCount: number, hintsUsed: number): Statistics`, `deriveStatsFromResults(results: DailyResult[]): Statistics`, `getWinPercentage(stats: Statistics): number` — all from `statisticsCore.ts`, all pure (no `localStorage`, no DOM lib dependency), safe to import from Cloudflare Functions code.
- `statistics.ts` keeps its existing public API (`getStatistics`, `recordDailyResult`, `getWinPercentage`, `Statistics` type) unchanged for existing callers (`GameBoard.tsx`, `statistics.test.ts`), plus a new `applyServerStatistics(stats: Statistics): Statistics`.

- [ ] **Step 1: Write the failing test for deriveStatsFromResults**

Create `src/lib/statisticsCore.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { deriveStatsFromResults } from "./statisticsCore"

describe("deriveStatsFromResults", () => {
  it("returns zeroed stats for an empty history", () => {
    expect(deriveStatsFromResults([])).toEqual({
      gamesPlayed: 0,
      wins: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastDayNumber: null,
      guessDistribution: [0, 0, 0, 0, 0, 0, 0],
    })
  })

  it("replays out-of-order history sorted by day number", () => {
    const stats = deriveStatsFromResults([
      { dayNumber: 2, won: true, guessCount: 2, hintsUsed: 0 },
      { dayNumber: 1, won: true, guessCount: 3, hintsUsed: 0 },
    ])
    expect(stats.gamesPlayed).toBe(2)
    expect(stats.wins).toBe(2)
    expect(stats.currentStreak).toBe(2)
    expect(stats.longestStreak).toBe(2)
    expect(stats.lastDayNumber).toBe(2)
    expect(stats.guessDistribution).toEqual([0, 1, 1, 0, 0, 0, 0])
  })

  it("breaks the streak on a gap day and on a loss", () => {
    const stats = deriveStatsFromResults([
      { dayNumber: 1, won: true, guessCount: 1, hintsUsed: 0 },
      { dayNumber: 2, won: true, guessCount: 1, hintsUsed: 0 },
      { dayNumber: 4, won: true, guessCount: 1, hintsUsed: 0 },
      { dayNumber: 5, won: false, guessCount: 7, hintsUsed: 0 },
    ])
    expect(stats.currentStreak).toBe(0)
    expect(stats.longestStreak).toBe(2)
    expect(stats.gamesPlayed).toBe(4)
    expect(stats.wins).toBe(3)
  })

  it("does not extend the streak when all hints were used", () => {
    const stats = deriveStatsFromResults([
      { dayNumber: 1, won: true, guessCount: 4, hintsUsed: 3 },
    ])
    expect(stats.currentStreak).toBe(0)
    expect(stats.wins).toBe(1)
  })

  it("ignores a duplicate row for a day already applied", () => {
    const stats = deriveStatsFromResults([
      { dayNumber: 1, won: true, guessCount: 1, hintsUsed: 0 },
      { dayNumber: 1, won: false, guessCount: 7, hintsUsed: 0 },
    ])
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.wins).toBe(1)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/statisticsCore.test.ts`
Expected: FAIL — `src/lib/statisticsCore.ts` does not exist yet.

- [ ] **Step 3: Write statisticsCore.ts**

Create `src/lib/statisticsCore.ts`:

```ts
import { MAX_HINTS } from "./gameState"

export type Statistics = {
  gamesPlayed: number
  wins: number
  currentStreak: number
  longestStreak: number
  lastDayNumber: number | null
  guessDistribution: number[]
}

export type DailyResult = {
  dayNumber: number
  won: boolean
  guessCount: number
  hintsUsed: number
}

const MAX_GUESSES_FOR_DISTRIBUTION = 7

export const ZERO_STATISTICS: Statistics = {
  gamesPlayed: 0,
  wins: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastDayNumber: null,
  guessDistribution: new Array(MAX_GUESSES_FOR_DISTRIBUTION).fill(0),
}

export function applyResult(
  previous: Statistics,
  dayNumber: number,
  won: boolean,
  guessCount: number,
  hintsUsed: number
): Statistics {
  const streakEligible = won && hintsUsed < MAX_HINTS
  const currentStreak = streakEligible
    ? (previous.lastDayNumber === dayNumber - 1 ? previous.currentStreak + 1 : 1)
    : 0
  const guessDistribution = [...previous.guessDistribution]
  if (won) guessDistribution[guessCount - 1] += 1

  return {
    gamesPlayed: previous.gamesPlayed + 1,
    wins: previous.wins + (won ? 1 : 0),
    currentStreak,
    longestStreak: Math.max(previous.longestStreak, currentStreak),
    lastDayNumber: dayNumber,
    guessDistribution,
  }
}

export function deriveStatsFromResults(results: DailyResult[]): Statistics {
  const sorted = [...results].sort((a, b) => a.dayNumber - b.dayNumber)
  let stats = ZERO_STATISTICS
  for (const r of sorted) {
    if (stats.lastDayNumber === r.dayNumber) continue
    stats = applyResult(stats, r.dayNumber, r.won, r.guessCount, r.hintsUsed)
  }
  return stats
}

export function getWinPercentage(stats: Statistics): number {
  if (stats.gamesPlayed === 0) return 0
  return Math.round((stats.wins / stats.gamesPlayed) * 100)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/statisticsCore.test.ts`
Expected: PASS (all 5 cases)

- [ ] **Step 5: Refactor statistics.ts to use statisticsCore**

Replace the full contents of `src/lib/statistics.ts` with:

```ts
import { ZERO_STATISTICS, applyResult } from "./statisticsCore"
import type { Statistics } from "./statisticsCore"

export type { Statistics, DailyResult } from "./statisticsCore"
export { deriveStatsFromResults, getWinPercentage } from "./statisticsCore"

const STORAGE_KEY = "celestial:statistics"

export function getStatistics(): Statistics {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return ZERO_STATISTICS
  try {
    const parsed = JSON.parse(raw)
    return { ...ZERO_STATISTICS, ...parsed }
  } catch {
    return ZERO_STATISTICS
  }
}

export function recordDailyResult(dayNumber: number, won: boolean, guessCount: number, hintsUsed: number = 0): Statistics {
  const previous = getStatistics()
  if (previous.lastDayNumber === dayNumber) return previous
  const next = applyResult(previous, dayNumber, won, guessCount, hintsUsed)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function applyServerStatistics(stats: Statistics): Statistics {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  return stats
}
```

- [ ] **Step 6: Run the full existing statistics test suite to verify no regression**

Run: `npx vitest run src/lib/statistics.test.ts`
Expected: PASS — all pre-existing tests pass unchanged (behavior is identical, only factored differently).

- [ ] **Step 7: Commit**

```bash
git add src/lib/statisticsCore.ts src/lib/statisticsCore.test.ts src/lib/statistics.ts
git commit -m "refactor: extract pure statistics core for history-derived stats"
```

---

## Task 3: Shared Functions helpers — validation, day number, response, row mapping

**Files:**
- Create: `functions/_shared/validate.ts`
- Create: `functions/_shared/validate.test.ts`
- Create: `functions/_shared/dayNumber.ts`
- Create: `functions/_shared/dayNumber.test.ts`
- Create: `functions/_shared/response.ts`
- Create: `functions/_shared/rows.ts`
- Create: `functions/_shared/guessDistribution.ts`
- Create: `functions/_shared/guessDistribution.test.ts`

**Interfaces:**
- Consumes: `MAX_GUESSES` from `src/lib/gameState.ts`; `DailyResult` type from `src/lib/statisticsCore.ts`.
- Produces: `isValidUuid(value: unknown): value is string`, `isValidGuessCount(value: unknown): value is number`, `currentDayNumber(now?: Date): number`, `isValidDayNumber(dayNumber: unknown, now?: Date): boolean`, `json(data: unknown, status?: number, headers?: Record<string,string>): Response`, `rowsToResults(rows: ResultRow[]): DailyResult[]` with `ResultRow = { day_number: number; won: number; guess_count: number; hints_used: number }`, `buildGuessDistribution(rows: { guess_count: number }[], maxGuesses: number): number[]` — all consumed by Task 4-6 handlers.

- [ ] **Step 1: Write the failing tests for validate.ts**

Create `functions/_shared/validate.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { isValidUuid, isValidGuessCount } from "./validate"

describe("isValidUuid", () => {
  it("accepts a well-formed v4-shaped uuid", () => {
    expect(isValidUuid("110e8400-e29b-41d4-a716-446655440000")).toBe(true)
  })
  it("rejects non-uuid strings", () => {
    expect(isValidUuid("not-a-uuid")).toBe(false)
  })
  it("rejects non-strings", () => {
    expect(isValidUuid(123)).toBe(false)
    expect(isValidUuid(undefined)).toBe(false)
    expect(isValidUuid(["a"])).toBe(false)
  })
})

describe("isValidGuessCount", () => {
  it("accepts integers 1 through 7", () => {
    expect(isValidGuessCount(1)).toBe(true)
    expect(isValidGuessCount(7)).toBe(true)
  })
  it("rejects 0, 8, and non-integers", () => {
    expect(isValidGuessCount(0)).toBe(false)
    expect(isValidGuessCount(8)).toBe(false)
    expect(isValidGuessCount(2.5)).toBe(false)
    expect(isValidGuessCount("3")).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run functions/_shared/validate.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write validate.ts**

Create `functions/_shared/validate.ts`:

```ts
import { MAX_GUESSES } from "../../src/lib/gameState"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value)
}

export function isValidGuessCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_GUESSES
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run functions/_shared/validate.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing tests for dayNumber.ts**

Create `functions/_shared/dayNumber.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { currentDayNumber, isValidDayNumber } from "./dayNumber"

describe("currentDayNumber", () => {
  it("returns 1 on launch day", () => {
    expect(currentDayNumber(new Date(Date.UTC(2026, 7, 18)))).toBe(1)
  })
  it("returns 2 the day after launch", () => {
    expect(currentDayNumber(new Date(Date.UTC(2026, 7, 19)))).toBe(2)
  })
})

describe("isValidDayNumber", () => {
  const now = new Date(Date.UTC(2026, 7, 19)) // day number 2

  it("accepts today's day number", () => {
    expect(isValidDayNumber(2, now)).toBe(true)
  })
  it("accepts one day of drift either direction", () => {
    expect(isValidDayNumber(1, now)).toBe(true)
    expect(isValidDayNumber(3, now)).toBe(true)
  })
  it("rejects more than one day of drift", () => {
    expect(isValidDayNumber(4, now)).toBe(false)
    expect(isValidDayNumber(-1, now)).toBe(false)
  })
  it("rejects non-integers", () => {
    expect(isValidDayNumber(2.5, now)).toBe(false)
    expect(isValidDayNumber("2", now)).toBe(false)
  })
})
```

- [ ] **Step 6: Run to verify failure**

Run: `npx vitest run functions/_shared/dayNumber.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 7: Write dayNumber.ts**

Create `functions/_shared/dayNumber.ts`:

```ts
const LAUNCH_DATE_UTC = Date.UTC(2026, 7, 18)
const MS_PER_DAY = 24 * 60 * 60 * 1000

export function currentDayNumber(now: Date = new Date()): number {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.round((todayUtc - LAUNCH_DATE_UTC) / MS_PER_DAY) + 1
}

export function isValidDayNumber(dayNumber: unknown, now: Date = new Date()): boolean {
  if (typeof dayNumber !== "number" || !Number.isInteger(dayNumber)) return false
  return Math.abs(dayNumber - currentDayNumber(now)) <= 1
}
```

- [ ] **Step 8: Run to verify pass**

Run: `npx vitest run functions/_shared/dayNumber.test.ts`
Expected: PASS

- [ ] **Step 9: Write the failing tests for guessDistribution.ts**

Create `functions/_shared/guessDistribution.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { buildGuessDistribution } from "./guessDistribution"

describe("buildGuessDistribution", () => {
  it("counts wins into their guess-count slot", () => {
    const dist = buildGuessDistribution(
      [{ guess_count: 1 }, { guess_count: 3 }, { guess_count: 3 }],
      7
    )
    expect(dist).toEqual([1, 0, 2, 0, 0, 0, 0])
  })
  it("returns all zeros for no rows", () => {
    expect(buildGuessDistribution([], 7)).toEqual([0, 0, 0, 0, 0, 0, 0])
  })
  it("ignores out-of-range guess counts", () => {
    expect(buildGuessDistribution([{ guess_count: 0 }, { guess_count: 9 }], 7)).toEqual([0, 0, 0, 0, 0, 0, 0])
  })
})
```

- [ ] **Step 10: Run to verify failure**

Run: `npx vitest run functions/_shared/guessDistribution.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 11: Write guessDistribution.ts**

Create `functions/_shared/guessDistribution.ts`:

```ts
export function buildGuessDistribution(rows: { guess_count: number }[], maxGuesses: number): number[] {
  const distribution = new Array(maxGuesses).fill(0)
  for (const row of rows) {
    if (row.guess_count >= 1 && row.guess_count <= maxGuesses) {
      distribution[row.guess_count - 1] += 1
    }
  }
  return distribution
}
```

- [ ] **Step 12: Run to verify pass**

Run: `npx vitest run functions/_shared/guessDistribution.test.ts`
Expected: PASS

- [ ] **Step 13: Write response.ts (no test — trivial pass-through)**

Create `functions/_shared/response.ts`:

```ts
export function json(data: unknown, status: number = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...headers },
  })
}
```

- [ ] **Step 14: Write rows.ts (no test — trivial mapping)**

Create `functions/_shared/rows.ts`:

```ts
import type { DailyResult } from "../../src/lib/statisticsCore"

export type ResultRow = {
  day_number: number
  won: number
  guess_count: number
  hints_used: number
}

export function rowsToResults(rows: ResultRow[]): DailyResult[] {
  return rows.map(r => ({
    dayNumber: r.day_number,
    won: r.won === 1,
    guessCount: r.guess_count,
    hintsUsed: r.hints_used,
  }))
}
```

- [ ] **Step 15: Commit**

```bash
git add functions/_shared
git commit -m "feat: add shared validation, day-number, and response helpers for Functions"
```

---

## Task 4: POST /api/result

**Files:**
- Create: `functions/api/result.ts`

**Interfaces:**
- Consumes: `isValidUuid`, `isValidGuessCount` from `functions/_shared/validate.ts`; `isValidDayNumber` from `functions/_shared/dayNumber.ts`; `json` from `functions/_shared/response.ts`; `rowsToResults`, `ResultRow` from `functions/_shared/rows.ts`; `deriveStatsFromResults` from `src/lib/statisticsCore.ts`.
- Produces: `POST /api/result` — request body `{uuid: string, dayNumber: number, won: boolean, guessCount: number, hintsUsed?: number}`, response body is a `Statistics` JSON object (200) or `{error: string}` (400).

- [ ] **Step 1: Write result.ts**

Create `functions/api/result.ts`:

```ts
import { isValidUuid, isValidGuessCount } from "../_shared/validate"
import { isValidDayNumber } from "../_shared/dayNumber"
import { json } from "../_shared/response"
import { rowsToResults, type ResultRow } from "../_shared/rows"
import { deriveStatsFromResults } from "../../src/lib/statisticsCore"

interface Env {
  DB: D1Database
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || !isValidUuid(body.uuid)) return json({ error: "invalid_uuid" }, 400)
  if (!isValidDayNumber(body.dayNumber)) return json({ error: "invalid_day_number" }, 400)
  if (!isValidGuessCount(body.guessCount)) return json({ error: "invalid_guess_count" }, 400)
  if (typeof body.won !== "boolean") return json({ error: "invalid_won" }, 400)
  const hintsUsed = typeof body.hintsUsed === "number" && Number.isInteger(body.hintsUsed) ? body.hintsUsed : 0

  await env.DB.prepare(
    "INSERT OR IGNORE INTO results (uuid, day_number, won, guess_count, hints_used, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(body.uuid, body.dayNumber, body.won ? 1 : 0, body.guessCount, hintsUsed, Date.now())
    .run()

  const { results } = await env.DB.prepare(
    "SELECT day_number, won, guess_count, hints_used FROM results WHERE uuid = ? ORDER BY day_number ASC"
  )
    .bind(body.uuid)
    .all<ResultRow>()

  return json(deriveStatsFromResults(rowsToResults(results ?? [])))
}
```

- [ ] **Step 2: Typecheck the Functions directory**

Run: `npm run typecheck:functions`
Expected: no errors.

- [ ] **Step 3: Manual verification with wrangler pages dev**

```bash
npm run build
npx wrangler pages dev dist --local
```

In another terminal, with the dev server running:

```bash
curl -X POST http://localhost:8788/api/result \
  -H "content-type: application/json" \
  -d '{"uuid":"110e8400-e29b-41d4-a716-446655440000","dayNumber":1,"won":true,"guessCount":3,"hintsUsed":0}'
```

Expected: JSON response with `gamesPlayed: 1, wins: 1, currentStreak: 1, longestStreak: 1, lastDayNumber: 1, guessDistribution: [0,0,1,0,0,0,0]`.

Verify the row landed in D1:

```bash
npx wrangler d1 execute cosmodle --local --command "SELECT * FROM results"
```

Expected: one row with the submitted values. Re-run the same `curl` command — the response should be identical (idempotent, duplicate ignored by the primary key).

- [ ] **Step 4: Commit**

```bash
git add functions/api/result.ts
git commit -m "feat: add POST /api/result endpoint"
```

---

## Task 5: GET /api/player/:uuid

**Files:**
- Create: `functions/api/player/[uuid].ts`

**Interfaces:**
- Consumes: same helpers as Task 4.
- Produces: `GET /api/player/:uuid` — response body is a `Statistics` JSON object (200) or `{error: string}` (400).

- [ ] **Step 1: Write the handler**

Create `functions/api/player/[uuid].ts`:

```ts
import { isValidUuid } from "../../_shared/validate"
import { json } from "../../_shared/response"
import { rowsToResults, type ResultRow } from "../../_shared/rows"
import { deriveStatsFromResults } from "../../../src/lib/statisticsCore"

interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const uuid = params.uuid
  if (!isValidUuid(uuid)) return json({ error: "invalid_uuid" }, 400)

  const { results } = await env.DB.prepare(
    "SELECT day_number, won, guess_count, hints_used FROM results WHERE uuid = ? ORDER BY day_number ASC"
  )
    .bind(uuid)
    .all<ResultRow>()

  return json(deriveStatsFromResults(rowsToResults(results ?? [])))
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck:functions`
Expected: no errors.

- [ ] **Step 3: Manual verification**

With `wrangler pages dev dist --local` running (from Task 4, or restart it):

```bash
curl http://localhost:8788/api/player/110e8400-e29b-41d4-a716-446655440000
```

Expected: same `Statistics` shape as the POST response from Task 4's verification, reflecting the row already inserted.

```bash
curl http://localhost:8788/api/player/not-a-uuid
```

Expected: `400` with `{"error":"invalid_uuid"}`.

- [ ] **Step 4: Commit**

```bash
git add "functions/api/player/[uuid].ts"
git commit -m "feat: add GET /api/player/:uuid endpoint"
```

---

## Task 6: GET /api/stats

**Files:**
- Create: `functions/api/stats.ts`

**Interfaces:**
- Consumes: `json` from `functions/_shared/response.ts`; `buildGuessDistribution` from `functions/_shared/guessDistribution.ts`; `currentDayNumber` from `functions/_shared/dayNumber.ts`; `MAX_GUESSES` from `src/lib/gameState.ts`.
- Produces: `GET /api/stats` — response body `{totalPlayers: number, playedToday: number, winRate: number, guessDistribution: number[]}` (200), cached 60s.

- [ ] **Step 1: Write the handler**

Create `functions/api/stats.ts`:

```ts
import { json } from "../_shared/response"
import { buildGuessDistribution } from "../_shared/guessDistribution"
import { currentDayNumber } from "../_shared/dayNumber"
import { MAX_GUESSES } from "../../src/lib/gameState"

interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const today = currentDayNumber()

  const totalPlayersRow = await env.DB.prepare("SELECT COUNT(DISTINCT uuid) as n FROM results").first<{ n: number }>()
  const playedTodayRow = await env.DB.prepare("SELECT COUNT(DISTINCT uuid) as n FROM results WHERE day_number = ?")
    .bind(today)
    .first<{ n: number }>()
  const winRow = await env.DB.prepare("SELECT SUM(won) as wins, COUNT(*) as total FROM results").first<{
    wins: number | null
    total: number
  }>()
  const { results: wonRows } = await env.DB.prepare("SELECT guess_count FROM results WHERE won = 1").all<{
    guess_count: number
  }>()

  const totalGames = winRow?.total ?? 0
  const totalWins = winRow?.wins ?? 0

  return json(
    {
      totalPlayers: totalPlayersRow?.n ?? 0,
      playedToday: playedTodayRow?.n ?? 0,
      winRate: totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0,
      guessDistribution: buildGuessDistribution(wonRows ?? [], MAX_GUESSES),
    },
    200,
    { "Cache-Control": "public, max-age=60" }
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck:functions`
Expected: no errors.

- [ ] **Step 3: Manual verification**

```bash
curl http://localhost:8788/api/stats
```

Expected: `{"totalPlayers":1,"playedToday":1,"winRate":100,"guessDistribution":[0,0,1,0,0,0,0]}` (matching the row inserted during Task 4/5 verification), with a `Cache-Control: public, max-age=60` response header.

- [ ] **Step 4: Commit**

```bash
git add functions/api/stats.ts
git commit -m "feat: add GET /api/stats endpoint"
```

---

## Task 7: Client player ID and API wrappers

**Files:**
- Create: `src/lib/playerId.ts`
- Create: `src/lib/playerId.test.ts`
- Create: `src/lib/api.ts`
- Create: `src/lib/api.test.ts`

**Interfaces:**
- Produces: `getOrCreatePlayerId(): string`; `postResult(uuid: string, dayNumber: number, won: boolean, guessCount: number, hintsUsed: number): Promise<Statistics | null>`; `getPlayerStats(uuid: string): Promise<Statistics | null>`; `getGlobalStats(): Promise<GlobalStats | null>` with `GlobalStats = {totalPlayers: number, playedToday: number, winRate: number, guessDistribution: number[]}` — consumed by Task 8 and 9.

- [ ] **Step 1: Write the failing test for playerId.ts**

Create `src/lib/playerId.test.ts`:

```ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest"
import { getOrCreatePlayerId } from "./playerId"

beforeEach(() => {
  localStorage.clear()
})

describe("getOrCreatePlayerId", () => {
  it("creates and persists a uuid on first call", () => {
    const id = getOrCreatePlayerId()
    expect(id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(localStorage.getItem("celestial:playerId")).toBe(id)
  })

  it("returns the same id on subsequent calls", () => {
    const first = getOrCreatePlayerId()
    const second = getOrCreatePlayerId()
    expect(second).toBe(first)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/playerId.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write playerId.ts**

Create `src/lib/playerId.ts`:

```ts
const STORAGE_KEY = "celestial:playerId"

export function getOrCreatePlayerId(): string {
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(STORAGE_KEY, id)
  return id
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/playerId.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing tests for api.ts**

Create `src/lib/api.test.ts`:

```ts
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest"
import { postResult, getPlayerStats, getGlobalStats } from "./api"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("postResult", () => {
  it("returns parsed stats on success", async () => {
    const stats = { gamesPlayed: 1, wins: 1, currentStreak: 1, longestStreak: 1, lastDayNumber: 1, guessDistribution: [0, 1, 0, 0, 0, 0, 0] }
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => stats }))
    const result = await postResult("uuid-1", 1, true, 2, 0)
    expect(result).toEqual(stats)
    expect(fetch).toHaveBeenCalledWith(
      "/api/result",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("returns null on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))
    expect(await postResult("uuid-1", 1, true, 2, 0)).toBeNull()
  })

  it("returns null when fetch throws (offline)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))
    expect(await postResult("uuid-1", 1, true, 2, 0)).toBeNull()
  })
})

describe("getPlayerStats", () => {
  it("returns null on failure instead of throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))
    expect(await getPlayerStats("uuid-1")).toBeNull()
  })
})

describe("getGlobalStats", () => {
  it("returns parsed global stats on success", async () => {
    const stats = { totalPlayers: 5, playedToday: 2, winRate: 80, guessDistribution: [0, 1, 2, 0, 0, 0, 0] }
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => stats }))
    expect(await getGlobalStats()).toEqual(stats)
  })
})
```

- [ ] **Step 6: Run to verify failure**

Run: `npx vitest run src/lib/api.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 7: Write api.ts**

Create `src/lib/api.ts`:

```ts
import type { Statistics } from "./statisticsCore"

export type GlobalStats = {
  totalPlayers: number
  playedToday: number
  winRate: number
  guessDistribution: number[]
}

export async function postResult(
  uuid: string,
  dayNumber: number,
  won: boolean,
  guessCount: number,
  hintsUsed: number
): Promise<Statistics | null> {
  try {
    const res = await fetch("/api/result", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ uuid, dayNumber, won, guessCount, hintsUsed }),
    })
    if (!res.ok) return null
    return (await res.json()) as Statistics
  } catch {
    return null
  }
}

export async function getPlayerStats(uuid: string): Promise<Statistics | null> {
  try {
    const res = await fetch(`/api/player/${uuid}`)
    if (!res.ok) return null
    return (await res.json()) as Statistics
  } catch {
    return null
  }
}

export async function getGlobalStats(): Promise<GlobalStats | null> {
  try {
    const res = await fetch("/api/stats")
    if (!res.ok) return null
    return (await res.json()) as GlobalStats
  } catch {
    return null
  }
}
```

- [ ] **Step 8: Run to verify pass**

Run: `npx vitest run src/lib/api.test.ts`
Expected: PASS (all 5 cases)

- [ ] **Step 9: Commit**

```bash
git add src/lib/playerId.ts src/lib/playerId.test.ts src/lib/api.ts src/lib/api.test.ts
git commit -m "feat: add anonymous player id and backend API client"
```

---

## Task 8: Wire sync and hydration into GameBoard

**Files:**
- Modify: `src/components/GameBoard.tsx`

**Interfaces:**
- Consumes: `getOrCreatePlayerId` from `src/lib/playerId.ts`; `postResult`, `getPlayerStats` from `src/lib/api.ts`; `applyServerStatistics` from `src/lib/statistics.ts` (already has `getStatistics`, `recordDailyResult` imported).

- [ ] **Step 1: Add imports**

In `src/components/GameBoard.tsx`, change:

```ts
import { getStatistics, recordDailyResult, type Statistics } from "../lib/statistics"
```

to:

```ts
import { getStatistics, recordDailyResult, applyServerStatistics, type Statistics } from "../lib/statistics"
import { getOrCreatePlayerId } from "../lib/playerId"
import { postResult, getPlayerStats } from "../lib/api"
```

- [ ] **Step 2: Add playerId and hydrate-on-mount effect**

In `GameBoard()`, after the `todayDayNumber` memo (line 34), add:

```ts
  const playerId = useMemo(() => getOrCreatePlayerId(), [])
```

After the existing `useEffect` blocks (after the archive-save effect, around line 58), add:

```ts
  useEffect(() => {
    getPlayerStats(playerId).then(server => {
      if (!server) return
      const local = getStatistics()
      if (server.gamesPlayed >= local.gamesPlayed) {
        setStatistics(applyServerStatistics(server))
      }
    })
  }, [playerId])
```

- [ ] **Step 3: Fire the sync POST after recording a daily result**

In `handleGuess`, replace:

```ts
      if (justEnded) {
        setStatistics(recordDailyResult(todayDayNumber, next.won, next.guessIds.length, next.hintsUsed))
        setShowResultModal(true)
      }
```

with:

```ts
      if (justEnded) {
        setStatistics(recordDailyResult(todayDayNumber, next.won, next.guessIds.length, next.hintsUsed))
        setShowResultModal(true)
        postResult(playerId, todayDayNumber, next.won, next.guessIds.length, next.hintsUsed).then(server => {
          if (server) setStatistics(applyServerStatistics(server))
        })
      }
```

- [ ] **Step 4: Typecheck and run the full test suite**

Run: `npm run build`
Expected: no type errors.

Run: `npx vitest run`
Expected: all existing tests still pass (no test targets `GameBoard.tsx` directly, matching the project's existing convention of testing only `src/lib/*`).

- [ ] **Step 5: Manual verification**

```bash
npm run build
npx wrangler pages dev dist --local
```

Open `http://localhost:8788` in a browser, play the daily puzzle to completion. Confirm:
- The result modal shows updated stats immediately (no lag waiting on network).
- `npx wrangler d1 execute cosmodle --local --command "SELECT * FROM results"` shows a new row for a fresh random UUID (check the browser's localStorage `celestial:playerId` key to confirm which one).
- Reload the page — stats still show correctly (hydrated from server, matching local).
- Open a second browser (or an incognito window), open devtools, and run `localStorage.setItem("celestial:playerId", "<uuid from the first browser>")` before loading the app. Load/reload the app there — confirm it shows the same streak as the first browser, proving server-side sync works across "devices."

- [ ] **Step 6: Commit**

```bash
git add src/components/GameBoard.tsx
git commit -m "feat: sync daily results to backend and hydrate stats on load"
```

---

## Task 9: Global stats modal

**Files:**
- Create: `src/components/GlobalStatsModal.tsx`
- Modify: `src/components/Footer.tsx`
- Modify: `src/components/GameBoard.tsx`

**Interfaces:**
- Consumes: `getGlobalStats`, `GlobalStats` from `src/lib/api.ts`.
- Produces: `GlobalStatsModal({ onClose: () => void })` component; `Footer` gains an `onGlobalStatsClick: () => void` prop.

- [ ] **Step 1: Write GlobalStatsModal.tsx**

Create `src/components/GlobalStatsModal.tsx`:

```tsx
import { useEffect, useState } from "react"
import { getGlobalStats, type GlobalStats } from "../lib/api"

function GlobalStatBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-extrabold text-[#1a1a1a]">{value}</div>
      <div className="text-xs uppercase tracking-wide text-[#4d4d4d]">{label}</div>
    </div>
  )
}

export function GlobalStatsModal({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    getGlobalStats().then(result => {
      if (result) setStats(result)
      else setLoadFailed(true)
    })
  }, [])

  const maxCount = Math.max(1, ...(stats?.guessDistribution ?? [1]))

  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto bg-black/50 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="mx-auto my-8 w-full max-w-md rounded-xl border-2 border-[#4d4d4d] bg-[#f7f7f7] p-6">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Global Stats</h2>
          <button className="text-[#8a8a8a] hover:text-[#4d4d4d]" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {loadFailed && <p className="text-sm text-[#4d4d4d]">Couldn't load stats right now. Try again later.</p>}

        {stats && (
          <>
            <div className="mb-3 flex items-center justify-center gap-6 rounded-lg border border-[#e0e0e0] bg-white py-3">
              <GlobalStatBlock value={stats.totalPlayers} label="Players" />
              <GlobalStatBlock value={stats.playedToday} label="Played Today" />
              <GlobalStatBlock value={stats.winRate} label="Win %" />
            </div>

            <div className="rounded-lg border border-[#e0e0e0] bg-white p-3">
              <div className="mb-2 text-center text-sm font-bold uppercase tracking-wide text-[#4d4d4d]">
                Guess Distribution
              </div>
              <div className="space-y-1">
                {stats.guessDistribution.map((count, i) => {
                  const guessNumber = i + 1
                  const widthPercent = Math.max((count / maxCount) * 100, count > 0 ? 8 : 0)
                  return (
                    <div key={guessNumber} className="flex items-center gap-2 text-sm">
                      <span className="w-3 font-bold text-[#4d4d4d]">{guessNumber}</span>
                      <div className="flex-1">
                        <div
                          className="flex h-6 min-w-[24px] items-center justify-end rounded bg-[#9a9a9a] px-2 text-xs font-bold text-white"
                          style={{ width: `${widthPercent}%` }}
                        >
                          {count}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire the trigger button into Footer.tsx**

Replace the full contents of `src/components/Footer.tsx`:

```tsx
import { KofiWidget } from "./KofiWidget"

export function Footer({ onGlobalStatsClick }: { onGlobalStatsClick: () => void }) {
  return (
    <footer className="mt-10 flex items-center justify-center gap-4 border-t border-[#e0e0e0] pt-4 text-sm text-[#4d4d4d]">
      <a
        href="https://michael-pink.com"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-[#00998a] hover:underline"
      >
        michael-pink.com
      </a>
      <button className="hover:text-[#00998a] hover:underline" onClick={onGlobalStatsClick}>
        Global Stats
      </button>
      <KofiWidget />
    </footer>
  )
}
```

- [ ] **Step 3: Wire modal state into GameBoard.tsx**

Add the import:

```ts
import { GlobalStatsModal } from "./GlobalStatsModal"
```

Add state near the other modal state (next to `showHowToPlay`):

```ts
  const [showGlobalStats, setShowGlobalStats] = useState(false)
```

Update the `<Footer />` render to:

```tsx
        <Footer onGlobalStatsClick={() => setShowGlobalStats(true)} />
        {showHowToPlay && <HowToPlayModal onClose={closeHowToPlay} />}
        {showGlobalStats && <GlobalStatsModal onClose={() => setShowGlobalStats(false)} />}
```

- [ ] **Step 4: Typecheck**

Run: `npm run build`
Expected: no type errors.

- [ ] **Step 5: Manual verification**

```bash
npm run build
npx wrangler pages dev dist --local
```

Open the app, click "Global Stats" in the footer. Confirm the modal opens, shows the aggregate numbers matching `curl http://localhost:8788/api/stats`, and closes on the ✕ button or clicking outside the card.

- [ ] **Step 6: Commit**

```bash
git add src/components/GlobalStatsModal.tsx src/components/Footer.tsx src/components/GameBoard.tsx
git commit -m "feat: add public global stats page"
```
