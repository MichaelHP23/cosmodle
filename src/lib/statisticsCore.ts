import { STATS_BUCKET_COUNT } from "./gameConstants"

export type Statistics = {
  gamesPlayed: number
  wins: number
  currentStreak: number
  longestStreak: number
  lastDayNumber: number | null
  guessDistribution: number[]
}

export type DailyResult = {
  dayNumber: number
  won: boolean
  guessCount: number
  hintsUsed: number
}

export const ZERO_STATISTICS: Statistics = {
  gamesPlayed: 0,
  wins: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastDayNumber: null,
  guessDistribution: new Array(STATS_BUCKET_COUNT).fill(0),
}

// ponytail: reconciles distributions saved under an older STATS_BUCKET_COUNT (overflow folds into the last bucket)
export function normalizeDistribution(distribution: number[]): number[] {
  const result = new Array(STATS_BUCKET_COUNT).fill(0)
  distribution.forEach((count, i) => {
    result[Math.min(i, STATS_BUCKET_COUNT - 1)] += count
  })
  return result
}

export function applyResult(
  previous: Statistics,
  dayNumber: number,
  won: boolean,
  guessCount: number
): Statistics {
  // Every win extends the streak. Hints used to cost you the streak if you spent all of them, which
  // punished the players who most needed the help, so hints are now free of streak consequences.
  const currentStreak = won
    ? (previous.lastDayNumber === dayNumber - 1 ? previous.currentStreak + 1 : 1)
    : 0
  const guessDistribution = [...previous.guessDistribution]
  if (won) guessDistribution[Math.min(guessCount, STATS_BUCKET_COUNT) - 1] += 1

  return {
    gamesPlayed: previous.gamesPlayed + 1,
    wins: previous.wins + (won ? 1 : 0),
    currentStreak,
    longestStreak: Math.max(previous.longestStreak, currentStreak),
    lastDayNumber: dayNumber,
    guessDistribution,
  }
}

export function deriveStatsFromResults(results: DailyResult[]): Statistics {
  const sorted = [...results].sort((a, b) => a.dayNumber - b.dayNumber)
  let stats = ZERO_STATISTICS
  for (const r of sorted) {
    if (stats.lastDayNumber === r.dayNumber) continue
    stats = applyResult(stats, r.dayNumber, r.won, r.guessCount)
  }
  return stats
}

export function getWinPercentage(stats: Statistics): number {
  if (stats.gamesPlayed === 0) return 0
  return Math.round((stats.wins / stats.gamesPlayed) * 100)
}
