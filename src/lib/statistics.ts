import { MAX_HINTS } from "./gameState"

export type Statistics = {
  gamesPlayed: number
  wins: number
  currentStreak: number
  longestStreak: number
  lastDayNumber: number | null
  guessDistribution: number[]
}

const STORAGE_KEY = "celestial:statistics"
const MAX_GUESSES = 7

const ZERO_STATISTICS: Statistics = {
  gamesPlayed: 0,
  wins: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastDayNumber: null,
  guessDistribution: new Array(MAX_GUESSES).fill(0),
}

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

  const streakEligible = won && hintsUsed < MAX_HINTS
  const currentStreak = streakEligible
    ? (previous.lastDayNumber === dayNumber - 1 ? previous.currentStreak + 1 : 1)
    : 0
  const guessDistribution = [...previous.guessDistribution]
  if (won) guessDistribution[guessCount - 1] += 1

  const next: Statistics = {
    gamesPlayed: previous.gamesPlayed + 1,
    wins: previous.wins + (won ? 1 : 0),
    currentStreak,
    longestStreak: Math.max(previous.longestStreak, currentStreak),
    lastDayNumber: dayNumber,
    guessDistribution,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function getWinPercentage(stats: Statistics): number {
  if (stats.gamesPlayed === 0) return 0
  return Math.round((stats.wins / stats.gamesPlayed) * 100)
}
