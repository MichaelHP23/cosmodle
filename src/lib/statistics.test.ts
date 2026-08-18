// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest"
import { getStatistics, recordDailyResult } from "./statistics"

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

describe("recordDailyResult - wins", () => {
  it("starts a streak of 1 on the first win", () => {
    const stats = recordDailyResult(5, true)
    expect(stats.currentStreak).toBe(1)
    expect(stats.longestStreak).toBe(1)
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.lastDayNumber).toBe(5)
  })

  it("extends the streak on the very next consecutive day", () => {
    recordDailyResult(5, true)
    const stats = recordDailyResult(6, true)
    expect(stats.currentStreak).toBe(2)
    expect(stats.longestStreak).toBe(2)
    expect(stats.gamesPlayed).toBe(2)
  })

  it("resets the streak to 1 when a day is skipped", () => {
    recordDailyResult(5, true)
    recordDailyResult(6, true)
    const stats = recordDailyResult(9, true)
    expect(stats.currentStreak).toBe(1)
    expect(stats.longestStreak).toBe(2)
    expect(stats.gamesPlayed).toBe(3)
  })

  it("keeps longestStreak at its peak even after the streak resets", () => {
    recordDailyResult(1, true)
    recordDailyResult(2, true)
    recordDailyResult(3, true)
    recordDailyResult(10, true)
    const stats = recordDailyResult(11, true)
    expect(stats.currentStreak).toBe(2)
    expect(stats.longestStreak).toBe(3)
  })

  it("is idempotent for the same day number (no double counting on reload)", () => {
    recordDailyResult(5, true)
    const stats = recordDailyResult(5, true)
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.currentStreak).toBe(1)
  })
})

describe("recordDailyResult - losses", () => {
  it("resets currentStreak to 0 on a loss", () => {
    recordDailyResult(5, true)
    recordDailyResult(6, true)
    const stats = recordDailyResult(7, false)
    expect(stats.currentStreak).toBe(0)
    expect(stats.gamesPlayed).toBe(3)
  })

  it("does not touch longestStreak on a loss", () => {
    recordDailyResult(5, true)
    recordDailyResult(6, true)
    const stats = recordDailyResult(7, false)
    expect(stats.longestStreak).toBe(2)
  })

  it("counts a loss toward gamesPlayed even with no prior wins", () => {
    const stats = recordDailyResult(1, false)
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.currentStreak).toBe(0)
    expect(stats.lastDayNumber).toBe(1)
  })

  it("is idempotent for the same day number", () => {
    recordDailyResult(5, false)
    const stats = recordDailyResult(5, false)
    expect(stats.gamesPlayed).toBe(1)
  })
})
