import type { CelestialObject } from "../types/celestial"

export const LAUNCH_DATE = new Date("2026-08-17T00:00:00Z")

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function daysSinceEpoch(date: Date, epoch: Date): number {
  const dateUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const epochUTC = Date.UTC(epoch.getUTCFullYear(), epoch.getUTCMonth(), epoch.getUTCDate())
  return Math.floor((dateUTC - epochUTC) / MS_PER_DAY)
}

export function dateForDayNumber(dayNumber: number, epoch: Date = LAUNCH_DATE): Date {
  return new Date(epoch.getTime() + (dayNumber - 1) * MS_PER_DAY)
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

export function getDailyObject(date: Date, dataset: CelestialObject[]): CelestialObject {
  const n = dataset.length
  const days = daysSinceEpoch(date, LAUNCH_DATE)
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
