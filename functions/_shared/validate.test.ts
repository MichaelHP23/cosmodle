import { describe, it, expect } from "vitest"
import { isValidUuid, isValidGuessCount, isValidHintsUsed } from "./validate"

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
  it("accepts integers 0 through 5", () => {
    expect(isValidHintsUsed(0)).toBe(true)
    expect(isValidHintsUsed(5)).toBe(true)
  })
  it("rejects negative numbers, out-of-range values, and non-integers", () => {
    expect(isValidHintsUsed(-5)).toBe(false)
    expect(isValidHintsUsed(6)).toBe(false)
    expect(isValidHintsUsed(999999)).toBe(false)
    expect(isValidHintsUsed(1.5)).toBe(false)
    expect(isValidHintsUsed("1")).toBe(false)
  })
})
