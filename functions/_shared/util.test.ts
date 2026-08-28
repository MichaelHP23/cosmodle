import { describe, it, expect } from "vitest"
import {
  isValidUuid,
  isValidGuessCount,
  isValidHintsUsed,
  currentDayNumber,
  isValidDayNumber,
  buildGuessDistribution,
} from "./util"
import { MAX_HINTS } from "../../src/lib/gameConstants"

describe("isValidUuid", () => {
  it("accepts a well-formed v4-shaped uuid", () => {
    expect(isValidUuid("110e8400-e29b-41d4-a716-446655440000")).toBe(true)
  })
  it("rejects non-uuid strings", () => {
    expect(isValidUuid("not-a-uuid")).toBe(false)
  })
  it("rejects non-strings", () => {
    expect(isValidUuid(123)).toBe(false)
    expect(isValidUuid(undefined)).toBe(false)
    expect(isValidUuid(["a"])).toBe(false)
  })
})

describe("isValidGuessCount", () => {
  // The bound is the highest guess limit ever shipped, not the current one, so results from an
  // older cached client are still accepted.
  it("accepts integers 1 through 20", () => {
    expect(isValidGuessCount(1)).toBe(true)
    expect(isValidGuessCount(20)).toBe(true)
  })
  it("rejects 0, 21, and non-integers", () => {
    expect(isValidGuessCount(0)).toBe(false)
    expect(isValidGuessCount(21)).toBe(false)
    expect(isValidGuessCount(2.5)).toBe(false)
    expect(isValidGuessCount("3")).toBe(false)
  })
})

describe("isValidHintsUsed", () => {
  it("accepts every integer the client can actually send", () => {
    expect(isValidHintsUsed(0)).toBe(true)
    expect(isValidHintsUsed(MAX_HINTS)).toBe(true)
  })
  it("rejects negative numbers, out-of-range values, and non-integers", () => {
    expect(isValidHintsUsed(-5)).toBe(false)
    expect(isValidHintsUsed(MAX_HINTS + 1)).toBe(false)
    expect(isValidHintsUsed(999999)).toBe(false)
    expect(isValidHintsUsed(1.5)).toBe(false)
    expect(isValidHintsUsed("1")).toBe(false)
  })
})

describe("currentDayNumber", () => {
  it("returns 1 on launch day", () => {
    expect(currentDayNumber(new Date(Date.UTC(2026, 7, 18)))).toBe(1)
  })
  it("returns 2 the day after launch", () => {
    expect(currentDayNumber(new Date(Date.UTC(2026, 7, 19)))).toBe(2)
  })
})

describe("isValidDayNumber", () => {
  const now = new Date(Date.UTC(2026, 7, 19)) // day number 2

  it("accepts today's day number", () => {
    expect(isValidDayNumber(2, now)).toBe(true)
  })
  it("accepts one day of drift either direction", () => {
    expect(isValidDayNumber(1, now)).toBe(true)
    expect(isValidDayNumber(3, now)).toBe(true)
  })
  it("rejects more than one day of drift", () => {
    expect(isValidDayNumber(4, now)).toBe(false)
    expect(isValidDayNumber(-1, now)).toBe(false)
  })
  it("rejects non-integers", () => {
    expect(isValidDayNumber(2.5, now)).toBe(false)
    expect(isValidDayNumber("2", now)).toBe(false)
  })
})

describe("buildGuessDistribution", () => {
  it("counts wins into their guess-count slot", () => {
    const dist = buildGuessDistribution(
      [{ guess_count: 1, n: 1 }, { guess_count: 3, n: 2 }],
      7
    )
    expect(dist).toEqual([1, 0, 2, 0, 0, 0, 0])
  })
  it("returns all zeros for no rows", () => {
    expect(buildGuessDistribution([], 7)).toEqual([0, 0, 0, 0, 0, 0, 0])
  })
  it("ignores non-positive guess counts", () => {
    expect(buildGuessDistribution([{ guess_count: 0, n: 5 }], 7)).toEqual([0, 0, 0, 0, 0, 0, 0])
  })
  it("clamps guess counts above the bucket count into the last bucket", () => {
    expect(buildGuessDistribution([{ guess_count: 9, n: 3 }, { guess_count: 15, n: 2 }], 7)).toEqual([0, 0, 0, 0, 0, 0, 5])
  })
})
