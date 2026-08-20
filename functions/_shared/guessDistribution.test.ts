import { describe, it, expect } from "vitest"
import { buildGuessDistribution } from "./guessDistribution"

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
  it("ignores out-of-range guess counts", () => {
    expect(buildGuessDistribution([{ guess_count: 0, n: 5 }, { guess_count: 9, n: 5 }], 7)).toEqual([0, 0, 0, 0, 0, 0, 0])
  })
})
