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

// The rotation below is derived from dataset.length, so adding a single object reshuffles every day's
// answer — including days people have already played, whose saved guesses would then grade against a
// different object. Days that have already been played are pinned to the object they actually showed.
// Pin every elapsed day before growing the dataset again; unplayed future days are free to reshuffle.
const PINNED_ANSWERS: Record<number, string> = {
  1: "cartwheel_galaxy",
  2: "nix",
  3: "3c48",
}

export function getDailyObject(date: Date, dataset: CelestialObject[]): CelestialObject {
  const n = dataset.length
  const days = daysSinceEpoch(date, LAUNCH_DATE)

  const pinnedId = PINNED_ANSWERS[days + 1]
  if (pinnedId) {
    const pinned = dataset.find(o => o.id === pinnedId)
    if (pinned) return pinned
  }

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
