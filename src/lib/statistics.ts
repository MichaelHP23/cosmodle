import { ZERO_STATISTICS, applyResult, applyGiveUp, normalizeDistribution } from "./statisticsCore"
import type { Statistics } from "./statisticsCore"

export type { Statistics, DailyResult } from "./statisticsCore"
export { deriveStatsFromResults, getWinPercentage } from "./statisticsCore"

const STORAGE_KEY = "celestial:statistics"

export function getStatistics(): Statistics {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return ZERO_STATISTICS
  try {
    const parsed = JSON.parse(raw)
    const merged = { ...ZERO_STATISTICS, ...parsed }
    return { ...merged, guessDistribution: normalizeDistribution(merged.guessDistribution) }
  } catch {
    return ZERO_STATISTICS
  }
}

export function recordDailyResult(dayNumber: number, won: boolean, guessCount: number): Statistics {
  const previous = getStatistics()
  if (previous.lastDayNumber === dayNumber) return previous
  const next = applyResult(previous, dayNumber, won, guessCount)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function recordDailyGiveUp(dayNumber: number): Statistics {
  const previous = getStatistics()
  if (previous.lastDayNumber === dayNumber) return previous
  const next = applyGiveUp(previous, dayNumber)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function applyServerStatistics(stats: Statistics): Statistics {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  return stats
}

export function mergeServerStatistics(server: Statistics): Statistics {
  const local = getStatistics()
  if (server.gamesPlayed < local.gamesPlayed) return local
  return applyServerStatistics({
    ...server,
    longestStreak: Math.max(server.longestStreak, local.longestStreak),
  })
}
