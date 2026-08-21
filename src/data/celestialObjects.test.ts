import { describe, it, expect } from "vitest"
import dataset from "./celestialObjects.json"
import { getProfileForCategory } from "../lib/objectProfiles"
import type { CelestialObject } from "../types/celestial"

describe("celestialObjects dataset", () => {
  it("has between 40 and 300 objects", () => {
    expect(dataset.length).toBeGreaterThanOrEqual(40)
    expect(dataset.length).toBeLessThanOrEqual(300)
  })

  it("includes all 88 official IAU constellations", () => {
    const constellations = (dataset as CelestialObject[]).filter(o => o.category === "constellation")
    expect(constellations.length).toBe(88)
  })

  it("covers every celestial category", () => {
    const categories = new Set((dataset as CelestialObject[]).map(o => o.category))
    for (const c of ["planet", "dwarf_planet", "moon", "asteroid", "comet", "star", "black_hole", "nebula", "galaxy", "quasar", "constellation", "exoplanet"]) {
      expect(categories.has(c as CelestialObject["category"])).toBe(true)
    }
  })

  it("has unique ids", () => {
    const ids = (dataset as CelestialObject[]).map(o => o.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("every object has every property its category profile requires", () => {
    const missing: string[] = []
    for (const obj of dataset as CelestialObject[]) {
      const profile = getProfileForCategory(obj.category)
      for (const entry of profile) {
        if (entry.property === "category") continue
        if ((obj as any)[entry.property] === undefined) {
          missing.push(`${obj.id}.${entry.property}`)
        }
      }
    }
    expect(missing).toEqual([])
  })

  it("every object outside constellation/exoplanet has a redshift, so cross-category guesses against a quasar's redshift column are never blank", () => {
    const missing = (dataset as CelestialObject[])
      .filter(o => o.category !== "constellation" && o.category !== "exoplanet" && o.category !== "quasar")
      .filter(o => o.redshift === undefined)
      .map(o => o.id)
    expect(missing).toEqual([])
  })

  it("every object outside constellation/exoplanet/black_hole/milky_way has an apparentMagnitude, so cross-category guesses against a quasar or nebula's magnitude column are never blank", () => {
    const missing = (dataset as CelestialObject[])
      .filter(o => !["constellation", "exoplanet", "black_hole", "quasar", "nebula"].includes(o.category) && o.id !== "milky_way")
      .filter(o => o.apparentMagnitude === undefined)
      .map(o => o.id)
    expect(missing).toEqual([])
  })

  it("every moon has a parentBodyId that exists in the dataset", () => {
    const ids = new Set((dataset as CelestialObject[]).map(o => o.id))
    for (const obj of dataset as CelestialObject[]) {
      if (obj.category === "moon") {
        expect(obj.parentBodyId).toBeDefined()
        expect(ids.has(obj.parentBodyId as string)).toBe(true)
      }
    }
  })
})
