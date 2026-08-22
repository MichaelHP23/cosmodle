import { describe, it, expect } from "vitest"
import { isValidUuid, isValidGuessCount, isValidHintsUsed } from "./validate"
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
