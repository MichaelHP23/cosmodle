import { describe, it, expect } from "vitest"
import {
  isValidUuid,
  isValidGuessCount,
  isValidHintsUsed,
  currentDayNumber,
  isValidDayNumber,
  resolveDayNumber,
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

describe("resolveDayNumber", () => {
  const now = new Date(Date.UTC(2026, 7, 19)) // day number 2

  it("takes the day the client says it is playing", () => {
    expect(resolveDayNumber("2", now)).toBe(2)
  })
  it("takes a local day sitting either side of the UTC day", () => {
    // A player east of UTC is already on the next day, one west is still on the previous one.
    expect(resolveDayNumber("3", now)).toBe(3)
    expect(resolveDayNumber("1", now)).toBe(1)
  })
  it("falls back to the server's day when no day is sent", () => {
    // A cached older client sends nothing at all and still gets a sensible count.
    expect(resolveDayNumber(null, now)).toBe(2)
    expect(resolveDayNumber("", now)).toBe(2)
  })
  it("never reads a missing day as day 0, even in the game's first days", () => {
    // `Number(null)` is 0, which sits within the tolerated drift of day 1 and would match no rows.
    const launchDay = new Date(Date.UTC(2026, 7, 18)) // day number 1
    expect(resolveDayNumber(null, launchDay)).toBe(1)
    expect(resolveDayNumber("", launchDay)).toBe(1)
    expect(resolveDayNumber("0", launchDay)).toBe(1)
  })
  it("falls back rather than trusting a day outside the possible drift", () => {
    expect(resolveDayNumber("99", now)).toBe(2)
    expect(resolveDayNumber("-1", now)).toBe(2)
  })
  it("falls back on values that are not whole numbers", () => {
    expect(resolveDayNumber("banana", now)).toBe(2)
    expect(resolveDayNumber("2.5", now)).toBe(2)
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
