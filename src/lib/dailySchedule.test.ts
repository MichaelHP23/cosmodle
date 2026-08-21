import { describe, it, expect } from "vitest"
import { getDailyObject, dateForDayNumber, daysSinceEpoch, LAUNCH_DATE } from "./dailyObject"
import { extendSchedule, daysRemaining, HORIZON_DAYS } from "../../scripts/extend-schedule.mjs"
import schedule from "../data/dailySchedule.json"
import dataset from "../data/celestialObjects.json"
import type { CelestialObject } from "../types/celestial"

const ids: string[] = (dataset as unknown as CelestialObject[]).map(o => o.id)
const days: string[] = schedule as string[]

// The schedule is what stops dataset growth from rewriting days people have already played.
// These tests are the reason it stays that way without anyone having to remember.
describe("daily schedule", () => {
  it("still serves the answers players actually saw, whatever the dataset size", async () => {
    const grown = [
      ...(dataset as unknown as CelestialObject[]),
      { id: "zz_new", name: "New", category: "star" } as CelestialObject,
    ]
    // Days 1-3 were played; day 4 was live when the schedule was introduced.
    for (const [day, id] of [[1, "cartwheel_galaxy"], [2, "nix"], [3, "3c48"], [4, "ankaa"]] as const) {
      expect(getDailyObject(dateForDayNumber(day), dataset as unknown as CelestialObject[]).id).toBe(id)
      expect(getDailyObject(dateForDayNumber(day), grown).id).toBe(id)
    }
  })

  const MIN_REMAINING = Math.floor(HORIZON_DAYS / 3)

  it("runs far enough ahead of today", () => {
    const today = daysSinceEpoch(new Date(), LAUNCH_DATE) + 1
    expect(
      daysRemaining(days.length, today),
      `Schedule ends on day ${days.length} and today is day ${today}. Run \`npm run schedule\` and commit the result.`
    ).toBeGreaterThan(MIN_REMAINING)
  })

  it("that alarm really fires as the schedule runs down", () => {
    // Proves the check above is load-bearing rather than permanently green.
    expect(daysRemaining(days.length, days.length - MIN_REMAINING)).toBe(MIN_REMAINING)
    expect(daysRemaining(days.length, days.length - MIN_REMAINING)).not.toBeGreaterThan(MIN_REMAINING)
    expect(daysRemaining(days.length, days.length)).toBe(0)
  })

  it("only schedules objects that exist in the dataset", () => {
    expect(days.filter(id => !ids.includes(id))).toEqual([])
  })

  it("never repeats an object before every other object has had a turn", () => {
    const lastSeen = new Map<string, number>()
    for (let i = 0; i < days.length; i++) {
      const previous = lastSeen.get(days[i])
      if (previous !== undefined) expect(i - previous).toBeGreaterThanOrEqual(ids.length)
      lastSeen.set(days[i], i)
    }
  })

  it("never puts the same object on two days in a row", () => {
    for (let i = 1; i < days.length; i++) expect(days[i]).not.toBe(days[i - 1])
  })

  it("extending leaves every existing day untouched, even after the dataset grows", () => {
    const grownIds = [...ids, "zz_new"]
    const extended = extendSchedule(days, grownIds, days.length + 120)
    expect(extended.slice(0, days.length)).toEqual(days)
    expect(extended.length).toBe(days.length + 120)
  })

  it("is idempotent: re-running with nothing to add changes nothing", () => {
    expect(extendSchedule(days, ids, days.length)).toEqual(days)
  })

  it("brings newly added objects into rotation on the next extension", () => {
    const grownIds = [...ids, "zz_new"]
    const extended = extendSchedule(days, grownIds, days.length + ids.length + 1)
    expect(extended.slice(days.length)).toContain("zz_new")
  })
})
