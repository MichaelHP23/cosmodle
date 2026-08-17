// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest"
import { getStatistics, recordDailyWin } from "./statistics"

beforeEach(() => {
  localStorage.clear()
})

describe("getStatistics", () => {
  it("returns zeroed statistics when nothing is stored", () => {
    expect(getStatistics()).toEqual({
      gamesPlayed: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastDayNumber: null,
    })
  })
})

describe("recordDailyWin", () => {
  it("starts a streak of 1 on the first win", () => {
    const stats = recordDailyWin(5)
    expect(stats.currentStreak).toBe(1)
    expect(stats.longestStreak).toBe(1)
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.lastDayNumber).toBe(5)
  })

  it("extends the streak on the very next consecutive day", () => {
    recordDailyWin(5)
    const stats = recordDailyWin(6)
    expect(stats.currentStreak).toBe(2)
    expect(stats.longestStreak).toBe(2)
    expect(stats.gamesPlayed).toBe(2)
  })

  it("resets the streak to 1 when a day is skipped", () => {
    recordDailyWin(5)
    recordDailyWin(6)
    const stats = recordDailyWin(9)
    expect(stats.currentStreak).toBe(1)
    expect(stats.longestStreak).toBe(2)
    expect(stats.gamesPlayed).toBe(3)
  })

  it("keeps longestStreak at its peak even after the streak resets", () => {
    recordDailyWin(1)
    recordDailyWin(2)
    recordDailyWin(3)
    recordDailyWin(10)
    const stats = recordDailyWin(11)
    expect(stats.currentStreak).toBe(2)
    expect(stats.longestStreak).toBe(3)
  })

  it("is idempotent for the same day number (no double counting on reload)", () => {
    recordDailyWin(5)
    const stats = recordDailyWin(5)
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.currentStreak).toBe(1)
  })
})
