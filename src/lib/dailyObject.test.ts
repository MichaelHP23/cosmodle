import { describe, it, expect } from "vitest"
import { daysSinceEpoch, getDailyObject, pickRandomObject, LAUNCH_DATE } from "./dailyObject"
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
  it("wraps correctly at dataset length boundary", () => {
    const day0 = getDailyObject(LAUNCH_DATE, dataset)
    const dayN = getDailyObject(new Date(LAUNCH_DATE.getTime() + dataset.length * 24 * 60 * 60 * 1000), dataset)
    expect(dayN.id).toBe(day0.id)
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
