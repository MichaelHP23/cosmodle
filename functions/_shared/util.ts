import { MAX_HINTS } from "../../src/lib/gameConstants"
import type { DailyResult } from "../../src/lib/statisticsCore"

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// The client's guess limit has come down over time (20 at launch, 15 now). A player still running a
// cached older build, or a retry carrying an older result, must not have their game rejected, so the
// server validates against the highest limit ever shipped rather than the current one.
const HIGHEST_SHIPPED_GUESS_LIMIT = 20

export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value)
}

// A player can give up before guessing anything, so a give-up is the one result with no guesses.
export function isValidGuessCount(value: unknown, allowZero = false): value is number {
  if (typeof value !== "number" || !Number.isInteger(value)) return false
  return value >= (allowZero ? 0 : 1) && value <= HIGHEST_SHIPPED_GUESS_LIMIT
}

export function isValidHintsUsed(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_HINTS
}

export type ResultRow = {
  day_number: number
  won: number
  guess_count: number
  hints_used: number
  gave_up: number
}

export function rowsToResults(rows: ResultRow[]): DailyResult[] {
  return rows.map(r => ({
    dayNumber: r.day_number,
    won: r.won === 1,
    guessCount: r.guess_count,
    hintsUsed: r.hints_used,
    gaveUp: r.gave_up === 1,
  }))
}

export function buildGuessDistribution(rows: { guess_count: number; n: number }[], bucketCount: number): number[] {
  const distribution = new Array(bucketCount).fill(0)
  for (const row of rows) {
    if (row.guess_count >= 1) {
      distribution[Math.min(row.guess_count, bucketCount) - 1] += row.n
    }
  }
  return distribution
}
