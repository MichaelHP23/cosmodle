import { describe, it, expect } from "vitest"
import { getScoreLabel } from "./scoring"

describe("getScoreLabel", () => {
  it.each([
    [1, "Perfect"],
    [2, "Amazing"],
    [3, "Great"],
    [4, "Good"],
    [5, "Solid"],
    [6, "Completed"],
    [10, "Completed"],
  ])("guessCount %i -> %s", (count, label) => {
    expect(getScoreLabel(count)).toBe(label)
  })
})
