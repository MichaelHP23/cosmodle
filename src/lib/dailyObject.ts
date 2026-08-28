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

// Which object each day serves is committed data, not a function of the dataset. The old rotation
// derived every day's answer from dataset.length, so adding a single object reshuffled days people
// had already played, grading their saved guesses against a different object. dailySchedule.json is
// append-only, so dataset growth can never rewrite a day that is already in it.
// Extend it with `npm run schedule`; a test fails once it runs close to its end.
// Running off the end of the schedule throws rather than falling back to a rotation derived from
// dataset.length: that rotation is exactly the bug the schedule replaced, and serving a wrong answer
// quietly is worse than failing loudly. dailySchedule.test.ts starts failing HORIZON_DAYS ahead of
// this, which is the warning to run `npm run schedule`.
export function getDailyObject(date: Date, dataset: CelestialObject[]): CelestialObject {
  const days = daysSinceEpoch(date, LAUNCH_DATE)
  const scheduledId = (schedule as string[])[days]
  const scheduled = scheduledId ? dataset.find(o => o.id === scheduledId) : undefined
  if (!scheduled) {
    throw new Error(`No object scheduled for day ${days + 1}; run \`npm run schedule\``)
  }
  return scheduled
}

export function pickRandomObject(dataset: CelestialObject[]): CelestialObject {
  return dataset[Math.floor(Math.random() * dataset.length)]
}
