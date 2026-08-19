import { describe, it, expect } from "vitest"
import { deriveStatsFromResults } from "./statisticsCore"

describe("deriveStatsFromResults", () => {
  it("returns zeroed stats for an empty history", () => {
    expect(deriveStatsFromResults([])).toEqual({
      gamesPlayed: 0,
      wins: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastDayNumber: null,
      guessDistribution: [0, 0, 0, 0, 0, 0, 0],
    })
  })

  it("replays out-of-order history sorted by day number", () => {
    const stats = deriveStatsFromResults([
      { dayNumber: 2, won: true, guessCount: 2, hintsUsed: 0 },
      { dayNumber: 1, won: true, guessCount: 3, hintsUsed: 0 },
    ])
    expect(stats.gamesPlayed).toBe(2)
    expect(stats.wins).toBe(2)
    expect(stats.currentStreak).toBe(2)
    expect(stats.longestStreak).toBe(2)
    expect(stats.lastDayNumber).toBe(2)
    expect(stats.guessDistribution).toEqual([0, 1, 1, 0, 0, 0, 0])
  })

  it("breaks the streak on a gap day and on a loss", () => {
    const stats = deriveStatsFromResults([
      { dayNumber: 1, won: true, guessCount: 1, hintsUsed: 0 },
      { dayNumber: 2, won: true, guessCount: 1, hintsUsed: 0 },
      { dayNumber: 4, won: true, guessCount: 1, hintsUsed: 0 },
      { dayNumber: 5, won: false, guessCount: 7, hintsUsed: 0 },
    ])
    expect(stats.currentStreak).toBe(0)
    expect(stats.longestStreak).toBe(2)
    expect(stats.gamesPlayed).toBe(4)
    expect(stats.wins).toBe(3)
  })

  it("does not extend the streak when all hints were used", () => {
    const stats = deriveStatsFromResults([
      { dayNumber: 1, won: true, guessCount: 4, hintsUsed: 3 },
    ])
    expect(stats.currentStreak).toBe(0)
    expect(stats.wins).toBe(1)
  })

  it("ignores a duplicate row for a day already applied", () => {
    const stats = deriveStatsFromResults([
      { dayNumber: 1, won: true, guessCount: 1, hintsUsed: 0 },
      { dayNumber: 1, won: false, guessCount: 7, hintsUsed: 0 },
    ])
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.wins).toBe(1)
  })
})
