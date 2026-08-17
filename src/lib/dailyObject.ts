import type { CelestialObject } from "../types/celestial"

export const LAUNCH_DATE = new Date("2026-08-17T00:00:00Z")

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function daysSinceEpoch(date: Date, epoch: Date): number {
  const dateUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const epochUTC = Date.UTC(epoch.getUTCFullYear(), epoch.getUTCMonth(), epoch.getUTCDate())
  return Math.floor((dateUTC - epochUTC) / MS_PER_DAY)
}

export function getDailyObject(date: Date, dataset: CelestialObject[]): CelestialObject {
  const days = daysSinceEpoch(date, LAUNCH_DATE)
  const index = ((days % dataset.length) + dataset.length) % dataset.length
  return dataset[index]
}

export function pickRandomObject(dataset: CelestialObject[], excludeId?: string): CelestialObject {
  const pool = excludeId ? dataset.filter(o => o.id !== excludeId) : dataset
  const source = pool.length > 0 ? pool : dataset
  const index = Math.floor(Math.random() * source.length)
  return source[index]
}
