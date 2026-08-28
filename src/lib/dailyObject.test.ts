import { describe, it, expect } from "vitest"
// Schedule-backed daily answers are covered in dailySchedule.test.ts.
import { daysSinceEpoch, dateForDayNumber, getDailyObject, pickRandomObject, LAUNCH_DATE } from "./dailyObject"
import type { CelestialObject } from "../types/celestial"

const dataset: CelestialObject[] = [
  { id: "a", name: "A", category: "planet" },
  { id: "b", name: "B", category: "planet" },
  { id: "c", name: "C", category: "planet" },
]

describe("daysSinceEpoch", () => {
  it("returns 0 for the epoch date itself", () => {
    expect(daysSinceEpoch(LAUNCH_DATE, LAUNCH_DATE)).toBe(0)
  })
  it("returns 1 for the day after epoch", () => {
    const next = new Date(LAUNCH_DATE.getTime() + 24 * 60 * 60 * 1000)
    expect(daysSinceEpoch(next, LAUNCH_DATE)).toBe(1)
  })
})

describe("dateForDayNumber", () => {
  it("returns the epoch date for day 1", () => {
    expect(dateForDayNumber(1, LAUNCH_DATE).getTime()).toBe(LAUNCH_DATE.getTime())
  })
  it("returns a date N-1 days after the epoch for day N", () => {
    const day5 = dateForDayNumber(5, LAUNCH_DATE)
    expect(daysSinceEpoch(day5, LAUNCH_DATE)).toBe(4)
  })
  it("round-trips with daysSinceEpoch + 1", () => {
    for (const dayNumber of [1, 2, 10, 100]) {
      const date = dateForDayNumber(dayNumber, LAUNCH_DATE)
      expect(daysSinceEpoch(date, LAUNCH_DATE) + 1).toBe(dayNumber)
    }
  })
})

describe("getDailyObject", () => {
  it("throws rather than inventing an answer past the end of the schedule", () => {
    const farFuture = new Date(LAUNCH_DATE.getTime() + 100000 * 24 * 60 * 60 * 1000)
    expect(() => getDailyObject(farFuture, dataset)).toThrow(/npm run schedule/)
  })
  it("throws when the scheduled object is missing from the dataset", () => {
    expect(() => getDailyObject(LAUNCH_DATE, dataset)).toThrow(/No object scheduled/)
  })
})

describe("pickRandomObject", () => {
  it("returns an object from the dataset", () => {
    const picked = pickRandomObject(dataset)
    expect(dataset.map(o => o.id)).toContain(picked.id)
  })
})
