import schedule from "../data/dailySchedule.json"
import type { CelestialObject } from "../types/celestial"

export const LAUNCH_DATE = new Date(2026, 7, 18) // local calendar date, not UTC

const MS_PER_DAY = 24 * 60 * 60 * 1000

// Uses local calendar day (not UTC) so the puzzle rolls over at each player's
// own midnight instead of UTC midnight, which is early evening in US timezones.
export function daysSinceEpoch(date: Date, epoch: Date): number {
  const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const epochLocal = new Date(epoch.getFullYear(), epoch.getMonth(), epoch.getDate()).getTime()
  return Math.round((dateLocal - epochLocal) / MS_PER_DAY)
}

export function dateForDayNumber(dayNumber: number, epoch: Date = LAUNCH_DATE): Date {
  return new Date(epoch.getFullYear(), epoch.getMonth(), epoch.getDate() + (dayNumber - 1))
}

function mulberry32(seed: number): () => number {
  let state = seed
  return function next() {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array]
  const rng = mulberry32(seed)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Which object each day serves is committed data, not a function of the dataset. The old rotation
// derived every day's answer from dataset.length, so adding a single object reshuffled days people
// had already played, grading their saved guesses against a different object. dailySchedule.json is
// append-only, so dataset growth can never rewrite a day that is already in it.
// Extend it with `npm run schedule`; a test fails once it runs close to its end.
export function getDailyObject(date: Date, dataset: CelestialObject[]): CelestialObject {
  const days = daysSinceEpoch(date, LAUNCH_DATE)

  const scheduledId = (schedule as string[])[days]
  if (scheduledId) {
    const scheduled = dataset.find(o => o.id === scheduledId)
    if (scheduled) return scheduled
  }

  // ponytail: past the end of the schedule this falls back to the old dataset.length-derived
  // rotation, which is unstable across dataset growth. It is only reachable if the schedule was
  // left unextended for HORIZON_DAYS after the test started failing. Run `npm run schedule`.
  const n = dataset.length
  const cycle = Math.floor(days / n)
  const position = ((days % n) + n) % n
  const order = seededShuffle(
    Array.from({ length: n }, (_, i) => i),
    cycle
  )
  return dataset[order[position]]
}

export function pickRandomObject(dataset: CelestialObject[], excludeId?: string): CelestialObject {
  const pool = excludeId ? dataset.filter(o => o.id !== excludeId) : dataset
  const source = pool.length > 0 ? pool : dataset
  const index = Math.floor(Math.random() * source.length)
  return source[index]
}
