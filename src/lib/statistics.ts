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
