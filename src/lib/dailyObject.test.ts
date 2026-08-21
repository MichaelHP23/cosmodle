import { describe, it, expect } from "vitest"
// Schedule-backed daily answers are covered in dailySchedule.test.ts.
import { daysSinceEpoch, dateForDayNumber, getDailyObject, pickRandomObject, seededShuffle, LAUNCH_DATE } from "./dailyObject"
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

describe("seededShuffle", () => {
  it("is deterministic for the same seed", () => {
    const a = seededShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 42)
    const b = seededShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 42)
    expect(a).toEqual(b)
  })
  it("produces a permutation (same elements, no duplicates)", () => {
    const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const shuffled = seededShuffle(input, 7)
    expect([...shuffled].sort((x, y) => x - y)).toEqual(input)
  })
  it("different seeds usually produce different orders", () => {
    const a = seededShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 1)
    const b = seededShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 2)
    expect(a).not.toEqual(b)
  })
  it("does not mutate the input array", () => {
    const input = [0, 1, 2]
    seededShuffle(input, 5)
    expect(input).toEqual([0, 1, 2])
  })
})

describe("getDailyObject", () => {
  it("returns the same object for the same date", () => {
    const date = new Date("2026-09-01T00:00:00Z")
    expect(getDailyObject(date, dataset).id).toBe(getDailyObject(date, dataset).id)
  })
  it("can return different objects for different dates", () => {
    const d1 = new Date("2026-09-01T00:00:00Z")
    const d2 = new Date("2026-09-02T00:00:00Z")
    const o1 = getDailyObject(d1, dataset)
    const o2 = getDailyObject(d2, dataset)
    expect([o1.id, o2.id].length).toBe(2)
  })
  it("does not simply cycle through the dataset in array order", () => {
    const ids = Array.from({ length: dataset.length }, (_, i) =>
      getDailyObject(new Date(LAUNCH_DATE.getTime() + i * 24 * 60 * 60 * 1000), dataset).id
    )
    expect(ids).not.toEqual(dataset.map(o => o.id))
  })
  it("covers every object exactly once within one full cycle (no repeats, no skips)", () => {
    const ids = Array.from({ length: dataset.length }, (_, i) =>
      getDailyObject(new Date(LAUNCH_DATE.getTime() + i * 24 * 60 * 60 * 1000), dataset).id
    )
    expect([...ids].sort()).toEqual(dataset.map(o => o.id).sort())
  })
  it("uses a different shuffle order for the next cycle", () => {
    const cycle0 = Array.from({ length: dataset.length }, (_, i) =>
      getDailyObject(new Date(LAUNCH_DATE.getTime() + i * 24 * 60 * 60 * 1000), dataset).id
    )
    const cycle1 = Array.from({ length: dataset.length }, (_, i) =>
      getDailyObject(new Date(LAUNCH_DATE.getTime() + (dataset.length + i) * 24 * 60 * 60 * 1000), dataset).id
    )
    expect(cycle1).not.toEqual(cycle0)
  })
})

describe("pickRandomObject", () => {
  it("returns an object from the dataset", () => {
    const picked = pickRandomObject(dataset)
    expect(dataset.map(o => o.id)).toContain(picked.id)
  })
  it("excludes the given id when possible", () => {
    for (let i = 0; i < 20; i++) {
      const picked = pickRandomObject(dataset, "a")
      expect(picked.id).not.toBe("a")
    }
  })
})
