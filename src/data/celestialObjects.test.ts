import { describe, it, expect } from "vitest"
import dataset from "./celestialObjects.json"
import { getProfileForCategory, getComparableValue } from "../lib/objectProfiles"
import type { CelestialObject } from "../types/celestial"

describe("celestialObjects dataset", () => {
  it("has between 40 and 400 objects", () => {
    expect(dataset.length).toBeGreaterThanOrEqual(40)
    expect(dataset.length).toBeLessThanOrEqual(400)
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

  // A constellation borrows its physical properties from its brightest star, so a link to the wrong
  // star quietly gives it someone else's distance and mass. The magnitude it already records is the
  // independent check that the pair belongs together.
  it("every constellation linked to a brightest star points at a real star of the right brightness", () => {
    const objects = dataset as CelestialObject[]
    const problems: string[] = []
    for (const obj of objects.filter(o => o.category === "constellation" && o.brightestStarId)) {
      const star = objects.find(o => o.id === obj.brightestStarId)
      if (!star) { problems.push(`${obj.id} -> ${obj.brightestStarId} (no such object)`); continue }
      if (star.category !== "star") { problems.push(`${obj.id} -> ${star.id} (not a star)`); continue }
      const recorded = obj.brightestStarMagnitude
      const actual = star.apparentMagnitude
      if (recorded === undefined || actual === undefined || Math.abs(recorded - actual) > 0.35) {
        problems.push(`${obj.id} -> ${star.id} (magnitude ${actual} vs recorded ${recorded})`)
      }
    }
    expect(problems).toEqual([])
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

// The Schwarzschild radius fixes a black hole's event horizon from its mass alone, and small bodies
// cannot be denser than iron or lighter than loose snow, so both are checkable facts rather than
// judgement calls. These rules exist because the dataset once carried an event horizon 700 times too
// large and a comet whose mass implied 115 g/cm3.
const SCHWARZSCHILD_KM_PER_KG = 2.9706e-30
const G = 6.674e-11

describe("physical consistency", () => {
  it("gives every black hole an event horizon that matches its mass", () => {
    const wrong = (dataset as CelestialObject[])
      .filter(o => o.category === "black_hole" && o.massKg && o.diameterKm)
      .map(o => ({ id: o.id, expected: SCHWARZSCHILD_KM_PER_KG * o.massKg!, actual: o.diameterKm! }))
      .filter(x => Math.abs(x.actual - x.expected) / x.expected > 0.05)
    expect(wrong).toEqual([])
  })

  it("keeps every solid body at a physically possible density", () => {
    const wrong = (dataset as CelestialObject[])
      .filter(o => ["planet", "dwarf_planet", "moon", "asteroid", "comet"].includes(o.category))
      .filter(o => o.massKg && o.diameterKm)
      .map(o => {
        const radiusCm = (o.diameterKm! * 1e5) / 2
        return { id: o.id, density: (o.massKg! * 1000) / ((4 / 3) * Math.PI * radiusCm ** 3) }
      })
      .filter(x => x.density < 0.1 || x.density > 9)
    expect(wrong).toEqual([])
  })

  it("keeps sun-orbiting bodies near their equilibrium temperature", () => {
    const wrong = (dataset as CelestialObject[])
      .filter(o => ["asteroid", "comet"].includes(o.category))
      .filter(o => o.distanceFromSunAU && o.temperatureK)
      .map(o => ({ id: o.id, stated: o.temperatureK!, equilibrium: 278.6 / Math.sqrt(o.distanceFromSunAU!) }))
      .filter(x => Math.abs(x.stated - x.equilibrium) / x.equilibrium > 0.4)
    expect(wrong).toEqual([])
  })

  it("orders quasars by distance the same way redshift orders them", () => {
    const quasars = (dataset as CelestialObject[])
      .filter(o => o.category === "quasar" && o.redshift != null && o.distanceFromEarthLy != null)
      .sort((a, b) => a.redshift! - b.redshift!)
    const distances = quasars.map(q => q.distanceFromEarthLy!)
    const sorted = [...distances].sort((a, b) => a - b)
    expect(distances).toEqual(sorted)
  })

  it("keeps stated surface gravity consistent with mass and radius", () => {
    const wrong = (dataset as CelestialObject[])
      .filter(o => o.massKg && o.diameterKm && o.gravityMs2)
      // Saturn and Haumea are strongly oblate and their published gravity uses the equatorial radius.
      // The five small moons are irregular lumps rather than spheres, and their published surface
      // gravity is quoted at the longest axis, where it is lowest, so a mean-radius sphere overstates it.
      .filter(o => !["saturn", "haumea", "epimetheus", "pan", "larissa", "nix", "hydra_moon"].includes(o.id))
      .map(o => {
        const r = (o.diameterKm! * 1000) / 2
        return { id: o.id, stated: o.gravityMs2!, derived: (G * o.massKg!) / (r * r) }
      })
      .filter(x => Math.abs(x.stated - x.derived) / x.derived > 0.3)
    expect(wrong).toEqual([])
  })

  it("orders orbital periods the way semi-major axis does, per Kepler's third law", () => {
    const wrong = (dataset as CelestialObject[])
      .filter(o => ["asteroid", "comet", "dwarf_planet", "planet"].includes(o.category))
      .filter(o => o.distanceFromSunAU && o.orbitalPeriodDays)
      .map(o => ({
        id: o.id,
        stated: o.orbitalPeriodDays!,
        kepler: Math.pow(o.distanceFromSunAU!, 1.5) * 365.25,
      }))
      .filter(x => Math.abs(x.stated - x.kepler) / x.kepler > 0.05)
    expect(wrong).toEqual([])
  })

  // Every guess is compared against every answer, so a guess of one category is asked for a column
  // that only another category owns and the comparison derives a stand-in value. A derived value that
  // lands outside these bounds is a bug in the derivation, not a fact about the object.
  it("never derives a nonsensical value for any guess against any answer", () => {
    const objects = dataset as CelestialObject[]
    const problems: string[] = []
    const BOUNDS: Record<string, [number, number]> = {
      distanceFromEarthLy: [0, 1e11],
      diameterKm: [0, 1e19],
      massKg: [1e10, 1e45],
      temperatureK: [0, 1e6],
      gravityMs2: [0, 1e14],
      orbitalPeriodDays: [0, 1e9],
    }
    for (const obj of objects) {
      for (const [field, [lo, hi]] of Object.entries(BOUNDS)) {
        const v = getComparableValue(obj, field, objects)
        if (typeof v !== "number") continue
        if (!Number.isFinite(v) || v < lo || v > hi) problems.push(`${obj.id}.${field} = ${v}`)
      }
    }
    expect(problems).toEqual([])
  })
})
