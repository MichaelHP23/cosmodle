import { describe, it, expect } from "vitest"
import { currentDayNumber, isValidDayNumber } from "./dayNumber"

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
