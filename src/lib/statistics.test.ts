// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest"
import { getStatistics, recordDailyResult, mergeServerStatistics } from "./statistics"
import { getWinPercentage } from "./statisticsCore"

beforeEach(() => {
  localStorage.clear()
})

describe("getStatistics", () => {
  it("returns zeroed statistics when nothing is stored", () => {
    expect(getStatistics()).toEqual({
      gamesPlayed: 0,
      wins: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastDayNumber: null,
      guessDistribution: [0, 0, 0, 0, 0, 0, 0],
    })
  })

  it("backfills missing fields from an older stored shape (migration safety)", () => {
    localStorage.setItem("celestial:statistics", JSON.stringify({ gamesPlayed: 2, currentStreak: 1, longestStreak: 1, lastDayNumber: 5 }))
    const stats = getStatistics()
    expect(stats.wins).toBe(0)
    expect(stats.guessDistribution).toEqual([0, 0, 0, 0, 0, 0, 0])
    expect(stats.gamesPlayed).toBe(2)
  })

  it("reshapes a guessDistribution saved under a smaller STATS_BUCKET_COUNT, folding overflow into the last bucket", () => {
    localStorage.setItem(
      "celestial:statistics",
      JSON.stringify({ gamesPlayed: 3, wins: 3, currentStreak: 3, longestStreak: 3, lastDayNumber: 5, guessDistribution: [0, 1, 2] })
    )
    expect(getStatistics().guessDistribution).toEqual([0, 1, 2, 0, 0, 0, 0])
  })

  it("reshapes a guessDistribution saved under a larger STATS_BUCKET_COUNT, summing overflow into the 7+ bucket", () => {
    localStorage.setItem(
      "celestial:statistics",
      JSON.stringify({ gamesPlayed: 5, wins: 5, currentStreak: 0, longestStreak: 5, lastDayNumber: 5, guessDistribution: [0, 1, 1, 1, 1, 1, 1, 1, 1] })
    )
    expect(getStatistics().guessDistribution).toEqual([0, 1, 1, 1, 1, 1, 3])
  })
})

describe("recordDailyResult - wins", () => {
  it("starts a streak of 1 on the first win and records the guess count", () => {
    const stats = recordDailyResult(5, true, 3)
    expect(stats.currentStreak).toBe(1)
    expect(stats.longestStreak).toBe(1)
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.wins).toBe(1)
    expect(stats.guessDistribution).toEqual([0, 0, 1, 0, 0, 0, 0])
  })

  it("extends the streak on the very next consecutive day", () => {
    recordDailyResult(5, true, 2)
    const stats = recordDailyResult(6, true, 4)
    expect(stats.currentStreak).toBe(2)
    expect(stats.longestStreak).toBe(2)
    expect(stats.gamesPlayed).toBe(2)
    expect(stats.wins).toBe(2)
    expect(stats.guessDistribution).toEqual([0, 1, 0, 1, 0, 0, 0])
  })

  it("resets the streak to 1 when a day is skipped", () => {
    recordDailyResult(5, true, 1)
    recordDailyResult(6, true, 1)
    const stats = recordDailyResult(9, true, 1)
    expect(stats.currentStreak).toBe(1)
    expect(stats.longestStreak).toBe(2)
    expect(stats.gamesPlayed).toBe(3)
  })

  it("keeps longestStreak at its peak even after the streak resets", () => {
    recordDailyResult(1, true, 1)
    recordDailyResult(2, true, 1)
    recordDailyResult(3, true, 1)
    recordDailyResult(10, true, 1)
    const stats = recordDailyResult(11, true, 1)
    expect(stats.currentStreak).toBe(2)
    expect(stats.longestStreak).toBe(3)
  })

  it("is idempotent for the same day number (no double counting on reload)", () => {
    recordDailyResult(5, true, 3)
    const stats = recordDailyResult(5, true, 3)
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.currentStreak).toBe(1)
    expect(stats.wins).toBe(1)
  })
})

describe("recordDailyResult - hints do not affect the streak", () => {
  // Spending all your hints used to zero the streak on a win. That punished exactly the players who
  // needed the help most, so a win now counts the same however many hints it took.
  it("extends the streak on a win even if all 5 hints were used", () => {
    recordDailyResult(5, true, 2)
    const stats = recordDailyResult(6, true, 3)
    expect(stats.currentStreak).toBe(2)
  })

  it("counts a win with hints as a full win (gamesPlayed/wins/distribution unaffected)", () => {
    const stats = recordDailyResult(1, true, 4)
    expect(stats.wins).toBe(1)
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.guessDistribution).toEqual([0, 0, 0, 1, 0, 0, 0])
  })

  it("bumps longestStreak from a win regardless of hints", () => {
    recordDailyResult(5, true, 2)
    recordDailyResult(6, true, 2)
    const stats = recordDailyResult(7, true, 3)
    expect(stats.currentStreak).toBe(3)
    expect(stats.longestStreak).toBe(3)
  })
})

describe("recordDailyResult - losses", () => {
  it("resets currentStreak to 0 on a loss", () => {
    recordDailyResult(5, true, 2)
    recordDailyResult(6, true, 2)
    const stats = recordDailyResult(7, false, 7)
    expect(stats.currentStreak).toBe(0)
    expect(stats.gamesPlayed).toBe(3)
  })

  it("does not touch longestStreak, wins, or guessDistribution on a loss", () => {
    recordDailyResult(5, true, 2)
    recordDailyResult(6, true, 2)
    const stats = recordDailyResult(7, false, 7)
    expect(stats.longestStreak).toBe(2)
    expect(stats.wins).toBe(2)
    expect(stats.guessDistribution).toEqual([0, 2, 0, 0, 0, 0, 0])
  })

  it("counts a loss toward gamesPlayed even with no prior wins", () => {
    const stats = recordDailyResult(1, false, 7)
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.currentStreak).toBe(0)
    expect(stats.lastDayNumber).toBe(1)
    expect(stats.wins).toBe(0)
  })

  it("is idempotent for the same day number", () => {
    recordDailyResult(5, false, 7)
    const stats = recordDailyResult(5, false, 7)
    expect(stats.gamesPlayed).toBe(1)
  })
})

describe("mergeServerStatistics", () => {
  it("uses the server stats and persists them when the server is ahead of local", () => {
    recordDailyResult(1, true, 3)
    const server = { gamesPlayed: 5, wins: 5, currentStreak: 5, longestStreak: 5, lastDayNumber: 5, guessDistribution: [0, 0, 1, 1, 1, 1, 1] }
    const merged = mergeServerStatistics(server)
    expect(merged).toEqual(server)
    expect(getStatistics()).toEqual(server)
  })

  it("keeps local stats and leaves localStorage untouched when the server is behind local", () => {
    recordDailyResult(1, true, 3)
    const localBefore = getStatistics()
    const server = { gamesPlayed: 1, wins: 1, currentStreak: 1, longestStreak: 1, lastDayNumber: 1, guessDistribution: [0, 0, 1, 0, 0, 0, 0] }
    const merged = mergeServerStatistics(server)
    expect(merged).toEqual(localBefore)
    expect(getStatistics()).toEqual(localBefore)
  })

  it("keeps the higher longestStreak when gamesPlayed is equal but local has a higher longestStreak", () => {
    recordDailyResult(1, true, 1)
    recordDailyResult(2, true, 1)
    recordDailyResult(9, true, 1)
    const local = getStatistics()
    expect(local.longestStreak).toBe(2)
    const server = { gamesPlayed: local.gamesPlayed, wins: local.gamesPlayed, currentStreak: 1, longestStreak: 1, lastDayNumber: 9, guessDistribution: [3, 0, 0, 0, 0, 0, 0] }
    const merged = mergeServerStatistics(server)
    expect(merged.longestStreak).toBe(2)
    expect(getStatistics().longestStreak).toBe(2)
  })
})

describe("getWinPercentage", () => {
  it("returns 0 when no games have been played", () => {
    expect(getWinPercentage({ gamesPlayed: 0, wins: 0, currentStreak: 0, longestStreak: 0, lastDayNumber: null, guessDistribution: [0, 0, 0, 0, 0, 0, 0] })).toBe(0)
  })

  it("rounds to the nearest whole percent", () => {
    expect(getWinPercentage({ gamesPlayed: 3, wins: 2, currentStreak: 0, longestStreak: 0, lastDayNumber: null, guessDistribution: [0, 0, 0, 0, 0, 0, 0] })).toBe(67)
  })

  it("returns 100 for a perfect record", () => {
    expect(getWinPercentage({ gamesPlayed: 4, wins: 4, currentStreak: 0, longestStreak: 0, lastDayNumber: null, guessDistribution: [0, 0, 0, 0, 0, 0, 0] })).toBe(100)
  })
})
