import { getDailyAnswerId } from "./api"
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

// Which object each day serves is decided and stored server side (functions/api/daily/[day].ts), so
// no answer ships in the bundle. Null means the server couldn't be reached or the id is unknown.
export async function fetchDailyObject(dayNumber: number, dataset: CelestialObject[]): Promise<CelestialObject | null> {
  const id = await getDailyAnswerId(dayNumber)
  return dataset.find(o => o.id === id) ?? null
}

export function pickRandomObject(dataset: CelestialObject[]): CelestialObject {
  return dataset[Math.floor(Math.random() * dataset.length)]
}
