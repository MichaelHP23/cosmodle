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
